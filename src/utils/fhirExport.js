import {
  getDocs,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../config/firebase";
import { createFHIRBundle } from "../services/fhirService";

/**
 * Export all FHIR data for a patient as a downloadable JSON file
 * @param {string} patientId - The patient's user ID
 * @param {boolean} includeEncounters - Whether to include medical encounters
 * @returns {Promise<Object>} - Success/error result
 */
export async function exportPatientFHIRData(patientId, includeEncounters = true) {
  try {
    const resources = [];

    // 1. Get Patient resource
    const patientRef = doc(db, "fhir", "patients", patientId, "Patient");
    const patientDoc = await getDoc(patientRef);
    if (patientDoc.exists()) {
      resources.push(patientDoc.data());
    }

    // 2. Get all Observations for the patient
    const observationsQuery = query(
      collection(db, "fhir", "patients", patientId),
      where("resourceType", "==", "Observation"),
      orderBy("effectiveDateTime", "desc")
    );
    const observationsSnapshot = await getDocs(observationsQuery);
    observationsSnapshot.forEach(doc => {
      resources.push(doc.data());
    });

    // 3. Get all Conditions for the patient
    const conditionsQuery = query(
      collection(db, "fhir", "patients", patientId),
      where("resourceType", "==", "Condition"),
      orderBy("recordedDate", "desc")
    );
    const conditionsSnapshot = await getDocs(conditionsQuery);
    conditionsSnapshot.forEach(doc => {
      resources.push(doc.data());
    });

    // 4. Get all Allergies for the patient
    const allergiesQuery = query(
      collection(db, "fhir", "patients", patientId),
      where("resourceType", "==", "AllergyIntolerance"),
      orderBy("recordedDate", "desc")
    );
    const allergiesSnapshot = await getDocs(allergiesQuery);
    allergiesSnapshot.forEach(doc => {
      resources.push(doc.data());
    });

    // 5. Get Encounters if requested
    if (includeEncounters) {
      const encountersQuery = query(
        collection(db, "fhir", "encounters"),
        where("subject.reference", "==", `Patient/${patientId}`),
        orderBy("period.start", "desc")
      );
      const encountersSnapshot = await getDocs(encountersQuery);
      encountersSnapshot.forEach(doc => {
        resources.push(doc.data());
      });
    }

    // 6. Create FHIR Bundle
    const bundle = createFHIRBundle(resources, "collection");

    // 7. Download as JSON file
    const dataStr = JSON.stringify(bundle, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `fhir-export-${patientId}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    return {
      success: true,
      message: `Exported ${resources.length} FHIR resources`,
      resourceCount: resources.length,
      bundle: bundle
    };

  } catch (error) {
    console.error("Error exporting FHIR data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get FHIR data as JSON (without downloading)
 * @param {string} patientId - The patient's user ID
 * @param {boolean} includeEncounters - Whether to include medical encounters
 * @returns {Promise<Object>} - FHIR Bundle JSON
 */
export async function getPatientFHIRBundle(patientId, includeEncounters = true) {
  try {
    const resources = [];

    // Get Patient resource
    const patientRef = doc(db, "fhir", "patients", patientId, "Patient");
    const patientDoc = await getDoc(patientRef);
    if (patientDoc.exists()) {
      resources.push(patientDoc.data());
    }

    // Get all other resources (Observations, Conditions, Allergies)
    const allResourcesQuery = query(
      collection(db, "fhir", "patients", patientId)
    );
    const allResourcesSnapshot = await getDocs(allResourcesQuery);
    allResourcesSnapshot.forEach(doc => {
      const resource = doc.data();
      if (resource.resourceType !== "Patient") {
        resources.push(resource);
      }
    });

    // Get Encounters if requested
    if (includeEncounters) {
      const encountersQuery = query(
        collection(db, "fhir", "encounters"),
        where("subject.reference", "==", `Patient/${patientId}`),
        orderBy("period.start", "desc")
      );
      const encountersSnapshot = await getDocs(encountersQuery);
      encountersSnapshot.forEach(doc => {
        resources.push(doc.data());
      });
    }

    // Create and return FHIR Bundle
    return createFHIRBundle(resources, "searchset");

  } catch (error) {
    console.error("Error getting FHIR bundle:", error);
    throw error;
  }
}

/**
 * Export all FHIR resources for demonstration
 * @returns {Promise<Object>} - Success/error result with all FHIR data
 */
export async function exportAllFHIRData() {
  try {
    const allBundles = [];

    // Get all patients
    const patientsQuery = query(collection(db, "fhir", "patients"));
    const patientsSnapshot = await getDocs(patientsQuery);

    for (const patientDoc of patientsSnapshot.docs) {
      const patientId = patientDoc.id;
      const bundle = await getPatientFHIRBundle(patientId, true);
      allBundles.push(bundle);
    }

    // Create master bundle
    const masterBundle = {
      resourceType: "Bundle",
      id: "master-export-" + Date.now(),
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: allBundles.flatMap(bundle => bundle.entry || [])
    };

    // Download as JSON
    const dataStr = JSON.stringify(masterBundle, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `fhir-master-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    return {
      success: true,
      message: `Exported ${allBundles.length} patients' FHIR data`,
      totalResources: masterBundle.entry?.length || 0
    };

  } catch (error) {
    console.error("Error exporting all FHIR data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate FHIR resources compliance
 * @param {string} patientId - The patient's user ID
 * @returns {Promise<Object>} - Validation results
 */
export async function validatePatientFHIRData(patientId) {
  try {
    const results = {
      valid: true,
      resources: {
        Patient: false,
        Observations: 0,
        Conditions: 0,
        Allergies: 0,
        Encounters: 0
      },
      errors: []
    };

    // Check for Patient resource
    const patientRef = doc(db, "fhir", "patients", patientId, "Patient");
    const patientDoc = await getDoc(patientRef);
    if (patientDoc.exists()) {
      results.resources.Patient = true;
    } else {
      results.errors.push("Patient resource not found");
      results.valid = false;
    }

    // Count other resources
    const allResourcesQuery = query(
      collection(db, "fhir", "patients", patientId)
    );
    const allResourcesSnapshot = await getDocs(allResourcesQuery);
    allResourcesSnapshot.forEach(doc => {
      const resource = doc.data();
      switch (resource.resourceType) {
        case "Observation":
          results.resources.Observations++;
          break;
        case "Condition":
          results.resources.Conditions++;
          break;
        case "AllergyIntolerance":
          results.resources.Allergies++;
          break;
      }
    });

    // Count Encounters
    const encountersQuery = query(
      collection(db, "fhir", "encounters"),
      where("subject.reference", "==", `Patient/${patientId}`)
    );
    const encountersSnapshot = await getDocs(encountersQuery);
    results.resources.Encounters = encountersSnapshot.size;

    return {
      success: true,
      data: results
    };

  } catch (error) {
    console.error("Error validating FHIR data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}