// Mock data for hospital module - for frontend development without Firebase

export const mockHospitalUser = {
  uid: 'mock-hospital-admin-001',
  email: 'admin@hospital.com',
  role: 'hospital_admin',
  displayName: 'Hospital Administrator'
};

export const mockInstitution = {
  id: 'mock-institution-001',
  institutionId: 'HOSP-1234-5678',
  name: 'St. Mary\'s Medical Center',
  type: 'hospital',
  address: {
    street: '123 Healthcare Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  },
  contact: {
    phone: '+1 (212) 555-0100',
    email: 'contact@stmarys.com',
    website: 'https://www.stmarys.com'
  },
  departments: [
    {
      id: 'dept-001',
      name: 'Cardiology',
      headDoctorId: 'dr-001',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'dept-002',
      name: 'Neurology',
      headDoctorId: 'dr-002',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'dept-003',
      name: 'Pediatrics',
      headDoctorId: 'dr-003',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'dept-004',
      name: 'Orthopedics',
      headDoctorId: null,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'dept-005',
      name: 'Emergency Medicine',
      headDoctorId: 'dr-005',
      createdAt: '2024-01-15T10:00:00Z'
    }
  ],
  licenses: [
    {
      type: 'State Medical License',
      number: 'NY-HOSP-12345',
      expiryDate: '2025-12-31'
    },
    {
      type: 'Federal Healthcare Provider',
      number: 'FED-987654',
      expiryDate: '2026-06-30'
    }
  ],
  adminUserId: 'mock-hospital-admin-001',
  verified: true,
  active: true,
  metadata: {
    totalBeds: 250,
    establishedYear: 1985,
    specializations: ['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics']
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T15:30:00Z'
};

export const mockStaff = [
  {
    id: 'staff-001',
    institutionId: 'mock-institution-001',
    userId: 'dr-001',
    name: 'Dr. John Smith',
    role: 'Doctor',
    department: 'Cardiology',
    email: 'john.smith@stmarys.com',
    phone: '+1 (212) 555-0101',
    permissions: ['view_records', 'edit_records', 'request_consent'],
    active: true,
    joinedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'staff-002',
    institutionId: 'mock-institution-001',
    userId: 'dr-002',
    name: 'Dr. Sarah Johnson',
    role: 'Doctor',
    department: 'Neurology',
    email: 'sarah.johnson@stmarys.com',
    phone: '+1 (212) 555-0102',
    permissions: ['view_records', 'edit_records'],
    active: true,
    joinedAt: '2024-01-22T10:00:00Z'
  },
  {
    id: 'staff-003',
    institutionId: 'mock-institution-001',
    userId: 'nurse-001',
    name: 'Emily Davis',
    role: 'Nurse',
    department: 'Pediatrics',
    email: 'emily.davis@stmarys.com',
    phone: '+1 (212) 555-0103',
    permissions: ['view_records'],
    active: true,
    joinedAt: '2024-01-25T10:00:00Z'
  },
  {
    id: 'staff-004',
    institutionId: 'mock-institution-001',
    userId: 'admin-002',
    name: 'Michael Brown',
    role: 'Administrator',
    department: 'Administration',
    email: 'michael.brown@stmarys.com',
    phone: '+1 (212) 555-0104',
    permissions: ['view_records', 'manage_staff'],
    active: true,
    joinedAt: '2024-02-01T10:00:00Z'
  }
];

export const mockConsentRequests = [
  {
    id: 'consent-req-001',
    institutionId: 'mock-institution-001',
    institutionName: 'St. Mary\'s Medical Center',
    patientId: 'patient-001',
    patientName: 'Alice Williams',
    patientEmail: 'alice.williams@email.com',
    requestedBy: 'mock-hospital-admin-001',
    purpose: 'Routine cardiology consultation and treatment',
    requestedPermissions: ['view_medical_history', 'view_prescriptions', 'view_lab_results'],
    status: 'pending',
    createdAt: '2024-01-28T14:30:00Z',
    expiresAt: '2024-02-28T14:30:00Z'
  },
  {
    id: 'consent-req-002',
    institutionId: 'mock-institution-001',
    institutionName: 'St. Mary\'s Medical Center',
    patientId: 'patient-002',
    patientName: 'Bob Martinez',
    patientEmail: 'bob.martinez@email.com',
    requestedBy: 'dr-002',
    purpose: 'Neurological assessment and follow-up',
    requestedPermissions: ['view_medical_history', 'view_imaging_reports'],
    status: 'approved',
    createdAt: '2024-01-25T10:00:00Z',
    approvedAt: '2024-01-26T09:15:00Z',
    expiresAt: '2024-04-25T10:00:00Z'
  },
  {
    id: 'consent-req-003',
    institutionId: 'mock-institution-001',
    institutionName: 'St. Mary\'s Medical Center',
    patientId: 'patient-003',
    patientName: 'Carol Thompson',
    patientEmail: 'carol.thompson@email.com',
    requestedBy: 'dr-001',
    purpose: 'Emergency cardiac evaluation',
    requestedPermissions: ['view_medical_history', 'view_prescriptions', 'view_lab_results', 'view_imaging_reports'],
    status: 'pending',
    createdAt: '2024-01-29T18:45:00Z',
    expiresAt: '2024-02-28T18:45:00Z'
  }
];

export const mockPatients = [
  {
    id: 'patient-001',
    userId: 'patient-001',
    name: 'Alice Williams',
    email: 'alice.williams@email.com',
    phone: '+1 (212) 555-1001',
    dateOfBirth: '1985-03-15',
    gender: 'Female',
    bloodGroup: 'A+',
    hasConsent: false,
    consentStatus: 'pending'
  },
  {
    id: 'patient-002',
    userId: 'patient-002',
    name: 'Bob Martinez',
    email: 'bob.martinez@email.com',
    phone: '+1 (212) 555-1002',
    dateOfBirth: '1978-07-22',
    gender: 'Male',
    bloodGroup: 'O+',
    hasConsent: true,
    consentStatus: 'approved',
    consentGrantedAt: '2024-01-26T09:15:00Z'
  },
  {
    id: 'patient-003',
    userId: 'patient-003',
    name: 'Carol Thompson',
    email: 'carol.thompson@email.com',
    phone: '+1 (212) 555-1003',
    dateOfBirth: '1992-11-08',
    gender: 'Female',
    bloodGroup: 'B-',
    hasConsent: false,
    consentStatus: 'pending'
  },
  {
    id: 'patient-004',
    userId: 'patient-004',
    name: 'David Chen',
    email: 'david.chen@email.com',
    phone: '+1 (212) 555-1004',
    dateOfBirth: '1965-05-30',
    gender: 'Male',
    bloodGroup: 'AB+',
    hasConsent: true,
    consentStatus: 'approved',
    consentGrantedAt: '2024-01-20T11:00:00Z'
  }
];

export const mockAuditLogs = [
  {
    id: 'audit-001',
    institutionId: 'mock-institution-001',
    userId: 'dr-001',
    userName: 'Dr. John Smith',
    action: 'VIEW_PATIENT_RECORD',
    patientId: 'patient-002',
    patientName: 'Bob Martinez',
    details: 'Viewed medical history',
    timestamp: '2024-01-27T10:30:00Z',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'audit-002',
    institutionId: 'mock-institution-001',
    userId: 'mock-hospital-admin-001',
    userName: 'Hospital Administrator',
    action: 'CONSENT_REQUEST_CREATED',
    patientId: 'patient-001',
    patientName: 'Alice Williams',
    details: 'Created consent request for cardiology consultation',
    timestamp: '2024-01-28T14:30:00Z',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'audit-003',
    institutionId: 'mock-institution-001',
    userId: 'dr-002',
    userName: 'Dr. Sarah Johnson',
    action: 'VIEW_LAB_RESULTS',
    patientId: 'patient-002',
    patientName: 'Bob Martinez',
    details: 'Accessed lab results for neurological assessment',
    timestamp: '2024-01-28T16:45:00Z',
    ipAddress: '192.168.1.102'
  }
];

export const mockDashboardStats = {
  totalPatients: 4,
  activeConsents: 2,
  pendingRequests: 2,
  totalStaff: 4,
  totalDepartments: 5,
  recentActivity: 12
};
