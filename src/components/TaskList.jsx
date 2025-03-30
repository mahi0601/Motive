import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, columnId }) => {
  return (
    <Droppable droppableId={columnId}>
      {(provided) => (
        <div
          className="space-y-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[200px]"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {tasks.map((task, index) => (
            <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
              {(provided) => (
                <div
                  className="transition-all duration-200"
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  <TaskCard task={task} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default TaskList;
