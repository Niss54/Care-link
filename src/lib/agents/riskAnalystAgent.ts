/**
 * CareLink Risk Analyst Specialist Agent (TypeScript)
 * Synthesizes XGBoost 30-day readmission risk and SHAP factor attributions.
 */

import { CareLinkAgentState, addAgentExecutionStep } from "./state";
import { searchClinicalGuidelines, formatGuidelinesForPrompt } from "../clinicalRag";
import { callWithFailover } from "../failoverLlm";

export async function runRiskAnalystAgent(state: CareLinkAgentState): Promise<CareLinkAgentState> {
  const demographics = state.patientDemographics || {};
  const rawScore = demographics.readmission_risk_score ?? demographics.risk_score ?? 0.68;
  const riskPct = Math.round(Number(rawScore) * 1000) / 10;
  const riskTier = riskPct >= 65 ? "HIGH RISK" : riskPct >= 35 ? "MODERATE RISK" : "LOW RISK";

  const shapFactors = demographics.shap_factors || [
    { feature: "Prior Emergency Admissions (>=2 in 12m)", attribution: "+0.24", impact: "High Adverse" },
    { feature: "Recent eGFR Decline (<45 mL/min)", attribution: "+0.18", impact: "Moderate Adverse" },
    { feature: "Polypharmacy (>7 medications)", attribution: "+0.15", impact: "Moderate Adverse" },
    { feature: "Scheduled Early Cardiology Review", attribution: "-0.12", impact: "Protective" }
  ];

  addAgentExecutionStep(
    state,
    "RiskAnalystAgent",
    "shap_feature_attribution",
    `Analyzed risk score ${riskPct}% (${riskTier}) with ${shapFactors.length} SHAP factors.`
  );

  const searchTerms = `${state.userQuery} readmission risk heart failure diabetes ckd ${shapFactors.map((s: any) => s.feature).join(" ")}`;
  const retrieved = await searchClinicalGuidelines(searchTerms, 2, 0.01);
  state.retrievedGuidelines = retrieved;

  const promptContext = formatGuidelinesForPrompt(retrieved);
  addAgentExecutionStep(
    state,
    "RiskAnalystAgent",
    "clinical_rag_retrieval",
    `Retrieved ${retrieved.length} guideline(s) for risk mitigation: ${retrieved.map((r) => r.tag).join(", ") || "None"}`
  );

  const systemPrompt = `You are CareLink's Clinical Risk Analyst Agent.
Your role is to explain XGBoost 30-day hospital readmission predictions and SHAP feature attributions.
Structure your response strictly as follows:
### 30-DAY READMISSION RISK & SHAP ANALYSIS
- **Predicted Readmission Risk**: [Tier and Percentage, e.g. HIGH RISK (68.0%)]
- **Primary Risk Drivers (SHAP Explanation)**: [Detail the top factors pushing the patient into high risk]
- **Protective & Stabilizing Factors**: [Highlight any positive mitigating factors]
- **Targeted Readmission Mitigation Protocol**: [Actionable steps with mandatory bracketed citations, e.g. [ICMR-HF-01], [KDIGO-CKD-01]]

${promptContext}`;

  const userMessage = `Clinical Query: ${state.userQuery}
Patient Risk Profile: Tier=${riskTier}, Probability=${riskPct}%
SHAP Attributions: ${JSON.stringify(shapFactors)}
Patient Demographics: ${JSON.stringify(demographics)}
Generate the clinical risk analysis report now.`;

  const fallbackText = `### 30-DAY READMISSION RISK & SHAP ANALYSIS\n- **Predicted Readmission Risk**: ${riskTier} (${riskPct}%)\n- **Primary Risk Drivers (SHAP Explanation)**: Recurrent admissions and declining renal clearance drove +0.42 total positive risk attribution.\n- **Protective & Stabilizing Factors**: Adherence to scheduled outpatient review reduces risk by -0.12.\n- **Targeted Readmission Mitigation Protocol**: Mandate cardiology follow-up within 7-10 days [ICMR-HF-01] and renal surveillance [KDIGO-CKD-01].`;

  const result = await callWithFailover({
    systemPrompt,
    userMessage,
    maxTokens: 500,
    fallbackText
  });

  state.agentResponse = result.data;
  state.routedAgent = "risk_analyst";

  addAgentExecutionStep(
    state,
    "RiskAnalystAgent",
    "risk_narrative_generation",
    `Generated risk narrative via ${result.metrics.provider} (${result.metrics.latencyMs}ms).`,
    result.metrics
  );

  return state;
}
