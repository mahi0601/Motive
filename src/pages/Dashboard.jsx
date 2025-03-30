import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import TaskCard from '../components/TaskCard';
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

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

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

  const handleAddTask = (genre) => {
    const input = newTaskInputs[genre];
    if (!input.title.trim()) return alert('Task title is required.');
    const newId = Date.now().toString();
    const newTask = { ...input, id: newId, genre };
    setTasks(prev => [...prev, newTask]);
    setNewTaskInputs(prev => ({
      ...prev,
      [genre]: { title: '', description: '', priority: 'Medium', showForm: false }
    }));
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
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-gray-100 dark:bg-gray-900 min-h-screen px-6 py-10 font-[Inter]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-8 flex items-center gap-3">
            <FiPlusCircle className="text-pink-500" /> Dashboard
          </h2>

          <div className="mb-6 max-w-md mx-auto">
            <div className="relative">
              <FiSearch className="absolute top-3.5 left-3 text-gray-400 text-sm" />
              <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter tasks by title..." className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm" />
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {genres.map((genre) => (
                <Droppable key={genre} droppableId={genre}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-5 min-h-[450px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{genre}</h3>
                        <button onClick={() => setNewTaskInputs(prev => ({ ...prev, [genre]: { ...prev[genre], showForm: !prev[genre].showForm } }))} className="text-indigo-600 hover:text-white bg-indigo-100 hover:bg-indigo-600 p-1.5 rounded-full transition duration-300">
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
                          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAddTask(genre)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg">
                            Add Task
                          </motion.button>
                        </motion.div>
                      )}

                      <div className="space-y-4 flex-1">
                        {filteredGroupedTasks[genre].map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="hover:scale-[1.01] transition-transform duration-200">
                                <TaskCard task={task} onCalendarClick={() => { setSelectedTask(task); setShowModal(true); }} />
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
    </DashboardLayout>
  );
};

export default Dashboard;
