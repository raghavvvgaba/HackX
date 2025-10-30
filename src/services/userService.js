import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userToFHIRPatient, vitalsToObservations, validateFHIRResource } from './fhirService';

// Save user as FHIR Patient resource
export const saveUserAsFHIRPatient = async (userData, profileData) => {
  try {
    const patientRef = doc(db, 'fhir', 'patients', userData.uid, 'Patient');

    // Transform to FHIR Patient resource
    const fhirPatient = userToFHIRPatient(userData, profileData);

    // Validate FHIR resource
    validateFHIRResource(fhirPatient);

    // Save to Firestore
    await setDoc(patientRef, fhirPatient);

    // Also save in users collection for backward compatibility
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, userData);

    return fhirPatient;
  } catch (error) {
    console.error('Error saving FHIR Patient:', error);
    throw error;
  }
};

// Get user as FHIR Patient
export const getUserAsFHIRPatient = async (userId) => {
  try {
    const patientRef = doc(db, 'fhir', 'patients', userId, 'Patient');
    const patientDoc = await getDoc(patientRef);

    if (patientDoc.exists()) {
      return patientDoc.data();
    }

    // Fallback to old format and convert
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const profileRef = doc(db, 'userProfile', userId);
      const profileDoc = await getDoc(profileRef);

      return userToFHIRPatient(userDoc.data(), profileDoc.data());
    }

    return null;
  } catch (error) {
    console.error('Error getting FHIR Patient:', error);
    throw error;
  }
};

// Save patient vitals as FHIR Observations
export const savePatientObservations = async (userId, profileData) => {
  try {
    const observations = vitalsToObservations(profileData, userId);
    const batch = [];

    observations.forEach(obs => {
      validateFHIRResource(obs);
      const obsRef = doc(db, 'fhir', 'patients', userId, obs.id);
      batch.push(setDoc(obsRef, obs));
    });

    await Promise.all(batch);
    return observations;
  } catch (error) {
    console.error('Error saving FHIR Observations:', error);
    throw error;
  }
};

// Get all patient FHIR resources
export const getPatientFHIRBundle = async (userId) => {
  try {
    // This would typically use a collection group query
    // For now, return patient resource only
    const patient = await getUserAsFHIRPatient(userId);

    return {
      resourceType: 'Bundle',
      id: 'bundle-' + userId,
      type: 'searchset',
      total: 1,
      entry: [{
        fullUrl: `urn:uuid:${patient.id}`,
        resource: patient
      }]
    };
  } catch (error) {
    console.error('Error getting patient FHIR bundle:', error);
    throw error;
  }
};