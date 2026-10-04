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

// Public client status link. POST enables sharing and returns the raw token
// ONCE ({ token, shareEnabledAt }) — calling it again rotates the link and
// kills the old one. DELETE turns sharing off.
export const enableShare = (workspaceId) => api.post(`/api/workspaces/${workspaceId}/share`);
// Owner-only: what the public status page says about the project. See
// StatusPageDetailsForm and the backend's updateStatusPage for the fields.
export const updateStatusPage = (workspaceId, data) => api.patch(`/api/workspaces/${workspaceId}/status-page`, data);
// Owner-only: replaces the status page's whole ordered list of milestones. An item
// with an `id` keeps its row (and its sign-off unless its name or date changed);
// without one it is new; any milestone left out is removed. Resolves to the saved
// list, with ids, in order.
export const saveMilestones = (workspaceId, milestones) => api.put(`/api/workspaces/${workspaceId}/milestones`, { milestones });
// The owner's inbox of client feedback from the public status page.
export const listFeedback = (workspaceId, params) => api.get(`/api/workspaces/${workspaceId}/feedback`, { params });
export const markFeedbackRead = (workspaceId, id) => api.patch(`/api/workspaces/${workspaceId}/feedback/${id}/read`);
export const deleteFeedback = (workspaceId, id) => api.delete(`/api/workspaces/${workspaceId}/feedback/${id}`);
// The owner's inbox of client requests. Accepting one makes a task on the board.
export const listRequests = (workspaceId, params) => api.get(`/api/workspaces/${workspaceId}/requests`, { params });
export const acceptRequest = (workspaceId, id, data) => api.post(`/api/workspaces/${workspaceId}/requests/${id}/accept`, data);
export const declineRequest = (workspaceId, id, data) => api.post(`/api/workspaces/${workspaceId}/requests/${id}/decline`, data);
export const updateRequest = (workspaceId, id, data) => api.patch(`/api/workspaces/${workspaceId}/requests/${id}`, data);
export const deleteRequest = (workspaceId, id) => api.delete(`/api/workspaces/${workspaceId}/requests/${id}`);
export const disableShare = (workspaceId) => api.delete(`/api/workspaces/${workspaceId}/share`);

// The /invite/:token public landing page — a different resource root
// (/api/invites, not /api/workspaces/:id/...) since accepting/declining
// happens before the caller is necessarily a member of anything.
export const getInviteByToken = (token) => api.get(`/api/invites/${encodeURIComponent(token)}`);
export const acceptInvite = (token) => api.post(`/api/invites/${encodeURIComponent(token)}/accept`);
export const declineInvite = (token) => api.post(`/api/invites/${encodeURIComponent(token)}/decline`);

// Owner-only: when the client status page was last opened, and its views and visits in the last
// 7 days (a visit is a distinct visitor on a day). Numbers and a time only.
export const getEngagement = (workspaceId) => api.get(`/api/workspaces/${workspaceId}/engagement`);

// Owner-only: copies this workspace's structure into a NEW workspace (tasks reset to To do,
// pages, milestones, optionally the status page wording; never comments, files, people or
// sign-offs). `include` says what to copy; `startDate` is where the earliest date lands.
// Resolves to { workspace: { id, name }, counts }.
export const duplicateWorkspace = (workspaceId, data) => api.post(`/api/workspaces/${workspaceId}/duplicate`, data);

// Every client the caller owns, with the numbers that say who needs attention, most in need
// first. Numbers, dates and flags only.
export const getClientsOverview = () => api.get('/api/workspaces/overview');
