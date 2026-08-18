import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Patient, PatientStatus } from '../types';

const mapPatientRow = (row: any): Patient => ({
  id: row.id,
  name: row.name,
  dob: row.dob,
  gender: row.gender,
  lastVisit: row.last_visit,
  status: row.status as PatientStatus,
  avatarUrl: row.avatar_url,
  initials: row.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
  email: row.email,
  phone: row.phone,
  department: row.department,
  notes: row.notes,
  dateAdded: row.created_at,
  // New fields from schema
  external_ref: row.id, // using id as external_ref for ML
});

export function usePatients(searchQuery: string = '') {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('patients')
        .select('*')
        .order('risk_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setPatients((data || []).map(mapPatientRow));
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPatients();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        // Trigger a refetch on any change to keep it simple and handle search/sort correctly
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients]);

  const addPatient = async (newPatient: Omit<Patient, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error: err } = await supabase.from('patients').insert({
        doctor_id: userData.user.id,
        name: newPatient.name,
        dob: newPatient.dob,
        gender: newPatient.gender,
        last_visit: newPatient.lastVisit,
        status: newPatient.status,
        avatar_url: newPatient.avatarUrl,
        email: newPatient.email,
        phone: newPatient.phone,
        notes: newPatient.notes,
      }).select().single();

      if (err) throw err;
      
      // Optimistic UI update (will be overridden by realtime fetch soon anyway)
      if (data) {
        setPatients(prev => [mapPatientRow(data), ...prev]);
      }
      return { error: null };
    } catch (err: any) {
      console.error('Error adding patient:', err);
      return { error: err };
    }
  };

  const deletePatient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return { error: null };
    
    try {
      const { error: err } = await supabase.from('patients').delete().eq('id', id);
      if (err) throw err;
      
      // Optimistic UI update
      setPatients(prev => prev.filter(p => p.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      return { error: err };
    }
  };

  const updatePatientNotes = async (id: string, notes: string) => {
    try {
      const { error: err } = await supabase.from('patients').update({ notes }).eq('id', id);
      if (err) throw err;
      
      // Optimistic UI update
      setPatients(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
      return { error: null };
    } catch (err: any) {
      console.error('Error updating patient notes:', err);
      return { error: err };
    }
  };

  return { 
    patients, 
    loading, 
    error, 
    addPatient, 
    deletePatient, 
    updatePatientNotes, 
    refetchPatients: fetchPatients 
  };
}
