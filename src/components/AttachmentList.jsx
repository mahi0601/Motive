import React, { useState, useEffect } from 'react';
import { FiPaperclip, FiX, FiFile } from 'react-icons/fi';
import AttachmentUploader from './AttachmentUploader';
import { getTaskFiles, uploadFile, deleteFile } from '../services/fileUploadService';

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
        console.error('Failed to load attachments', e);
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
      console.error('Failed to delete attachment', e);
      setFiles((prev) => [file, ...prev]); // roll back
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
        <FiPaperclip className="text-brand-500" />
        Attachments {files.length > 0 && <span className="text-gray-400">({files.length})</span>}
      </h4>

      {!loading && files.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="group flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-700"
            >
              <FiFile className="h-4 w-4 shrink-0 text-gray-400" />
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
                className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-gray-700"
                aria-label="Remove attachment"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AttachmentUploader onUpload={handleUpload} />
      {uploading && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default AttachmentList;
