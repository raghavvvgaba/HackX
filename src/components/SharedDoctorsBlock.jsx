import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getPatientSharedProfiles, revokeProfileAccess, shareProfileWithDoctor } from '../utils/firestoreService';
import { FaUserMd, FaCalendarAlt, FaTrashAlt, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaPlus } from 'react-icons/fa';
import { MdCancel } from 'react-icons/md';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

const SharedDoctorsBlock = () => {
  const { user } = useAuth();
  const [sharedProfiles, setSharedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmPopover, setConfirmPopover] = useState({ doctorId: null, doctorName: '' });
  const [showShareForm, setShowShareForm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);
  const [shareErrorMessage, setShareErrorMessage] = useState('');
  const [doctorName, setDoctorName] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (user?.uid) {
      fetchSharedProfiles();
    }
  }, [user]);

  const fetchSharedProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPatientSharedProfiles(user.uid);
      
      if (result.success) {
        setSharedProfiles(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to fetch shared profiles');
      console.error('Error fetching shared profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = (doctorId, doctorName) => {
    setConfirmPopover({ doctorId, doctorName });
  };

  const confirmRevoke = async () => {
    const { doctorId, doctorName } = confirmPopover;
    setRevoking(doctorId);
    setConfirmPopover({ doctorId: null, doctorName: '' });
    try {
      const result = await revokeProfileAccess(user.uid, doctorId);
      if (result.success) {
        setSharedProfiles(prev => prev.filter(profile => profile.doctorId !== doctorId));
        setNotification({
          type: 'success',
          message: `Successfully revoked ${doctorName}'s access to your profile.`
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to revoke access'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred'
      });
      console.error('Error revoking access:', error);
    } finally {
      setRevoking(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleShare = async (data) => {
    if (!user) {
      setShareErrorMessage('You must be logged in to share your profile');
      setShareStatus('error');
      return;
    }

    setIsSharing(true);
    setShareStatus(null);
    setShareErrorMessage('');
    
    try {
      const doctorIdCode = data.doctorId.toUpperCase();
      
      const shareResult = await shareProfileWithDoctor(
        user.uid, 
        doctorIdCode
      );
      
      if (shareResult.success) {
        setDoctorName(shareResult.doctorName || '');
        setShareStatus('success');
        // Refresh the shared profiles list
        await fetchSharedProfiles();
        setTimeout(() => {
          reset();
          setShowShareForm(false);
          setShareStatus(null);
          setShareErrorMessage('');
          setDoctorName('');
        }, 2000);
      } else {
        setShareErrorMessage(shareResult.error || 'Failed to share profile');
        setShareStatus('error');
      }
      
    } catch (error) {
      console.error("Error sharing profile:", error);
      setShareErrorMessage('An unexpected error occurred. Please try again.');
      setShareStatus('error');
    }
    
    setIsSharing(false);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border soft-divider">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-primary to-accent text-white flex items-center justify-center">
            <FaUserMd className="text-sm" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text">Shared with Doctors</h2>
        </div>
        <div className="flex items-center justify-center py-8 text-secondary">
          <FaSpinner className="animate-spin text-primary text-2xl" />
          <span className="ml-3">Loading shared profiles...</span>
        </div>
      </div>
    );
  }

  return (
  <div className="glass rounded-2xl p-6 border soft-divider flex flex-col gap-6 hover-glow-primary xl:max-w-5xl xl:mx-auto">
      {/* Header */}
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-inner flex-shrink-0">
          <FaUserMd className="text-lg" />
        </div>
        <h2 className="text-xl font-bold text-text leading-tight">Shared with Doctors</h2>
        <span className="glass px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide text-secondary border soft-divider uppercase whitespace-nowrap leading-none ml-2">
          {sharedProfiles.length} {sharedProfiles.length === 1 ? 'doctor' : 'doctors'}
        </span>
      </div>
      <button
        onClick={() => setShowShareForm(!showShareForm)}
        className="glass-cta flex items-center gap-2 h-12 px-5 rounded-xl text-base font-medium w-full justify-center whitespace-nowrap"
      >
        <FaPlus className="text-lg" />
        <span>Share with Doctor</span>
      </button>
    </div>

      {/* Share Form */}
      <AnimatePresence>
        {showShareForm && (
          <motion.form
            onSubmit={handleSubmit(handleShare)}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 glass rounded-lg border soft-divider space-y-3"
          >
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Doctor's ID
            </label>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="e.g., DR-HALE-1234"
                {...register("doctorId", { 
                  required: "Doctor ID is required",
                  pattern: {
                    value: /^DR-[BCDFGHJKLMNPQRSTVWXYZAEIOU]{4}-\d{4}$/i,
                    message: "Invalid doctor ID format (DR-XXXX-1234)"
                  }
                })}
                className="w-full px-3 py-2 rounded-md glass border soft-divider text-text placeholder:text-secondary/70 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                maxLength={12}
              />
              {errors.doctorId && (
                <p className="text-red-400 text-xs">{errors.doctorId.message}</p>
              )}
              <p className="text-secondary text-xs">
                Format: DR-XXXX-1234
              </p>
            </div>
            
            {shareStatus === 'error' && (
              <div className="text-red-400 text-xs glass border soft-divider p-2 rounded">
                {shareErrorMessage || 'An error occurred. Please try again.'}
              </div>
            )}
            
            {shareStatus === 'success' && (
              <div className="text-green-400 text-xs glass border soft-divider p-2 rounded">
                Profile shared successfully{doctorName ? ` with Dr. ${doctorName}!` : '!'}
              </div>
            )}
            
      <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={isSharing}
        className="flex-1 glass-cta px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? "Sharing..." : "Share Profile"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShareForm(false);
                  setShareStatus(null);
                  setShareErrorMessage('');
                  reset();
                }}
                className="px-4 py-2 glass rounded-md border soft-divider text-text hover-glow-primary text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Notification */}
      {notification && (
        <div className={`glass border soft-divider p-4 rounded-lg ${
          notification.type === 'success' ? 'text-green-400' : 'text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationTriangle />
            )}
            <span className="text-text">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <FaExclamationTriangle className="text-red-500 text-3xl mb-3 mx-auto" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={fetchSharedProfiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No Shared Profiles */}
    {!error && sharedProfiles.length === 0 && (
        <div className="text-center py-8">
      <FaUserMd className="text-secondary text-4xl mb-4 mx-auto" />
      <p className="text-secondary mb-2">No doctors have access to your profile yet</p>
      <p className="text-sm text-secondary">Share your profile with doctors to see them here</p>
        </div>
      )}

      {/* Shared Profiles List */}
  {!error && sharedProfiles.length > 0 && (
    <div className="space-y-4 md:max-h-96 md:overflow-y-auto">
          {sharedProfiles.map((profile) => (
            <div 
              key={profile.id} 
              className="p-4 glass rounded-lg border soft-divider hover-glow-primary"
            >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FaUserMd className="text-primary" />
                    <div>
                      <h3 className="font-semibold text-text">
                        {profile.doctorName || 'Unknown Doctor'}
                      </h3>
                      <p className="text-sm text-secondary">
                        ID: {profile.doctorIdCode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <FaCalendarAlt className="text-secondary" />
                    <span>
                      Shared on {profile.sharedAt?.toDate ? 
                        profile.sharedAt.toDate().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 
                        'Unknown date'
                      }
                    </span>
                  </div>
                </div>

                {confirmPopover.doctorId === profile.doctorId ? (
      <div className="sm:ml-4 w-full sm:w-auto flex flex-col sm:items-end gap-2">
        <div className="p-3 glass rounded-lg border soft-divider w-full sm:w-auto">
                      <p className="text-sm text-text mb-2">Are you sure you want to revoke <span className="font-bold">{profile.doctorName}</span>'s access?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={confirmRevoke}
                          className="px-3 py-1 rounded-lg glass-cta font-semibold text-sm"
                          disabled={revoking === profile.doctorId}
                        >
                          {revoking === profile.doctorId ? 'Revoking...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmPopover({ doctorId: null, doctorName: '' })}
          className="px-3 py-1 rounded-lg glass border soft-divider text-text hover-glow-primary text-sm"
                          disabled={revoking === profile.doctorId}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRevokeAccess(profile.doctorId, profile.doctorName)}
                    disabled={revoking === profile.doctorId}
        className="sm:ml-4 w-full sm:w-auto justify-center sm:justify-start mt-2 sm:mt-0 flex items-center gap-2 px-3 py-2 glass rounded-lg border soft-divider text-red-400 hover-glow-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {revoking === profile.doctorId ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <MdCancel />
                    )}
                    {revoking === profile.doctorId ? 'Revoking...' : 'Revoke Access'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {sharedProfiles.length > 0 && (
        <div className="pt-4 border-t soft-divider">
          <p className="text-xs text-secondary text-center">
            Revoked access cannot be restored. The doctor will need a new invitation to access your profile again.
          </p>
        </div>
      )}
    </div>
  );
};

export default SharedDoctorsBlock;
