/**
 * FHIR Organization Resource Transformation Service
 * Converts Firestore organization data to FHIR Organization resources
 */

/**
 * Transform Firestore organization to FHIR Organization resource
 * @param {Object} orgData - Organization data from Firestore
 * @returns {Object} - FHIR Organization resource
 */
export function organizationToFHIROrganization(orgData) {
  const fhirOrg = {
    resourceType: 'Organization',
    id: orgData.id,
    active: orgData.active !== false,
    name: orgData.name,

    // Organization type (hospital, clinic, etc.)
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: getOrganizationTypeCode(orgData.type),
            display: orgData.type.charAt(0).toUpperCase() + orgData.type.slice(1)
          }
        ],
        text: orgData.type.charAt(0).toUpperCase() + orgData.type.slice(1)
      }
    ],

    // Contact information
    telecom: buildTelecomArray(orgData.contact),

    // Address
    address: [
      {
        use: 'work',
        type: 'both',
        line: orgData.address.line ? [orgData.address.line] : [],
        city: orgData.address.city,
        state: orgData.address.state,
        postalCode: orgData.address.postalCode,
        country: orgData.address.country
      }
    ],

    // Identifiers (NPI, tax ID, etc.)
    identifier: buildIdentifierArray(orgData.identifiers),

    // Contact points
    contact: orgData.contact.email ? [
      {
        purpose: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/contactentity-type',
              code: 'ADMIN',
              display: 'Administrative'
            }
          ]
        },
        telecom: [
          {
            system: 'email',
            value: orgData.contact.email,
            use: 'work'
          }
        ]
      }
    ] : []
  });

  return fhirOrg;
}

/**
 * Get FHIR organization type code
 * @param {string} orgType - Organization type
 * @returns {string} - FHIR code
 */
function getOrganizationTypeCode(orgType) {
  const typeMapping = {
    hospital: 'prov',
    clinic: 'prov',
    lab: 'dept',
    pharmacy: 'prov',
    insurance: 'pay',
    government: 'govt'
  };
  return typeMapping[orgType] || 'prov';
}

/**
 * Build telecom array from contact information
 * @param {Object} contact - Contact object
 * @returns {Array} - Telecom array
 */
function buildTelecomArray(contact) {
  const telecom = [];

  if (contact.phone) {
    telecom.push({
      system: 'phone',
      value: contact.phone,
      use: 'work'
    });
  }

  if (contact.email) {
    telecom.push({
      system: 'email',
      value: contact.email,
      use: 'work'
    });
  }

  if (contact.website) {
    telecom.push({
      system: 'url',
      value: contact.website,
      use: 'work'
    });
  }

  return telecom;
}

/**
 * Build identifier array from organization identifiers
 * @param {Object} identifiers - Identifiers object
 * @returns {Array} - Identifier array
 */
function buildIdentifierArray(identifiers) {
  const identifierArray = [];

  if (identifiers.npi) {
    identifierArray.push({
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'NPI',
            display: 'National Provider Identifier'
          }
        ],
        text: 'National Provider Identifier'
      },
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: identifiers.npi
    });
  }

  if (identifiers.taxId) {
    identifierArray.push({
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'TAX',
            display: 'Tax ID number'
          }
        ],
        text: 'Tax ID number'
      },
      value: identifiers.taxId
    });
  }

  if (identifiers.licenseNumber) {
    identifierArray.push({
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'MD',
            display: 'Medical License number'
          }
        ],
        text: 'Medical License number'
      },
      value: identifiers.licenseNumber
    });
  }

  return identifierArray;
}

/**
 * Create FHIR Organization resource with HealthcareService
 * @param {Object} orgData - Organization data
 * @returns {Object} - Bundle with Organization and HealthcareService
 */
export function createOrganizationWithServices(orgData) {
  const organization = organizationToFHIROrganization(orgData);

  // Create HealthcareService resources for each capability
  const healthcareServices = orgData.capabilities.map(capability => ({
    resourceType: 'HealthcareService',
    id: `${orgData.id}-${capability}`,
    providedBy: {
      reference: `Organization/${orgData.id}`,
      display: orgData.name
    },
    type: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: getServiceCapabilityCode(capability),
            display: capability.charAt(0).toUpperCase() + capability.slice(1)
          }
        ]
      }
    ],
    active: orgData.active,
    specialty: orgData.specialties.map(specialty => ({
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: getSpecialtyCode(specialty),
          display: specialty
        }
      ]
    }))
  }));

  return {
    resourceType: 'Bundle',
    id: `bundle-${orgData.id}`,
    type: 'collection',
    entry: [
      {
        fullUrl: `urn:uuid:${organization.id}`,
        resource: organization
      },
      ...healthcareServices.map(service => ({
        fullUrl: `urn:uuid:${service.id}`,
        resource: service
      }))
    ]
  };
}

/**
 * Get SNOMED CT code for service capability
 * @param {string} capability - Service capability
 * @returns {string} - SNOMED CT code
 */
function getServiceCapabilityCode(capability) {
  const capabilityCodes = {
    emergency: '310000008',
    surgery: '394910002',
    pediatrics: '408444004',
    cardiology: '394579002',
    radiology: '394914008',
    laboratory: '394580004',
    pharmacy: '394802001',
    mental_health: '394587001',
    obstetrics: '394577000',
    oncology: '394578006'
  };
  return capabilityCodes[capability] || '394807001'; // General medical service
}

/**
 * Get SNOMED CT code for medical specialty
 * @param {string} specialty - Medical specialty
 * @returns {string} - SNOMED CT code
 */
function getSpecialtyCode(specialty) {
  const specialtyCodes = {
    'Emergency Medicine': '394820001',
    'Surgery': '394910002',
    'Pediatrics': '408444004',
    'Cardiology': '394579002',
    'Radiology': '394914008',
    'Pathology': '394600006',
    'Anesthesiology': '394588006',
    'Dermatology': '394584008',
    'Neurology': '394592004',
    'Oncology': '394578006',
    'Psychiatry': '394587001',
    'Orthopedics': '394665006',
    'Gynecology': '394593002',
    'Internal Medicine': '394584008'
  };
  return specialtyCodes[specialty] || '394807001'; // General medical practice
}

/**
 * Validate FHIR Organization resource
 * @param {Object} fhirOrg - FHIR Organization resource
 * @returns {Object} - Validation result
 */
export function validateFHIROrganization(fhirOrg) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!fhirOrg.name) {
    errors.push('Organization name is required');
  }
  if (!fhirOrg.id) {
    errors.push('Organization ID is required');
  }

  // Recommended fields
  if (!fhirOrg.type || fhirOrg.type.length === 0) {
    warnings.push('Organization type is recommended');
  }
  if (!fhirOrg.telecom || fhirOrg.telecom.length === 0) {
    warnings.push('Contact information is recommended');
  }
  if (!fhirOrg.address || fhirOrg.address.length === 0) {
    warnings.push('Address is recommended');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export organization as FHIR JSON
 * @param {Object} orgData - Organization data
 * @returns {Object} - Export result
 */
export async function exportOrganizationAsFHIR(orgData) {
  try {
    const fhirResource = createOrganizationWithServices(orgData);
    const validation = validateFHIROrganization(fhirResource.entry[0].resource);

    if (!validation.valid) {
      return {
        success: false,
        error: 'FHIR validation failed',
        details: validation.errors
      };
    }

    // Convert to JSON string for download
    const jsonString = JSON.stringify(fhirResource, null, 2);

    return {
      success: true,
      data: jsonString,
      filename: `organization-${orgData.id}-fhir.json`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}