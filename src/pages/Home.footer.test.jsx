import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

vi.mock('../services/statusService', () => ({ reportLandingFromStatus: vi.fn().mockResolvedValue(undefined) }));

describe('Home footer', () => {
  test('links the Terms and the Privacy Policy', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    const nav = screen.getByRole('navigation', { name: /legal/i });
    expect(nav).toContainElement(screen.getByRole('link', { name: /terms of service/i }));
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
  });

  test('has a link to the example client page near the top', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /see an example client page/i })).toHaveAttribute('href', '/demo');
  });
});
