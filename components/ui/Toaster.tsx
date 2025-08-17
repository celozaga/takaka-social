import React, { useState, useCallback, useEffect } from 'react';
import { ToastContext, useToast, ToastMessage, ToastProps } from './use-toast';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((props: ToastProps) => {
    const { title, description, variant = 'default' } = props;
    const id = toastId++;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md space-y-3 px-4">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastComponentProps extends ToastMessage {
  onDismiss: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ id, title, description, variant, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [id, onDismiss]);

  const isDestructive = variant === 'destructive';
  const bgColor = isDestructive ? 'bg-error text-on-error' : 'bg-surface-3 text-on-surface';
  const Icon = isDestructive ? AlertTriangle : CheckCircle;
  const iconColor = isDestructive ? 'text-on-error' : 'text-primary';

  return (
    <div
      className={`relative w-full p-4 pr-10 rounded-lg flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 ${bgColor}`}
    >
        <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-grow">
            <p className="font-semibold">{title}</p>
            {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
        </div>
        <button onClick={onDismiss} className="absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
        </button>
    </div>
  );
};