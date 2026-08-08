import { Patient, LabResult, Appointment, ActivityItem, DoctorProfile, Medication, VitalRecord } from '../types';

export const CURRENT_DOCTOR: DoctorProfile = {
  name: 'Dr. Smith',
  title: 'Clinical Director',
  department: 'Cardiology',
  email: 'smith@carelink.health',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmwiFrOKDn0G-I6stYZ-AU5N6ZOYvbHhW5zM1nJbrigkWPXFAu-v3pWXxmnQuZy6MXDC5GLgu3JAyq_ZwrxXkUpz8F1wk7TvqQf43OpCWLzLNC2MydlCqIRiAHrTVmWzF0CFpg_L1LPxMlvl1bDPsITc5osPSDiaJ6iN--DywxJH3Dtvyz6htv00-zoqsmn4z5ObtMskIvKfm6TqyRW_msDUtdeSdEri1JgE5nKSM5VQ4olOFKe7ph'
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PT-8472',
    name: 'Eleanor Shellstrop',
    dob: '1982-10-14',
    lastVisit: '2023-11-02',
    status: 'Active',
    initials: 'ES',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFvYKBCkirAy0vvCkh5drY08amQrV9P5C41a9BXxQKPVApLJmxwqwdysQzPWY0AI6VhV8Nw8u4WArgonHIbg3k6yhkfgy6Ha5Zg-9B93W6c6hzv8BxG1F_Lq-rdmeeKN1ooxjd6Qp1MIzli52gdFaYZ9xjr0V36bEgMGqSXeOH7cVIw86fyKMjobBJl-4u8ZAEzCehAHL_kDxLiql31jqz5sFDmGHI9w7zkpUjSff7uj5rHROmHoe-',
    email: 'eleanor@example.com',
    phone: '(555) 234-5678',
    department: 'Cardiology',
    notes: 'Regular checkups required for mild hypertension. Responsive to medication.',
    dateAdded: 'Oct 24, 2023'
  },
  {
    id: 'PT-8473',
    name: 'Chidi Anagonye',
    dob: '1980-05-22',
    lastVisit: '2023-10-15',
    status: 'Pending',
    initials: 'CM',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP4pNrAZSR_viQy-cqx2WgPzK5S-eYMJqNpBvVCwtOLiXfb6EwYCaexLU-9GgE5pFmXIUGIcNxpEbxMknXfxTVNEZvcNTTksbWu_Op-kY3o-RqC917_qIeKZIljnAU-3t5wekkC6VEU1mtqKxEKuSmSm0ThBDSUmkb2fmR-fvxzwnWwmBkL_xSqwtqkCIN96tlX1-mDKFBSvzoJVBdJoObCZeD_OEYIqhEq9mBOVg-oVmB11zG_Xjq',
    email: 'chidi@example.com',
    phone: '(555) 876-5432',
    department: 'Neurology',
    notes: 'Stress-induced migraines. Awaiting MRI lab report.',
    dateAdded: 'Oct 23, 2023'
  },
  {
    id: 'PT-8474',
    name: 'Tahani Al-Jamil',
    dob: '1985-02-11',
    lastVisit: '2023-08-30',
    status: 'Inactive',
    initials: 'TA',
    email: 'tahani@example.com',
    phone: '(555) 901-2345',
    department: 'General Practice',
    notes: 'Annual physical completed. No active health concerns.',
    dateAdded: 'Oct 20, 2023'
  },
  {
    id: 'PT-8492',
    name: 'Eleanor Vance',
    dob: '1979-04-18',
    lastVisit: '2023-10-24',
    status: 'Active',
    initials: 'EV',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe1OngyhnO8HfQn_0e8yf1LuviNAQ262FiTks6kuK_BfeZHMEyuoGC3OZm6mZd7U86J6td7CZEBgtJiadR3fMwjqsfDp9i1ymkEe60UpQ7IZOcPP_Xu3AzhrL1ASpfbCDNIWwzWS3W4laQt06110tXLbOB0hMoo9SrzAxCuZ18jOuTxiYz64ozcXJ9DoGo4k6tO04LeZezn3tjs_NT4f2PfhmEulouNaTcNJUi8Z0rwGDOLJxYUQiV',
    email: 'evance@clinic.org',
    phone: '(555) 432-1098',
    department: 'Cardiology',
    notes: 'Post-op cardiac recovery monitoring.',
    dateAdded: 'Oct 24, 2023'
  },
  {
    id: 'PT-8493',
    name: 'Arthur Pendelton',
    dob: '1958-11-09',
    lastVisit: '2023-10-23',
    status: 'Pending',
    initials: 'AP',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVrWLfCnGKfrH7c81M8Ugp9wusC_0rPwht3lua4Fu0QMggsbrMwWZUCeRcMJY3FzbCVAC_BxlWIgFQ8aiN3UtzWpxZuhe1P4nmiwzP1PPI2OkUkMN9ydMNAT2gUAFIVh9K_JoJlSnH79Pq8nCzs02fCr0plgoli3E7FPP8UJb6ajEyG48hyJWaZXkmL6AZtoxqa27ClvjoJaMlopVJza4BXMzeUFFzLW1yEaivY5GizR41DAg_hYaq',
    email: 'arthur.p@example.com',
    phone: '(555) 678-9012',
    department: 'General Practice',
    notes: 'Pending blood panel and lipids analysis.',
    dateAdded: 'Oct 23, 2023'
  },
  {
    id: 'PT-8494',
    name: 'Maria Silva',
    dob: '1992-07-30',
    lastVisit: '2023-10-20',
    status: 'Inactive',
    initials: 'MS',
    email: 'msilva@health.com',
    phone: '(555) 321-7654',
    department: 'Neurology',
    notes: 'Routine nerve conduction test completed.',
    dateAdded: 'Oct 20, 2023'
  },
  {
    id: 'PT-8495',
    name: 'Marcus Sterling',
    dob: '1952-03-14',
    lastVisit: '2023-10-12',
    status: 'Active',
    initials: 'MS',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAClsVR_HrEV0B7n9tzO_2cpu5aRg1jjth75zVi9hI81KjNJDythkejM2dQgEb0xAQYuaHBQ648DIsGBf_zTAAXcjvEQYzkOXWixgjbYoNIs2KpCLdkvUa5v3Yss_uRKISWzZELOl24iGJKOKzNIhP53PtC7YEbD1OBDKaYOjyptiUXFGLr6Xx1PfBRK2_bZOMJHB6jvzC5tVjdbzYGyEAxN9J7KJgx7oKo0kpV787ClReNx4T8f8h5',
    email: 'msterling@care.org',
    phone: '(555) 888-2211',
    department: 'Cardiology',
    notes: 'Pacemaker calibration completed.',
    dateAdded: 'Oct 12, 2023'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-101',
    time: '09:00 AM',
    date: '2023-10-12',
    patientName: 'Sarah Jenkins',
    patientInitials: 'SJ',
    department: 'Cardiology',
    doctor: 'Dr. Smith',
    type: 'Annual Physical',
    status: 'Completed',
    urgency: 'Low',
    notes: 'Vitals stable. BP 120/80.'
  },
  {
    id: 'APT-102',
    time: '09:30 AM',
    date: '2023-10-12',
    patientName: 'Eleanor James',
    patientInitials: 'EJ',
    department: 'Cardiology',
    doctor: 'Dr. Smith',
    type: 'Follow-up Consultation',
    status: 'Upcoming',
    urgency: 'Medium',
    notes: 'Review ECG test results.'
  },
  {
    id: 'APT-103',
    time: '10:30 AM',
    date: '2023-10-12',
    patientName: 'Marcus Sterling',
    patientInitials: 'MS',
    patientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAClsVR_HrEV0B7n9tzO_2cpu5aRg1jjth75zVi9hI81KjNJDythkejM2dQgEb0xAQYuaHBQ648DIsGBf_zTAAXcjvEQYzkOXWixgjbYoNIs2KpCLdkvUa5v3Yss_uRKISWzZELOl24iGJKOKzNIhP53PtC7YEbD1OBDKaYOjyptiUXFGLr6Xx1PfBRK2_bZOMJHB6jvzC5tVjdbzYGyEAxN9J7KJgx7oKo0kpV787ClReNx4T8f8h5',
    department: 'General Practice',
    doctor: 'Dr. Adams',
    type: 'General Checkup',
    status: 'In Progress',
    urgency: 'Low',
    notes: 'Comprehensive senior wellness check.'
  },
  {
    id: 'APT-104',
    time: '11:15 AM',
    date: '2023-10-12',
    patientName: 'Thomas Reed',
    patientInitials: 'TR',
    department: 'Neurology',
    doctor: 'Dr. Vance',
    type: 'Neurology Follow-up',
    status: 'Waiting',
    urgency: 'High',
    notes: 'Seizure monitoring follow up.'
  },
  {
    id: 'APT-105',
    time: '11:15 AM',
    date: '2023-10-12',
    patientName: 'Emily Davis',
    patientInitials: 'ED',
    department: 'Cardiology',
    doctor: 'Dr. Smith',
    type: 'Medication Review',
    status: 'Canceled',
    urgency: 'Medium',
    notes: 'Rescheduled due to emergency.'
  },
  {
    id: 'APT-106',
    time: '01:00 PM',
    date: '2023-10-12',
    patientName: 'Robert Chen',
    patientInitials: 'RC',
    department: 'Cardiology',
    doctor: 'Dr. Smith',
    type: 'Medication Review',
    status: 'Upcoming',
    urgency: 'Low',
    notes: 'Statins dosage adjustment.'
  }
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'ACT-1',
    type: 'lab',
    patientName: 'M. Johnson',
    description: 'Lab results for M. Johnson are ready.',
    timestamp: '10 mins ago',
    statusColor: 'bg-[#10b981]'
  },
  {
    id: 'ACT-2',
    type: 'referral',
    patientName: 'Dr. Adams',
    description: 'New referral received from Dr. Adams.',
    timestamp: '1 hour ago',
    statusColor: 'bg-[#0051d5]'
  },
  {
    id: 'ACT-3',
    type: 'prescription',
    patientName: 'L. Martinez',
    description: 'Prescription refill approved for L. Martinez.',
    timestamp: 'Yesterday at 4:30 PM',
    statusColor: 'bg-[#74777f]'
  },
  {
    id: 'ACT-4',
    type: 'appointment',
    patientName: 'Eleanor Shellstrop',
    description: 'Appointment confirmed for tomorrow at 09:00 AM.',
    timestamp: '2 hours ago',
    statusColor: 'bg-[#316bf3]'
  }
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'MED-101',
    patientId: 'PT-8472',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily in morning',
    prescribedDate: '2023-09-15',
    status: 'Active',
    refillsRemaining: 3,
    doctor: 'Dr. Smith',
    notes: 'For blood pressure control. Monitor serum potassium.'
  },
  {
    id: 'MED-102',
    patientId: 'PT-8472',
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily at bedtime',
    prescribedDate: '2023-08-01',
    status: 'Active',
    refillsRemaining: 1,
    doctor: 'Dr. Smith',
    notes: 'Lipid management.'
  },
  {
    id: 'MED-103',
    patientId: 'PT-8472',
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Three times daily for 7 days',
    prescribedDate: '2023-04-10',
    status: 'Archived',
    refillsRemaining: 0,
    doctor: 'Dr. Adams',
    notes: 'Completed full course for upper respiratory infection.'
  },
  {
    id: 'MED-104',
    patientId: 'PT-8473',
    name: 'Sumatriptan',
    dosage: '50mg',
    frequency: 'As needed at onset of migraine',
    prescribedDate: '2023-10-01',
    status: 'Active',
    refillsRemaining: 2,
    doctor: 'Dr. Vance',
    notes: 'Do not exceed 200mg in 24 hours.'
  },
  {
    id: 'MED-105',
    patientId: 'PT-8492',
    name: 'Metoprolol Succinate',
    dosage: '25mg',
    frequency: 'Once daily',
    prescribedDate: '2023-10-18',
    status: 'Active',
    refillsRemaining: 4,
    doctor: 'Dr. Smith',
    notes: 'Post-op cardiac recovery protocol.'
  }
];

export const INITIAL_VITALS: VitalRecord[] = [
  {
    id: 'VIT-201',
    patientId: 'PT-8472',
    timestamp: '2023-11-02 09:15 AM',
    heartRate: 72,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    temperature: 98.6,
    recordedBy: 'Nurse Jessica R.N.',
    notes: 'Patient feels comfortable. Vitals within normal limits.'
  },
  {
    id: 'VIT-202',
    patientId: 'PT-8472',
    timestamp: '2023-10-14 10:30 AM',
    heartRate: 78,
    bloodPressureSystolic: 128,
    bloodPressureDiastolic: 84,
    temperature: 98.4,
    recordedBy: 'Dr. Smith',
    notes: 'Mildly elevated BP following staircase climb.'
  },
  {
    id: 'VIT-203',
    patientId: 'PT-8473',
    timestamp: '2023-10-15 02:00 PM',
    heartRate: 84,
    bloodPressureSystolic: 132,
    bloodPressureDiastolic: 88,
    temperature: 99.1,
    recordedBy: 'Dr. Vance',
    notes: 'Slightly elevated pulse, patient reporting migraine onset.'
  },
  {
    id: 'VIT-204',
    patientId: 'PT-8492',
    timestamp: '2023-10-24 11:00 AM',
    heartRate: 68,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 76,
    temperature: 98.2,
    recordedBy: 'Dr. Smith',
    notes: 'Excellent post-op recovery numbers.'
  }
];


export const INITIAL_LABS: LabResult[] = [
  { id: 'LAB-1', patientId: 'PT-8472', testName: 'Hemoglobin A1c', date: '2023-11-01', value: '6.2', unit: '%', status: 'High' },
  { id: 'LAB-2', patientId: 'PT-8472', testName: 'LDL Cholesterol', date: '2023-11-01', value: '110', unit: 'mg/dL', status: 'Normal' },
  { id: 'LAB-3', patientId: 'PT-8473', testName: 'Potassium', date: '2023-10-10', value: '3.2', unit: 'mEq/L', status: 'Low', notes: 'Consider supplement' }
];
