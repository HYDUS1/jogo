import React, { useState, useEffect } from 'react';
import { X, BookOpen, Heart, Flame, ShieldAlert, Wind, Activity, Play, Square, AlertOctagon } from 'lucide-react';
import { playBeep } from '../services/audioSiren';

interface GuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidesModal: React.FC<GuidesModalProps> = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('cpr');
  const [metronomeActive, setMetronomeActive] = useState<boolean>(false);

  // CPR Metronome at 110 BPM (approx 545ms interval)
  useEffect(() => {
    let interval: any = null;
    if (metronomeActive) {
      interval = setInterval(() => {
        playBeep(800, 60);
      }, 545);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [metronomeActive]);

  if (!isOpen) return null;

  const topics = [
    { id: 'cpr', title: 'Adult CPR (Cardiopulmonary)', icon: Heart },
    { id: 'bleeding', title: 'Severe Bleeding & Wounds', icon: AlertOctagon },
    { id: 'choking', title: 'Choking / Heimlich Maneuver', icon: Wind },
    { id: 'burns', title: 'Burns & Scalds', icon: Flame },
    { id: 'fractures', title: 'Fractures & Spinal Safety', icon: Activity },
    { id: 'accident', title: 'Vehicle Crash Scene Triage', icon: ShieldAlert },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1A0B2E] border border-[#00F3FF]/40 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-[0_0_40px_rgba(0,243,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#00F3FF]" />
            <div>
              <h2 className="text-base font-bold text-white">Offline Emergency & First-Aid Guides</h2>
              <p className="text-[11px] text-slate-400">Works 100% offline without internet connection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic tabs */}
        <div className="p-2 border-b border-white/10 overflow-x-auto flex space-x-2 shrink-0 bg-black/20">
          {topics.map((t) => {
            const Icon = t.icon;
            const active = selectedTopic === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTopic(t.id);
                  setMetronomeActive(false);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0044FF] text-white'
                    : 'bg-black/30 hover:bg-black/50 text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed text-slate-200">
          {selectedTopic === 'cpr' && (
            <div className="space-y-3">
              {/* Metronome audio aid */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/60 to-purple-950/60 border border-red-500/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">CPR Metronome (110 BPM)</h4>
                  <p className="text-[11px] text-slate-300">
                    Target compression rate: 100–120 per minute. Push to the beat of "Stayin' Alive".
                  </p>
                </div>
                <button
                  onClick={() => setMetronomeActive(!metronomeActive)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors ${
                    metronomeActive
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {metronomeActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{metronomeActive ? 'STOP BEAT' : 'START BEAT'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">Step 1: Check Responsiveness</h4>
                <p>Shake the person gently by the shoulders and shout: "Are you okay?". Check for normal breathing for no more than 10 seconds.</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">Step 2: Call for Immediate Help</h4>
                <p>Yell for someone to dial <b>112</b> or <b>108</b> and get an Automated External Defibrillator (AED) if in a public facility.</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">Step 3: Chest Compressions</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Place the heel of one hand in the center of the chest (lower half of breastbone).</li>
                  <li>Interlock fingers of your second hand on top. Keep elbows straight.</li>
                  <li>Push down at least 2 inches (5 cm) deep and allow complete chest recoil between presses.</li>
                  <li>Continue uninterrupted until emergency medical professionals take over.</li>
                </ul>
              </div>
            </div>
          )}

          {selectedTopic === 'bleeding' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#FF1744] text-sm">1. Direct Firm Pressure</h4>
                <p>Apply firm, steady pressure directly onto the wound with clean cloth, sterile gauze, or clothing. Do not release pressure to check.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">2. Elevation</h4>
                <p>If the bleed is on an arm or leg, elevate the limb above heart level (unless a broken bone is suspected).</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">3. Severe Arterial Bleeding (Tourniquet)</h4>
                <p>If bright red blood is spurting continuously and direct pressure does not stop it on a limb: Apply a commercial tourniquet or improvised strip 2–3 inches above the wound toward the torso. Note the exact application time.</p>
              </div>
            </div>
          )}

          {selectedTopic === 'choking' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">1. Assess & Encourage Coughing</h4>
                <p>If the victim can speak or cough loudly, encourage them to cough hard. Do not slap the back while they are coughing effectively.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">2. 5 Back Blows</h4>
                <p>Stand slightly behind the victim. Lean them forward and deliver 5 firm blows between their shoulder blades using the heel of your hand.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">3. 5 Abdominal Thrusts (Heimlich Maneuver)</h4>
                <p>Wrap your arms around their waist from behind. Make a fist just above their navel. Grasp your fist with your other hand and thrust inward and upward forcefully 5 times.</p>
              </div>
            </div>
          )}

          {selectedTopic === 'burns' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">1. Cool With Running Water (20 Minutes)</h4>
                <p>Immediately run cool (not ice cold) tap water over the burn for 15–20 minutes. Never apply ice, butter, toothpaste, or oil.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">2. Remove Constrictive Items</h4>
                <p>Remove rings, watches, and tight clothing near the burned area before swelling starts. Do not peel off clothing stuck to the burn.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">3. Cover Loosely</h4>
                <p>Cover with clean plastic cling wrap or sterile non-adhesive dressing to prevent infection.</p>
              </div>
            </div>
          )}

          {selectedTopic === 'fractures' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">1. Do Not Move the Person</h4>
                <p>If neck, spine, or pelvis injury is possible, keep the person completely still. Support head and neck with folded towels on each side.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">2. Immobilize the Injured Limb</h4>
                <p>Do not attempt to push protruding bones back in or straighten deformed bones. Splint in the position found.</p>
              </div>
            </div>
          )}

          {selectedTopic === 'accident' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">1. Scene Safety & Hazards</h4>
                <p>Turn off car ignition if accessible. Beware of oncoming traffic, fuel leaks, or fallen power lines.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="font-bold text-[#00F3FF] text-sm">2. Do Not Remove Helmets</h4>
                <p>For motorcycle casualties, do not remove helmets unless the airway is severely blocked, to avoid spinal cord trauma.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex justify-between items-center bg-black/40">
          <span className="text-[10px] text-slate-400">Emergency Numbers: Ambulance 108 | Police 100 | Unified 112</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
