import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Flame,
  ShieldAlert,
  Wind,
  Activity,
  Zap,
  Play,
  Square,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { playBeep } from '../services/audioSiren';

interface AnimatedGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

export const AnimatedGuidesModal: React.FC<AnimatedGuidesModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('cpr');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [metronomeActive, setMetronomeActive] = useState<boolean>(false);
  const [activeLang, setActiveLang] = useState<'hi' | 'en'>(language.startsWith('hi') ? 'hi' : 'en');
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);

  const isHi = activeLang === 'hi';

  // Metronome at 110 BPM (approx 545ms interval) for CPR
  useEffect(() => {
    let interval: any = null;
    if (metronomeActive) {
      interval = setInterval(() => {
        playBeep(880, 80);
      }, 545);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [metronomeActive]);

  // Reset step when topic changes
  useEffect(() => {
    setActiveStep(0);
    setMetronomeActive(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    }
  }, [selectedTopic]);

  // Stop voice and metronome on close
  useEffect(() => {
    if (!isOpen) {
      setMetronomeActive(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsPlayingVoice(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoiceReadout = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHi ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);
    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  const topics = [
    {
      id: 'cpr',
      title: isHi ? 'CPR (दिल की धड़कन)' : 'CPR (Heart Attack)',
      badge: 'LIFE CRITICAL',
      icon: Heart,
      accent: 'rose',
      stepsCount: 3,
    },
    {
      id: 'snake_bite',
      title: isHi ? 'साँप का काटना' : 'Snake Bite Safety',
      badge: 'ASV ANTI-VENOM',
      icon: Activity,
      accent: 'emerald',
      stepsCount: 3,
    },
    {
      id: 'choking',
      title: isHi ? 'दम घुटना (Heimlich)' : 'Choking / Heimlich',
      badge: 'AIRWAY RESCUE',
      icon: Wind,
      accent: 'cyan',
      stepsCount: 3,
    },
    {
      id: 'bleeding',
      title: isHi ? 'गंभीर खून बहना' : 'Severe Bleeding',
      badge: 'DIRECT PRESSURE',
      icon: AlertOctagon,
      accent: 'red',
      stepsCount: 3,
    },
    {
      id: 'fire',
      title: isHi ? 'आग लगना व जलना' : 'Fire & Burns',
      badge: 'STOP DROP ROLL',
      icon: Flame,
      accent: 'amber',
      stepsCount: 3,
    },
    {
      id: 'electric',
      title: isHi ? 'बिजली का झटका' : 'Electric Shock',
      badge: 'POWER CUT FIRST',
      icon: Zap,
      accent: 'yellow',
      stepsCount: 3,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#120824] border-2 border-[#00F3FF]/50 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(0,243,255,0.3)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/30">
              <ShieldAlert className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {isHi ? '🚨 सचित्र आपातकालीन जीवन रक्षक गाइड' : '🚨 Catchy Illustrated Life-Saving Guides'}
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% OFFLINE READY
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                {isHi ? 'बड़ा व स्पष्ट टेक्स्ट — आपातकाल में तुरंत समझ आने वाले निर्देश' : 'Clear Big Typography & Catchy Animated Diagrams'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/15">
              <button
                onClick={() => setActiveLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  !isHi ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setActiveLang('hi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isHi ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Topics Selector Tabs */}
        <div className="p-2.5 border-b border-white/10 overflow-x-auto flex space-x-2 shrink-0 bg-black/50 scrollbar-none">
          {topics.map((t) => {
            const Icon = t.icon;
            const active = selectedTopic === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center space-x-2 transition-all cursor-pointer shadow-sm ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/25 scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${active ? 'text-black' : 'text-cyan-400'}`} />
                <span>{t.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Guide Content (Catchy, Big Text, Big Diagrams) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-100">
          {/* ===================== CPR SECTION ===================== */}
          {selectedTopic === 'cpr' && (
            <div className="space-y-6">
              {/* Metronome Bar */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/80 via-purple-950/80 to-rose-950/80 border-2 border-rose-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl shadow-rose-950/40">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-3 rounded-2xl ${metronomeActive ? 'bg-rose-500 animate-pulse text-white' : 'bg-rose-900/50 text-rose-300'}`}>
                    <Heart className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base sm:text-lg">
                      {isHi ? 'CPR ऑडियो बीट मेट्रोनोम (110 BPM ताल)' : 'CPR Audio Rhythm Metronome (110 BPM)'}
                    </h4>
                    <p className="text-xs sm:text-sm text-rose-200 font-semibold mt-0.5">
                      {isHi
                        ? 'छाती को 100 से 120 बार प्रति मिनट दबाएं ("Stayin Alive" गाने की तेज ताल)'
                        : 'Compress chest 100-120 times/min. Match this audio beat rhythm exactly.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMetronomeActive(!metronomeActive)}
                  className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center space-x-2 cursor-pointer shadow-lg transition-all ${
                    metronomeActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  }`}
                >
                  {metronomeActive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{metronomeActive ? (isHi ? 'बीट बंद करें' : 'STOP BEAT') : (isHi ? 'ताल शुरू करें' : 'START 110 BPM BEAT')}</span>
                </button>
              </div>

              {/* Large Catchy Animated Illustration */}
              <div className="p-6 rounded-3xl bg-black/60 border-2 border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                {/* SVG Illustration */}
                <div className="relative flex flex-col items-center">
                  <svg className="w-56 h-48 sm:w-64 sm:h-52 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]" viewBox="0 0 240 200" fill="none">
                    {/* Patient Body Silhouette */}
                    <rect x="20" y="110" width="200" height="70" rx="35" fill="#1e1b4b" stroke="#6366f1" strokeWidth="3" />
                    {/* Head */}
                    <circle cx="210" cy="115" r="22" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                    {/* Chest Center Glow Area */}
                    <ellipse cx="110" cy="125" rx="36" ry="24" fill="#dc2626" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="3" className={metronomeActive ? 'animate-ping' : ''} />
                    <circle cx="110" cy="125" r="14" fill="#ef4444" />
                    {/* Crosshair Target on Sternum */}
                    <path d="M110,105 L110,145 M90,125 L130,125" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                    {/* Rescuer Hands Pressing Down (Straight Arms at 90°) */}
                    <path d="M110,30 L110,115" stroke="#00F3FF" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="110" cy="30" r="14" fill="#00F3FF" />
                    {/* 90 Degree Angle Badge */}
                    <rect x="125" y="60" width="60" height="26" rx="8" fill="#0f172a" stroke="#00F3FF" strokeWidth="2" />
                    <text x="155" y="77" textAnchor="middle" fill="#00F3FF" fontSize="12" fontWeight="900">90° LOCK</text>
                  </svg>
                  <div className="mt-2 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {isHi ? '2 इंच गहरा दबाएं (5 सेमी)' : 'Push 2 Inches (5cm) Deep'}
                    </span>
                  </div>
                </div>

                {/* Big Text Primary Rule */}
                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'गोल्डन नियम (Golden Rule)' : 'Crucial Golden Rule'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isHi
                      ? 'छाती के बीचों-बीच दोनों हथेलियाँ रखकर पूरी ताकत से दबाएं!'
                      : 'Lock your elbows straight and push hard in center of chest!'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {isHi
                      ? 'कोहनी बिल्कुल सीधी रखें, कंधे छाती के ठीक ऊपर होने चाहिए। हर बार दबाने के बाद छाती को पूरी तरह वापस ऊपर आने दें। रुकें नहीं जब तक एम्बुलेंस न आ जाए!'
                      : 'Do not bend elbows. Use your full upper body weight. Allow chest to fully recoil after each compression. Do not stop until paramedics arrive!'}
                  </p>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleVoiceReadout(
                          isHi
                            ? 'सीपीआर देने के लिए मरीज की छाती के बीच में दोनों हाथ रखें। कोहनी सीधी रखकर दो इंच गहरा दबाएं। एक मिनट में सौ से एक सौ बीस बार दबाएं।'
                            : 'To give CPR, place hands in the center of the chest. Lock your elbows straight and push hard, two inches deep. Maintain 100 to 120 beats per minute.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 font-black text-xs sm:text-sm flex items-center space-x-2 cursor-pointer border border-cyan-500/30"
                    >
                      {isPlayingVoice ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                      <span>{isPlayingVoice ? (isHi ? 'आवाज रोकें' : 'Stop Audio') : (isHi ? '🔊 बोलकर समझाएं' : '🔊 Listen Audio Guide')}</span>
                    </button>
                    <a
                      href="tel:108"
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isHi ? 'कॉल 108 एम्बुलेंस' : 'Call 108 Ambulance'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 3 Step Cards with BIG Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 hover:border-cyan-500/40 transition-all space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center text-sm font-black">1</span>
                    <span>{isHi ? 'जांचें (Check)' : 'Check Response'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    {isHi ? 'कंधे थपथपाएं और पूछें' : 'Tap Shoulders & Shout'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {isHi
                      ? 'जोर से पूछें "क्या आप ठीक हैं?". 10 सेकंड में देखें कि छाती हिल रही है या सांस आ रही है। यदि सांस नहीं आ रही तो तुरंत शुरू करें।'
                      : 'Firmly tap shoulders and shout "Are you okay?". Check chest movement for 10 seconds. If no breathing, begin immediately.'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 hover:border-rose-500/40 transition-all space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-black">2</span>
                    <span>{isHi ? 'कॉल 108 या 112' : 'Call Emergency'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    {isHi ? 'मदद के लिए चिल्लाएं' : 'Summon Immediate Help'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {isHi
                      ? 'आसपास के किसी व्यक्ति को इशारा कर कहें "108 पर एम्बुलेंस बुलाओ और AED डिफाइब्रिलेटर लाओ!". स्पीकर फोन चालू रखें।'
                      : 'Point to someone and order: "Call 108 / 112 and find an AED!". Put emergency dispatcher on speaker phone.'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 hover:border-emerald-500/40 transition-all space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center text-sm font-black">3</span>
                    <span>{isHi ? 'दबाव जारी रखें' : 'Continuous Compressions'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    {isHi ? 'निरंतर 30 दबाव दें' : 'Hands-Only Continuous'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {isHi
                      ? 'छाती पर 30 बार तेज दबाव दें, यदि प्रशिक्षित हैं तो 2 बार मुंह से सांस दें, अन्यथा बिना रुके सिर्फ छाती दबाते रहें।'
                      : 'Deliver 30 hard chest compressions. If mouth-to-mouth is unavailable, provide continuous hands-only CPR non-stop.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== SNAKE BITE SECTION ===================== */}
          {selectedTopic === 'snake_bite' && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="p-6 rounded-3xl bg-black/60 border-2 border-emerald-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                {/* SVG Illustration */}
                <div className="relative shrink-0">
                  <svg className="w-52 h-44 sm:w-60 sm:h-48 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]" viewBox="0 0 220 180" fill="none">
                    {/* Limb / Leg */}
                    <rect x="25" y="60" width="170" height="55" rx="15" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                    {/* Splint Wood Plank */}
                    <rect x="15" y="125" width="190" height="20" rx="6" fill="#854d0e" stroke="#ca8a04" strokeWidth="2" />
                    <text x="110" y="139" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="bold">IMMOBILIZING SPLINT</text>
                    {/* Two Fang Punctures */}
                    <circle cx="100" cy="85" r="5" fill="#ef4444" />
                    <circle cx="120" cy="85" r="5" fill="#ef4444" />
                    {/* Gentle Bandage Wrap */}
                    <path d="M50,55 L50,120 M85,55 L85,120 M140,55 L140,120 M175,55 L175,120" stroke="#22c55e" strokeWidth="4" strokeDasharray="5 5" />
                    {/* Level Arrow Below Heart */}
                    <path d="M110,25 L110,48 M102,40 L110,48 L118,40" stroke="#00F3FF" strokeWidth="3" strokeLinecap="round" />
                    <text x="110" y="20" textAnchor="middle" fill="#00F3FF" fontSize="11" fontWeight="bold">KEEP BELOW HEART</text>
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'जीवन रक्षक तथ्य (Life Saving Protocol)' : 'Anti-Snake Venom (ASV)'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isHi
                      ? 'अंग को बिल्कुल न हिलाएं और दिल के स्तर से नीचे रखें!'
                      : 'Keep patient totally still & immobilize limb below heart!'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {isHi
                      ? 'भारत में 70% साँप विषहीन होते हैं। साँप का जहर नसों में नहीं बल्कि लसिका (lymph) से फैलता है जो चलने-हिलने से तेज होता है। पीड़ित को लिटाकर तुरंत एंटी-वेनम (ASV) वाले अस्पताल ले जाएं।'
                      : 'Venom travels primarily through the lymphatic system, accelerated by movement and panic. Keep the victim calm and still. Transport directly to nearest hospital with Anti-Snake Venom.'}
                  </p>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleVoiceReadout(
                          isHi
                            ? 'साँप काटने पर पीड़ित को शांत रखें। घाव वाले अंग को बिल्कुल न हिलाएं और दिल के स्तर से नीचे रखें। अंगूठी, घड़ी और तंग कपड़े तुरंत उतार दें। घाव पर चीरा या टूर्निकेट कभी न लगाएं।'
                            : 'For snake bite, keep victim calm and still. Keep bitten limb immobilized below heart level. Remove rings and tight clothes. Never cut the wound or tie tight tourniquets.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 font-black text-xs sm:text-sm flex items-center space-x-2 cursor-pointer border border-emerald-500/30"
                    >
                      {isPlayingVoice ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      <span>{isPlayingVoice ? (isHi ? 'आवाज रोकें' : 'Stop Audio') : (isHi ? '🔊 बोलकर समझाएं' : '🔊 Listen Audio Guide')}</span>
                    </button>
                    <a
                      href="tel:108"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isHi ? '108 अस्पताल कॉल' : 'Call 108 for ASV'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Big DOs and DONTs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DOs */}
                <div className="p-5 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/50 space-y-3">
                  <div className="flex items-center space-x-2 font-black text-emerald-300 text-base uppercase">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <span>{isHi ? 'क्या करें (ज़रूरी कदम)' : 'MANDATORY DOs'}</span>
                  </div>
                  <ul className="space-y-2 text-sm sm:text-base text-slate-200 font-medium">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-black text-lg">•</span>
                      <span>{isHi ? 'मरीज को शांत रखें और पीड़ित अंग को लकड़ी/स्प्लिंट से बांधकर स्थिर रखें।' : 'Immobilize bitten limb with a splint and keep still.'}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-black text-lg">•</span>
                      <span>{isHi ? 'अंगूठी, घड़ी, कड़ा, पायल व जूते तुरंत उतार दें (सूजन आने से पहले)।' : 'Remove rings, watches, anklets, and shoes before swelling occurs.'}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-black text-lg">•</span>
                      <span>{isHi ? 'काटने का समय नोट करें और सुरक्षित दूरी से साँप की फोटो लें।' : 'Note the exact time of bite and safely photograph the snake if possible.'}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-black text-lg">•</span>
                      <span>{isHi ? 'मरीज को पैदल न चलने दें; बाइक या कार में लिटाकर ले जाएं।' : 'Do NOT let the victim walk; carry or transport them lying down.'}</span>
                    </li>
                  </ul>
                </div>

                {/* DONTs */}
                <div className="p-5 rounded-3xl bg-rose-950/40 border-2 border-rose-500/50 space-y-3">
                  <div className="flex items-center space-x-2 font-black text-rose-300 text-base uppercase">
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    <span>{isHi ? 'क्या बिल्कुल न करें (जानलेवा गलतियां)' : 'FATAL DONTs — NEVER DO THIS'}</span>
                  </div>
                  <ul className="space-y-2 text-sm sm:text-base text-slate-200 font-medium">
                    <li className="flex items-start space-x-2">
                      <span className="text-rose-400 font-black text-lg">❌</span>
                      <span>{isHi ? 'घाव पर ब्लेड या चाकू से चीरा कभी न लगाएं।' : 'NEVER cut, slash, or puncture the wound.'}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-rose-400 font-black text-lg">❌</span>
                      <span>{isHi ? 'मुंह से जहर चूसने की कोशिश कभी न करें।' : 'NEVER suck venom with your mouth.'}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-rose-400 font-black text-lg">❌</span>
                      <span>{isHi ? 'कसकर रस्सी या टूर्निकेट न बांधें (अंग सड़ने का खतरा)।' : 'NEVER tie tight tourniquets (causes limb necrosis & amputation).'}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-rose-400 font-black text-lg">❌</span>
                      <span>{isHi ? 'बर्फ, करंट, चूना या नीम-जड़ी बूटियां न लगाएं।' : 'NEVER apply ice, electric shocks, or folk herbs to the wound.'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ===================== CHOKING / HEIMLICH SECTION ===================== */}
          {selectedTopic === 'choking' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/60 border-2 border-cyan-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                <div className="relative shrink-0">
                  <svg className="w-52 h-48 sm:w-60 sm:h-52 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]" viewBox="0 0 220 200" fill="none">
                    {/* Victim Silhouette */}
                    <circle cx="90" cy="50" r="22" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                    <rect x="70" y="75" width="40" height="90" rx="10" fill="#312e81" stroke="#6366f1" strokeWidth="3" />
                    {/* Rescuer Behind */}
                    <circle cx="140" cy="45" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="120" y="70" width="45" height="95" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
                    {/* Rescuer Arms Wrapping to Victim Navel Area */}
                    <path d="M125,95 Q100,105 90,110" stroke="#00F3FF" strokeWidth="8" strokeLinecap="round" />
                    {/* Fist at Navel with Upward Arrow */}
                    <circle cx="85" cy="110" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <path d="M85,130 L85,95 M77,105 L85,95 L93,105" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
                    <text x="85" y="155" textAnchor="middle" fill="#00F3FF" fontSize="12" fontWeight="900">IN & UPWARD</text>
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'हैमलिक तकनीक (Heimlich Maneuver)' : 'Heimlich Abdominal Thrusts'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isHi
                      ? 'नाभि के ठीक ऊपर मुट्ठी रखकर अंदर और ऊपर की ओर झटका दें!'
                      : 'Place fist just above navel and thrust inward & upward!'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {isHi
                      ? 'अगर व्यक्ति खांस नहीं पा रहा, बोल नहीं पा रहा या दोनों हाथों से गला पकड़ रहा है तो सांस की नली बंद है। तुरंत पीछे खड़े होकर पेट पर अंदर और ऊपर की ओर 5 झटके दें।'
                      : 'If victim cannot speak, cough, or breathe, airway is fully blocked. Stand behind them, lean them slightly forward, and deliver 5 sharp inward and upward abdominal thrusts.'}
                  </p>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleVoiceReadout(
                          isHi
                            ? 'दम घुटने पर पीड़ित के पीछे खड़े हों। एक हाथ की मुट्ठी नाभि के ऊपर रखें। दूसरे हाथ से पकड़कर पेट को अंदर और ऊपर की तरफ झटके से दबाएं।'
                            : 'For choking, stand behind victim. Place one fist just above navel. Grasp with other hand and thrust inward and upward with quick force.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 font-black text-xs sm:text-sm flex items-center space-x-2 cursor-pointer border border-cyan-500/30"
                    >
                      {isPlayingVoice ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                      <span>{isPlayingVoice ? (isHi ? 'आवाज रोकें' : 'Stop Audio') : (isHi ? '🔊 बोलकर समझाएं' : '🔊 Listen Audio Guide')}</span>
                    </button>
                    <a
                      href="tel:108"
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isHi ? '108 एम्बुलेंस' : 'Call 108'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Step Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-300 font-black text-base">
                    <span className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center text-sm font-black">1</span>
                    <span>{isHi ? 'पीठ पर 5 थपकियां (5 Back Blows)' : '5 Back Blows First'}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {isHi
                      ? 'मरीज को थोड़ा आगे झुकाएं। अपनी हथेली के निचले हिस्से से दोनों कंधों के बीच पीठ पर 5 बार तेज थपकियां मारें।'
                      : 'Lean victim slightly forward. Deliver 5 firm blows with heel of your hand between their shoulder blades.'}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-300 font-black text-base">
                    <span className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center text-sm font-black">2</span>
                    <span>{isHi ? 'पेट पर 5 झटके (5 Abdominal Thrusts)' : '5 Abdominal Thrusts (Heimlich)'}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {isHi
                      ? 'यदि वस्तु बाहर न निकले, तो नाभि के ठीक ऊपर मुट्ठी रखकर अंदर और ऊपर 5 बार तेज झटके दें। वस्तु निकलने तक दोहराएं।'
                      : 'If airway is not clear, place fist thumb-side against stomach above navel. Thrust sharply inward and upward until object is expelled.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== SEVERE BLEEDING SECTION ===================== */}
          {selectedTopic === 'bleeding' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/60 border-2 border-red-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                <div className="relative shrink-0">
                  <svg className="w-52 h-44 sm:w-60 sm:h-48 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" viewBox="0 0 220 180" fill="none">
                    {/* Arm / Leg */}
                    <rect x="20" y="70" width="180" height="50" rx="15" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
                    {/* Clean Dressing / Cloth Pad */}
                    <rect x="80" y="60" width="60" height="70" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
                    {/* Rescuer Hands Pressing Down Firmly */}
                    <path d="M110,20 L110,60" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="110" cy="20" r="14" fill="#ef4444" />
                    {/* Force Arrows */}
                    <path d="M95,35 L110,55 L125,35" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <text x="110" y="155" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="900">CONTINUOUS DIRECT PRESSURE</text>
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'रक्तस्राव रोकथाम (Hemorrhage Control)' : 'Direct Pressure Rule'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isHi
                      ? 'साफ कपड़े से घाव पर बिना रुके लगातार सीधा दबाव बनाएं!'
                      : 'Apply continuous, unrelenting direct pressure with clean cloth!'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {isHi
                      ? 'खून से कपड़ा भीग जाए तो उसे हटाएं नहीं, बल्कि उसके ऊपर दूसरा कपड़ा रखकर और जोर से दबाएं। यदि हाथ या पैर में चोट है तो उसे दिल के स्तर से ऊपर उठाएं।'
                      : 'Never remove soaked cloths—it disrupts blood clots. Add more padding on top and push even harder. Elevate injured limb above heart level.'}
                  </p>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleVoiceReadout(
                          isHi
                            ? 'खून बहने पर साफ कपड़े से घाव पर लगातार सीधा दबाव बनाएं। कपड़ा भीग जाए तो हटाएं नहीं, ऊपर दूसरा कपड़ा रखें। अंग को दिल के स्तर से ऊपर उठाएं।'
                            : 'For severe bleeding, push firmly on wound with clean cloth. Do not lift cloth if soaked. Add more layers and press hard. Elevate the limb.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-red-300 font-black text-xs sm:text-sm flex items-center space-x-2 cursor-pointer border border-red-500/30"
                    >
                      {isPlayingVoice ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-red-400" />}
                      <span>{isPlayingVoice ? (isHi ? 'आवाज रोकें' : 'Stop Audio') : (isHi ? '🔊 बोलकर समझाएं' : '🔊 Listen Audio Guide')}</span>
                    </button>
                    <a
                      href="tel:108"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isHi ? '108 एम्बुलेंस' : 'Call 108'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-red-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-black">1</span>
                    <span>{isHi ? 'दबाव (Pressure)' : 'Press Hard'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{isHi ? 'हथेलियों से दबाएं' : 'Firm Direct Grip'}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {isHi ? 'साफ रुमाल, तौलिया या पट्टी रखकर पूरे वजन से दबाएं।' : 'Use clean cloth or gauze. Apply firm two-handed pressure.'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center text-sm font-black">2</span>
                    <span>{isHi ? 'ऊंचा उठाएं (Elevate)' : 'Elevate Limb'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{isHi ? 'दिल से ऊपर रखें' : 'Above Heart Level'}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {isHi ? 'यदि हड्डी न टूटी हो तो घायल हाथ या पैर को ऊपर उठाएं।' : 'Gravity slows blood flow. Keep injured limb raised.'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center text-sm font-black">3</span>
                    <span>{isHi ? 'पट्टी बांधें (Wrap)' : 'Secure Bandage'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{isHi ? 'कसकर पट्टी करें' : 'Pressure Dressing'}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {isHi ? 'कपड़े को कसकर बांधें। यदि खून फव्वारे जैसा फूटे तो ऊपर टूर्निकेट बांधें।' : 'Wrap firmly. For spurting arterial bleed, apply commercial tourniquet.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== FIRE & BURNS SECTION ===================== */}
          {selectedTopic === 'fire' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/60 border-2 border-amber-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                <div className="relative shrink-0">
                  <svg className="w-52 h-44 sm:w-60 sm:h-48 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" viewBox="0 0 220 180" fill="none">
                    {/* Rolling Person */}
                    <ellipse cx="110" cy="115" rx="60" ry="25" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
                    <circle cx="50" cy="110" r="18" fill="#475569" />
                    {/* Flame Extinguishing Animation */}
                    <path d="M90,75 Q80,40 100,20 Q120,40 110,75 Z" fill="#f59e0b" className="animate-pulse" />
                    <path d="M125,85 Q115,55 130,40 Q145,55 135,85 Z" fill="#ef4444" className="animate-pulse" />
                    {/* Ground line */}
                    <line x1="20" y1="145" x2="200" y2="145" stroke="#64748b" strokeWidth="4" />
                    <text x="110" y="168" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="900">STOP • DROP • ROLL</text>
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'आग में कभी न भागें (Stop Drop Roll)' : 'Life Saving Reflex'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isHi
                      ? 'कपड़ों में आग लगे तो भागें नहीं! तुरंत रुकें, जमीन पर गिरें और लुढ़कें!'
                      : 'Never run if clothes catch fire! Stop, Drop to floor and Roll!'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {isHi
                      ? 'भागने से हवा मिलकर आग तेजी से फैलती है। तुरंत जमीन पर लेटकर मुंह ढकें और आगे-पीछे लुढ़कें ताकि आग बुझ जाए। जलने पर 20 मिनट तक बहता ठंडा पानी डालें।'
                      : 'Running fans the flames with oxygen. Drop down, cover your face with hands, and roll back and forth to smother flames. For burns, cool immediately under running tap water for 20 minutes.'}
                  </p>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleVoiceReadout(
                          isHi
                            ? 'कपड़ों में आग लगने पर कभी न भागें। तुरंत जमीन पर लेटें, मुंह दोनों हाथों से ढकें और लुढ़कें। जले हिस्से पर बीस मिनट तक नल का ठंडा पानी डालें। टूथपेस्ट या तेल कभी न लगाएं।'
                            : 'If clothes catch fire, do not run. Stop, drop to the ground, cover face with hands, and roll to extinguish. Cool burns under running tap water for 20 minutes.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-black text-xs sm:text-sm flex items-center space-x-2 cursor-pointer border border-amber-500/30"
                    >
                      {isPlayingVoice ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                      <span>{isPlayingVoice ? (isHi ? 'आवाज रोकें' : 'Stop Audio') : (isHi ? '🔊 बोलकर समझाएं' : '🔊 Listen Audio Guide')}</span>
                    </button>
                    <a
                      href="tel:101"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isHi ? '101 फायर ब्रिगेड' : 'Call 101 Fire'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Do & Don't for Burns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-amber-950/40 border-2 border-amber-500/50 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-black text-base">
                    <CheckCircle2 className="w-6 h-6 text-amber-400" />
                    <span>{isHi ? 'जलने पर: 20 मिनट ठंडा पानी' : 'Cool with Tap Water (20 Min)'}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {isHi
                      ? 'जले हिस्से पर तुरंत 15 से 20 मिनट तक सामान्य ठंडा नल का बहता पानी डालें। इससे त्वचा के अंदर गर्मी फैलना रुकती है।'
                      : 'Pour cool running tap water continuously for 15-20 minutes. Stops deep tissue thermal damage immediately.'}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-rose-950/40 border-2 border-rose-500/50 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-300 font-black text-base">
                    <XCircle className="w-6 h-6 text-rose-400" />
                    <span>{isHi ? '❌ टूथपेस्ट, बर्फ या मक्खन न लगाएं' : '❌ NEVER Apply Toothpaste, Ice, Butter'}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {isHi
                      ? 'बर्फ लगाने से टिशू जम जाते हैं और टूथपेस्ट या तेल से भयानक इन्फेक्शन होता है। फफोले कभी न फोड़ें।'
                      : 'Ice causes severe tissue ischemia/frostbite. Butter, oils, and toothpaste cause serious infections. Do not pop blisters.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== ELECTRIC SHOCK SECTION ===================== */}
          {selectedTopic === 'electric' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-black/60 border-2 border-yellow-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                <div className="relative shrink-0">
                  <svg className="w-52 h-44 sm:w-60 sm:h-48 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]" viewBox="0 0 220 180" fill="none">
                    {/* Main Switchboard */}
                    <rect x="25" y="30" width="50" height="70" rx="8" fill="#1e293b" stroke="#eab308" strokeWidth="3" />
                    <line x1="50" y1="50" x2="50" y2="70" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                    <text x="50" y="90" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="bold">OFF</text>
                    {/* Rescuer with Wooden Stick */}
                    <circle cx="170" cy="50" r="18" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="155" y="70" width="30" height="70" rx="8" fill="#1e293b" />
                    <line x1="160" y1="85" x2="85" y2="105" stroke="#a16207" strokeWidth="7" strokeLinecap="round" />
                    <text x="120" y="80" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="bold">WOODEN STICK</text>
                    <text x="110" y="160" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="900">DO NOT TOUCH DIRECTLY</text>
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHi ? 'बिजली झटका सुरक्षा (Electrical Isolation)' : 'Power Cut Rule'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isHi
                      ? 'पीड़ित को सीधे हाथ न लगाएं! पहले मेन स्विच बंद करें या सूखी लकड़ी का प्रयोग करें!'
                      : 'Do NOT touch victim directly! Cut main power or use dry wood!'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {isHi
                      ? 'मानव शरीर बिजली का सुचालक है। यदि आप पीड़ित को छुएंगे तो करंट आपके अंदर भी आ जाएगा। तुरंत मुख्य एमसीबी या स्विच बंद करें। केवल सूखी लकड़ी, प्लास्टिक या रबर से अलग करें।'
                      : 'The human body conducts electricity. Touching the victim will electrocute you too. Turn off the main circuit breaker / MCB immediately. Use a dry wooden stick or plastic pipe to push wires away.'}
                  </p>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleVoiceReadout(
                          isHi
                            ? 'बिजली का झटका लगने पर पीड़ित को सीधे हाथ न लगाएं। सबसे पहले घर का मेन स्विच या एमसीबी बंद करें। तार हटाने के लिए सूखी लकड़ी या रबर का इस्तेमाल करें।'
                            : 'In electric shock, never touch victim directly. Cut the main circuit switch immediately. Use dry wood or plastic to separate the person from power source.'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-yellow-300 font-black text-xs sm:text-sm flex items-center space-x-2 cursor-pointer border border-yellow-500/30"
                    >
                      {isPlayingVoice ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
                      <span>{isPlayingVoice ? (isHi ? 'आवाज रोकें' : 'Stop Audio') : (isHi ? '🔊 बोलकर समझाएं' : '🔊 Listen Audio Guide')}</span>
                    </button>
                    <a
                      href="tel:112"
                      className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isHi ? '112 इमरजेंसी' : 'Call 112'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-yellow-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-yellow-500 text-black flex items-center justify-center text-sm font-black">1</span>
                    <span>{isHi ? 'स्विच बंद (Cut MCB)' : 'Cut Power'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{isHi ? 'मेन स्विच गिराएं' : 'Main Breaker OFF'}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {isHi ? 'सबसे पहले मुख्य विद्युत आपूर्ति (MCB / Main Power) बंद करें।' : 'Switch off the main electrical board or pull out the plug.'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm font-black">2</span>
                    <span>{isHi ? 'सूखी लकड़ी (Insulate)' : 'Separate Safely'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{isHi ? 'सूखे डंडे से हटाएं' : 'Dry Wooden Broom'}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {isHi ? 'सूखे चप्पल पहनकर सूखी लकड़ी या प्लास्टिक से तार को दूर धकेलें।' : 'Stand on dry rubber or wooden surface. Push wire with dry wooden pole.'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border-2 border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-black text-sm uppercase">
                    <span className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-black">3</span>
                    <span>{isHi ? 'CPR जांचें (Check Pulse)' : 'Check Breathing'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">{isHi ? 'सांस न हो तो CPR' : 'Start CPR if Needed'}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {isHi ? 'करंट हटने के बाद सांस देखें। सांस बंद हो तो तुरंत CPR शुरू करें।' : 'Once power is disconnected, check breathing. If absent, initiate CPR.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold">
            <span>{isHi ? 'आपातकालीन राष्ट्रीय हॉटलाइन:' : 'National Emergency Dials:'}</span>
            <a href="tel:112" className="text-cyan-400 font-bold hover:underline">112 (Police)</a>
            <span>•</span>
            <a href="tel:108" className="text-rose-400 font-bold hover:underline">108 (Ambulance)</a>
            <span>•</span>
            <a href="tel:101" className="text-amber-400 font-bold hover:underline">101 (Fire)</a>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            {isHi ? 'निर्देश बंद करें (Close Guide)' : 'Done / Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedGuidesModal;
