import React, { useState } from 'react';

const TaskForm = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ title, description });
      setTitle('');
      setDescription('');
    }}>
      <input
        type="text"
        placeholder="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Task Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <button className="bg-green-500 text-white px-4 py-2 rounded">Add Task</button>
    </form>
  );
};

export default TaskForm;