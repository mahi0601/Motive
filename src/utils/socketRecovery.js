import { refreshSession } from '../services/api';
import { logger } from './logger';

// socket.io retries a dropped connection by itself, but NOT one the server's handshake middleware
// rejected (an expired access token after the API slept or restarted): `socket.active` is false and
// it stays dead. This signs in again with the refresh cookie, so the next handshake carries a fresh
// token (the socket's `auth` callback reads it on every attempt), then connects once more. At most a
// few tries, spaced out, so a really revoked session does not loop.
export const recoverRejectedSocket = (socket, label) => {
  let tries = 0;
  let lastTry = 0;
  socket.on('connect', () => {
    tries = 0;
  });
  socket.on('connect_error', async (err) => {
    logger.warn(`${label} socket connection rejected`, { error: err.message });
    if (socket.active || tries >= 3 || Date.now() - lastTry < 10_000) return;
    tries += 1;
    lastTry = Date.now();
    try {
      await refreshSession();
      socket.connect();
    } catch {
      // The session is really gone; the API client sends the user to sign in on its next call.
    }
  });
};
