import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// ==========================================
// INTERFACES
// ==========================================

export interface TopFactor {
  feature: string;
  impact: number;
}

export interface RiskResult {
  predictionId: string;
  probability: number;
  riskTier: 'Low' | 'Medium' | 'High';
  prediction: 0 | 1;
  topFactors: TopFactor[];
}

export interface FeedbackPayload {
  predictionId: string;
  action: 'confirmed' | 'overridden';
  correctedLabel?: number;
  note?: string;
  clinicianRef?: string;
}

// ==========================================
// CONFIG & HELPERS
// ==========================================

const ML_API_URL = import.meta.env.VITE_ML_API_URL?.replace(/\/$/, '');
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Wait for a specific amount of time.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with automatic retry logic for network transients.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await delay(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

/**
 * Mock data generator when ML API is unreachable or not configured.
 */
function getMockRisk(patientId: string): RiskResult {
  // Deterministic mock based on patientId string length & characters
  const hash = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const prob = (hash % 100) / 100;
  
  let tier: 'Low' | 'Medium' | 'High' = 'Low';
  if (prob >= 0.7) tier = 'High';
  else if (prob >= 0.4) tier = 'Medium';

  return {
    predictionId: `mock-pred-${hash}`,
    probability: prob,
    riskTier: tier,
    prediction: prob >= 0.5 ? 1 : 0,
    topFactors: [
      { feature: 'Length of Stay', impact: 0.15 },
      { feature: 'Prior Admissions', impact: 0.12 },
      { feature: 'Age', impact: 0.08 }
    ]
  };
}

// ==========================================
// CORE SERVICES
// ==========================================

/**
 * Fetches the federated ML readmission risk score for a specific patient.
 * Falls back to mock data gracefully if the backend is down.
 * 
 * @param patientId The unique identifier of the patient
 * @returns RiskResult containing probability and SHAP factors, or null on terminal failure.
 */
export async function fetchPatientRisk(patientId: string): Promise<RiskResult | null> {
  if (!ML_API_URL) {
    console.warn('VITE_ML_API_URL is not set. Returning mock risk data.');
    return getMockRisk(patientId);
  }

  try {
    const response = await fetchWithRetry(`${ML_API_URL}/predict/${patientId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    return {
      predictionId: data.prediction_id,
      probability: data.probability,
      riskTier: data.risk_tier,
      prediction: data.prediction,
      topFactors: data.top_factors || []
    };
  } catch (error) {
    console.error(`Failed to fetch risk for patient ${patientId}:`, error);
    console.warn('Falling back to mock risk data due to network error.');
    return getMockRisk(patientId);
  }
}

/**
 * Submits clinician feedback (confirm/override) back to the ML service for active learning.
 * 
 * @param feedback The feedback payload 
 */
export async function submitClinicalFeedback(feedback: FeedbackPayload): Promise<boolean> {
  if (!ML_API_URL) {
    console.warn('VITE_ML_API_URL is not set. Mocking feedback submission success.');
    return true; // Mock success
  }

  try {
    await fetchWithRetry(`${ML_API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    return true;
  } catch (error) {
    console.error('Failed to submit clinical feedback:', error);
    return false;
  }
}

/**
 * Synchronizes the ML risk score back to the Supabase database.
 * This ensures the main UI/Dashboard can sort and filter by risk natively.
 * 
 * @param patientId Patient UUID in Supabase
 * @param riskResult The calculated RiskResult from the ML service
 */
export async function syncRiskScoreToSupabase(patientId: string, riskResult: RiskResult): Promise<void> {
  try {
    const scoreInt = Math.round(riskResult.probability * 100);
    
    const { error } = await supabase
      .from('patients')
      .update({
        risk_score: scoreInt,
        risk_tier: riskResult.riskTier
      })
      .eq('id', patientId);

    if (error) {
      console.error(`Supabase sync failed for patient ${patientId}:`, error.message);
    }
  } catch (err) {
    console.error('Exception during Supabase sync:', err);
  }
}

/**
 * Batch fetches risk scores for an array of patients in parallel.
 * Never blocks the entire UI if one patient fails.
 * 
 * @param patientIds Array of patient identifiers
 * @returns A Map linking patientId -> RiskResult for O(1) lookups
 */
export async function loadAllRiskScores(patientIds: string[]): Promise<Map<string, RiskResult>> {
  const resultMap = new Map<string, RiskResult>();
  
  if (!patientIds || patientIds.length === 0) {
    return resultMap;
  }

  // Use allSettled so one failure doesn't reject the whole batch
  const promises = patientIds.map(id => fetchPatientRisk(id).then(res => ({ id, res })));
  const results = await Promise.allSettled(promises);

  results.forEach(outcome => {
    if (outcome.status === 'fulfilled' && outcome.value.res) {
      resultMap.set(outcome.value.id, outcome.value.res);
    }
  });

  return resultMap;
}

// ==========================================
// REACT HOOK
// ==========================================

/**
 * React Hook for easily fetching and interacting with a patient's ML risk profile.
 * 
 * @param patientId The patient ID to analyze
 */
export function usePrediction(patientId: string | null | undefined) {
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRisk = useCallback(async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPatientRisk(patientId);
      if (result) {
        setRisk(result);
        // Optionally sync to Supabase in the background
        syncRiskScoreToSupabase(patientId, result).catch(console.error);
      } else {
        setError('Failed to calculate patient risk.');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  const submitFeedback = async (action: 'confirmed' | 'overridden', note?: string) => {
    if (!risk) return false;
    
    const payload: FeedbackPayload = {
      predictionId: risk.predictionId,
      action,
      note,
    };
    
    return await submitClinicalFeedback(payload);
  };

  return {
    risk,
    loading,
    error,
    refresh: fetchRisk,
    submitFeedback
  };
}
