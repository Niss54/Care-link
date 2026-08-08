import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';

// Map Supabase snake_case → Patient camelCase
const mapRow = (row: any): Patient => ({
  id: row.id,
  name: row.name,
  dob: row.dob,
  gender: row.gender,
  lastVisit: row.last_visit,
  status: row.status,
  avatarUrl: row.avatar_url,
  initials: row.initials || row.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
  email: row.email,
  phone: row.phone,
  department: row.department,
  notes: row.notes,
  dateAdded: row.date_added,
});

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    else setPatients((data || []).map(mapRow));
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = async (newPatient: Patient) => {
    const { data: ud } = await supabase.auth.getUser();
    const { data, error: err } = await supabase.from('patients').insert({
      id: newPatient.id,
      name: newPatient.name,
      dob: newPatient.dob,
      gender: newPatient.gender,
      last_visit: newPatient.lastVisit,
      status: newPatient.status,
      avatar_url: newPatient.avatarUrl,
      initials: newPatient.initials,
      email: newPatient.email,
      phone: newPatient.phone,
      department: newPatient.department,
      notes: newPatient.notes,
      date_added: newPatient.dateAdded,
      user_id: ud.user?.id,
    }).select().single();

    if (!err && data) setPatients(prev => [mapRow(data), ...prev]);
    return { error: err };
  };

  const deletePatient = async (id: string) => {
    const { error: err } = await supabase.from('patients').delete().eq('id', id);
    if (!err) setPatients(prev => prev.filter(p => p.id !== id));
    return { error: err };
  };

  const updatePatientNotes = async (id: string, notes: string) => {
    const { error: err } = await supabase.from('patients').update({ notes }).eq('id', id);
    if (!err) setPatients(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
    return { error: err };
  };

  return { patients, loading, error, addPatient, deletePatient, updatePatientNotes, refetch: fetchPatients };
}
