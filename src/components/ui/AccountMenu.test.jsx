import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountMenu from './AccountMenu';

const setup = (props = {}) => {
  const onLogout = vi.fn();
  render(
    <MemoryRouter>
      <AccountMenu name="Ada Lovelace" onLogout={onLogout} {...props} />
      <button>outside</button>
    </MemoryRouter>
  );
  return { onLogout, trigger: screen.getByRole('button', { name: /account menu/i }) };
};

describe('AccountMenu', () => {
  test('is closed to start with, shows the initial, and announces itself as a menu button', () => {
    const { trigger } = setup();
    expect(trigger).toHaveTextContent('A');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('opens on click with Profile and Logout, and focuses the first item', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const items = screen.getAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['Profile', 'Logout']);
    expect(items[0]).toHaveAttribute('href', '/profile');
    expect(document.activeElement).toBe(items[0]);
  });

  test('arrow keys move between items and wrap around', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    const [profile, logout] = screen.getAllByRole('menuitem');
    fireEvent.keyDown(profile, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(logout);
    fireEvent.keyDown(logout, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(profile);
    fireEvent.keyDown(profile, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(logout);
  });

  test('Escape closes it and returns focus to the button', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test('a click outside closes it; so does choosing Profile', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(trigger);
    fireEvent.click(screen.getAllByRole('menuitem')[0]);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('Logout calls the handler and closes the menu', () => {
    const { trigger, onLogout } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Logout' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('a click on the button while open closes it again', () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('without a name it shows a generic icon rather than failing', () => {
    setup({ name: undefined });
    expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
  });
});
