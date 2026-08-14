export type TabType =
  | "landing"
  | "home"
  | "patients"
  | "calendar"
  | "analytics"
  | "settings"
  | "login"
  | "reset-password"
  | "404";

export type PatientStatus = "Active" | "Pending" | "Inactive" | "Archived";

export type AppointmentStatus =
  | "Upcoming"
  | "In Progress"
  | "Waiting"
  | "Completed"
  | "Canceled";

export interface Patient {
  id: string; // e.g. "PT-8472"
  name: string;
  dob: string; // "YYYY-MM-DD"
  gender?: string;
  lastVisit: string;
  status: PatientStatus;
  avatarUrl?: string;
  initials: string;
  email?: string;
  phone?: string;
  department?: string;
  notes?: string;
  dateAdded?: string;
}

export interface Appointment {
  id: string;
  time: string; // "09:00 AM"
  date: string; // "YYYY-MM-DD"
  patientName: string;
  patientInitials: string;
  patientAvatar?: string;
  department: string;
  doctor: string;
  type: string; // "Annual Physical", "Medication Review" etc.
  status: AppointmentStatus;
  urgency?: "High" | "Medium" | "Low";
  notes?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: string;
  status: "Active" | "Archived" | "Refill Requested";
  refillsRemaining: number;
  doctor: string;
  notes?: string;
}

export interface VitalRecord {
  id: string;
  patientId: string;
  timestamp: string; // "YYYY-MM-DD HH:MM"
  heartRate: number; // bpm
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  temperature: number; // °F
  recordedBy?: string;
  notes?: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  date: string;
  value: string;
  unit: string;
  status: "Normal" | "High" | "Low";
  notes?: string;
}

export interface ActivityItem {
  id: string;
  type: "lab" | "referral" | "prescription" | "appointment";
  patientName: string;
  description: string;
  timestamp: string;
  statusColor?: string;
}

export interface DoctorProfile {
  name: string;
  title: string;
  department: string;
  avatarUrl: string;
  email: string;
  status?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "error";
}
