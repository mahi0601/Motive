import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { getComments, addComment } from '../../services/commentService';
import { getWorkspaces } from '../../services/workspaceService';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

// Mentions are authored inline as @[Display Name](userId) and rendered back
// as a highlighted chip — same token format the backend parses to decide
// who to notify (see comment.controller.js).
const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

const renderWithMentions = (text) => {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={m.index} className="rounded bg-brand-soft px-1 font-medium text-brand-600 dark:text-brand-400">
        @{m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [members, setMembers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null); // string while the picker is open, else null
  const [mentionStart, setMentionStart] = useState(null); // index of the '@' that triggered it
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    (async () => {
      try {
        const { data } = await getComments(taskId);
        setComments(data.comments || []);
      } catch (e) {
        logger.warn('Failed to load comments', { taskId, error: e.message });
      } finally {
        setLoading(false);
      }
    })();
    // Workspace members are the mention candidates — there's no per-task
    // sharing model in this app, so "who can be @mentioned" is scoped to
    // your own workspace rather than "who has access to this task".
    (async () => {
      try {
        const { data } = await getWorkspaces();
        const all = (data.workspaces[0]?.members || []).map((m) => m.user).filter(Boolean);
        setMembers(all);
      } catch (e) {
        logger.warn('Failed to load workspace members', { error: e.message });
      }
    })();
  }, [taskId]);

  const filteredMembers = useMemo(() => {
    if (mentionQuery == null) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 5);
  }, [mentionQuery, members]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    const caret = e.target.selectionStart;
    const upToCaret = value.slice(0, caret);
    const atIndex = upToCaret.lastIndexOf('@');
    if (atIndex === -1 || /\s/.test(upToCaret.slice(atIndex + 1))) {
      setMentionQuery(null);
      return;
    }
    setMentionStart(atIndex);
    setMentionQuery(upToCaret.slice(atIndex + 1));
  };

  const selectMention = (member) => {
    const before = text.slice(0, mentionStart);
    const after = text.slice(mentionStart + 1 + (mentionQuery?.length || 0));
    const token = `@[${member.name}](${member.id})`;
    setText(`${before}${token} ${after}`);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await addComment(taskId, text.trim());
      setComments((prev) => [...prev, data.comment]);
      setText('');
    } catch (e) {
      logger.warn('Failed to add comment', { taskId, error: e.message });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-xl border border-light-border bg-light-surface p-6 shadow-sm dark:border-dark-border dark:bg-dark-raised"
    >
      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-light-text dark:text-white">
        💬 Comments ({comments.length})
      </h4>

      <form onSubmit={handleSubmit} className="relative mb-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Add a comment… use @ to mention someone"
              rows={3}
              className="w-full resize-none rounded-xl border border-light-border bg-light-surface px-4 py-3 text-light-text outline-none transition focus:ring-2 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-raised dark:text-white"
            />
            {mentionQuery != null && filteredMembers.length > 0 && (
              <div className="absolute z-10 mt-1 w-64 rounded-lg border border-light-border bg-light-surface py-1 shadow-lg dark:border-dark-border dark:bg-dark-raised">
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectMention(m);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-light-border/40 dark:hover:bg-white/5"
                  >
                    <span className="font-medium text-light-text dark:text-white">{m.name}</span>
                    <span className="text-xs text-light-muted">{m.email}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-sm transition hover:shadow-md"
              >
                <Send className="h-4 w-4" />
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-sm text-light-muted">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-light-muted dark:text-dark-muted">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-light-border bg-light-border/30 p-4 dark:border-dark-border dark:bg-dark-raised/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white">
                  {(c.user?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-light-text dark:text-white">{c.user?.name || 'Someone'}</p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">{new Date(c.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm leading-relaxed text-light-text dark:text-dark-muted">
                    {renderWithMentions(c.text)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default CommentSection;
