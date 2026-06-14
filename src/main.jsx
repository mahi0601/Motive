import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/global.css';

// One-time cleanup of legacy client-side data from the old mock-based app.
// Tasks/activity now live in the backend, so these stale keys are removed.
['tasks', 'taskActivities'].forEach((k) => localStorage.removeItem(k));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
