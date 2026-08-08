import React, { useState } from 'react';
import { Patient, PatientStatus } from '../../types';
import { X, User, Calendar, Mail, Phone, Building2, FileText, UserPlus } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: Patient) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onAddPatient }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1990-01-15');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Cardiology');
  const [status, setStatus] = useState<PatientStatus>('Active');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const idNumber = Math.floor(8000 + Math.random() * 1000);
    const id = `PT-${idNumber}`;
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'PT';

    const newPatient: Patient = {
      id,
      name,
      dob,
      gender,
      lastVisit: new Date().toISOString().split('T')[0],
      status,
      initials,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: phone || '(555) 019-2831',
      department,
      notes: notes || 'New patient intake completed.',
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    onAddPatient(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e0e3e5] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-[#022448] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10b981] flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Patient Registration</h2>
              <p className="text-xs text-[#adc8f5]">Create medical record & demographic profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#adc8f5] hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
              Full Legal Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full pl-10 pr-4 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
                Primary Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="General Practice">General Practice</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <div className="flex items-center gap-3">
              {(['Active', 'Pending', 'Inactive'] as PatientStatus[]).map((st) => (
                <label
                  key={st}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    status === st
                      ? 'bg-[#316bf3]/10 border-[#316bf3] text-[#316bf3]'
                      : 'bg-[#f2f4f6] border-[#c4c6cf] text-[#43474e] hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="patient-status"
                    checked={status === st}
                    onChange={() => setStatus(st)}
                    className="sr-only"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-1.5">
              Medical History / Initial Intake Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Known allergies, pre-existing conditions..."
              className="w-full px-3.5 py-2 bg-[#f2f4f6] border border-[#c4c6cf] rounded-xl text-sm text-[#191c1e] focus:outline-none focus:bg-white focus:border-[#316bf3]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e0e3e5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#43474e] hover:bg-[#f2f4f6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#10b981] text-white hover:bg-[#059669] shadow-md shadow-[#10b981]/20 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
