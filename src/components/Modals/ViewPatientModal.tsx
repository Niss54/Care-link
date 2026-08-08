import React, { useState } from 'react';
import { Patient, Medication, VitalRecord, Appointment, LabResult } from '../../types';
import { X, Calendar, Mail, Phone, Heart, Activity, FileText, Stethoscope, Clock, ShieldCheck, Printer, Pill, Thermometer, UserCheck, AlertTriangle, Mic, MicOff, FlaskConical, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { MedicationsTab } from '../MedicationsTab';
import { calculateAge } from '../../utils';
import { VitalsTracker } from '../VitalsTracker';

interface ViewPatientModalProps {
  patient: Patient | null;
  onClose: () => void;
  onScheduleForPatient?: (patientName: string) => void;
  medications: Medication[];
  vitalRecords: VitalRecord[];
  labRecords?: LabResult[];
  appointments: Appointment[];
  onRefillMedication: (id: string) => void;
  onArchiveMedication: (id: string) => void;
  onAddMedication: (newMed: Omit<Medication, 'id'>) => void;
  onAddVitalRecord: (record: Omit<VitalRecord, 'id'>) => void;
  onUpdatePatientNotes: (id: string, notes: string) => void;
}

export const ViewPatientModal: React.FC<ViewPatientModalProps> = ({
  patient,
  onClose,
  onScheduleForPatient,
  medications,
  vitalRecords,
  labRecords = [],
  appointments,
  onRefillMedication,
  onArchiveMedication,
  onAddMedication,
  onAddVitalRecord,
  onUpdatePatientNotes
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'medications' | 'vitals' | 'timeline' | 'labs'>('overview');
  const [notesDraft, setNotesDraft] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDictating, setIsDictating] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (currentTranscript) {
        setNotesDraft(prev => (prev + ' ' + currentTranscript).trim());
        setSaveStatus('saving');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onUpdatePatientNotes(patient!.id, (notesDraft + ' ' + currentTranscript).trim());
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);
      }
    };
    recognition.onerror = () => setIsDictating(false);
    recognition.onend = () => setIsDictating(false);
    recognition.start();
    
    // Attach recognition object so we can stop it later
    (window as any)._currentRecognition = recognition;
  };

  const stopDictation = () => {
    if ((window as any)._currentRecognition) {
      (window as any)._currentRecognition.stop();
    }
    setIsDictating(false);
  };

  if (!patient) return null;

  const handleEditNotes = () => {
    setNotesDraft(patient.notes || '');
    setIsEditingNotes(true);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesDraft(val);
    setSaveStatus('saving');
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdatePatientNotes(patient.id, val);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleSaveNotes = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onUpdatePatientNotes(patient.id, notesDraft);
    setIsEditingNotes(false);
    setSaveStatus('idle');
  };

  const isPending = patient.status === 'Pending';
  const isActive = patient.status === 'Active';

  const handlePrint = () => {
    window.print();
  };

  const patientMeds = medications.filter((m) => m.patientId === patient.id);
  const patientVitals = vitalRecords.filter((v) => v.patientId === patient.id);
  const latestVital = patientVitals.length > 0 ? patientVitals[0] : null;
  const patientAppointments = appointments.filter((a) => a.patientName === patient.name || a.patientInitials === patient.initials); // naive match

  const medicationAlerts = patientMeds.filter(m => m.status === 'Active' && m.refillsRemaining === 0);

  const timelineEvents = [
    ...patientAppointments.map(a => ({
      id: a.id,
      date: new Date(a.date).getTime(),
      displayDate: a.date,
      type: 'appointment',
      title: `Appointment: ${a.type}`,
      desc: `Status: ${a.status}. Doctor: ${a.doctor}. ${a.notes || ''}`
    })),
    ...patientMeds.map(m => ({
      id: m.id,
      date: new Date(m.prescribedDate).getTime(),
      displayDate: m.prescribedDate,
      type: 'medication',
      title: `Prescribed: ${m.name}`,
      desc: `Dosage: ${m.dosage}. Frequency: ${m.frequency}. Doctor: ${m.doctor}`
    })),
    ...patientVitals.map(v => ({
      id: v.id,
      date: new Date(v.timestamp).getTime(),
      displayDate: v.timestamp.split(' ')[0],
      type: 'vital',
      title: 'Vitals Logged',
      desc: `BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}, HR: ${v.heartRate}. By: ${v.recordedBy || 'Unknown'}`
    }))
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#e0e3e5] shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col printable-patient-report">
        
        {/* Banner Header */}
        <div className="bg-[#022448] text-white p-5 sm:p-6 relative shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-[#adc8f5] hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15"
              title="Print Clinical Patient Summary"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Patient Summary</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#adc8f5] hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Watermark Header */}
          <div className="hidden print:block mb-4 pb-2 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-wider">CareLink Clinical Network</h1>
                <p className="text-xs text-[#adc8f5]">Electronic Health Record (EHR) Patient Summary Report</p>
              </div>
              <div className="text-right text-xs text-[#adc8f5]">
                <p>Printed: {new Date().toLocaleDateString()}</p>
                <p>Facility ID: CLINIC-NORTH-842</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 pr-32 print:pr-0">
            <div className="relative shrink-0">
              {patient.avatarUrl ? (
                <img
                  src={patient.avatarUrl}
                  alt={patient.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f] text-white font-bold text-2xl flex items-center justify-center ring-4 ring-white/20">
                  {patient.initials}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#022448] no-print ${
                  isActive ? 'bg-[#10b981]' : isPending ? 'bg-[#ff9800]' : 'bg-[#74777f]'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold bg-white/10 px-2 py-0.5 rounded text-[#adc8f5]">
                  {patient.id}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      : isPending
                      ? 'bg-[#ff9800]/20 text-[#ff9800] border border-[#ff9800]/30'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {patient.status}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">{patient.name}</h2>
              <p className="text-xs text-[#adc8f5] mt-0.5 flex items-center gap-2">
                <span>DOB: {patient.dob} ({calculateAge(patient.dob)} yrs)</span>
                <span>•</span>
                <span>Dept: {patient.department || 'Cardiology'}</span>
              </p>
            </div>
          </div>

          {/* Modal Tab Controls (Hidden during print) */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/10 pt-4 no-print overflow-x-auto">
            <button
              onClick={() => setActiveModalTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeModalTab === 'overview'
                  ? 'bg-white text-[#022448] shadow-md'
                  : 'bg-white/10 text-[#adc8f5] hover:text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveModalTab('medications')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeModalTab === 'medications'
                  ? 'bg-white text-[#022448] shadow-md'
                  : 'bg-white/10 text-[#adc8f5] hover:text-white hover:bg-white/20'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Medications ({patientMeds.length})</span>
            </button>

            <button
              onClick={() => setActiveModalTab('vitals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeModalTab === 'vitals'
                  ? 'bg-white text-[#022448] shadow-md'
                  : 'bg-white/10 text-[#adc8f5] hover:text-white hover:bg-white/20'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Vitals Tracker ({patientVitals.length})</span>
            </button>
            <button
              onClick={() => setActiveModalTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeModalTab === 'timeline'
                  ? 'bg-white text-[#022448] shadow-md'
                  : 'bg-white/10 text-[#adc8f5] hover:text-white hover:bg-white/20'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-[#f7f9fb]">
          {/* Medication Alerts */}
          {medicationAlerts.length > 0 && (
            <div className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-xl p-3 flex items-start gap-3 no-print">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#ba1a1a]">Medication Alert</h4>
                <p className="text-xs text-[#ba1a1a]/80 mt-1">
                  The following prescriptions have 0 refills remaining and require attention: 
                  <span className="font-semibold text-[#ba1a1a]"> {medicationAlerts.map(m => m.name).join(', ')}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Print-Only Layout Rendering (Always shows complete overview, medications, and vitals when printed) */}
          <div className="hidden print:block space-y-6">
            {/* Demographics & Contact Block */}
            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Patient Demographics</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div><span className="font-semibold">Email:</span> {patient.email || 'N/A'}</div>
                <div><span className="font-semibold">Phone:</span> {patient.phone || 'N/A'}</div>
                <div><span className="font-semibold">Registered:</span> {patient.dateAdded || 'Oct 2023'}</div>
              </div>
            </div>

            {/* Vitals Section for Print */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Vitals Log & Metrics</h3>
              {latestVital ? (
                <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                  <div className="p-2 border rounded">BP: {latestVital.bloodPressureSystolic}/{latestVital.bloodPressureDiastolic} mmHg</div>
                  <div className="p-2 border rounded">HR: {latestVital.heartRate} bpm</div>
                  <div className="p-2 border rounded">Temp: {latestVital.temperature} °F</div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No vitals logged.</p>
              )}
            </div>

            {/* Active Prescriptions for Print */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Active Prescriptions</h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-2">Medication</th>
                    <th className="p-2">Dosage</th>
                    <th className="p-2">Frequency</th>
                    <th className="p-2">Prescribed By</th>
                  </tr>
                </thead>
                <tbody>
                  {patientMeds.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="p-2 font-bold">{m.name}</td>
                      <td className="p-2">{m.dosage}</td>
                      <td className="p-2">{m.frequency}</td>
                      <td className="p-2">{m.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Physician Notes for Print */}
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Physician Clinical Summary</h3>
              <p className="p-3 border rounded text-xs leading-relaxed">{patient.notes || 'No flags noted.'}</p>
            </div>

            {/* Signature Block */}
            <div className="pt-8 border-t border-gray-300 mt-8 flex justify-between items-end text-xs">
              <div>
                <p className="font-bold">Attending Physician: Dr. Smith</p>
                <p className="text-gray-500">Director of Clinical Care</p>
              </div>
              <div className="text-right">
                <div className="w-48 border-b border-black mb-1"></div>
                <p className="text-gray-500">Physician Signature & Date</p>
              </div>
            </div>
          </div>

          {/* Interactive Screen View */}
          <div className="print:hidden">
            {activeModalTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Quick Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5]">
                    <p className="text-[10px] font-semibold text-[#74777f] uppercase tracking-wider">Blood Pressure</p>
                    <p className="text-base font-bold text-[#191c1e] mt-1 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#ba1a1a]" />
                      {latestVital
                        ? `${latestVital.bloodPressureSystolic} / ${latestVital.bloodPressureDiastolic}`
                        : '120 / 80'}
                    </p>
                    <p className="text-[10px] text-[#10b981] font-medium mt-0.5">
                      {latestVital ? 'Recent Observation' : 'Baseline assessment'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5]">
                    <p className="text-[10px] font-semibold text-[#74777f] uppercase tracking-wider">Heart Rate</p>
                    <p className="text-base font-bold text-[#191c1e] mt-1 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#316bf3]" />
                      {latestVital ? `${latestVital.heartRate} bpm` : '72 bpm'}
                    </p>
                    <p className="text-[10px] text-[#10b981] font-medium mt-0.5">Resting rate</p>
                  </div>

                  <div className="p-3.5 bg-[#f2f4f6] rounded-xl border border-[#e0e3e5]">
                    <p className="text-[10px] font-semibold text-[#74777f] uppercase tracking-wider">Last Visit</p>
                    <p className="text-base font-bold text-[#191c1e] mt-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#0051d5]" />
                      {patient.lastVisit}
                    </p>
                    <p className="text-[10px] text-[#74777f] font-medium mt-0.5">Routine Consult</p>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-[#e0e3e5] py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#316bf3]/10 flex items-center justify-center text-[#316bf3]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#74777f] font-medium uppercase">Email Address</p>
                      <p className="text-xs font-semibold text-[#191c1e]">{patient.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#74777f] font-medium uppercase">Contact Phone</p>
                      <p className="text-xs font-semibold text-[#191c1e]">{patient.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#316bf3]" />
                      Physician Summary & Medical History
                    </h4>
                    {!isEditingNotes && (
                      <button
                        onClick={handleEditNotes}
                        className="text-[10px] font-bold text-[#316bf3] hover:underline"
                      >
                        Edit Notes
                      </button>
                    )}
                  </div>
                  
                  {isEditingNotes ? (
                    <div className="space-y-2 relative">
                      <textarea
                        value={notesDraft}
                        onChange={handleNotesChange}
                        className="w-full p-3 bg-white border border-[#316bf3] rounded-xl text-xs text-[#191c1e] min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#316bf3]/20"
                        placeholder="Add clinical observations..."
                      />
                      {saveStatus !== 'idle' && (
                        <div className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          saveStatus === 'saving' ? 'bg-[#316bf3]/10 text-[#316bf3]' : 'bg-[#10b981]/10 text-[#10b981]'
                        }`}>
                          {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <button
                          type="button"
                          onClick={isDictating ? stopDictation : startDictation}
                          className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                            isDictating 
                              ? 'bg-[#ba1a1a]/10 text-[#ba1a1a] animate-pulse' 
                              : 'bg-[#f2f4f6] text-[#43474e] hover:bg-[#e0e3e5]'
                          }`}
                        >
                          {isDictating ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          {isDictating ? 'Stop Dictating' : 'Dictate'}
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setIsEditingNotes(false); if (timeoutRef.current) clearTimeout(timeoutRef.current); stopDictation(); }}
                            className="px-3 py-1.5 text-[11px] font-semibold text-[#74777f] hover:text-[#191c1e]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveNotes}
                            className="px-3 py-1.5 bg-[#316bf3] text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-[#0051d5]"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl text-xs text-[#43474e] leading-relaxed whitespace-pre-wrap min-h-[60px]">
                      {patient.notes || 'No recent clinical flags or allergies reported.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeModalTab === 'medications' && (
              <div className="animate-in fade-in">
                <MedicationsTab
                  patient={patient}
                  medications={medications}
                  onRefillMedication={onRefillMedication}
                  onArchiveMedication={onArchiveMedication}
                  onAddMedication={onAddMedication}
                />
              </div>
            )}

            {activeModalTab === 'vitals' && (
              <div className="animate-in fade-in bg-white rounded-xl p-4 shadow-sm">
                <VitalsTracker
                  patient={patient}
                  vitalRecords={vitalRecords}
                  onAddVitalRecord={onAddVitalRecord}
                />
              </div>
            )}

            {activeModalTab === 'timeline' && (
              <div className="animate-in fade-in bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider mb-6">Patient History Timeline</h3>
                
                {timelineEvents.length === 0 ? (
                  <p className="text-xs text-[#74777f]">No historical events recorded for this patient.</p>
                ) : (
                  <div className="relative border-l-2 border-[#e0e3e5] ml-3 md:ml-4 space-y-6">
                    {timelineEvents.map((event, index) => (
                      <div key={`${event.id}-${index}`} className="relative pl-6 md:pl-8">
                        <div 
                          className={`absolute w-5 h-5 rounded-full border-2 border-white -left-[11px] top-0 flex items-center justify-center
                            ${event.type === 'appointment' ? 'bg-[#316bf3]' : 
                              event.type === 'medication' ? 'bg-[#10b981]' : 
                              'bg-[#ff9800]'}`}
                        >
                          {event.type === 'appointment' && <Calendar className="w-2.5 h-2.5 text-white" />}
                          {event.type === 'medication' && <Pill className="w-2.5 h-2.5 text-white" />}
                          {event.type === 'vital' && <Activity className="w-2.5 h-2.5 text-white" />}
                        </div>
                        
                        <div className="bg-[#f7f9fb] p-3 rounded-xl border border-[#e0e3e5]">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-xs font-bold text-[#191c1e]">{event.title}</h4>
                            <span className="text-[10px] font-semibold text-[#74777f]">{event.displayDate}</span>
                          </div>
                          <p className="text-[11px] text-[#43474e] leading-relaxed">{event.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#f7f9fb] border-t border-[#e0e3e5] shrink-0 no-print">
          <span className="text-[11px] text-[#74777f]">Record created: {patient.dateAdded || 'Oct 2023'}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#022448] bg-white border border-[#c4c6cf] hover:bg-[#f2f4f6] flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#316bf3]" />
              <span>Print Summary</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#43474e] hover:bg-[#e0e3e5]/50"
            >
              Close
            </button>
            {onScheduleForPatient && (
              <button
                onClick={() => {
                  onScheduleForPatient(patient.name);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#316bf3] text-white hover:bg-[#0051d5] shadow-md shadow-[#316bf3]/20 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Consultation</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

