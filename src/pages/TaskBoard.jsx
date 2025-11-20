import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import TaskList from "../components/TaskList";
import { FiList } from 'react-icons/fi';

const initialTasks = [
  { id: 1, title: 'Learn React', description: 'Read React docs & build small projects.', priority: 'High', dueDate: '2025-04-01' },
  { id: 2, title: 'Buy Groceries', description: 'Milk, Eggs, Bread, Fruits', priority: 'Medium', dueDate: '2025-04-02' },
  { id: 3, title: 'Study DSA', description: 'Solve 5 Leetcode problems', priority: 'High', dueDate: '2025-04-03' },
  { id: 4, title: 'Project Deployment', description: 'Deploy ToDo App on Vercel', priority: 'Low', dueDate: '2025-04-04' }
];

const TaskBoard = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(result.source.index, 1);
    reorderedTasks.splice(result.destination.index, 0, movedTask);
    setTasks(reorderedTasks);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-[#0d0d0d] transition-all p-6 font-[Inter]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800 dark:text-white tracking-tight flex items-center gap-3 animate-fadeIn hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
          <FiList className="text-indigo-500" /> Task Board
        </h1>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="w-full max-w-4xl mx-auto animate-fadeIn">
            <TaskList tasks={tasks} columnId="task-list" />
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default TaskBoard;
