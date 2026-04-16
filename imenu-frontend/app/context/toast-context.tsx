'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import Toast from '@/app/components/toast';

interface ToastItem {
  id: string; // Changed from number to string for better uniqueness
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    // Create a unique ID using timestamp + random string + counter
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
    
    // Add new toast
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      delete timeoutRefs.current[id];
    }, 3000);
    
    timeoutRefs.current[id] = timeout;
  }, []);

  // Cleanup timeouts on unmount
  const removeToast = useCallback((id: string) => {
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}