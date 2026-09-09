import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const borderColor = isSuccess ? '#10B981' : isError ? '#EF4444' : '#6366F1';
  const iconColor = isSuccess ? '#059669' : isError ? '#DC2626' : '#4F46E5';

  return (
    <div
      style={{
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderRadius: '12px',
        background: '#FFFFFF',
        borderLeft: `5px solid ${borderColor}`,
        borderTop: '1px solid #E2E8F0',
        borderRight: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        color: '#0F172A',
        fontWeight: 600,
        fontSize: '0.88rem',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {isSuccess && <CheckCircle size={18} color={iconColor} style={{ flexShrink: 0 }} />}
      {isError && <AlertCircle size={18} color={iconColor} style={{ flexShrink: 0 }} />}
      {!isSuccess && !isError && <Info size={18} color={iconColor} style={{ flexShrink: 0 }} />}

      <div style={{ flex: 1, color: '#0F172A', lineHeight: 1.4 }}>
        {toast.message}
      </div>

      <button
        className="btn btn-ghost btn-icon"
        onClick={() => onDismiss(toast.id)}
        style={{ padding: '0.25rem', color: '#64748B', borderRadius: '6px', cursor: 'pointer' }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || !toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        maxWidth: '400px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'auto',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

