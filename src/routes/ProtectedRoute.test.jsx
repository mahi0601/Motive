import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

let mockAuth;
vi.mock('../context/AuthContext', () => ({ useAuth: () => mockAuth }));
vi.mock('../pages/Auth/TermsGate', () => ({ default: () => <h1>TERMS GATE</h1> }));

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>THE APP</p>} />
        </Route>
        <Route path="/login" element={<p>LOGIN</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  test('lets a signed-in user through', () => {
    mockAuth = { isAuthenticated: true, bootstrapping: false, user: { id: 'u1', termsPending: false } };
    renderGuard();
    expect(screen.getByText('THE APP')).toBeInTheDocument();
  });

  test('holds a brand-new Google account on the agree-to-continue page, and the app is not rendered at all', () => {
    mockAuth = { isAuthenticated: true, bootstrapping: false, user: { id: 'u1', termsPending: true } };
    renderGuard();
    expect(screen.getByText('TERMS GATE')).toBeInTheDocument();
    expect(screen.queryByText('THE APP')).toBeNull();
  });

  test('an older profile saved in the browser (no termsPending at all) is not held', () => {
    mockAuth = { isAuthenticated: true, bootstrapping: false, user: { id: 'u1' } };
    renderGuard();
    expect(screen.getByText('THE APP')).toBeInTheDocument();
  });

  test('a signed-out visitor goes to login', () => {
    mockAuth = { isAuthenticated: false, bootstrapping: false, user: null };
    renderGuard();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  test('while the session is being restored it shows neither the app nor the gate', () => {
    mockAuth = { isAuthenticated: false, bootstrapping: true, user: null };
    renderGuard();
    expect(screen.queryByText('THE APP')).toBeNull();
    expect(screen.queryByText('TERMS GATE')).toBeNull();
    expect(screen.queryByText('LOGIN')).toBeNull();
  });
});
