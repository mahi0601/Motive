import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({ refreshSession: vi.fn(() => Promise.resolve({})) }));
vi.mock('./logger', () => ({ logger: { warn: vi.fn() } }));

import { recoverRejectedSocket } from './socketRecovery';
import { refreshSession } from '../services/api';

const fakeSocket = (active) => {
  const handlers = {};
  return {
    active,
    connect: vi.fn(),
    on: (event, fn) => {
      handlers[event] = fn;
    },
    fire: (event, arg) => handlers[event]?.(arg),
  };
};

describe('recoverRejectedSocket', () => {
  beforeEach(() => vi.clearAllMocks());

  test('a handshake the server rejected signs in again, then reconnects', async () => {
    const socket = fakeSocket(false);
    recoverRejectedSocket(socket, 'Test');
    await socket.fire('connect_error', new Error('jwt expired'));
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  test('a connection socket.io is already retrying by itself is left alone', async () => {
    const socket = fakeSocket(true);
    recoverRejectedSocket(socket, 'Test');
    await socket.fire('connect_error', new Error('network'));
    expect(refreshSession).not.toHaveBeenCalled();
  });

  test('a revoked session does not loop: a failed refresh does not reconnect', async () => {
    refreshSession.mockRejectedValueOnce(new Error('401'));
    const socket = fakeSocket(false);
    recoverRejectedSocket(socket, 'Test');
    await socket.fire('connect_error', new Error('jwt expired'));
    expect(socket.connect).not.toHaveBeenCalled();
  });
});
