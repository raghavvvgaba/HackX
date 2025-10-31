import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Save hospital data to hospitals collection
 */
export const saveHospitalData = async (hospitalId, hospitalData) => {
  try {
    const hospitalRef = doc(db, 'hospitals', hospitalId);
    const hospitalPayload = {
      ...hospitalData,
      hospitalId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      // Add default hospital settings
      settings: {
        allowPatientSharing: true,
        requireApproval: false,
        autoAcceptSharedProfiles: true
      }
    };

    await setDoc(hospitalRef, hospitalPayload);

    return { success: true, data: hospitalPayload };
  } catch (error) {
    console.error('Error saving hospital data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get hospital data by ID
 */
export const getHospitalById = async (hospitalId) => {
  try {
    const hospitalRef = doc(db, 'hospitals', hospitalId);
    const hospitalDoc = await getDoc(hospitalRef);

    if (hospitalDoc.exists()) {
      return { success: true, data: hospitalDoc.data() };
    } else {
      return { success: false, error: 'Hospital not found' };
    }
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update hospital data
 */
export const updateHospitalData = async (hospitalId, updateData) => {
  try {
    const hospitalRef = doc(db, 'hospitals', hospitalId);
    await updateDoc(hospitalRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating hospital data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get hospital by user UID (from auth)
 */
export const getHospitalByUid = async (uid) => {
  try {
    // First get the hospital ID from users collection
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().role === 'hospital') {
      const hospitalId = userDoc.data().hospitalId;
      if (hospitalId) {
        return await getHospitalById(hospitalId);
      }
    }

    return { success: false, error: 'Hospital not found for this user' };
  } catch (error) {
    console.error('Error fetching hospital by UID:', error);
    return { success: false, error: error.message };
  }
};