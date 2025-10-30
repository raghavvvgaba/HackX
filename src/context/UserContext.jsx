import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { getUserProfile } from "../utils/firestoreService";
import React, { useCallback } from "react";

// Create context
const UserContext = createContext();

// Create provider
export function UserProvider({ children }) {
  const [userProfileState, setUserProfileState] = useState(null);
  const [loading, setLoading] = useState(true); 

  const refreshUserProfile = useCallback(async () => {
    if (!auth.currentUser) {
      console.log("No user ID found");
      return;
    }
    console.log("Refreshing user profile");
    setLoading(true);
    try {
      const profile = await getUserProfile(auth.currentUser.uid);
      setUserProfileState({ uid: auth.currentUser.uid, ...profile });
    } catch (error) {
      console.error("Error refreshing user profile:", error);
      // Optionally handle the error in your UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfileState({ uid: user.uid, ...profile });
      } else {
        setUserProfileState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userProfileState, refreshUserProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use user context
export function useUser() {
  return useContext(UserContext);
}
