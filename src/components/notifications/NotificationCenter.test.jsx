import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationCenter from './NotificationCenter';
import { getNotifications } from '../../services/notificationService';

vi.mock('../../services/notificationService', () => ({ getNotifications: vi.fn(), markNotificationRead: vi.fn(), clearNotifications: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ bootstrapping: false, isAuthenticated: true }) }));

const item = (type, title) => ({ id: `n-${type}`, type, title, message: 'a message', read: false, createdAt: '2026-10-07T12:00:00.000Z' });
const renderWith = (items) => {
  getNotifications.mockResolvedValue({ data: { items, unreadCount: items.length } });
  return render(<NotificationCenter isOpen onClose={() => {}} onUnreadChange={() => {}} />);
};

describe('NotificationCenter icons', () => {
  beforeEach(() => vi.clearAllMocks());

  test('a client opening the status page has its own icon (an eye), not the generic info one', async () => {
    renderWith([item('client_view', 'Someone opened “Acme Redesign”')]);
    const row = (await screen.findByText('Someone opened “Acme Redesign”')).closest('div[class*="rounded-xl"]');
    expect(row.querySelector('.lucide-eye')).not.toBeNull();
    expect(row.querySelector('.lucide-info')).toBeNull();
  });

  test('other types keep theirs', async () => {
    renderWith([item('client_feedback', 'Client feedback on Acme'), item('info', 'Plain info')]);
    const feedback = (await screen.findByText('Client feedback on Acme')).closest('div[class*="rounded-xl"]');
    const info = screen.getByText('Plain info').closest('div[class*="rounded-xl"]');
    expect(feedback.querySelector('.lucide-message-square')).not.toBeNull();
    expect(info.querySelector('.lucide-info')).not.toBeNull();
  });
});
