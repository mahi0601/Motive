import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <WorkspaceProvider>
            <Router>
              <AppRoutes />
            </Router>
          </WorkspaceProvider>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;