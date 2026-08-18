import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, AppointmentStatus } from '../types';

// Map Supabase snake_case & joined patient data → Appointment camelCase
const mapAppointmentRow = (row: any): Appointment => {
  const d = new Date(row.scheduled_at);
  const patient = row.patients || {};
  const patientName = patient.name || 'Unknown Patient';
  
  return {
    id: row.id,
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString(),
    patientName: patientName,
    patientInitials: patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
    patientAvatar: patient.avatar_url,
    department: 'General Practice', // Fallback since it's not in schema
    doctor: 'Assigned Physician', 
    type: row.type || 'Consultation',
    status: row.status as AppointmentStatus,
    urgency: 'Medium', // Fallback since it's not in schema
    notes: row.notes,
  };
};

export function useAppointments(daysAhead: number = 30) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Default: next 30 days
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const { data, error: err } = await supabase
        .from('appointments')
        .select('*, patients(name, avatar_url)')
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true });

      if (err) throw err;
      setAppointments((data || []).map(mapAppointmentRow));
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [daysAhead]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  const addAppointment = async (newApt: Omit<Appointment, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // We need patient_id to insert properly. Since the UI might not have it in the form easily 
      // without modifying the UI, we assume we might need to look it up or handle it based on patientName.
      // For this refactor, we just insert what we can to keep the interface identical.
      // Ideally, the 'newApt' should carry patient_id.
      // If missing, we'll try to find a patient by name (hacky but works for demo if no patient_id provided).
      let patientId = (newApt as any).patientId;
      if (!patientId) {
        const { data: pData } = await supabase.from('patients').select('id').eq('name', newApt.patientName).limit(1).single();
        if (pData) patientId = pData.id;
      }

      const scheduledAt = new Date(`${newApt.date} ${newApt.time}`).toISOString();

      const { data, error: err } = await supabase.from('appointments').insert({
        doctor_id: userData.user.id,
        patient_id: patientId, // might be undefined, but we try
        scheduled_at: scheduledAt,
        type: newApt.type,
        status: newApt.status,
        notes: newApt.notes,
      }).select('*, patients(name, avatar_url)').single();

      if (err) throw err;
      
      if (data) {
        setAppointments(prev => [mapAppointmentRow(data), ...prev]);
      }
      return { error: null };
    } catch (err: any) {
      console.error('Error adding appointment:', err);
      return { error: err };
    }
  };

  const updateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const { error: err } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (err) throw err;
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      return { error: null };
    } catch (err: any) {
      console.error('Error updating appointment status:', err);
      return { error: err };
    }
  };

  return { appointments, loading, error, addAppointment, updateAppointmentStatus, refetch: fetchAppointments };
}
