import MedicalRecordCard from './MedicalRecordCard';
import MedicalHistoryPage from './MedicalHistoryPage';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaFileMedicalAlt, FaCalendarAlt, FaStethoscope, FaPlus, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

const MedicalHistoryBlock = ({ records, loading, error, onRefresh }) => {
  const recentRecords = records?.slice(0, 3) || [];
  const totalRecords = records?.length || 0;

  return (
  <div className="glass rounded-2xl p-6 border soft-divider flex flex-col gap-6 hover-glow-primary">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
            <FaFileMedicalAlt className="text-sm" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text">Medical History</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="glass px-3 py-1 rounded-full text-xs sm:text-sm text-secondary border soft-divider">
            {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-secondary hover:text-text transition-colors duration-200 disabled:opacity-50"
              title="Refresh records"
            >
              <FaRedo className={`text-sm ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
    {loading && (
        <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-secondary">Loading medical records...</p>
        </div>
      )}

      {/* Error State */}
    {error && !loading && (
        <div className="text-center py-8">
          <FaExclamationTriangle className="text-red-400 text-4xl mb-4 mx-auto" />
      <p className="text-red-500 mb-2">Failed to load medical records</p>
      <p className="text-sm text-secondary mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
        className="glass-cta px-4 py-2"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Recent Records Preview */}
      {!loading && !error && (
        <>
          {recentRecords.length > 0 ? (
            <div className="space-y-3">
              {recentRecords.map((record, index) => (
                <div 
                  key={record.id || index}
                  className="p-4 glass rounded-lg border soft-divider hover-glow-primary"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaStethoscope className="text-primary text-sm" />
                      <h3 className="font-semibold text-text text-sm">
                        {record.diagnosis || 'General Checkup'}
                      </h3>
                    </div>
                    {record.visitDate && (
                      <span className="text-xs text-secondary flex items-center gap-1">
                        <FaCalendarAlt />
                        {new Date(record.visitDate).toLocaleDateString()}
                      </span>
                    )}
                    {record.createdAt && (
                      <span className="text-xs text-secondary flex items-center gap-1 mt-1">
                        <span>📝</span>
                        Added at {new Date(record.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  
                  {(record.doctorName || record.doctor?.name) && (
                    <p className="text-sm text-secondary mb-2">
                      <span className="font-medium">Doctor:</span> {record.doctorName || record.doctor?.name}
                    </p>
                  )}
                  
                  {record.symptoms && record.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {record.symptoms.slice(0, 3).map((symptom, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 rounded text-xs bg-white/10 text-secondary"
                        >
                          {symptom}
                        </span>
                      ))}
                      {record.symptoms.length > 3 && (
                        <span className="px-2 py-1 rounded text-xs bg-white/10 text-secondary">
                          +{record.symptoms.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaFileMedicalAlt className="text-gray-400 text-4xl mb-4 mx-auto" />
              <p className="text-secondary mb-2">No medical records yet</p>
              <p className="text-sm text-secondary">Your medical history will appear here</p>
            </div>
          )}

          {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t soft-divider">
            <Link
              to="medical-history"
        className="flex-1 glass-cta flex items-center justify-center gap-2 px-4 py-3"
            >
              <FaFileMedicalAlt className="text-sm" />
              <span className="font-medium">View All Records</span>
              <FaArrowRight className="text-sm" />
            </Link>
          </div>

          {/* Footer */}
          <div className="pt-2">
            <p className="text-xs text-secondary text-center">
              Keep your medical records updated and organized
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MedicalHistoryBlock;
