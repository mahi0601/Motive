import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

// Pages are code-split. A public page must still render once its chunk loads
// (behind the Suspense fallback), with no provider or auth setup.
describe('AppRoutes (lazy pages)', () => {
  test('a lazily loaded public page renders after its chunk resolves', async () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /privacy policy/i })).toBeTruthy();
  });
});
