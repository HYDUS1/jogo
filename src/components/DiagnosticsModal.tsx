import React, { useState, useEffect } from 'react';
import { X, Cpu, Activity, Mic, MapPin, Battery, Wifi, ShieldAlert, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { fetchHealthApi } from '../services/emergencyApi';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  motionData: { x: number; y: number; z: number; magnitude: number };
  gpsData: { lat: number | null; lng: number | null; accuracy: number | null };
  voiceActive: boolean;
  batteryData: { level: number | null; charging: boolean };
  onTriggerTestSos: (type: string) => void;
  onSimulateBatteryLevel?: (level: number, charging: boolean) => void;
  onTriggerSnatch?: () => void;
  onTriggerInactivitySos?: () => void;
  onTestVolumeBoost?: () => void;
  lastTranscript: string;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  motionData,
  gpsData,
  voiceActive,
  batteryData,
  onTriggerTestSos,
  onSimulateBatteryLevel,
  onTriggerSnatch,
  onTriggerInactivitySos,
  onTestVolumeBoost,
  lastTranscript,
}) => {
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHealthApi().then(setHealthInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateFall = () => {
    setIsSimulating('FALL');
    setTimeout(() => {
      setIsSimulating(null);
      onTriggerTestSos('SIMULATED_FALL');
    }, 1800);
  };

  const handleSimulateAccident = () => {
    setIsSimulating('ACCIDENT');
    setTimeout(() => {
      setIsSimulating(null);
      onTriggerTestSos('SIMULATED_ACCIDENT');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1A0B2E] border border-[#00F3FF]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,243,255,0.2)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-[#00F3FF]" />
            <h2 className="text-lg font-bold text-white tracking-wide">Developer & Testing Diagnostics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Test Warning Banner */}
          <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">SAFE TESTING ENVIRONMENT:</span> Test buttons below execute the complete triage, voice, and notification pipeline without placing live calls to real emergency services.
            </div>
          </div>

          {/* Test Action Controls */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10">
            <h3 className="font-bold text-[#00F3FF] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Play className="w-4 h-4" />
              <span>Simulate Emergency & System Scenarios</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onTriggerTestSos('TEST_MANUAL_SOS')}
                className="py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer transition-colors text-center"
              >
                TEST SOS (Manual)
              </button>
              <button
                onClick={handleSimulateFall}
                disabled={Boolean(isSimulating)}
                className="py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors text-center disabled:opacity-50"
              >
                {isSimulating === 'FALL' ? 'Simulating Fall...' : 'Simulate Fall (Sensor)'}
              </button>
              <button
                onClick={handleSimulateAccident}
                disabled={Boolean(isSimulating)}
                className="py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition-colors text-center disabled:opacity-50"
              >
                {isSimulating === 'ACCIDENT' ? 'Simulating Crash...' : 'Simulate Accident (Impact)'}
              </button>
              {onTriggerSnatch && (
                <button
                  onClick={() => {
                    onClose();
                    onTriggerSnatch();
                  }}
                  className="py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold cursor-pointer transition-colors text-center"
                >
                  Simulate Phone Snatch (5s)
                </button>
              )}
              {onTriggerInactivitySos && (
                <button
                  onClick={() => {
                    onClose();
                    onTriggerInactivitySos();
                  }}
                  className="py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold cursor-pointer transition-colors text-center"
                >
                  Simulate 3-Hr Inactivity SOS
                </button>
              )}
              {onTestVolumeBoost && (
                <button
                  onClick={() => {
                    onClose();
                    onTestVolumeBoost();
                  }}
                  className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-extrabold cursor-pointer transition-colors text-center"
                >
                  🔊 Test 100% Volume Boost & Restore
                </button>
              )}
            </div>

            {/* Battery Threshold Simulation */}
            {onSimulateBatteryLevel && (
              <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  <span>Battery Threshold Warning (&lt;15%):</span>
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSimulateBatteryLevel(12, false)}
                    className="py-1.5 px-3 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-bold cursor-pointer transition-colors text-center text-[11px]"
                  >
                    Simulate &lt;15% (Voice Alert)
                  </button>
                  <button
                    onClick={() => onSimulateBatteryLevel(85, false)}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 font-bold cursor-pointer transition-colors text-center text-[11px]"
                  >
                    Reset (85%)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Audio & Speech */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-white/10 pb-1">
                <span className="flex items-center space-x-1">
                  <Mic className="w-3.5 h-3.5 text-[#00F3FF]" />
                  <span>Speech & Audio Engine</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${voiceActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                  {voiceActive ? 'LISTENING' : 'OFF'}
                </span>
              </div>
              <div className="text-slate-300">
                Language: <span className="text-white font-mono">en-IN / hi-IN</span>
              </div>
              <div className="text-slate-300">
                Wake Words: <span className="text-white font-mono">"Hello Jashpi", "Bachao"</span>
              </div>
              <div className="text-slate-300">
                Last Heard: <span className="text-[#00F3FF] font-mono italic">{lastTranscript || 'None yet'}</span>
              </div>
            </div>

            {/* Motion & Accelerometer */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-white/10 pb-1">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-[#00F3FF]" />
                  <span>Motion & Accelerometer</span>
                </span>
                <span className="text-emerald-400 font-mono text-[10px]">ACTIVE</span>
              </div>
              <div className="text-slate-300">
                Acceleration X, Y, Z: <span className="text-white font-mono">{motionData.x.toFixed(1)}, {motionData.y.toFixed(1)}, {motionData.z.toFixed(1)}</span>
              </div>
              <div className="text-slate-300">
                Magnitude: <span className="text-[#00F3FF] font-mono">{motionData.magnitude.toFixed(2)} m/s²</span> (Earth g ≈ 9.8)
              </div>
              <div className="text-slate-300">
                Free-fall Threshold: <span className="text-white font-mono">&lt; 3.2 m/s²</span> | Impact: <span className="text-white font-mono">&gt; 24.0 m/s²</span>
              </div>
            </div>

            {/* GPS & Location */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-white/10 pb-1">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00F3FF]" />
                  <span>Geolocation Fix</span>
                </span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  {gpsData.lat ? 'LOCKED' : 'SEARCHING'}
                </span>
              </div>
              <div className="text-slate-300">
                Latitude: <span className="text-white font-mono">{gpsData.lat ? gpsData.lat.toFixed(6) : 'N/A'}</span>
              </div>
              <div className="text-slate-300">
                Longitude: <span className="text-white font-mono">{gpsData.lng ? gpsData.lng.toFixed(6) : 'N/A'}</span>
              </div>
              <div className="text-slate-300">
                Accuracy: <span className="text-[#00F3FF] font-mono">{gpsData.accuracy ? `±${Math.round(gpsData.accuracy)}m` : 'Unknown'}</span>
              </div>
            </div>

            {/* Battery & Network */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-white/10 pb-1">
                <span className="flex items-center space-x-1">
                  <Battery className="w-3.5 h-3.5 text-[#00F3FF]" />
                  <span>Device Health</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Wifi className="w-3 h-3" />
                  <span>ONLINE</span>
                </span>
              </div>
              <div className="text-slate-300">
                Battery Level: <span className="text-white font-mono">{batteryData.level !== null ? `${batteryData.level}%` : 'Standard'} {batteryData.charging ? '⚡' : ''}</span>
              </div>
              <div className="text-slate-300">
                Server Health: <span className="text-emerald-400 font-mono">{healthInfo?.status || 'Online'}</span>
              </div>
              <div className="text-slate-300">
                Telegram Relay: <span className="text-white font-mono">{healthInfo?.telegram ? 'Configured ✅' : 'Ready (Client fallback)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
