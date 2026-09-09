import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationSocketProvider } from './context/NotificationSocketContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import CommandPalette from './components/app/CommandPalette';
import { useNativeOAuthCallback } from './hooks/useNativeOAuthCallback';

// Renders nothing — just mounts the Google Sign-In deep-link listener for the
// native (Capacitor Android) build. Needs to live inside <Router> (uses
// useNavigate) and inside AuthProvider/ToastProvider (both already ancestors).
const NativeOAuthListener = () => {
  useNativeOAuthCallback();
  return null;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationSocketProvider>
            <WorkspaceProvider>
              <Router>
                <CommandPaletteProvider>
                  <NativeOAuthListener />
                  <AppRoutes />
                  <CommandPalette />
                </CommandPaletteProvider>
              </Router>
            </WorkspaceProvider>
          </NotificationSocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
