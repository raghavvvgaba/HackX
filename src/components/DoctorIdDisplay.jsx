import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaCopy, FaCheck, FaKey, FaShareAlt } from 'react-icons/fa';

function DoctorIdDisplay() {
    const { user } = useAuth();
    const [doctorId, setDoctorId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchDoctorId = async () => {
            if (!user) return;

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists() && userDoc.data().doctorId) {
                    setDoctorId(userDoc.data().doctorId);
                }
            } catch (error) {
                console.error("Error fetching doctor ID:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorId();
    }, [user]);

    const handleCopy = async () => {
        if (!doctorId) return;
        
        try {
            await navigator.clipboard.writeText(doctorId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy doctor ID:", error);
        }
    };

    const handleShareMobile = async () => {
        if (!doctorId) return;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'VitalLink Doctor ID',
                    text: `Here is my Doctor ID: ${doctorId}\nUse VitalLink to share your records with me.`,
                    url: window.location.origin,
                });
            } else {
                // Fallback to copy if Web Share API isn't available
                await handleCopy();
            }
        } catch (e) {
            // User canceled or share failed; fallback to copy to provide utility
            await handleCopy();
        }
    };

    if (loading) {
        return (
            <div className="glass-elevated rounded-3xl p-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-[rgba(var(--primary-rgb)/0.25)] rounded w-1/3 mb-3"></div>
                    <div className="h-10 bg-[rgba(var(--surface-rgb)/0.2)] rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (!doctorId) {
        return (
            <div className="glass-elevated rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-text mb-2">
                    Doctor ID Not Found
                </h3>
                <p className="text-secondary text-sm">
                    Your doctor ID was not found. Please contact support if this issue persists.
                </p>
            </div>
        );
    }

    return (
    <div className="glass-elevated rounded-3xl overflow-hidden hover-glow-primary">
            <div className="p-6 border-b soft-divider bg-blue-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                            <FaKey />
                        </div>
                        <h3 className="text-lg font-semibold text-text">Your Doctor ID</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShareMobile}
                            className="inline-flex sm:hidden items-center justify-center w-9 h-9 rounded-full glass border soft-divider text-primary hover:brightness-110"
                            title="Share with Patients"
                            aria-label="Share with Patients"
                        >
                            <FaShareAlt className="text-sm" />
                        </button>
                        <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs text-primary bg-[rgba(var(--primary-rgb)/0.15)] border soft-divider">Share with Patients</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 rounded-2xl p-4 border soft-divider glass">
                        <div className="text-secondary text-xs mb-1">Doctor ID</div>
                        <code className="text-xl font-mono font-bold text-primary tracking-wider">{doctorId}</code>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`glass-cta flex items-center gap-2 px-5 py-3 ${copied ? 'brightness-110' : ''}`}
                        title="Copy Doctor ID"
                    >
                        {copied ? <FaCheck className="text-sm" /> : <FaCopy className="text-sm" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="rounded-2xl p-5 border soft-divider glass">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <FaShareAlt />
                        <h4 className="font-medium">How patients can share with you:</h4>
                    </div>
                    <ol className="text-sm text-secondary space-y-2 ml-5 list-decimal">
                        <li>Ask your patients to use the <span className="text-primary font-medium">"Share to Doctor"</span> button on their profile</li>
                        <li>They should enter your Doctor ID: <code className="px-2 py-0.5 rounded bg-[rgba(var(--primary-rgb)/0.15)] text-primary font-mono text-xs border soft-divider">{doctorId}</code></li>
                        <li>You'll receive instant access to their medical records and profile</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

export default DoctorIdDisplay;
