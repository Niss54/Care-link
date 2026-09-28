/**
 * CareLink Observability & Telemetry Engine (TypeScript)
 * Implements LangSmith-compatible run trace instrumentation, latency tracking,
 * token accounting, and structured span logging for the multi-agent pipeline.
 */

import fs from 'fs';
import path from 'path';

export interface TraceSpan {
  spanId: string;
  name: string;
  agent: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  metadata?: Record<string, any>;
}

export interface RunTrace {
  traceId: string;
  sessionId?: string;
  patientId?: string;
  rootQuery: string;
  routedAgent: string;
  routingConfidence: number;
  totalDurationMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerUsed: string;
  groundingScore: number;
  citations: string[];
  isSafetyBlocked: boolean;
  spans: TraceSpan[];
  createdAt: string;
  status: 'COMPLETED' | 'FAILED' | 'BLOCKED';
}

const TRACE_DIR = path.resolve(process.cwd(), '.runtime', 'traces');

function ensureTraceDir() {
  if (!fs.existsSync(TRACE_DIR)) {
    fs.mkdirSync(TRACE_DIR, { recursive: true });
  }
}

// In-memory trace buffer for real-time frontend cockpit querying
const inMemoryTraces: RunTrace[] = [];

/**
 * Creates and persists a LangSmith-compatible run trace
 */
export function recordRunTrace(trace: RunTrace): void {
  try {
    ensureTraceDir();
    inMemoryTraces.unshift(trace);
    if (inMemoryTraces.length > 100) {
      inMemoryTraces.pop();
    }

    const filePath = path.join(TRACE_DIR, `${trace.traceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(trace, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Observability] Failed to persist trace to disk:', err);
  }
}

/**
 * Retrieves recent execution traces
 */
export function getRecentTraces(limit: number = 20): RunTrace[] {
  if (inMemoryTraces.length > 0) {
    return inMemoryTraces.slice(0, limit);
  }

  try {
    ensureTraceDir();
    const files = fs.readdirSync(TRACE_DIR)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit);

    const traces: RunTrace[] = [];
    for (const f of files) {
      const content = fs.readFileSync(path.join(TRACE_DIR, f), 'utf-8');
      traces.push(JSON.parse(content));
    }
    return traces;
  } catch {
    return [];
  }
}

/**
 * Computes observability summary metrics across stored traces
 */
export function getObservabilitySummary() {
  const traces = getRecentTraces(100);
  if (traces.length === 0) {
    return {
      totalRuns: 0,
      avgLatencyMs: 0,
      avgGroundingScore: 1.0,
      providerDistribution: {},
      agentDistribution: {},
      safetyBlockCount: 0
    };
  }

  let totalLatency = 0;
  let totalGrounding = 0;
  let safetyBlocks = 0;
  const providers: Record<string, number> = {};
  const agents: Record<string, number> = {};

  for (const t of traces) {
    totalLatency += t.totalDurationMs || 0;
    totalGrounding += t.groundingScore || 0;
    if (t.isSafetyBlocked) safetyBlocks++;

    const prov = t.providerUsed || 'fallback';
    providers[prov] = (providers[prov] || 0) + 1;

    const ag = t.routedAgent || 'triage';
    agents[ag] = (agents[ag] || 0) + 1;
  }

  return {
    totalRuns: traces.length,
    avgLatencyMs: Math.round(totalLatency / traces.length),
    avgGroundingScore: Number((totalGrounding / traces.length).toFixed(3)),
    providerDistribution: providers,
    agentDistribution: agents,
    safetyBlockCount: safetyBlocks
  };
}
