import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TabType, Patient, Appointment, ActivityItem, ToastMessage, DoctorProfile, AppointmentStatus, Medication, VitalRecord } from './types';
import { supabase } from './lib/supabase';
import { usePatients } from './hooks/usePatients';
import { useAppointments } from './hooks/useAppointments';
import { useMedications } from './hooks/useMedications';
import { CURRENT_DOCTOR, INITIAL_ACTIVITIES, INITIAL_VITALS, INITIAL_LABS } from './data/mockData';
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
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [doctor, setDoctor] = useState<DoctorProfile>({
    ...CURRENT_DOCTOR,
    email: user?.email || CURRENT_DOCTOR.email,
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || CURRENT_DOCTOR.name,
  });
  const { patients, addPatient: dbAdd, deletePatient: dbDelete, updatePatientNotes: dbUpdateNotes } = usePatients();
  const { appointments, addAppointment: aptAdd, updateAppointmentStatus: aptUpdateStatus } = useAppointments();
  const { medications, addMedication: medAdd, refillMedication: medRefill, archiveMedication: medArchive } = useMedications();
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
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
    if (!loading) {
      if (user && ['login','landing','reset-password'].includes(activeTab)) {
        setActiveTab('home');
      } else if (!user && !['login','landing','reset-password'].includes(activeTab)) {
        setActiveTab('landing');
      }
    }
  }, [user, loading, activeTab]);

  useEffect(() => {
    if (user) {
      setDoctor(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name,
      }));
    }
  }, [user]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers
  const handleScheduleAppointment = async (newAptData: Omit<Appointment, 'id'>) => {
    const newId = `APT-${appointments.length + 101}`;
    const newApt: Appointment = {
      ...newAptData,
      id: newId,
      urgency: isOnCall ? 'High' : (newAptData.urgency || 'Medium')
    };
    
    await aptAdd(newApt);

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

  const handleAddPatient = async (newPatient: Patient) => {
    await dbAdd(newPatient);

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

  const handleDeletePatient = async (patientId: string) => {
    const pt = patients.find((p) => p.id === patientId);
    await dbDelete(patientId);
    addToast('Patient Archived', `Archived record for ${pt ? pt.name : patientId}.`, 'info');
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    await aptUpdateStatus(id, newStatus);
    addToast('Status Updated', `Appointment ${id} status set to ${newStatus}.`, 'info');
  };

  const handleRefillMedication = async (id: string) => {
    await medRefill(id);
    const med = medications.find((m) => m.id === id);
    addToast('Prescription Refill Approved', `Refill authorized for ${med?.name || 'medication'}.`, 'success');
  };

  const handleArchiveMedication = async (id: string) => {
    await medArchive(id);
    const med = medications.find((m) => m.id === id);
    addToast(
      'Prescription Status Changed',
      med?.status === 'Archived'
        ? `Restored ${med?.name} to active prescriptions.`
        : `Archived ${med?.name} prescription record.`,
      'info'
    );
  };

  const handleAddMedication = async (newMedData: Omit<Medication, 'id'>) => {
    const newId = `MED-${medications.length + 101}`;
    const newMed: Medication = { ...newMedData, id: newId };
    await medAdd(newMed);
    addToast('Prescription Added', `Created new prescription for ${newMed.name}.`, 'success');
  };

  const handleAddVitalRecord = (newVitalData: Omit<VitalRecord, 'id'>) => {
    const newId = `VIT-${vitalRecords.length + 201}`;
    const newVital: VitalRecord = { ...newVitalData, id: newId };
    setVitalRecords((prev) => [newVital, ...prev]);
    addToast('Vitals Recorded', `Logged BP ${newVital.bloodPressureSystolic}/${newVital.bloodPressureDiastolic}, HR ${newVital.heartRate} bpm.`, 'success');
  };

  const handleUpdatePatientNotes = async (id: string, newNotes: string) => {
    await dbUpdateNotes(id, newNotes);
    addToast('Notes Updated', `Clinical notes updated for patient ${id}.`, 'success');
  };

  // Auth Layouts
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#316bf3] flex items-center justify-center text-white">
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#316bf3]">CareLink</p>
          <p className="text-xs text-[#74777f]">Loading clinical portal...</p>
        </div>
      </div>
    );
  }

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
        onSignOut={async () => {
          await signOut();
          setActiveTab('landing');
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
