import React, { useMemo, useState } from 'react';
import { Patient, Appointment, ActivityItem, DoctorProfile, VitalRecord } from '../types';
import {
  Users,
  Calendar,
  FlaskConical,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  MoreVertical,
  Plus,
  TrendingUp,
  Activity,
  Heart,
  ChevronRight,
  FileText,
  X,
  Stethoscope
} from 'lucide-react';

interface DashboardViewProps {
  doctor: DoctorProfile;
  patients: Patient[];
  appointments: Appointment[];
  activities: ActivityItem[];
  vitalRecords?: VitalRecord[];
  onOpenScheduleModal: () => void;
  onOpenAddPatientModal: () => void;
  onSelectPatient: (patient: Patient) => void;
  onNavigateTab: (tab: 'patients' | 'calendar' | 'analytics') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  doctor,
  patients,
  appointments,
  activities,
  vitalRecords = [],
  onOpenScheduleModal,
  onOpenAddPatientModal,
  onSelectPatient,
  onNavigateTab
}) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [includeLogo, setIncludeLogo] = useState(false);
  const activePatientsCount = patients.filter((p) => p.status === 'Active').length;
  const todaysAppointmentsCount = appointments.length;

  const abnormalVitals = useMemo(() => {
    // Group vitals by patient to get the most recent one for each
    const latestVitalsMap = new Map<string, VitalRecord>();
    vitalRecords.forEach(record => {
      if (!latestVitalsMap.has(record.patientId)) {
        latestVitalsMap.set(record.patientId, record);
      } else {
        const existing = latestVitalsMap.get(record.patientId)!;
        // Basic string compare works here because format is YYYY-MM-DD HH:MM
        if (record.timestamp > existing.timestamp) {
          latestVitalsMap.set(record.patientId, record);
        }
      }
    });

    const abnormal: Array<{ patient: Patient; record: VitalRecord; reasons: string[]; severity: 'Critical' | 'Warning' }> = [];
    
    latestVitalsMap.forEach(record => {
      const reasons: string[] = [];
      let isCritical = false;
      if (record.bloodPressureSystolic > 160 || record.bloodPressureSystolic < 80) { reasons.push('BP Sys (Crit)'); isCritical = true; }
      else if (record.bloodPressureSystolic > 140 || record.bloodPressureSystolic < 90) reasons.push('BP Sys');
      
      if (record.bloodPressureDiastolic > 100 || record.bloodPressureDiastolic < 50) { reasons.push('BP Dia (Crit)'); isCritical = true; }
      else if (record.bloodPressureDiastolic > 90 || record.bloodPressureDiastolic < 60) reasons.push('BP Dia');
      
      if (record.heartRate > 120 || record.heartRate < 40) { reasons.push('HR (Crit)'); isCritical = true; }
      else if (record.heartRate > 100 || record.heartRate < 50) reasons.push('HR');
      
      if (record.temperature > 102.0 || record.temperature < 95.0) { reasons.push('Temp (Crit)'); isCritical = true; }
      else if (record.temperature > 100.4 || record.temperature < 96.0) reasons.push('Temp');

      if (reasons.length > 0) {
        const p = patients.find(p => p.id === record.patientId);
        if (p && !dismissedAlerts.has(p.id)) {
          abnormal.push({ patient: p, record, reasons, severity: isCritical ? 'Critical' : 'Warning' });
        }
      }
    });

    return abnormal.sort((a, b) => a.severity === 'Critical' ? -1 : 1);
  }, [vitalRecords, patients, dismissedAlerts]);

  return (
    <div className="space-y-6 pb-12">
      <div className="print:hidden space-y-6">
        {/* Abnormal Vitals Alerts */}
      {abnormalVitals.length > 0 && (
        <div className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-start gap-4">
          <div className="w-10 h-10 shrink-0 bg-[#ba1a1a]/20 rounded-full flex items-center justify-center text-[#ba1a1a]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#ba1a1a]">Critical Clinical Alerts ({abnormalVitals.length})</h3>
            <p className="text-xs text-[#ba1a1a]/80 mb-3">The following patients have abnormal recent vitals that require review.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {abnormalVitals.map(alert => (
                <div key={alert.patient.id} className={`bg-white p-3 rounded-xl border cursor-pointer hover:border-[#ba1a1a]/50 transition-all shadow-sm ${alert.severity === 'Critical' ? 'border-[#ba1a1a]/50 ring-1 ring-[#ba1a1a]/20' : 'border-[#ba1a1a]/20'}`}>
                  <div className="flex items-start justify-between mb-1.5 gap-2">
                    <div onClick={() => onSelectPatient(alert.patient)} className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#191c1e] hover:text-[#316bf3] transition-colors">{alert.patient.name}</span>
                        {alert.severity === 'Critical' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ba1a1a]/20 text-[#ba1a1a] font-bold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] mt-1 text-[#ba1a1a] font-semibold">
                        {alert.reasons.join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDismissedAlerts(prev => new Set(prev).add(alert.patient.id)); }}
                      className="text-[#74777f] hover:text-[#191c1e] hover:bg-[#f2f4f6] p-1 rounded-md transition-colors"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#74777f] mt-1" onClick={() => onSelectPatient(alert.patient)}>
                    <Clock className="w-3 h-3" />
                    {alert.record.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Good Morning Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#022448] via-[#1e3a5f] to-[#022448] text-white p-6 md:p-8 shadow-xl">
        {/* Subtle grid backdrop pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#316bf3_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#adc8f5]">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              Live Clinical Session Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good Morning, {doctor.name}
            </h1>
            <p className="text-sm text-[#adc8f5] leading-relaxed">
              You have <span className="font-semibold text-white">{todaysAppointmentsCount} scheduled consultations</span> today.
              Cardiology ward operating at 84% capacity with 0 critical telemetry flags.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenScheduleModal}
              className="px-4 py-2.5 rounded-xl bg-[#316bf3] hover:bg-[#0051d5] text-white font-semibold text-sm shadow-lg shadow-[#316bf3]/30 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Consult</span>
            </button>
            <button
              onClick={onOpenAddPatientModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Patients */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow hover:border-[#316bf3]/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase tracking-wider">Total Patients</span>
            <div className="w-10 h-10 rounded-xl bg-[#316bf3]/10 text-[#316bf3] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#191c1e]">247</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#10b981] font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.4% vs last month</span>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow hover:border-[#316bf3]/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase tracking-wider">Today's Consults</span>
            <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#191c1e]">{todaysAppointmentsCount}</p>
            <p className="text-xs text-[#74777f] mt-1 font-medium">3 completed • 1 in progress</p>
          </div>
        </div>

        {/* Pending Lab Reports */}
        <div className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase tracking-wider">Pending Lab Reports</span>
            <div className="w-10 h-10 rounded-xl bg-[#ff9800]/10 text-[#ff9800] flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#191c1e]">12</p>
            <p className="text-xs text-[#ff9800] mt-1 font-semibold">4 high priority lab panels</p>
          </div>
        </div>

        {/* Critical Vitals Alerts */}
        <div className="p-5 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#74777f] uppercase tracking-wider">Telemetry Alerts</span>
            <div className="w-10 h-10 rounded-xl bg-[#ba1a1a]/10 text-[#ba1a1a] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#ba1a1a]">2</p>
            <p className="text-xs text-[#ba1a1a] mt-1 font-semibold">Ward 3B arrhythmia warning</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Waveform + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Telemetry & Quick Patient List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Cardiology ECG Waveform Card */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ba1a1a]/10 text-[#ba1a1a] flex items-center justify-center">
                  <Heart className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191c1e]">Real-Time Telemetry Monitor</h3>
                  <p className="text-xs text-[#74777f]">Ward 4A • Bed 12 (M. Sterling)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-lg font-bold">
                  BPM: 74
                </span>
                <span className="font-mono bg-[#316bf3]/10 text-[#316bf3] px-2.5 py-1 rounded-lg font-bold">
                  SpO2: 98%
                </span>
              </div>
            </div>

            {/* Custom Animated ECG Waveform Graphic */}
            <div className="relative h-28 bg-[#022448] rounded-xl overflow-hidden p-2 flex items-center">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:16px_16px]" />
              <svg className="w-full h-full text-[#10b981]" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path
                  d="M 0 50 L 80 50 L 90 20 L 100 80 L 110 10 L 120 90 L 130 50 L 220 50 L 230 15 L 240 85 L 250 5 L 260 95 L 270 50 L 360 50 L 370 25 L 380 75 L 390 10 L 400 90 L 410 50 L 500 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute top-2 right-3 text-[10px] font-mono text-[#adc8f5] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                SWEEP: 25mm/s
              </div>
            </div>
          </div>

          {/* Today's Consultations List */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 card-shadow">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Today's Appointment Queue</h3>
                <p className="text-xs text-[#74777f]">Sorted chronologically for Oct 12</p>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-bold text-[#316bf3] hover:underline flex items-center gap-1"
              >
                <span>View All Appointments</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-[#f2f4f6]">
              {appointments.map((apt) => {
                const isCompleted = apt.status === 'Completed';
                const isInProgress = apt.status === 'In Progress';
                const isWaiting = apt.status === 'Waiting';

                return (
                  <div
                    key={apt.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#f7f9fb] px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center shrink-0">
                        <p className="text-xs font-bold text-[#191c1e]">{apt.time}</p>
                        <p className="text-[10px] text-[#74777f]">Slot</p>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {apt.patientInitials}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#191c1e]">{apt.patientName}</h4>
                        <p className="text-xs text-[#74777f]">
                          {apt.type} • <span className="font-medium text-[#43474e]">{apt.department}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          isCompleted
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : isInProgress
                            ? 'bg-[#316bf3]/15 text-[#316bf3] animate-pulse'
                            : isWaiting
                            ? 'bg-[#ff9800]/15 text-[#ff9800]'
                            : 'bg-[#74777f]/15 text-[#74777f]'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 card-shadow">
            <h3 className="text-base font-bold text-[#191c1e] mb-4 flex items-center justify-between">
              <span>Activity Feed</span>
              <span className="text-xs font-semibold text-[#316bf3]">Live Updates</span>
            </h3>

            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${act.statusColor || 'bg-[#316bf3]'}`} />
                  <div>
                    <p className="font-semibold text-[#191c1e]">{act.description}</p>
                    <p className="text-[11px] text-[#74777f] mt-0.5">{act.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="bg-[#022448] text-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#adc8f5]">Quick Clinical Actions</h3>

            <div className="space-y-2">
              <button
                onClick={onOpenScheduleModal}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3 text-xs font-semibold"
              >
                <Calendar className="w-4 h-4 text-[#316bf3]" />
                <span>Book New Consultation</span>
              </button>

              <button
                onClick={onOpenAddPatientModal}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3 text-xs font-semibold"
              >
                <Users className="w-4 h-4 text-[#10b981]" />
                <span>Register New Patient</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3 text-xs font-semibold"
              >
                <FileText className="w-4 h-4 text-[#adc8f5]" />
                <span>Download EOD Report (PDF)</span>
              </button>
              
              <div className="flex items-center gap-2 mt-2 px-1">
                <input
                  type="checkbox"
                  id="includeLogo"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="rounded border-[#e0e3e5] text-[#316bf3] focus:ring-[#316bf3]"
                />
                <label htmlFor="includeLogo" className="text-xs text-white/80 cursor-pointer">
                  Include Clinic Logo
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* End of Day Report - Print Only */}
      <div className="hidden print:block p-8 max-w-4xl mx-auto bg-white">
        {includeLogo && (
          <div className="mb-6 flex items-center gap-3 border-b-4 border-[#316bf3] pb-4">
            <div className="w-12 h-12 bg-[#316bf3] rounded-lg flex items-center justify-center text-white">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#022448]">CareLink Hospital Network</h2>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Cardiology Division</p>
            </div>
          </div>
        )}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-200">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">End-of-Day Clinical Summary</h1>
            <p className="text-sm text-gray-500 mt-1">Generated by CareLink EHR System</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-bold">{doctor.name}, {doctor.title}</p>
            <p>{doctor.department} Department</p>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide border-b pb-2">Consultation Log</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Time</th>
                <th className="p-3 font-semibold text-gray-700">Patient</th>
                <th className="p-3 font-semibold text-gray-700">Encounter Type</th>
                <th className="p-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map(apt => (
                <tr key={apt.id}>
                  <td className="p-3 font-medium">{apt.time}</td>
                  <td className="p-3">{apt.patientName}</td>
                  <td className="p-3 text-gray-600">{apt.type}</td>
                  <td className="p-3 font-semibold">{apt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wide border-b pb-2">System Activity Log</h2>
          <ul className="space-y-3">
            {activities.map(act => (
              <li key={act.id} className="text-sm flex gap-4">
                <span className="text-gray-500 w-32 shrink-0">{act.timestamp}</span>
                <span className="text-gray-900">{act.description}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between items-end">
          <div className="text-sm text-gray-500">
            <p>Report ID: EOD-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            <p>Confidential Medical Record</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-sm font-bold">{doctor.name} Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
