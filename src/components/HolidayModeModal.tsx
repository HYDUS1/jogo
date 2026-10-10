import React, { useState } from 'react';
import {
  X,
  Compass,
  Clock,
  Shield,
  Plane,
  AlertTriangle,
  Play,
  CheckCircle2
} from 'lucide-react';

interface HolidayModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidayModeActive: boolean;
  onToggleHolidayMode: (active: boolean) => void;
  inactivityHours: number;
  onSetInactivityHours: (hours: number) => void;
  onSimulateInactivitySos: () => void;
  isDarkMode?: boolean;
}

export const HolidayModeModal: React.FC<HolidayModeModalProps> = ({
  isOpen,
  onClose,
  holidayModeActive,
  onToggleHolidayMode,
  inactivityHours,
  onSetInactivityHours,
  onSimulateInactivitySos,
  isDarkMode = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#1A0B2E] border-cyan-500/40 text-slate-100'
            : 'bg-white border-blue-500/30 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-black">
              <Compass className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-1.5">
                <span>Holiday / Wander Mode & Inactivity SOS</span>
              </h2>
              <p className="text-[11px] text-[#00F3FF] font-semibold">
                छुट्टी व यात्रा मोड — 3-Hour Immobile Welfare Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Holiday Mode Toggle Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              holidayModeActive
                ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-emerald-500/60 text-emerald-200'
                : 'bg-black/40 border-white/10 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    holidayModeActive ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {holidayModeActive ? '🌴 Holiday / Wander Mode: ACTIVE' : '🌴 Holiday / Wander Mode: OFF'}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {holidayModeActive
                      ? 'Inactivity SOS is safely paused. Enjoy your travels & rest without false alarms.'
                      : 'Active protection: If phone is immobile & untouched for 3+ hours, welfare SOS dispatches.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onToggleHolidayMode(!holidayModeActive)}
                className={`px-4 py-2 rounded-xl font-black text-xs cursor-pointer shadow-md transition-colors ${
                  holidayModeActive
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                }`}
              >
                {holidayModeActive ? 'PAUSED' : 'ENABLE'}
              </button>
            </div>
          </div>

          {/* Inactivity Threshold Configuration */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 ${
              isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#00F3FF]" />
              <span className="font-bold text-xs text-white">Digital SOS Inactivity Threshold</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If the device detects zero movement and zero touch interaction at the exact same location for over this time, JASHPI issues an automated distress alert to your emergency contacts.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[2, 3, 4].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => onSetInactivityHours(hrs)}
                  className={`py-2 rounded-xl text-center font-bold text-xs cursor-pointer border ${
                    inactivityHours === hrs
                      ? 'bg-[#0044FF] border-[#00F3FF] text-white'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:bg-black/50'
                  }`}
                >
                  {hrs} Hours {hrs === 3 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Automated Message Preview */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1 font-mono text-[11px] text-cyan-300">
            <div className="text-slate-400 text-[10px] uppercase font-bold">
              Automated Inactivity Message Preview:
            </div>
            <p className="whitespace-pre-wrap">
              "🚨 JASHPI DIGITAL INACTIVITY SOS: User has been completely immobile and inactive for over {inactivityHours} hours at this location. Possible medical emergency, loss of consciousness, or distress. Live coordinates: [Google Maps Link]"
            </p>
          </div>

          {/* Test Simulation Button */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-xs text-amber-300">Test Inactivity SOS Dispatch</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Simulates 3-hour stationary timeout and triggers the warning sequence.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onSimulateInactivitySos();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md shrink-0"
            >
              Test Simulation
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t flex justify-end ${
            isDarkMode ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
