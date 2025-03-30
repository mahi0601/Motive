import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react'; 
const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="ml-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-3 py-2 rounded-lg transition-all"
    >
      {darkMode ? <Sun className="inline w-5 h-5" /> : <Moon className="inline w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
