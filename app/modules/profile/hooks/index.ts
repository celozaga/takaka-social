// ============================================================================
// Profile Module - Hooks Barrel Export
// ============================================================================
//
// This file centralizes all hook exports for the profile module,
// making it easy to import hooks from a single location.
//

// Hook exports
export { useProfile } from './useProfile';
export { useProfileActions } from './useProfileActions';
export { useFollowActions } from './useFollowActions';

// Hook return type exports
export type {
  UseProfileReturn,
  UseProfileActionsReturn,
  UseFollowActionsReturn,
} from '../types';

// Default exports for convenience
export { default as useProfile } from './useProfile';
export { default as useProfileActions } from './useProfileActions';
export { default as useFollowActions } from './useFollowActions';