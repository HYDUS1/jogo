import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, ShieldCheck, EyeOff, User } from 'lucide-react';
import { playBeep, speakVoiceFeedback } from '../services/audioSiren';

interface StealthModeOverlayProps {
  isActive: boolean;
  onExit: () => void;
  onTriggerSilentSos: () => void;
  callerName?: string;
}

export const StealthModeOverlay: React.FC<StealthModeOverlayProps> = ({
  isActive,
  onExit,
  onTriggerSilentSos,
  callerName = 'Papa (Home)',
}) => {
  const [fakeCallState, setFakeCallState] = useState<'IDLE' | 'RINGING' | 'CONNECTED'>('IDLE');
  const [tapCount, setTapCount] = useState<number>(0);
  const [silentSosSent, setSilentSosSent] = useState<boolean>(false);
  const callDurationTimer = useRef<any>(null);
  const [callSeconds, setCallSeconds] = useState<number>(0);

  useEffect(() => {
    let tapResetTimeout: any = null;
    if (tapCount > 0) {
      if (tapCount >= 3) {
        // Triple tap in the dark detected!
        setSilentSosSent(true);
        onTriggerSilentSos();
        playBeep(300, 50); // Subtle haptic buzz
        setTapCount(0);
      } else {
        tapResetTimeout = setTimeout(() => {
          setTapCount(0);
        }, 1200);
      }
    }
    return () => {
      if (tapResetTimeout) clearTimeout(tapResetTimeout);
    };
  }, [tapCount, onTriggerSilentSos]);

  // Fake call timer
  useEffect(() => {
    if (fakeCallState === 'CONNECTED') {
      callDurationTimer.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (callDurationTimer.current) clearInterval(callDurationTimer.current);
      setCallSeconds(0);
    }
    return () => {
      if (callDurationTimer.current) clearInterval(callDurationTimer.current);
    };
  }, [fakeCallState]);

  if (!isActive) return null;

  const handleScreenTap = () => {
    if (fakeCallState === 'IDLE') {
      setTapCount((c) => c + 1);
    }
  };

  const startFakeCall = () => {
    setFakeCallState('RINGING');
    // Ringtone vibration if available
    if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 600]);
  };

  const answerFakeCall = () => {
    setFakeCallState('CONNECTED');
    // Speak realistic scripted caller audio
    speakVoiceFeedback(
      "Hey, where are you? I'm waiting in the car right outside. Come out now, we have to leave.",
      'en-IN'
    );
  };

  const endFakeCall = () => {
    setFakeCallState('IDLE');
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onClick={handleScreenTap}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between select-none cursor-default"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Discreet secret exit header (double tap top to exit) */}
      <div className="p-4 flex items-center justify-between opacity-20 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-mono text-slate-500">
          [STEALTH BLACKOUT ACTIVE - TAP 3X FOR SILENT SOS]
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
        >
          Exit Stealth Mode ✕
        </button>
      </div>

      {/* Main Screen Body */}
      {fakeCallState === 'IDLE' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {silentSosSent ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs animate-pulse">
              <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
              <div className="font-bold">SILENT DISTRESS DISPATCHED</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Live location broadcasted secretly to emergency contacts.
              </div>
            </div>
          ) : (
            <div className="opacity-0 hover:opacity-30 transition-opacity text-slate-600 text-xs">
              <p>Blackout Screen: Phone appears completely dead.</p>
              <p>Triple-tap screen or whisper "help" to trigger silent SOS.</p>
            </div>
          )}

          {/* Quick Trigger for Fake Call Pretext */}
          <div className="mt-8 opacity-25 hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startFakeCall();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer flex items-center space-x-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Escape Call Now</span>
            </button>
          </div>
        </div>
      )}

      {/* FAKE INCOMING CALL UI */}
      {fakeCallState === 'RINGING' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex flex-col justify-between py-12 px-6 bg-gradient-to-b from-slate-950 to-black animate-fade-in"
        >
          <div className="text-center mt-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center mb-4 shadow-xl">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">{callerName}</h2>
            <p className="text-xs text-emerald-400 animate-pulse mt-1">Incoming Call...</p>
          </div>

          <div className="flex items-center justify-around px-8 mb-8">
            <button
              onClick={endFakeCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <button
              onClick={answerFakeCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce transition-transform active:scale-90 cursor-pointer"
            >
              <Phone className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* FAKE CALL CONNECTED */}
      {fakeCallState === 'CONNECTED' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex flex-col justify-between py-12 px-6 bg-gradient-to-b from-slate-950 to-black animate-fade-in"
        >
          <div className="text-center mt-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center mb-4 shadow-xl">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">{callerName}</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">{formatCallTime(callSeconds)}</p>
            <p className="text-[11px] text-cyan-300 mt-3 italic">
              "I'm waiting in the car outside right now. Come out!"
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <button
              onClick={endFakeCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom faint instructions */}
      <div className="p-4 text-center opacity-10 hover:opacity-40 transition-opacity">
        <span className="text-[9px] text-slate-500">
          JASHPI STEALTH GUARDIAN • TRIPLE-TAP SCREEN FOR SILENT GPS BROADCAST
        </span>
      </div>
    </div>
  );
};
