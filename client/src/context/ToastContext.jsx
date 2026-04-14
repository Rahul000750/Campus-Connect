import { createContext, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';

const ToastContext = createContext(null);

const styles = {
  success: { icon: FiCheckCircle, ring: 'ring-emerald-300/50', iconColor: 'text-emerald-500' },
  error: { icon: FiXCircle, ring: 'ring-rose-300/50', iconColor: 'text-rose-500' },
  info: { icon: FiInfo, ring: 'ring-blue-300/50', iconColor: 'text-blue-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function addToast(message, type = 'info') {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }

  const value = useMemo(() => ({ addToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const variant = styles[toast.type] || styles.info;
            const Icon = variant.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`glass-card ring-1 ${variant.ring} pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm`}
              >
                <Icon className={`text-lg ${variant.iconColor}`} />
                <span>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
