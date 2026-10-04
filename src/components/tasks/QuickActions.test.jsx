import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickActions from './QuickActions';

describe('QuickActions', () => {
  test('has an Import button that calls onImport', () => {
    const onImport = vi.fn();
    render(<QuickActions onAddTask={() => {}} onFilter={() => {}} onSearch={() => {}} onCalendar={() => {}} onMomentum={() => {}} onImport={onImport} />);
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  test('the Import button is left out when nothing handles it', () => {
    render(<QuickActions onAddTask={() => {}} onFilter={() => {}} onSearch={() => {}} onCalendar={() => {}} onMomentum={() => {}} />);
    expect(screen.queryByRole('button', { name: /import/i })).toBeNull();
  });

  test('has a Weekly update button that calls onWeeklyUpdate, and leaves it out when nothing handles it', () => {
    const onWeeklyUpdate = vi.fn();
    const { unmount } = render(<QuickActions onAddTask={() => {}} onFilter={() => {}} onSearch={() => {}} onCalendar={() => {}} onMomentum={() => {}} onWeeklyUpdate={onWeeklyUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /weekly update/i }));
    expect(onWeeklyUpdate).toHaveBeenCalledTimes(1);
    unmount();
    render(<QuickActions onAddTask={() => {}} onFilter={() => {}} onSearch={() => {}} onCalendar={() => {}} onMomentum={() => {}} />);
    expect(screen.queryByRole('button', { name: /weekly update/i })).toBeNull();
  });
});
