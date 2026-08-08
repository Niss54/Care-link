import React, { useState } from 'react';
import { Medication, Patient } from '../types';
import { Pill, Plus, RefreshCw, Archive, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight, Filter } from 'lucide-react';

interface MedicationsTabProps {
  patient: Patient;
  medications: Medication[];
  onRefillMedication: (medicationId: string) => void;
  onArchiveMedication: (medicationId: string) => void;
  onAddMedication: (newMed: Omit<Medication, 'id'>) => void;
}

export const MedicationsTab: React.FC<MedicationsTabProps> = ({
  patient,
  medications,
  onRefillMedication,
  onArchiveMedication,
  onAddMedication
}) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Archived'>('Active');
  const [isAdding, setIsAdding] = useState(false);

  // Form state for new prescription
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [refills, setRefills] = useState(3);
  const [notes, setNotes] = useState('');
  const [interactionAlert, setInteractionAlert] = useState<string | null>(null);

  const patientMeds = medications.filter((m) => m.patientId === patient.id);
  
  // Basic interaction checking map
  const knownInteractions: Record<string, string[]> = {
    'lisinopril': ['potassium', 'spironolactone'],
    'warfarin': ['aspirin', 'ibuprofen', 'amiodarone'],
    'atorvastatin': ['clarithromycin', 'itraconazole'],
    'sildenafil': ['nitroglycerin', 'isosorbide'],
    'clopidogrel': ['omeprazole'],
  };

  const checkForInteractions = (newMedName: string) => {
    const medNameLower = newMedName.toLowerCase().trim();
    const activeMedNames = patientMeds
      .filter(m => m.status === 'Active')
      .map(m => m.name.toLowerCase());
      
    // Check if new med is in our interaction map
    let alertMsg = null;
    
    // Check if new med interacts with any active med
    if (knownInteractions[medNameLower]) {
      const conflicts = activeMedNames.filter(am => knownInteractions[medNameLower].includes(am));
      if (conflicts.length > 0) {
        alertMsg = `Potential interaction detected: ${newMedName} may interact with ${conflicts.join(', ')}.`;
      }
    }
    
    // Check if active meds interact with new med
    activeMedNames.forEach(am => {
      if (knownInteractions[am] && knownInteractions[am].includes(medNameLower)) {
        alertMsg = `Potential interaction detected: ${newMedName} may interact with ${am}.`;
      }
    });

    setInteractionAlert(alertMsg);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    checkForInteractions(e.target.value);
  };

  const filteredMeds = patientMeds.filter((m) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return m.status === 'Active' || m.status === 'Refill Requested';
    if (filter === 'Archived') return m.status === 'Archived';
    return true;
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    onAddMedication({
      patientId: patient.id,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      prescribedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      refillsRemaining: Number(refills) || 0,
      doctor: 'Dr. Smith',
      notes: notes.trim()
    });

    setName('');
    setDosage('');
    setFrequency('Once daily');
    setRefills(3);
    setNotes('');
    setInteractionAlert(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-5">
      {/* Action Bar & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f7f9fb] p-3.5 rounded-xl border border-[#e0e3e5]">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#74777f]" />
          <span className="text-xs font-semibold text-[#43474e] mr-1">Filter:</span>
          {(['Active', 'Archived', 'All'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === status
                  ? 'bg-[#022448] text-white shadow-sm'
                  : 'bg-white text-[#43474e] border border-[#e0e3e5] hover:bg-[#f2f4f6]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setIsAdding(!isAdding); setInteractionAlert(null); }}
          className="px-3.5 py-1.5 bg-[#316bf3] hover:bg-[#0051d5] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Cancel' : 'New Prescription'}</span>
        </button>
      </div>

      {/* Add Prescription Drawer / Form */}
      {isAdding && (
        <form onSubmit={handleSubmitNew} className="p-4 bg-white border border-[#316bf3]/30 rounded-2xl space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-2">
            <h4 className="text-xs font-bold text-[#022448] uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-[#316bf3]" />
              Prescribe New Medication
            </h4>
            <span className="text-[11px] text-[#74777f]">Patient: {patient.name}</span>
          </div>

          {interactionAlert && (
            <div className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-[#ba1a1a]">{interactionAlert}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1">Medication Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lisinopril, Metformin"
                value={name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1">Dosage *</label>
              <input
                type="text"
                required
                placeholder="e.g. 10mg, 500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              >
                <option value="Once daily in morning">Once daily in morning</option>
                <option value="Once daily at bedtime">Once daily at bedtime</option>
                <option value="Twice daily with meals">Twice daily with meals</option>
                <option value="Three times daily">Three times daily</option>
                <option value="As needed for pain">As needed for pain</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#43474e] mb-1">Refills Authorized</label>
              <input
                type="number"
                min="0"
                max="12"
                value={refills}
                onChange={(e) => setRefills(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#43474e] mb-1">Clinical Notes / Instructions</label>
            <input
              type="text"
              placeholder="e.g. Take with water. Monitor kidney panel."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-[#74777f] hover:text-[#191c1e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow"
            >
              Save Prescription
            </button>
          </div>
        </form>
      )}

      {/* Medications List */}
      {filteredMeds.length === 0 ? (
        <div className="p-8 text-center bg-[#f7f9fb] rounded-2xl border border-dashed border-[#c4c6cf]">
          <Pill className="w-8 h-8 text-[#74777f] mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold text-[#191c1e]">No Medications Found</p>
          <p className="text-[11px] text-[#74777f] mt-0.5">
            {filter === 'Active'
              ? 'No active prescriptions recorded for this patient.'
              : 'No prescription records matching the selected status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeds.map((med) => {
            const isArchived = med.status === 'Archived';
            const isRefillReq = med.status === 'Refill Requested';

            return (
              <div
                key={med.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isArchived
                    ? 'bg-[#f7f9fb] border-[#e0e3e5] opacity-75'
                    : 'bg-white border-[#e0e3e5] hover:border-[#316bf3]/40 shadow-sm'
                }`}
              >
                {/* Info */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      isArchived
                        ? 'bg-[#e0e3e5] text-[#74777f]'
                        : isRefillReq
                        ? 'bg-[#ff9800]/15 text-[#ff9800]'
                        : 'bg-[#316bf3]/10 text-[#316bf3]'
                    }`}
                  >
                    <Pill className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#191c1e]">{med.name}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-[#f2f4f6] text-[#43474e] rounded-md border border-[#e0e3e5]">
                        {med.dosage}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isArchived
                            ? 'bg-[#74777f]/15 text-[#74777f]'
                            : isRefillReq
                            ? 'bg-[#ff9800]/15 text-[#ff9800]'
                            : 'bg-[#10b981]/15 text-[#10b981]'
                        }`}
                      >
                        {med.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#43474e] mt-1 flex items-center gap-1.5">
                      <span>{med.frequency}</span>
                      <span>•</span>
                      <span>Prescribed by {med.doctor}</span>
                    </p>

                    {med.notes && (
                      <p className="text-[11px] text-[#74777f] mt-1 flex items-center gap-1 italic">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>"{med.notes}"</span>
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#74777f] mt-2">
                      <span>Date: {med.prescribedDate}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#191c1e]">
                        {med.refillsRemaining} Refills Remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f2f4f6]">
                  {!isArchived && (
                    <button
                      onClick={() => onRefillMedication(med.id)}
                      className="px-3 py-1.5 bg-[#316bf3]/10 hover:bg-[#316bf3] text-[#316bf3] hover:text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                      title="Authorize Refill"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refill</span>
                    </button>
                  )}

                  <button
                    onClick={() => onArchiveMedication(med.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                      isArchived
                        ? 'bg-white border-[#c4c6cf] text-[#43474e] hover:bg-[#f2f4f6]'
                        : 'bg-[#f2f4f6] border-[#e0e3e5] text-[#74777f] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40'
                    }`}
                    title={isArchived ? 'Restore Prescription' : 'Archive Prescription'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
