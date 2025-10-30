import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaUserMd, FaUserAlt, FaEye, FaEyeSlash, FaHeartbeat, FaShieldAlt, FaUsers, FaClipboardList } from "react-icons/fa";
import { useAuth } from "../context/authContext";
import Navbar from "../components/Navbar";

export default function Signup() {
    const navigate = useNavigate();
    const { signup, user, userRole, loading } = useAuth();

    // Track if we just completed a signup to control redirect timing
    const [justSignedUp, setJustSignedUp] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Redirect if user is already logged in
    useEffect(() => {
        if (justSignedUp) return; // allow manual delayed navigation so toast is visible
        if (!loading && user && userRole) {
            navigate(userRole === 'doctor' ? '/doctor' : '/user');
        }
    }, [user, userRole, loading, navigate, justSignedUp]);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
    });

    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState("weak");

    // Show loading while checking authentication
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen w-full bg-background flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-primary">Loading...</div>
                    </div>
                </div>
            </>
        );
    }

    const evaluatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength >= 4) return "strong";
        if (strength >= 2) return "moderate";
        return "weak";
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({ ...prev, password: val }));
        setPasswordStrength(evaluatePasswordStrength(val));
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFormError("");
    };

    const handleRoleSelect = (role) => {
        setForm((prev) => ({ ...prev, role }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (passwordStrength === "weak") {
            setFormError("Please choose a stronger password (include uppercase, numbers, symbols).");
            return;
        }

        try {
            setJustSignedUp(true);
            await signup(form.name, form.email, form.password, form.role);
            // Show toast then navigate after short delay so user sees confirmation
            setShowToast(true);
            const destination = form.role === 'doctor' ? '/doctor' : '/user/onboarding';
            setTimeout(() => {
                navigate(destination);
            }, 1400); // 1.4s visibility
        } catch (error) {
            console.error("Signup failed:", error.message);
            console.error("Full error:", error);
            
            if (error.code === "auth/email-already-in-use") {
                setFormError("An account with this email already exists.");
            } else if (error.code?.startsWith('firestore/')) {
                setFormError("Account created but profile setup failed. Please try logging in.");
            } else {
                setFormError("Signup failed. Please try again.");
            }
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen w-full bg-gradient-to-br from-secondary/10 via-background to-primary/10 flex">
                {/* Left Side - Illustration and Features */}
                <motion.div 
                    className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Background decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-16 right-16 w-36 h-36 bg-secondary/20 rounded-full blur-xl"></div>
                        <div className="absolute bottom-16 left-16 w-44 h-44 bg-primary/20 rounded-full blur-xl"></div>
                        <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-accent/20 rounded-full blur-lg"></div>
                    </div>

                    {/* Main Illustration */}
                    <div className="relative z-10 mb-8">
                        <div className="relative">
                            {/* Medical Plus Background */}
                            <div className="w-52 h-52 bg-gradient-to-br from-secondary to-primary rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6">
                                <div className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center">
                                    <FaClipboardList className="text-7xl text-secondary" />
                                </div>
                            </div>
                            
                            {/* Floating Elements */}
                            <motion.div 
                                className="absolute -top-6 -left-6 w-18 h-18 bg-primary rounded-2xl flex items-center justify-center shadow-lg"
                                animate={{ x: [-3, 3, -3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <FaHeartbeat className="text-2xl text-white" />
                            </motion.div>
                            
                            <motion.div 
                                className="absolute -bottom-6 -right-6 w-18 h-18 bg-accent rounded-2xl flex items-center justify-center shadow-lg"
                                animate={{ x: [3, -3, 3] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                            >
                                <FaShieldAlt className="text-2xl text-white" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-6 text-center max-w-md">
                        <h1 className="text-4xl font-bold text-secondary mb-2">Join VitalLink</h1>
                        <p className="text-lg text-text/80 mb-8">Start your journey to better healthcare management</p>
                    </div>
                </motion.div>

                {/* Right Side - Signup Form */}
                <motion.div 
                    className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 "
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="w-full max-w-md">
                        {showToast && (
                            <motion.div
                                initial={{ opacity: 0, x: 40, y: -20 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, x: 20, y: -10 }}
                                role="alert"
                                className="fixed top-5 right-5 z-50 px-5 py-4 rounded-2xl shadow-xl bg-primary text-white text-sm font-medium flex items-center gap-2 max-w-[90vw] sm:max-w-xs w-auto"
                                style={{ pointerEvents: 'auto' }}
                            >
                                <span>Account created successfully! Redirecting…</span>
                            </motion.div>
                        )}
                        {/* Mobile Header */}
                        <div className="lg:hidden text-center mb-8">
                            <motion.div 
                                className="w-20 h-20 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                            >
                                <FaClipboardList className="text-3xl text-white" />
                            </motion.div>
                            <h1 className="text-2xl font-bold text-secondary">VitalLink</h1>
                            <p className="text-text/70">Start creating your account</p>
                        </div>

                        <motion.form 
                            onSubmit={handleSignup} 
                            className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-accent-40 p-8 rounded-3xl shadow-2xl dark:shadow-white/5 space-y-6"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-3xl lg:text-3xl font-bold text-secondary">Create Account</h2>
                                <p className="text-text/70 mt-2">Choose your account type and get started</p>
                            </div>

                            {/* Role Selection */}
                            <div className="flex gap-3 p-2 bg-gray-100/80 dark:bg-white/5 rounded-2xl backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect("user")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                        form.role === "user"
                                            ? "bg-white dark:bg-white/10 text-primary dark:text-primary shadow-lg dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.10)] transform scale-105 backdrop-blur-sm"
                                            : "text-text/70 hover:text-primary hover:bg-white/50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <FaUserAlt className="text-sm" />
                                    <span className="text-sm">User</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect("doctor")}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                        form.role === "doctor"
                                            ? "bg-white dark:bg-white/10 text-primary dark:text-primary shadow-lg dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.10)] transform scale-105 backdrop-blur-sm"
                                            : "text-text/70 hover:text-primary hover:bg-white/50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <FaUserMd className="text-sm" />
                                    <span className="text-sm">Doctor</span>
                                </button>
                            </div>

                            {formError && (
                                <motion.div 
                                    className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    {formError}
                                </motion.div>
                            )}

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text/80">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <FaUser className="text-text drop-shadow-none" />
                                    </div>
                                        <input
                                            name="name"
                                            type="text"
                                            placeholder="Enter your full name"
                                            required
                                            value={form.name}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:border dark:focus:border-[var(--color-primary)] transition-all backdrop-blur-sm"
                                        />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text/80">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <FaEnvelope className="text-text drop-shadow-none" />
                                    </div>
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            required
                                            value={form.email}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:border dark:focus:border-[var(--color-primary)] transition-all backdrop-blur-sm"
                                        />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text/80">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <FaLock className="text-text drop-shadow-none" />
                                    </div>
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            required
                                            value={form.password}
                                            onChange={handlePasswordChange}
                                            className="w-full pl-12 pr-12 py-4 bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:border dark:focus:border-[var(--color-primary)] transition-all backdrop-blur-sm"
                                        />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text/50 hover:text-secondary transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                {form.password && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text/60">Password Strength:</span>
                                            <span className={`text-xs font-semibold ${
                                                passwordStrength === "weak" ? "text-red-500" :
                                                passwordStrength === "moderate" ? "text-yellow-500" : "text-green-500"
                                            }`}>
                                                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${
                                                    passwordStrength === "weak"
                                                        ? "bg-red-500 w-1/3"
                                                        : passwordStrength === "moderate"
                                                        ? "bg-yellow-500 w-2/3"
                                                        : "bg-green-500 w-full"
                                                }`}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                type="submit"
                                className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Create {form.role === "doctor" ? "Doctor" : "User"} Account
                            </motion.button>

                            <div className="text-center pt-4">
                                <p className="text-text/70">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-secondary font-semibold hover:underline transition-all">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </motion.form>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
