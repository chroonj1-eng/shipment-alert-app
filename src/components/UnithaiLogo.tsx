import React from 'react';
import officialLogoImg from '../assets/images/unithai_official_original_logo.jpg';

interface UnithaiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  inverted?: boolean;
}

export const UnithaiLogo: React.FC<UnithaiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  inverted = false,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', textTitle: 'text-xs', textSub: 'text-[9px]' },
    md: { box: 'w-9 h-9', textTitle: 'text-sm', textSub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', textTitle: 'text-base', textSub: 'text-xs' },
    xl: { box: 'w-16 h-16', textTitle: 'text-xl', textSub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  // SVG representation of UNITHAI's iconic Three Seagulls in Thai Flag Colors (Red, White, Blue)
  // Flying in unison from East to West symbolizing Teamwork
  const SeagullsIcon = () => (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xs"
    >
      {/* Top Seagull - Thai Flag Red */}
      <path
        d="M20 32 C32 20 44 26 50 32 C56 26 68 20 80 32 C68 26 56 30 50 38 C44 30 32 26 20 32 Z"
        fill="#DC2626"
      />
      {/* Middle Upper Seagull - Thai White Accent / Light Cyan */}
      <path
        d="M14 42 C28 28 42 34 50 40 C58 34 72 28 86 42 C72 34 58 39 50 48 C42 39 28 34 14 42 Z"
        fill="#38BDF8"
      />
      {/* Middle Main Seagull - Thai Flag Royal Deep Blue */}
      <path
        d="M10 52 C26 36 42 42 50 50 C58 42 74 36 90 52 C74 44 58 49 50 60 C42 49 26 44 10 52 Z"
        fill="#1E3A8A"
      />
      {/* Bottom Seagull - Thai Flag Red */}
      <path
        d="M22 62 C34 50 44 55 50 60 C56 55 66 50 78 62 C66 56 56 60 50 68 C44 60 34 56 22 62 Z"
        fill="#DC2626"
      />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className={`relative inline-flex items-center justify-center rounded-xl bg-white p-1 border border-slate-200 shadow-sm overflow-hidden ${currentSize.box} ${className}`}>
        <img
          src={officialLogoImg}
          alt="UNITHAI Shipyard Logo"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center rounded-xl bg-white p-1 border border-slate-200/80 shadow-xs ${currentSize.box} ${className}`}>
        <SeagullsIcon />
      </div>
    );
  }

  // Full variant: Official 3 Seagulls Mark + UNITHAI SHIPYARD Typography
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Emblem Frame with Authentic 3 Seagulls */}
      <div className={`relative shrink-0 rounded-xl bg-white p-1 border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden ${currentSize.box}`}>
        <img
          src={officialLogoImg}
          alt="UNITHAI Shipyard Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-tight select-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight font-sans ${currentSize.textTitle} ${
              inverted ? 'text-white' : 'text-slate-900'
            }`}
          >
            UNITHAI
          </span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-600 text-white font-bold tracking-wider">
            SHIPYARD
          </span>
        </div>
        <span
          className={`font-medium tracking-wider uppercase font-mono ${currentSize.textSub} ${
            inverted ? 'text-cyan-300' : 'text-slate-500'
          }`}
        >
          Shipyard & Engineering
        </span>
      </div>
    </div>
  );
};
