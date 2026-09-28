import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { callWithFailover, type ModelMetrics } from "./src/lib/failoverLlm";

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

dotenv.config();

// In-memory telemetry log for agent gateway
const gatewayLogs: ModelMetrics[] = [];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3005;

  app.use(express.json());

  // Resilient Multi-Model Triage Endpoint (Gemini -> Groq -> Fallback)
  app.post("/api/triage", async (req, res) => {
    try {
      const { notes, vitals } = req.body;

      const systemPrompt = `You are a medical triage assistant.
Review patient vitals and clinical notes, and suggest a single triage urgency word: "Routine", "Urgent", or "Emergency".
Output ONLY the single word without markdown or explanations.`;

      const userMessage = `Clinical Notes: ${notes || "None provided"}
Vitals: ${JSON.stringify(vitals || {})}`;

      const result = await callWithFailover({
        systemPrompt,
        userMessage,
        maxTokens: 20,
        fallbackText: "Routine"
      });

      gatewayLogs.unshift(result.metrics);
      if (gatewayLogs.length > 50) gatewayLogs.pop();

      const cleaned = result.data.replace(/[^a-zA-Z]/g, '').trim() || 'Routine';
      res.json({
        triage: cleaned,
        metrics: result.metrics
      });
    } catch (error: any) {
      console.error('Triage Error:', error);
      res.status(500).json({ error: error.message || "Failed to analyze triage urgency" });
    }
  });

  // Agent Gateway Telemetry Endpoint
  app.get("/api/agent/gateway/metrics", (req, res) => {
    res.json({
      totalCalls: gatewayLogs.length,
      recent: gatewayLogs.slice(0, 10),
      providers: Array.from(new Set(gatewayLogs.map(l => l.provider)))
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  
  server.on('error', (e) => {
    console.error('Server Listen Error:', e);
  });
}

startServer().catch(err => {
  console.error("Fatal Error during server start:", err);
  process.exit(1);
});
