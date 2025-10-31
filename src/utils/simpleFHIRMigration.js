/**
 * Simple FHIR Migration Script
 * Bypasses import issues by using global Firebase
 */

import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

// Simple FHIR resource creators without complex dependencies
const createSimplePatient = (userId, profileData) => ({
  resourceType: 'Patient',
  id: userId,
  identifier: [
    {
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical Record Number' }] },
      value: userId
    }
  ],
  active: true,
  name: [
    {
      family: profileData.basic?.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
      given: [profileData.basic?.fullName?.split(' ')[0] || 'Unknown']
    }
  ],
  gender: profileData.basic?.gender === 'male' ? 'male' :
          profileData.basic?.gender === 'female' ? 'female' : 'unknown',
  birthDate: profileData.basic?.dob || '1990-01-01'
});

const createSimplePractitioner = (doctorData) => ({
  resourceType: 'Practitioner',
  id: doctorData.doctorId || `PR-${uuidv4()}`,
  identifier: [
    {
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MD', display: 'Medical License' }] },
      value: doctorData.doctorIdCode || Math.floor(1000000000 + Math.random() * 9000000000).toString()
    }
  ],
  active: true,
  name: [
    {
      family: doctorData.name?.split(' ').slice(1).join(' ') || 'Unknown',
      given: [doctorData.name?.split(' ')[0] || 'Unknown'],
      prefix: ['Dr.']
    }
  ]
});

const createSimpleEncounter = (recordData) => ({
  resourceType: 'Encounter',
  id: recordData.id || `ENC-${uuidv4()}`,
  status: 'finished',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'ambulatory'
  },
  subject: { reference: `Patient/${recordData.patientId}` },
  participant: [
    {
      individual: { reference: `Practitioner/${recordData.doctorId}` },
      type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/participant-role', code: 'att', display: 'attender' }] }]
    }
  ],
  period: {
    start: recordData.visitDate || new Date().toISOString().split('T')[0],
    end: recordData.visitDate || new Date().toISOString().split('T')[0]
  },
  reasonCode: recordData.diagnosis ? [{
    coding: [{
      system: 'http://snomed.info/sct',
      code: '404684003',
      display: recordData.diagnosis
    }]
  }] : []
});

/**
 * Run simple migration without complex imports
 */
export async function runSimpleFHIRMigration() {
  console.log('🚀 Starting Simple FHIR Migration...');

  try {
    // Use dynamic import for Firebase functions
    const firebase = await import('firebase/firestore');
    const { doc, collection, getDocs, setDoc, serverTimestamp } = firebase;

    if (!setDoc || typeof setDoc !== 'function') {
      throw new Error('Firebase setDoc not available');
    }

    console.log('✅ Firebase imports successful');

    // Migrate doctors to practitioners
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let doctorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.role === 'doctor') {
        const practitioner = createSimplePractitioner(userData);
        const practitionerRef = doc(db, 'fhir', 'practitioners', practitioner.id);
        await setDoc(practitionerRef, { ...practitioner, createdAt: serverTimestamp() });
        doctorCount++;
      }
    }

    console.log(`✅ Migrated ${doctorCount} doctors to FHIR Practitioners`);

    // Migrate user profiles to patients
    const profilesSnapshot = await getDocs(collection(db, 'userProfile'));
    let patientCount = 0;

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const patient = createSimplePatient(profileDoc.id, profileData);
      const patientRef = doc(db, 'fhir', 'patients', profileDoc.id, 'Patient', profileDoc.id);
      await setDoc(patientRef, { ...patient, createdAt: serverTimestamp() });
      patientCount++;
    }

    console.log(`✅ Migrated ${patientCount} users to FHIR Patients`);

    // Migrate medical records to encounters
    const recordsSnapshot = await getDocs(collection(db, 'medicalRecords'));
    let encounterCount = 0;

    for (const recordDoc of recordsSnapshot.docs) {
      const recordData = recordDoc.data();
      const encounter = createSimpleEncounter({ ...recordData, id: recordDoc.id });
      const encounterRef = doc(db, 'fhir', 'encounters', encounter.id);
      await setDoc(encounterRef, { ...encounter, createdAt: serverTimestamp() });
      encounterCount++;
    }

    console.log(`✅ Migrated ${encounterCount} medical records to FHIR Encounters`);

    console.log('🎉 Simple FHIR Migration completed successfully!');

    return {
      success: true,
      message: `Migration complete: ${doctorCount} practitioners, ${patientCount} patients, ${encounterCount} encounters`
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Full error details:', error.message, error.stack);
    return { success: false, error: error.message };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.runSimpleFHIRMigration = runSimpleFHIRMigration;
  console.log('🔧 Simple FHIR Migration loaded!');
  console.log('Run: runSimpleFHIRMigration()');
}

export default runSimpleFHIRMigration;