// ============================================================================
// Utils Core Module - Barrel Export
// ============================================================================
// 
// This module contains utility functions and helpers including:
// - Time and date formatting
// - ID generation and validation
// - Cache management
// - Visibility observer
// - General purpose helpers
//

// Time Utilities
export { timeUtils } from './time';
export { formatters } from './formatters';

// ID Utilities
export { idUtils } from './ids';
export { generateId, validateId } from './ids';

// Cache Utilities
export { CacheManager } from './cache/CacheManager';
export { MemoryCache } from './cache/MemoryCache';
export { PersistentCache } from './cache/PersistentCache';

// Observer Utilities
export { VisibilityObserver } from './observers/VisibilityObserver';
export { IntersectionObserver } from './observers/IntersectionObserver';

// Validation Utilities
export { validators } from './validation';
export { sanitizers } from './sanitization';

// Platform Utilities
export { platformUtils } from './platform';
export { deviceUtils } from './device';

// Performance Utilities
export { performanceUtils } from './performance';
export { debounce, throttle } from './performance';

// Image Utilities
export { imageUtils } from './image';
export { videoUtils } from './video';

// Types
export type { 
  CacheConfig, 
  ObserverConfig, 
  ValidationRule, 
  PlatformInfo,
  PerformanceMetrics 
} from './types';

// Constants
export { CONSTANTS } from './constants';

// ============================================================================
// VALIDATORS
// ============================================================================

export * from './validators';
export { default as validators } from './validators';

// ============================================================================
// HELPERS
// ============================================================================

export * from './helpers';
export { default as helpers } from './helpers';

// ============================================================================
// COMBINED UTILS EXPORT
// ============================================================================

export const utils = {
  formatters,
  validators,
  helpers,
  // Add other utility categories here as they're created
  // constants,
};

export default utils;