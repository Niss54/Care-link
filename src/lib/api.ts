import type {
  FeedbackPayload,
  PatientSummary,
  Prediction,
} from "./types";
import { DEMO_PATIENTS, demoPrediction } from "./demo-data";
import { getSessionMode } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const TIMEOUT_MS = 6000;

function useLiveData(): boolean {
  return Boolean(BASE) && getSessionMode() === "live";
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function ageBand(age: number | null | undefined): string {
  if (age == null || isNaN(Number(age))) return "Unknown";
  const lo = Math.floor(Number(age) / 10) * 10;
  return `${lo}-${lo + 9}`;
}

// Turn a raw backend row into the exact shape the UI expects, so no field
// is ever undefined (which used to crash the search box and gauges).
function normalizePatient(p: any): PatientSummary {
  return {
    patient_id: String(p.patient_id),
    external_ref: p.external_ref ?? `HX-${p.patient_id}`,
    age_band: p.age_band ?? ageBand(p.age),
    primary_diagnosis: p.primary_diagnosis ?? p.admission_type ?? "—",
    probability: Number(p.probability) || 0,
    risk_tier: p.risk_tier,
  };
}

export async function getPatients(): Promise<PatientSummary[]> {
  if (!useLiveData()) return DEMO_PATIENTS;
  try {
    const res = await fetchWithTimeout(`${BASE}/patients`);
    if (!res.ok) throw new Error(`patients ${res.status}`);
    const raw = (await res.json()) as any[];
    const data = Array.isArray(raw)
      ? raw
          .filter((p) => p.probability != null && p.risk_tier != null)
          .map(normalizePatient)
      : [];
    if (data.length === 0) return DEMO_PATIENTS;
    return data;
  } catch {
    return DEMO_PATIENTS;
  }
}

export async function getPrediction(patientId: string): Promise<Prediction> {
  if (!useLiveData()) return demoPrediction(patientId);
  try {
    const res = await fetchWithTimeout(`${BASE}/predict/${patientId}`);
    if (!res.ok) throw new Error(`predict ${res.status}`);
    const data = (await res.json()) as Prediction;
    if (!data || !Array.isArray(data.top_factors)) {
      return demoPrediction(patientId);
    }
    return data;
  } catch {
    return demoPrediction(patientId);
  }
}

export async function sendFeedback(payload: FeedbackPayload): Promise<boolean> {
  if (!useLiveData()) return true;
  try {
    const res = await fetchWithTimeout(`${BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
