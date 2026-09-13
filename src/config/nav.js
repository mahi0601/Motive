// Single source of truth for the app's primary destinations — read by both
// the desktop Sidebar and (Phase 4) the mobile bottom tab bar, and mirrored
// into the command palette's "Go to…" actions, so a rename here never drifts
// out of sync the way "Statistics"/"Analytics"/"/stats" did previously.
//
// `Icon` is exported as the component itself (not JSX) so each consumer can
// size/style it independently (the sidebar renders it inline; a future tab
// bar renders it above a label).
import { BarChart2, Calendar, LayoutGrid, Settings, User } from 'lucide-react';

// Daily destinations — co-equal, one tap/click away.
export const PRIMARY_NAV = [
  { id: 'my-work', label: 'My Work', path: '/dashboard', Icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', path: '/calendar', Icon: Calendar },
  { id: 'momentum', label: 'Momentum', path: '/momentum', Icon: BarChart2 },
];

// Occasional destinations — rendered as a de-emphasized footer group in the
// sidebar rather than co-equal nav items. Templates has no entry here on
// purpose: it's reachable from the Docs tree's "New from template" action,
// not a standalone destination (see PageTree.jsx).
export const SECONDARY_NAV = [
  { id: 'settings', label: 'Settings', path: '/settings', Icon: Settings },
  { id: 'profile', label: 'Profile', path: '/profile', Icon: User },
];
