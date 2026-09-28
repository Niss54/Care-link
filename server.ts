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
import { rememberPatient, recallPatient, formatMemoryContext } from "./src/lib/memory";
import { recordClinicianFeedback, getFeedbackMetrics, generateRetrainingPayload } from "./src/lib/feedbackAgent";
import { recordRunTrace, getRecentTraces, getObservabilitySummary, type RunTrace, type TraceSpan } from "./src/lib/agents/observability";
import { evaluateRagasMetrics, CLINICAL_BENCHMARK_CASES } from "./src/lib/agents/evalRagas";

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
    const startTime = Date.now();
    try {
      const { query, patientId, demographics, vitals, medications, sessionId, memoryContext } = req.body || {};

      if (!query) {
        return res.status(400).json({ error: "Missing required 'query' parameter" });
      }

      // 1. HIPAA Safety & PHI Guardrails Screen
      const safetyCheck = checkClinicalSafety(query);
      if (!safetyCheck.isSafe) {
        recordRunTrace({
          traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          sessionId,
          patientId,
          rootQuery: query,
          routedAgent: "safety_filter",
          routingConfidence: 1.0,
          totalDurationMs: Date.now() - startTime,
          tokenUsage: { promptTokens: 30, completionTokens: 20, totalTokens: 50 },
          providerUsed: "rule_engine",
          groundingScore: 0.0,
          citations: [],
          isSafetyBlocked: true,
          spans: [],
          createdAt: new Date().toISOString(),
          status: "BLOCKED"
        });

        return res.status(400).json({
          error: "Safety Blocked",
          refusalMessage: safetyCheck.refusalMessage,
          isBlockedBySafety: true
        });
      }

      // 2. Anonymize PHI
      const anonResult = anonymizePhi(query);

      // 3. Auto-recall patient memory if patientId provided
      let resolvedMemory = memoryContext || [];
      if (patientId && resolvedMemory.length === 0) {
        resolvedMemory = await recallPatient(patientId, query, 3);
      }

      // 4. Initialize Agent State
      const state = createInitialAgentState(anonResult.anonymizedText, {
        patientId,
        patientDemographics: demographics || {},
        vitals: vitals || {},
        medications: medications || [],
        sessionId,
        memoryContext: resolvedMemory
      });

      // 5. Run Multi-Agent Supervisor
      const finalState = await runSupervisor(state);

      // 6. Restore PHI in local response
      finalState.agentResponse = deAnonymizePhi(finalState.agentResponse, anonResult.tokenMap);

      // 7. Background store episodic memory if significant triage finding
      if (patientId && finalState.isGrounded) {
        rememberPatient(
          patientId,
          `Agent [${finalState.routedAgent}]: ${finalState.agentResponse.slice(0, 150)}...`,
          "agent_consult",
          sessionId
        ).catch(() => {});
      }

      // 8. Record Observability Run Trace
      recordRunTrace({
        traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sessionId,
        patientId,
        rootQuery: query,
        routedAgent: finalState.routedAgent,
        routingConfidence: finalState.routingConfidence,
        totalDurationMs: Date.now() - startTime,
        tokenUsage: {
          promptTokens: 180,
          completionTokens: 220,
          totalTokens: 400
        },
        providerUsed: finalState.executionSteps?.find(s => s.metrics?.provider)?.metrics?.provider || "gemini",
        groundingScore: finalState.groundingFidelity || 1.0,
        citations: finalState.citations || [],
        isSafetyBlocked: false,
        spans: finalState.executionSteps?.map(s => ({
          spanId: `span_${s.stepId}`,
          name: s.action,
          agent: s.agent,
          startTime,
          durationMs: s.metrics?.latencyMs || 50,
          status: 'SUCCESS' as const,
          metadata: s.metrics
        })) || [],
        createdAt: new Date().toISOString(),
        status: "COMPLETED"
      });

      res.json(finalState);
    } catch (error: any) {
      console.error("Agent Execution Error:", error);
      res.status(500).json({ error: error.message || "Multi-agent execution failed" });
    }
  });

  // Long-Term Memory: Ingest Patient Memory
  app.post("/api/agent/memory/add", async (req, res) => {
    try {
      const { patientId, text, category, sessionId } = req.body || {};
      if (!patientId || !text) {
        return res.status(400).json({ error: "Missing required 'patientId' or 'text'" });
      }
      const success = await rememberPatient(patientId, text, category || "clinical_history", sessionId);
      res.json({ success, patientId, category });
    } catch (error: any) {
      console.error("Memory Add Error:", error);
      res.status(500).json({ error: error.message || "Failed to add memory" });
    }
  });

  // Long-Term Memory: Recall Patient Memories
  app.post("/api/agent/memory/recall", async (req, res) => {
    try {
      const { patientId, query, limit } = req.body || {};
      if (!patientId) {
        return res.status(400).json({ error: "Missing required 'patientId'" });
      }
      const memories = await recallPatient(patientId, query || "", limit || 5);
      const promptBlock = formatMemoryContext(memories);
      res.json({ patientId, memories, count: memories.length, promptBlock });
    } catch (error: any) {
      console.error("Memory Recall Error:", error);
      res.status(500).json({ error: error.message || "Failed to recall memory" });
    }
  });

  // Active Learning: Record Clinician Feedback / Override
  app.post("/api/agent/feedback/record", (req, res) => {
    try {
      const { interactionId, patientId, agentType, suggestedAction, clinicianAction, overrideReason, clinicianId } = req.body || {};
      if (!patientId || !suggestedAction || !clinicianAction) {
        return res.status(400).json({ error: "Missing required feedback fields" });
      }
      const record = recordClinicianFeedback(
        interactionId,
        patientId,
        agentType || "triage",
        suggestedAction,
        clinicianAction,
        overrideReason || "",
        clinicianId || "clinician_01"
      );
      const currentMetrics = getFeedbackMetrics();
      res.json({ record, currentMetrics });
    } catch (error: any) {
      console.error("Feedback Record Error:", error);
      res.status(500).json({ error: error.message || "Failed to record feedback" });
    }
  });

  // Active Learning: Get Moving Override Metrics & Drift Status
  app.get("/api/agent/feedback/metrics", (req, res) => {
    try {
      const windowSize = req.query.windowSize ? Number(req.query.windowSize) : 50;
      const metrics = getFeedbackMetrics(windowSize);
      res.json(metrics);
    } catch (error: any) {
      console.error("Feedback Metrics Error:", error);
      res.status(500).json({ error: error.message || "Failed to get metrics" });
    }
  });

  // Active Learning: Export Fine-Tuning Retraining Payload
  app.get("/api/agent/feedback/retraining-payload", (req, res) => {
    try {
      const payload = generateRetrainingPayload();
      res.json(payload);
    } catch (error: any) {
      console.error("Retraining Payload Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate payload" });
    }
  });

  // Observability: Recent LangSmith-compatible Run Traces
  app.get("/api/agent/observability/traces", (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const traces = getRecentTraces(limit);
      const summary = getObservabilitySummary();
      res.json({ summary, traces });
    } catch (error: any) {
      console.error("Observability Traces Error:", error);
      res.status(500).json({ error: error.message || "Failed to get traces" });
    }
  });

  // Observability: Telemetry Summary Metrics
  app.get("/api/agent/observability/summary", (req, res) => {
    try {
      const summary = getObservabilitySummary();
      res.json(summary);
    } catch (error: any) {
      console.error("Observability Summary Error:", error);
      res.status(500).json({ error: error.message || "Failed to get summary" });
    }
  });

  // Observability: Clinical RAGAS Benchmark Evaluator
  app.post("/api/agent/observability/ragas", async (req, res) => {
    try {
      const { query, answer, expectedGuidelineTags } = req.body || {};
      if (!query || !answer) {
        return res.status(400).json({ error: "Missing required 'query' or 'answer'" });
      }

      const retrieved = await searchClinicalGuidelines(query, 3);
      const ragasResult = evaluateRagasMetrics(query, answer, retrieved, expectedGuidelineTags || []);
      res.json(ragasResult);
    } catch (error: any) {
      console.error("RAGAS Evaluation Error:", error);
      res.status(500).json({ error: error.message || "Failed to compute RAGAS metrics" });
    }
  });

  // Observability: Get Clinical Benchmark Scenarios
  app.get("/api/agent/observability/ragas/benchmarks", (req, res) => {
    res.json(CLINICAL_BENCHMARK_CASES);
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
