// Types mirror the FastAPI backend contract exactly.

export type RiskTier = "Low" | "Medium" | "High";

export interface PatientSummary {
  patient_id: string;
  external_ref: string;
  age_band: string;
  primary_diagnosis: string;
  probability: number; // 0–1
  risk_tier: RiskTier;
}

export interface ShapFactor {
  feature: string;
  impact: number; // > 0 raises risk, < 0 lowers risk
}

export interface Prediction {
  prediction_id: string;
  patient_id: string;
  external_ref: string;
  probability: number; // 0–1
  risk_tier: RiskTier;
  prediction: 0 | 1;
  top_factors: ShapFactor[];
}

export interface FeedbackPayload {
  prediction_id: string;
  action: "confirmed" | "overridden";
  note: string;
}
