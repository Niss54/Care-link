import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  ShieldCheck,
  Cpu,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowRight,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Layers,
  Heart,
  Pill,
  Send,
  Lock
} from 'lucide-react';
import gsap from 'gsap';
import { Patient } from '../types';

interface AgentCockpitViewProps {
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  patients?: Patient[];
}

interface ExecutionStep {
  stepId: number;
  agent: string;
  action: string;
  detail: string;
  metrics?: Record<string, any>;
  timestamp: string;
}

interface EvidenceBadge {
  tag: string;
  title: string;
  source: string;
  condition: string;
  evidenceLevel: string;
  snippet: string;
  score: number;
}

interface MedicationAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: string;
  drugs: string;
  hazard: string;
  recommendation: string;
  citation: string;
}

const CLINICAL_PRESETS = [
  {
    id: 'chf_decompensation',
    label: 'Heart Failure Decompensation (MTS Urgency)',
    patientName: 'Rajesh Kumar (MRN-88231)',
    patientId: 'patient_rajesh_88',
    query: 'Patient discharged 5 days ago post-MI. Reports sudden bilateral ankle swelling, orthopnea, and gained 2.8kg in 48 hours.',
    vitals: { spo2: 89, systolic: 148, diastolic: 92, heart_rate: 104, weight_gain_kg: 2.8, temp: 98.4 },
    medications: ['Furosemide 40mg', 'Carvedilol 12.5mg', 'Enalapril 10mg'],
    intent: 'triage'
  },
  {
    id: 'ddi_warfarin_nsaid',
    label: 'Anticoagulant & NSAID Interaction (Safety Blocker)',
    patientName: 'Sunita Sharma (MRN-91042)',
    patientId: 'patient_sunita_91',
    query: 'Patient on daily Warfarin for atrial fibrillation developed severe knee osteoarthritis pain. Family requested prescribing high-dose Ibuprofen or Diclofenac.',
    vitals: { spo2: 98, systolic: 124, diastolic: 78, heart_rate: 72, temp: 98.6 },
    medications: ['Warfarin 5mg', 'Metoprolol 50mg', 'Ibuprofen 400mg'],
    intent: 'medication_safety'
  },
  {
    id: 'shap_readmission_risk',
    label: 'High Readmission Risk & SHAP Analysis',
    patientName: 'Anil Verma (MRN-72319)',
    patientId: 'patient_anil_72',
    query: 'Synthesize XGBoost 30-day readmission risk explanation. Patient has 2 emergency admissions in 6 months, declining eGFR, and polypharmacy (>8 meds).',
    vitals: { spo2: 95, systolic: 136, diastolic: 84, heart_rate: 82, temp: 98.2 },
    medications: ['Metformin 1000mg', 'Dapagliflozin 10mg', 'Atorvastatin 40mg', 'Amlodipine 5mg', 'Aspirin 75mg', 'Omeprazole 20mg'],
    demographics: {
      readmission_risk_score: 0.74,
      egfr: 34,
      shap_factors: [
        { feature: 'Prior Emergency Admissions (2 in 6m)', attribution: '+0.28', impact: 'High Adverse' },
        { feature: 'Decline in eGFR to 34 mL/min', attribution: '+0.22', impact: 'Moderate Adverse' },
        { feature: 'Polypharmacy (>8 concurrent meds)', attribution: '+0.16', impact: 'Moderate Adverse' },
        { feature: 'Early Outpatient Review Booked', attribution: '-0.10', impact: 'Protective' }
      ]
    },
    intent: 'risk_analyst'
  },
  {
    id: 'care_plan_discharge',
    label: 'Post-Discharge 4-Part Care Plan & Schedule',
    patientName: 'Meera Patel (MRN-66415)',
    patientId: 'patient_meera_66',
    query: 'Generate 4-part post-discharge recovery care plan: medication adjustments, 7-10 day cardiology follow-up, sodium/fluid restrictions, and red flag warnings.',
    vitals: { spo2: 96, systolic: 128, diastolic: 80, heart_rate: 76, temp: 98.6 },
    medications: ['Sacubitril/Valsartan 49/51mg', 'Bisoprolol 5mg', 'Spironolactone 25mg'],
    intent: 'care_plan'
  }
];

export const AgentCockpitView: React.FC<AgentCockpitViewProps> = ({ onShowToast }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Inputs
  const [selectedPreset, setSelectedPreset] = useState(CLINICAL_PRESETS[0]);
  const [queryText, setQueryText] = useState(CLINICAL_PRESETS[0].query);
  const [patientId, setPatientId] = useState(CLINICAL_PRESETS[0].patientId);
  const [vitals, setVitals] = useState<Record<string, any>>(CLINICAL_PRESETS[0].vitals);
  const [medsText, setMedsText] = useState(CLINICAL_PRESETS[0].medications.join(', '));

  // Agent State
  const [isRunning, setIsRunning] = useState(false);
  const [routedAgent, setRoutedAgent] = useState<string>('triage');
  const [intentConfidence, setIntentConfidence] = useState<number>(0.92);
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [citations, setCitations] = useState<string[]>([]);
  const [evidenceBadges, setEvidenceBadges] = useState<EvidenceBadge[]>([]);
  const [fidelityScore, setFidelityScore] = useState<number>(1.0);
  const [isGrounded, setIsGrounded] = useState<boolean>(true);
  const [medicationAlerts, setMedicationAlerts] = useState<MedicationAlert[]>([]);
  const [isBlockedBySafety, setIsBlockedBySafety] = useState<boolean>(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [activeNode, setActiveNode] = useState<string>('idle');

  // Clinician Feedback
  const [feedbackAction, setFeedbackAction] = useState<'Approve' | 'Override'>('Approve');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideRate, setOverrideRate] = useState<number>(0.0);
  const [isDriftDetected, setIsDriftDetected] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    // GSAP Intro animation
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.cockpit-anim'),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
    // Fetch initial feedback drift metrics
    fetch('/api/agent/feedback/metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.override_rate === 'number') {
          setOverrideRate(data.override_rate);
          setIsDriftDetected(data.is_drift_detected);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPreset = (preset: typeof CLINICAL_PRESETS[0]) => {
    setSelectedPreset(preset);
    setQueryText(preset.query);
    setPatientId(preset.patientId);
    setVitals(preset.vitals);
    setMedsText(preset.medications.join(', '));
  };

  const handleRunAgents = async () => {
    if (!queryText.trim()) {
      onShowToast('Missing Query', 'Please provide clinical notes or select a patient scenario.', 'error');
      return;
    }

    setIsRunning(true);
    setActiveNode('supervisor');
    setFeedbackSubmitted(false);

    try {
      const medicationsArray = medsText
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const payload = {
        query: queryText,
        patientId,
        vitals,
        medications: medicationsArray,
        demographics: (selectedPreset as any).demographics || {}
      };

      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.refusalMessage || 'Multi-agent inference failed');
      }

      const data = await res.json();

      setRoutedAgent(data.routedAgent || 'triage');
      setIntentConfidence(data.routingConfidence || 0.90);
      setAgentResponse(data.agentResponse || '');
      setCitations(data.citations || []);
      setEvidenceBadges(data.evidenceBadges || []);
      setFidelityScore(data.groundingFidelity || 1.0);
      setIsGrounded(data.isGrounded !== false);
      setMedicationAlerts(data.medicationAlerts || []);
      setIsBlockedBySafety(data.isBlockedBySafety || false);
      setExecutionSteps(data.executionSteps || []);
      setActiveNode(data.routedAgent || 'triage');

      onShowToast('Agent Orchestration Complete', `Successfully routed to ${data.routedAgent} with ${Math.round((data.groundingFidelity || 1) * 100)}% grounding fidelity.`, 'success');
    } catch (err: any) {
      console.error('Agent execution error:', err);
      onShowToast('Execution Error', err.message || 'Failed to complete agent run.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const res = await fetch('/api/agent/feedback/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          agentType: routedAgent,
          suggestedAction: agentResponse.slice(0, 100),
          clinicianAction: feedbackAction === 'Approve' ? 'Approved' : 'Overridden',
          overrideReason: feedbackAction === 'Override' ? overrideReason : '',
          clinicianId: 'Dr. Nishant Maurya'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbackSubmitted(true);
        if (data.currentMetrics) {
          setOverrideRate(data.currentMetrics.override_rate);
          setIsDriftDetected(data.currentMetrics.is_drift_detected);
        }
        onShowToast(
          feedbackAction === 'Approve' ? 'Recommendation Approved' : 'Clinical Override Recorded',
          feedbackAction === 'Approve'
            ? 'Clinician agreement registered to audit log.'
            : 'Clinical override logged. Active learning drift engine updated.',
          'success'
        );
      }
    } catch {
      onShowToast('Error', 'Failed to submit feedback.', 'error');
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* ── TOP SYSTEM STATUS BAR (Pure Light Nissh Aesthetic) ── */}
      <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f766e]/10 border border-[#0f766e]/20 flex items-center justify-center text-[#0f766e]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-[#0f172a] tracking-tight">CareLink Agent Cockpit</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-[#0f766e]/10 text-[#0f766e] rounded-full border border-[#0f766e]/20">
                Autonomous 9-Layer
              </span>
            </div>
            <p className="text-xs text-[#64748b]">Multi-Agent Supervisor & Clinical Grounding Engine • Bharat Agentic 2026</p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-[#334155]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Dual-LLM Gateway:</span>
            <span className="text-[#0f766e] font-semibold">Gemini ⚡ Groq Failover</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-[#334155]">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium">RAG:</span>
            <span className="font-semibold text-slate-800">Qdrant Cloud (10 Guidelines)</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-[#334155]">
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium">Memory:</span>
            <span className="font-semibold text-slate-800">Mem0 Cloud</span>
          </div>

          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isDriftDetected
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Drift Monitor:</span>
            <span>{isDriftDetected ? 'DRIFT DETECTED' : 'STABLE'} ({(overrideRate * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN MAIN COCKPIT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Patient Case & Simulation Control (4 cols) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Preset Selector */}
          <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#0f172a] mb-3 flex items-center justify-between">
              <span>Clinical Test Scenarios</span>
              <span className="text-xs font-normal text-[#64748b]">Select case</span>
            </h2>
            <div className="space-y-2">
              {CLINICAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedPreset.id === preset.id
                      ? 'bg-[#0f766e]/5 border-[#0f766e] text-[#0f766e] font-semibold shadow-xs'
                      : 'bg-[#fafafa] border-[#e2e8f0] text-[#334155] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{preset.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-1 font-normal truncate">{preset.patientName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Query & Parameters Editor */}
          <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0f172a] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#0f766e]" />
              <span>Clinical Notes & Vitals</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Patient Identifier (HIPAA Scrubbed)</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#0f766e] text-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Clinical Presentation / Triage Notes</label>
              <textarea
                rows={4}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="w-full text-xs p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#0f766e] text-[#0f172a] leading-relaxed resize-none"
                placeholder="Enter patient symptoms, complaints, or discharge notes..."
              />
            </div>

            {/* Quick Vitals Badges */}
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">Vitals Parameters</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block">SpO2</span>
                  <span className={`font-semibold ${Number(vitals.spo2) < 90 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {vitals.spo2 ?? 98}%
                  </span>
                </div>
                <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block">Blood Pressure</span>
                  <span className={`font-semibold ${Number(vitals.systolic) >= 180 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {vitals.systolic ?? 120}/{vitals.diastolic ?? 80}
                  </span>
                </div>
                <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block">Weight Change</span>
                  <span className={`font-semibold ${Number(vitals.weight_gain_kg) >= 2.0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {vitals.weight_gain_kg ? `+${vitals.weight_gain_kg} kg` : '0 kg'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Active Prescribed Medications</label>
              <input
                type="text"
                value={medsText}
                onChange={(e) => setMedsText(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#0f766e] text-[#0f172a]"
                placeholder="Comma-separated medication list..."
              />
            </div>

            {/* Run CTA Button */}
            <button
              onClick={handleRunAgents}
              disabled={isRunning}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#0f766e] hover:bg-[#115e59] shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Orchestrating Specialist Agents...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Clinical Agent Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── CENTER COLUMN: StateGraph & Reasoning Telemetry (4 cols) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* StateGraph Flow Visualizer */}
          <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#0f172a] flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>StateGraph Multi-Agent Flow</span>
              </h2>
              <span className="text-[11px] font-medium text-slate-500">Live Router</span>
            </div>

            {/* Visual Node Diagram */}
            <div className="space-y-2 py-1">
              {/* Ingest Node */}
              <div className="flex items-center space-x-2">
                <div className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-700">1. PHI Zero-Leak Guardrail</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">Scrubbed</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-400">
                <div className="h-3 w-0.5 bg-slate-300" />
              </div>

              {/* Supervisor Router Node */}
              <div
                className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                  activeNode === 'supervisor' || isRunning
                    ? 'border-[#0f766e] bg-[#0f766e]/5 ring-2 ring-[#0f766e]/20'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bot className="w-3.5 h-3.5 text-[#0f766e]" />
                  <span className="font-semibold text-slate-800">2. Supervisor Intent Router</span>
                </div>
                <span className="text-[10px] font-bold text-[#0f766e] bg-[#0f766e]/10 px-1.5 py-0.5 rounded">
                  {Math.round(intentConfidence * 100)}% Conf
                </span>
              </div>

              {/* Dynamic Branch Arrow */}
              <div className="flex justify-center text-slate-400">
                <div className="h-3 w-0.5 bg-slate-300" />
              </div>

              {/* Active Specialist Node */}
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold text-indigo-950 capitalize">3. Specialist: {routedAgent.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-tight">
                  {routedAgent === 'medication_safety' && 'Deterministic DDI scanning & pharmacovigilance gating.'}
                  {routedAgent === 'risk_analyst' && 'XGBoost 30-day readmission prediction & SHAP attribution narrative.'}
                  {routedAgent === 'care_plan' && '4-part post-discharge plan generation: meds, visits, diet, red flags.'}
                  {routedAgent === 'triage' && 'Manchester Triage System (MTS) physiological vitals evaluation.'}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-400">
                <div className="h-3 w-0.5 bg-slate-300" />
              </div>

              {/* Grounding & Memory Node */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-700 text-[11px]">Citation Resolver</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">{Math.round(fidelityScore * 100)}%</span>
                </div>
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-semibold text-slate-700 text-[11px]">Mem0 Sync</span>
                  </div>
                  <span className="text-[10px] text-purple-600 font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning Telemetry Feed */}
          <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0f172a] flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#0f766e]" />
                <span>Step-by-Step Reasoning Trace</span>
              </h2>
              <span className="text-xs text-[#64748b]">{executionSteps.length} step(s)</span>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {executionSteps.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#94a3b8]">
                  Click <span className="font-semibold text-[#0f766e]">"Execute Clinical Agent Pipeline"</span> to view step-by-step telemetry.
                </div>
              ) : (
                executionSteps.map((step) => (
                  <div key={step.stepId} className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#0f766e]/10 text-[#0f766e] flex items-center justify-center font-bold text-[10px]">
                          {step.stepId}
                        </span>
                        <span className="font-semibold text-[#0f172a]">{step.agent}</span>
                      </div>
                      <span className="text-[10px] text-[#64748b] font-mono">{step.action}</span>
                    </div>
                    <p className="text-[11px] text-[#334155] leading-relaxed pl-5">{step.detail}</p>
                    {step.metrics && Object.keys(step.metrics).length > 0 && (
                      <div className="pl-5 pt-0.5 flex flex-wrap gap-1 text-[10px] text-[#64748b]">
                        {step.metrics.provider && (
                          <span className="px-1.5 py-0.5 bg-slate-200/60 rounded">Provider: {step.metrics.provider}</span>
                        )}
                        {step.metrics.latency_ms && (
                          <span className="px-1.5 py-0.5 bg-slate-200/60 rounded">{step.metrics.latency_ms} ms</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Clinical Decision, Evidence Badges & Feedback (4 cols) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Critical Blocker Alert (if any) */}
          {isBlockedBySafety && (
            <div className="cockpit-anim p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 font-bold text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>SAFETY GUARDRAIL BLOCKED: Critical Interaction</span>
              </div>
              {medicationAlerts.map((a, i) => (
                <div key={i} className="text-xs text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-200/80">
                  <div className="font-semibold">{a.hazard}</div>
                  <div className="mt-1 text-[11px] text-rose-950 font-medium">{a.recommendation} <span className="font-bold underline">{a.citation}</span></div>
                </div>
              ))}
            </div>
          )}

          {/* Clinical Output Card */}
          <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0f172a] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Clinical Recommendation</span>
              </h2>

              <button
                onClick={handlePrintPdf}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
                title="Export or print clinical report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>

            {/* Grounding Badge Pill */}
            <div className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-800">
              <span className="font-semibold">Grounding Fidelity:</span>
              <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded-full">{Math.round(fidelityScore * 100)}% Verified</span>
            </div>

            {/* Generated Clinical Response Text */}
            <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-sans">
              {agentResponse || (
                <span className="text-[#94a3b8] italic">
                  Agent output will appear here after running pipeline.
                </span>
              )}
            </div>

            {/* Clinical Evidence Badges */}
            {evidenceBadges.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#475569] block">Evidence-Based Guidelines Cited:</span>
                <div className="space-y-2">
                  {evidenceBadges.map((badge, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900">{badge.tag} - {badge.title}</span>
                        <span className="text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">{badge.evidenceLevel}</span>
                      </div>
                      <div className="text-[11px] text-[#64748b]">{badge.source} • {badge.condition}</div>
                      <p className="text-[11px] text-slate-700 italic border-l-2 border-indigo-400 pl-2 mt-1">
                        "{badge.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clinician Review & Active Learning Feedback Loop */}
          <div className="cockpit-anim bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-[#0f172a] flex items-center justify-between">
              <span>Clinician In-the-Loop Review</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Active Learning</span>
            </h2>

            {feedbackSubmitted ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-medium">
                ✓ Clinician review registered to CareLink audit trail.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setFeedbackAction('Approve')}
                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center space-x-1.5 transition-all ${
                      feedbackAction === 'Approve'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Approve AI Plan</span>
                  </button>

                  <button
                    onClick={() => setFeedbackAction('Override')}
                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center space-x-1.5 transition-all ${
                      feedbackAction === 'Override'
                        ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Override / Modify</span>
                  </button>
                </div>

                {feedbackAction === 'Override' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Clinician Override Rationale</label>
                    <textarea
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Specify clinical reasons for overriding AI plan (e.g. social factors, specific drug allergy)..."
                      className="w-full text-xs p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-amber-600 text-slate-900 resize-none"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmitFeedback}
                  className="w-full py-2.5 px-3 rounded-xl font-medium text-xs text-white bg-slate-800 hover:bg-slate-900 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Clinician Decision</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
