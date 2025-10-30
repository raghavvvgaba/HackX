import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  conditionsToFHIRConditions,
  allergiesToFHIRAllergyIntolerances,
  recordToFHIREncounter,
  validateFHIRResource,
  createFHIRBundle
} from './fhirService';

// Save medical record as FHIR Encounter
export const saveMedicalRecordAsFHIREncounter = async (recordData, doctorData) => {
  try {
    // Transform to FHIR Encounter
    const encounter = recordToFHIREncounter(recordData, doctorData);
    validateFHIRResource(encounter);

    // Save to FHIR collection
    const encounterRef = doc(db, 'fhir', 'encounters', encounter.id);
    await setDoc(encounterRef, encounter);

    // Also save in old collection for backward compatibility
    const oldRecordRef = doc(db, 'medicalRecords', recordData.id);
    await setDoc(oldRecordRef, recordData);

    return encounter;
  } catch (error) {
    console.error('Error saving FHIR Encounter:', error);
    throw error;
  }
};

// Get patient medical records as FHIR Encounters
export const getPatientFHIREncounters = async (patientId) => {
  try {
    // Query FHIR encounters collection
    const encountersRef = collection(db, 'fhir', 'encounters');
    const q = query(
      encountersRef,
      where('subject.reference', '==', `Patient/${patientId}`),
      orderBy('period.start', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const encounters = [];
    querySnapshot.forEach(doc => {
      encounters.push(doc.data());
    });

    return encounters;
  } catch (error) {
    console.error('Error getting FHIR Encounters:', error);
    throw error;
  }
};

// Save patient conditions
export const savePatientConditions = async (patientId, profileData) => {
  try {
    const conditions = conditionsToFHIRConditions(profileData, patientId);
    const batch = [];

    conditions.forEach(condition => {
      validateFHIRResource(condition);
      const conditionRef = doc(db, 'fhir', 'patients', patientId, condition.id);
      batch.push(setDoc(conditionRef, condition));
    });

    await Promise.all(batch);
    return conditions;
  } catch (error) {
    console.error('Error saving FHIR Conditions:', error);
    throw error;
  }
};

// Save patient allergies
export const savePatientAllergies = async (patientId, profileData) => {
  try {
    const allergies = allergiesToFHIRAllergyIntolerances(profileData, patientId);
    const batch = [];

    allergies.forEach(allergy => {
      validateFHIRResource(allergy);
      const allergyRef = doc(db, 'fhir', 'patients', patientId, allergy.id);
      batch.push(setDoc(allergyRef, allergy));
    });

    await Promise.all(batch);
    return allergies;
  } catch (error) {
    console.error('Error saving FHIR Allergies:', error);
    throw error;
  }
};

// Get complete patient medical record as FHIR Bundle
export const getPatientCompleteFHIRRecord = async (patientId) => {
  try {
    const resources = [];

    // Get patient (will be called separately)
    // Get encounters
    const encounters = await getPatientFHIREncounters(patientId);
    resources.push(...encounters);

    // Get conditions and allergies (will be called separately)
    // For now, return what we have

    return createFHIRBundle(resources, 'searchset');
  } catch (error) {
    console.error('Error getting complete FHIR record:', error);
    throw error;
  }
};

// Export patient data in FHIR format
export const exportPatientFHIRData = async (patientId) => {
  try {
    // This would aggregate all FHIR resources for a patient
    const bundle = await getPatientCompleteFHIRRecord(patientId);

    // Convert to JSON for download
    const dataStr = JSON.stringify(bundle, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `fhir-export-${patientId}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    return bundle;
  } catch (error) {
    console.error('Error exporting FHIR data:', error);
    throw error;
  }
};