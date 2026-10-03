import React from 'react';
import shieldPng from '../../assets/wepsun-shield.png';

interface WepsunLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'light' | 'dark' | 'auto';
  showText?: boolean;
}

/**
 * Exact Company Shield Logo
 */
export const WepsunShieldLogo: React.FC<{ className?: string; size?: string }> = ({
  className = 'w-10 h-10',
}) => {
  return (
    <img
      src={shieldPng}
      alt="WEPSUN Engineering Solution"
      className={`object-contain select-none shrink-0 drop-shadow-sm ${className}`}
      draggable={false}
    />
  );
};

export const GeometricBlueWLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-10 h-10',
}) => {
  return (
    <img
      src={shieldPng}
      alt="WEPSUN Engineering Solution"
      className={`object-contain select-none shrink-0 drop-shadow-md ${className}`}
      draggable={false}
    />
  );
};

export const GeometricWLogo: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10',
}) => {
  return <GeometricBlueWLogo className={className} />;
};

export const WepsunGeometricBrand: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={shieldPng}
        alt="WEPSUN Engineering Solution"
        className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md shrink-0"
        draggable={false}
      />
      <div className="flex flex-col justify-center leading-none">
        <span className="font-sans font-black text-xl sm:text-2xl text-[#0b2545] tracking-tight leading-none">
          WEPSUN
        </span>
        <span className="font-sans font-bold text-[8.5px] sm:text-[10px] text-slate-700 tracking-[0.22em] mt-1 leading-none">
          ENGINEERING SOLUTION
        </span>
      </div>
    </div>
  );
};

/**
 * Header Brand Lockup with Exact Shield Emblem and Official Typography
 */
export const WepsunHeaderBrand: React.FC<{ className?: string; logoSize?: string; lightTheme?: boolean }> = ({
  className = '',
  logoSize = 'w-11 h-11 sm:w-12 sm:h-12',
  lightTheme = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        <img
          src={shieldPng}
          alt="WEPSUN Engineering Solution"
          className={`${logoSize} object-contain drop-shadow-sm`}
          draggable={false}
        />
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span className={`font-sans font-black text-xl sm:text-2xl tracking-tight leading-none ${lightTheme ? 'text-[#0b2545]' : 'text-white'}`}>
          WEPSUN
        </span>
        <span className={`font-sans font-bold text-[9px] sm:text-[10px] tracking-[0.24em] mt-0.5 leading-none ${lightTheme ? 'text-[#0b2545]' : 'text-sky-200'}`}>
          ENGINEERING SOLUTION
        </span>
        <div className="h-[1.5px] w-full bg-gradient-to-r from-sky-500 via-sky-400 to-transparent my-1" />
        <span className={`text-[10px] sm:text-[11px] font-semibold leading-none ${lightTheme ? 'text-[#0088cc]' : 'text-sky-300'}`}>
          Smart Lift Service Operations
        </span>
      </div>
    </div>
  );
};

export const WepsunLogoIcon: React.FC<{ className?: string; size?: string }> = ({
  className = 'w-10 h-10',
}) => {
  return (
    <img
      src={shieldPng}
      alt="WEPSUN Engineering Solution"
      className={`object-contain select-none shrink-0 drop-shadow-sm ${className}`}
      draggable={false}
    />
  );
};

export const ElevatorDoorIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-7 h-7 text-white',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line x1="7" y1="7" x2="25" y2="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="5" r="1" fill="currentColor" />
      <rect x="7" y="9" width="7.5" height="17" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="13" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="17.5" y="9" width="7.5" height="17" rx="1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="13" x2="20" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Top Navbar Brand (used in Header.tsx)
 */
export const WepsunLiftServicesLogo: React.FC<{ className?: string; lightTheme?: boolean }> = ({
  className = '',
  lightTheme = false,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-white/20">
        <img
          src={shieldPng}
          alt="WEPSUN Engineering Solution"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-black text-base sm:text-lg tracking-wider ${lightTheme ? 'text-[#0E2238]' : 'text-white'}`}>
          WEPSUN
        </span>
        <span className={`text-[10px] sm:text-[11px] font-semibold tracking-wide -mt-0.5 ${lightTheme ? 'text-sky-700' : 'text-sky-300'}`}>
          Engineering Solution
        </span>
      </div>
    </div>
  );
};

/**
 * Universal Brand Component with exact Shield Emblem
 */
export const WepsunLogo: React.FC<WepsunLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  theme = 'light',
  showText = true,
}) => {
  const sizeMap = {
    xs: { shield: 'w-7 h-7', title: 'text-sm', sub: 'text-[8px]', bar: 'my-0.5' },
    sm: { shield: 'w-8 h-8', title: 'text-base', sub: 'text-[9px]', bar: 'my-0.5' },
    md: { shield: 'w-10 h-10', title: 'text-xl', sub: 'text-[10px]', bar: 'my-1' },
    lg: { shield: 'w-12 h-12', title: 'text-2xl', sub: 'text-[11px]', bar: 'my-1' },
    xl: { shield: 'w-16 h-16', title: 'text-3xl', sub: 'text-xs', bar: 'my-1.5' },
    '2xl': { shield: 'w-20 h-20', title: 'text-4xl', sub: 'text-sm', bar: 'my-2' },
  };

  const s = sizeMap[size] || sizeMap.md;
  const isDark = theme === 'dark';

  if (variant === 'icon' || !showText) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src={shieldPng}
          alt="WEPSUN Engineering Solution"
          className={`${s.shield} object-contain select-none shrink-0 drop-shadow-sm`}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        <img
          src={shieldPng}
          alt="WEPSUN Engineering Solution"
          className={`${s.shield} object-contain select-none shrink-0 drop-shadow-sm`}
          draggable={false}
        />
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span className={`font-sans font-black ${s.title} tracking-tight leading-none ${isDark ? 'text-white' : 'text-[#0b2545]'}`}>
          WEPSUN
        </span>
        <span className={`font-sans font-bold ${s.sub} tracking-[0.2em] mt-0.5 leading-none ${isDark ? 'text-sky-300' : 'text-[#0b2545]'}`}>
          ENGINEERING SOLUTION
        </span>
        <div className={`h-[1.5px] w-full bg-gradient-to-r from-sky-500 via-sky-400 to-transparent ${s.bar}`} />
        <span className={`text-[9px] sm:text-[10px] font-semibold leading-none ${isDark ? 'text-sky-200' : 'text-[#0088cc]'}`}>
          Smart Lift Service Operations
        </span>
      </div>
    </div>
  );
};
