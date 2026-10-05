import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();
  const { isDark } = useTheme();

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700 hover:text-cyan-200'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
      } ${className}`}
      aria-label="Switch Language (TH / EN)"
    >
      <Globe className="w-3.5 h-3.5 text-cyan-500" />
      <span>{language === 'th' ? 'TH | ไทย' : 'EN | English'}</span>
    </button>
  );
};
