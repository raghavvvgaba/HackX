import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Generates a human-readable doctor ID in the format: DR-XXXX-YYYY
 * Where XXXX is a 4-letter combination and YYYY is a 4-digit number
 */
export function generateDoctorId() {
  // Array of consonants and vowels for better readability
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const vowels = 'AEIOU';
  
  // Generate 4-letter combination (consonant-vowel pattern for readability)
  let letters = '';
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 0) {
      // Even positions: consonants
      letters += consonants[Math.floor(Math.random() * consonants.length)];
    } else {
      // Odd positions: vowels
      letters += vowels[Math.floor(Math.random() * vowels.length)];
    }
  }
  
  // Generate 4-digit number
  const numbers = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits
  
  return `DR-${letters}-${numbers}`;
}

/**
 * Checks if a doctor ID already exists in the database
 * @param {string} doctorId - The doctor ID to check
 * @returns {Promise<boolean>} - True if ID exists, false otherwise
 */
export async function isDoctorIdExists(doctorId) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("doctorId", "==", doctorId));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking doctor ID:", error);
    throw error;
  }
}

/**
 * Generates a unique doctor ID by checking against existing IDs
 * @returns {Promise<string>} - A unique doctor ID
 */
export async function generateUniqueDoctorId() {
  let doctorId;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loops
  
  do {
    doctorId = generateDoctorId();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error("Unable to generate unique doctor ID after multiple attempts");
    }
  } while (await isDoctorIdExists(doctorId));
  
  return doctorId;
}

/**
 * Validates if a doctor ID follows the correct format
 * @param {string} doctorId - The doctor ID to validate
 * @returns {boolean} - True if valid format, false otherwise
 */
export function validateDoctorIdFormat(doctorId) {
  const pattern = /^DR-[BCDFGHJKLMNPQRSTVWXYZAEIOU]{4}-\d{4}$/;
  return pattern.test(doctorId);
}

/**
 * Finds a doctor by their doctor ID
 * @param {string} doctorId - The doctor ID to search for
 * @returns {Promise<Object|null>} - Doctor data if found, null otherwise
 */
export async function findDoctorByDoctorId(doctorId) {
  try {
    if (!validateDoctorIdFormat(doctorId)) {
      throw new Error("Invalid doctor ID format");
    }
    
    const usersRef = collection(db, "users");
    const q = query(
      usersRef, 
      where("doctorId", "==", doctorId),
      where("role", "==", "doctor")
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const docData = querySnapshot.docs[0];
    return {
      id: docData.id,
      ...docData.data()
    };
  } catch (error) {
    console.error("Error finding doctor by ID:", error);
    throw error;
  }
}

/**
 * Gets a shared profile record and validates doctor access
 * @param {string} shareId - The share ID in format doctorId_patientId
 * @param {string} doctorId - The doctor's user ID for validation
 * @returns {Promise<Object>} - Success/error result with share record
 */
export async function getSharedProfileRecord(shareId, doctorId) {
  try {
    // Verify shareId format is doctorId_patientId
    const shareIdParts = shareId.split('_');
    if (shareIdParts.length !== 2) {
      return { success: false, error: "Invalid share link format." };
    }

    const [shareIdDoctorId, patientId] = shareIdParts;
    
    // Verify the current user is the authorized doctor
    if (shareIdDoctorId !== doctorId) {
      return { success: false, error: "You are not authorized to view this patient's profile." };
    }

    // Fetch the share record to verify it exists and is active
    const shareDocRef = doc(db, "shared_profiles", shareId);
    const shareDoc = await getDoc(shareDocRef);
    
    if (!shareDoc.exists()) {
      return { success: false, error: "Shared profile not found." };
    }

    const shareData = shareDoc.data();
    
    // Double-check authorization and status
    if (shareData.doctorId !== doctorId) {
      return { success: false, error: "You are not authorized to view this patient's profile." };
    }

    if (shareData.status !== 'active') {
      return { success: false, error: "This patient profile is no longer shared with you." };
    }

    return { success: true, data: shareData };
  } catch (error) {
    console.error("Error fetching shared profile record:", error);
    return { success: false, error: "Failed to load patient profile. Please try again." };
  }
}

/**
 * Gets patient basic information (name, email) from users collection
 * @param {string} patientId - The patient's user ID
 * @returns {Promise<Object>} - Success/error result with patient info
 */
export async function getPatientBasicInfo(patientId) {
  try {
    const userDocRef = doc(db, "users", patientId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        success: true,
        data: {
          name: userData.name || 'Unknown Patient',
          email: userData.email || ''
        }
      };
    } else {
      return { success: false, error: "Patient information not found." };
    }
  } catch (error) {
    console.error("Error fetching patient basic info:", error);
    return { success: false, error: "Failed to load patient information." };
  }
}

/**
 * Gets all profiles shared with a specific doctor
 * @param {string} doctorId - The doctor's user ID
 * @returns {Promise<Object>} - Success/error result with shared profiles
 */
export async function getSharedProfiles(doctorId) {
  try {
    const sharedProfilesRef = collection(db, "shared_profiles");
    const q = query(sharedProfilesRef, where("doctorId", "==", doctorId), where("status", "==", "active"));
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
    console.error("Error fetching shared profiles:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gets complete patient profile data
 * @param {string} patientId - The patient's user ID
 * @returns {Promise<Object>} - Success/error result with patient profile
 */
export async function getPatientProfile(patientId) {
  try {
    const patientDocRef = doc(db, "userProfile", patientId);
    const patientDoc = await getDoc(patientDocRef);
    
    if (patientDoc.exists()) {
      return { success: true, data: patientDoc.data() };
    } else {
      return { success: false, error: "Patient profile not found." };
    }
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return { success: false, error: "Failed to load patient profile." };
  }
}

/**
 * Adds a medical record for a patient by an authorized doctor
 * @param {string} doctorId - The doctor's user ID
 * @param {string} patientId - The patient's user ID  
 * @param {Object} medicalData - The medical record data
 * @returns {Promise<Object>} - Success/error result
 */
export async function addMedicalRecord(doctorId, patientId, medicalData) {
  try {
    // Step 1: Verify doctor has active access to patient's profile
    const shareId = `${doctorId}_${patientId}`;
    const shareRef = doc(db, "shared_profiles", shareId);
    const shareDoc = await getDoc(shareRef);
    
    if (!shareDoc.exists()) {
      return { 
        success: false, 
        error: "You don't have access to this patient's profile." 
      };
    }
    
    const shareData = shareDoc.data();
    
    // Verify share is active and doctor matches
    if (shareData.status !== 'active' || shareData.doctorId !== doctorId) {
      return { 
        success: false, 
        error: "Your access to this patient's profile has been revoked or is invalid." 
      };
    }
    
    // Step 2: Get doctor information for the record
    const doctorRef = doc(db, "users", doctorId);
    const doctorDoc = await getDoc(doctorRef);
    
    if (!doctorDoc.exists()) {
      return { 
        success: false, 
        error: "Doctor information not found." 
      };
    }
    
    const doctorInfo = doctorDoc.data();
    
    // Step 3: Prepare medical record data
    const recordData = {
      patientId,
      doctorId,
      doctorIdCode: shareData.doctorIdCode,
      doctorName: shareData.doctorName || doctorInfo.name,
      
      // Medical data
      visitDate: medicalData.visitDate, // Store as string (YYYY-MM-DD)
      symptoms: medicalData.symptoms || [],
      diagnosis: medicalData.diagnosis || '',
      medicines: medicalData.medicines || [],
      prescribedTests: medicalData.prescribedTests || [],
      followUpNotes: medicalData.followUpNotes || '',
      
      // File data (if provided)
      ...(medicalData.fileName && {
        fileName: medicalData.fileName,
        fileType: medicalData.fileType,
        fileUrl: medicalData.fileUrl
      }),
      
      // Metadata
      createdAt: serverTimestamp(),
      lastModifiedAt: serverTimestamp(),
      createdBy: doctorId,
      shareRecordId: shareId,
      isActive: true
    };
    
    // Step 4: Add the medical record
    const medicalRecordsRef = collection(db, "medicalRecords");
    const docRef = await addDoc(medicalRecordsRef, recordData);
    
    return { 
      success: true, 
      recordId: docRef.id,
      message: "Medical record added successfully." 
    };
    
  } catch (error) {
    console.error("Error adding medical record:", error);
    return { 
      success: false, 
      error: "Failed to add medical record. Please try again." 
    };
  }
}

/**
 * Updates a medical record (only by the doctor who created it)
 * @param {string} recordId - The medical record ID
 * @param {string} doctorId - The doctor's user ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - Success/error result
 */
export async function updateMedicalRecord(recordId, doctorId, updateData) {
  try {
    const recordRef = doc(db, "medicalRecords", recordId);
    const recordDoc = await getDoc(recordRef);
    
    if (!recordDoc.exists()) {
      return { 
        success: false, 
        error: "Medical record not found." 
      };
    }
    
    const recordData = recordDoc.data();

    // Verify doctor has active access to patient's profile
    const shareRef = doc(db, "shared_profiles", recordData.shareRecordId);
    const shareDoc = await getDoc(shareRef);
    
    if (!shareDoc.exists() || shareDoc.data().status !== 'active') {
      return { 
        success: false, 
        error: "You don't have access to this patient's profile." 
      };
    }
    
    // Verify doctor authorization
    if (recordData.createdBy !== doctorId) {
      return { 
        success: false, 
        error: "You can only update medical records you created." 
      };
    }

    // Check if record is older than 30 minutes
    const createdAt = recordData.createdAt;
    let createdTimestamp;
    if (createdAt && createdAt.seconds) {
      createdTimestamp = createdAt.seconds * 1000;
    } else if (typeof createdAt === 'number') {
      createdTimestamp = createdAt;
    } else {
      // If createdAt is missing or invalid, block update for safety
      return {
        success: false,
        error: "Cannot verify record creation time. Update not allowed."
      };
    }
    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000;
    if (now - createdTimestamp > THIRTY_MINUTES) {
      return {
        success: false,
        error: "Medical record cannot be updated after 30 minutes of creation."
      };
    }

    // Update the record
    const updatePayload = {
      ...updateData,
      lastModifiedAt: serverTimestamp()
    };

    await updateDoc(recordRef, updatePayload);

    return { 
      success: true, 
      message: "Medical record updated successfully." 
    };

  } catch (error) {
    console.error("Error updating medical record:", error);
    return { 
      success: false, 
      error: "Failed to update medical record." 
    };
  }
}

/**
 * Soft deletes a medical record (marks as inactive)
 * @param {string} recordId - The medical record ID
 * @param {string} doctorId - The doctor's user ID
 * @returns {Promise<Object>} - Success/error result
 */
export async function deactivateMedicalRecord(recordId, doctorId) {
  try {
    const recordRef = doc(db, "medicalRecords", recordId);
    const recordDoc = await getDoc(recordRef);
    
    if (!recordDoc.exists()) {
      return { 
        success: false, 
        error: "Medical record not found." 
      };
    }
    
    const recordData = recordDoc.data();
    
    // Only the doctor who created the record can deactivate it
    if (recordData.createdBy !== doctorId) {
      return { 
        success: false, 
        error: "You can only deactivate medical records you created." 
      };
    }
    
    await updateDoc(recordRef, {
      isActive: false,
      lastModifiedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      message: "Medical record deactivated successfully." 
    };
    
  } catch (error) {
    console.error("Error deactivating medical record:", error);
    return { 
      success: false, 
      error: "Failed to deactivate medical record." 
    };
  }
}

/**
 * Gets medical records for a specific patient by an authorized doctor with pagination
 * @param {string} doctorId - The doctor's user ID
 * @param {string} patientId - The patient's user ID
 * @param {Object} lastDoc - The last document from the previous page (optional)
 * @param {number} pageSize - Number of records per page (default: 20)
 * @returns {Promise<Object>} - Success/error result with medical records and pagination info
 */
export async function getDoctorPatientMedicalRecords(doctorId, patientId, lastDoc = null, pageSize = 20) {
  try {
    // Verify doctor has active access to patient's profile
    const shareId = `${doctorId}_${patientId}`;
    const shareRef = doc(db, "shared_profiles", shareId);
    const shareDoc = await getDoc(shareRef);
    
    if (!shareDoc.exists() || shareDoc.data().status !== 'active') {
      return { 
        success: false, 
        error: "You don't have access to this patient's profile." 
      };
    }

    // Get medical records for this patient
    const recordsRef = collection(db, "medicalRecords");
    const q = query(
      recordsRef,
      where("patientId", "==", patientId)
    );

    const querySnapshot = await getDocs(q);
    
    const allRecords = [];
    querySnapshot.forEach((doc) => {
      allRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Filter for active records
    const activeRecords = allRecords.filter(record => record.isActive !== false);

    // Sort records by visitDate in descending order (newest first)
    activeRecords.sort((a, b) => {
      const dateA = new Date(a.visitDate || a.createdAt?.toDate?.() || 0);
      const dateB = new Date(b.visitDate || b.createdAt?.toDate?.() || 0);
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedRecords = activeRecords.slice(0, pageSize);
    const hasMore = activeRecords.length > pageSize;
    
    return { 
      success: true, 
      data: paginatedRecords,
      pagination: {
        hasMore,
        lastDoc: null, // Simple pagination for now
        currentPageSize: paginatedRecords.length,
        requestedPageSize: pageSize
      }
    };
    
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return { 
      success: false, 
      error: "Failed to fetch medical records." 
    };
  }
}
