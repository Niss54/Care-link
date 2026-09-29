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
  Lock,
  Globe,
  CreditCard,
  Award,
  MessageSquare,
  Calendar,
  Bell,
  Copy,
  ExternalLink,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  Volume2,
  Play,
  Square,
  Timer,
  Radio
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
    id: 'pmjay_eligibility',
    label: '🇮🇳 Ayushman Bharat PM-JAY ₹5L Cashless Eligibility',
    patientName: 'Kameshwar Yadav (MRN-10492)',
    patientId: 'patient_kameshwar_10',
    query: 'Verify Ayushman Bharat PM-JAY eligibility for ₹5,00,000 cashless pre-authorization for emergency cardiac catheterization and stent. Patient holds BPL ration card.',
    vitals: { spo2: 94, systolic: 152, diastolic: 96, heart_rate: 92, temp: 98.6 },
    medications: ['Aspirin 150mg', 'Clopidogrel 75mg', 'Atorvastatin 80mg'],
    demographics: { age: 62, gender: 'Male', admission_type: 'Emergency', risk_tier: 'High', rationCardType: 'BPL' },
    intent: 'pmjay'
  },
  {
    id: 'abha_discovery',
    label: '🇮🇳 ABDM ABHA ID & Longitudinal Health Records',
    patientName: 'Sunita Sharma (ABHA: 91-8842-9012-7741)',
    patientId: 'patient_sunita_91',
    query: 'Lookup Ayushman Bharat Health Account (ABHA ID 91-8842-9012-7741). Pull linked longitudinal hospital discharge summaries, prior PCI stent reports, and drug allergies across AIIMS and Safdarjung Hospital.',
    vitals: { spo2: 97, systolic: 126, diastolic: 76, heart_rate: 74, temp: 98.4 },
    medications: ['Warfarin 5mg', 'Metoprolol 50mg'],
    demographics: { age: 72, gender: 'Female', admission_type: 'Outpatient', risk_tier: 'Medium' },
    intent: 'abha'
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
  const streamingTimerRef = useRef<any>(null);
  const fullResponseRef = useRef<string>('');

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
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Bharat Health Stack & Localization State
  const [isHindi, setIsHindi] = useState<boolean>(false);
  const [pmjayStatus, setPmjayStatus] = useState<any>(null);
  const [abhaProfile, setAbhaProfile] = useState<any>(null);

  // Autonomous Action States (Phase 9)
  const [vitalsAlert, setVitalsAlert] = useState<any>(null);
  const [whatsAppDraft, setWhatsAppDraft] = useState<any>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);

  // Track 2: LiveKit Telephony & Sarvam Indic Voice Escalation State
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isDialing, setIsDialing] = useState<boolean>(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<string>('en-IN');
  const [selectedIndicProvider, setSelectedIndicProvider] = useState<'auto' | 'bhashini' | 'sarvam'>('auto');
  const [indicProviderStatus, setIndicProviderStatus] = useState<any>(null);
  const [clinicianPhone, setClinicianPhone] = useState<string>('+919876543210');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [supportedLangs, setSupportedLangs] = useState<any[]>([]);
  const callTimerRef = useRef<any>(null);
  const pollTimerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clinician Feedback
  const [feedbackAction, setFeedbackAction] = useState<'Approve' | 'Override'>('Approve');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideRate, setOverrideRate] = useState<number>(0.0);
  const [isDriftDetected, setIsDriftDetected] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleSkipStream = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
    }
    setAgentResponse(fullResponseRef.current);
    setIsStreaming(false);
  };

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
        if (data) {
          const rate = typeof data.override_rate === 'number' ? data.override_rate : (typeof data.overrideRate === 'number' ? data.overrideRate : 0);
          setOverrideRate(rate);
          setIsDriftDetected(Boolean(data.is_drift_detected ?? data.isDriftDetected));
        }
      })
      .catch(() => {});

    // Fetch Bhashini 22 Scheduled Indian Languages & Provider Status
    fetch('/api/agent/indic/providers')
      .then((res) => res.json())
      .then((data) => setIndicProviderStatus(data))
      .catch(() => {});

    fetch('/api/agent/bhashini/languages')
      .then((res) => res.json())
      .then((data) => {
        if (data?.languages && data.languages.length > 0) {
          setSupportedLangs(data.languages);
        } else {
          throw new Error('Fallback to Sarvam');
        }
      })
      .catch(() => {
        fetch('/api/agent/sarvam/languages')
          .then((res) => res.json())
          .then((data) => {
            if (data?.languages) setSupportedLangs(data.languages);
          })
          .catch(() => {});
      });

    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
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
        demographics: (selectedPreset as any).demographics || {},
        isHindi
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

      const fullSteps: ExecutionStep[] = data.executionSteps || [];
      const fullResponse: string = data.agentResponse || '';
      fullResponseRef.current = fullResponse;

      setRoutedAgent(data.routedAgent || 'triage');
      setIntentConfidence(data.routingConfidence || 0.90);
      setCitations(data.citations || []);
      setEvidenceBadges(data.evidenceBadges || []);
      setFidelityScore(data.groundingFidelity || 1.0);
      setIsGrounded(data.isGrounded !== false);
      setMedicationAlerts(data.medicationAlerts || []);
      setIsBlockedBySafety(data.isBlockedBySafety || false);
      setPmjayStatus(data.pmjayStatus || null);
      setAbhaProfile(data.abhaProfile || null);

      // Phase 10: Progressive step-by-step reasoning disclosure
      setExecutionSteps([]);
      setAgentResponse('');
      setIsStreaming(true);

      for (let i = 0; i < fullSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 110));
        setExecutionSteps((prev) => [...prev, fullSteps[i]]);
        if (fullSteps[i].agent) {
          const lower = fullSteps[i].agent.toLowerCase();
          if (lower.includes('medication')) setActiveNode('medication_safety');
          else if (lower.includes('risk')) setActiveNode('risk_analyst');
          else if (lower.includes('care')) setActiveNode('care_plan');
          else if (lower.includes('triage')) setActiveNode('triage');
        }
      }
      setActiveNode(data.routedAgent || 'triage');

      // Phase 10: Smooth typewriter streaming effect
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
      let charIdx = 0;
      const stepChunk = Math.max(6, Math.floor(fullResponse.length / 45));
      streamingTimerRef.current = setInterval(() => {
        charIdx += stepChunk;
        if (charIdx >= fullResponse.length) {
          setAgentResponse(fullResponse);
          setIsStreaming(false);
          if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
        } else {
          setAgentResponse(fullResponse.slice(0, charIdx));
        }
      }, 18);

      onShowToast(
        isHindi ? 'एजेंट प्रक्रिया संपन्न' : 'Agent Orchestration Complete',
        isHindi
          ? `${data.routedAgent} को सफलतापूर्वक रूट किया गया (${Math.round((data.groundingFidelity || 1) * 100)}% विश्वसनीयता)`
          : `Successfully routed to ${data.routedAgent} with ${Math.round((data.groundingFidelity || 1) * 100)}% grounding fidelity.`,
        'success'
      );
    } catch (err: any) {
      console.error('Agent execution error:', err);
      onShowToast('Execution Error', err.message || 'Failed to complete agent run.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleTriggerEscalationCall = async (forceBypass = true, customSpo2?: number) => {
    setIsDialing(true);
    setCallDuration(0);

    const targetSpo2 = typeof customSpo2 === 'number' ? customSpo2 : (vitals.spo2 || 84);

    try {
      const alertPayload = {
        alertId: `ALT-${Date.now().toString().slice(-4)}`,
        patientId,
        caseId: `CASE-${(patientId || 'PT').toUpperCase()}`,
        ward: 'ICU-2',
        bed: 'Bed-04',
        alertType: 'CRITICAL_HYPOXIA',
        severity: 'CRITICAL',
        vitals: {
          spo2: targetSpo2,
          heartRate: vitals.heart_rate || 118,
          bloodPressure: `${vitals.systolic || 140}/${vitals.diastolic || 90}`,
        },
        primaryContact: clinicianPhone,
        secondaryContact: '+919876543211',
        preferredLanguage: selectedVoiceLang,
      };

      const res = await fetch('/api/telephony/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: alertPayload,
          forceBypassCooldown: forceBypass,
          customDestination: clinicianPhone,
          autoSimulate: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.validation?.message || data.error || 'Escalation policy rejected call');
      }

      setActiveCall(data.callRecord);
      onShowToast(
        '🚨 CRITICAL VOICE ESCALATION INITIATED',
        `LiveKit room ${data.roomName} active. Outbound SIP ringing ${clinicianPhone}.`,
        'error'
      );

      // Start call duration timer
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      // Poll call status and audit timeline
      const callId = data.callRecord.callId;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/telephony/calls/${callId}`);
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.call) {
              setActiveCall(pollData.call);
              if (
                pollData.call.status === 'ACKNOWLEDGED' ||
                pollData.call.status === 'NO_ANSWER' ||
                pollData.call.status === 'FAILED' ||
                pollData.call.status === 'ESCALATION_FAILED'
              ) {
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                if (callTimerRef.current) clearInterval(callTimerRef.current);

                if (pollData.call.status === 'ACKNOWLEDGED') {
                  onShowToast(
                    '✅ CLOSED-LOOP CALL RESOLVED',
                    `Doctor verbal acknowledgement verified: "${pollData.call.verbalAckSnippet?.slice(0, 70)}..."`,
                    'success'
                  );
                }
              }
            }
          }
        } catch {}
      }, 600);
    } catch (err: any) {
      onShowToast('Telephony Gate', err.message || 'Call failed to dispatch', 'error');
    } finally {
      setIsDialing(false);
    }
  };

  const handleDoctorAcknowledge = async () => {
    if (!activeCall) return;
    try {
      const res = await fetch('/api/telephony/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCall.callId,
          acknowledgedBy: 'Dr. Sharma (Duty Intensivist)',
          verbalSnippet: `Understood, SpO2 ${activeCall.vitals?.spo2 || 84}% in ICU-2 Bed-04 noted. Attending bed immediately.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCall(data.call);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        onShowToast(
          '✅ VERBAL ACKNOWLEDGEMENT REGISTERED',
          'Doctor response received. Closed-loop resolved in audit trail.',
          'success'
        );
      }
    } catch {
      onShowToast('Error', 'Failed to submit verbal acknowledgement', 'error');
    }
  };

  const handlePlaySarvamVoicePreview = async () => {
    setIsPlayingAudio(true);
    try {
      const promptRes = await fetch('/api/telephony/voice-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: 'ALT-PREVIEW',
          caseId: `CASE-${(patientId || 'PT').toUpperCase()}`,
          ward: 'ICU-2',
          bed: 'Bed-04',
          alertType: 'CRITICAL_HYPOXIA',
          spo2: vitals.spo2 || 84,
          heartRate: vitals.heart_rate || 118,
          preferredLanguage: selectedVoiceLang,
        }),
      });
      const promptData = await promptRes.json();

      const ttsRes = await fetch('/api/agent/indic/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptData.spokenText,
          targetLang: selectedVoiceLang,
          provider: selectedIndicProvider,
        }),
      });
      const ttsData = await ttsRes.json();

      if (ttsData.dataUri) {
        const audio = new Audio(ttsData.dataUri);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
        const providerName = ttsData.provider === 'bhashini'
          ? 'Digital India Bhashini (MeitY)'
          : 'Sarvam AI';
        onShowToast(
          '🔊 VOICE ALERT PLAYING',
          `${providerName} (${selectedVoiceLang}) synthesized audio playing.`,
          'info'
        );
      }
    } catch {
      setIsPlayingAudio(false);
      onShowToast('Audio Notice', 'Failed to play voice preview', 'error');
    }
  };

  const handleSimulateVitalsDrop = async () => {
    try {
      const res = await fetch('/api/agent/vitals/simulate-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, anomalyType: 'hypoxemia' })
      });
      if (res.ok) {
        const data = await res.json();
        setVitalsAlert(data.alert);
        setVitals(data.telemetry);
        onShowToast(
          '🚨 EMERGENCY TELEMETRY ALERT',
          `SpO2 dropped to ${data.telemetry.spo2}%. Autonomous LiveKit voice escalation initiated!`,
          'error'
        );
        // Task 15.3: Wire simulated acute SpO2 drop button to trigger the escalation call workflow
        handleTriggerEscalationCall(true, data.telemetry.spo2);
      }
    } catch {
      onShowToast('Error', 'Failed to trigger simulated telemetry drop', 'error');
    }
  };

  const handleGenerateWhatsApp = async () => {
    try {
      const res = await fetch('/api/agent/communication/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: selectedPreset.patientName,
          patientPhone: '+919876543210',
          medications: medsText.split(',').map(m => m.trim()).filter(Boolean),
          isHindi
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsAppDraft(data);
        onShowToast(
          isHindi ? 'व्हाट्सएप निर्देश तैयार' : 'WhatsApp Instructions Drafted',
          isHindi ? 'मरीज़ और आशा कार्यकर्ता के लिए संदेश तैयार है।' : 'Bilingual WhatsApp notification generated with click-to-dispatch link.',
          'success'
        );
      }
    } catch {
      onShowToast('Error', 'Failed to generate WhatsApp notification', 'error');
    }
  };

  const handleAutoBookAppointment = async () => {
    try {
      const res = await fetch('/api/agent/appointments/auto-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName: selectedPreset.patientName,
          riskTier: 'HIGH',
          urgencyLevel: 'Urgent',
          specialty: 'Cardiology'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBookingConfirmation(data);
        onShowToast(
          isHindi ? 'अपॉइंटमेंट आरक्षित' : 'Specialist Slot Reserved',
          `${data.doctorName} - ${data.appointmentDate} at ${data.timeSlot}`,
          'success'
        );
      }
    } catch {
      onShowToast('Error', 'Failed to auto-book appointment', 'error');
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
          const cm = data.currentMetrics;
          const rate = typeof cm.override_rate === 'number' ? cm.override_rate : (typeof cm.overrideRate === 'number' ? cm.overrideRate : 0);
          setOverrideRate(rate);
          setIsDriftDetected(Boolean(cm.is_drift_detected ?? cm.isDriftDetected));
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
                Autonomous 12-Layer
              </span>
            </div>
            <p className="text-xs text-[#64748b]">Multi-Agent Supervisor & Clinical Grounding Engine • Bharat Agentic 2026</p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Bharat Linguistic Accessibility Toggle */}
          <button
            type="button"
            onClick={() => setIsHindi(!isHindi)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isHindi
                ? 'bg-[#0f766e] border-[#0f766e] text-white ring-2 ring-[#0f766e]/30'
                : 'bg-[#f8fafc] border-[#e2e8f0] text-[#334155] hover:border-[#0f766e]/40'
            }`}
            title="Toggle between English and Hindi ASHA Worker mode"
          >
            <Globe className={`w-3.5 h-3.5 ${isHindi ? 'text-white' : 'text-[#0f766e]'}`} />
            <span>{isHindi ? '🇮🇳 हिन्दी (ASHA Worker Mode)' : '🌐 English Mode'}</span>
          </button>

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
            <span>{isDriftDetected ? 'DRIFT DETECTED' : 'STABLE'} ({((Number.isFinite(overrideRate) ? overrideRate : 0) * 100).toFixed(1)}%)</span>
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

            {/* Autonomous Action Agents (Phase 9) */}
            <div className="pt-3 border-t border-[#e2e8f0] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#475569]">
                <span className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Autonomous Actions (Phase 9)</span>
                </span>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  Zero Human Touch
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleGenerateWhatsApp}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Draft WhatsApp</span>
                </button>

                <button
                  onClick={handleAutoBookAppointment}
                  className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-Book Slot</span>
                </button>
              </div>

              <button
                onClick={handleSimulateVitalsDrop}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>Simulate Acute SpO2 Drop (88%)</span>
              </button>
            </div>
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

              <div className="flex items-center space-x-2">
                {isStreaming && (
                  <button
                    onClick={handleSkipStream}
                    className="text-[11px] px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center space-x-1 cursor-pointer font-medium"
                    title="Skip typewriter animation and display full response instantly"
                  >
                    <span>⚡ Skip Stream</span>
                  </button>
                )}

                <button
                  onClick={handlePrintPdf}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
                  title="Export or print clinical report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

            {/* Grounding Badge Pill */}
            <div className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-800">
              <span className="font-semibold">Grounding Fidelity:</span>
              <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                {isStreaming ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>Streaming Reasoning...</span>
                  </>
                ) : (
                  <span>{Math.round(fidelityScore * 100)}% Verified</span>
                )}
              </span>
            </div>

            {/* Generated Clinical Response Text */}
            <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-sans relative">
              {agentResponse ? (
                <>
                  {agentResponse}
                  {isStreaming && (
                    <span className="inline-block w-2 h-3.5 bg-[#0f766e] ml-1 animate-pulse align-middle" />
                  )}
                </>
              ) : (
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

          {/* ── BHARAT HEALTH STACK: AYUSHMAN BHARAT PM-JAY CARD ── */}
          {pmjayStatus && (
            <div className="cockpit-anim bg-gradient-to-br from-amber-50/60 via-white to-emerald-50/50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-[#0f172a]">{pmjayStatus.schemeName}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {pmjayStatus.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-amber-100">
                  <span className="text-[10px] text-slate-500 block">Annual Cashless Cover</span>
                  <span className="font-bold text-emerald-700 text-sm">{pmjayStatus.coverageAmount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-100">
                  <span className="text-[10px] text-slate-500 block">Hospital Pre-Auth</span>
                  <span className="font-bold text-indigo-700 text-xs">{pmjayStatus.claimPreAuthStatus}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200">
                {pmjayStatus.empanelledHospitalNotice}
              </p>

              {pmjayStatus.eligibleProcedures && pmjayStatus.eligibleProcedures.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Covered Benefit Packages:</span>
                  <div className="space-y-1">
                    {pmjayStatus.eligibleProcedures.slice(0, 3).map((proc: any, pIdx: number) => (
                      <div key={pIdx} className="text-[11px] flex items-center justify-between text-slate-800 bg-white/60 px-2 py-1 rounded border border-slate-100">
                        <span className="truncate max-w-[200px]">{proc.procedureName}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 shrink-0">{proc.standardRate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-amber-100 text-[10px] text-slate-500">
                <span>Helpline: <strong className="text-slate-700">{pmjayStatus.nationalHelpline}</strong></span>
                <span className="font-medium text-emerald-800">{pmjayStatus.copayRequirement}</span>
              </div>
            </div>
          )}

          {/* ── BHARAT HEALTH STACK: ABDM ABHA IDENTITY PROFILE CARD ── */}
          {abhaProfile && (
            <div className="cockpit-anim bg-gradient-to-br from-teal-50/50 via-white to-sky-50/40 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-xs text-[#0f172a]">ABDM Verified Health ID</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  {abhaProfile.kycVerificationStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-teal-100 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-[#0f766e]">
                  <span>ABHA: {abhaProfile.abhaId}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{abhaProfile.abhaAddress}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Beneficiary: <strong className="text-slate-900">{abhaProfile.fullName}</strong> ({abhaProfile.gender}, Born {abhaProfile.yearOfBirth})
                </div>
              </div>

              {abhaProfile.linkedFacilities && abhaProfile.linkedFacilities.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Linked Longitudinal EHR Records ({abhaProfile.linkedFacilities.length}):
                  </span>
                  <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {abhaProfile.linkedFacilities.map((fac: any, fIdx: number) => (
                      <div key={fIdx} className="text-[11px] bg-white p-2 rounded-lg border border-teal-50 text-slate-700 space-y-0.5">
                        <div className="flex items-center justify-between font-semibold text-slate-900 text-[10px]">
                          <span className="truncate max-w-[210px]">{fac.facilityName}</span>
                          <span className="font-mono text-slate-500">{fac.visitDate}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 line-clamp-2">{fac.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {abhaProfile.knownAllergies && abhaProfile.knownAllergies.length > 0 && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                  <strong>Allergy Alert:</strong> {abhaProfile.knownAllergies.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* ── AUTONOMOUS ACTIONS: CRITICAL TELEMETRY ALERT CARD ── */}
          {vitalsAlert && (
            <div className="cockpit-anim bg-rose-50/90 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-pulse-once">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span className="font-bold text-xs text-rose-950 uppercase tracking-wide">
                    Autonomous Telemetry Alert ({vitalsAlert.severity})
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                  SLA: {vitalsAlert.responseSlaMinutes || vitalsAlert.escalationWindow || '< 5 min'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 border border-rose-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-rose-900">
                  <span>Trigger: {vitalsAlert.vitalType} = {vitalsAlert.triggerValue ? `${vitalsAlert.triggerValue}%` : (vitalsAlert.readingSummary || 'Critical Anomaly')}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{vitalsAlert.alertId}</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-snug">{vitalsAlert.clinicalConcern || vitalsAlert.clinicalSignificance}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-[11px] text-rose-950 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <span>🚨 Protocol Action:</span>
                </div>
                <p className="leading-snug">{vitalsAlert.escalationAction || vitalsAlert.immediateAction}</p>
                <div className="text-[10px] text-rose-700 pt-1 border-t border-rose-200/60 flex items-center justify-between">
                  <span>Assigned: <strong>{vitalsAlert.assignedPhysician || "Dr. Nishant Maurya (ICU Lead)"}</strong></span>
                  <span>Direct Escalation</span>
                </div>
              </div>
            </div>
          )}

          {/* ── AUTONOMOUS ACTIONS: WHATSAPP PATIENT DISPATCH CARD ── */}
          {whatsAppDraft && (
            <div className="cockpit-anim bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/50 border border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-[#0f172a]">Autonomous WhatsApp Dispatch</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {whatsAppDraft.language === 'hi' ? '🇮🇳 हिन्दी' : '🌐 English'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs font-mono text-slate-800 max-h-[160px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {whatsAppDraft.whatsAppMessage || whatsAppDraft.messageText}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <a
                  href={whatsAppDraft.dispatchUrl || whatsAppDraft.whatsappDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    const txt = whatsAppDraft.whatsAppMessage || whatsAppDraft.messageText || '';
                    navigator.clipboard.writeText(txt);
                    onShowToast('Copied', 'WhatsApp message copied to clipboard', 'info');
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1 transition-all"
                  title="Copy message text"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* ── AUTONOMOUS ACTIONS: EHR APPOINTMENT BOOKING CARD ── */}
          {bookingConfirmation && (
            <div className="cockpit-anim bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/50 border border-indigo-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-[#0f172a]">Hospital EHR Appointment Reserved</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {bookingConfirmation.bookingStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Physician</span>
                  <span className="font-bold text-indigo-950 text-xs">{bookingConfirmation.doctorName}</span>
                  <span className="text-[10px] text-indigo-600 block">{bookingConfirmation.specialty}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Slot & Room</span>
                  <span className="font-bold text-slate-900 text-xs">{bookingConfirmation.appointmentDate}</span>
                  <span className="text-[10px] text-slate-600 block">{bookingConfirmation.timeSlot} ({bookingConfirmation.room})</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-100">
                <span>Booking ID: <strong className="font-mono text-slate-800">{bookingConfirmation.bookingId}</strong></span>
                <span className="text-emerald-700 font-semibold">CareLink EHR Calendar</span>
              </div>
            </div>
          )}

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

      {/* ── TRACK 2: LIVEKIT CRITICAL TELEPHONY ESCALATION LAYER & AUDIT TIMELINE ── */}
      <div className="cockpit-anim bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6 mt-8">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  LiveKit Closed-Loop Critical Telephony Escalation
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Mission Critical
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Digital India Bhashini ⚡ Sarvam AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous SIP Outbound Dialing • 22 Indic Scheduled Languages • Closed-Loop Clinician Verification
              </p>
            </div>
          </div>

          {/* Real-Time Call Status Pill & Timer */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
              <Timer className="w-3.5 h-3.5 text-slate-400" />
              <span>00:{callDuration < 10 ? `0${callDuration}` : callDuration}</span>
            </div>

            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                !activeCall || activeCall.status === 'IDLE'
                  ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                  : activeCall.status === 'RINGING'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 animate-pulse'
                  : activeCall.status === 'IN_PROGRESS'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : activeCall.status === 'ACKNOWLEDGED'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{activeCall ? activeCall.status : 'STANDBY'}</span>
            </div>
          </div>
        </div>

        {/* Telephony Control Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800/60 text-xs">
          {/* Destination Clinician */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">
              On-Call Intensivist Contact (E.164)
            </label>
            <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <input
                type="text"
                value={clinicianPhone}
                onChange={(e) => setClinicianPhone(e.target.value)}
                className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                placeholder="+919876543210"
              />
            </div>
          </div>

          {/* Indic AI Provider Selector */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block flex items-center justify-between">
              <span>Indic AI Provider</span>
              <span className="text-[10px] text-amber-400 font-semibold">
                {selectedIndicProvider === 'auto'
                  ? '⚡ Dual-Engine'
                  : selectedIndicProvider === 'bhashini'
                  ? '🇮🇳 MeitY Bhashini'
                  : '⚡ Sarvam AI'}
              </span>
            </label>
            <select
              value={selectedIndicProvider}
              onChange={(e) => setSelectedIndicProvider(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="auto">🇮🇳 Auto-Failover (Bhashini ⚡ Sarvam)</option>
              <option value="bhashini">🇮🇳 Digital India Bhashini (MeitY)</option>
              <option value="sarvam">⚡ Sarvam AI Foundation</option>
            </select>
          </div>

          {/* Indic Language Selector */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block flex items-center justify-between">
              <span>Voice Language</span>
              <span className="text-[10px] text-indigo-400 font-mono">
                {supportedLangs.length > 0 ? `${supportedLangs.length} Langs` : '22 Scheduled'}
              </span>
            </label>
            <select
              value={selectedVoiceLang}
              onChange={(e) => setSelectedVoiceLang(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {supportedLangs.length > 0 ? (
                supportedLangs.map((lang: any) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName ? `${lang.nativeName} (${lang.name})` : lang.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">हिन्दी (Hindi)</option>
                  <option value="ta-IN">தமிழ் (Tamil)</option>
                  <option value="te-IN">తెలుగు (Telugu)</option>
                  <option value="bn-IN">বাংলা (Bengali)</option>
                  <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                  <option value="mr-IN">मराठी (Marathi)</option>
                  <option value="gu-IN">ગુજરાતી (Gujarati)</option>
                  <option value="ml-IN">മലയാളം (Malayalam)</option>
                  <option value="od-IN">ଓଡ଼ିଆ (Odia)</option>
                  <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="as-IN">অসমীয়া (Assamese)</option>
                  <option value="ur-IN">اردو (Urdu)</option>
                  <option value="sa-IN">संस्कृतम् (Sanskrit)</option>
                </>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex items-center space-x-2 pt-4 md:pt-0">
            <button
              onClick={() => handleTriggerEscalationCall(true)}
              disabled={isDialing}
              className="flex-1 py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-lg shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isDialing ? 'Dialing...' : '🚨 Escalation'}</span>
            </button>

            {activeCall && (activeCall.status === 'RINGING' || activeCall.status === 'IN_PROGRESS') && (
              <button
                onClick={handleDoctorAcknowledge}
                className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer animate-pulse"
                title="Simulate doctor speaking verbal affirmation: 'Acknowledged, attending bed'"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ack</span>
              </button>
            )}

            <button
              onClick={handlePlaySarvamVoicePreview}
              disabled={isPlayingAudio}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              title="Preview synthesized voice alert in chosen Indic engine & language"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'text-amber-400 animate-spin' : 'text-slate-300'}`} />
              <span className="hidden sm:inline">{isPlayingAudio ? 'Playing...' : 'Audio'}</span>
            </button>
          </div>
        </div>

        {/* ── CRITICAL ESCALATION AUDIT TIMELINE (CLOSED-LOOP VISUALIZER) ── */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Closed-Loop Telephony Audit Timeline</span>
            </h3>
            {activeCall && (
              <span className="text-[11px] font-mono text-slate-400">
                Room: <strong className="text-indigo-300">{activeCall.roomName}</strong>
              </span>
            )}
          </div>

          {/* 6-Step Visual Progression Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeCall
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono opacity-70">00:00</div>
              <div className="font-bold mt-1">1. Telemetry Trigger</div>
              <div className="text-[10px] opacity-80 mt-0.5">SpO2 ≤ 88% Anomaly</div>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeCall && activeCall.status !== 'QUEUED'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : activeCall?.status === 'QUEUED'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono opacity-70">00:02</div>
              <div className="font-bold mt-1">2. Agent Dispatched</div>
              <div className="text-[10px] opacity-80 mt-0.5">LiveKit Voice Agent</div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeCall &&
                (activeCall.status === 'RINGING' ||
                  activeCall.status === 'IN_PROGRESS' ||
                  activeCall.status === 'ACKNOWLEDGED')
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : activeCall?.status === 'INITIATED'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 animate-pulse'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono opacity-70">00:05</div>
              <div className="font-bold mt-1">3. SIP Dialing</div>
              <div className="text-[10px] opacity-80 mt-0.5">Doctor Mobile Rings</div>
            </div>

            {/* Step 4 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeCall && (activeCall.status === 'IN_PROGRESS' || activeCall.status === 'ACKNOWLEDGED')
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : activeCall?.status === 'RINGING'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 animate-pulse'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono opacity-70">00:09</div>
              <div className="font-bold mt-1">4. Doctor Answers</div>
              <div className="text-[10px] opacity-80 mt-0.5">WebRTC Stream Live</div>
            </div>

            {/* Step 5 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeCall?.status === 'ACKNOWLEDGED'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : activeCall?.status === 'IN_PROGRESS'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono opacity-70">00:18</div>
              <div className="font-bold mt-1">5. Verbal Ack</div>
              <div className="text-[10px] opacity-80 mt-0.5">"I am on it" / DTMF 1</div>
            </div>

            {/* Step 6 */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                activeCall?.status === 'ACKNOWLEDGED'
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-400/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-mono opacity-70">00:20</div>
              <div className="font-bold mt-1">6. Closed Loop</div>
              <div className="text-[10px] opacity-80 mt-0.5">EHR Audit Logged</div>
            </div>
          </div>

          {/* Granular Audit Event Feed */}
          {activeCall?.timeline && activeCall.timeline.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2 border-t border-slate-800/80">
              {activeCall.timeline.map((event: any, eIdx: number) => (
                <div
                  key={eIdx}
                  className="flex items-start justify-between text-[11px] p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200">{event.message}</span>
                    {event.actor && (
                      <div className="text-[10px] text-slate-400 font-sans">
                        Actor: <strong className="text-indigo-400">{event.actor}</strong>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-500 italic">
              Ready for acute telemetry anomaly trigger. Click "🚨 Trigger Escalation Call" or "Simulate Acute SpO2 Drop" to initiate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
