import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { generateUniqueDoctorId } from "../utils/firestoreDoctorService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        
        // Also fetch profile data from userProfile collection
        const profileDocRef = doc(db, "userProfile", uid);
        const profileDoc = await getDoc(profileDocRef);
        if (profileDoc.exists()) {
          setUserProfile({
            ...userData, // Include users collection data
            ...profileDoc.data(), // Include userProfile collection data
          });
        } else {
          // No profile data yet, but include onboardingCompleted status from users
          setUserProfile(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Step 2: Update Firebase profile
      await updateProfile(userCredential.user, { displayName: name });
      
      // Step 3: Generate doctor ID if the user is a doctor
      let doctorId = null;
      if (role === "doctor") {
        doctorId = await generateUniqueDoctorId();
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
      
      await setDoc(userDocRef, userData);
      
      // Update local state  
      setUserRole(role);
      setUserProfile({
        ...userData,
        onboardingCompleted: false // Will be updated when onboarding is complete
      });
      
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
