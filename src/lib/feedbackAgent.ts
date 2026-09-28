/**
 * CareLink Active Learning Feedback Agent (TypeScript)
 * Tracks clinician overrides, moving override rate, and drift alerts (>15%).
 */

export interface ClinicianFeedbackRecord {
  id: string;
  interactionId: string;
  patientId: string;
  agentType: string;
  suggestedAction: string;
  clinicianAction: string;
  isOverride: boolean;
  overrideReason: string;
  clinicianId: string;
  timestamp: string;
}

export interface FeedbackMetrics {
  totalReviews: number;
  totalOverrides: number;
  totalApprovals: number;
  overrideRate: number;
  isDriftDetected: boolean;
  status: "STABLE" | "DRIFT_DETECTED";
  driftThreshold: number;
  recentOverrides: ClinicianFeedbackRecord[];
}

export const OVERRIDE_DRIFT_THRESHOLD = 0.15; // 15% safety tolerance

const FEEDBACK_HISTORY: ClinicianFeedbackRecord[] = [];

export function recordClinicianFeedback(
  interactionId: string,
  patientId: string,
  agentType: string,
  suggestedAction: string,
  clinicianAction: string,
  overrideReason = "",
  clinicianId = "clinician_01"
): ClinicianFeedbackRecord {
  const sClean = suggestedAction.trim().toLowerCase();
  const cClean = clinicianAction.trim().toLowerCase();
  const isOverride = sClean !== cClean && !cClean.includes("approve") && !cClean.includes("accept");

  const record: ClinicianFeedbackRecord = {
    id: `fb_${Date.now()}_${FEEDBACK_HISTORY.length + 1}`,
    interactionId: interactionId || `int_${FEEDBACK_HISTORY.length + 1}`,
    patientId,
    agentType,
    suggestedAction,
    clinicianAction,
    isOverride,
    overrideReason,
    clinicianId,
    timestamp: new Date().toISOString()
  };

  FEEDBACK_HISTORY.push(record);
  return record;
}

export function getFeedbackMetrics(windowSize = 50): FeedbackMetrics {
  const recent = FEEDBACK_HISTORY.slice(-windowSize);
  const total = recent.length;

  if (total === 0) {
    return {
      totalReviews: 0,
      totalOverrides: 0,
      totalApprovals: 0,
      overrideRate: 0.0,
      isDriftDetected: false,
      status: "STABLE",
      driftThreshold: OVERRIDE_DRIFT_THRESHOLD,
      recentOverrides: []
    };
  }

  const overrides = recent.filter((r) => r.isOverride).length;
  const approvals = total - overrides;
  const rate = Math.round((overrides / total) * 1000) / 1000;
  const isDriftDetected = rate > OVERRIDE_DRIFT_THRESHOLD;

  const recentOverrides = recent
    .filter((r) => r.isOverride)
    .reverse()
    .slice(0, 5);

  return {
    totalReviews: total,
    totalOverrides: overrides,
    totalApprovals: approvals,
    overrideRate: rate,
    isDriftDetected,
    status: isDriftDetected ? "DRIFT_DETECTED" : "STABLE",
    driftThreshold: OVERRIDE_DRIFT_THRESHOLD,
    recentOverrides
  };
}

export function generateRetrainingPayload(): {
  generatedAt: string;
  totalSamples: number;
  targetModels: string[];
  trainingSamples: Array<Record<string, any>>;
} {
  const overrides = FEEDBACK_HISTORY.filter((r) => r.isOverride);
  return {
    generatedAt: new Date().toISOString(),
    totalSamples: overrides.length,
    targetModels: ["xgboost_readmission", "triage_router"],
    trainingSamples: overrides.map((o) => ({
      patientId: o.patientId,
      agentType: o.agentType,
      aiSuggested: o.suggestedAction,
      clinicianCorrected: o.clinicianAction,
      rationale: o.overrideReason,
      timestamp: o.timestamp
    }))
  };
}
