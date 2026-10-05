import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Switch to Bright / Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200 hover:border-slate-600'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
      } ${className}`}
      aria-label="Toggle Dark/Bright Theme"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          {showLabel && <span className="font-mono uppercase tracking-wider text-[11px]">BRIGHT</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          {showLabel && <span className="font-mono uppercase tracking-wider text-[11px]">DARK</span>}
        </>
      )}
    </button>
  );
};
