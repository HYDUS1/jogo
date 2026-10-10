import React, { useState, useEffect } from 'react';
import { X, Shield, Clock, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react';
import { SafetyCheckConfig } from '../types';

interface SafetyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SafetyCheckConfig;
  onStartSafetyCheck: (durationMinutes: number, mode: 'CHECK_IN' | 'TRAVEL_PROTECTION') => void;
  onConfirmSafe: () => void;
  onStopSafetyCheck: () => void;
}

export const SafetyModeModal: React.FC<SafetyModeModalProps> = ({
  isOpen,
  onClose,
  config,
  onStartSafetyCheck,
  onConfirmSafe,
  onStopSafetyCheck,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedMode, setSelectedMode] = useState<'CHECK_IN' | 'TRAVEL_PROTECTION'>('CHECK_IN');
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (config.active && config.deadlineTimestamp) {
      const update = () => {
        const remaining = Math.max(0, Math.round((config.deadlineTimestamp! - Date.now()) / 1000));
        setTimeLeftSec(remaining);
      };
      update();
      interval = setInterval(update, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.active, config.deadlineTimestamp]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1A0B2E] border border-[#00F3FF]/40 rounded-2xl w-full max-w-lg flex flex-col shadow-[0_0_40px_rgba(0,243,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#00F3FF]" />
            <div>
              <h2 className="text-base font-bold text-white">Safety Mode & Check-Ins</h2>
              <p className="text-[11px] text-slate-400">Scheduled confirmation for solo travel and walks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {config.active ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/40 text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-cyan-400 font-bold">
                <Clock className="w-4 h-4 animate-spin" />
                <span>SAFETY PROTECTION ACTIVE</span>
              </div>

              <div className="text-3xl font-black text-white tracking-widest font-mono">
                {formatTime(timeLeftSec)}
              </div>

              <p className="text-slate-300 text-[11px]">
                {config.modeType === 'TRAVEL_PROTECTION'
                  ? 'Continuous sensor and route tracking active. Confirm you are safe at destination.'
                  : 'If you do not confirm safety when timer expires, JASHPI will escalate alerts to your contacts.'}
              </p>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={onConfirmSafe}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center justify-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I AM SAFE (RESET)</span>
                </button>
                <button
                  onClick={onStopSafetyCheck}
                  className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Select Protection Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedMode('CHECK_IN')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      selectedMode === 'CHECK_IN'
                        ? 'bg-[#0044FF]/30 border-[#00F3FF] text-white'
                        : 'bg-black/30 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#00F3FF]" />
                      <span>Check-In Timer</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Prompt me to verify safety in X minutes.</div>
                  </button>

                  <button
                    onClick={() => setSelectedMode('TRAVEL_PROTECTION')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      selectedMode === 'TRAVEL_PROTECTION'
                        ? 'bg-[#0044FF]/30 border-[#00F3FF] text-white'
                        : 'bg-black/30 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <Navigation className="w-3.5 h-3.5 text-[#00F3FF]" />
                      <span>Solo Travel Mode</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Intensive sensor and fall protection for travel.</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSelectedDuration(mins)}
                      className={`py-2 rounded-lg font-bold border text-xs cursor-pointer ${
                        selectedDuration === mins
                          ? 'bg-[#00F3FF] text-black border-[#00F3FF]'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:bg-black/60'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-[11px] text-slate-300 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Escalation Policy: When timer ends, an audio voice prompt asks "Are you safe?". If no reply within 60 seconds, JASHPI triggers high-priority contact dispatch.
                </span>
              </div>

              <button
                onClick={() => onStartSafetyCheck(selectedDuration, selectedMode)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F3FF] to-[#0044FF] text-black font-extrabold text-sm cursor-pointer shadow-lg hover:brightness-110 transition-all"
              >
                START SAFETY MONITORING
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
