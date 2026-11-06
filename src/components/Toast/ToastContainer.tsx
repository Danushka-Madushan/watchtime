import React from 'react';
import { useToast } from '../../context/ToastContext';
import { ToastItem } from './ToastItem';

export interface ToastContainerProps {
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

export function ToastContainer({
  position = 'bottom-right',
}: ToastContainerProps): React.ReactElement | null {
  const { toasts, dismissToast } = useToast();

  if (!toasts || toasts.length === 0) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4 flex-col-reverse',
    'top-right': 'top-4 right-4 flex-col',
    'bottom-left': 'bottom-4 left-4 flex-col-reverse',
    'top-left': 'top-4 left-4 flex-col',
  }[position];

  return (
    <aside
      id="toast-host"
      aria-label="Notifications"
      className={`fixed ${positionClasses} z-50 max-w-sm w-full p-4 pointer-events-none flex gap-2.5`}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </aside>
  );
}

export default ToastContainer;
