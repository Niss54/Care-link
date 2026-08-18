import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Medication } from '../types';

const mapMedicationRow = (row: any): Medication => ({
  id: row.id,
  patientId: row.patient_id,
  name: row.name,
  dosage: row.dosage,
  frequency: row.frequency,
  prescribedDate: row.start_date || row.created_at?.split('T')[0],
  status: row.status,
  refillsRemaining: row.refills_remaining,
  doctor: 'Assigned Physician', // Ideally joined from doctors table
  notes: '', // Not in schema, but part of UI types
});

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // RLS handles filtering so this only returns meds for the doctor's patients
      const { data, error: err } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMedications((data || []).map(mapMedicationRow));
    } catch (err: any) {
      console.error('Error fetching medications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();

    const channel = supabase
      .channel('public:medications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => {
        fetchMedications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMedications]);

  const addMedication = async (newMed: Omit<Medication, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error: err } = await supabase.from('medications').insert({
        patient_id: newMed.patientId,
        name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        start_date: newMed.prescribedDate,
        status: newMed.status,
        refills_remaining: newMed.refillsRemaining,
        prescribed_by: userData.user.id,
      }).select().single();

      if (err) throw err;
      
      if (data) {
        setMedications(prev => [mapMedicationRow(data), ...prev]);
      }
      return { error: null };
    } catch (err: any) {
      console.error('Error adding medication:', err);
      return { error: err };
    }
  };

  const refillMedication = async (id: string) => {
    try {
      const med = medications.find(m => m.id === id);
      if (!med) throw new Error('Not found');
      
      const newRefills = Math.max(0, med.refillsRemaining - 1);
      const { error: err } = await supabase.from('medications')
        .update({ status: 'Active', refills_remaining: newRefills })
        .eq('id', id);
        
      if (err) throw err;
      
      setMedications(prev => prev.map(m => m.id === id ? { ...m, status: 'Active', refillsRemaining: newRefills } : m));
      return { error: null };
    } catch (err: any) {
      console.error('Error refilling medication:', err);
      return { error: err };
    }
  };

  const archiveMedication = async (id: string) => {
    try {
      const med = medications.find(m => m.id === id);
      if (!med) throw new Error('Not found');
      
      const newStatus = med.status === 'Archived' ? 'Active' : 'Archived';
      const { error: err } = await supabase.from('medications')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (err) throw err;
      
      setMedications(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      return { error: null };
    } catch (err: any) {
      console.error('Error archiving medication:', err);
      return { error: err };
    }
  };

  return { medications, loading, error, addMedication, refillMedication, archiveMedication, refetch: fetchMedications };
}
