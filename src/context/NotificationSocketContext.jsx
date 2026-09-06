import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getNotifications } from '../services/notificationService';

const NotificationSocketContext = createContext();

// Single socket connection, shared app-wide, that keeps the unread badge and
// a toast in sync the moment a notification is created server-side — instead
// of Header/NotificationCenter each polling on their own mount/open cycle.
export const NotificationSocketProvider = ({ children }) => {
  const { user, bootstrapping, isAuthenticated } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // Initial unread count on login — the socket only carries *new*
  // notifications from here on, it doesn't replay history.
  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    (async () => {
      try {
        const { data } = await getNotifications();
        setUnreadCount((data.notifications || []).filter((n) => !n.read).length);
      } catch {
        /* badge just stays at 0 */
      }
    })();
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !user) return undefined;

    const socket = io(import.meta.env.VITE_API_BASE_URL);
    socketRef.current = socket;

    const identify = () => socket.emit('identify', { token: getAccessToken() });
    socket.on('connect', identify);

    socket.on('notification:new', (notification) => {
      setUnreadCount((c) => c + 1);
      toast?.notify('info', notification.title, notification.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapping, isAuthenticated, user]);

  return (
    <NotificationSocketContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationSocket = () => useContext(NotificationSocketContext);
