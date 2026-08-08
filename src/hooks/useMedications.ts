import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Medication } from '../types';

// Map Supabase snake_case → Medication camelCase
const mapRow = (row: any): Medication => ({
  id: row.id,
  patientId: row.patient_id,
  name: row.name,
  dosage: row.dosage,
  frequency: row.frequency,
  prescribedDate: row.prescribed_date,
  status: row.status,
  refillsRemaining: row.refills_remaining,
  doctor: row.doctor,
  notes: row.notes,
});

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('medications')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    else setMedications((data || []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const addMedication = async (newMed: Medication) => {
    const { data: ud } = await supabase.auth.getUser();
    const { data, error: err } = await supabase.from('medications').insert({
      id: newMed.id,
      patient_id: newMed.patientId,
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      prescribed_date: newMed.prescribedDate,
      status: newMed.status,
      refills_remaining: newMed.refillsRemaining,
      doctor: newMed.doctor,
      notes: newMed.notes,
      user_id: ud.user?.id,
    }).select().single();

    if (!err && data) setMedications(prev => [mapRow(data), ...prev]);
    return { error: err };
  };

  const refillMedication = async (id: string) => {
    const med = medications.find(m => m.id === id);
    if (!med) return { error: { message: 'Not found' } };
    
    const newRefills = Math.max(0, med.refillsRemaining - 1);
    const { error: err } = await supabase.from('medications')
      .update({ status: 'Active', refills_remaining: newRefills })
      .eq('id', id);
      
    if (!err) setMedications(prev => prev.map(m => m.id === id ? { ...m, status: 'Active', refillsRemaining: newRefills } : m));
    return { error: err };
  };

  const archiveMedication = async (id: string) => {
    const med = medications.find(m => m.id === id);
    if (!med) return { error: { message: 'Not found' } };
    
    const newStatus = med.status === 'Archived' ? 'Active' : 'Archived';
    const { error: err } = await supabase.from('medications').update({ status: newStatus }).eq('id', id);
    
    if (!err) setMedications(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    return { error: err };
  };

  return { medications, loading, error, addMedication, refillMedication, archiveMedication, refetch: fetchMedications };
}
