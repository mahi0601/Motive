import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Trash2, FileText, LayoutTemplate } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

const PageNode = ({ page, allPages, depth, currentId, onAdd, onDelete, navigate }) => {
  const [open, setOpen] = useState(true);
  const children = allPages.filter((p) => String(p.parentId) === String(page.id));
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm cursor-pointer
          ${
            String(currentId) === String(page.id)
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
              : 'text-light-text dark:text-dark-muted hover:bg-light-border/40 dark:hover:bg-white/5'
          }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => navigate(`/page/${page.id}`)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="shrink-0 text-light-muted dark:text-dark-muted"
        >
          {hasChildren ? (
            open ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="inline-block w-[14px]" />
          )}
        </button>
        <span className="shrink-0">{page.icon || <FileText size={14} />}</span>
        <span className="flex-1 truncate">{page.title || 'Untitled'}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(page.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-light-muted dark:text-dark-muted hover:text-brand-500"
          title="Add sub-page"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-light-muted dark:text-dark-muted hover:text-semantic-danger-500 dark:hover:text-semantic-danger-dark"
          title="Delete page"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open &&
        children.map((child) => (
          <PageNode
            key={child.id}
            page={child}
            allPages={allPages}
            depth={depth + 1}
            currentId={currentId}
            onAdd={onAdd}
            onDelete={onDelete}
            navigate={navigate}
          />
        ))}
    </div>
  );
};

const PageTree = ({ onNavigate }) => {
  const { pages, addPage, removePage, restorePage } = useWorkspace();
  const { notify } = useToast();
  const navigate = useNavigate();
  const { id: currentId } = useParams();

  // Navigate and (on mobile) close the drawer.
  const go = (path) => {
    navigate(path);
    onNavigate?.();
  };

  const roots = pages.filter((p) => !p.parentId);

  const handleAdd = async (parentId = null) => {
    const page = await addPage({ parentId, title: 'Untitled' });
    if (page?.id) go(`/page/${page.id}`);
  };

  const handleDelete = async (id) => {
    const page = pages.find((p) => p.id === id);
    await removePage(id);
    if (String(currentId) === String(id)) navigate('/');
    notify('info', 'Page deleted', page?.title || 'Untitled', {
      label: 'Undo',
      onAction: () => restorePage(id),
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">Docs</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => go('/templates')}
            className="text-light-muted dark:text-dark-muted hover:text-brand-500"
            title="New from template"
          >
            <LayoutTemplate size={15} />
          </button>
          <button
            onClick={() => handleAdd(null)}
            className="text-light-muted dark:text-dark-muted hover:text-brand-500"
            title="New blank page"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="space-y-0.5 max-h-[40vh] overflow-y-auto pr-1">
        {roots.length === 0 ? (
          <button
            onClick={() => handleAdd(null)}
            className="px-2 py-1 text-sm text-light-muted dark:text-dark-muted hover:text-brand-500"
          >
            + New page
          </button>
        ) : (
          roots.map((page) => (
            <PageNode
              key={page.id}
              page={page}
              allPages={pages}
              depth={0}
              currentId={currentId}
              onAdd={handleAdd}
              onDelete={handleDelete}
              navigate={go}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PageTree;
