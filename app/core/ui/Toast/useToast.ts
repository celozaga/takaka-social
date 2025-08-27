/**
 * ============================================================================
 * Toast Hook and Context
 * ============================================================================
 *
 * Universal toast system for showing temporary notifications.
 * Provides ToastContext and useToast hook.
 *
 */

import { createContext, useContext } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';

export interface ToastProps {
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Auto dismiss duration in ms (default: 5000) */
  duration?: number;
}

export interface ToastMessage extends ToastProps {
  /** Unique toast ID */
  id: number;
  /** Toast variant (required in message) */
  variant: ToastVariant;
  /** Duration (required in message) */
  duration: number;
}

interface ToastContextType {
  /** Array of active toasts */
  toasts: ToastMessage[];
  /** Function to show a toast */
  toast: (props: ToastProps) => void;
  /** Function to remove a toast by ID */
  removeToast: (id: number) => void;
}

// ============================================================================
// Context
// ============================================================================

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================================================
// Hook
// ============================================================================

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
