import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import TaskCard from '../components/TaskCard';
import EnhancedTaskCard from '../components/EnhancedTaskCard';
import TaskForm from '../components/TaskForm';
import QuickActions from '../components/QuickActions';
import TaskAnalytics from '../components/TaskAnalytics';
import ActivityFeed from '../components/ActivityFeed';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import NotificationToast from '../components/NotificationToast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { FiPlusCircle, FiSearch } from 'react-icons/fi';
import { gapi } from 'gapi-script';
import TimePickerModal from '../components/TimePickerModel';

const CLIENT_ID = '1094576727672-7dqakbaer20l2o50qs3u5vfiqdvin3jj.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBNxmFKvXZMM9LxJvs6u2ZqX-1Yp05JGMo';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

const initialTasks = [
  { id: '1', title: 'Learn React', description: 'Go through docs', genre: 'Development', priority: 'High' },
  { id: '2', title: 'Buy Groceries', description: 'Milk, Eggs', genre: 'Personal', priority: 'Low' },
  { id: '3', title: 'Workout', description: 'Cardio session', genre: 'Health', priority: 'Medium' },
  { id: '4', title: 'Design Mockups', description: 'UI improvements', genre: 'Design', priority: 'Medium' },
];

const genres = ['Personal', 'Finance', 'Health', 'Development'];
const priorities = ['High', 'Medium', 'Low'];

const Dashboard = () => {
  const [tasks, setTasks] = useState(() => {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : initialTasks;
  });
  const [filterText, setFilterText] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState(
    genres.reduce((acc, genre) => {
      acc[genre] = { title: '', description: '', priority: 'Medium', showForm: false };
      return acc;
    }, {})
  );
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addNotification = (type, title, message = '') => {
    const id = Date.now();
    setNotifications([...notifications, { id, type, title, message }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const logActivity = (type, taskTitle, message) => {
    const activities = JSON.parse(localStorage.getItem('taskActivities') || '[]');
    activities.unshift({
      type,
      taskTitle,
      message,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('taskActivities', JSON.stringify(activities.slice(0, 50)));
  };

  useEffect(() => {
    function start() {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        })
        .then(() => {
          if (!gapi.auth2.getAuthInstance()) {
            gapi.auth2.init({ client_id: CLIENT_ID });
          }
        })
        .catch((err) => console.error("Google API init error:", err));
    }
    gapi.load('client:auth2', start);
  }, []);

  const createCalendarEvent = async (task, startTime, endTime) => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) return;

    if (!authInstance.isSignedIn.get()) {
      try {
        await authInstance.signIn();
      } catch (err) {
        console.error("Sign-in failed", err);
        return;
      }
    }

    if (!gapi.client?.calendar?.events) return;

    const event = {
      summary: task.title,
      description: task.description,
      start: { dateTime: new Date(startTime).toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: new Date(endTime).toISOString(), timeZone: 'Asia/Kolkata' },
    };

    try {
      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
    } catch (error) {
      console.error("Calendar API Error:", error);
    }
  };

  const handleAddTask = (genre, taskData = null) => {
    if (taskData) {
      const newId = Date.now().toString();
      const newTask = { ...taskData, id: newId, genre: taskData.category || genre };
      setTasks(prev => [...prev, newTask]);
      addNotification('success', 'Task Created', `${newTask.title} has been added`);
      logActivity('created', newTask.title, 'Task was created');
      setShowTaskForm(false);
    } else {
      const input = newTaskInputs[genre];
      if (!input.title.trim()) return alert('Task title is required.');
      const newId = Date.now().toString();
      const newTask = { ...input, id: newId, genre };
      setTasks(prev => [...prev, newTask]);
      setNewTaskInputs(prev => ({
        ...prev,
        [genre]: { title: '', description: '', priority: 'Medium', showForm: false }
      }));
      addNotification('success', 'Task Created', `${newTask.title} has been added`);
      logActivity('created', newTask.title, 'Task was created');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleUpdateTask = (updatedData) => {
    setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updatedData } : t));
    addNotification('success', 'Task Updated', `${updatedData.title} has been updated`);
    logActivity('updated', updatedData.title, 'Task was updated');
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const handleDeleteTask = (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      addNotification('success', 'Task Deleted', `${task.title} has been removed`);
      logActivity('deleted', task.title, 'Task was deleted');
    }
  };

  const handleCompleteTask = (task) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, completed: !t.completed } : t
    ));
    const action = task.completed ? 'marked as incomplete' : 'completed';
    addNotification('success', 'Task Updated', `${task.title} has been ${action}`);
    logActivity('completed', task.title, `Task was ${action}`);
  };

  const handleTimeSelection = (start, end) => {
    createCalendarEvent(selectedTask, start, end);
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const updatedTasks = tasks.map((task) => task.id === draggableId ? { ...task, genre: destination.droppableId } : task);
    setTasks(updatedTasks);
  };

  const filteredGroupedTasks = genres.reduce((acc, genre) => {
    acc[genre] = tasks
      .filter(task => task.genre === genre)
      .filter(task => task.title.toLowerCase().includes(filterText.toLowerCase()));
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-[#f9f9f9] dark:bg-[#0d0d0d] min-h-screen px-6 py-10 font-[Inter]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-1">
              <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
                <FiPlusCircle className="text-indigo-500" /> Dashboard
              </h2>
              <QuickActions
                onAddTask={() => {
                  setEditingTask(null);
                  setShowTaskForm(true);
                }}
                onFilter={() => addNotification('info', 'Filter', 'Filter feature coming soon')}
                onSearch={() => document.querySelector('input[type="text"]')?.focus()}
                onCalendar={() => window.location.href = '/calendar'}
                onStats={() => window.location.href = '/stats'}
              />
            </div>
            <div className="lg:w-80">
              <ActivityFeed limit={3} />
            </div>
          </div>

          <TaskAnalytics tasks={tasks} />

          <div className="mb-6 max-w-md mx-auto">
            <div className="relative">
              <FiSearch className="absolute top-3.5 left-3 text-gray-400 text-sm" />
              <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter tasks by title..." className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300" />
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {genres.map((genre) => (
                <Droppable key={genre} droppableId={genre}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300 p-5 min-h-[450px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{genre}</h3>
                        <button onClick={() => setNewTaskInputs(prev => ({ ...prev, [genre]: { ...prev[genre], showForm: !prev[genre].showForm } }))} className="text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-100 dark:bg-indigo-900/30 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 p-1.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
                          <FiPlusCircle className="text-lg" />
                        </button>
                      </div>

                      {newTaskInputs[genre].showForm && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mb-4">
                          <input type="text" placeholder="Title" value={newTaskInputs[genre].title} onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [genre]: { ...newTaskInputs[genre], title: e.target.value } })} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm" />
                          <input type="text" placeholder="Description" value={newTaskInputs[genre].description} onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [genre]: { ...newTaskInputs[genre], description: e.target.value } })} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm" />
                          <select value={newTaskInputs[genre].priority} onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [genre]: { ...newTaskInputs[genre], priority: e.target.value } })} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm">
                            {priorities.map(p => <option key={p}>{p}</option>)}
                          </select>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAddTask(genre)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                            Add Task
                          </motion.button>
                        </motion.div>
                      )}

                      <div className="space-y-4 flex-1">
                        {filteredGroupedTasks[genre].map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="hover:scale-[1.01] transition-transform duration-200">
                                <EnhancedTaskCard
                                  task={task}
                                  onCalendarClick={() => { setSelectedTask(task); setShowModal(true); }}
                                  onEdit={handleEditTask}
                                  onDelete={handleDeleteTask}
                                  onComplete={handleCompleteTask}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </motion.div>
      {showModal && selectedTask && (
        <TimePickerModal
          task={selectedTask}
          onClose={() => setShowModal(false)}
          onConfirm={handleTimeSelection}
        />
      )}

      {showTaskForm && (
        <TaskForm
          onSubmit={editingTask ? handleUpdateTask : (data) => handleAddTask(data.category, data)}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          initialData={editingTask}
        />
      )}

      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />

      <KeyboardShortcuts />
    </DashboardLayout>
  );
};

export default Dashboard;
