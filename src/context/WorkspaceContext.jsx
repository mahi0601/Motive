import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getPages, createPage, updatePage, deletePage } from '../services/pageService';
import { getWorkspaces } from '../services/workspaceService';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

const WorkspaceContext = createContext();

// Per-viewer convenience only (which workspace to default to on reload) —
// never a source of truth. Wrapped in try/catch since a private window or
// blocked site data can make localStorage throw.
const ACTIVE_WORKSPACE_KEY = 'motive_active_workspace_id';
const getSavedWorkspaceId = () => {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  } catch {
    return null;
  }
};
const saveWorkspaceId = (id) => {
  try {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  } catch {
    // ignore — worst case, the next reload just falls back to workspaces[0]
  }
};

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated, bootstrapping } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  // Full list, not just the active one — needed so accepting an invite into
  // a second workspace is actually visible in the UI instead of silently
  // staying on workspaces[0] forever (see loadWorkspace below).
  const [workspaces, setWorkspaces] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  // False until the first workspace lookup has finished (success or failure).
  // Task/page loaders wait on this so they don't fire once unscoped and then
  // again once the active workspace is known.
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const workspaceId = workspace?.id;

  // Only the newest request may write `pages` — switching workspaces quickly
  // must not let a slower, stale response overwrite the current workspace's tree.
  const pagesRequest = useRef(0);

  const refreshPages = useCallback(async () => {
    if (!workspaceId) return;
    const requestId = ++pagesRequest.current;
    setLoading(true);
    try {
      const { data } = await getPages(workspaceId);
      if (requestId === pagesRequest.current) setPages(data.pages);
    } catch (e) {
      logger.warn('Failed to load pages', { error: e.message });
    } finally {
      if (requestId === pagesRequest.current) setLoading(false);
    }
  }, [workspaceId]);

  const loadWorkspace = useCallback(async () => {
    try {
      const { data } = await getWorkspaces();
      setWorkspaces(data.workspaces);
      const savedId = getSavedWorkspaceId();
      const active = data.workspaces.find((w) => w.id === savedId) || data.workspaces[0] || null;
      setWorkspace(active);
    } catch (e) {
      logger.warn('Failed to load workspace', { error: e.message });
    } finally {
      setWorkspaceReady(true);
    }
  }, []);

  // For the workspace switcher — no re-fetch needed, just changes which
  // already-loaded workspace is active, and remembers the choice.
  const switchWorkspace = useCallback((id) => {
    setWorkspaces((current) => {
      const next = current.find((w) => w.id === id);
      if (next) {
        setWorkspace(next);
        saveWorkspaceId(id);
      }
      return current;
    });
  }, []);

  // Wait for the auth bootstrap to finish, then load (or clear) workspace data.
  useEffect(() => {
    if (bootstrapping) return;
    if (isAuthenticated) {
      loadWorkspace();
    } else {
      setWorkspace(null);
      setWorkspaces([]);
      setPages([]);
      setWorkspaceReady(false);
    }
  }, [bootstrapping, isAuthenticated, loadWorkspace]);

  // The page tree belongs to the ACTIVE workspace — reload it whenever that
  // changes (initial load, or the user switching workspaces). Previously pages
  // were fetched once, unscoped, so switching changed nothing in the sidebar.
  useEffect(() => {
    if (!isAuthenticated || !workspaceId) return;
    setPages([]);
    refreshPages();
  }, [isAuthenticated, workspaceId, refreshPages]);

  // New pages land in the workspace the user is currently working in.
  const addPage = async (payload = {}) => {
    const { data } = await createPage({ workspaceId, ...payload });
    setPages((prev) => [...prev, data.page]);
    return data.page;
  };

  const editPage = async (id, payload) => {
    const { data } = await updatePage(id, payload);
    setPages((prev) => prev.map((p) => (p.id === id ? data.page : p)));
    return data.page;
  };

  const removePage = async (id) => {
    await deletePage(id);
    // archived pages + descendants disappear from the tree
    setPages((prev) => prev.filter((p) => p.id !== id && p.parentId !== id));
    await refreshPages();
  };

  // Undo for removePage — the backend only archives (blocks are left
  // intact), so un-archiving genuinely restores the page's real content.
  const restorePage = async (id) => {
    await editPage(id, { archived: false });
    await refreshPages();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        workspaces,
        workspaceReady,
        switchWorkspace,
        pages,
        loading,
        refreshPages,
        loadWorkspace,
        addPage,
        editPage,
        removePage,
        restorePage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
