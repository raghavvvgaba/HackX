import React, { useState, useEffect, useLayoutEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getPatientMedicalRecords } from '../utils/firestoreService';
import { exportPatientFHIRData } from '../utils/fhirExport';
import { FaFileMedicalAlt, FaRedo, FaExclamationTriangle, FaSpinner, FaDownload, FaEye } from 'react-icons/fa';

const MedicalHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Aggressive scroll reset - multiple attempts to ensure it works
  useLayoutEffect(() => {
    // Force scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also try after a minimal delay in case of async rendering
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchMedicalRecords(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMedicalRecords = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setMedicalRecords([]);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }

      const result = await getPatientMedicalRecords(
        user.uid,
        isInitial ? null : lastDoc,
        20,
        false
      );

      if (result.success) {
        const newRecords = result.data || [];
        if (isInitial) {
          setMedicalRecords(newRecords);
        } else {
          setMedicalRecords((prev) => [...prev, ...newRecords]);
        }
        setLastDoc(result.lastDoc || null);
        setHasMore(Boolean(result.hasMore));
      } else {
        setError(result.error || 'Failed to fetch medical records');
        if (isInitial) setMedicalRecords([]);
      }
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records');
      if (isInitial) setMedicalRecords([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchMedicalRecords(false);
  };

  const handleRefresh = () => {
    fetchMedicalRecords(true);
    // Also reset scroll on refresh
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const handleFHIRExport = async () => {
    try {
      setExporting(true);
      const result = await exportPatientFHIRData(user.uid);
      if (result.success) {
        // Success notification would go here
        console.log('FHIR export successful');
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const TagList = ({ items, colorClass }) => (
    <div className="flex flex-wrap gap-2">
      {items && items.length > 0 ? (
        items.map((item, idx) => (
          <span key={idx} className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {item}
          </span>
        ))
      ) : (
        <span className="text-sm text-gray-500 italic">None specified</span>
      )}
    </div>
  );

  const RecordCard = ({ record }) => (
    <div className="glass rounded-2xl p-5 sm:p-6 border soft-divider hover-glow-primary">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text">{record.diagnosis || 'Medical Record'}</h4>
          <p className="text-xs sm:text-sm text-secondary">
            {record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'No date specified'}
            {record.createdAt?.toDate ? ` at ${new Date(record.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            {' '}• {record.doctorName || record.doctor?.name || 'Unknown Doctor'}
          </p>
        </div>
        {record.fileUrl && (
          <div className="flex gap-2">
            <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-white/10 rounded-lg transition-colors" title="View file">
              <FaEye className="text-sm" />
            </a>
            <a href={record.fileUrl} download className="p-2 text-primary hover:bg-white/10 rounded-lg transition-colors" title="Download file">
              <FaDownload className="text-sm" />
            </a>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-text mb-2">Symptoms</p>
          <TagList items={record.symptoms} colorClass="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-text mb-2">Medicines</p>
          <TagList items={record.medicines} colorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" />
        </div>
        {record.prescribedTests && record.prescribedTests.length > 0 && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-text mb-2">Prescribed Tests</p>
            <TagList items={record.prescribedTests} colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" />
          </div>
        )}
        {record.followUpNotes && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-text mb-2">Follow-up Notes</p>
            <p className="text-sm text-secondary glass p-3 rounded-lg border soft-divider">{record.followUpNotes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background aurora-bg text-text px-3 sm:px-6 py-6">
      {/* Add ref to container for scroll debugging */}
      <div ref={(el) => {
        if (el) {
          // Debug: log scroll position when component renders
          console.log('MedicalHistoryPage scroll position:', window.scrollY, document.documentElement.scrollTop);
        }
      }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-sm text-secondary hover-glow-primary"
          >
            <FiArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFHIRExport}
            disabled={exporting || loading}
            className="glass rounded-lg border border-purple-500/30 px-4 py-2 text-sm text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
            title="Export as FHIR"
          >
            <span className="inline-flex items-center gap-2">
              <FaDownload className={`${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'Exporting...' : 'Export FHIR'}
            </span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="glass rounded-lg border soft-divider px-4 py-2 text-sm text-text hover-glow-primary disabled:opacity-50"
            title="Refresh records"
          >
            <span className="inline-flex items-center gap-2">
              <FaRedo className={`${loading ? 'animate-spin' : ''}`} />
              Refresh
            </span>
          </button>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-text mb-4">Your Complete Medical History</h1>

      {loading && (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-secondary">Loading your medical records...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-red-400 text-5xl mb-4 mx-auto" />
          <p className="text-red-500 mb-2 text-lg">Failed to load medical records</p>
          <p className="text-sm text-secondary mb-6">{error}</p>
          <button onClick={handleRefresh} className="glass-cta px-6 py-3">Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {medicalRecords.length > 0 ? (
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
              {hasMore && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 glass rounded-lg border soft-divider text-text hover-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="inline-flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load More Records'
                    )}
                  </button>
                </div>
              )}
              <div className="text-center mt-4 pt-4 border-t soft-divider">
                <p className="text-sm text-secondary">
                  Showing {medicalRecords.length} medical records
                  {!hasMore && medicalRecords.length > 0 && ' (all records loaded)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaFileMedicalAlt className="text-secondary text-6xl mb-6 mx-auto" />
              <h3 className="text-xl font-semibold text-text mb-2">No Medical Records Found</h3>
              <p className="text-secondary mb-6">
                Your medical history will appear here once doctors add records to your profile.
              </p>
              <button onClick={handleRefresh} className="glass-cta px-6 py-3">Check for New Records</button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default MedicalHistoryPage;
