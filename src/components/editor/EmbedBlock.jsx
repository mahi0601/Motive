import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { safeUrl } from '../../utils/richText';

// content: { url: string }
const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
const EmbedBlock = ({ content, onChange }) => {
  const [draft, setDraft] = useState(content?.url || '');
  const [draftError, setDraftError] = useState('');
  // Re-validated on every render, not just at submit time — this is
  // persisted, collaborator-visible data (unlike toggleLink's live-DOM
  // write in richText.js), so a bad value written some other way (a direct
  // API call, or content saved before this check existed) still can't
  // render as a dangerous href.
  const url = safeUrl(content?.url) || undefined;

  if (!url) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = draft.trim();
          if (!trimmed) return;
          if (!safeUrl(trimmed)) {
            setDraftError('Only http:// and https:// links are allowed.');
            return;
          }
          setDraftError('');
          onChange({ url: trimmed });
        }}
        className="flex items-center gap-2 rounded-lg border border-dashed border-light-border p-3 dark:border-dark-border"
      >
        <LinkIcon size={16} className="shrink-0 text-light-muted dark:text-dark-muted" />
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setDraftError('');
          }}
          placeholder="Paste a link (YouTube, or any URL)…"
          className="flex-1 border-none bg-transparent text-sm outline-none"
        />
        <button type="submit" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
          Embed
        </button>
        {draftError && <span className="text-xs text-red-500">{draftError}</span>}
      </form>
    );
  }

  const ytMatch = url.match(YOUTUBE_RE);
  if (ytMatch) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="Embedded video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-light-border p-3 text-sm text-brand-600 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-white/5"
    >
      <ExternalLink size={16} className="shrink-0" />
      <span className="truncate">{url}</span>
    </a>
  );
};

export default EmbedBlock;
