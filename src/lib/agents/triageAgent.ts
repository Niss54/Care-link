/**
 * CareLink Clinical Triage Agent (TypeScript)
 * Manchester Triage System (MTS) rules + Clinical RAG + Dual-Model Failover LLM
 */

import { CareLinkAgentState, addAgentExecutionStep } from "./state";
import { searchClinicalGuidelines, formatGuidelinesForPrompt } from "../clinicalRag";
import { callWithFailover } from "../failoverLlm";

export function evaluateVitalsSeverity(vitals: Record<string, any>, query = ""): { level: string; triggers: string[] } {
  const triggers: string[] = [];
  let level = "Routine";
  const qLower = query.toLowerCase();

  const spo2 = vitals.spo2 ?? vitals.oxygen_saturation;
  if (spo2 !== undefined && spo2 !== null) {
    const val = Number(spo2);
    if (!isNaN(val)) {
      if (val < 88) {
        triggers.push(`Critical Hypoxemia (SpO2: ${val}% < 88%)`);
        level = "Emergency";
      } else if (val < 92) {
        triggers.push(`Mild-to-moderate Hypoxemia (SpO2: ${val}%)`);
        if (level !== "Emergency") level = "Urgent";
      }
    }
  }

  const sbp = vitals.systolic ?? vitals.sbp;
  if (sbp !== undefined && sbp !== null) {
    const valS = Number(sbp);
    if (!isNaN(valS)) {
      if (valS >= 180) {
        triggers.push(`Hypertensive Crisis (Systolic: ${valS} mmHg >= 180)`);
        level = "Emergency";
      } else if (valS <= 90) {
        triggers.push(`Severe Hypotension / Shock (Systolic: ${valS} mmHg <= 90)`);
        level = "Emergency";
      }
    }
  }

  const temp = vitals.temperature ?? vitals.temp;
  if (temp !== undefined && temp !== null) {
    const valT = Number(temp);
    if (!isNaN(valT)) {
      const isSevere = valT > 45.0 ? valT > 102.2 : valT > 39.0;
      const isFebrile = valT > 45.0 ? valT > 100.4 : valT > 38.0;
      if (isSevere) {
        triggers.push(`Severe Pyrexia (${valT}°)`);
        if (level !== "Emergency") level = "Urgent";
      } else if (isFebrile) {
        triggers.push(`Febrile State (${valT}°)`);
        if (level === "Routine") level = "Urgent";
      }
    }
  }

  const weightGain = vitals.weight_gain_kg ?? vitals.weight_change;
  if (weightGain !== undefined && weightGain !== null) {
    const valW = Number(weightGain);
    if (!isNaN(valW) && valW >= 2.0) {
      triggers.push(`Acute Fluid Overload (+${valW} kg in <= 48 hrs)`);
      if (level !== "Emergency") level = "Urgent";
    }
  }

  if (qLower.includes("chest pain") || qLower.includes("unconscious") || qLower.includes("cyanosis") || qLower.includes("septic shock")) {
    triggers.push("High-acuity symptom keywords detected");
    level = "Emergency";
  } else if (qLower.includes("orthopnea") || qLower.includes("swelling") || qLower.includes("pus") || qLower.includes("shortness of breath")) {
    triggers.push("Decompensation / infection warning symptoms detected");
    if (level === "Routine") level = "Urgent";
  }

  return { level, triggers };
}

export async function runTriageAgent(state: CareLinkAgentState): Promise<CareLinkAgentState> {
  const { level, triggers } = evaluateVitalsSeverity(state.vitals, state.userQuery);

  addAgentExecutionStep(
    state,
    "TriageAgent",
    "vitals_evaluation",
    `Classified severity as '${level}' with ${triggers.length} trigger(s): ${triggers.join(", ") || "None"}`
  );

  const searchTerms = `${state.userQuery} ${triggers.join(" ")}`;
  const retrieved = await searchClinicalGuidelines(searchTerms, 2, 0.01);
  state.retrievedGuidelines = retrieved;

  const promptContext = formatGuidelinesForPrompt(retrieved);
  addAgentExecutionStep(
    state,
    "TriageAgent",
    "clinical_rag_retrieval",
    `Retrieved ${retrieved.length} guideline(s): ${retrieved.map((r) => r.tag).join(", ") || "None"}`
  );

  const systemPrompt = `You are CareLink's Clinical Triage Specialist Agent.
Evaluate patient status using the Manchester Triage System (MTS).
Your output must follow this format:
### CLINICAL TRIAGE ASSESSMENT
- **Triage Urgency Level**: [Routine | Urgent | Emergency]
- **Physiological Triggers**: [Summarize key triggers]
- **Immediate Clinical Action**: [Step-by-step instructions grounded in clinical guidelines]
- **Escalation Window**: [e.g. Immediate ER transfer, 24-hr clinic review, or routine 7-day review]

MANDATORY REQUIREMENT: Whenever referencing clinical recommendations, embed the appropriate bracketed citation (e.g. [ICMR-HF-01], [WHO-SEPSIS-01], [AHA-HTN-01]).

${promptContext}`;

  const userMessage = `Patient Query/Notes: ${state.userQuery}
Vitals: ${JSON.stringify(state.vitals)}
Automated MTS Assessment: ${level} (Triggers: ${triggers.join(", ")})
Generate the clinical triage assessment now.`;

  const result = await callWithFailover({
    systemPrompt,
    userMessage,
    maxTokens: 500,
    fallbackText: `### CLINICAL TRIAGE ASSESSMENT\n- **Triage Urgency Level**: ${level}\n- **Physiological Triggers**: ${triggers.join(", ") || "None reported"}\n- **Immediate Clinical Action**: Assess fluid balance and schedule priority cardiology clinic review within 7 days [ICMR-HF-01].\n- **Escalation Window**: ${level === "Emergency" ? "Immediate ER" : "24 to 48 hours"}`
  });

  state.agentResponse = result.data;
  state.routedAgent = "triage";

  addAgentExecutionStep(
    state,
    "TriageAgent",
    "triage_generation",
    `Generated clinical triage recommendation via ${result.metrics.provider} (${result.metrics.latencyMs}ms).`,
    result.metrics
  );

  return state;
}
