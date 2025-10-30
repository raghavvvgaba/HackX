import { doc, getDoc, collection, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  userToFHIRPatient,
  vitalsToObservations,
  conditionsToFHIRConditions,
  allergiesToFHIRAllergyIntolerances,
  doctorToFHIRPractitioner,
  recordToFHIREncounter
} from '../services/fhirService';

// Migrate all existing data to FHIR format
export const migrateAllToFHIR = async () => {
  console.log('Starting FHIR migration...');

  try {
    // 1. Migrate users and profiles to FHIR Patients
    await migrateUsersToPatients();

    // 2. Migrate doctors to FHIR Practitioners
    await migrateDoctorsToPractitioners();

    // 3. Migrate medical records to FHIR Encounters
    await migrateMedicalRecordsToEncounters();

    console.log('FHIR migration completed successfully!');
    return true;
  } catch (error) {
    console.error('FHIR migration failed:', error);
    throw error;
  }
};

// Migrate users to FHIR Patients
const migrateUsersToPatients = async () => {
  console.log('Migrating users to FHIR Patients...');

  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  const batch = writeBatch(db);
  let count = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();

    if (userData.role === 'user') {
      // Get user profile
      const profileRef = doc(db, 'userProfile', userDoc.id);
      const profileDoc = await getDoc(profileRef);
      const profileData = profileDoc.exists() ? profileDoc.data() : {};

      // Convert to FHIR Patient
      const fhirPatient = userToFHIRPatient(userData, profileData);

      // Save to FHIR collection
      const patientRef = doc(db, 'fhir', 'patients', userDoc.id, 'Patient');
      batch.set(patientRef, fhirPatient);

      // Save observations
      const observations = vitalsToObservations(profileData, userDoc.id);
      observations.forEach(obs => {
        const obsRef = doc(db, 'fhir', 'patients', userDoc.id, obs.id);
        batch.set(obsRef, obs);
      });

      // Save conditions
      const conditions = conditionsToFHIRConditions(profileData, userDoc.id);
      conditions.forEach(condition => {
        const conditionRef = doc(db, 'fhir', 'patients', userDoc.id, condition.id);
        batch.set(conditionRef, condition);
      });

      // Save allergies
      const allergies = allergiesToFHIRAllergyIntolerances(profileData, userDoc.id);
      allergies.forEach(allergy => {
        const allergyRef = doc(db, 'fhir', 'patients', userDoc.id, allergy.id);
        batch.set(allergyRef, allergy);
      });

      count++;

      // Commit batch every 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`Migrated ${count} users to FHIR Patients`);
      }
    }
  }

  // Commit remaining operations
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully migrated ${count} users to FHIR Patients`);
};

// Migrate doctors to FHIR Practitioners
const migrateDoctorsToPractitioners = async () => {
  console.log('Migrating doctors to FHIR Practitioners...');

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'doctor'));
  const doctorsSnapshot = await getDocs(q);

  const batch = writeBatch(db);
  let count = 0;

  doctorsSnapshot.forEach(doc => {
    const doctorData = doc.data();
    const fhirPractitioner = doctorToFHIRPractitioner(doctorData);

    const practitionerRef = doc(db, 'fhir', 'practitioners', doctorData.uid);
    batch.set(practitionerRef, fhirPractitioner);

    count++;
  });

  await batch.commit();
  console.log(`Successfully migrated ${count} doctors to FHIR Practitioners`);
};

// Migrate medical records to FHIR Encounters
const migrateMedicalRecordsToEncounters = async () => {
  console.log('Migrating medical records to FHIR Encounters...');

  const recordsRef = collection(db, 'medicalRecords');
  const recordsSnapshot = await getDocs(recordsRef);

  const batch = writeBatch(db);
  let count = 0;

  for (const recordDoc of recordsSnapshot.docs) {
    const recordData = recordDoc.data();

    // Get doctor data
    const doctorRef = doc(db, 'users', recordData.doctorId);
    const doctorDoc = await getDoc(doctorRef);
    const doctorData = doctorDoc.exists() ? doctorDoc.data() : { name: recordData.doctorName };

    // Convert to FHIR Encounter
    const fhirEncounter = recordToFHIREncounter(recordData, doctorData);

    // Save to FHIR collection
    const encounterRef = doc(db, 'fhir', 'encounters', fhirEncounter.id);
    batch.set(encounterRef, fhirEncounter);

    count++;

    // Commit batch every 500 operations
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} medical records to FHIR Encounters`);
    }
  }

  // Commit remaining operations
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully migrated ${count} medical records to FHIR Encounters`);
};

// Verify FHIR migration
export const verifyFHIRMigration = async () => {
  console.log('Verifying FHIR migration...');

  try {
    // Check patients
    const patientsRef = collection(db, 'fhir', 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    console.log(`Found ${patientsSnapshot.size} patient documents in FHIR format`);

    // Check practitioners
    const practitionersRef = collection(db, 'fhir', 'practitioners');
    const practitionersSnapshot = await getDocs(practitionersRef);
    console.log(`Found ${practitionersSnapshot.size} practitioners in FHIR format`);

    // Check encounters
    const encountersRef = collection(db, 'fhir', 'encounters');
    const encountersSnapshot = await getDocs(encountersRef);
    console.log(`Found ${encountersSnapshot.size} encounters in FHIR format`);

    return {
      patients: patientsSnapshot.size,
      practitioners: practitionersSnapshot.size,
      encounters: encountersSnapshot.size
    };
  } catch (error) {
    console.error('Error verifying FHIR migration:', error);
    throw error;
  }
};

// Run migration button handler
export const runMigration = async () => {
  if (window.confirm('This will migrate all existing data to FHIR format. Continue?')) {
    try {
      await migrateAllToFHIR();
      const stats = await verifyFHIRMigration();
      alert(`Migration successful!\n\n${JSON.stringify(stats, null, 2)}`);
    } catch (error) {
      alert('Migration failed. Check console for details.');
    }
  }
};