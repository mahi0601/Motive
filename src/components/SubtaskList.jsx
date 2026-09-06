import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FiPlus, FiCheckSquare } from 'react-icons/fi';
import SubtaskItem from './SubtaskItem';
import { getSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../services/subtaskService';

const SubtaskList = ({ taskId }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!taskId) return;
    (async () => {
      try {
        const { data } = await getSubtasks(taskId);
        setSubtasks(data.subtasks || []);
      } catch (e) {
        console.error('Failed to load subtasks', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await createSubtask(taskId, title.trim());
      setSubtasks((prev) => [...prev, data.subtask]);
      setTitle('');
    } catch (e) {
      console.error('Failed to add subtask', e);
    }
  };

  const handleToggle = async (subtask) => {
    const next = !subtask.done;
    setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, done: next } : s)));
    try {
      await updateSubtask(subtask.id, { done: next });
    } catch (e) {
      console.error('Failed to update subtask', e);
      setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, done: !next } : s))); // roll back
    }
  };

  const handleDelete = async (subtask) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtask.id));
    try {
      await deleteSubtask(subtask.id);
    } catch (e) {
      console.error('Failed to delete subtask', e);
      setSubtasks((prev) => [...prev, subtask]); // roll back
    }
  };

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
        <FiCheckSquare className="text-brand-500" />
        Subtasks {subtasks.length > 0 && <span className="text-gray-400">({doneCount}/{subtasks.length})</span>}
      </h4>

      {!loading && subtasks.length > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all"
            style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <AnimatePresence>
          {subtasks.map((s) => (
            <SubtaskItem
              key={s.id}
              subtask={s}
              onToggle={() => handleToggle(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2">
        <FiPlus className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </form>
    </div>
  );
};

export default SubtaskList;
