import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import EnhancedTaskCard from './EnhancedTaskCard';
import { FiPlus } from 'react-icons/fi';

const KanbanBoard = ({ tasks = [], onTaskUpdate, onAddTask }) => {
  const columns = [
    { id: 'todo', title: 'To Do', color: 'indigo' },
    { id: 'in-progress', title: 'In Progress', color: 'purple' },
    { id: 'review', title: 'Review', color: 'indigo' },
    { id: 'done', title: 'Done', color: 'purple' }
  ];

  const getTasksByStatus = (status) => {
    return tasks.filter(task => {
      if (status === 'todo') return !task.status || task.status === 'todo';
      if (status === 'done') return task.completed || task.status === 'done';
      return task.status === status;
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const task = tasks.find(t => t.id.toString() === draggableId);
    
    if (task && onTaskUpdate) {
      const newStatus = destination.droppableId;
      const updates = {
        ...task,
        status: newStatus,
        completed: newStatus === 'done'
      };
      onTaskUpdate(updates);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column, colIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIndex * 0.1 }}
            className="flex flex-col"
          >
            <div className={`mb-4 p-4 rounded-xl ${
              column.color === 'indigo'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700'
                : 'bg-gradient-to-r from-purple-600 to-purple-700'
            } text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[400px] p-4 rounded-xl transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-500'
                      : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="space-y-3">
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1
                            }}
                          >
                            <EnhancedTaskCard
                              task={task}
                              onEdit={(t) => onTaskUpdate && onTaskUpdate({ ...t, status: column.id })}
                              onDelete={(t) => onTaskUpdate && onTaskUpdate({ ...t, deleted: true })}
                              onComplete={(t) => onTaskUpdate && onTaskUpdate({ ...t, completed: !t.completed, status: t.completed ? 'todo' : 'done' })}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  {column.id === 'todo' && onAddTask && (
                    <button
                      onClick={() => onAddTask({ status: 'todo' })}
                      className="mt-4 w-full p-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiPlus className="w-5 h-5" />
                      Add Task
                    </button>
                  )}
                </div>
              )}
            </Droppable>
          </motion.div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;

