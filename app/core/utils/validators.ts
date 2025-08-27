// ============================================================================
// Validators - Data Validation Utilities
// ============================================================================
//
// This module provides utilities for validating various types of data
// including user input, social media content, and API responses.
//

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface ValidationRule<T = any> {
  validate: (value: T) => ValidationResult;
  message?: string;
}

// ============================================================================
// BASIC VALIDATORS
// ============================================================================

export const basicValidators = {
  // Check if value is required (not null, undefined, or empty string)
  required: (value: any): ValidationResult => {
    const isValid = value !== null && value !== undefined && value !== '';
    return {
      isValid,
      error: isValid ? undefined : 'This field is required',
    };
  },

  // Check if string has minimum length
  minLength: (min: number) => (value: string): ValidationResult => {
    const isValid = typeof value === 'string' && value.length >= min;
    return {
      isValid,
      error: isValid ? undefined : `Must be at least ${min} characters long`,
    };
  },

  // Check if string has maximum length
  maxLength: (max: number) => (value: string): ValidationResult => {
    const isValid = typeof value === 'string' && value.length <= max;
    return {
      isValid,
      error: isValid ? undefined : `Must be no more than ${max} characters long`,
    };
  },

  // Check if number is within range
  numberRange: (min: number, max: number) => (value: number): ValidationResult => {
    const isValid = typeof value === 'number' && value >= min && value <= max;
    return {
      isValid,
      error: isValid ? undefined : `Must be between ${min} and ${max}`,
    };
  },

  // Check if value matches regex pattern
  pattern: (regex: RegExp, message: string = 'Invalid format') => (value: string): ValidationResult => {
    const isValid = typeof value === 'string' && regex.test(value);
    return {
      isValid,
      error: isValid ? undefined : message,
    };
  },
};

// ============================================================================
// EMAIL AND URL VALIDATORS
// ============================================================================

export const formatValidators = {
  // Validate email format
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = typeof value === 'string' && emailRegex.test(value);
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid email address',
    };
  },

  // Validate URL format
  url: (value: string): ValidationResult => {
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: 'Please enter a valid URL',
      };
    }
  },

  // Validate phone number (basic format)
  phoneNumber: (value: string): ValidationResult => {
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
    const isValid = typeof value === 'string' && phoneRegex.test(value.replace(/\s/g, ''));
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid phone number',
    };
  },
};

// ============================================================================
// SOCIAL MEDIA VALIDATORS
// ============================================================================

export const socialValidators = {
  // Validate handle format (username)
  handle: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Handle is required' };
    }

    // Remove @ if present
    const cleanHandle = value.startsWith('@') ? value.slice(1) : value;
    
    // Check length (3-20 characters)
    if (cleanHandle.length < 3 || cleanHandle.length > 20) {
      return {
        isValid: false,
        error: 'Handle must be between 3 and 20 characters',
      };
    }

    // Check format (alphanumeric, dots, underscores, hyphens)
    const handleRegex = /^[a-zA-Z0-9._-]+$/;
    if (!handleRegex.test(cleanHandle)) {
      return {
        isValid: false,
        error: 'Handle can only contain letters, numbers, dots, underscores, and hyphens',
      };
    }

    // Check that it doesn't start or end with special characters
    if (/^[._-]|[._-]$/.test(cleanHandle)) {
      return {
        isValid: false,
        error: 'Handle cannot start or end with dots, underscores, or hyphens',
      };
    }

    return { isValid: true };
  },

  // Validate post content
  postContent: (value: string, maxLength: number = 300): ValidationResult => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, error: 'Post content cannot be empty' };
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        error: `Post must be no more than ${maxLength} characters`,
      };
    }

    return { isValid: true };
  },

  // Validate display name
  displayName: (value: string): ValidationResult => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, error: 'Display name is required' };
    }

    if (value.length > 64) {
      return {
        isValid: false,
        error: 'Display name must be no more than 64 characters',
      };
    }

    // Check for invalid characters (basic check)
    if (/[<>"'&]/.test(value)) {
      return {
        isValid: false,
        error: 'Display name contains invalid characters',
      };
    }

    return { isValid: true };
  },

  // Validate bio/description
  bio: (value: string, maxLength: number = 256): ValidationResult => {
    if (value && value.length > maxLength) {
      return {
        isValid: false,
        error: `Bio must be no more than ${maxLength} characters`,
      };
    }

    return { isValid: true };
  },

  // Validate hashtag
  hashtag: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Hashtag is required' };
    }

    // Remove # if present
    const cleanTag = value.startsWith('#') ? value.slice(1) : value;
    
    if (cleanTag.length === 0) {
      return { isValid: false, error: 'Hashtag cannot be empty' };
    }

    if (cleanTag.length > 100) {
      return {
        isValid: false,
        error: 'Hashtag must be no more than 100 characters',
      };
    }

    // Check format (alphanumeric and underscores only)
    const hashtagRegex = /^[a-zA-Z0-9_]+$/;
    if (!hashtagRegex.test(cleanTag)) {
      return {
        isValid: false,
        error: 'Hashtag can only contain letters, numbers, and underscores',
      };
    }

    return { isValid: true };
  },
};

// ============================================================================
// ATPROTO SPECIFIC VALIDATORS
// ============================================================================

export const atprotoValidators = {
  // Validate DID (Decentralized Identifier)
  did: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'DID is required' };
    }

    // Basic DID format check
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._:-]+$/;
    if (!didRegex.test(value)) {
      return {
        isValid: false,
        error: 'Invalid DID format',
      };
    }

    return { isValid: true };
  },

  // Validate AT URI
  atUri: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'AT URI is required' };
    }

    // Basic AT URI format check
    const atUriRegex = /^at:\/\/[a-zA-Z0-9._:-]+\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    if (!atUriRegex.test(value)) {
      return {
        isValid: false,
        error: 'Invalid AT URI format',
      };
    }

    return { isValid: true };
  },

  // Validate CID (Content Identifier)
  cid: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'CID is required' };
    }

    // Basic CID format check (simplified)
    if (value.length < 10 || !/^[a-zA-Z0-9]+$/.test(value)) {
      return {
        isValid: false,
        error: 'Invalid CID format',
      };
    }

    return { isValid: true };
  },
};

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

export const compositeValidators = {
  // Validate multiple rules
  validateAll: (value: any, rules: ValidationRule[]): ValidationResult => {
    const errors: string[] = [];
    
    for (const rule of rules) {
      const result = rule.validate(value);
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      error: errors.length > 0 ? errors[0] : undefined,
    };
  },

  // Validate any of the rules (OR logic)
  validateAny: (value: any, rules: ValidationRule[]): ValidationResult => {
    for (const rule of rules) {
      const result = rule.validate(value);
      if (result.isValid) {
        return { isValid: true };
      }
    }
    
    return {
      isValid: false,
      error: 'Value does not match any of the required formats',
    };
  },

  // Create a custom validator
  createValidator: (validationFn: (value: any) => boolean, errorMessage: string): ValidationRule => {
    return {
      validate: (value: any): ValidationResult => {
        const isValid = validationFn(value);
        return {
          isValid,
          error: isValid ? undefined : errorMessage,
        };
      },
      message: errorMessage,
    };
  },
};

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

export const formValidators = {
  // Validate an entire form object
  validateForm: (formData: Record<string, any>, rules: Record<string, ValidationRule[]>): Record<string, ValidationResult> => {
    const results: Record<string, ValidationResult> = {};
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field];
      results[field] = compositeValidators.validateAll(value, fieldRules);
    }
    
    return results;
  },

  // Check if form is valid
  isFormValid: (validationResults: Record<string, ValidationResult>): boolean => {
    return Object.values(validationResults).every(result => result.isValid);
  },

  // Get all form errors
  getFormErrors: (validationResults: Record<string, ValidationResult>): Record<string, string[]> => {
    const errors: Record<string, string[]> = {};
    
    for (const [field, result] of Object.entries(validationResults)) {
      if (!result.isValid && result.errors) {
        errors[field] = result.errors;
      } else if (!result.isValid && result.error) {
        errors[field] = [result.error];
      }
    }
    
    return errors;
  },
};

// ============================================================================
// COMBINED VALIDATORS EXPORT
// ============================================================================

export const validators = {
  basic: basicValidators,
  format: formatValidators,
  social: socialValidators,
  atproto: atprotoValidators,
  composite: compositeValidators,
  form: formValidators,
};

export default validators;