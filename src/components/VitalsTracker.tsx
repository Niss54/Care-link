import React, { useState, useMemo } from 'react';
import { Patient, VitalRecord } from '../types';
import { Heart, Activity, Thermometer, Plus, Clock, ShieldAlert, CheckCircle2, AlertTriangle, TrendingUp, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VitalsTrackerProps {
  patient: Patient;
  vitalRecords: VitalRecord[];
  onAddVitalRecord: (record: Omit<VitalRecord, 'id'>) => void;
}

export const VitalsTracker: React.FC<VitalsTrackerProps> = ({
  patient,
  vitalRecords,
  onAddVitalRecord
}) => {
  const [isInputOpen, setIsInputOpen] = useState(false);

  // Input states
  const [heartRate, setHeartRate] = useState<number | ''>(72);
  const [sysBP, setSysBP] = useState<number | ''>(120);
  const [diaBP, setDiaBP] = useState<number | ''>(80);
  const [temperature, setTemperature] = useState<number | ''>(98.6);
  const [notes, setNotes] = useState('');

  const patientVitals = vitalRecords.filter((v) => v.patientId === patient.id);
  const latestVital = patientVitals.length > 0 ? patientVitals[0] : null;

  // Evaluation helpers
  const getBPEvaluation = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20' };
    if (sys <= 129 && dia < 80) return { label: 'Elevated', color: 'text-[#ff9800] bg-[#ff9800]/10 border-[#ff9800]/20' };
    if (sys <= 139 || dia <= 89) return { label: 'Stage 1 High', color: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20' };
    return { label: 'Stage 2 High', color: 'text-[#ba1a1a] bg-[#ba1a1a]/10 border-[#ba1a1a]/20' };
  };

  const getHREvaluation = (hr: number) => {
    if (hr >= 60 && hr <= 100) return { label: 'Normal resting', color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20' };
    if (hr < 60) return { label: 'Bradycardia', color: 'text-[#ff9800] bg-[#ff9800]/10 border-[#ff9800]/20' };
    return { label: 'Tachycardia', color: 'text-[#ba1a1a] bg-[#ba1a1a]/10 border-[#ba1a1a]/20' };
  };

  const getTempEvaluation = (temp: number) => {
    if (temp >= 97.0 && temp <= 99.1) return { label: 'Normal', color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20' };
    if (temp > 99.1 && temp < 100.4) return { label: 'Low Grade Fever', color: 'text-[#ff9800] bg-[#ff9800]/10 border-[#ff9800]/20' };
    return { label: 'Fever', color: 'text-[#ba1a1a] bg-[#ba1a1a]/10 border-[#ba1a1a]/20' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heartRate || !sysBP || !diaBP || !temperature) return;

    const formattedTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    onAddVitalRecord({
      patientId: patient.id,
      timestamp: formattedTime,
      heartRate: Number(heartRate),
      bloodPressureSystolic: Number(sysBP),
      bloodPressureDiastolic: Number(diaBP),
      temperature: Number(temperature),
      recordedBy: 'Dr. Smith',
      notes: notes.trim() || 'Recorded via Vitals Tracker'
    });

    setNotes('');
    setIsInputOpen(false);
  };

  const bpStatus = latestVital
    ? getBPEvaluation(latestVital.bloodPressureSystolic, latestVital.bloodPressureDiastolic)
    : null;
  const hrStatus = latestVital ? getHREvaluation(latestVital.heartRate) : null;
  const tempStatus = latestVital ? getTempEvaluation(latestVital.temperature) : null;

  const chartData = useMemo(() => {
    return [...patientVitals].reverse().map(v => {
      // Create a short date label for the X-axis
      const dateStr = v.timestamp.split(' ')[0] || v.timestamp;
      const dateParts = dateStr.split('-');
      const shortDate = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : dateStr;
      
      return {
        timestamp: shortDate,
        heartRate: v.heartRate,
        sysBP: v.bloodPressureSystolic,
        diaBP: v.bloodPressureDiastolic
      };
    });
  }, [patientVitals]);

  return (
    <div className="space-y-6">
      {/* Latest Vitals Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Heart Rate Card */}
        <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#74777f] uppercase tracking-wider">Heart Rate</span>
            <div className="p-2 rounded-xl bg-[#ba1a1a]/10 text-[#ba1a1a]">
              <Heart className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#191c1e]">
                {latestVital ? latestVital.heartRate : '--'}
              </span>
              <span className="text-xs text-[#74777f] font-semibold">bpm</span>
            </div>
          </div>
          {hrStatus ? (
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${hrStatus.color} self-start`}>
              {hrStatus.label}
            </span>
          ) : (
            <span className="text-[10px] text-[#74777f]">No data recorded</span>
          )}
        </div>

        {/* Blood Pressure Card */}
        <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#74777f] uppercase tracking-wider">Blood Pressure</span>
            <div className="p-2 rounded-xl bg-[#316bf3]/10 text-[#316bf3]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#191c1e]">
                {latestVital
                  ? `${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic}`
                  : '--/--'}
              </span>
              <span className="text-xs text-[#74777f] font-semibold">mmHg</span>
            </div>
          </div>
          {bpStatus ? (
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${bpStatus.color} self-start`}>
              {bpStatus.label}
            </span>
          ) : (
            <span className="text-[10px] text-[#74777f]">No data recorded</span>
          )}
        </div>

        {/* Temperature Card */}
        <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#74777f] uppercase tracking-wider">Body Temperature</span>
            <div className="p-2 rounded-xl bg-[#ff9800]/10 text-[#ff9800]">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#191c1e]">
                {latestVital ? latestVital.temperature : '--'}
              </span>
              <span className="text-xs text-[#74777f] font-semibold">°F</span>
            </div>
          </div>
          {tempStatus ? (
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${tempStatus.color} self-start`}>
              {tempStatus.label}
            </span>
          ) : (
            <span className="text-[10px] text-[#74777f]">No data recorded</span>
          )}
        </div>
      </div>

      {/* Entry Toggle & Header */}
      <div className="flex items-center justify-between bg-[#f7f9fb] p-3.5 rounded-xl border border-[#e0e3e5]">
        <div>
          <h4 className="text-xs font-bold text-[#191c1e]">Real-Time Vitals Entry</h4>
          <p className="text-[11px] text-[#74777f]">Input fresh clinical observations for immediate chart update</p>
        </div>
        <button
          onClick={() => setIsInputOpen(!isInputOpen)}
          className="px-3.5 py-1.5 bg-[#316bf3] hover:bg-[#0051d5] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isInputOpen ? 'Close Form' : 'Log Fresh Vitals'}</span>
        </button>
      </div>

      {/* Input Form */}
      {isInputOpen && (
        <form onSubmit={handleSubmit} className="p-4 bg-white border border-[#316bf3]/30 rounded-2xl space-y-4 shadow-md animate-in fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3 text-[#ba1a1a]" /> Heart Rate (bpm) *
              </label>
              <input
                type="number"
                required
                min="30"
                max="220"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs font-bold text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#316bf3]" /> Systolic BP *
              </label>
              <input
                type="number"
                required
                min="60"
                max="250"
                value={sysBP}
                onChange={(e) => setSysBP(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs font-bold text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#316bf3]" /> Diastolic BP *
              </label>
              <input
                type="number"
                required
                min="40"
                max="150"
                value={diaBP}
                onChange={(e) => setDiaBP(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs font-bold text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-[#ff9800]" /> Temp (°F) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                min="90"
                max="108"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs font-bold text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#43474e] mb-1">Clinical Observation Notes</label>
            <input
              type="text"
              placeholder="e.g. Measured seated after 5 mins rest. Patient reports caffeine intake."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsInputOpen(false)}
              className="px-3 py-1.5 text-xs text-[#74777f] hover:text-[#191c1e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#316bf3] hover:bg-[#0051d5] text-white text-xs font-bold rounded-xl shadow"
            >
              Record Vitals
            </button>
          </div>
        </form>
      )}

      {/* Vitals Trend Chart */}
      {chartData.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-[#e0e3e5] shadow-sm">
          <h4 className="text-xs font-bold text-[#191c1e] mb-4 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#316bf3]" />
            Vitals Trend History
          </h4>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#74777f" tick={{ fill: '#74777f' }} />
                <YAxis yAxisId="left" stroke="#74777f" tick={{ fill: '#74777f' }} domain={['dataMin - 10', 'dataMax + 10']} />
                <YAxis yAxisId="right" orientation="right" stroke="#74777f" tick={{ fill: '#74777f' }} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#022448', borderColor: '#022448', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#adc8f5' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="sysBP" name="Systolic BP" stroke="#316bf3" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="left" type="monotone" dataKey="diaBP" name="Diastolic BP" stroke="#7bb0ff" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="heartRate" name="Heart Rate" stroke="#ba1a1a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historical Vitals Table */}
      <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden">
        <div className="p-3.5 bg-[#f7f9fb] border-b border-[#e0e3e5] flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#316bf3]" />
            Recorded Vitals Log ({patientVitals.length})
          </h4>
          <span className="text-[10px] text-[#74777f]">Real-time EHR entries</span>
        </div>

        {patientVitals.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#74777f]">
            No vital records found for this patient. Click 'Log Fresh Vitals' to submit an observation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f7f9fb]/50 border-b border-[#e0e3e5] text-[10px] font-bold text-[#74777f] uppercase">
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Heart Rate</th>
                  <th className="py-2.5 px-4">Blood Pressure</th>
                  <th className="py-2.5 px-4">Temperature</th>
                  <th className="py-2.5 px-4">Recorded By</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {patientVitals.map((v) => (
                  <tr key={v.id} className="hover:bg-[#f7f9fb] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#191c1e] whitespace-nowrap">{v.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-[#ba1a1a] whitespace-nowrap">{v.heartRate} bpm</td>
                    <td className="py-3 px-4 font-bold text-[#316bf3] whitespace-nowrap">
                      {v.bloodPressureSystolic}/{v.bloodPressureDiastolic} mmHg
                    </td>
                    <td className="py-3 px-4 font-bold text-[#ff9800] whitespace-nowrap">{v.temperature} °F</td>
                    <td className="py-3 px-4 text-[#43474e] whitespace-nowrap">{v.recordedBy || 'Clinician'}</td>
                    <td className="py-3 px-4 text-[#74777f] italic max-w-xs truncate">{v.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
