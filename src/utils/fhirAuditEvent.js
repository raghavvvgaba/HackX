import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a FHIR AuditEvent resource for patient access
 * @param {Object} params - Audit event parameters
 * @param {string} params.doctorId - The doctor's user ID
 * @param {string} params.doctorName - The doctor's name
 * @param {string} params.patientId - The patient's user ID
 * @param {string} params.action - Action type: 'R' (Read), 'C' (Create), 'U' (Update), 'D' (Delete)
 * @param {string} params.resourceType - Type of resource accessed (Patient, Observation, etc.)
 * @param {string} params.outcome - '0' (Success), '4' (Minor failure), '8' (Serious failure)
 * @param {string} params.description - Human readable description
 * @param {string} params.ipAddress - IP address of the user
 * @returns {Object} FHIR AuditEvent resource
 */
export function createAccessAuditEvent({
  doctorId,
  doctorName,
  patientId,
  action = 'R',
  resourceType = 'Patient',
  outcome = '0',
  description = '',
  ipAddress = ''
}) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    id: uuidv4(),
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: 'rest',
        display: 'Restful Operation'
      }],
      text: 'Restful Operation'
    },
    subtype: [{
      coding: [{
        system: 'http://hl7.org/fhir/restful-interaction',
        code: action === 'R' ? 'read' : action === 'C' ? 'create' : action === 'U' ? 'update' : 'delete',
        display: action === 'R' ? 'Read' : action === 'C' ? 'Create' : action === 'U' ? 'Update' : 'Delete'
      }]
    }],
    action: action,
    recorded: new Date().toISOString(),
    outcome: outcome,
    outcomeDesc: outcome === '0' ? 'Success' : outcome === '4' ? 'Minor Failure' : 'Serious Failure',
    // Agent who performed the action (doctor)
    agent: [{
      who: {
        reference: `Practitioner/${doctorId}`,
        display: doctorName
      },
      name: doctorName,
      requestor: true,
      network: ipAddress ? {
        address: ipAddress,
        type: '2' // IP address
      } : undefined
    }, {
      // The application/system
      who: {
        display: 'HealSync Web Application'
      },
      altId: 'healsync-web',
      requestor: false
    }],
    // Source where event occurred
    source: {
      site: 'HealSync',
      observer: {
        display: 'HealSync Server'
      },
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
          code: '4',
          display: 'Application Server'
        }]
      }]
    },
    // What was accessed
    entity: [{
      what: {
        reference: `Patient/${patientId}`
      },
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/entity-role',
          code: '1',
          display: 'Patient'
        }]
      },
      description: description
    }]
  };

  // Add specific resource if provided
  if (resourceType !== 'Patient') {
    auditEvent.entity.push({
      what: {
        type: resourceType,
        reference: `${resourceType}/unknown`
      },
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/entity-role',
          code: '4',
          display: 'Domain Resource'
        }]
      }
    });
  }

  return auditEvent;
}

/**
 * Creates a FHIR AuditEvent for data export operations
 * @param {Object} params - Export parameters
 * @param {string} params.doctorId - The doctor's user ID
 * @param {string} params.doctorName - The doctor's name
 * @param {string} params.patientId - The patient's user ID
 * @param {Array} params.resourcesExported - List of resource types exported
 * @param {string} params.ipAddress - IP address of the user
 * @returns {Object} FHIR AuditEvent resource
 */
export function createDataExportAuditEvent({
  doctorId,
  doctorName,
  patientId,
  resourcesExported = [],
  ipAddress = ''
}) {
  return {
    resourceType: 'AuditEvent',
    id: uuidv4(),
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: 'export',
        display: 'Export'
      }]
    },
    subtype: [{
      coding: [{
        system: 'http://hl7.org/fhir/restful-interaction',
        code: 'search',
        display: 'Search'
      }]
    }],
    action: 'E', // E = Execute
    recorded: new Date().toISOString(),
    outcome: '0',
    outcomeDesc: 'Success',
    agent: [{
      who: {
        reference: `Practitioner/${doctorId}`,
        display: doctorName
      },
      name: doctorName,
      requestor: true,
      network: ipAddress ? {
        address: ipAddress,
        type: '2'
      } : undefined
    }],
    source: {
      site: 'HealSync',
      observer: {
        display: 'HealSync Server'
      }
    },
    entity: [{
      what: {
        reference: `Patient/${patientId}`
      },
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/entity-role',
          code: '1',
          display: 'Patient'
        }]
      },
      description: `Exported patient data: ${resourcesExported.join(', ')}`
    }, {
      what: {
        display: 'FHIR Bundle Export'
      },
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/entity-role',
          code: '4',
          display: 'Domain Resource'
        }]
      },
      detail: [{
        type: 'exported-resources',
        valueString: resourcesExported.join(',')
      }]
    }]
  };
}

/**
 * Creates a FHIR AuditEvent for authentication events
 * @param {Object} params - Auth parameters
 * @param {string} params.userId - The user's ID
 * @param {string} params.userName - The user's name
 * @param {string} params.action - 'login' or 'logout'
 * @param {string} params.outcome - '0' (Success), '4' (Minor failure)
 * @param {string} params.ipAddress - IP address of the user
 * @returns {Object} FHIR AuditEvent resource
 */
export function createAuthAuditEvent({
  userId,
  userName,
  action = 'login',
  outcome = '0',
  ipAddress = ''
}) {
  return {
    resourceType: 'AuditEvent',
    id: uuidv4(),
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: '110110',
        display: 'Authentication'
      }]
    },
    subtype: [{
      coding: [{
        system: 'http://hl7.org/CodeSystem/audit-event-sub-type',
        code: action === 'login' ? '110122' : '110123',
        display: action === 'login' ? 'Login' : 'Logout'
      }]
    }],
    action: 'E', // Execute
    recorded: new Date().toISOString(),
    outcome: outcome,
    outcomeDesc: outcome === '0' ? 'Success' : 'Failed Authentication',
    agent: [{
      who: {
        reference: `Practitioner/${userId}`,
        display: userName
      },
      name: userName,
      requestor: true,
      network: ipAddress ? {
        address: ipAddress,
        type: '2'
      } : undefined
    }],
    source: {
      site: 'HealSync',
      observer: {
        display: 'HealSync Auth Service'
      }
    },
    entity: [{
      what: {
        display: 'User Authentication Event'
      },
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/entity-role',
          code: '3',
          display: 'User'
        }]
      },
      description: `${action === 'login' ? 'User login' : 'User logout'} - ${outcome === '0' ? 'Success' : 'Failed'}`
    }]
  };
}

/**
 * Converts FHIR AuditEvent to human-readable format for patient dashboard
 * @param {Object} auditEvent - FHIR AuditEvent resource
 * @returns {Object} Human-readable audit log entry
 */
export function formatAuditEventForDisplay(auditEvent) {
  const actor = auditEvent.agent?.find(a => a.requestor);
  const patientEntity = auditEvent.entity?.find(e => e.type?.coding?.[0]?.code === '1');

  let actionText = '';
  if (auditEvent.subtype?.[0]?.coding?.[0]?.display) {
    actionText = auditEvent.subtype[0].coding[0].display;
  }

  // Map to friendly descriptions
  const actionMap = {
    'Read': 'Viewed your medical records',
    'Create': 'Added new medical record',
    'Update': 'Updated medical record',
    'Delete': 'Deleted medical record',
    'Login': 'Logged into the system',
    'Logout': 'Logged out of the system',
    'Export': 'Downloaded your medical data'
  };

  return {
    id: auditEvent.id,
    timestamp: auditEvent.recorded,
    actor: actor?.name || 'Unknown Doctor',
    action: actionMap[actionText] || actionText || 'Accessed your data',
    details: patientEntity?.description || '',
    location: actor?.network?.address || '',
    authorized: auditEvent.outcome === '0'
  };
}

/**
 * Validates if a resource is a proper FHIR AuditEvent
 * @param {Object} resource - Resource to validate
 * @returns {boolean} True if valid AuditEvent
 */
export function validateAuditEvent(resource) {
  if (!resource || resource.resourceType !== 'AuditEvent') {
    return false;
  }

  const requiredFields = ['type', 'action', 'recorded', 'outcome', 'agent', 'source'];
  for (const field of requiredFields) {
    if (!resource[field]) {
      return false;
    }
  }

  return true;
}