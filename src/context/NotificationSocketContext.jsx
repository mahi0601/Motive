import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getNotifications } from '../services/notificationService';
import { recoverRejectedSocket } from '../utils/socketRecovery';

const NotificationSocketContext = createContext();

// Single socket connection, shared app-wide, that keeps the unread badge and
// a toast in sync the moment a notification is created server-side — instead
// of Header/NotificationCenter each polling on their own mount/open cycle.
export const NotificationSocketProvider = ({ children }) => {
  const { user, bootstrapping, isAuthenticated } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  // The effect keys on the id, not the user object: a profile refresh makes a new object every time
  // and would otherwise tear down and reopen the socket (losing notifications in the gap).
  const userId = user?.id;

  // Initial unread count on login — the socket only carries *new*
  // notifications from here on, it doesn't replay history.
  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    (async () => {
      try {
        // Server-reported `unreadCount` covers ALL of a user's notifications,
        // not just whatever fits on the first paginated page.
        const { data } = await getNotifications();
        setUnreadCount(data.unreadCount || 0);
      } catch {
        /* badge just stays at 0 */
      }
    })();
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated || !userId) return undefined;

    // `auth` as a function so socket.io re-reads the access token on every
    // (re)connect attempt instead of freezing in whatever was live when
    // this effect first ran — see usePageSocket.js for the same pattern.
    // The server now derives identity from this handshake and joins the
    // socket to its `user:` room itself; there's no separate `identify`
    // event to emit anymore.
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
    });
    socketRef.current = socket;

    recoverRejectedSocket(socket, 'Notification');

    socket.on('notification:new', (notification) => {
      setUnreadCount((c) => c + 1);
      toast?.notify('info', notification.title, notification.message);
      // Also surface as a native OS notification if the user granted
      // permission in Settings — otherwise "Enable Alerts" would request
      // permission for nothing.
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapping, isAuthenticated, userId]);

  return (
    <NotificationSocketContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationSocket = () => useContext(NotificationSocketContext);
