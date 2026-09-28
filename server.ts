import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { callWithFailover, type ModelMetrics } from "./src/lib/failoverLlm";
import { anonymizePhi, deAnonymizePhi, checkClinicalSafety } from "./src/lib/guardrails";
import { searchClinicalGuidelines, formatGuidelinesForPrompt, CLINICAL_GUIDELINES } from "./src/lib/clinicalRag";
import { verifyAndResolveCitations } from "./src/lib/citationResolver";
import { runSupervisor } from "./src/lib/agents/supervisor";
import { createInitialAgentState } from "./src/lib/agents/state";

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

  // PHI Guardrails: Check Clinical Safety Non-Negotiables
  app.post("/api/agent/guardrails/check-safety", (req, res) => {
    const { text } = req.body || {};
    const result = checkClinicalSafety(text || "");
    res.json(result);
  });

  // PHI Guardrails: Anonymize Patient Health Information
  app.post("/api/agent/guardrails/anonymize", (req, res) => {
    const { text } = req.body || {};
    const result = anonymizePhi(text || "");
    res.json(result);
  });

  // PHI Guardrails: De-anonymize Clean Response
  app.post("/api/agent/guardrails/de-anonymize", (req, res) => {
    const { text, tokenMap } = req.body || {};
    const restored = deAnonymizePhi(text || "", tokenMap || {});
    res.json({ text: restored });
  });

  // Clinical RAG: Search Curated Clinical Guidelines
  app.post("/api/agent/rag/search", async (req, res) => {
    try {
      const { query, topK, minScore } = req.body || {};
      const results = await searchClinicalGuidelines(query || "", topK || 3, minScore || 0.05);
      const promptContext = formatGuidelinesForPrompt(results);
      res.json({
        totalGuidelinesAvailable: CLINICAL_GUIDELINES.length,
        retrievedCount: results.length,
        guidelines: results,
        promptContext
      });
    } catch (error: any) {
      console.error("Clinical RAG Search Error:", error);
      res.status(500).json({ error: error.message || "RAG search failed" });
    }
  });

  // Citation Resolver: Verify LLM Claim Evidence Grounding
  app.post("/api/agent/citations/verify", (req, res) => {
    try {
      const { text, retrievedGuidelines, passThreshold } = req.body || {};
      const verification = verifyAndResolveCitations(
        text || "",
        retrievedGuidelines || [],
        passThreshold || 0.70
      );
      res.json(verification);
    } catch (error: any) {
      console.error("Citation Resolver Error:", error);
      res.status(500).json({ error: error.message || "Citation verification failed" });
    }
  });

  // Autonomous Multi-Agent Execution Endpoint (Supervisor -> Specialists -> Grounding)
  app.post("/api/agent/run", async (req, res) => {
    try {
      const { query, patientId, demographics, vitals, medications, sessionId, memoryContext } = req.body || {};

      if (!query) {
        return res.status(400).json({ error: "Missing required 'query' parameter" });
      }

      // 1. HIPAA Safety & PHI Guardrails Screen
      const safetyCheck = checkClinicalSafety(query);
      if (!safetyCheck.isSafe) {
        return res.status(400).json({
          error: "Safety Blocked",
          refusalMessage: safetyCheck.refusalMessage,
          isBlockedBySafety: true
        });
      }

      // 2. Anonymize PHI
      const anonResult = anonymizePhi(query);

      // 3. Initialize Agent State
      const state = createInitialAgentState(anonResult.anonymizedText, {
        patientId,
        patientDemographics: demographics || {},
        vitals: vitals || {},
        medications: medications || [],
        sessionId,
        memoryContext: memoryContext || []
      });

      // 4. Run Multi-Agent Supervisor
      const finalState = await runSupervisor(state);

      // 5. Restore PHI in local response
      finalState.agentResponse = deAnonymizePhi(finalState.agentResponse, anonResult.tokenMap);

      res.json(finalState);
    } catch (error: any) {
      console.error("Agent Execution Error:", error);
      res.status(500).json({ error: error.message || "Multi-agent execution failed" });
    }
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
