export type RiskTier = "Low" | "Medium" | "High";

export interface PatientSummary {
  patient_id: string;
  external_ref: string;
  age_band: string;
  primary_diagnosis: string;
  probability: number;
  risk_tier: RiskTier;
}

export interface ShapFactor {
  feature: string;
  impact: number;
}

export interface Prediction {
  prediction_id: string;
  patient_id: string;
  external_ref: string;
  probability: number;
  risk_tier: RiskTier;
  prediction: 0 | 1;
  top_factors: ShapFactor[];
}

export interface FeedbackPayload {
  prediction_id: string;
  action: "confirmed" | "overridden";
  note: string;
}

export interface TriageResult {
  urgencyLevel: "IMMEDIATE" | "URGENT" | "SEMI-URGENT" | "NON-URGENT";
  clinicalSummary: string;
  primaryConcerns: string[];
  recommendedActions: string[];
  estimatedWaitTime: string;
  redFlags: string[];
  confidence: number;
}
