import { doc, setDoc, getDocs, collection, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  createAccessAuditEvent,
  createDataExportAuditEvent,
  createAuthAuditEvent,
  validateAuditEvent
} from '../utils/fhirAuditEvent';

/**
 * Logs when a doctor accesses a patient's data
 * @param {string} doctorId - The doctor's user ID
 * @param {string} doctorName - The doctor's name
 * @param {string} patientId - The patient's user ID
 * @param {string} resourceType - Type of resource accessed (Patient, Observation, etc.)
 * @param {string} description - Description of what was accessed
 * @param {string} ipAddress - IP address of the user
 * @returns {Promise<Object>} - Success/error result
 */
export async function logPatientAccess({
  doctorId,
  doctorName,
  patientId,
  resourceType = 'Patient',
  description = '',
  ipAddress = ''
}) {
  try {
    // Create FHIR AuditEvent
    const auditEvent = createAccessAuditEvent({
      doctorId,
      doctorName,
      patientId,
      action: 'R', // Read action
      resourceType,
      outcome: '0', // Success
      description,
      ipAddress
    });

    // Validate the event
    validateAuditEvent(auditEvent);

    // Save to Firestore
    const auditRef = doc(db, 'fhir', 'auditEvents', auditEvent.id);
    await setDoc(auditRef, auditEvent);

    console.log(`Audit logged: Dr. ${doctorName} accessed patient ${patientId}`);

    return {
      success: true,
      auditId: auditEvent.id
    };
  } catch (error) {
    console.error('Error logging patient access:', error);
    // Don't fail the operation if audit logging fails
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logs when a doctor creates/updates/deletes a medical record
 * @param {string} doctorId - The doctor's user ID
 * @param {string} doctorName - The doctor's name
 * @param {string} patientId - The patient's user ID
 * @param {string} action - 'C' (Create), 'U' (Update), 'D' (Delete)
 * @param {string} recordType - Type of record modified
 * @param {string} description - Description of the action
 * @param {string} ipAddress - IP address of the user
 * @returns {Promise<Object>} - Success/error result
 */
export async function logMedicalRecordAccess({
  doctorId,
  doctorName,
  patientId,
  action = 'C',
  recordType = 'Encounter',
  description = '',
  ipAddress = ''
}) {
  try {
    const auditEvent = createAccessAuditEvent({
      doctorId,
      doctorName,
      patientId,
      action,
      resourceType: recordType,
      outcome: '0',
      description,
      ipAddress
    });

    validateAuditEvent(auditEvent);

    const auditRef = doc(db, 'fhir', 'auditEvents', auditEvent.id);
    await setDoc(auditRef, auditEvent);

    const actionText = action === 'C' ? 'created' : action === 'U' ? 'updated' : 'deleted';
    console.log(`Audit logged: Dr. ${doctorName} ${actionText} ${recordType} for patient ${patientId}`);

    return {
      success: true,
      auditId: auditEvent.id
    };
  } catch (error) {
    console.error('Error logging medical record access:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logs when data is exported/downloaded
 * @param {string} doctorId - The doctor's user ID
 * @param {string} doctorName - The doctor's name
 * @param {string} patientId - The patient's user ID
 * @param {Array} resourcesExported - List of resource types exported
 * @param {string} ipAddress - IP address of the user
 * @returns {Promise<Object>} - Success/error result
 */
export async function logDataExport({
  doctorId,
  doctorName,
  patientId,
  resourcesExported = [],
  ipAddress = ''
}) {
  try {
    const auditEvent = createDataExportAuditEvent({
      doctorId,
      doctorName,
      patientId,
      resourcesExported,
      ipAddress
    });

    validateAuditEvent(auditEvent);

    const auditRef = doc(db, 'fhir', 'auditEvents', auditEvent.id);
    await setDoc(auditRef, auditEvent);

    console.log(`Audit logged: Dr. ${doctorName} exported data for patient ${patientId}`);

    return {
      success: true,
      auditId: auditEvent.id
    };
  } catch (error) {
    console.error('Error logging data export:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logs authentication events (login/logout)
 * @param {string} userId - The user's ID
 * @param {string} userName - The user's name
 * @param {string} action - 'login' or 'logout'
 * @param {boolean} success - Whether the action was successful
 * @param {string} ipAddress - IP address of the user
 * @returns {Promise<Object>} - Success/error result
 */
export async function logAuthentication({
  userId,
  userName,
  action = 'login',
  success = true,
  ipAddress = ''
}) {
  try {
    const auditEvent = createAuthAuditEvent({
      userId,
      userName,
      action,
      outcome: success ? '0' : '4',
      ipAddress
    });

    validateAuditEvent(auditEvent);

    const auditRef = doc(db, 'fhir', 'auditEvents', auditEvent.id);
    await setDoc(auditRef, auditEvent);

    console.log(`Audit logged: User ${userName} ${action} ${success ? 'success' : 'failed'}`);

    return {
      success: true,
      auditId: auditEvent.id
    };
  } catch (error) {
    console.error('Error logging authentication:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets the audit trail for a specific patient
 * @param {string} patientId - The patient's user ID
 * @param {number} limit - Number of records to fetch (default: 50)
 * @returns {Promise<Object>} - Success/error result with audit logs
 */
export async function getPatientAuditTrail(patientId, limit = 50) {
  try {
    const auditEventsRef = collection(db, 'fhir', 'auditEvents');
    const q = query(
      auditEventsRef,
      where('entity', 'array-contains', {
        what: {
          reference: `Patient/${patientId}`
        }
      }),
      orderBy('recorded', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    const auditLogs = [];

    querySnapshot.forEach((doc) => {
      const auditEvent = doc.data();
      auditLogs.push({
        ...auditEvent,
        id: doc.id
      });
    });

    return {
      success: true,
      data: auditLogs,
      total: auditLogs.length
    };
  } catch (error) {
    console.error('Error fetching patient audit trail:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets the audit trail for a specific doctor
 * @param {string} doctorId - The doctor's user ID
 * @param {number} limit - Number of records to fetch (default: 50)
 * @returns {Promise<Object>} - Success/error result with audit logs
 */
export async function getDoctorAuditTrail(doctorId, limit = 50) {
  try {
    const auditEventsRef = collection(db, 'fhir', 'auditEvents');
    const q = query(
      auditEventsRef,
      where('agent', 'array-contains', {
        who: {
          reference: `Practitioner/${doctorId}`
        }
      }),
      orderBy('recorded', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    const auditLogs = [];

    querySnapshot.forEach((doc) => {
      const auditEvent = doc.data();
      auditLogs.push({
        ...auditEvent,
        id: doc.id
      });
    });

    return {
      success: true,
      data: auditLogs,
      total: auditLogs.length
    };
  } catch (error) {
    console.error('Error fetching doctor audit trail:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets audit logs by entity reference
 * @param {string} entityReference - The entity reference (e.g., "Patient/123" or "Encounter/456")
 * @param {number} limit - Number of records to fetch (default: 50)
 * @returns {Promise<Object>} - Success/error result with audit logs
 */
export async function getAuditLogsByEntity(entityReference, limit = 50) {
  try {
    const auditEventsRef = collection(db, 'fhir', 'auditEvents');
    const q = query(
      auditEventsRef,
      where('entity', 'array-contains', {
        what: {
          reference: entityReference
        }
      }),
      orderBy('recorded', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    const auditLogs = [];

    querySnapshot.forEach((doc) => {
      const auditEvent = doc.data();
      auditLogs.push({
        ...auditEvent,
        id: doc.id
      });
    });

    return {
      success: true,
      data: auditLogs,
      total: auditLogs.length
    };
  } catch (error) {
    console.error('Error fetching audit logs by entity:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper function to get client IP address
 * @param {Object} request - Express request object (if available)
 * @returns {string} - IP address
 */
export function getClientIP(request) {
  return request?.headers['x-forwarded-for'] ||
         request?.headers['x-real-ip'] ||
         request?.connection?.remoteAddress ||
         request?.socket?.remoteAddress ||
         'unknown';
}

/**
 * Helper function to automatically log access when a doctor accesses patient data
 * This can be used as middleware or wrapper around existing functions
 * @param {string} doctorId - The doctor's user ID
 * @param {string} doctorName - The doctor's name
 * @param {string} patientId - The patient's user ID
 * @param {Function} operation - The operation to perform
 * @param {string} operationType - Type of operation being performed
 * @param {Object} request - Request object (if available)
 * @returns {Promise} - Result of the operation
 */
export async function withAuditLog({
  doctorId,
  doctorName,
  patientId,
  operation,
  operationType = 'Read Patient Data',
  request
}) {
  const ipAddress = getClientIP(request);

  try {
    // Perform the operation
    const result = await operation();

    // Log successful access
    await logPatientAccess({
      doctorId,
      doctorName,
      patientId,
      resourceType: 'Patient',
      description: operationType,
      ipAddress
    });

    return result;
  } catch (error) {
    // Log failed access attempt
    await logPatientAccess({
      doctorId,
      doctorName,
      patientId,
      resourceType: 'Patient',
      description: `${operationType} - Failed`,
      ipAddress
    });

    throw error;
  }
}