import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CircleCheck, bar: 'bg-emerald-500', text: 'text-emerald-600' },
  error: { icon: CircleAlert, bar: 'bg-brand-600', text: 'text-brand-600' },
  info: { icon: Info, bar: 'bg-sky-500', text: 'text-sky-600' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, title) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, message, title }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (message, title) => push('success', message, title),
      error: (message, title) => push('error', message, title),
      info: (message, title) => push('info', message, title),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const style = STYLES[t.type];
            const Icon = style.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="pointer-events-auto flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-pop"
                role={t.type === 'error' ? 'alert' : 'status'}
              >
                <div className={`w-1 ${style.bar}`} />
                <div className="flex flex-1 items-start gap-3 p-3">
                  <Icon size={18} className={`mt-0.5 shrink-0 ${style.text}`} />
                  <div className="min-w-0 flex-1 text-sm">
                    {t.title && <p className="font-semibold text-slate-900">{t.title}</p>}
                    <p className="text-slate-600">{t.message}</p>
                  </div>
                  <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
