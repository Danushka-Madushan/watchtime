import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { ToastMessage, ToastType, ToastAction } from '../types/toast';

export type ShowToastOptions = {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  action?: ToastAction;
  durationMs?: number;
};

export interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (options: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (message: string, options?: Partial<ShowToastOptions>) => string;
  showError: (message: string, options?: Partial<ShowToastOptions>) => string;
  showInfo: (message: string, options?: Partial<ShowToastOptions>) => string;
  showWarning: (message: string, options?: Partial<ShowToastOptions>) => string;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 6000,
};

export function ToastProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string): void => {
    // Clear active timer for this toast
    const activeTimer = timersRef.current.get(id);
    if (activeTimer) {
      clearTimeout(activeTimer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback((): void => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ShowToastOptions): string => {
      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const duration =
        options.durationMs !== undefined
          ? options.durationMs
          : DEFAULT_DURATIONS[options.type];

      const newToast: ToastMessage = {
        id,
        type: options.type,
        title: options.title,
        message: options.message,
        action: options.action,
        durationMs: duration,
        duration,
      };

      // Clear any prior timer if re-using the same ID
      const priorTimer = timersRef.current.get(id);
      if (priorTimer) {
        clearTimeout(priorTimer);
        timersRef.current.delete(id);
      }

      setToasts((prev) => {
        // If updating an existing toast by ID
        const exists = prev.some((t) => t.id === id);
        let updated: ToastMessage[];
        if (exists) {
          updated = prev.map((t) => (t.id === id ? newToast : t));
        } else {
          // Keep newest toasts, capped at MAX_TOASTS
          updated = [...prev, newToast];
          if (updated.length > MAX_TOASTS) {
            const evicted = updated[0];
            if (evicted) {
              const evictedTimer = timersRef.current.get(evicted.id);
              if (evictedTimer) {
                clearTimeout(evictedTimer);
                timersRef.current.delete(evicted.id);
              }
            }
            updated = updated.slice(updated.length - MAX_TOASTS);
          }
        }
        return updated;
      });

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (message: string, options?: Partial<ShowToastOptions>): string =>
      showToast({ ...options, type: 'success', message }),
    [showToast]
  );

  const showError = useCallback(
    (message: string, options?: Partial<ShowToastOptions>): string =>
      showToast({ ...options, type: 'error', message }),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, options?: Partial<ShowToastOptions>): string =>
      showToast({ ...options, type: 'info', message }),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, options?: Partial<ShowToastOptions>): string =>
      showToast({ ...options, type: 'warning', message }),
    [showToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      dismissToast,
      clearAllToasts,
      showSuccess,
      showError,
      showInfo,
      showWarning,
    }),
    [
      toasts,
      showToast,
      dismissToast,
      clearAllToasts,
      showSuccess,
      showError,
      showInfo,
      showWarning,
    ]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
