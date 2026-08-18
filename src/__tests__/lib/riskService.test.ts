import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPatientRisk, loadAllRiskScores } from '../../lib/riskService';

// We are asked to test retries, fallback mock data, and loadAllRiskScores.
// Since riskService uses fetch, we mock global.fetch.

describe('riskService', () => {
  const mockEnv = import.meta.env;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Simulate API URL being present
    vi.stubEnv('VITE_ML_API_URL', 'http://localhost:8001');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fetchPatientRisk returns correct RiskResult shape', async () => {
    const mockResponse = {
      prediction_id: 123,
      probability: 0.85,
      risk_tier: 'High',
      prediction: 1,
      top_factors: [{ feature: 'Age', impact: 0.2 }]
    };
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as any);

    const result = await fetchPatientRisk('patient-1');
    
    expect(result).not.toBeNull();
    expect(result?.probability).toBe(0.85);
    expect(result?.riskTier).toBe('High');
    expect(result?.topFactors).toHaveLength(1);
  });

  it('fetchPatientRisk retries on network failure (2 retries)', async () => {
    // Fail twice, succeed on third
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ probability: 0.5, risk_tier: 'Medium', top_factors: [] })
      } as any);

    const result = await fetchPatientRisk('patient-1');
    
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result?.probability).toBe(0.5);
  });

  it('fallback mock data returned when API URL not set', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_ML_API_URL', '');

    const result = await fetchPatientRisk('patient-1');
    
    // Should return mock deterministic data without calling fetch
    expect(fetch).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(['Low', 'Medium', 'High']).toContain(result?.riskTier);
  });

  it('loadAllRiskScores handles partial failures (Promise.allSettled)', async () => {
    // Patient 1 succeeds, Patient 2 fails permanently
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (url.toString().includes('patient-1')) {
        return { ok: true, json: async () => ({ probability: 0.5, risk_tier: 'Medium', top_factors: [] }) } as any;
      }
      throw new Error('Permanent failure');
    });

    // To prevent infinite retries slowing down test, mock the retry config inside riskService if possible,
    // or just let it fail. Since the test runs, it will hit the 2 retries and return null.
    const results = await loadAllRiskScores(['patient-1', 'patient-2']);
    
    expect(results['patient-1']).not.toBeNull();
    expect(results['patient-2']).toBeNull();
  });
});
