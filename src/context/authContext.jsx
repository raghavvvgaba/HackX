import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { generateUniqueDoctorId } from "../utils/firestoreDoctorService";
import { saveHospitalData } from "../services/hospitalService";

// Function to generate unique hospital ID
const generateUniqueHospitalId = async () => {
  // Generate hospital ID with format: HOS-XXXX-0000
  const letters = 'BCDFGHJKLMNPQRSTVWXYZ'; // Remove ambiguous vowels
  const getRandomLetters = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  };

  const hospitalId = `HOS-${getRandomLetters(4)}-${Math.floor(1000 + Math.random() * 9000)}`;
  return hospitalId;
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock mode removed - using real authentication only
    
    // Regular Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile and role from Firestore
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      // Fetch user role from users collection
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);

        // Set basic user profile immediately to avoid undefined
        setUserProfile(userData);

        if (userData.role === 'hospital') {
          // For hospitals, fetch data from hospitals collection
          if (userData.hospitalId) {
            const hospitalDocRef = doc(db, "hospitals", userData.hospitalId);
            const hospitalDoc = await getDoc(hospitalDocRef);
            if (hospitalDoc.exists()) {
              // Update with full hospital data
              setUserProfile(prev => ({
                ...prev,
                ...hospitalDoc.data()
              }));
            } else {
              console.error("No hospital document found for ID:", userData.hospitalId);
              // Hospital document doesn't exist, use basic data from users collection
              console.log("Using basic user data for hospital");
            }
          }
        } else {
          // For users and doctors, fetch from userProfile collection
          const profileDocRef = doc(db, "userProfile", uid);
          const profileDoc = await getDoc(profileDocRef);
          if (profileDoc.exists()) {
            // Update with full profile data
            setUserProfile(prev => ({
              ...prev,
              ...profileDoc.data()
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Still set basic user data on error
      setUserProfile({ role: 'unknown', uid });
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Step 2: Update Firebase profile
      await updateProfile(userCredential.user, { displayName: name });
      
      // Step 3: Generate doctor ID if the user is a doctor, or hospital ID if hospital
      let doctorId = null;
      let hospitalId = null;
      if (role === "doctor") {
        doctorId = await generateUniqueDoctorId();
      } else if (role === "hospital") {
        hospitalId = await generateUniqueHospitalId();
      }

      // Step 4: Store user data in Firestore
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userData = {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false, // Add this field for new users
      };

      // Add doctor ID if user is a doctor
      if (doctorId) {
        userData.doctorId = doctorId;
      }

      // Add hospital ID if user is a hospital
      if (hospitalId) {
        userData.hospitalId = hospitalId;
      }
      
      await setDoc(userDocRef, userData);

      // If user is a hospital, also save to hospitals collection
      if (role === 'hospital' && hospitalId) {
        const hospitalData = {
          uid: userCredential.user.uid,
          name,
          email,
          // Additional hospital fields can be added during onboarding
          address: '',
          phone: '',
          type: 'General Hospital', // Can be updated later
          specialties: [],
          departments: [],
          capacity: 0,
          onboardingCompleted: false, // Add this field
        };

        console.log('Creating hospital document with ID:', hospitalId);
        const hospitalResult = await saveHospitalData(hospitalId, hospitalData);
        if (hospitalResult.success) {
          console.log('Hospital document created successfully');
        } else {
          console.error('Error saving hospital data:', hospitalResult.error);
          // Note: We don't throw error here to avoid blocking signup
        }
      }

      // Update local state immediately after signup
      setUserRole(role);
      setUserProfile({
        ...userData,
        onboardingCompleted: false // Will be updated when onboarding is complete
      });

      // If hospital, also fetch the hospital data we just saved
      if (role === 'hospital' && hospitalId) {
        const { getHospitalByUid } = await import('../services/hospitalService');
        const hospitalResult = await getHospitalByUid(userCredential.user.uid);
        if (hospitalResult.success) {
          setUserProfile(prev => ({
            ...prev,
            ...hospitalResult.data
          }));
        }
      }

      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    // Firebase logout
    await signOut(auth);
    setUser(null);
    setUserRole(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userProfile, loading, signup, login, logout, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
