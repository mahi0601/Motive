import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { recoverRejectedSocket } from '../utils/socketRecovery';

// A color per socket, stable for the life of the connection — cheap "who's
// who" visual distinction without needing per-user color assignment from
// the server. Deliberately clear of both `brand` (petrol) and every
// statusColors.js hue — a collaborator's cursor must never read as a
// delivery status. Pure identity colors only.
const CURSOR_COLORS = ['#EC4899', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#6366F1'];
const colorFor = (socketId) => {
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) hash = (hash * 31 + socketId.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

// Live presence + cursor positions for a single page, over the same
// socket.io server the backend already runs for task/board updates.
// Cursor position is sent as a 0-1 fraction of the container's size, not
// raw pixels — resolution-independent across different viewers' screens.
export const usePageSocket = (pageId, containerRef) => {
  const { user } = useAuth();
  const userId = user?.id;
  // Read at join time; the name changing must not reconnect the socket.
  const userNameRef = useRef(user?.name);
  userNameRef.current = user?.name;
  const [peers, setPeers] = useState({}); // socketId -> { user, x, y }
  const socketRef = useRef(null);
  const throttleRef = useRef(0);

  useEffect(() => {
    if (!pageId || !userId) return undefined;

    // No withCredentials — the socket doesn't use cookies (auth is the JWT
    // handed to the server during the handshake below), and pairing it with
    // the server's wildcard CORS origin ('*') is actively rejected by
    // browsers.
    //
    // `auth` as a function (not a plain object) so socket.io calls it fresh
    // on every (re)connection attempt — a plain object would freeze in the
    // access token that was live when this effect first ran, so a
    // reconnect after a silent token refresh would hand the server a stale
    // token and get rejected by the handshake middleware.
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
    });
    socketRef.current = socket;

    // Identity is established by the handshake now — this just tells the
    // server which page room to put the (already-authenticated) socket in.
    const join = () => socket.emit('page:join', { pageId, name: userNameRef.current });
    socket.on('connect', join);
    // A rejected handshake (expired/missing token) used to fail silently —
    // presence would just never show up with nothing in the console to say
    // why.
    recoverRejectedSocket(socket, 'Page');

    socket.on('presence:join', ({ socketId, user: peerUser }) => {
      setPeers((prev) => ({ ...prev, [socketId]: { user: peerUser, x: null, y: null } }));
    });
    socket.on('presence:leave', ({ socketId }) => {
      setPeers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });
    socket.on('cursor:move', ({ socketId, user: peerUser, x, y }) => {
      setPeers((prev) => ({ ...prev, [socketId]: { user: peerUser, x, y } }));
    });

    return () => {
      socket.emit('page:leave', { pageId });
      socket.disconnect();
      setPeers({});
    };
  }, [pageId, userId]);

  // Call on mousemove over the editor area — throttled to ~20/sec, plenty
  // smooth for a cursor indicator without flooding the socket.
  const sendCursor = useCallback((clientX, clientY) => {
    const socket = socketRef.current;
    const el = containerRef.current;
    if (!socket || !el) return;
    const now = Date.now();
    if (now - throttleRef.current < 50) return;
    throttleRef.current = now;
    const rect = el.getBoundingClientRect();
    socket.emit('cursor:move', {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    });
  }, [containerRef]);

  const peerList = Object.entries(peers)
    .filter(([, p]) => p.user?.name)
    .map(([socketId, p]) => ({ socketId, ...p, color: colorFor(socketId) }));

  return { peers: peerList, sendCursor };
};
