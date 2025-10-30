// Mock service for hospital module - bypasses Firebase for frontend development

import {
  mockHospitalUser,
  mockInstitution,
  mockStaff,
  mockConsentRequests,
  mockPatients,
  mockAuditLogs,
  mockDashboardStats
} from '../mockData/hospitalMockData';

// Mock delay to simulate API calls
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Institution Services
export async function createInstitution(adminUserId, institutionData) {
  await mockDelay(800);
  return {
    success: true,
    institutionId: 'mock-institution-001',
    institutionCode: 'HOSP-1234-5678',
    message: 'Institution created successfully (Mock Mode)'
  };
}

export async function getInstitutionByAdminId(adminUserId) {
  await mockDelay();
  if (adminUserId === mockHospitalUser.uid) {
    return { success: true, data: mockInstitution };
  }
  return { success: false, error: 'Institution not found' };
}

export async function getInstitutionById(institutionId) {
  await mockDelay();
  if (institutionId === mockInstitution.id) {
    return { success: true, data: mockInstitution };
  }
  return { success: false, error: 'Institution not found' };
}

export async function updateInstitution(institutionId, updateData) {
  await mockDelay();
  return { success: true, message: 'Institution updated successfully (Mock Mode)' };
}

export async function addDepartment(institutionId, department) {
  await mockDelay();
  const departmentId = `dept-${Date.now()}`;
  return { success: true, departmentId, message: 'Department added successfully (Mock Mode)' };
}

export async function removeDepartment(institutionId, departmentId) {
  await mockDelay();
  return { success: true, message: 'Department removed successfully (Mock Mode)' };
}

// Staff Services
export async function getInstitutionStaff(institutionId) {
  await mockDelay();
  return { success: true, data: mockStaff };
}

export async function addStaffMember(staffData) {
  await mockDelay();
  const staffId = `staff-${Date.now()}`;
  return { success: true, staffId, message: 'Staff member added successfully (Mock Mode)' };
}

export async function updateStaffMember(staffId, updateData) {
  await mockDelay();
  return { success: true, message: 'Staff member updated successfully (Mock Mode)' };
}

export async function removeStaffMember(staffId) {
  await mockDelay();
  return { success: true, message: 'Staff member removed successfully (Mock Mode)' };
}

// Consent Services
export async function getConsentRequests(institutionId, status = null) {
  await mockDelay();
  if (status) {
    const filtered = mockConsentRequests.filter(req => req.status === status);
    return { success: true, data: filtered };
  }
  return { success: true, data: mockConsentRequests };
}

export async function createConsentRequest(requestData) {
  await mockDelay();
  const requestId = `consent-req-${Date.now()}`;
  return { success: true, requestId, message: 'Consent request created successfully (Mock Mode)' };
}

export async function approveConsentRequest(requestId, patientId) {
  await mockDelay();
  return { success: true, message: 'Consent approved (Mock Mode)' };
}

export async function denyConsentRequest(requestId, patientId, reason) {
  await mockDelay();
  return { success: true, message: 'Consent denied (Mock Mode)' };
}

export async function revokeConsent(consentId, patientId) {
  await mockDelay();
  return { success: true, message: 'Consent revoked (Mock Mode)' };
}

// Patient Services
export async function getInstitutionPatients(institutionId) {
  await mockDelay();
  return { success: true, data: mockPatients };
}

export async function searchPatientByIdentifier(institutionId, searchTerm) {
  await mockDelay();
  const results = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return { success: true, data: results };
}

export async function getInstitutionPatientProfile(institutionId, patientId) {
  await mockDelay();
  const patient = mockPatients.find(p => p.id === patientId);
  if (patient) {
    return { success: true, data: patient };
  }
  return { success: false, error: 'Patient not found' };
}

// Audit Services
export async function getInstitutionAuditLogs(institutionId, filters = {}) {
  await mockDelay();
  return { success: true, data: mockAuditLogs };
}

export async function logAuditEvent(eventData) {
  await mockDelay();
  return { success: true, message: 'Audit event logged (Mock Mode)' };
}

// Dashboard Services
export async function getDashboardStats(institutionId) {
  await mockDelay();
  return { success: true, data: mockDashboardStats };
}

// Mock Authentication
export async function loginHospitalAdmin(email, password) {
  await mockDelay(800);
  
  if (email === 'admin@hospital.com' && password === 'hospital123') {
    return {
      success: true,
      user: mockHospitalUser,
      message: 'Login successful (Mock Mode)'
    };
  }
  
  return {
    success: false,
    error: 'Invalid credentials. Try: admin@hospital.com / hospital123'
  };
}

export function getMockHospitalUser() {
  return mockHospitalUser;
}

export function isMockMode() {
  return true;
}
