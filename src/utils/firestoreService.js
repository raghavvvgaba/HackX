import { getFirestore, collection, addDoc, getDoc, doc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { findDoctorByDoctorId } from "./firestoreDoctorService";
import {
  userToFHIRPatient,
  vitalsToObservations,
  conditionsToFHIRConditions,
  allergiesToFHIRAllergyIntolerances,
  validateFHIRResource
} from "../services/fhirService";

// Updated function to add/update profile data for a user incrementally
// This function now uses { merge: true } to merge the incoming profileData with any existing document data
// Also saves data in FHIR format for compliance
export async function addUserProfile(userId, profileData) {
  try {
    console.log("Attempting to save to Firestore:", { userId, profileData });
    console.log("Current auth user:", auth.currentUser);
    console.log("Auth state:", auth.currentUser ? "authenticated" : "not authenticated");

    // The profileData can be a partial object containing just the section to update, e.g. { basic: {...} } or { medical: {...} }

    // 1. Save in original format (backward compatibility)
    await setDoc(doc(db, "userProfile", userId), profileData, { merge: true });
    console.log("Successfully saved to Firestore (original format)");

    // 2. ALSO save as FHIR resources
    try {
      // Get user data for FHIR transformation
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Get complete profile data
        const profileDocRef = doc(db, "userProfile", userId);
        const profileDoc = await getDoc(profileDocRef);
        const completeProfile = profileDoc.exists()
          ? { ...profileDoc.data(), ...profileData }
          : profileData;

        // Save as FHIR Patient resource
        const fhirPatient = userToFHIRPatient(userData, completeProfile);
        validateFHIRResource(fhirPatient);
        await setDoc(doc(db, "fhir", "patients", userId, "Patient"), fhirPatient);

        // Save vitals as FHIR Observations (if basic info exists)
        if (completeProfile.basic) {
          const observations = vitalsToObservations(completeProfile, userId);
          for (const obs of observations) {
            validateFHIRResource(obs);
            await setDoc(doc(db, "fhir", "patients", userId, obs.id), obs);
          }
        }

        // Save conditions as FHIR Conditions (if medical info exists)
        if (completeProfile.medical) {
          const conditions = conditionsToFHIRConditions(completeProfile, userId);
          for (const condition of conditions) {
            validateFHIRResource(condition);
            await setDoc(doc(db, "fhir", "patients", userId, condition.id), condition);
          }

          // Save allergies as FHIR AllergyIntolerances
          const allergies = allergiesToFHIRAllergyIntolerances(completeProfile, userId);
          for (const allergy of allergies) {
            validateFHIRResource(allergy);
            await setDoc(doc(db, "fhir", "patients", userId, allergy.id), allergy);
          }
        }

        console.log("Successfully saved as FHIR resources");
      }
    } catch (fhirError) {
      console.error("Error saving FHIR resources (but original data saved):", fhirError);
      // Don't fail the entire operation if FHIR saving fails
    }

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
export async function shareProfileWithDoctor(patientId, recipientIdCode) {
  try {
    // Check if it's a doctor or hospital ID
    const isHospital = recipientIdCode.startsWith('HOS-');
    let recipientData = null;

    if (isHospital) {
      // Find hospital by their ID
      recipientData = await findHospitalByHospitalId(recipientIdCode);

      if (!recipientData) {
        return { success: false, error: "Hospital not found. Please check the Hospital ID and try again." };
      }
    } else {
      // Find doctor by their ID
      recipientData = await findDoctorByDoctorId(recipientIdCode);

      if (!recipientData) {
        return { success: false, error: "Doctor not found. Please check the Doctor ID and try again." };
      }
    }

    const recipientId = recipientData.uid || recipientData.id; // Firebase UID

    // Use predictable ID format for better security and rule enforcement
    const shareId = `${recipientId}_${patientId}`;

    // Check if already shared
    const existingShareRef = doc(db, "shared_profiles", shareId);
    const existingShare = await getDoc(existingShareRef);

    if (existingShare.exists() && existingShare.data().status === 'active') {
      const recipientType = isHospital ? 'Hospital' : 'Doctor';
      return { success: false, error: `Profile already shared with this ${recipientType.toLowerCase()}.` };
    }

    // Create a share record in a "shared_profiles" collection
    const shareData = {
      patientId,
      recipientId, // Changed from doctorId to recipientId
      recipientIdCode, // Changed from doctorIdCode
      recipientName: recipientData.name || 'Unknown',
      recipientType: isHospital ? 'hospital' : 'doctor', // Add recipient type
      sharedAt: serverTimestamp(),
      status: 'active' // active, revoked, expired
    };

    const shareRef = doc(db, "shared_profiles", shareId);
    await setDoc(shareRef, shareData);

    return {
      success: true,
      shareId,
      recipientName: recipientData.name,
      recipientType: isHospital ? 'hospital' : 'doctor'
    };
  } catch (error) {
    console.error("Error sharing profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Find hospital by hospital ID code
 * @param {string} hospitalIdCode - The hospital's public ID code (e.g., HOS-MEDC-5678)
 * @returns {Promise<Object|null>} - Hospital data or null if not found
 */
async function findHospitalByHospitalId(hospitalIdCode) {
  try {
    const hospitalsRef = collection(db, "hospitals");
    const q = query(hospitalsRef, where("hospitalId", "==", hospitalIdCode), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const hospitalDoc = querySnapshot.docs[0];
      return {
        id: hospitalDoc.id,
        uid: hospitalDoc.data().uid,
        ...hospitalDoc.data()
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding hospital by ID:", error);
    return null;
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

