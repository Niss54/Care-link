export type TabType = 'landing' | 'home' | 'patients' | 'calendar' | 'analytics' | 'settings' | 'login' | 'reset-password' | '404';

export type PatientStatus = 'Active' | 'Pending' | 'Inactive' | 'Archived';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: string;
  status: 'Active' | 'Archived' | 'Refill Requested';
  refillsRemaining: number;
  doctor: string;
  notes?: string;
}

export interface VitalRecord {
  id: string;
  patientId: string;
  timestamp: string;
  heartRate: number; // bpm
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  temperature: number; // °F
  recordedBy?: string;
  notes?: string;
}

export interface Patient {
  id: string; // e.g. "PT-8472"
  name: string;
  dob: string; // e.g. "1982-10-14"
  gender?: string; // e.g. "Male", "Female", "Other"
  lastVisit: string; // e.g. "2023-11-02"
  status: PatientStatus;
  avatarUrl?: string;
  initials: string;
  email?: string;
  phone?: string;
  department?: string;
  notes?: string;
  dateAdded?: string;
}

export type AppointmentStatus = 'Upcoming' | 'In Progress' | 'Waiting' | 'Completed' | 'Canceled';

export interface Appointment {
  id: string;
  time: string; // e.g. "09:00 AM"
  date: string; // e.g. "2023-10-12"
  patientName: string;
  patientInitials: string;
  patientAvatar?: string;
  department: string;
  doctor: string;
  type: string; // e.g. "Annual Physical", "Medication Review"
  status: AppointmentStatus;
  urgency?: 'High' | 'Medium' | 'Low';
  notes?: string;
}

export interface ActivityItem {
  id: string;
  type: 'lab' | 'referral' | 'prescription' | 'appointment';
  patientName: string;
  description: string;
  timestamp: string;
  statusColor?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface DoctorProfile {
  name: string;
  title: string;
  department: string;
  avatarUrl: string;
  email: string;
}


export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  date: string;
  value: string;
  unit: string;
  status: 'Normal' | 'High' | 'Low';
  notes?: string;
}
