import React, { useState, useEffect } from 'react';
import { File, Paperclip, X } from 'lucide-react';
import AttachmentUploader from './AttachmentUploader';
import { getTaskFiles, uploadFile, deleteFile } from '../../services/fileUploadService';
import { logger } from '../../utils/logger';

const AttachmentList = ({ taskId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskId) return;
    (async () => {
      try {
        const { data } = await getTaskFiles(taskId);
        setFiles(data.files || []);
      } catch (e) {
        logger.warn('Failed to load attachments', { taskId, error: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId]);

  const handleUpload = async (file) => {
    setUploading(true);
    setError('');
    try {
      const { data } = await uploadFile(file, taskId);
      setFiles((prev) => [data.file, ...prev]);
    } catch (e) {
      setError(e?.response?.data?.message || 'Upload failed — only PNG, JPG, PDF, and DOCX are supported.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    try {
      await deleteFile(file.id);
    } catch (e) {
      logger.warn('Failed to delete attachment', { fileId: file.id, error: e.message });
      setFiles((prev) => [file, ...prev]); // roll back
    }
  };

  return (
    <div className="mt-6 border-t border-light-border pt-6 dark:border-dark-border">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-light-text dark:text-white">
        <Paperclip className="text-brand-500" />
        Attachments {files.length > 0 && <span className="text-light-muted">({files.length})</span>}
      </h4>

      {!loading && files.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="group flex items-center gap-2 rounded-lg border border-light-border p-2 text-sm dark:border-dark-border"
            >
              <File className="h-4 w-4 shrink-0 text-light-muted" />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-brand-600 hover:underline dark:text-brand-400"
              >
                {f.name}
              </a>
              <button
                onClick={() => handleDelete(f)}
                className="rounded p-1 text-light-muted opacity-0 transition-opacity hover:bg-light-border hover:text-semantic-danger-500 dark:hover:text-semantic-danger-dark group-hover:opacity-100 dark:hover:bg-dark-border"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AttachmentUploader onUpload={handleUpload} />
      {uploading && <p className="mt-1 text-xs text-light-muted">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-semantic-danger-500 dark:text-semantic-danger-dark">{error}</p>}
    </div>
  );
};

export default AttachmentList;
