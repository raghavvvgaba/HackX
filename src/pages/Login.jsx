import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaUserMd, FaUserAlt, FaEye, FaEyeSlash, FaHeartbeat, FaShieldAlt, FaUsers, FaHospital } from "react-icons/fa";
import { useAuth } from "../context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import Navbar from "../components/Navbar";
import { loginHospitalAdmin, getMockHospitalUser } from "../services/mockHospitalService";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, userRole, loading } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === "doctor") {
        navigate("/doctor");
      } else if (userRole === "hospital_admin") {
        navigate("/hospital");
      } else {
        navigate("/user");
      }
    }
  }, [user, userRole, loading, navigate]);
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // Show loading while checking authentication so the page doesn't false navigate until authentication is confirmed
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // MOCK MODE: Hospital login bypass
    if (form.role === "hospital_admin") {
      try {
        const result = await loginHospitalAdmin(form.email, form.password);
        if (result.success) {
          // Store mock user in localStorage for persistence
          localStorage.setItem('mockHospitalUser', JSON.stringify(result.user));
          localStorage.setItem('mockMode', 'true');
          console.log("Mock Hospital Login successful:", result.user);
          console.log("localStorage set:", {
            mockMode: localStorage.getItem('mockMode'),
            mockUser: localStorage.getItem('mockHospitalUser')
          });
          
          // Small delay to ensure localStorage is set, then navigate
          setTimeout(() => {
            window.location.href = "/hospital/dashboard";
          }, 100);
          return;
        } else {
          setFormError(result.error);
          return;
        }
      } catch (error) {
        setFormError("Mock login failed. Try: admin@hospital.com / hospital123");
        return;
      }
    }
    
    // Regular Firebase login for patients and doctors
    try {
      const { user } = await login(form.email, form.password);
      console.log("Login successful:", user);

      // Get user role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        // Navigate based on actual role from Firestore, not the selected tab
        if (userRole === "doctor") {
          navigate("/doctor");
        } else if (userRole === "hospital_admin") {
          navigate("/hospital");
        } else {
          // For regular users, navigate to user dashboard
          // The authContext will handle loading their role
          navigate("/user");
        }
      } else {
        // User document doesn't exist in Firestore
        setFormError("User profile not found. Please contact support.");
      }
    } catch (error) {
      setFormError("Invalid email or password.");
      console.error("Login failed:", error.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex">
        {/* Left Side - Illustration and Features */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent/20 rounded-full blur-lg"></div>
          </div>

          {/* Main Illustration */}
          <div className="relative z-10 mb-8">
            <div className="relative">
              {/* Medical Cross Background */}
              <div className="w-48 h-48 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6">
                <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center">
                  <FaHeartbeat className="text-6xl text-primary" />
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div 
                className="absolute -top-4 -right-4 w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FaShieldAlt className="text-2xl text-white" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg"
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <FaUsers className="text-2xl text-white" />
              </motion.div>
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-6 text-center max-w-md">
            <h1 className="text-4xl font-bold text-primary mb-2">Welcome to VitalLink</h1>
            <p className="text-lg text-text/80 mb-8">Your comprehensive healthcare management platform</p>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div 
          className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <FaHeartbeat className="text-3xl text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-primary">VitalLink</h1>
              <p className="text-text/70">Welcome back to your account</p>
            </div>

            <motion.form
              onSubmit={handleLogin}
              className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-accent-40 p-8 rounded-3xl shadow-2xl dark:shadow-white/5 space-y-6"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl lg:text-3xl font-bold text-primary">Welcome Back</h2>
                <p className="text-text/70 mt-2">Choose your account type and login</p>
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100/80 dark:bg-white/5 rounded-2xl backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("user")}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl font-medium transition-all duration-300 ${
                    form.role === "user"
                      ? "bg-white dark:bg-white/10 text-primary dark:text-primary shadow-lg dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.10)] transform scale-105 backdrop-blur-sm"
                      : "text-text/70 hover:text-primary hover:bg-white/50 dark:hover:bg-white/5"
                  }`}
                >
                  <FaUserAlt className="text-base" />
                  <span className="text-xs">Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("doctor")}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl font-medium transition-all duration-300 ${
                    form.role === "doctor"
                      ? "bg-white dark:bg-white/10 text-primary dark:text-primary shadow-lg dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.10)] transform scale-105 backdrop-blur-sm"
                      : "text-text/70 hover:text-primary hover:bg-white/50 dark:hover:bg-white/5"
                  }`}
                >
                  <FaUserMd className="text-base" />
                  <span className="text-xs">Doctor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("hospital_admin")}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl font-medium transition-all duration-300 ${
                    form.role === "hospital_admin"
                      ? "bg-white dark:bg-white/10 text-primary dark:text-primary shadow-lg dark:shadow-[0_4px_8px_0_rgba(255,255,255,0.10)] transform scale-105 backdrop-blur-sm"
                      : "text-text/70 hover:text-primary hover:bg-white/50 dark:hover:bg-white/5"
                  }`}
                >
                  <FaHospital className="text-base" />
                  <span className="text-xs">Hospital</span>
                </button>
              </div>

              {/* Error Message */}
              {formError && (
                <motion.div 
                  className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {formError}
                </motion.div>
              )}

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
                    placeholder="Enter your password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:border dark:focus:border-[var(--color-primary)] transition-all backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text/50 hover:text-primary transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Log In as {form.role === "doctor" ? "Doctor" : form.role === "hospital_admin" ? "Hospital" : "Patient"}
              </motion.button>

              <div className="text-center pt-4">
                <p className="text-text/70">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary font-semibold hover:underline transition-all">
                    Create Account
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
