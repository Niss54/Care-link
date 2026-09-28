/**
 * CareLink Multi-Agent Supervisor & StateGraph Orchestrator (TypeScript)
 * Routes clinical queries to specialist agents with confidence-floor fallback,
 * enforces secondary medication safety screens, and resolves evidence citations.
 */

import {
  CareLinkAgentState,
  CLINICAL_INTENTS,
  ClinicalIntent,
  DEFAULT_INTENT,
  CONFIDENCE_FLOOR,
  addAgentExecutionStep
} from "./state";
import { runTriageAgent } from "./triageAgent";
import { runRiskAnalystAgent } from "./riskAnalystAgent";
import { runCarePlanAgent } from "./carePlanAgent";
import { runMedicationSafetyAgent, checkDeterministicDdi } from "./medicationSafetyAgent";
import { verifyAndResolveCitations } from "../citationResolver";
import { callWithFailover } from "../failoverLlm";

export async function classifyClinicalIntent(
  query: string
): Promise<{ intent: ClinicalIntent; confidence: number }> {
  const qLower = query.toLowerCase();

  // Fast deterministic heuristics
  if (
    ["interaction", "contraindicat", "warfarin", "nsaid", "ibuprofen", "metformin", "drug safety", "side effect", "pill", "taking with"].some((k) =>
      qLower.includes(k)
    )
  ) {
    return { intent: "medication_safety", confidence: 0.95 };
  }

  if (
    ["readmission", "risk factor", "shap", "xgboost", "predict", "cohort", "why is risk high", "probability"].some((k) =>
      qLower.includes(k)
    )
  ) {
    return { intent: "risk_analyst", confidence: 0.92 };
  }

  if (
    ["care plan", "discharge plan", "diet", "lifestyle", "follow up schedule", "instructions after discharge", "self-monitoring", "recovery plan"].some((k) =>
      qLower.includes(k)
    )
  ) {
    return { intent: "care_plan", confidence: 0.90 };
  }

  if (
    ["triage", "emergency", "urgent", "vital", "spo2", "fever", "chest pain", "shortness of breath", "blood pressure", "orthopnea"].some((k) =>
      qLower.includes(k)
    )
  ) {
    return { intent: "triage", confidence: 0.92 };
  }

  // LLM classification
  try {
    const res = await callWithFailover({
      systemPrompt:
        "You are CareLink's Clinical Intent Classifier.\n" +
        "Classify the query into EXACTLY one of: ['triage', 'risk_analyst', 'care_plan', 'medication_safety'].\n" +
        "Output ONLY a JSON string: {\"intent\": \"<intent>\", \"confidence\": <float 0.0 to 1.0>}.",
      userMessage: `Query: ${query}`,
      maxTokens: 50,
      fallbackText: '{"intent": "triage", "confidence": 0.50}'
    });

    const parsed = JSON.parse(res.data.replace(/```json|```/g, "").trim());
    const intent = (parsed.intent || DEFAULT_INTENT).toLowerCase() as ClinicalIntent;
    const confidence = Number(parsed.confidence) || 0.50;

    if (CLINICAL_INTENTS.includes(intent)) {
      return { intent, confidence };
    }
  } catch {
    // Fallback silently
  }

  return { intent: DEFAULT_INTENT, confidence: 0.50 };
}

export function routeAgent(intent: string, confidence: number): ClinicalIntent {
  if (CLINICAL_INTENTS.includes(intent as ClinicalIntent) && confidence >= CONFIDENCE_FLOOR) {
    return intent as ClinicalIntent;
  }
  return DEFAULT_INTENT;
}

export async function runSupervisor(state: CareLinkAgentState): Promise<CareLinkAgentState> {
  // ── STEP 1: Intent Classification ──
  const { intent, confidence } = await classifyClinicalIntent(state.userQuery);
  state.intent = intent;
  state.routingConfidence = confidence;

  const routedAgent = routeAgent(intent, confidence);
  state.routedAgent = routedAgent;

  addAgentExecutionStep(
    state,
    "Supervisor",
    "intent_classification",
    `Classified intent as '${intent}' (conf=${confidence}). Routed to '${routedAgent}'.`,
    { intent, confidence, routedAgent }
  );

  // ── STEP 2: Specialist Execution ──
  switch (routedAgent) {
    case "medication_safety":
      state = await runMedicationSafetyAgent(state);
      break;
    case "risk_analyst":
      state = await runRiskAnalystAgent(state);
      break;
    case "care_plan":
      state = await runCarePlanAgent(state);
      break;
    case "triage":
    default:
      state = await runTriageAgent(state);
      break;
  }

  // ── STEP 3: Secondary Medication Safety Screen ──
  if (
    routedAgent !== "medication_safety" &&
    (state.medications.length > 0 || state.userQuery.toLowerCase().includes("taking") || state.userQuery.toLowerCase().includes("dose"))
  ) {
    const { alerts, isCriticalBlocked } = checkDeterministicDdi(
      state.medications,
      state.userQuery,
      state.patientDemographics
    );

    if (alerts.length > 0) {
      state.medicationAlerts = alerts;
      state.isBlockedBySafety = isCriticalBlocked;

      addAgentExecutionStep(
        state,
        "Supervisor",
        "secondary_safety_screen",
        `Secondary pharmacovigilance screen found ${alerts.length} alert(s) (Critical: ${isCriticalBlocked}).`
      );

      if (isCriticalBlocked) {
        state.agentResponse =
          `⚠️ **CRITICAL PHARMACOVIGILANCE BLOCKER DETECTED**\n` +
          `${alerts[0].hazard} Recommendation: ${alerts[0].recommendation} ${alerts[0].citation}\n\n` +
          state.agentResponse;
      }
    }
  }

  // ── STEP 4: Citation Resolver & Grounding Verification ──
  const verification = verifyAndResolveCitations(
    state.agentResponse,
    state.retrievedGuidelines as any
  );

  state.agentResponse = verification.enrichedText;
  state.citations = verification.validCitations;
  state.evidenceBadges = verification.evidenceBadges;
  state.groundingFidelity = verification.groundingFidelity;
  state.isGrounded = verification.isGrounded;

  addAgentExecutionStep(
    state,
    "Supervisor",
    "grounding_verification",
    `Verified grounding fidelity=${verification.groundingFidelity} (${verification.validCitations.length} citations, ${verification.evidenceBadges.length} badges).`,
    {
      fidelity: verification.groundingFidelity,
      isGrounded: verification.isGrounded,
      validCitations: verification.validCitations,
      hallucinations: verification.hallucinatedCitations
    }
  );

  return state;
}
