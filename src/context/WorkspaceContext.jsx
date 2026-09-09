import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getPages, createPage, updatePage, deletePage } from '../services/pageService';
import { getWorkspaces } from '../services/workspaceService';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated, bootstrapping } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshPages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPages();
      setPages(data.pages);
    } catch (e) {
      console.error('Failed to load pages', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      const { data } = await getWorkspaces();
      setWorkspace(data.workspaces[0] || null);
    } catch (e) {
      console.error('Failed to load workspace', e);
    }
  }, []);

  // Wait for the auth bootstrap to finish, then load (or clear) workspace data.
  useEffect(() => {
    if (bootstrapping) return;
    if (isAuthenticated) {
      loadWorkspace();
      refreshPages();
    } else {
      setWorkspace(null);
      setPages([]);
    }
  }, [bootstrapping, isAuthenticated, loadWorkspace, refreshPages]);

  const addPage = async (payload = {}) => {
    const { data } = await createPage(payload);
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
      value={{ workspace, pages, loading, refreshPages, loadWorkspace, addPage, editPage, removePage, restorePage }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
