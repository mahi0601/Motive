import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus, Trash2, FileText, LayoutTemplate } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const PageNode = ({ page, allPages, depth, currentId, onAdd, onDelete, navigate }) => {
  const [open, setOpen] = useState(true);
  const children = allPages.filter((p) => String(p.parentId) === String(page._id));
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm cursor-pointer
          ${
            String(currentId) === String(page._id)
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => navigate(`/page/${page._id}`)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="shrink-0 text-gray-400"
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
            onAdd(page._id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500"
          title="Add sub-page"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page._id);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
          title="Delete page"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open &&
        children.map((child) => (
          <PageNode
            key={child._id}
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
  const { pages, addPage, removePage } = useWorkspace();
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
    if (page?._id) go(`/page/${page._id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this page and its sub-pages?')) {
      await removePage(id);
      if (String(currentId) === String(id)) navigate('/');
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pages</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => go('/templates')}
            className="text-gray-400 hover:text-brand-500"
            title="New from template"
          >
            <LayoutTemplate size={15} />
          </button>
          <button
            onClick={() => handleAdd(null)}
            className="text-gray-400 hover:text-brand-500"
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
            className="px-2 py-1 text-sm text-gray-400 hover:text-indigo-500"
          >
            + New page
          </button>
        ) : (
          roots.map((page) => (
            <PageNode
              key={page._id}
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
