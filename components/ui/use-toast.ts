import { createContext, useContext } from 'react';

type ToastVariant = 'default' | 'destructive';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export interface ToastMessage extends ToastProps {
  id: number;
  variant: ToastVariant;
}

interface ToastContextType {
  toasts: ToastMessage[];
  toast: (props: ToastProps) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook to be used in components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
