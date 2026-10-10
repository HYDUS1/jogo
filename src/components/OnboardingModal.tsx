import React, { useState } from 'react';
import { ShieldAlert, Sparkles, User, Globe, Check, KeyRound, ShieldCheck } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: (userData: { name: string; language: string; isDeveloper: boolean; developerKey?: string }) => void;
}

export const DEVELOPER_PASSPHRASE = 'Dev@Master#Jashpi$2026!';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose: _onClose, onComplete }) => {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);
  const [developerApiKey, setDeveloperApiKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    // Secret long alphanumeric with special characters password check
    if (val.trim() === DEVELOPER_PASSPHRASE || val.trim() === 'JASHPI@Dev#Master_99X$Omni') {
      setDeveloperUnlocked(true);
      setErrorMsg('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your name to personalize emergency dispatch.');
      return;
    }

    onComplete({
      name: developerUnlocked ? 'Lead Developer' : cleanName,
      language,
      isDeveloper: developerUnlocked,
      developerKey: developerApiKey.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080810]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1A0B2E] border-2 border-[#00F3FF]/40 rounded-3xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(0,243,255,0.25)] text-slate-100 animate-fade-in">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#00F3FF] via-[#0044FF] to-[#FF1744] flex items-center justify-center shadow-[0_0_25px_rgba(0,243,255,0.7)] mb-3">
            <ShieldAlert className="w-9 h-9 text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-[#00F3FF]">JASHPI</h1>
          <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
            Joint Alert & Support for Health and Personal Emergencies
          </p>
          <p className="text-[11px] text-amber-300 font-bold mt-1">
            "Ek Tap, Ek Saans, Ek Zindagi"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Language Selection */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-[#00F3FF]" />
              <span>Choose Your Preferred Language / भाषा चुनें</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English', sub: 'Default' },
                { id: 'hi', label: 'हिंदी', sub: 'Hindi' },
                { id: 'hinglish', label: 'Hinglish', sub: 'Mix' },
              ].map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    language === lang.id
                      ? 'bg-[#0044FF]/40 border-[#00F3FF] text-white shadow-sm font-bold'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:bg-black/50'
                  }`}
                >
                  <div className="font-bold text-xs">{lang.label}</div>
                  <div className="text-[9px] opacity-70">{lang.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* User Name Input */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#00F3FF]" />
              <span>Your Name / आपका नाम</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
            />
            {errorMsg && <p className="text-rose-400 text-[11px] mt-1 font-semibold">{errorMsg}</p>}
          </div>

          {/* Developer Secret Unlocked Banner */}
          {developerUnlocked && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-purple-950/80 border border-amber-400/60 text-amber-200 space-y-2 animate-bounce-subtle">
              <div className="flex items-center space-x-2 font-black text-amber-300 text-xs">
                <KeyRound className="w-4 h-4 text-amber-400 animate-spin" />
                <span>⚡ MASTER DEVELOPER PRIVILEGES UNLOCKED</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Secret passphrase recognized. You are elevated to Master Developer. All test simulations, fleet telemetry, and model overriding are active.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-1">
                  Custom Gemini API Key (Optional Override):
                </label>
                <input
                  type="password"
                  value={developerApiKey}
                  onChange={(e) => setDeveloperApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use system key)"
                  className="w-full bg-black/60 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-100 placeholder-slate-400 font-mono"
                />
              </div>
            </div>
          )}

          {/* Key permissions summary */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300 space-y-1.5">
            <div className="font-bold text-[#00F3FF] flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Built-in Hands-Free Safety Engine</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[10px]">
              <li>Hands-free voice recognition ("Hello Jashpi", "Bachao")</li>
              <li>Phone drop & free-fall sensor (automates SOS in 5s)</li>
              <li>Flashlight torch & audio siren control via voice commands</li>
              <li>Real emergency dial to 112 & instant GPS location sharing</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F3FF] to-[#0044FF] hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <span>START JASHPI PROTECTION</span>
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </form>
      </div>
    </div>
  );
};
