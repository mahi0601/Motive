import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WelcomeModal from './WelcomeModal';
import { hasSeenWelcome } from '../../utils/welcome';

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter>
      <WelcomeModal onClose={onClose} />
    </MemoryRouter>
  );

describe('WelcomeModal', () => {
  beforeEach(() => localStorage.clear());

  test('is an accessible modal dialog that takes focus', () => {
    renderModal();
    const dialog = screen.getByRole('dialog', { name: /welcome to clientglass/i });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(dialog);
  });

  test('Escape closes it and remembers it was seen', () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(hasSeenWelcome()).toBe(true);
  });

  test('tells new users about the client status link, truthfully', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/give each client a live link/i)).toBeTruthy();
    expect(screen.getByText(/no sign-up/i)).toBeTruthy();
  });
});
