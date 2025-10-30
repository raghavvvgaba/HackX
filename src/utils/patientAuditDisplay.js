import { getPatientAuditTrail } from '../services/auditService';
import { formatAuditEventForDisplay } from '../utils/fhirAuditEvent';

/**
 * Gets formatted audit logs for a patient's dashboard
 * @param {string} patientId - The patient's user ID
 * @param {number} limit - Number of logs to fetch (default: 20)
 * @returns {Promise<Object>} - Formatted audit logs ready for display
 */
export async function getFormattedPatientAuditLogs(patientId, limit = 20) {
  try {
    // Get raw audit logs
    const auditResult = await getPatientAuditTrail(patientId, limit);

    if (!auditResult.success) {
      return {
        success: false,
        error: auditResult.error
      };
    }

    // Format each audit event for display
    const formattedLogs = auditResult.data.map(auditEvent => {
      return formatAuditEventForDisplay(auditEvent);
    });

    // Sort by timestamp (most recent first)
    formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      success: true,
      data: formattedLogs,
      total: formattedLogs.length
    };

  } catch (error) {
    console.error('Error getting formatted audit logs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Groups audit logs by date for better display
 * @param {Array} auditLogs - Array of formatted audit logs
 * @returns {Object} - Logs grouped by date
 */
export function groupAuditLogsByDate(auditLogs) {
  const grouped = {};

  auditLogs.forEach(log => {
    const date = new Date(log.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateLabel;
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (!grouped[dateLabel]) {
      grouped[dateLabel] = [];
    }

    grouped[dateLabel].push({
      ...log,
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  });

  return grouped;
}

/**
 * Creates a summary of audit activity for the patient
 * @param {Array} auditLogs - Array of formatted audit logs
 * @returns {Object} - Summary statistics
 */
export function createAuditSummary(auditLogs) {
  const summary = {
    totalAccess: 0,
    uniqueDoctors: new Set(),
    lastAccess: null,
    recentActivity: []
  };

  // Get last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  auditLogs.forEach(log => {
    const logDate = new Date(log.timestamp);

    // Count total access in last 7 days
    if (logDate > sevenDaysAgo) {
      summary.totalAccess++;
    }

    // Track unique doctors
    if (log.actor && log.actor !== 'Unknown Doctor') {
      summary.uniqueDoctors.add(log.actor);
    }

    // Find last access
    if (!summary.lastAccess || logDate > new Date(summary.lastAccess)) {
      summary.lastAccess = log.timestamp;
    }
  });

  // Convert Set to array
  summary.uniqueDoctors = Array.from(summary.uniqueDoctors);

  // Get recent activity (last 5)
  summary.recentActivity = auditLogs.slice(0, 5);

  return summary;
}

/**
 * Checks for unusual access patterns (for alerts)
 * @param {Array} auditLogs - Array of formatted audit logs
 * @returns {Object} - Potential concerns
 */
export function checkForUnusualAccess(auditLogs) {
  const concerns = [];
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  // Check for multiple doctors accessing in 24 hours
  const doctorsLast24Hours = new Set();
  let accessCountLast24Hours = 0;

  auditLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    if (logDate > last24Hours) {
      accessCountLast24Hours++;
      if (log.actor && log.actor !== 'Unknown Doctor') {
        doctorsLast24Hours.add(log.actor);
      }
    }
  });

  if (doctorsLast24Hours.size > 3) {
    concerns.push({
      type: 'multiple_doctors',
      message: `${doctorsLast24Hours.size} different doctors accessed your records in the last 24 hours`,
      severity: 'medium'
    });
  }

  // Check for high frequency access
  if (accessCountLast24Hours > 10) {
    concerns.push({
      type: 'high_frequency',
      message: `Your records were accessed ${accessCountLast24Hours} times in the last 24 hours`,
      severity: 'high'
    });
  }

  // Check for failed access attempts
  const failedAttempts = auditLogs.filter(log => !log.authorized);
  if (failedAttempts.length > 0) {
    concerns.push({
      type: 'failed_attempts',
      message: `${failedAttempts.length} unauthorized access attempts detected`,
      severity: 'high'
    });
  }

  return concerns;
}

/**
 * Formats audit logs for display in patient dashboard
 * @param {string} patientId - The patient's user ID
 * @returns {Promise<Object>} - Complete audit display data
 */
export async function getPatientAuditDisplayData(patientId) {
  try {
    // Get formatted audit logs
    const logsResult = await getFormattedPatientAuditLogs(patientId, 50);

    if (!logsResult.success) {
      return {
        success: false,
        error: logsResult.error
      };
    }

    const auditLogs = logsResult.data;

    // Group logs by date
    const groupedLogs = groupAuditLogsByDate(auditLogs);

    // Create summary
    const summary = createAuditSummary(auditLogs);

    // Check for concerns
    const concerns = checkForUnusualAccess(auditLogs);

    return {
      success: true,
      data: {
        logs: auditLogs,
        groupedLogs,
        summary,
        concerns
      }
    };

  } catch (error) {
    console.error('Error getting patient audit display data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example of how to use this in the frontend:
 *
 * const auditData = await getPatientAuditDisplayData(patientId);
 * if (auditData.success) {
 *   // Display in dashboard
 *   console.log('Recent Access:', auditData.data.summary.recentActivity);
 *   console.log('Grouped by Date:', auditData.data.groupedLogs);
 *   console.log('Concerns:', auditData.data.concerns);
 * }
 */