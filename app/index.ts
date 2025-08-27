// ============================================================================
// App Modules - Main Barrel Export
// ============================================================================
// 
// This is the main entry point for all app modules.
// It provides a clean interface for importing functionality from any module.
//

// ============================================================================
// MODULES
// ============================================================================

// Feed Module
export * as Feed from './modules/feed';

// Profile Module
export * as Profile from './modules/profile';

// Post Module
export * as Post from './modules/post';

// Search Module
export * as Search from './modules/search';

// Notifications Module
export * as Notifications from './modules/notifications';

// Settings Module
export * as Settings from './modules/settings';

// ============================================================================
// CORE
// ============================================================================

// API Core
export * as API from './core/api';

// State Core
export * as State from './core/state';

// Sync Core
export * as Sync from './core/sync';

// UI Core
export * as UI from './core/ui';

// Utils Core
export * as Utils from './core/utils';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Most commonly used exports for easier access
export { useAtp, useUI, useTheme, useToast } from './core/state';
export { Button, Card, Avatar, Typography } from './core/ui';
export { timeUtils, formatters, debounce } from './core/utils';