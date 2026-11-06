import React, { useEffect, useRef, useCallback, useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync open/close lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setIsSubmitting(false);
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.open = true;
        }
      }
      // Follow Modern Web Guidance: autofocus safe action (Cancel)
      requestAnimationFrame(() => {
        cancelBtnRef.current?.focus();
      });
    } else {
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.open = false;
        }
      }
    }
  }, [isOpen]);

  // Light dismiss backdrop click fallback
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>): void => {
      const dialog = dialogRef.current;
      if (!dialog || isSubmitting) return;
      if (e.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInContent =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInContent) {
          onCancel();
        }
      }
    },
    [onCancel, isSubmitting]
  );

  // Handle Esc key cancel
  const handleCancelEvent = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>): void => {
      e.preventDefault();
      if (!isSubmitting) {
        onCancel();
      }
    },
    [onCancel, isSubmitting]
  );

  const handleConfirmAction = async (): Promise<void> => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const confirmButtonClass = isDanger
    ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-none transition-opacity focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 cursor-pointer bg-danger hover:bg-red-700 focus-visible:ring-danger'
    : 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-none transition-opacity focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 cursor-pointer bg-accent hover:bg-red-700 focus-visible:ring-accent';

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClick={handleDialogClick}
      onCancel={handleCancelEvent}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 m-auto p-0 bg-transparent backdrop:bg-black/65 backdrop:backdrop-blur-sm z-50 max-w-md w-[calc(100%-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-line open:flex open:flex-col"
    >
      <div className="bg-surface text-ink p-6 space-y-4">
        {/* Title and Icon */}
        <div className="flex items-start gap-3.5">
          <div
            className={
              isDanger
                ? 'p-2.5 rounded-xl shrink-0 bg-danger/10 text-danger border border-danger/20'
                : 'p-2.5 rounded-xl shrink-0 bg-accent/10 text-accent border border-accent/20'
            }
          >
            {isDanger ? (
              <Trash2 className="w-5 h-5" aria-hidden={true} />
            ) : (
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-ink">
              {title}
            </h2>
            <div id="confirm-dialog-description" className="text-sm sm:text-base text-muted leading-relaxed">
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-ink bg-canvas hover:bg-line border border-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={isSubmitting}
            className={confirmButtonClass}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden={true} />
            ) : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
