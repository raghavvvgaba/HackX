/**
 * Migration Control Component
 * Provides UI to run FHIR migration
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDatabase, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiDownload } from 'react-icons/fi';
import { runCompleteFHIRMigration } from '../utils/completeFHIRMigration';

const MigrationControl = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (log) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: log }]);
  };

  const runMigration = async () => {
    setStatus('running');
    setLogs([]);
    addLog('🚀 Starting FHIR Migration...');
    setMessage('Migrating data to FHIR format...');

    try {
      const result = await runCompleteFHIRMigration();

      if (result.success) {
        setStatus('success');
        setMessage('Migration completed successfully!');
        addLog('✅ Migration completed successfully!');
        addLog('📊 All data has been migrated to FHIR format');
        addLog('🔄 Original data preserved in existing collections');
      } else {
        setStatus('error');
        setMessage(`Migration failed: ${result.error}`);
        addLog(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Migration error: ${error.message}`);
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const downloadLogs = () => {
    const logsText = logs.map(log => `[${log.time}] ${log.text}`).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-migration-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background aurora-bg text-text px-3 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            FHIR Data Migration
          </h1>
          <p className="text-secondary">
            Migrate existing Firestore data to FHIR format for interoperability
          </p>
        </motion.div>

        {/* Migration Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 sm:p-8 border soft-divider mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FiDatabase className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-text">Migration Status</h2>
                <p className="text-sm text-secondary">
                  {status === 'idle' && 'Ready to migrate'}
                  {status === 'running' && 'Migration in progress...'}
                  {status === 'success' && 'Migration completed'}
                  {status === 'error' && 'Migration failed'}
                </p>
              </div>
            </div>
            <div className="text-4xl">
              {status === 'idle' && <FiDatabase className="text-secondary" />}
              {status === 'running' && <FiRefreshCw className="text-blue-400 animate-spin" />}
              {status === 'success' && <FiCheckCircle className="text-green-400" />}
              {status === 'error' && <FiAlertCircle className="text-red-400" />}
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-4 ${
              status === 'success' ? 'bg-green-500/20 text-green-300' :
              status === 'error' ? 'bg-red-500/20 text-red-300' :
              'bg-blue-500/20 text-blue-300'
            }`}>
              {message}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runMigration}
            disabled={status === 'running'}
            className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
              status === 'running'
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : status === 'success'
                ? 'bg-green-500 text-white'
                : 'glass-cta'
            }`}
          >
            {status === 'idle' && 'Start Migration'}
            {status === 'running' && 'Migrating...'}
            {status === 'success' && 'Migration Complete'}
            {status === 'error' && 'Retry Migration'}
          </motion.button>
        </motion.div>

        {/* Migration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 border soft-divider mb-6"
        >
          <h3 className="text-lg font-semibold text-text mb-3">What will be migrated?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-primary mb-2">From Firestore:</h4>
              <ul className="text-sm text-secondary space-y-1">
                <li>• users → doctors → FHIR Practitioners</li>
                <li>• userProfile → FHIR Patient</li>
                <li>• medicalRecords → FHIR Encounter</li>
                <li>• Vitals & conditions → Observations</li>
                <li>• Allergies → AllergyIntolerance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-2">To FHIR Collections:</h4>
              <ul className="text-sm text-secondary space-y-1">
                <li>• /fhir/practitioners/</li>
                <li>• /fhir/patients/</li>
                <li>• /fhir/encounters/</li>
                <li>• /fhir/audit-events/</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-secondary mt-4">
            Note: Original data is preserved. This uses dual storage approach.
          </p>
        </motion.div>

        {/* Migration Logs */}
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border soft-divider"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Migration Logs</h3>
              <button
                onClick={downloadLogs}
                className="flex items-center gap-2 px-3 py-1 text-sm text-primary hover:opacity-80"
              >
                <FiDownload />
                Download
              </button>
            </div>
            <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-secondary mb-1">
                  <span className="text-gray-500">[{log.time}]</span> {log.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Console Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 border soft-divider"
        >
          <h3 className="text-lg font-semibold text-text mb-3">Console Access</h3>
          <p className="text-sm text-secondary mb-2">
            You can also run the migration directly from browser console:
          </p>
          <code className="block bg-black/20 rounded-lg p-3 text-xs text-green-400">
            runFHIRMigration()
          </code>
        </motion.div>
      </div>
    </div>
  );
};

export default MigrationControl;