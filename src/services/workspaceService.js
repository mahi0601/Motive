import api from './api';

export const getWorkspaces = () => api.get('/api/workspaces');
export const createWorkspace = (data) => api.post('/api/workspaces', data);

// Invite lifecycle — replaces the old inviteMember, which 404'd unless the
// invitee already had an account. See workspace.service.js on the backend.
export const createInvite = (workspaceId, email, role) =>
  api.post(`/api/workspaces/${workspaceId}/invites`, { email, role });
export const listInvites = (workspaceId) => api.get(`/api/workspaces/${workspaceId}/invites`);
export const resendInvite = (workspaceId, inviteId) =>
  api.post(`/api/workspaces/${workspaceId}/invites/${inviteId}/resend`);
export const revokeInvite = (workspaceId, inviteId) =>
  api.delete(`/api/workspaces/${workspaceId}/invites/${inviteId}`);

export const updateMemberRole = (workspaceId, userId, role) =>
  api.patch(`/api/workspaces/${workspaceId}/members/${userId}`, { role });
export const removeMember = (workspaceId, userId) =>
  api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
export const transferOwnership = (workspaceId, userId) =>
  api.post(`/api/workspaces/${workspaceId}/transfer-ownership`, { userId });
// Self-service, unlike removeMember (owner-acting-on-someone-else) — a
// distinct backend function/route for a distinct authorization shape, see
// workspace.service.js#leaveWorkspace.
export const leaveWorkspace = (workspaceId) => api.delete(`/api/workspaces/${workspaceId}/leave`);

// The /invite/:token public landing page — a different resource root
// (/api/invites, not /api/workspaces/:id/...) since accepting/declining
// happens before the caller is necessarily a member of anything.
export const getInviteByToken = (token) => api.get(`/api/invites/${token}`);
export const acceptInvite = (token) => api.post(`/api/invites/${token}/accept`);
export const declineInvite = (token) => api.post(`/api/invites/${token}/decline`);
