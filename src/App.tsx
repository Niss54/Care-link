import React, { useState, useEffect } from 'react';
import { TabType, Patient, Appointment, ActivityItem, ToastMessage, DoctorProfile, AppointmentStatus, Medication, VitalRecord } from './types';
import { supabase } from './lib/supabase';
import { CURRENT_DOCTOR, INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_ACTIVITIES, INITIAL_MEDICATIONS, INITIAL_VITALS, INITIAL_LABS } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ScheduleAppointmentModal } from './components/Modals/ScheduleAppointmentModal';
import { AddPatientModal } from './components/Modals/AddPatientModal';
import { ViewPatientModal } from './components/Modals/ViewPatientModal';

import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { AppointmentsView } from './views/AppointmentsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { NotFoundView } from './views/NotFoundView';
import { LandingView } from './views/LandingView';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [doctor, setDoctor] = useState<DoctorProfile>(CURRENT_DOCTOR);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [vitalRecords, setVitalRecords] = useState<VitalRecord[]>(INITIAL_VITALS);
  const [labRecords, setLabRecords] = useState(INITIAL_LABS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnCall, setIsOnCall] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);

  // Mobile Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast Helpers
  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        setActiveTab('home');
        
        const metadata = session.user.user_metadata;
        const name = metadata?.full_name || metadata?.name || session.user.email?.split('@')[0] || 'Doctor';
        const email = session.user.email || 'doctor@carelink.health';
        const avatarUrl = metadata?.avatar_url || metadata?.picture || CURRENT_DOCTOR.avatarUrl;

        setDoctor(prev => ({
          ...prev,
          name: name.includes('Dr.') ? name : `Dr. ${name}`,
          email,
          avatarUrl
        }));

        addToast('Welcome', `Logged in as ${name}`, 'success');
      } else if (event === 'SIGNED_OUT') {
        setActiveTab('landing');
        setDoctor(CURRENT_DOCTOR); // Reset to default on sign out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers
  const handleScheduleAppointment = (newAptData: Omit<Appointment, 'id'>) => {
    const newId = `APT-${appointments.length + 101}`;
    const newApt: Appointment = {
      ...newAptData,
      id: newId,
      urgency: isOnCall ? 'High' : (newAptData.urgency || 'Medium')
    };
    setAppointments((prev) => [newApt, ...prev]);

    // Add activity item
    const newAct: ActivityItem = {
      id: `ACT-${activities.length + 1}`,
      type: 'appointment',
      patientName: newApt.patientName,
      description: `New consultation booked for ${newApt.patientName} at ${newApt.time}.`,
      timestamp: 'Just now',
      statusColor: 'bg-[#316bf3]'
    };
    setActivities((prev) => [newAct, ...prev]);

    addToast('Appointment Scheduled', `Booked consultation for ${newApt.patientName} at ${newApt.time}.`, 'success');
  };

  const handleAddPatient = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);

    const newAct: ActivityItem = {
      id: `ACT-${activities.length + 1}`,
      type: 'referral',
      patientName: newPatient.name,
      description: `New patient record registered for ${newPatient.name} (${newPatient.id}).`,
      timestamp: 'Just now',
      statusColor: 'bg-[#10b981]'
    };
    setActivities((prev) => [newAct, ...prev]);

    addToast('Patient Registered', `Created medical EHR record for ${newPatient.name}.`, 'success');
  };

  const handleDeletePatient = (patientId: string) => {
    const pt = patients.find((p) => p.id === patientId);
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    addToast('Patient Archived', `Archived record for ${pt ? pt.name : patientId}.`, 'info');
  };

  const handleUpdateAppointmentStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
    addToast('Status Updated', `Appointment ${id} status set to ${newStatus}.`, 'info');
  };

  const handleRefillMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Active',
              refillsRemaining: Math.max(0, m.refillsRemaining - 1)
            }
          : m
      )
    );
    const med = medications.find((m) => m.id === id);
    addToast('Prescription Refill Approved', `Refill authorized for ${med?.name || 'medication'}.`, 'success');
  };

  const handleArchiveMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'Archived' ? 'Active' : 'Archived' }
          : m
      )
    );
    const med = medications.find((m) => m.id === id);
    addToast(
      'Prescription Status Changed',
      med?.status === 'Archived'
        ? `Restored ${med?.name} to active prescriptions.`
        : `Archived ${med?.name} prescription record.`,
      'info'
    );
  };

  const handleAddMedication = (newMedData: Omit<Medication, 'id'>) => {
    const newId = `MED-${medications.length + 101}`;
    const newMed: Medication = { ...newMedData, id: newId };
    setMedications((prev) => [newMed, ...prev]);
    addToast('Prescription Added', `Created new prescription for ${newMed.name}.`, 'success');
  };

  const handleAddVitalRecord = (newVitalData: Omit<VitalRecord, 'id'>) => {
    const newId = `VIT-${vitalRecords.length + 201}`;
    const newVital: VitalRecord = { ...newVitalData, id: newId };
    setVitalRecords((prev) => [newVital, ...prev]);
    addToast('Vitals Recorded', `Logged BP ${newVital.bloodPressureSystolic}/${newVital.bloodPressureDiastolic}, HR ${newVital.heartRate} bpm.`, 'success');
  };

  const handleUpdatePatientNotes = (id: string, newNotes: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes: newNotes } : p))
    );
    addToast('Notes Updated', `Clinical notes updated for patient ${id}.`, 'success');
  };

  // Auth Layouts
  if (activeTab === 'landing') {
    return <LandingView onLogin={() => setActiveTab('login')} />;
  }

  if (activeTab === 'login') {
    return (
      <LoginView
        onLoginSuccess={() => {
          setActiveTab('home');
          addToast('Welcome Back', `Logged in as ${doctor.name} (${doctor.department}).`, 'success');
        }}
        onNavigateToReset={() => setActiveTab('reset-password')}
      />
    );
  }

  if (activeTab === 'reset-password') {
    return <ResetPasswordView onBackToLogin={() => setActiveTab('login')} />;
  }

  if (activeTab === '404') {
    return <NotFoundView onGoHome={() => setActiveTab('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col antialiased">
      {/* Toast Overlay */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        doctor={{...doctor, status: isOnCall ? 'On-Call' : doctor.status}}
        onSignOut={() => {
          setActiveTab('login');
          addToast('Signed Out', 'You have been logged out safely.', 'info');
        }}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
      />

      {/* Main Body Content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 transition-all">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          doctor={{...doctor, status: isOnCall ? 'On-Call' : doctor.status}}
          activities={activities}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          onOpenAddPatientModal={() => setIsAddPatientModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isOnCall={isOnCall}
          setIsOnCall={setIsOnCall}
        />

        {/* View Router */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && (
            <DashboardView
              doctor={doctor}
              patients={patients}
              appointments={appointments}
              activities={activities}
              vitalRecords={vitalRecords}
        labRecords={labRecords}
              onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              onOpenAddPatientModal={() => setIsAddPatientModalOpen(true)}
              onSelectPatient={(p) => setSelectedPatientForView(p)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView
              patients={patients}
              vitalRecords={vitalRecords}
              onOpenAddPatient={() => setIsAddPatientModalOpen(true)}
              onSelectPatient={(p) => setSelectedPatientForView(p)}
              onDeletePatient={handleDeletePatient}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'calendar' && (
            <AppointmentsView
              appointments={appointments}
              onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <ScheduleAppointmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleAppointment}
        patients={patients}
      />

      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onAddPatient={handleAddPatient}
      />

      <ViewPatientModal
        patient={selectedPatientForView}
        onClose={() => setSelectedPatientForView(null)}
        onScheduleForPatient={(patientName) => {
          setIsScheduleModalOpen(true);
        }}
        medications={medications}
        vitalRecords={vitalRecords}
        onRefillMedication={handleRefillMedication}
        onArchiveMedication={handleArchiveMedication}
        onAddMedication={handleAddMedication}
        onAddVitalRecord={handleAddVitalRecord}
        onUpdatePatientNotes={handleUpdatePatientNotes}
      />
    </div>
  );
}

export default App;
