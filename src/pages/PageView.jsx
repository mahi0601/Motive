import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Plus, LayoutTemplate, Check } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import BlockEditor from '../components/BlockEditor';
import { getPage } from '../services/pageService';
import { saveTemplate } from '../services/templateService';
import { useWorkspace } from '../context/WorkspaceContext';

const PageView = () => {
  const { id } = useParams();
  const { editPage, addPage } = useWorkspace();
  const [page, setPage] = useState(null);
  const [savedTpl, setSavedTpl] = useState(false);
  const titleRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await getPage(id);
      if (mounted) setPage(data);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (page && titleRef.current && titleRef.current.textContent !== page.title) {
      titleRef.current.textContent = page.title === 'Untitled' ? '' : page.title;
    }
  }, [page?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleInput = (e) => {
    const title = e.currentTarget.textContent || 'Untitled';
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      editPage(id, { title: title.trim() || 'Untitled' });
    }, 500);
  };

  const toggleFavorite = () => {
    editPage(id, { favorite: !page.favorite }).then((p) => setPage(p));
  };

  const addSubPage = async () => {
    await addPage({ parentId: id, title: 'Untitled' });
  };

  const saveAsTemplate = async () => {
    const name = window.prompt('Name this template:', page.title || 'My template');
    if (!name) return;
    try {
      await saveTemplate({ pageId: id, name, icon: page.icon });
      setSavedTpl(true);
      setTimeout(() => setSavedTpl(false), 2500);
    } catch (e) {
      console.error('Failed to save template', e);
    }
  };

  if (!page) {
    return (
      <DashboardLayout>
        <div className="p-10 text-gray-400">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-4 flex items-center gap-3 text-sm text-gray-400">
          <span className="text-3xl">{page.icon || '📄'}</span>
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1 hover:text-yellow-500 ${
              page.favorite ? 'text-yellow-500' : ''
            }`}
            title="Toggle favorite"
          >
            <Star size={16} fill={page.favorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={addSubPage} className="flex items-center gap-1 hover:text-indigo-500">
            <Plus size={16} /> Sub-page
          </button>
          <button
            onClick={saveAsTemplate}
            className="flex items-center gap-1 hover:text-brand-500"
            title="Save this page as a reusable template"
          >
            {savedTpl ? <Check size={16} className="text-emerald-500" /> : <LayoutTemplate size={16} />}
            {savedTpl ? 'Saved!' : 'Save as template'}
          </button>
        </div>

        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Untitled"
          onInput={handleTitleInput}
          className="mb-6 text-4xl font-bold outline-none text-gray-900 dark:text-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 dark:empty:before:text-gray-600"
        />

        <BlockEditor pageId={id} />
      </div>
    </DashboardLayout>
  );
};

export default PageView;
