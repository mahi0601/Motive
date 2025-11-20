import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiUser, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Menu } from '@headlessui/react';

const EnhancedCommentSection = ({ comments = [], onAddComment, onEditComment, onDeleteComment }) => {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment && onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingId) {
      onEditComment && onEditComment(editingId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-lg transition-all duration-300"
    >
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        💬 Comments ({comments.length})
      </h4>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <FiSend className="w-4 h-4" />
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-indigo-500 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-white">
                        {comment.author || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {comment.timestamp ? new Date(comment.timestamp).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    {(onEditComment || onDeleteComment) && (
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                          <FiMoreVertical className="w-4 h-4 text-gray-500" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10">
                          {onEditComment && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleEdit(comment)}
                                  className={`w-full text-left px-4 py-2 text-sm ${
                                    active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                  } text-gray-700 dark:text-gray-300 flex items-center gap-2`}
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                  Edit
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          {onDeleteComment && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onDeleteComment(comment.id)}
                                  className={`w-full text-left px-4 py-2 text-sm ${
                                    active ? 'bg-red-50 dark:bg-red-900/20' : ''
                                  } text-red-600 dark:text-red-400 flex items-center gap-2`}
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </Menu.Items>
                      </Menu>
                    )}
                  </div>
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText('');
                          }}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.text || comment}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedCommentSection;

