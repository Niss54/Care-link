import React, { useState } from 'react';
import { Patient, PatientStatus, VitalRecord } from '../types';
import { calculateAge } from '../utils';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Download,
  FileSpreadsheet,
  BrainCircuit,
  Loader2
} from 'lucide-react';

interface PatientsViewProps {
  patients: Patient[];
  vitalRecords?: VitalRecord[];
  onOpenAddPatient: () => void;
  onSelectPatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  vitalRecords = [],
  onOpenAddPatient,
  onSelectPatient,
  onDeletePatient,
  searchQuery,
  setSearchQuery,
  onShowToast
}) => {
  const [triages, setTriages] = useState<Record<string, { status: 'loading' | 'done' | 'error', val?: string }>>({});

  const handleGetTriage = async (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setTriages(prev => ({ ...prev, [patient.id]: { status: 'loading' } }));
    
    try {
      const patientVitals = vitalRecords.filter(v => v.patientId === patient.id);
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: patient.notes,
          vitals: patientVitals.slice(0, 3) // sending last 3 vitals
        })
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTriages(prev => ({ ...prev, [patient.id]: { status: 'done', val: data.triage } }));
      if (onShowToast) onShowToast('Triage Generated', `AI suggested ${data.triage} for ${patient.name}.`, 'success');
    } catch (err) {
      setTriages(prev => ({ ...prev, [patient.id]: { status: 'error' } }));
      if (onShowToast) onShowToast('Triage Error', 'Failed to generate AI triage.', 'error');
    }
  };
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [quickFilter, setQuickFilter] = useState<string>('None');
  const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const itemsPerPage = 6;

  // CSV Export logic for administrative reporting
  const handleExportCSV = () => {
    const listToExport = filteredPatients.length > 0 ? filteredPatients : patients;
    const headers = [
      'Patient ID',
      'Name',
      'Date of Birth',
      'Status',
      'Department',
      'Last Visit',
      'Email',
      'Phone',
      'Date Added',
      'Notes'
    ];

    const escapeCSV = (str: string | undefined) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = listToExport.map((p) => [
      escapeCSV(p.id),
      escapeCSV(p.name),
      escapeCSV(p.dob),
      escapeCSV(p.status),
      escapeCSV(p.department || 'Cardiology'),
      escapeCSV(p.lastVisit),
      escapeCSV(p.email),
      escapeCSV(p.phone),
      escapeCSV(p.dateAdded || '2023-10-24'),
      escapeCSV(p.notes)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `carelink_patient_report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(
        'CSV Export Complete',
        `Exported ${listToExport.length} patient records to CSV file.`,
        'success'
      );
    }
  };

  // JSON Export logic for clinical system interoperability
  const handleExportJSON = () => {
    const listToExport = filteredPatients.length > 0 ? filteredPatients : patients;
    const jsonContent = JSON.stringify(listToExport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `carelink_patients_export_${today}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(
        'JSON Export Complete',
        `Exported ${listToExport.length} patient records to JSON file for interoperability.`,
        'success'
      );
    }
  };

  const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="bg-[#fff176] text-[#191c1e] font-bold rounded-sm">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // Filter logic
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesQuickFilter = true;
    if (quickFilter === 'Frequent Visitors') {
      matchesQuickFilter = p.status === 'Active';
    } else if (quickFilter === 'Patients with Chronic Conditions') {
      matchesQuickFilter = !!p.notes && /chronic|hypertension|diabetes|asthma/i.test(p.notes);
    } else if (quickFilter === 'New Patients') {
      matchesQuickFilter = !!p.dateAdded && (p.dateAdded.includes('2023') || p.dateAdded.includes('2024'));
    }

    if (activeFilter === 'All') return matchesSearch && matchesQuickFilter;
    return matchesSearch && matchesQuickFilter && p.status === activeFilter;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filterCounts = {
    All: patients.length,
    Active: patients.filter((p) => p.status === 'Active').length,
    Pending: patients.filter((p) => p.status === 'Pending').length,
    Inactive: patients.filter((p) => p.status === 'Inactive' || p.status === 'Archived').length
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPatientIds(paginatedPatients.map(p => p.id));
    } else {
      setSelectedPatientIds([]);
    }
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: 'reminders' | 'announcements') => {
    if (onShowToast) {
      const message = action === 'reminders' 
        ? `Sent appointment reminders to ${selectedPatientIds.length} patients.`
        : `Sent clinic announcements to ${selectedPatientIds.length} patients.`;
      onShowToast('Bulk Action Complete', message, 'success');
    }
    setSelectedPatientIds([]); // Clear selection after action
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedPatientIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#022448] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#316bf3] text-[11px] font-bold">
              {selectedPatientIds.length}
            </span>
            <span className="text-sm font-bold">Selected</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <button 
            onClick={() => handleBulkAction('reminders')}
            className="text-xs font-semibold hover:text-[#adc8f5] transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Send Reminders
          </button>
          <button 
            onClick={() => handleBulkAction('announcements')}
            className="text-xs font-semibold hover:text-[#adc8f5] transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Send Announcements
          </button>
          <button 
            onClick={() => setSelectedPatientIds([])}
            className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e0e3e5] card-shadow">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Patient Directory</h2>
          <p className="text-xs text-[#74777f]">Manage patient EHR records, status, and clinical assignments</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export JSON Button for Interoperability */}
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-white border border-[#c4c6cf] hover:bg-[#f2f4f6] text-[#022448] text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all"
            title="Export patient records to JSON format for clinical system interoperability"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Export JSON</span>
          </button>

          {/* Export CSV Button for Administrative Reporting */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-[#c4c6cf] hover:bg-[#f2f4f6] text-[#022448] text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all"
            title="Export patient records to CSV file for administrative reporting"
          >
            <Download className="w-3.5 h-3.5 text-[#316bf3]" />
            <span>Export CSV</span>
          </button>

          {/* Skeleton Preview Toggle Button */}
          <button
            onClick={() => setIsLoadingSkeleton(!isLoadingSkeleton)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              isLoadingSkeleton
                ? 'bg-[#316bf3] text-white border-[#316bf3]'
                : 'bg-[#f2f4f6] text-[#43474e] border-[#c4c6cf] hover:bg-white'
            }`}
            title="Toggle Skeleton Loading State Preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSkeleton ? 'animate-spin' : ''}`} />
            <span>{isLoadingSkeleton ? 'Show Live Table' : 'Simulate Skeleton State'}</span>
          </button>

          <button
            onClick={onOpenAddPatient}
            className="px-4 py-2 bg-[#316bf3] hover:bg-[#0051d5] text-white text-xs font-bold rounded-xl shadow-md shadow-[#316bf3]/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Active', 'Pending', 'Inactive'] as const).map((filter) => {
            const count = filterCounts[filter];
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#022448] text-white shadow-md'
                    : 'bg-white text-[#43474e] border border-[#e0e3e5] hover:bg-[#f2f4f6]'
                }`}
              >
                <span>{filter}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f2f4f6] text-[#74777f]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Local Search Input */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID or department..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#c4c6cf] rounded-xl text-xs text-[#191c1e] placeholder-[#74777f] focus:outline-none focus:border-[#316bf3]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#74777f]">Quick Filters:</span>
            <select
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-[#f7f9fb] border border-[#c4c6cf] rounded-xl text-xs font-semibold text-[#191c1e] focus:outline-none focus:border-[#316bf3]"
            >
              <option value="None">None</option>
              <option value="Frequent Visitors">Frequent Visitors</option>
              <option value="Patients with Chronic Conditions">Chronic Conditions</option>
              <option value="New Patients">New Patients</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table Container */}
      <div className="bg-white rounded-2xl border border-[#e0e3e5] card-shadow overflow-hidden">
        {isLoadingSkeleton ? (
          /* Skeleton Loading State View (Screen 6 Preview) */
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-10 bg-[#f2f4f6] rounded-xl w-full shimmer" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#f7f9fb] rounded-xl border border-[#f2f4f6]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e0e3e5]" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-[#e0e3e5] rounded" />
                    <div className="w-20 h-3 bg-[#e0e3e5] rounded" />
                  </div>
                </div>
                <div className="w-24 h-6 bg-[#e0e3e5] rounded-full" />
                <div className="w-20 h-4 bg-[#e0e3e5] rounded" />
                <div className="w-16 h-8 bg-[#e0e3e5] rounded-lg" />
              </div>
            ))}
          </div>
        ) : paginatedPatients.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] text-[#74777f] mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#191c1e]">No Patients Found</h3>
            <p className="text-xs text-[#74777f] max-w-sm mx-auto">
              No patient records match your search criteria. Try adjusting filters or register a new patient.
            </p>
            <button
              onClick={onOpenAddPatient}
              className="mt-2 px-4 py-2 bg-[#316bf3] text-white text-xs font-bold rounded-xl"
            >
              Add New Patient
            </button>
          </div>
        ) : (
          /* Live Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[11px] font-bold text-[#74777f] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#c4c6cf] text-[#316bf3] focus:ring-[#316bf3]"
                      checked={paginatedPatients.length > 0 && selectedPatientIds.length === paginatedPatients.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-[16px]">ID Number</th>
                  <th className="py-3.5 px-[16px]">Status</th>
                  <th className="py-3.5 px-[16px]">Department</th>
                  <th className="py-3.5 px-[16px]">Last Visit</th>
                  <th className="py-3.5 px-[16px]">Triage</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6] text-xs">
                {paginatedPatients.map((patient) => {
                  const isActive = patient.status === 'Active';
                  const isPending = patient.status === 'Pending';
                  const isSelected = selectedPatientIds.includes(patient.id);

                  return (
                    <tr
                      key={patient.id}
                      className={`hover:bg-[#f7f9fb] transition-colors group ${isSelected ? 'bg-[#f7f9fb]' : ''}`}
                    >
                      <td className="py-4 px-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-[#c4c6cf] text-[#316bf3] focus:ring-[#316bf3]"
                          checked={isSelected}
                          onChange={() => handleSelectPatient(patient.id)}
                        />
                      </td>
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {patient.avatarUrl ? (
                            <img
                              src={patient.avatarUrl}
                              alt={patient.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#316bf3]/20 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#022448] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {patient.initials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#191c1e] text-sm group-hover:text-[#316bf3] transition-colors">
                              <HighlightText text={patient.name} highlight={searchQuery} />
                            </p>
                            <p className="text-[11px] text-[#74777f]">
                              {`${calculateAge(patient.dob)} yrs • ${patient.gender || 'Unknown'} • DOB: ${patient.dob}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ID Number Tag */}
                      <td className="py-4 px-[16px] font-mono font-semibold text-[#191c1e]">
                        <span className="bg-[#f2f4f6] px-2.5 py-1 rounded-md border border-[#e0e3e5]">
                          <HighlightText text={patient.id} highlight={searchQuery} />
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-[16px]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-[#10b981]/15 text-[#10b981]'
                              : isPending
                              ? 'bg-[#ff9800]/15 text-[#ff9800]'
                              : 'bg-[#74777f]/15 text-[#74777f]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-[#10b981]' : isPending ? 'bg-[#ff9800]' : 'bg-[#74777f]'
                            }`}
                          />
                          {patient.status}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-[16px] font-medium text-[#43474e]">
                        {patient.department || 'Cardiology'}
                      </td>

                      {/* Last Visit */}
                      <td className="py-4 px-[16px] text-[#74777f] font-medium">
                        {patient.lastVisit}
                      </td>

                      <td className="py-4 px-[16px]">
                        {triages[patient.id] ? (
                          triages[patient.id].status === 'loading' ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#316bf3]">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                            </span>
                          ) : triages[patient.id].status === 'done' ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                              triages[patient.id].val === 'Emergency' || triages[patient.id].val === 'Critical' 
                                ? 'bg-[#ba1a1a]/15 text-[#ba1a1a]' 
                                : triages[patient.id].val === 'Urgent' 
                                  ? 'bg-[#ff9800]/15 text-[#ff9800]' 
                                  : 'bg-[#10b981]/15 text-[#10b981]'
                            }`}>
                              {triages[patient.id].val}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#ba1a1a]">Failed</span>
                          )
                        ) : (
                          <button
                            onClick={(e) => handleGetTriage(e, patient)}
                            className="px-2 py-1 rounded-md bg-[#e0e3e5]/50 hover:bg-[#e0e3e5] text-[#191c1e] text-[10px] font-bold transition-colors flex items-center gap-1"
                            title="Generate AI Triage"
                          >
                            <BrainCircuit className="w-3.5 h-3.5 text-[#316bf3]" />
                            Triage
                          </button>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="p-2 text-[#316bf3] hover:bg-[#316bf3]/10 rounded-lg transition-colors"
                            title="View Record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeletePatient(patient.id)}
                            className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors"
                            title="Archive Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="px-6 py-4 bg-[#f7f9fb] border-t border-[#e0e3e5] flex items-center justify-between text-xs text-[#74777f]">
          <span>
            Showing <span className="font-bold text-[#191c1e]">{paginatedPatients.length}</span> of{' '}
            <span className="font-bold text-[#191c1e]">{filteredPatients.length}</span> patients
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#c4c6cf] disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[#191c1e]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#c4c6cf] disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
