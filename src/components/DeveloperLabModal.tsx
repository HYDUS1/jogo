import React, { useState } from 'react';
import { X, KeyRound, Terminal, Play, Cpu, Sparkles, Check, RefreshCw, Zap, ShieldAlert } from 'lucide-react';
import { askJashpiAiApi } from '../services/emergencyApi';

interface DeveloperLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerApiKey: string;
  onSaveApiKey: (key: string) => void;
  onTriggerPhoneDrop: () => void;
  onTriggerBatteryAlert: () => void;
  onTriggerTestSos: (type: string) => void;
  onTriggerSnatch?: () => void;
  onTriggerInactivitySos?: () => void;
  onTestVolumeBoost?: () => void;
  onResetDeveloperMode: () => void;
}

export const DeveloperLabModal: React.FC<DeveloperLabModalProps> = ({
  isOpen,
  onClose,
  developerApiKey,
  onSaveApiKey,
  onTriggerPhoneDrop,
  onTriggerBatteryAlert,
  onTriggerTestSos,
  onTriggerSnatch,
  onTriggerInactivitySos,
  onTestVolumeBoost,
  onResetDeveloperMode,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(developerApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testPrompt, setTestPrompt] = useState('How to handle an unconscious person?');
  const [testResult, setTestResult] = useState('');
  const [isTestingModel, setIsTestingModel] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(apiKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestAi = async () => {
    if (!testPrompt.trim() || isTestingModel) return;
    setIsTestingModel(true);
    setTestResult('Running Gemini 3.8 Flash model inference...');
    try {
      const res = await askJashpiAiApi(testPrompt, 'en', 'Developer Sandbox Test');
      setTestResult(res.reply || 'No response returned');
    } catch (err: any) {
      setTestResult('Error calling model: ' + err.message);
    } finally {
      setIsTestingModel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#1A0B2E] border-2 border-amber-400/50 rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 to-purple-950/40 rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-400 animate-spin" />
            <div>
              <h2 className="text-base font-black text-amber-300 flex items-center space-x-1.5">
                <span>⚡ JASHPI MASTER DEVELOPER LAB</span>
              </h2>
              <p className="text-[11px] text-slate-400">Model Testing, Key Overrides & Fleet Simulation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Custom API Key Override */}
          <div className="p-4 rounded-2xl bg-black/50 border border-amber-400/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Custom Gemini API Key Override</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {developerApiKey ? 'ACTIVE KEY STORED' : 'USING DEFAULT SYSTEM PROXY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Provide your personal Google Gemini API key to test models directly. All user queries will utilize this key when active.
            </p>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini API Key)"
                className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold cursor-pointer transition-colors"
              >
                {savedSuccess ? 'Saved! ✓' : 'Save Key'}
              </button>
            </form>
          </div>

          {/* AI Model Testing Sandbox */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
            <div className="font-bold text-[#00F3FF] flex items-center space-x-1.5">
              <Terminal className="w-4 h-4" />
              <span>Direct Model Inference Sandbox (gemini-3.8-flash)</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter test prompt for emergency model..."
                className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                onClick={handleTestAi}
                disabled={isTestingModel}
                className="px-4 py-2 rounded-xl bg-[#0044FF] hover:bg-blue-600 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {isTestingModel ? 'Testing...' : 'Test AI'}
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-black/80 border border-white/10 text-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {testResult}
              </div>
            )}
          </div>

          {/* Safety Simulator Fleet Controls */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
            <div className="font-bold text-slate-200 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#00F3FF]" />
              <span>Simulate Real-World Sensor Edge Cases</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onTriggerPhoneDrop();
                }}
                className="p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 font-bold text-left cursor-pointer"
              >
                <div className="text-white">📱 Phone Drop Sensor</div>
                <div className="text-[10px] text-purple-300 mt-0.5">Freefall + impact &rarr; 5s SOS</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onTriggerSnatch) onTriggerSnatch();
                }}
                className="p-2.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 font-bold text-left cursor-pointer"
              >
                <div className="text-white">🚨 Phone Snatch Force</div>
                <div className="text-[10px] text-rose-300 mt-0.5">Sudden theft yank &rarr; 5s SOS</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onTriggerInactivitySos) onTriggerInactivitySos();
                }}
                className="p-2.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 font-bold text-left cursor-pointer"
              >
                <div className="text-white">⏱️ 3-Hr Digital Inactivity</div>
                <div className="text-[10px] text-cyan-300 mt-0.5">Stationary welfare dispatch</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onTriggerBatteryAlert();
                }}
                className="p-2.5 rounded-xl bg-amber-900/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 font-bold text-left cursor-pointer"
              >
                <div className="text-white">⚡ Battery &lt;15% Alert</div>
                <div className="text-[10px] text-amber-300 mt-0.5">Voice warning + power save</div>
              </button>

              {onTestVolumeBoost && (
                <button
                  onClick={() => {
                    onClose();
                    onTestVolumeBoost();
                  }}
                  className="p-2.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400 text-amber-100 font-bold text-left cursor-pointer"
                >
                  <div className="text-amber-300">🔊 100% Volume Boost Test</div>
                  <div className="text-[10px] text-amber-200 mt-0.5">Force 100% voice & restore cycle</div>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onTriggerTestSos('DEVELOPER_SIMULATED_SOS');
                }}
                className="p-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-rose-200 font-bold text-left cursor-pointer sm:col-span-2"
              >
                <div className="text-white">🚨 Full Pipeline SOS (Voice + Live GPS + Mesh)</div>
                <div className="text-[10px] text-rose-300 mt-0.5">Test entire dispatch & 5 nearest peers relay</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/40 rounded-b-3xl">
          <button
            onClick={onResetDeveloperMode}
            className="text-[11px] text-rose-400 hover:underline cursor-pointer"
          >
            Reset Developer Mode
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
