import { v4 as uuidv4 } from 'uuid';

// FHIR Service - Transform Firestore data to FHIR resources

// Map gender to FHIR codes
const genderMap = {
  'male': 'male',
  'female': 'female',
  'non-binary': 'other',
  'prefer-not-to-say': 'unknown'
};

// Map blood group to FHIR codes
const bloodGroupMap = {
  'A+': { code: 'Aplus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'A-': { code: 'Aminus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'B+': { code: 'Bplus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'B-': { code: 'Bminus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'O+': { code: 'Oplus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'O-': { code: 'Ominus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'AB+': { code: 'ABplus', system: 'http://hl7.org/fhir/sid/blood-group-rh' },
  'AB-': { code: 'ABminus', system: 'http://hl7.org/fhir/sid/blood-group-rh' }
};

// Convert user data to FHIR Patient Resource
export const userToFHIRPatient = (userData, profileData) => {
  const patient = {
    resourceType: 'Patient',
    id: userData.uid || uuidv4(),
    identifier: [
      {
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'MR',
            display: 'Medical Record Number'
          }],
          text: 'MRN'
        },
        value: userData.uid
      }
    ],
    name: [{
      use: 'official',
      text: profileData?.basic?.fullName || userData.name,
      family: profileData?.basic?.fullName?.split(' ').pop() || userData.name?.split(' ').pop(),
      given: profileData?.basic?.fullName?.split(' ').slice(0, -1) || userData.name?.split(' ').slice(0, -1)
    }],
    telecom: [
      {
        system: 'email',
        value: userData.email,
        use: 'home'
      },
      ...(profileData?.basic?.contactNumber ? [{
        system: 'phone',
        value: profileData.basic.contactNumber,
        use: 'mobile'
      }] : [])
    ],
    gender: genderMap[profileData?.basic?.gender] || 'unknown',
    birthDate: profileData?.basic?.dob || null,
    active: true,
    extension: []
  };

  // Add emergency contact
  if (profileData?.basic?.emergencyContact) {
    patient.contact = [{
      relationship: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
          code: 'N',
          display: 'Next-of-Kin'
        }]
      }],
      name: {
        text: profileData.basic.emergencyContact.name
      },
      telecom: [{
        system: 'phone',
        value: profileData.basic.emergencyContact.number
      }]
    }];
  }

  return patient;
};

// Convert height/weight to FHIR Observation Resources
export const vitalsToObservations = (profileData, patientId) => {
  const observations = [];

  // Height Observation
  if (profileData?.basic?.height?.value) {
    observations.push({
      resourceType: 'Observation',
      id: uuidv4(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8302-2',
          display: 'Body height'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: profileData.basic.height.value,
        unit: profileData.basic.height.unit === 'cm' ? 'cm' : 'in',
        system: 'http://unitsofmeasure.org',
        code: profileData.basic.height.unit === 'cm' ? 'cm' : '[in_i]'
      }
    });
  }

  // Weight Observation
  if (profileData?.basic?.weight?.value) {
    observations.push({
      resourceType: 'Observation',
      id: uuidv4(),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '29463-7',
          display: 'Body weight'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: profileData.basic.weight.value,
        unit: profileData.basic.weight.unit === 'kg' ? 'kg' : 'lb',
        system: 'http://unitsofmeasure.org',
        code: profileData.basic.weight.unit === 'kg' ? 'kg' : '[lb_av]'
      }
    });
  }

  // Blood Group Observation
  if (profileData?.basic?.bloodGroup && bloodGroupMap[profileData.basic.bloodGroup]) {
    observations.push({
      resourceType: 'Observation',
      id: uuidv4(),
      status: 'final',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '882-1',
          display: 'ABO + Rh group [Type] in Blood'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: new Date().toISOString(),
      valueCodeableConcept: {
        coding: [{
          system: bloodGroupMap[profileData.basic.bloodGroup].system,
          code: bloodGroupMap[profileData.basic.bloodGroup].code,
          display: profileData.basic.bloodGroup
        }]
      }
    });
  }

  return observations;
};

// Convert chronic conditions to FHIR Condition Resources
export const conditionsToFHIRConditions = (profileData, patientId) => {
  const conditions = [];

  if (profileData?.medical?.chronicConditions?.length > 0) {
    profileData.medical.chronicConditions.forEach((condition, index) => {
      if (condition && condition.trim()) {
        conditions.push({
          resourceType: 'Condition',
          id: uuidv4(),
          clinicalStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
              display: 'Active'
            }]
          },
          verificationStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: 'confirmed',
              display: 'Confirmed'
            }]
          },
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'problem-list-item',
              display: 'Problem List Item'
            }]
          }],
          code: {
            text: condition.trim()
          },
          subject: {
            reference: `Patient/${patientId}`
          },
          recordedDate: new Date().toISOString()
        });
      }
    });
  }

  // Add custom chronic condition if exists
  if (profileData?.medical?.customChronicCondition?.trim()) {
    conditions.push({
      resourceType: 'Condition',
      id: uuidv4(),
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: 'Problem List Item'
        }]
      }],
      code: {
        text: profileData.medical.customChronicCondition.trim()
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      recordedDate: new Date().toISOString()
    });
  }

  return conditions;
};

// Convert allergies to FHIR AllergyIntolerance Resources
export const allergiesToFHIRAllergyIntolerances = (profileData, patientId) => {
  const allergies = [];

  if (profileData?.medical?.allergies?.length > 0) {
    profileData.medical.allergies.forEach((allergy, index) => {
      if (allergy && allergy.trim()) {
        allergies.push({
          resourceType: 'AllergyIntolerance',
          id: uuidv4(),
          clinicalStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
              code: 'active',
              display: 'Active'
            }]
          },
          verificationStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
              code: 'confirmed',
              display: 'Confirmed'
            }]
          },
          type: 'allergy',
          category: ['medication'],
          criticality: 'unknown',
          code: {
            text: allergy.trim()
          },
          patient: {
            reference: `Patient/${patientId}`
          },
          recordedDate: new Date().toISOString()
        });
      }
    });
  }

  // Add custom allergy if exists
  if (profileData?.medical?.customAllergy?.trim()) {
    allergies.push({
      resourceType: 'AllergyIntolerance',
      id: uuidv4(),
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: 'active',
          display: 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      type: 'allergy',
      category: ['medication'],
      criticality: 'unknown',
      code: {
        text: profileData.medical.customAllergy.trim()
      },
      patient: {
        reference: `Patient/${patientId}`
      },
      recordedDate: new Date().toISOString()
    });
  }

  return allergies;
};

// Convert medical record to FHIR Encounter
export const recordToFHIREncounter = (record, doctorData) => {
  return {
    resourceType: 'Encounter',
    id: record.id || uuidv4(),
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    subject: {
      reference: `Patient/${record.patientId}`
    },
    participant: [{
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'PPRF',
          display: 'primary performer'
        }]
      }],
      individual: {
        reference: `Practitioner/${record.doctorId}`,
        display: doctorData?.name || record.doctorName
      }
    }],
    period: {
      start: record.visitDate ? new Date(record.visitDate).toISOString() : new Date().toISOString()
    },
    reasonCode: record.symptoms?.map(symptom => ({
      text: symptom
    })) || [],
    diagnosis: record.diagnosis ? [{
      condition: {
        reference: `Condition/${uuidv4()}`,
        display: record.diagnosis
      },
      use: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role',
          code: 'DD',
          display: 'Discharge diagnosis'
        }]
      }]
    }] : []
  };
};

// Convert doctor to FHIR Practitioner
export const doctorToFHIRPractitioner = (doctorData) => {
  return {
    resourceType: 'Practitioner',
    id: doctorData.uid || uuidv4(),
    identifier: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'MD',
          display: 'Medical License number'
        }],
        text: 'Doctor ID'
      },
      value: doctorData.doctorId
    }],
    name: [{
      use: 'official',
      text: doctorData.name
    }],
    active: true
  };
};

// Create FHIR Bundle from multiple resources
export const createFHIRBundle = (resources, type = 'collection') => {
  return {
    resourceType: 'Bundle',
    id: uuidv4(),
    type: type,
    entry: resources.map(resource => ({
      fullUrl: `urn:uuid:${resource.id}`,
      resource: resource
    }))
  };
};

// Validate FHIR resource (basic validation)
export const validateFHIRResource = (resource) => {
  if (!resource.resourceType) {
    throw new Error('Resource missing resourceType');
  }
  if (!resource.id) {
    throw new Error('Resource missing id');
  }
  return true;
};

// Export all FHIR data for a patient
export const exportPatientFHIRData = async (patientId, userData, profileData, medicalRecords) => {
  const resources = [];

  // Add Patient resource
  const patient = userToFHIRPatient(userData, profileData);
  resources.push(patient);

  // Add observations
  const observations = vitalsToObservations(profileData, patientId);
  resources.push(...observations);

  // Add conditions
  const conditions = conditionsToFHIRConditions(profileData, patientId);
  resources.push(...conditions);

  // Add allergies
  const allergies = allergiesToFHIRAllergyIntolerances(profileData, patientId);
  resources.push(...allergies);

  // Add encounters from medical records
  const encounters = medicalRecords.map(record =>
    recordToFHIREncounter(record, { name: record.doctorName })
  );
  resources.push(...encounters);

  // Create and return bundle
  return createFHIRBundle(resources, 'searchset');
};