import { getFirestore, collection, addDoc, getDoc, doc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { findDoctorByDoctorId } from "./firestoreDoctorService";

// Updated function to add/update profile data for a user incrementally
// This function now uses { merge: true } to merge the incoming profileData with any existing document data
export async function addUserProfile(userId, profileData) {
  try {
    console.log("Attempting to save to Firestore:", { userId, profileData });
    console.log("Current auth user:", auth.currentUser);
    console.log("Auth state:", auth.currentUser ? "authenticated" : "not authenticated");
    
    // The profileData can be a partial object containing just the section to update, e.g. { basic: {...} } or { medical: {...} }
  await setDoc(doc(db, "userProfile", userId), profileData, { merge: true });
    console.log("Successfully saved to Firestore");
    return { success: true };
  } catch (error) {
    console.error("Error adding/updating user profile:", error);
    console.error("Error details:", error.code, error.message);
    return { success: false, error: error.message };
  }
}

export async function getUserProfile(userId) {
  try {
  const docRef = doc(db, "userProfile", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: error.message };
  }
}

export async function editUserProfile(userId, profileData) {
  try {
    // Use updateDoc to update specific fields in the user profile
  await updateDoc(doc(db, "userProfile", userId), profileData);
    return { success: true };
  } catch (error) {
    console.error("Error editing user profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Shares a user's profile and medical records with a doctor
 * @param {string} patientId - The patient's user ID
 * @param {string} doctorIdCode - The doctor's human-readable ID (DR-XXXX-1234)
 * @returns {Promise<Object>} - Success/error result
 */
export async function shareProfileWithDoctor(patientId, doctorIdCode) {
  try {
    // First, find the doctor by their public ID code
    const doctorData = await findDoctorByDoctorId(doctorIdCode);
    
    if (!doctorData) {
      return { success: false, error: "Doctor not found. Please check the Doctor ID and try again." };
    }
    
    const doctorId = doctorData.id; // This is the Firebase UID
    
    // Use predictable ID format for better security and rule enforcement
    const shareId = `${doctorId}_${patientId}`;
    
    // Check if already shared
    const existingShareRef = doc(db, "shared_profiles", shareId);
    const existingShare = await getDoc(existingShareRef);
    
    if (existingShare.exists() && existingShare.data().status === 'active') {
      return { success: false, error: "Profile already shared with this doctor." };
    }
    
    // Create a share record in a "shared_profiles" collection
    const shareData = {
      patientId,
      doctorId,
      doctorIdCode,
      doctorName: doctorData.name || 'Unknown Doctor',
      sharedAt: serverTimestamp(),
      status: 'active' // active, revoked, expired
    };
    
    const shareRef = doc(db, "shared_profiles", shareId);
    await setDoc(shareRef, shareData);
    
    return { success: true, shareId, doctorName: doctorData.name };
  } catch (error) {
    console.error("Error sharing profile with doctor:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gets all doctors with whom a patient has shared their profile
 * @param {string} patientId - The patient's user ID
 * @returns {Promise<Object>} - Success/error result with shared profiles
 */
export async function getPatientSharedProfiles(patientId) {
  try {
    const sharedProfilesRef = collection(db, "shared_profiles");
    const q = query(sharedProfilesRef, where("patientId", "==", patientId), where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const sharedProfiles = [];
    querySnapshot.forEach((doc) => {
      sharedProfiles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: sharedProfiles };
  } catch (error) {
    console.error("Error fetching patient shared profiles:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Revokes access of a doctor to patient's profile
 * @param {string} patientId - The patient's user ID
 * @param {string} doctorId - The doctor's user ID
 * @returns {Promise<Object>} - Success/error result
 */
export async function revokeProfileAccess(patientId, doctorId) {
  try {
    const shareId = `${doctorId}_${patientId}`;
    const shareRef = doc(db, "shared_profiles", shareId);
    
    // Check if the share exists
    const shareDoc = await getDoc(shareRef);
    if (!shareDoc.exists()) {
      return { success: false, error: "Share record not found." };
    }
    
    // Update the status to 'revoked'
    await updateDoc(shareRef, {
      status: 'revoked',
      revokedAt: serverTimestamp()
    });
    
    return { success: true, message: "Profile access successfully revoked." };
  } catch (error) {
    console.error("Error revoking profile access:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gets medical records for a patient with pagination
 * @param {string} patientId - The patient's user ID
 * @param {Object} lastDoc - The last document from the previous page (optional)
 * @param {number} pageSize - Number of records per page (default: 20)
 * @param {boolean} includeDeactivated - Whether to include deactivated records (default: false)
 * @returns {Promise<Object>} - Success/error result with medical records and pagination info
 */
export async function getPatientMedicalRecords(patientId, lastDoc = null, pageSize = 20, includeDeactivated = false) {
  try {
    const recordsRef = collection(db, "medicalRecords");
    
    // Simple query to get patient's medical records
    let q = query(
      recordsRef,
      where("patientId", "==", patientId),
      limit(pageSize)
    );
    
    const querySnapshot = await getDocs(q);
    const records = [];
    let lastDocument = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter out deactivated records in JavaScript if needed
      if (!includeDeactivated && data.isActive === false) {
        return; // Skip deactivated records
      }
      
      records.push({
        id: doc.id,
        ...data
      });
      lastDocument = doc;
    });

    // Sort by visitDate in memory
    const sortedRecords = records.sort((a, b) => {
      const dateA = new Date(a.visitDate || a.createdAt?.toDate() || 0);
      const dateB = new Date(b.visitDate || b.createdAt?.toDate() || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    // Check if there are more records
    const hasMore = records.length === pageSize;
    
    return { 
      success: true, 
      data: sortedRecords,
      hasMore,
      lastDoc: lastDocument
    };
    
  } catch (error) {
    console.error("Error fetching patient medical records:", error);
    
    // If it's a permission error or index error, return a more helpful message
    if (error.code === 'failed-precondition') {
      return { 
        success: false, 
        error: "Database index not ready. Please try again in a moment." 
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Failed to fetch medical records." 
    };
  }
}

