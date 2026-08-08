import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, AppointmentStatus } from '../types';

// Map Supabase snake_case → Appointment camelCase
const mapRow = (row: any): Appointment => ({
  id: row.id,
  time: row.time,
  date: row.date,
  patientName: row.patient_name,
  patientInitials: row.patient_initials,
  patientAvatar: row.patient_avatar,
  department: row.department,
  doctor: row.doctor,
  type: row.type,
  status: row.status,
  urgency: row.urgency,
  notes: row.notes,
});

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    else setAppointments((data || []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (newApt: Appointment) => {
    const { data: ud } = await supabase.auth.getUser();
    const { data, error: err } = await supabase.from('appointments').insert({
      id: newApt.id,
      time: newApt.time,
      date: newApt.date,
      patient_name: newApt.patientName,
      patient_initials: newApt.patientInitials,
      patient_avatar: newApt.patientAvatar,
      department: newApt.department,
      doctor: newApt.doctor,
      type: newApt.type,
      status: newApt.status,
      urgency: newApt.urgency,
      notes: newApt.notes,
      user_id: ud.user?.id,
    }).select().single();

    if (!err && data) setAppointments(prev => [mapRow(data), ...prev]);
    return { error: err };
  };

  const updateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    const { error: err } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (!err) setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    return { error: err };
  };

  return { appointments, loading, error, addAppointment, updateAppointmentStatus, refetch: fetchAppointments };
}
