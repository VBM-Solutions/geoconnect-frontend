import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
  toastInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />,
  error:   <XCircle     className="w-4 h-4 text-red-500 shrink-0" />,
  info:    <Info        className="w-4 h-4 text-blue-500 shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error:   'bg-red-50 border-red-200',
  info:    'bg-blue-50 border-blue-200',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const toastSuccess = useCallback((msg: string) => addToast('success', msg), [addToast]);
  const toastError   = useCallback((msg: string) => addToast('error', msg),   [addToast]);
  const toastInfo    = useCallback((msg: string) => addToast('info', msg),    [addToast]);
  const contextValue = useMemo(
    () => ({ toastSuccess, toastError, toastInfo }),
    [toastSuccess, toastError, toastInfo],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Portal de toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 p-3 rounded-lg border shadow-md text-sm text-slate-800 ${BG[t.type]} animate-in slide-in-from-right-4`}
          >
            {ICONS[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

