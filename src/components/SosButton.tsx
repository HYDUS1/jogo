import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface SosButtonProps {
  onTrigger: () => void;
  countdown: number | null;
  onCancelCountdown: () => void;
  isTriggered: boolean;
  voiceActive: boolean;
}

export const SosButton: React.FC<SosButtonProps> = ({
  onTrigger,
  countdown,
  onCancelCountdown,
  isTriggered,
  voiceActive,
}) => {
  if (countdown !== null && countdown > 0) {
    return (
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center">
          {/* Pulsing countdown rings */}
          <div className="absolute w-52 h-52 rounded-full border-4 border-amber-500/50 animate-ping pointer-events-none" />
          <div className="absolute w-60 h-60 rounded-full border-2 border-red-500/30 animate-pulse pointer-events-none" />

          <button
            onClick={onCancelCountdown}
            className="w-44 h-44 rounded-full bg-gradient-to-b from-amber-500 to-red-600 border-4 border-amber-300 text-white font-black flex flex-col items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.8)] transition-transform active:scale-95 cursor-pointer z-10"
            aria-label="Cancel Emergency Countdown"
          >
            <span className="text-4xl font-extrabold tracking-wider">{countdown}s</span>
            <span className="text-xs font-bold mt-1 px-3 py-1 bg-black/40 rounded-full uppercase tracking-wider text-amber-200">
              Tap to CANCEL
            </span>
          </button>
        </div>
        <p className="mt-4 text-sm font-medium text-amber-400 animate-pulse text-center">
          Possible emergency detected! Say <b>"CANCEL"</b> or tap above to abort.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="relative flex items-center justify-center">
        {/* Glow radar rings */}
        <div className="absolute w-48 h-48 rounded-full bg-[#FF1744]/20 animate-ping pointer-events-none opacity-40" />
        <div className="absolute w-56 h-56 rounded-full border border-[#00F3FF]/20 animate-pulse pointer-events-none" />

        <button
          onClick={onTrigger}
          className={`w-40 h-40 rounded-full flex flex-col items-center justify-center text-white font-black cursor-pointer z-10 transition-all duration-200 active:scale-95 ${
            isTriggered
              ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 border-4 border-red-300 shadow-[0_0_60px_#FF1744]'
              : 'bg-gradient-to-tr from-[#FF1744] via-[#D50000] to-[#FF5252] border-4 border-rose-400 shadow-[0_0_45px_rgba(255,23,68,0.7)] hover:shadow-[0_0_60px_rgba(255,23,68,0.9)]'
          }`}
          aria-label="Activate SOS Emergency"
        >
          {isTriggered ? (
            <ShieldAlert className="w-12 h-12 text-white animate-bounce" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-white mb-1" />
          )}
          <span className="text-3xl font-black tracking-widest text-white drop-shadow-md">
            {isTriggered ? 'ACTIVE' : 'SOS'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-rose-100 mt-0.5">
            {isTriggered ? 'DISPATCHED' : 'ONE-TOUCH'}
          </span>
        </button>
      </div>

      <div className="mt-5 flex items-center space-x-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-[#1A0B2E]/90 border border-[#00F3FF]/40 text-[#00F3FF]">
        <span className={`w-2 h-2 rounded-full ${voiceActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
        <span>
          Hands-Free Active: Say <b className="text-white">"Hello Jashpi"</b> or <b className="text-white">"Bachao"</b>
        </span>
      </div>
    </div>
  );
};
