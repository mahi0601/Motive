import React from 'react';
import { Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CARD_CLASS } from './cardStyles';

const ThemeCard = () => {
  const { isDark: isDarkMode, toggleTheme: handleToggleTheme } = useTheme();

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="text-brand-500" />
          <h4 className="text-lg font-semibold">Theme Settings</h4>
        </div>
        <div
          className={`relative w-14 h-7 flex items-center bg-light-border dark:bg-dark-surface rounded-full p-1 cursor-pointer transition`}
          onClick={handleToggleTheme}
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
              isDarkMode ? 'translate-x-7' : ''
            }`}
          />
        </div>
      </div>
      <p className="text-sm text-light-muted dark:text-dark-muted mt-2">Toggle between Light and Dark mode.</p>
    </div>
  );
};

export default ThemeCard;
