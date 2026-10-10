import React from 'react';

interface JashpiLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showPulse?: boolean;
  customSrc?: string;
}

export const JashpiLogo: React.FC<JashpiLogoProps> = ({
  className = '',
  size = 'md',
  showPulse = true,
  customSrc,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const dim = sizeMap[size] || 'w-10 h-10';

  if (customSrc) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${className}`}>
        {showPulse && (
          <span className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm animate-pulse pointer-events-none" />
        )}
        <img
          src={customSrc}
          alt="JASHPI Logo"
          className="w-full h-full object-contain rounded-xl relative z-10 shadow-lg border border-cyan-500/30"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${className}`}>
      {showPulse && (
        <span className="absolute -inset-1 rounded-2xl bg-[#00F3FF]/20 blur-md animate-pulse pointer-events-none" />
      )}
      <img
        src="/logo.svg"
        alt="JASHPI Logo"
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_12px_rgba(0,243,255,0.35)]"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default JashpiLogo;
