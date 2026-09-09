import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import NotificationToast from '../components/notifications/NotificationToast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const nextId = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  // A counter (not Date.now()) — two toasts fired in the same tick would
  // otherwise collide on id and break the AnimatePresence/React keys.
  // `action` (optional): { label, onAction } renders a button in the toast
  // (e.g. "Undo") and extends the auto-dismiss window so there's time to click it.
  const notify = useCallback((type, title, message = '', action = null) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, type, title, message, action }]);
    timers.current[id] = setTimeout(() => remove(id), action ? 6000 : 4000);
  }, [remove]);

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <NotificationToast notifications={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
