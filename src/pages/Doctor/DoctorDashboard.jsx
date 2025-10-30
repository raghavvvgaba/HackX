import React, { useState } from 'react';
import DoctorIdDisplay from '../../components/DoctorIdDisplay';
import SharedProfilesList from '../../components/SharedProfilesList';
import AIHealthAssistant from '../../components/AIHealthAssistant';
import { useAuth } from '../../context/authContext';
import { FaClock, FaBell, FaUsers, FaHeartbeat, FaStethoscope, FaChartLine, FaRobot, FaComments } from 'react-icons/fa';

function DoctorDashboard() {
    const { user } = useAuth();
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen bg-background aurora-bg">
            {/* Header - gradient ribbon */}
            <div className="relative bg-gradient-to-br from-primary/25 via-accent/20 to-transparent px-3 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b soft-divider">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl glass flex items-center justify-center shadow-lg">
                            <FaStethoscope className="text-primary text-xl sm:text-2xl" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text leading-tight break-words">
                                {getGreeting()}, <span className="text-primary">Dr. {user?.displayName || user?.email?.split('@')[0] || 'Doctor'}</span>
                            </h1>
                            <div className="mt-3 inline-flex items-center gap-2 glass rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-secondary">
                                <FaHeartbeat className="text-accent" />
                                Manage patient care with precision
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="glass rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3 shadow-lg">
                            <FaClock className="text-primary shrink-0" />
                            <div className="min-w-0">
                                <div className="text-[10px] sm:text-xs text-secondary">Today</div>
                                <div className="text-xs sm:text-sm font-semibold text-text truncate">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long', month: 'short', day: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                        <button className="relative rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-white shadow-xl bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 transition-all">
                            <FaBell className="text-base sm:text-lg" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-accent shadow"></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Left column */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                    {/* Quick Actions */}
                    <div className="glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover-glow-primary">
                        <h3 className="text-lg sm:text-xl font-bold text-text mb-4 sm:mb-6 flex items-center gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-primary to-accent text-white flex items-center justify-center">
                                <FaChartLine className="text-xs sm:text-sm" />
                            </div>
                            Quick Actions
                        </h3>
                        <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 -mx-1 px-1">
                              <button className="group glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lift-on-hover hover-glow-primary transition-all border soft-divider snap-start min-w-[240px] md:min-w-0">
                                <FaUsers className="text-primary text-xl sm:text-2xl mb-2" />
                                <div className="text-left">
                                    <div className="font-semibold text-text text-base sm:text-[1.05rem]">View All Patients</div>
                                    <div className="text-secondary text-xs sm:text-sm mt-1">Manage patient records</div>
                                </div>
                            </button>
                              <button className="group rounded-xl sm:rounded-2xl p-4 sm:p-6 lift-on-hover hover-glow-accent transition-all border soft-divider bg-gradient-to-br from-accent/25 to-accent/10 snap-start min-w-[240px] md:min-w-0">
                                <FaHeartbeat className="text-accent text-xl sm:text-2xl mb-2" />
                                <div className="text-left">
                                    <div className="font-semibold text-text text-base sm:text-[1.05rem]">Schedule Appointment</div>
                                    <div className="text-secondary text-xs sm:text-sm mt-1">Book new consultations</div>
                                </div>
                            </button>
                              <button className="group glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lift-on-hover hover-glow-primary transition-all border soft-divider snap-start min-w-[240px] md:min-w-0">
                                <FaStethoscope className="text-secondary text-xl sm:text-2xl mb-2" />
                                <div className="text-left">
                                    <div className="font-semibold text-text text-base sm:text-[1.05rem]">Medical Reports</div>
                                    <div className="text-secondary text-xs sm:text-sm mt-1">Generate & view reports</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Shared Profiles */}
                    <div className="min-w-0">
                        <SharedProfilesList />
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-4 space-y-6 sm:space-y-8 min-w-0">
                    <DoctorIdDisplay />

                    {/* AI Health Assistant Widget */}
                    <div className="glass rounded-2xl p-5 sm:p-6 border soft-divider hover-glow-primary">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <FaRobot className="text-white text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-text">AI Health Assistant</h3>
                                <p className="text-xs text-secondary">Medical reference & support</p>
                            </div>
                        </div>
                        <p className="text-sm text-secondary leading-relaxed mb-4">
                            Access medical reference information, get explanations of conditions and treatments, and stay updated with health guidelines.
                        </p>
                        <button 
                            onClick={() => setIsAIAssistantOpen(true)}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                            <FaComments />
                            Consult AI Assistant
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating AI Assistant Button */}
            <button
                onClick={() => setIsAIAssistantOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 lg:hidden"
                title="Open AI Health Assistant"
            >
                <FaRobot className="text-xl" />
            </button>

            {/* AI Health Assistant Modal */}
            <AIHealthAssistant 
                isOpen={isAIAssistantOpen} 
                onClose={() => setIsAIAssistantOpen(false)} 
            />
        </div>
    );
}

export default DoctorDashboard;
