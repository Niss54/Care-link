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

  const hindiInstruction = state.isHindi
    ? `\n\nIMPORTANT BHARAT LOCALIZATION: The user/ASHA health worker requested Hindi output.
Generate the entire response in simple, respectful Hindi (Devanagari script), easily understood by rural ASHA workers and Indian families (e.g. आपातकालीन स्थिति, तत्काल अस्पताल भर्ती, ऑक्सीजन का स्तर, दवाइयों का सेवन).
Retain guideline tags in brackets like [ICMR-HF-01] intact.`
    : "";

  const systemPrompt = `You are CareLink's Clinical Triage Specialist Agent.
Evaluate patient status using the Manchester Triage System (MTS).
Your output must follow this format:
### CLINICAL TRIAGE ASSESSMENT
- **Triage Urgency Level**: [Routine | Urgent | Emergency]
- **Physiological Triggers**: [Summarize key triggers]
- **Immediate Clinical Action**: [Step-by-step instructions grounded in clinical guidelines]
- **Escalation Window**: [e.g. Immediate ER transfer, 24-hr clinic review, or routine 7-day review]

MANDATORY REQUIREMENT: Whenever referencing clinical recommendations, embed the appropriate bracketed citation (e.g. [ICMR-HF-01], [WHO-SEPSIS-01], [AHA-HTN-01]).

${promptContext}${hindiInstruction}`;

  const userMessage = `Patient Query/Notes: ${state.userQuery}
Vitals: ${JSON.stringify(state.vitals)}
Automated MTS Assessment: ${level} (Triggers: ${triggers.join(", ")})
Generate the clinical triage assessment now.`;

  const topTag = retrieved.length > 0 ? retrieved[0].tag : "[ICMR-HF-01]";

  const fallbackText = state.isHindi
    ? `### आपातकालीन ट्राइएज मूल्यांकन\n- **प्राथमिकता स्तर**: ${level === "Emergency" ? "आपातकालीन (Emergency)" : level === "Urgent" ? "अति-आवश्यक (Urgent)" : "सामान्य (Routine)"}\n- **शारीरिक लक्षण**: ${triggers.join(", ") || "कोई गंभीर लक्षण नहीं"}\n- **तत्काल चिकित्सकीय कार्रवाई**: मरीज़ की तुरंत क्लिनिकल जाँच करें और ऑक्सीजन स्तर मापें ${topTag}।\n- **अस्पताल हस्तांतरण**: ${level === "Emergency" ? "तत्काल आपातकालीन विभाग (ER) ले जाएं" : "24 से 48 घंटे के भीतर डॉक्टर को दिखाएं"}`
    : `### CLINICAL TRIAGE ASSESSMENT\n- **Triage Urgency Level**: ${level}\n- **Physiological Triggers**: ${triggers.join(", ") || "None reported"}\n- **Immediate Clinical Action**: Conduct targeted clinical review and monitor patient status ${topTag}.\n- **Escalation Window**: ${level === "Emergency" ? "Immediate ER transfer" : "24 to 48 hours"}`;

  const result = await callWithFailover({
    systemPrompt,
    userMessage,
    maxTokens: 500,
    fallbackText
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
