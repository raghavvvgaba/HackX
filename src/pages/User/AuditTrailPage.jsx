import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiShield, FiCalendar, FiClock, FiFilter, FiDownload, FiAlertTriangle, FiEye, FiEdit, FiActivity, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getPatientAuditDisplayData } from '../../utils/patientAuditDisplay';
import { exportPatientFHIRData } from '../../utils/fhirExport';
import { useAuth } from '../../context/authContext';

const AuditTrailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, view, update, create
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const result = await getPatientAuditDisplayData(user.uid);
        if (result.success) {
          setAuditData(result.data);
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAuditLogs();
    }
  }, [user]);

  const getFilteredLogs = () => {
    if (!auditData?.logs) return [];

    let filtered = [...auditData.logs];

    // Filter by action type
    if (filter !== 'all') {
      filtered = filtered.filter(log => {
        if (filter === 'view') return log.action.includes('Viewed') || log.action.includes('Accessed');
        if (filter === 'update') return log.action.includes('Updated') || log.action.includes('Edited') || log.action.includes('Modified');
        if (filter === 'create') return log.action.includes('Created') || log.action.includes('Added') || log.action.includes('Prescribed');
        return true;
      });
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(log => new Date(log.timestamp) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => new Date(log.timestamp) >= monthAgo);
    }

    return filtered;
  };

  const handleExportAuditLog = async () => {
    try {
      const logs = getFilteredLogs();
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting audit log:', error);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('Viewed') || action.includes('Accessed')) return <FiEye className="text-blue-500" />;
    if (action.includes('Updated') || action.includes('Edited') || action.includes('Added')) return <FiEdit className="text-yellow-500" />;
    if (action.includes('Downloaded') || action.includes('Exported')) return <FiDownload className="text-green-500" />;
    return <FiActivity className="text-gray-500" />;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background aurora-bg text-text px-3 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 glass rounded-xl border soft-divider"></div>
            <div className="h-96 glass rounded-2xl border soft-divider"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();
  const hasConcerns = auditData?.concerns && auditData.concerns.length > 0;

  return (
    <div className="min-h-screen bg-background aurora-bg text-text px-3 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-sm text-secondary hover-glow-primary"
            >
              <FiArrowLeft size={18} />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-2">Access History</h1>
          <p className="text-secondary">Complete audit trail of your medical record access</p>
        </motion.div>

        {/* Summary Cards */}
        {auditData?.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass rounded-xl p-4 border soft-divider">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm">Total Access</p>
                  <p className="text-2xl font-bold text-text">{auditData.summary.totalAccess}</p>
                </div>
                <FiActivity className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="glass rounded-xl p-4 border soft-divider">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm">Unique Doctors</p>
                  <p className="text-2xl font-bold text-text">{auditData.summary.uniqueDoctors.length}</p>
                </div>
                <FiShield className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="glass rounded-xl p-4 border soft-divider">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm">Last Access</p>
                  <p className="text-lg font-bold text-text">
                    {auditData.summary.lastAccess ?
                      new Date(auditData.summary.lastAccess).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'Never'
                    }
                  </p>
                </div>
                <FiClock className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="glass rounded-xl p-4 border soft-divider">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm">Security Status</p>
                  <p className="text-lg font-bold text-text">
                    {hasConcerns ? 'Alert' : 'Secure'}
                  </p>
                </div>
                {hasConcerns ?
                  <FiAlertTriangle className="w-8 h-8 text-yellow-400" /> :
                  <FiCheck className="w-8 h-8 text-green-400" />
                }
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Alerts */}
        <AnimatePresence>
          {hasConcerns && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-6"
            >
              {auditData.concerns.map((concern, index) => (
                <div key={index} className="glass border border-yellow-500/30 rounded-lg p-4 mb-3">
                  <div className="flex items-start space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-text font-medium">Security Alert</p>
                      <p className="text-secondary text-sm mt-1">{concern.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 mb-6 border soft-divider"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <FiFilter className="text-secondary" />
              <span className="text-secondary text-sm">Filter:</span>
            </div>

            <div className="flex gap-2">
              {['all', 'view', 'update', 'create'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    filter === f
                      ? 'bg-primary/30 text-primary border border-primary/50'
                      : 'glass text-secondary hover-glow-primary'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <FiCalendar className="text-secondary" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="glass text-secondary px-3 py-1 rounded-lg text-sm border soft-divider focus:outline-none focus:border-primary/50"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>

            <button
              onClick={handleExportAuditLog}
              className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition-all border border-green-500/30"
            >
              <FiDownload />
              <span>Export</span>
            </button>
          </div>
        </motion.div>

        {/* Audit Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl border soft-divider overflow-hidden"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FiShield className="w-16 h-16 text-secondary mx-auto mb-4" />
              <p className="text-secondary text-lg">No access history found</p>
              <p className="text-gray-500 text-sm mt-2">Your records have not been accessed yet</p>
            </div>
          ) : (
            <div className="divide-y divide-soft-divider">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-white/5 transition-colors ${
                    !log.authorized ? 'bg-red-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-text font-medium">{log.actor}</p>
                          {!log.authorized && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                              Failed
                            </span>
                          )}
                        </div>
                        <p className="text-secondary text-sm mt-1">{log.action}</p>
                        {log.details && (
                          <p className="text-gray-500 text-sm mt-1">{log.details}</p>
                        )}
                        {log.location && (
                          <p className="text-gray-500 text-xs mt-1">IP: {log.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-secondary text-sm">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-secondary text-sm">
            <FiShield className="inline mr-2" />
            Your health data is protected with enterprise-grade security and complete audit logging
          </p>
          <p className="text-gray-500 text-xs mt-2">
            All access attempts are logged and stored securely for 6 years as required by HIPAA
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuditTrailPage;