import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiClock, FiShield, FiAlertTriangle, FiEye, FiDownload, FiEdit, FiArrowRight } from 'react-icons/fi';
import { getPatientAuditDisplayData } from '../utils/patientAuditDisplay';
import { useAuth } from '../context/authContext';

const AuditLogsBlock = () => {
  const { user } = useAuth();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

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

  const getActionIcon = (action) => {
    if (action.includes('Viewed') || action.includes('Accessed')) return <FiEye className="text-primary" />;
    if (action.includes('Updated') || action.includes('Edited')) return <FiEdit className="text-yellow-400" />;
    if (action.includes('Downloaded') || action.includes('Exported')) return <FiDownload className="text-green-400" />;
    return <FiActivity className="text-secondary" />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const logsToShow = showAll ? auditData?.logs || [] : (auditData?.logs || []).slice(0, 5);
  const hasConcerns = auditData?.concerns && auditData.concerns.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 border soft-divider"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
            <FiShield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-text font-semibold">Access History</h3>
            <p className="text-secondary text-sm">Recent activity on your records</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-secondary">
          <FiClock className="w-4 h-4" />
          <span>Real-time</span>
        </div>
      </div>

      {/* Security Alert */}
      {hasConcerns && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-3 glass rounded-lg border border-yellow-500/30"
        >
          <div className="flex items-start space-x-2">
            <FiAlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-text text-sm font-medium">
                Security Alert
              </p>
              <p className="text-secondary text-xs mt-1">
                {auditData.concerns[0].message}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      {auditData?.summary && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass rounded-lg p-3 border soft-divider">
            <p className="text-secondary text-xs">Last 7 days</p>
            <p className="text-text font-semibold">{auditData.summary.totalAccess} accesses</p>
          </div>
          <div className="glass rounded-lg p-3 border soft-divider">
            <p className="text-secondary text-xs">Doctors</p>
            <p className="text-text font-semibold">{auditData.summary.uniqueDoctors.length}</p>
          </div>
        </div>
      )}

      {/* Audit Logs List */}
      <div className="space-y-2">
        {logsToShow.length === 0 ? (
          <div className="text-center py-8">
            <FiShield className="w-12 h-12 text-secondary mx-auto mb-3" />
            <p className="text-secondary text-sm">No access history yet</p>
            <p className="text-gray-500 text-xs mt-1">Your records are secure</p>
          </div>
        ) : (
          logsToShow.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                !log.authorized ? 'glass border border-red-500/20' : 'glass'
              } hover-glow-primary`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text text-sm font-medium line-clamp-1">
                  {log.actor}
                </p>
                <p className="text-secondary text-xs mt-0.5 line-clamp-2">
                  {log.action}
                </p>
                {log.details && (
                  <p className="text-gray-500 text-xs mt-1">
                    {log.details}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-secondary text-xs">
                  {formatTime(log.timestamp)}
                </p>
                {!log.authorized && (
                  <p className="text-red-400 text-xs mt-1">Failed</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* View All Button */}
      {auditData?.logs && auditData.logs.length > 5 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 text-center text-sm text-primary hover:opacity-80 transition-opacity"
        >
          {showAll ? 'Show Less' : `View All History (${auditData.logs.length})`}
        </motion.button>
      )}

      {/* Full Audit Trail Link */}
      <div className="mt-4 pt-4 border-t soft-divider">
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="/user/audit-trail"
          className="flex items-center justify-center space-x-2 px-4 py-2 glass rounded-lg border soft-divider text-sm text-primary hover-glow-primary transition-all"
        >
          <span>View Full Audit Trail</span>
          <FiArrowRight className="w-4 h-4" />
        </motion.a>
      </div>
    </motion.div>
  );
};

export default AuditLogsBlock;