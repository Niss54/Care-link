/**
 * CareLink Care Plan Specialist Agent (TypeScript)
 * Synthesizes the 4-part post-discharge recovery plan grounded in clinical guidelines.
 */

import { CareLinkAgentState, addAgentExecutionStep } from "./state";
import { searchClinicalGuidelines, formatGuidelinesForPrompt } from "../clinicalRag";
import { callWithFailover } from "../failoverLlm";

export async function runCarePlanAgent(state: CareLinkAgentState): Promise<CareLinkAgentState> {
  const searchTerms = `${state.userQuery} discharge care plan follow up ${state.medications.join(" ")}`;
  const retrieved = await searchClinicalGuidelines(searchTerms, 2, 0.01);
  state.retrievedGuidelines = retrieved;

  const promptContext = formatGuidelinesForPrompt(retrieved);
  addAgentExecutionStep(
    state,
    "CarePlanAgent",
    "clinical_rag_retrieval",
    `Retrieved ${retrieved.length} guideline(s) for care plan: ${retrieved.map((r) => r.tag).join(", ") || "None"}`
  );

  const systemPrompt = `You are CareLink's Post-Discharge Care Plan Specialist Agent.
Generate an authoritative, patient-tailored 4-part discharge plan formatted strictly as:

### POST-DISCHARGE CLINICAL CARE PLAN
#### 1. Medication Regimen & Titration Protocol
- List prescribed medications, instructions, and adjustments (cite guidelines, e.g. [ICMR-DM-01]).

#### 2. Follow-Up & Clinical Review Schedule
- Specify mandatory follow-up appointments and lab re-evaluations (e.g. 7-10 day review [ICMR-HF-01]).

#### 3. Dietary, Fluid & Self-Monitoring Mandates
- Detail daily monitoring protocols (e.g. daily morning weight tracking, sodium/fluid restrictions).

#### 4. Emergency Red Flag Warning Signs
- Define unambiguous red flag triggers that require immediate emergency department escalation.

MANDATORY REQUIREMENT: Every section must contain valid bracketed guideline citations (e.g. [ICMR-HF-01], [NICE-SURG-01]).

${promptContext}`;

  const userMessage = `Patient Discharge Request: ${state.userQuery}
Active Medications: ${state.medications.join(", ") || "None specified"}
Vitals at Discharge: ${JSON.stringify(state.vitals)}
Demographics: ${JSON.stringify(state.patientDemographics)}
Generate the comprehensive 4-part post-discharge care plan now.`;

  const fallbackText = `### POST-DISCHARGE CLINICAL CARE PLAN\n#### 1. Medication Regimen & Titration Protocol\n- Continue GDMT heart failure medications as prescribed; withhold metformin if dehydration or eGFR drops [ICMR-DM-01].\n\n#### 2. Follow-Up & Clinical Review Schedule\n- Attend in-person cardiology review within 7-10 days [ICMR-HF-01].\n\n#### 3. Dietary, Fluid & Self-Monitoring Mandates\n- Weigh daily upon waking. Restrict sodium to <2.0g daily and fluids to <1.5L daily.\n\n#### 4. Emergency Red Flag Warning Signs\n- Immediate emergency escalation required if weight increases >2.0 kg in 48 hours or severe dyspnea occurs [ICMR-HF-01].`;

  const result = await callWithFailover({
    systemPrompt,
    userMessage,
    maxTokens: 600,
    fallbackText
  });

  state.agentResponse = result.data;
  state.routedAgent = "care_plan";

  addAgentExecutionStep(
    state,
    "CarePlanAgent",
    "care_plan_synthesis",
    `Synthesized care plan via ${result.metrics.provider} (${result.metrics.latencyMs}ms).`,
    result.metrics
  );

  return state;
}
