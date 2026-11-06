import React from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import type { ToastMessage, ToastType } from '../../types/toast';

export interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastType, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  success: CheckCircle2,
  error: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES: Record<ToastType, { border: string; iconColor: string; bgTone: string }> = {
  success: {
    border: 'border-ok/35',
    iconColor: 'text-ok',
    bgTone: 'bg-ok/5',
  },
  error: {
    border: 'border-danger/35',
    iconColor: 'text-danger',
    bgTone: 'bg-danger/5',
  },
  warning: {
    border: 'border-amber-500/35',
    iconColor: 'text-amber-500',
    bgTone: 'bg-amber-500/5',
  },
  info: {
    border: 'border-accent/35',
    iconColor: 'text-accent',
    bgTone: 'bg-accent/5',
  },
};

export function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  const IconComponent = TOAST_ICONS[toast.type] || Info;
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const isError = toast.type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`pointer-events-auto rounded-xl border ${style.border} ${style.bgTone} bg-surface/95 backdrop-blur-md text-ink shadow-lg p-3.5 flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden={true} />
      <div className="flex-1 space-y-0.5 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-bold text-ink leading-tight">
            {toast.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-muted leading-relaxed break-words">
          {toast.message}
        </p>
        {toast.action && (
          <button
            type="button"
            onClick={(): void => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="text-xs sm:text-sm font-semibold text-accent hover:underline inline-block mt-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={(): void => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-1 rounded-md text-muted hover:text-ink hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" aria-hidden={true} />
      </button>
    </div>
  );
}

export default ToastItem;
