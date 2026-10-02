// Whether this browser has already seen the one-time welcome dialog. A per-browser
// convenience only (private windows and blocked storage just show it again), kept
// out of the component file so that file exports only a component.
const STORAGE_KEY = 'motive_onboarded';

export const hasSeenWelcome = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const markWelcomeSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* storage unavailable: the dialog will simply show again */
  }
};
