import { useEffect, useState, useCallback } from 'react';

// Captures the browser's PWA install prompt (fired only when the browser
// decides the app is installable — manifest + service worker + engagement
// heuristics all satisfied) so the UI can offer an explicit "Install" action
// instead of only relying on the browser's own address-bar icon, which most
// users never notice.
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null); // a captured prompt can only be used once
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt && !installed, promptInstall };
};
