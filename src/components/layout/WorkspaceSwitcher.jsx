import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

// Lives in the sidebar (not the header) so it's reachable on mobile — the
// header copy was `hidden sm:block`, which left a phone user with no way to
// reach a workspace they'd joined via invite. Only renders once there's
// actually something to switch between; a solo user never sees it.
//
// Switching changes what the dashboard, calendar and page tree show (see
// WorkspaceContext / useTasks): everything is scoped to the active workspace.
const WorkspaceSwitcher = ({ onSwitch }) => {
  const { user } = useAuth();
  const { workspace, workspaces, switchWorkspace } = useWorkspace();

  if (workspaces.length < 2) return null;

  const roleOf = (w) =>
    w.ownerId === user?.id ? 'Owner' : capitalize(w.members?.find((m) => m.userId === user?.id)?.role);

  return (
    <div className="mb-5">
      <label
        htmlFor="workspace-switcher"
        className="mb-1.5 block px-1 text-[11px] font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted"
      >
        Workspace
      </label>
      <select
        id="workspace-switcher"
        value={workspace?.id || ''}
        onChange={(e) => {
          switchWorkspace(e.target.value);
          onSwitch?.();
        }}
        className="w-full truncate rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
      >
        {workspaces.map((w) => {
          const role = roleOf(w);
          return (
            <option key={w.id} value={w.id}>
              {w.icon ? `${w.icon} ` : ''}
              {w.name}
              {role ? ` (${role})` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
};

const capitalize = (s) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : '');

export default WorkspaceSwitcher;
