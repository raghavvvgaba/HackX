import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { getSharedProfileRecord, getPatientBasicInfo, getPatientProfile, getDoctorPatientMedicalRecords, addMedicalRecord, updateMedicalRecord } from '../../utils/firestoreDoctorService';
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaSpinner, FaFileMedicalAlt, FaHeart, FaRunning, FaUtensils, FaPills, FaDownload, FaEye, FaPlus, FaTimes, FaSave, FaCheckCircle, FaExclamationCircle, FaEdit, FaTransgender } from 'react-icons/fa';
import { GiBodyHeight } from 'react-icons/gi';
import { MdBloodtype, MdSick, MdAccessibility } from 'react-icons/md';
import { BsCapsulePill, BsEyeFill, BsEarFill } from 'react-icons/bs';
import { AiOutlineWarning } from 'react-icons/ai';

function PatientProfilePage() {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shareRecord, setShareRecord] = useState(null);
    const [patientProfile, setPatientProfile] = useState(null);
    const [patientInfo, setPatientInfo] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'medical-records'
    
    // Medical records state
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
    const [medicalRecordsError, setMedicalRecordsError] = useState(null);
    const [pagination, setPagination] = useState({
        hasMore: false,
        lastDoc: null,
        currentPageSize: 0,
        requestedPageSize: 20
    });
    
    // Add medical record modal state
    const [showAddRecordModal, setShowAddRecordModal] = useState(false);
    const [addingRecord, setAddingRecord] = useState(false);
    const [addRecordError, setAddRecordError] = useState("");
    const [toast, setToast] = useState(null); // {type: 'success'|'error', message: string}
    const [showEditRecordModal, setShowEditRecordModal] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState(null);

    const fetchSharedProfile = useCallback(async () => {
        try {
            setLoading(true);
            
            // Step 1: Get and validate shared profile record
            const shareResult = await getSharedProfileRecord(shareId, user.uid);
            if (!shareResult.success) {
                setError(shareResult.error);
                return;
            }
            setShareRecord(shareResult.data);

            // Step 2: Get patient basic info (name, email)
            const patientInfoResult = await getPatientBasicInfo(shareResult.data.patientId);
            if (patientInfoResult.success) {
                setPatientInfo(patientInfoResult.data);
            }

            // Step 3: Get patient profile data
            const profileResult = await getPatientProfile(shareResult.data.patientId);
            if (!profileResult.success) {
                setError(profileResult.error);
                return;
            }
            setPatientProfile(profileResult.data);

        } catch (error) {
            console.error("Error fetching shared profile:", error);
            setError("Failed to load patient profile. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [shareId, user.uid]);

    const fetchMedicalRecords = useCallback(async (loadMore = false) => {
        if (!shareRecord) return;
        
        try {
            setMedicalRecordsLoading(true);
            setMedicalRecordsError(null);
            
            const lastDoc = loadMore ? pagination.lastDoc : null;
            const result = await getDoctorPatientMedicalRecords(
                user.uid, 
                shareRecord.patientId, 
                lastDoc, 
                20
            );
            
            if (result.success) {
                if (loadMore) {
                    setMedicalRecords(prev => [...prev, ...result.data]);
                } else {
                    setMedicalRecords(result.data);
                }
                setPagination(result.pagination);
            } else {
                setMedicalRecordsError(result.error);
            }
        } catch (error) {
            console.error("Error fetching medical records:", error);
            setMedicalRecordsError("Failed to load medical records.");
        } finally {
            setMedicalRecordsLoading(false);
        }
    }, [shareRecord, user.uid, pagination.lastDoc]);

    // Auto-dismiss toast after a short delay
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        if (!user) return;
        fetchSharedProfile();
    }, [user, shareId, fetchSharedProfile]);

    useEffect(() => {
        if (shareRecord && activeTab === 'medical-records') {
            fetchMedicalRecords();
        }
    }, [shareRecord, activeTab, fetchMedicalRecords]);

    

    const handleAddMedicalRecord = async (formData) => {
        if (!shareRecord) return;
        setAddRecordError("");
        try {
            setAddingRecord(true);
            const result = await addMedicalRecord(user.uid, shareRecord.patientId, formData);
            if (result.success) {
                setShowAddRecordModal(false);
                fetchMedicalRecords();
                setToast({ type: 'success', message: 'Medical record added successfully' });
            } else {
                setAddRecordError(result.error || 'Failed to add medical record');
            }
        } catch (error) {
            console.error('Error adding medical record:', error);
            setAddRecordError('Failed to add medical record. Please try again.');
        } finally {
            setAddingRecord(false);
        }
    };

    const handleUpdateMedicalRecord = async (formData) => {
        if (!recordToEdit) return;
        setAddRecordError(""); // Reuse the same error state for simplicity
        try {
            setAddingRecord(true); // Reuse the same loading state
            const result = await updateMedicalRecord(String(recordToEdit.id), user.uid, formData);
            if (result.success) {
                setShowEditRecordModal(false);
                setRecordToEdit(null);
                fetchMedicalRecords();
                setToast({ type: 'success', message: 'Medical record updated successfully' });
            } else {
                setAddRecordError(result.error || 'Failed to update medical record');
            }
        } catch (error) {
            console.error('Error updating medical record:', error);
            setAddRecordError('Failed to update medical record. Please try again.');
        } finally {
            setAddingRecord(false);
        }
    };

    // Toast rendered via portal to avoid stacking-context issues
    const ToastPortal = ({ toast }) => {
        if (!toast) return null;
        return createPortal(
            <div className="fixed top-20 right-4 z-[9999] pointer-events-none">
                <div
                    role="alert"
                    className={`pointer-events-auto glass-elevated border soft-divider rounded-xl px-5 py-4 text-sm sm:text-base font-semibold shadow-xl flex items-start gap-3 ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                >
                    {toast.type === 'success' ? (
                        <FaCheckCircle className="mt-0.5 shrink-0" />
                    ) : (
                        <FaExclamationCircle className="mt-0.5 shrink-0" />
                    )}
                    <span className="text-text">{toast.message}</span>
                </div>
            </div>,
            document.body
        );
    };

    const AddMedicalRecordModal = () => {
        const [formData, setFormData] = useState({
            visitDate: new Date().toISOString().split('T')[0],
            diagnosis: '',
            symptoms: '',
            medicines: '',
            prescribedTests: '',
            followUpNotes: ''
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            
            // Convert comma-separated strings to arrays
            const processedData = {
                ...formData,
                symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
                medicines: formData.medicines.split(',').map(m => m.trim()).filter(m => m),
                prescribedTests: formData.prescribedTests.split(',').map(t => t.trim()).filter(t => t)
            };
            
            handleAddMedicalRecord(processedData);
        };

        useEffect(() => {
            if (!showAddRecordModal) return;
            const onKey = (e) => {
                if (e.key === 'Escape') setShowAddRecordModal(false);
            };
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }, []);

        if (!showAddRecordModal) return null;

        return (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center" onClick={() => setShowAddRecordModal(false)}>
                <div className="glass-elevated rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border soft-divider" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-text">Add Medical Record</h2>
                            <button
                                onClick={() => setShowAddRecordModal(false)}
                                className="w-9 h-9 rounded-lg glass border soft-divider text-secondary hover-glow-primary flex items-center justify-center"
                                aria-label="Close"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {addRecordError && (
                            <div className="mb-3 sm:mb-4 glass border soft-divider rounded-lg p-3 text-red-400 bg-red-500/10">
                                {addRecordError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Visit Date</label>
                                    <input
                                        type="date"
                                        value={formData.visitDate}
                                        onChange={(e) => { setFormData(prev => ({ ...prev, visitDate: e.target.value })); setAddRecordError(""); }}
                                        className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Diagnosis</label>
                                    <input
                                        type="text"
                                        value={formData.diagnosis}
                                        onChange={(e) => { setFormData(prev => ({ ...prev, diagnosis: e.target.value })); setAddRecordError(""); }}
                                        className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="Enter diagnosis"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Symptoms (comma-separated)</label>
                                <textarea
                                    value={formData.symptoms}
                                    onChange={(e) => { setFormData(prev => ({ ...prev, symptoms: e.target.value })); setAddRecordError(""); }}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="2"
                                    placeholder="e.g., Headache, Nausea, Fever"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Medicines (comma-separated)</label>
                                <textarea
                                    value={formData.medicines}
                                    onChange={(e) => { setFormData(prev => ({ ...prev, medicines: e.target.value })); setAddRecordError(""); }}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="2"
                                    placeholder="e.g., Paracetamol 500mg, Ibuprofen 200mg"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Prescribed Tests (comma-separated)</label>
                                <textarea
                                    value={formData.prescribedTests}
                                    onChange={(e) => { setFormData(prev => ({ ...prev, prescribedTests: e.target.value })); setAddRecordError(""); }}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="2"
                                    placeholder="e.g., Blood Test, X-Ray, MRI"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Follow-up Notes</label>
                                <textarea
                                    value={formData.followUpNotes}
                                    onChange={(e) => { setFormData(prev => ({ ...prev, followUpNotes: e.target.value })); setAddRecordError(""); }}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="3"
                                    placeholder="Any additional notes or follow-up instructions"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                                <button
                                    type="submit"
                                    disabled={addingRecord}
                                    className="flex-1 glass-cta px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {addingRecord ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            Save Record
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddRecordModal(false)}
                                    className="px-4 py-2 glass rounded-lg border soft-divider text-text hover-glow-primary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const EditMedicalRecordModal = () => {
        const [formData, setFormData] = useState({
            visitDate: recordToEdit?.visitDate ? new Date(recordToEdit.visitDate).toISOString().split('T')[0] : '',
            diagnosis: recordToEdit?.diagnosis || '',
            symptoms: recordToEdit?.symptoms?.join(', ') || '',
            medicines: recordToEdit?.medicines?.join(', ') || '',
            prescribedTests: recordToEdit?.prescribedTests?.join(', ') || '',
            followUpNotes: recordToEdit?.followUpNotes || ''
        });

        useEffect(() => {
            if (recordToEdit) {
                setFormData({
                    visitDate: recordToEdit.visitDate ? new Date(recordToEdit.visitDate).toISOString().split('T')[0] : '',
                    diagnosis: recordToEdit.diagnosis || '',
                    symptoms: recordToEdit.symptoms?.join(', ') || '',
                    medicines: recordToEdit.medicines?.join(', ') || '',
                    prescribedTests: recordToEdit.prescribedTests?.join(', ') || '',
                    followUpNotes: recordToEdit.followUpNotes || ''
                });
            }
        }, []);

        const handleSubmit = (e) => {
            e.preventDefault();
            const processedData = {
                ...formData,
                symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
                medicines: formData.medicines.split(',').map(m => m.trim()).filter(m => m),
                prescribedTests: formData.prescribedTests.split(',').map(t => t.trim()).filter(t => t)
            };
            handleUpdateMedicalRecord(processedData);
        };

        if (!showEditRecordModal) return null;

        return (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center" onClick={() => setShowEditRecordModal(false)}>
                <div className="glass-elevated rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border soft-divider" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-text">Edit Medical Record</h2>
                            <button
                                onClick={() => { setShowEditRecordModal(false); setRecordToEdit(null); }}
                                className="w-9 h-9 rounded-lg glass border soft-divider text-secondary hover-glow-primary flex items-center justify-center"
                                aria-label="Close"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {addRecordError && (
                            <div className="mb-3 sm:mb-4 glass border soft-divider rounded-lg p-3 text-red-400 bg-red-500/10">
                                {addRecordError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {/* Form fields are similar to AddMedicalRecordModal, pre-filled with formData */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Visit Date</label>
                                    <input
                                        type="date"
                                        value={formData.visitDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Diagnosis</label>
                                    <input
                                        type="text"
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="Enter diagnosis"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Symptoms (comma-separated)</label>
                                <textarea
                                    value={formData.symptoms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="2"
                                    placeholder="e.g., Headache, Nausea, Fever"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Medicines (comma-separated)</label>
                                <textarea
                                    value={formData.medicines}
                                    onChange={(e) => setFormData(prev => ({ ...prev, medicines: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="2"
                                    placeholder="e.g., Paracetamol 500mg, Ibuprofen 200mg"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Prescribed Tests (comma-separated)</label>
                                <textarea
                                    value={formData.prescribedTests}
                                    onChange={(e) => setFormData(prev => ({ ...prev, prescribedTests: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="2"
                                    placeholder="e.g., Blood Test, X-Ray, MRI"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Follow-up Notes</label>
                                <textarea
                                    value={formData.followUpNotes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg glass border soft-divider text-text placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    rows="3"
                                    placeholder="Any additional notes or follow-up instructions"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                                <button
                                    type="submit"
                                    disabled={addingRecord}
                                    className="flex-1 glass-cta px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {addingRecord ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            Update Record
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditRecordModal(false); setRecordToEdit(null); }}
                                    className="px-4 py-2 glass rounded-lg border soft-divider text-text hover-glow-primary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const InfoCard = ({ title, children, className = "", icon: Icon }) => (
        <div className={`glass rounded-2xl p-5 sm:p-6 border soft-divider hover-glow-primary ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[rgba(var(--primary-rgb)/0.15)] text-primary flex items-center justify-center">
                    {Icon && <Icon className="text-base" />}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-text">{title}</h3>
            </div>
            {children}
        </div>
    );

    const DataField = ({ label, value, icon: Icon }) => (
        <div className="flex items-center justify-between p-3 rounded-lg border soft-divider glass">
            <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="text-primary text-sm shrink-0" />}
                <span className="text-sm font-medium text-text truncate">{label}</span>
            </div>
            <span className="text-sm text-secondary font-medium max-w-[60%] text-right truncate">
                {value || 'Not specified'}
            </span>
        </div>
    );

    const TagList = ({ items, colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" }) => (
        <div className="flex flex-wrap gap-2">
            {items && items.length > 0 ? (
                items.map((item, index) => (
                    <span key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {item}
                    </span>
                ))
            ) : (
                <span className="text-sm text-gray-500 italic">None specified</span>
            )}
        </div>
    );

    const MedicalRecordCard = ({ record }) => {
        const isEditable = () => {
            if (!record.createdAt) return false;
            const recordDate = record.createdAt.toDate();
            const now = new Date();
            const diffInMinutes = (now.getTime() - recordDate.getTime()) / (1000 * 60);
            return diffInMinutes < 30;
        };

        return (
            <div className="glass rounded-2xl p-5 sm:p-6 border soft-divider hover-glow-primary">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                    <h4 className="text-base sm:text-lg font-semibold text-text">{record.diagnosis || 'Medical Record'}</h4>
                    <p className="text-xs sm:text-sm text-secondary">
                        {record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'No date specified'}
                        {record.createdAt ? ` at ${new Date(record.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        {' '}
                        • {record.doctorName || 'Unknown Doctor'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isEditable() && (
                        <button 
                            onClick={() => {
                                setRecordToEdit(record);
                                setShowEditRecordModal(true);
                            }}
                            className="p-2 text-primary hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <FaEdit className="text-sm" />
                        </button>
                    )}
                    {record.fileName && (
                        <div className="flex gap-2">
                            <button className="p-2 text-primary hover:bg-white/10 rounded-lg transition-colors">
                                <FaEye className="text-sm" />
                            </button>
                            <button className="p-2 text-primary hover:bg-white/10 rounded-lg transition-colors">
                                <FaDownload className="text-sm" />
                            </button>
                        </div>
                    )}
                </div>
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
                        <p className="text-sm text-secondary glass p-3 rounded-lg border soft-divider">
                            {record.followUpNotes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading patient profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/doctor')}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 aurora-bg">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-sm text-secondary hover-glow-primary"
                >
                    <FaArrowLeft />
                    <span className="font-medium">Back to Patient List</span>
                </button>
                <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs glass border soft-divider text-secondary">
                        Shared on {shareRecord?.sharedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Patient Header */}
            <div className="glass-elevated rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
                        <FaUser className="text-xl sm:text-2xl" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-text truncate">
                            {patientInfo.name || 'Patient Name'}
                        </h1>
                        <p className="text-secondary flex items-center gap-2 text-sm truncate">
                            <FaEnvelope className="text-xs" />
                            <span className="truncate">{patientInfo.email || 'No email provided'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
        <div className="glass rounded-xl p-1 border soft-divider flex gap-1">
                <button
                    onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                        activeTab === 'profile'
                            ? 'bg-[rgba(var(--primary-rgb)/0.15)] text-primary'
                            : 'text-secondary hover:text-text'
                    }`}
                >
            <FaUser className="text-xs sm:text-sm" />
                    Profile Information
                </button>
                <button
                    onClick={() => setActiveTab('medical-records')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                        activeTab === 'medical-records'
                            ? 'bg-[rgba(var(--primary-rgb)/0.15)] text-primary'
                            : 'text-secondary hover:text-text'
                    }`}
                >
            <FaFileMedicalAlt className="text-xs sm:text-sm" />
                    Medical Records
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && patientProfile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <InfoCard title="Basic Information" icon={FaUser}>
                        <div className="space-y-3">
                            <DataField label="Full Name" value={patientProfile.basic?.fullName} icon={FaUser} />
                            <DataField label="Gender" value={patientProfile.basic?.gender} icon={FaTransgender} />
                            <DataField 
                                label="Date of Birth" 
                                value={patientProfile.basic?.dob ? new Date(patientProfile.basic.dob).toLocaleDateString() : null} 
                                icon={FaCalendar} 
                            />
                            <DataField label="Contact Number" value={patientProfile.basic?.contactNumber} icon={FaPhone} />
                        </div>
                    </InfoCard>

                    {/* Physical Details */}
                    <InfoCard title="Physical Details" icon={GiBodyHeight}>
                        <div className="space-y-3">
                            <DataField 
                                label="Height" 
                                value={patientProfile.basic?.height ? `${patientProfile.basic.height.value} ${patientProfile.basic.height.unit}` : null} 
                                icon={GiBodyHeight} 
                            />
                            <DataField 
                                label="Weight" 
                                value={patientProfile.basic?.weight ? `${patientProfile.basic.weight.value} ${patientProfile.basic.weight.unit}` : null} 
                                icon={MdSick} 
                            />
                            <DataField label="Blood Group" value={patientProfile.basic?.bloodGroup} icon={MdBloodtype} />
                        </div>
                    </InfoCard>

                    {/* Emergency Contact */}
                    <InfoCard title="Emergency Contact" icon={FaPhone}>
                        <div className="space-y-3">
                            <DataField label="Name" value={patientProfile.basic?.emergencyContact?.name} icon={FaUser} />
                            <DataField label="Phone" value={patientProfile.basic?.emergencyContact?.number} icon={FaPhone} />
                            <DataField label="Relation" value={patientProfile.basic?.emergencyContact?.relation} />
                        </div>
                    </InfoCard>

                    {/* Chronic Conditions */}
                    <InfoCard title="Chronic Conditions" icon={FaHeart}>
                        <TagList items={patientProfile.medical?.chronicConditions} colorClass="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" />
                    </InfoCard>

                    {/* Allergies */}
                    <InfoCard title="Allergies" icon={AiOutlineWarning}>
                        <TagList items={patientProfile.medical?.allergies} colorClass="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" />
                    </InfoCard>

                    {/* Current Medications */}
                    <InfoCard title="Current Medications" icon={BsCapsulePill}>
                        <TagList items={patientProfile.medical?.currentMedications} colorClass="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" />
                    </InfoCard>

                    {/* Disabilities */}
                    <InfoCard title="Disabilities" icon={MdAccessibility}>
                        <TagList items={patientProfile.medical?.disabilities} colorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" />
                    </InfoCard>

                    {/* Vision & Hearing */}
                    <InfoCard title="Vision & Hearing" icon={BsEyeFill}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <BsEyeFill className="text-primary" />
                                    Wears Glasses
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${patientProfile.medical?.vision?.wearsGlasses ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {patientProfile.medical?.vision?.wearsGlasses ? 'Yes' : 'No'}
                                </span>
                            </div>
                            {patientProfile.medical?.vision?.wearsGlasses && (
                                <>
                                    <DataField label="Left Eye" value={patientProfile.medical?.vision?.leftEye} />
                                    <DataField label="Right Eye" value={patientProfile.medical?.vision?.rightEye} />
                                </>
                            )}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <BsEarFill className="text-primary" />
                                    Uses Hearing Aids
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${patientProfile.medical?.hearingAids ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {patientProfile.medical?.hearingAids ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </InfoCard>

                    {/* Lifestyle Habits */}
                    <InfoCard title="Lifestyle Habits" icon={FaRunning}>
                        <TagList items={patientProfile.lifestyle?.habits} colorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" />
                    </InfoCard>

                    {/* Dietary Preferences */}
                    <InfoCard title="Dietary Preferences" icon={FaUtensils}>
                        <TagList items={patientProfile.lifestyle?.preferences} colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" />
                    </InfoCard>
                </div>
            )}

            {/* Medical Records Tab */}
            {activeTab === 'medical-records' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="text-lg sm:text-xl font-bold text-text">Medical Records</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-secondary">{medicalRecords.length} record(s) found</span>
                            <button
                                onClick={() => setShowAddRecordModal(true)}
                                className="glass-cta px-4 py-2 flex items-center gap-2"
                            >
                                <FaPlus className="text-sm" />
                                <span className="text-sm">Add Medical Record</span>
                            </button>
                        </div>
                    </div>
                    
                    {medicalRecordsError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-600 dark:text-red-300">{medicalRecordsError}</p>
                            <button
                                onClick={() => fetchMedicalRecords()}
                                className="mt-2 text-sm text-red-700 dark:text-red-400 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                    
                    {medicalRecordsLoading && medicalRecords.length === 0 ? (
                        <div className="text-center py-12">
                            <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Loading medical records...</p>
                        </div>
                    ) : medicalRecords.length > 0 ? (
                        <div className="space-y-4">
                            {medicalRecords.map((record, index) => (
                                <MedicalRecordCard key={record.id || index} record={record} />
                            ))}
                            
                            {/* Load More Button */}
                            {pagination.hasMore && (
                                <div className="text-center py-4">
                                    <button
                                        onClick={() => fetchMedicalRecords(true)}
                                        disabled={medicalRecordsLoading}
                                        className="px-6 py-2 glass rounded-lg border soft-divider text-text hover-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {medicalRecordsLoading ? (
                                            <span className="flex items-center gap-2">
                                                <FaSpinner className="animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            'Load More Records'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FaFileMedicalAlt className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Medical Records</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                No medical records found for this patient.
                            </p>
                            <button
                                onClick={() => setShowAddRecordModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity mx-auto"
                            >
                                <FaPlus className="text-sm" />
                                Add First Medical Record
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!patientProfile && !loading && (
                <div className="text-center py-12">
                    <FaUser className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Profile Data</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        This patient hasn't completed their profile yet.
                    </p>
                </div>
            )}
        </div>
        
        {/* Add Medical Record Modal */}
        <AddMedicalRecordModal />
        <EditMedicalRecordModal />
    {/* Success Toast */}
    <ToastPortal toast={toast} />
        </>
    );
}

export default PatientProfilePage;