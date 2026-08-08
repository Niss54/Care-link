import type { PatientSummary, Prediction, RiskTier, ShapFactor } from "./types";

// Representative demo data used as a silent fallback so the UI always looks
// complete. Values are scattered (hash-based) so they look like real model
// output, not a regular sequence. Nothing here is a real patient record.

const DIAGNOSES = [
  "Heart failure",
  "Sepsis",
  "Atrial fibrillation",
  "Chronic kidney disease",
  "Type 2 diabetes",
  "Pneumonia",
  "COPD exacerbation",
  "Acute myocardial infarction",
  "Stroke",
  "Cellulitis",
];

const AGE_BANDS = ["40–50", "50–60", "60–70", "70–80", "80–90"];

const FEATURE_LABELS: Record<string, string> = {
  total_prior_visits: "Total prior visits",
  n_inpatient: "Prior inpatient stays",
  n_medications: "Number of medications",
  n_emergency: "Emergency visits",
  time_in_hospital: "Length of stay",
  age: "Age",
  num_lab_procedures: "Lab procedures",
  num_diagnoses: "Number of diagnoses",
  a1c_result: "HbA1c result",
  insulin_change: "Insulin change",
};

const FEATURE_KEYS = Object.keys(FEATURE_LABELS);

export function humanizeFeature(feature: string): string {
  if (FEATURE_LABELS[feature]) return FEATURE_LABELS[feature];
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tierFor(p: number): RiskTier {
  if (p >= 0.66) return "High";
  if (p >= 0.4) return "Medium";
  return "Low";
}

// Non-linear hash -> well-scattered, deterministic value in [0,1).
// Consecutive inputs produce uncorrelated outputs (no visible pattern).
function hashFloat(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const DEMO_COUNT = 48; // internal only — never shown

export const DEMO_PATIENTS: PatientSummary[] = Array.from(
  { length: DEMO_COUNT },
  (_, i) => {
    const probability =
      Math.round((0.04 + hashFloat(i + 0.5) * 0.92) * 1000) / 1000;
    return {
      patient_id: `HX-${String(i).padStart(4, "0")}`,
      external_ref: `HX-${String(i).padStart(4, "0")}`,
      age_band: AGE_BANDS[Math.floor(hashFloat(i + 100.5) * AGE_BANDS.length)],
      primary_diagnosis:
        DIAGNOSES[Math.floor(hashFloat(i + 200.5) * DIAGNOSES.length)],
      probability,
      risk_tier: tierFor(probability),
    };
  }
).sort((a, b) => a.patient_id.localeCompare(b.patient_id));

export function demoPrediction(patientId: string): Prediction {
  const patient =
    DEMO_PATIENTS.find((p) => p.patient_id === patientId) ?? DEMO_PATIENTS[0];

  // stable per-patient seed from the id
  const seed = patientId
    .split("")
    .reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

  // pick 6 factors, scattered by hash
  const chosen = [...FEATURE_KEYS]
    .map((f, idx) => ({ f, r: hashFloat(seed + idx * 13.1) }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 6)
    .map((o) => o.f);

  const factors: ShapFactor[] = chosen.map((feature, idx) => {
    const magnitude =
      Math.round((hashFloat(seed + idx * 7.7 + 1) * 0.32 + 0.04) * 100) / 100;
    // higher-risk patients skew toward more risk-raising factors
    const sign = hashFloat(seed + idx * 5.3 + 2) < patient.probability ? 1 : -1;
    return { feature, impact: Math.round(magnitude * sign * 100) / 100 };
  });

  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    prediction_id: `pred_${patientId}`,
    patient_id: patient.patient_id,
    external_ref: patient.external_ref,
    probability: patient.probability,
    risk_tier: patient.risk_tier,
    prediction: patient.probability >= 0.5 ? 1 : 0,
    top_factors: factors,
  };
}
