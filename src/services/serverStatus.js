// Tracks whether the API looks like it is "waking up". The backend runs on a
// free plan that sleeps after ~15 minutes idle, and the first request after
// that can take up to a minute. A request that has been pending past a few
// seconds is the signal; the first response of any kind clears it.
const SLOW_MS = 3500;

let pending = 0;
let waking = false;
let timer = null;
const listeners = new Set();

const setWaking = (next) => {
  if (waking === next) return;
  waking = next;
  listeners.forEach((fn) => fn());
};

const armTimer = () => {
  if (timer || waking || pending === 0) return;
  timer = setTimeout(() => {
    timer = null;
    if (pending > 0) setWaking(true);
  }, SLOW_MS);
};

export const requestStarted = () => {
  pending += 1;
  armTimer();
};

export const requestSettled = () => {
  pending = Math.max(0, pending - 1);
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  setWaking(false);
  armTimer(); // anything still pending starts its own clock
};

export const isWaking = () => waking;

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Test helper.
export const resetServerStatus = () => {
  if (timer) clearTimeout(timer);
  timer = null;
  pending = 0;
  waking = false;
  listeners.clear();
};
