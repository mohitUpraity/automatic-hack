import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const Toast = ({ id, message, type, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    warning: 'border-amber-500/30',
    info: 'border-blue-500/30'
  };

  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-slate-900/90 backdrop-blur-xl border ${borders[type]} rounded-xl shadow-xl overflow-hidden pointer-events-auto flex flex-col min-w-[300px] mb-3 relative`}
    >
      <div className="flex items-start p-4 pr-10">
        <div className="shrink-0 mr-3 mt-0.5">
          {icons[type]}
        </div>
        <div className="flex-1 text-sm font-medium text-slate-200">
          {message}
        </div>
        <button 
          onClick={() => removeToast(id)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: 4, ease: 'linear' }}
        className={`h-1 ${progressColors[type]}`}
      />
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info')
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast 
              key={toast.id} 
              {...toast} 
              removeToast={removeToast} 
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
