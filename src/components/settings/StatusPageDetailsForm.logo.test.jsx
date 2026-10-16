import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusPageDetailsForm from './StatusPageDetailsForm';
import { uploadStatusLogo, removeStatusLogo } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ updateStatusPage: vi.fn(), saveMilestones: vi.fn(), uploadStatusLogo: vi.fn(), removeStatusLogo: vi.fn() }));
const loadWorkspace = vi.fn().mockResolvedValue(undefined);
let mockUser;
let mockWorkspace;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock('../../context/WorkspaceContext', () => ({ useWorkspace: () => ({ workspace: mockWorkspace, loadWorkspace }) }));

const file = (name, type, size = 100) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const pick = (f) => fireEvent.change(screen.getByLabelText(/your logo/i), { target: { files: [f] } });

describe('StatusPageDetailsForm: logo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    mockUser = { id: 'o1', isPro: true };
    mockWorkspace = { id: 'ws-1', name: 'Acme', statusAccent: 'teal', statusLogoUpdatedAt: null };
  });

  test('on the free plan it says the logo needs Pro and offers no upload', () => {
    mockUser = { id: 'o1', isPro: false };
    render(<StatusPageDetailsForm />);
    expect(screen.getByText(/upgrade to pro to show your own logo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/your logo/i)).toBeNull();
  });

  test('a PNG is uploaded at once, previewed, and the workspace refreshed', async () => {
    uploadStatusLogo.mockResolvedValue({ data: { success: true } });
    render(<StatusPageDetailsForm />);
    const f = file('logo.png', 'image/png');
    pick(f);
    await waitFor(() => expect(uploadStatusLogo).toHaveBeenCalledWith('ws-1', f));
    expect(await screen.findByRole('img', { name: /logo preview/i })).toHaveAttribute('src', 'blob:preview');
    expect(loadWorkspace).toHaveBeenCalled();
  });

  test.each([
    ['an SVG', file('logo.svg', 'image/svg+xml'), /png or jpeg/i],
    ['a GIF', file('logo.gif', 'image/gif'), /png or jpeg/i],
    ['a file over 256 KB', file('big.png', 'image/png', 300 * 1024), /too large/i],
  ])('refuses %s before sending anything', async (_l, f, message) => {
    render(<StatusPageDetailsForm />);
    pick(f);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(uploadStatusLogo).not.toHaveBeenCalled();
  });

  test('the server’s reason is shown when the upload fails', async () => {
    uploadStatusLogo.mockRejectedValue({ response: { data: { message: 'The logo must be a PNG or JPEG image.' } } });
    render(<StatusPageDetailsForm />);
    pick(file('logo.png', 'image/png'));
    expect(await screen.findByRole('alert')).toHaveTextContent('The logo must be a PNG or JPEG image.');
  });

  test('with a logo set it says so, offers Replace and Remove, and Remove calls the server', async () => {
    mockWorkspace = { ...mockWorkspace, statusLogoUpdatedAt: '2026-10-16T00:00:00.000Z' };
    removeStatusLogo.mockResolvedValue({ data: { success: true } });
    render(<StatusPageDetailsForm />);
    expect(screen.getByText(/a logo is set/i)).toBeInTheDocument();
    expect(screen.getByText(/replace logo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove logo/i }));
    await waitFor(() => expect(removeStatusLogo).toHaveBeenCalledWith('ws-1'));
    expect(loadWorkspace).toHaveBeenCalled();
  });
});
