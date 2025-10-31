/**
 * Utility to seed organizations collection with sample data
 * Run this in development to populate organizations
 */

import { createOrganization } from '../services/organizationService';

const sampleOrganizations = [
  {
    name: 'City General Hospital',
    type: 'hospital',
    address: {
      line: '123 Medical Center Drive',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 123-4567',
      email: 'info@citygeneral.com',
      website: 'https://citygeneral.com'
    },
    identifiers: {
      npi: '1234567890',
      taxId: '12-3456789',
      licenseNumber: 'NY-HOSP-001'
    },
    capabilities: ['emergency', 'surgery', 'pediatrics', 'cardiology', 'radiology'],
    specialties: ['Emergency Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Radiology'],
    fhirEndpoint: 'https://api.citygeneral.com/fhir/r4'
  },
  {
    name: 'MediCare Clinic',
    type: 'clinic',
    address: {
      line: '456 Health Street',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 234-5678',
      email: 'contact@medicare-clinic.com',
      website: 'https://medicare-clinic.com'
    },
    identifiers: {
      npi: '2345678901',
      taxId: '23-4567890',
      licenseNumber: 'CA-CLIN-002'
    },
    capabilities: ['primary_care', 'pediatrics', 'mental_health'],
    specialties: ['Family Medicine', 'Pediatrics', 'Psychiatry'],
    fhirEndpoint: 'https://api.medicare-clinic.com/fhir/r4'
  },
  {
    name: 'Diagnostics Lab Pro',
    type: 'lab',
    address: {
      line: '789 Laboratory Avenue',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60007',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 345-6789',
      email: 'tests@diagnosticslab.com',
      website: 'https://diagnosticslab.com'
    },
    identifiers: {
      npi: '3456789012',
      taxId: '34-5678901',
      licenseNumber: 'IL-LAB-003'
    },
    capabilities: ['laboratory', 'pathology', 'genetics'],
    specialties: ['Clinical Pathology', 'Molecular Genetics', 'Hematology'],
    fhirEndpoint: 'https://api.diagnosticslab.com/fhir/r4'
  },
  {
    name: 'Community Pharmacy Plus',
    type: 'pharmacy',
    address: {
      line: '321 Pharmacy Lane',
      city: 'Houston',
      state: 'TX',
      postalCode: '77001',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 456-7890',
      email: 'orders@pharmacyplus.com',
      website: 'https://pharmacyplus.com'
    },
    identifiers: {
      npi: '4567890123',
      taxId: '45-6789012',
      licenseNumber: 'TX-PHARM-004'
    },
    capabilities: ['pharmacy', 'compounding', 'vaccinations'],
    specialties: ['Retail Pharmacy', 'Compounding', 'Immunization'],
    fhirEndpoint: 'https://api.pharmacyplus.com/fhir/r4'
  },
  {
    name: 'Children\'s Medical Center',
    type: 'hospital',
    address: {
      line: '555 Pediatric Park',
      city: 'Boston',
      state: 'MA',
      postalCode: '02101',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 567-8901',
      email: 'info@childrensmedical.org',
      website: 'https://childrensmedical.org'
    },
    identifiers: {
      npi: '5678901234',
      taxId: '56-7890123',
      licenseNumber: 'MA-HOSP-005'
    },
    capabilities: ['pediatrics', 'neonatology', 'pediatric_surgery', 'pediatric_cardiology'],
    specialties: ['Pediatrics', 'Neonatology', 'Pediatric Surgery', 'Pediatric Cardiology'],
    fhirEndpoint: 'https://api.childrensmedical.org/fhir/r4'
  },
  {
    name: 'Heart Care Institute',
    type: 'clinic',
    address: {
      line: '999 Cardiology Court',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 678-9012',
      email: 'appointments@heartcare.com',
      website: 'https://heartcare.com'
    },
    identifiers: {
      npi: '6789012345',
      taxId: '67-8901234',
      licenseNumber: 'FL-CLIN-006'
    },
    capabilities: ['cardiology', 'cardiac_surgery', 'electrophysiology'],
    specialties: ['Cardiology', 'Cardiac Surgery', 'Electrophysiology'],
    fhirEndpoint: 'https://api.heartcare.com/fhir/r4'
  },
  {
    name: 'Mind & Mood Wellness Center',
    type: 'clinic',
    address: {
      line: '777 Wellness Way',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 789-0123',
      email: 'help@mindandmood.com',
      website: 'https://mindandmood.com'
    },
    identifiers: {
      npi: '7890123456',
      taxId: '78-9012345',
      licenseNumber: 'WA-CLIN-007'
    },
    capabilities: ['mental_health', 'psychology', 'psychiatry', 'counseling'],
    specialties: ['Psychiatry', 'Psychology', 'Counseling', 'Neurology'],
    fhirEndpoint: 'https://api.mindandmood.com/fhir/r4'
  },
  {
    name: 'QuickCare Urgent Care',
    type: 'clinic',
    address: {
      line: '111 Emergency Lane',
      city: 'Phoenix',
      state: 'AZ',
      postalCode: '85001',
      country: 'USA'
    },
    contact: {
      phone: '+1 (555) 890-1234',
      email: 'walkin@quickcare.com',
      website: 'https://quickcare.com'
    },
    identifiers: {
      npi: '8901234567',
      taxId: '89-0123456',
      licenseNumber: 'AZ-CLIN-008'
    },
    capabilities: ['urgent_care', 'minor_emergency', 'occupational_health'],
    specialties: ['Emergency Medicine', 'Family Medicine', 'Occupational Medicine'],
    fhirEndpoint: 'https://api.quickcare.com/fhir/r4'
  }
];

/**
 * Seed all sample organizations
 * @returns {Promise<void>}
 */
export async function seedOrganizations() {
  console.log('🏥 Starting to seed organizations...');

  for (const org of sampleOrganizations) {
    try {
      const result = await createOrganization(org);
      if (result.success) {
        console.log(`✅ Created organization: ${org.name}`);
      } else {
        console.error(`❌ Failed to create ${org.name}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error creating ${org.name}:`, error);
    }
  }

  console.log('🎉 Organization seeding complete!');
}

/**
 * Create a single organization
 * @param {Object} organization - Organization data
 * @returns {Promise<Object>} - Result
 */
export async function createSingleOrganization(organization) {
  try {
    const result = await createOrganization(organization);
    if (result.success) {
      console.log(`✅ Created organization: ${organization.name}`);
      return result;
    } else {
      console.error(`❌ Failed to create ${organization.name}:`, result.error);
      return result;
    }
  } catch (error) {
    console.error(`❌ Error creating ${organization.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Export for easy access in console
if (typeof window !== 'undefined') {
  window.seedOrganizations = seedOrganizations;
  window.createSingleOrganization = createSingleOrganization;
}

export default seedOrganizations;