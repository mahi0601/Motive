import React, { useEffect, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  subMonths,
  addMonths
} from 'date-fns';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { gapi } from 'gapi-script';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarTasks, setCalendarTasks] = useState([]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const fetchGoogleCalendarEvents = async () => {
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();

      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: start,
        timeMax: end,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.result.items.map((event) => ({
        id: event.id,
        title: event.summary || 'Untitled',
        dueDate: event.start.dateTime || event.start.date,
        htmlLink: event.htmlLink || '#',
      }));

      setCalendarTasks(events);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    }
  };

  useEffect(() => {
    if (gapi?.client?.calendar) {
      fetchGoogleCalendarEvents();
    }
  }, [currentDate]);

  const renderTasksForDay = (day) => {
    const matchedTasks = calendarTasks.filter((task) =>
      task.dueDate && isSameDay(parseISO(task.dueDate), day)
    );

    return matchedTasks.map((task) => (
      <a
        key={task.id}
        href={task.htmlLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs bg-indigo-100 text-indigo-700 rounded px-2 py-1 mt-1 truncate hover:bg-indigo-200 dark:hover:bg-indigo-500"
        title={task.title}
      >
        {task.title}
      </a>
    ));
  };

  const goToPreviousMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 w-full font-[Inter]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FiCalendar className="text-indigo-500" /> Calendar
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          <span className="text-lg font-semibold text-gray-700 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <FiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}

        {daysInMonth.map((day) => (
          <div
            key={day.toISOString()}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 min-h-[90px] text-left bg-gray-50 dark:bg-gray-800"
          >
            <div className="text-sm font-semibold text-gray-700 dark:text-white">
              {format(day, 'd')}
            </div>
            {renderTasksForDay(day)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
