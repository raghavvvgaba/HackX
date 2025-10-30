// Privacy filter utility for sanitizing user input before sending to AI
// This ensures no personal health information (PHI) is sent to external AI services

/**
 * Sanitize user input to remove personal identifiers and sensitive information
 * @param {string} input - The user's input text
 * @returns {string} - Sanitized input safe for AI processing
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove common personal identifiers
  const patterns = [
    // Social Security Numbers
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN-REDACTED]' },
    { pattern: /\b\d{9}\b/g, replacement: '[SSN-REDACTED]' },
    
    // Phone numbers
    { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '[PHONE-REDACTED]' },
    { pattern: /\(\d{3}\)\s*\d{3}-\d{4}/g, replacement: '[PHONE-REDACTED]' },
    
    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL-REDACTED]' },
    
    // Dates (various formats)
    { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, replacement: '[DATE]' },
    { pattern: /\b\d{1,2}-\d{1,2}-\d{4}\b/g, replacement: '[DATE]' },
    { pattern: /\b\d{4}-\d{1,2}-\d{1,2}\b/g, replacement: '[DATE]' },
    
    // Medical record numbers (common patterns)
    { pattern: /\bMRN\s*:?\s*\d+/gi, replacement: '[MRN-REDACTED]' },
    { pattern: /\bmedical\s+record\s+number\s*:?\s*\d+/gi, replacement: '[MRN-REDACTED]' },
    
    // Insurance information
    { pattern: /\bpolicy\s+number\s*:?\s*[\w\d-]+/gi, replacement: '[POLICY-REDACTED]' },
    { pattern: /\binsurance\s+id\s*:?\s*[\w\d-]+/gi, replacement: '[INSURANCE-REDACTED]' },
    
    // Names (basic pattern matching)
    { pattern: /\b(my\s+name\s+is|i'm|i\s+am)\s+[A-Za-z]+(\s+[A-Za-z]+)*/gi, replacement: 'my name is [NAME-REDACTED]' },
    { pattern: /\b(patient\s+name\s*:?)\s*[A-Za-z]+(\s+[A-Za-z]+)*/gi, replacement: '$1 [NAME-REDACTED]' },
    
    // Addresses (basic patterns)
    { pattern: /\b\d+\s+[A-Za-z\s]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b/gi, replacement: '[ADDRESS-REDACTED]' },
    { pattern: /\b\d{5}(-\d{4})?\b/g, replacement: '[ZIP-REDACTED]' },
    
    // Credit card numbers
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD-REDACTED]' }
  ];

  // Apply all sanitization patterns
  patterns.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  return sanitized.trim();
}

/**
 * Check if input contains potentially sensitive medical information
 * @param {string} input - The user's input text
 * @returns {boolean} - True if potentially sensitive content is detected
 */
export function containsSensitiveInfo(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sensitivePatterns = [
    // Personal identifiers
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone
    
    // Specific medical information that shouldn't be shared
    /\bMRN\s*:?\s*\d+/i,
    /\bmedical\s+record\s+number/i,
    /\bpolicy\s+number/i,
    /\binsurance\s+id/i,
    
    // Explicit personal information sharing
    /(my\s+name\s+is|i'm\s+called|patient\s+name)/i
  ];

  return sensitivePatterns.some(pattern => pattern.test(input));
}

/**
 * Validate that input is appropriate for health AI assistant
 * @param {string} input - The user's input text
 * @returns {object} - Validation result with isValid and reason
 */
export function validateHealthQuery(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, reason: 'Empty input' };
  }

  if (input.length > 2000) {
    return { isValid: false, reason: 'Input too long' };
  }

  if (containsSensitiveInfo(input)) {
    return { 
      isValid: false, 
      reason: 'Input contains sensitive information that should not be shared with AI' 
    };
  }

  // Check for inappropriate content
  const inappropriatePatterns = [
    /\b(suicide|kill\s+myself|end\s+my\s+life)\b/i,
    /\b(self\s+harm|cut\s+myself|hurt\s+myself)\b/i
  ];

  const hasInappropriateContent = inappropriatePatterns.some(pattern => pattern.test(input));
  if (hasInappropriateContent) {
    return { 
      isValid: false, 
      reason: 'Input contains content requiring immediate professional intervention' 
    };
  }

  return { isValid: true };
}

/**
 * Format health query for optimal AI processing
 * @param {string} input - The sanitized user input
 * @returns {string} - Formatted query for AI
 */
export function formatHealthQuery(input) {
  const sanitized = sanitizeInput(input);
  
  // Add context for better AI responses
  const healthContextPrefix = "Please provide general health information about: ";
  
  return `${healthContextPrefix}${sanitized}`;
}

/**
 * Log privacy filtering events (for debugging and compliance)
 * @param {string} originalInput - Original user input
 * @param {string} sanitizedInput - Sanitized version
 * @param {string} userId - User ID (optional)
 */
export function logPrivacyFiltering(originalInput, sanitizedInput, userId = null) {
  // Only log in development or when explicitly enabled
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_PRIVACY_LOGS === 'true') {
    const wasFiltered = originalInput !== sanitizedInput;
    
    console.log('Privacy Filter Log:', {
      timestamp: new Date().toISOString(),
      wasFiltered,
      hasUserId: Boolean(userId),
      originalLength: originalInput.length,
      sanitizedLength: sanitizedInput.length,
      // Don't log actual content for privacy
    });
  }
}
