import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlayCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard,
  CalendarCheck,
  Bell
} from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onOpenScheduleModal: () => void;
  onUpdateStatus: (id: string, newStatus: AppointmentStatus) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onOpenScheduleModal,
  onUpdateStatus
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('2023-10-12');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');

  const departments = ['All', 'Cardiology', 'Neurology', 'General Practice'];
  const urgencies = ['All', 'High', 'Medium', 'Low'];

  const getStatusImplication = (status: AppointmentStatus) => {
    switch (status) {
      case 'Upcoming':
      default:
        return {
          label: 'Confirmed / Upcoming',
          border: 'border-[#316bf3]',
          badgeBg: 'bg-[#316bf3]/20 text-[#316bf3]',
          scheduling: 'Slot locked in physician calendar. Patient intake link sent.',
          billing: 'Prior-authorization validated; co-pay & insurance claim pre-cleared.'
        };
      case 'In Progress':
        return {
          label: 'In Progress',
          border: 'border-[#10b981]',
          badgeBg: 'bg-[#10b981]/20 text-[#10b981]',
          scheduling: 'Consultation active in exam room. Care team attached.',
          billing: 'Real-time time-based CPT encounter code tracking active.'
        };
      case 'Waiting':
        return {
          label: 'Pending / Waiting',
          border: 'border-[#ff9800]',
          badgeBg: 'bg-[#ff9800]/20 text-[#ff9800]',
          scheduling: 'Patient queued in waiting room; awaiting room assignment.',
          billing: 'Insurance eligibility re-check in progress; co-pay pending intake.'
        };
      case 'Completed':
        return {
          label: 'Completed',
          border: 'border-[#74777f]',
          badgeBg: 'bg-[#74777f]/20 text-[#adc8f5]',
          scheduling: 'Session concluded, patient checked out, room released.',
          billing: 'Superbill generated & queued for automated batch claim submission.'
        };
      case 'Canceled':
        return {
          label: 'Cancelled / Released',
          border: 'border-[#ba1a1a]',
          badgeBg: 'bg-[#ba1a1a]/20 text-[#ba1a1a]',
          scheduling: 'Slot released back to open schedule; waitlist notified.',
          billing: 'No encounter claim filed; late cancellation / fee policy applied.'
        };
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const deptMatch = selectedDepartment === 'All' || apt.department === selectedDepartment;
    const dateMatch = !selectedDate || apt.date === selectedDate;
    const urgencyMatch = selectedUrgency === 'All' || apt.urgency === selectedUrgency;
    return deptMatch && dateMatch && urgencyMatch;
  });

  const statusCounts = {
    Upcoming: appointments.filter((a) => a.status === 'Upcoming').length,
    InProgress: appointments.filter((a) => a.status === 'In Progress').length,
    Waiting: appointments.filter((a) => a.status === 'Waiting').length,
    Completed: appointments.filter((a) => a.status === 'Completed').length,
    Canceled: appointments.filter((a) => a.status === 'Canceled').length
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e0e3e5] card-shadow">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Clinical Calendar & Schedule</h2>
          <p className="text-xs text-[#74777f]">Manage daily consultations, waiting room queues, and status updates</p>
        </div>

        <button
          onClick={onOpenScheduleModal}
          className="px-4 py-2.5 bg-[#316bf3] hover:bg-[#0051d5] text-white text-xs font-bold rounded-xl shadow-md shadow-[#316bf3]/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Appointment</span>
        </button>
      </div>

      {/* Date Selector Strip & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Date Navigator Box */}
        <div className="bg-[#022448] text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#adc8f5] uppercase tracking-wider">Active Date</span>
            <div className="flex items-center gap-1">
              <button className="p-1 text-[#adc8f5] hover:text-white rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 text-[#adc8f5] hover:text-white rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="my-4">
            <h3 className="text-2xl font-extrabold text-white">Thursday, Oct 12</h3>
            <p className="text-xs text-[#adc8f5] mt-1">{appointments.length} Total Sessions Booked</p>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-white/10 text-white rounded-xl text-xs border border-white/20 focus:outline-none"
          />
        </div>

        {/* Status Breakdown Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
            <p className="text-[10px] font-bold text-[#74777f] uppercase">Upcoming</p>
            <p className="text-2xl font-extrabold text-[#316bf3] mt-1">{statusCounts.Upcoming}</p>
            <p className="text-[10px] text-[#74777f] mt-1">Ready for intake</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
            <p className="text-[10px] font-bold text-[#74777f] uppercase">In Progress</p>
            <p className="text-2xl font-extrabold text-[#10b981] mt-1">{statusCounts.InProgress}</p>
            <p className="text-[10px] text-[#10b981] mt-1 font-semibold">Active in Room 2</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
            <p className="text-[10px] font-bold text-[#74777f] uppercase">Waiting Room</p>
            <p className="text-2xl font-extrabold text-[#ff9800] mt-1">{statusCounts.Waiting}</p>
            <p className="text-[10px] text-[#ff9800] mt-1 font-semibold">Avg wait 8 mins</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e0e3e5] card-shadow">
            <p className="text-[10px] font-bold text-[#74777f] uppercase">Completed</p>
            <p className="text-2xl font-extrabold text-[#191c1e] mt-1">{statusCounts.Completed}</p>
            <p className="text-[10px] text-[#74777f] mt-1">EHR notes finalized</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedDepartment === dept
                  ? 'bg-[#316bf3] text-white shadow-md'
                  : 'bg-white text-[#43474e] border border-[#e0e3e5] hover:bg-[#f2f4f6]'
              }`}
            >
              {dept} Dept
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#74777f] uppercase tracking-wider">Urgency:</span>
          <select 
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#e0e3e5] rounded-xl text-xs font-bold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#316bf3]/20"
          >
            {urgencies.map(urg => (
              <option key={urg} value={urg}>{urg === 'All' ? 'All Urgencies' : urg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointment Cards Grid */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#e0e3e5]">
            <CalendarIcon className="w-8 h-8 text-[#74777f] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#191c1e]">No appointments scheduled</p>
            <p className="text-xs text-[#74777f]">No consultations match the selected department filter.</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const isCompleted = apt.status === 'Completed';
            const isInProgress = apt.status === 'In Progress';
            const isWaiting = apt.status === 'Waiting';
            const isCanceled = apt.status === 'Canceled';

            return (
              <div
                key={apt.id}
                className={`p-5 bg-white rounded-2xl border transition-all card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isInProgress ? 'border-[#316bf3] ring-2 ring-[#316bf3]/20' : 'border-[#e0e3e5]'
                }`}
              >
                {/* Time & Patient Info */}
                <div className="flex items-start md:items-center gap-4">
                  {/* Time Badge */}
                  <div className="px-3 py-2 bg-[#f2f4f6] border border-[#e0e3e5] rounded-xl text-center shrink-0">
                    <Clock className="w-4 h-4 text-[#316bf3] mx-auto mb-1" />
                    <p className="text-xs font-bold text-[#191c1e] whitespace-nowrap">{apt.time}</p>
                  </div>

                  {/* Patient Avatar */}
                  {apt.patientAvatar ? (
                    <img
                      src={apt.patientAvatar}
                      alt={apt.patientName}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 ring-2 ring-[#316bf3]/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#022448] text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {apt.patientInitials}
                    </div>
                  )}

                  {/* Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#191c1e]">{apt.patientName}</h3>
                      <span className="text-[10px] font-semibold text-[#74777f] bg-[#f2f4f6] px-2 py-0.5 rounded">
                        {apt.id}
                      </span>
                    </div>

                    <p className="text-xs text-[#43474e] mt-0.5">
                      <span className="font-semibold text-[#191c1e]">{apt.type}</span> • {apt.doctor} (
                      {apt.department})
                    </p>

                    {apt.notes && (
                      <p className="text-[11px] text-[#74777f] mt-1 bg-[#f7f9fb] px-2.5 py-1 rounded-lg italic">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge with Color-Coded Tooltip & Control Dropdown */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#f2f4f6]">
                  {/* Tooltip Wrapper */}
                  <div className="relative group">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-help transition-all ${
                        isCompleted
                          ? 'bg-[#10b981]/15 text-[#10b981]'
                          : isInProgress
                          ? 'bg-[#316bf3]/15 text-[#316bf3] animate-pulse'
                          : isWaiting
                          ? 'bg-[#ff9800]/15 text-[#ff9800]'
                          : isCanceled
                          ? 'bg-[#ba1a1a]/15 text-[#ba1a1a]'
                          : 'bg-[#74777f]/15 text-[#74777f]'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isInProgress && <PlayCircle className="w-3.5 h-3.5" />}
                      {isWaiting && <Clock className="w-3.5 h-3.5" />}
                      {isCanceled && <XCircle className="w-3.5 h-3.5" />}
                      {apt.status}
                      <Info className="w-3 h-3 opacity-60 ml-0.5" />
                    </span>

                    {/* Color-Coded Tooltip Popover */}
                    {(() => {
                      const imp = getStatusImplication(apt.status);
                      return (
                        <div
                          className={`absolute right-0 bottom-full mb-2.5 w-72 p-3.5 bg-[#022448] text-white rounded-xl shadow-2xl border-l-4 ${imp.border} opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 transform group-hover:translate-y-0 translate-y-1 text-xs`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${imp.badgeBg}`}>
                              {imp.label}
                            </span>
                            <span className="text-[10px] text-[#adc8f5] font-mono">Implications</span>
                          </div>

                          <div className="space-y-2 text-[11px] leading-relaxed">
                            <div className="flex items-start gap-2">
                              <CalendarCheck className="w-3.5 h-3.5 text-[#adc8f5] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-[#adc8f5] block">Scheduling:</span>
                                <p className="text-white/90">{imp.scheduling}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 pt-1 border-t border-white/5">
                              <CreditCard className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-[#10b981] block">Billing:</span>
                                <p className="text-white/90">{imp.billing}</p>
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-[#022448]" />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Change Selector */}
                  <select
                    value={apt.status}
                    onChange={(e) => onUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                    className="px-3 py-1.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-xs font-semibold text-[#191c1e] focus:outline-none"
                  >
                    <option value="Upcoming">Upcoming (Confirmed)</option>
                    <option value="Waiting">Waiting (Pending)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>

                  <button
                    onClick={() => {
                      if (onShowToast) {
                        onShowToast('Reminder Sent', `SMS/Email reminder has been sent to ${apt.patientName}.`, 'success');
                      }
                    }}
                    className="p-1.5 text-[#316bf3] hover:bg-[#316bf3]/10 rounded-lg transition-colors border border-transparent hover:border-[#316bf3]/20"
                    title="Send Reminder"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
