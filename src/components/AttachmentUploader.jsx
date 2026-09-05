import React, { useState, useRef } from 'react';
import { FiUploadCloud } from 'react-icons/fi';

const AttachmentUploader = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => e.preventDefault(); // required for onDrop to fire

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <label
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        isDragging
          ? 'border-brand-500 bg-brand-soft'
          : 'border-gray-300 hover:border-brand-400 dark:border-gray-600'
      }`}
    >
      <FiUploadCloud className={`h-8 w-8 ${isDragging ? 'text-brand-500' : 'text-gray-400'}`} />
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Drag a file here, or <span className="font-medium text-brand-500">browse</span>
      </span>
      <input
        type="file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
    </label>
  );
};

export default AttachmentUploader;
