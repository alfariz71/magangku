import React, { useId } from 'react';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md', className = '' }) => {
  const isLight = variant === 'light';
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const grad0 = `logo_g0_${safeId}`;
  const grad1 = `logo_g1_${safeId}`;

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none font-sans ${className}`}>
      {/* Modern stylized 3D ribbon M Logo matching the screenshot */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id={grad0} x1="6" y1="10" x2="17" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2F80ED" />
              <stop offset="1" stopColor="#0056C6" />
            </linearGradient>
            <linearGradient id={grad1} x1="34" y1="10" x2="23" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#56CCF2" />
              <stop offset="1" stopColor="#2F80ED" />
            </linearGradient>
          </defs>
          <path
            d="M8 32V8L18 20L28 8V32"
            stroke="#2F80ED"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-20"
          />
          {/* Left Wing */}
          <path
            d="M6 10L17 22L17 32L6 20V10Z"
            fill={`url(#${grad0})`}
          />
          {/* Right Wing */}
          <path
            d="M34 10L23 22L23 32L34 20V10Z"
            fill={`url(#${grad1})`}
          />
          {/* Central Fold Overlay */}
          <path
            d="M17 22L20 25.5L23 22L20 18.5L17 22Z"
            fill="#183B66"
            className="opacity-90"
          />
        </svg>
      </div>

      <span className={`font-bold tracking-tight ${textSizes[size]} ${isLight ? 'text-white' : 'text-[#183B66]'}`}>
        Magang<span className="text-[#2F80ED]">Ku</span>
      </span>
    </div>
  );
};
