import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationSocketProvider } from './context/NotificationSocketContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import CommandPalette from './components/CommandPalette';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationSocketProvider>
            <TaskProvider>
              <WorkspaceProvider>
                <Router>
                  <CommandPaletteProvider>
                    <AppRoutes />
                    <CommandPalette />
                  </CommandPaletteProvider>
                </Router>
              </WorkspaceProvider>
            </TaskProvider>
          </NotificationSocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
