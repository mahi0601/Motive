import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title="Toggle theme"
      className="ml-4 !bg-gray-200 dark:!bg-gray-700 text-gray-700 dark:text-white px-3 py-2 rounded-lg transition-all"
    >
      {isDark ? <Sun className="inline w-5 h-5" /> : <Moon className="inline w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
