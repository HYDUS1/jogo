import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Bot,
  Lock,
  Clock,
  Volume2,
  VolumeX,
  Zap,
  BookOpen,
  Smartphone,
  Share2,
  Search,
  X,
  Mic,
  MicOff,
  QrCode,
  Download,
  AlertTriangle,
  Flame,
  HeartPulse
} from 'lucide-react';
import JashpiLogo from './JashpiLogo';
import { EmergencyContact } from '../types';

interface HomeDashboardProps {
  userName: string;
  isDarkMode: boolean;
  language: string; // 'en' | 'hi'
  voiceActive: boolean;
  onToggleVoice: () => void;
  batteryLevel: number | null;
  isCharging: boolean;
  countdown: number | null;
  onCancelCountdown: () => void;
  onTriggerSos: () => void;
  onOpenAiChat: (prefilledPrompt?: string) => void;
  onOpenEmergencyDialer: () => void;
  onOpenOtpShield: () => void;
  onOpenQrScanner: () => void;
  onOpenSafetyMode: () => void;
  onOpenGuides: () => void;
  onOpenContacts: () => void;
  onOpenAndroidHub: () => void;
  onOpenHolidayMode: () => void;
  onOpenStealth: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
  torchActive: boolean;
  onToggleTorch: () => void;
  holidayModeActive: boolean;
  safetyCheckActive: boolean;
  primaryContact?: EmergencyContact;
  customLogoUrl?: string | null;
  onTestVolumeBoost?: () => void;
  volumeState?: { isBoosted: boolean; currentVolume: number; normalVolume: number };
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userName,
  isDarkMode,
  language,
  voiceActive,
  onToggleVoice,
  batteryLevel,
  isCharging: _isCharging,
  countdown,
  onCancelCountdown,
  onTriggerSos,
  onOpenAiChat,
  onOpenEmergencyDialer,
  onOpenOtpShield,
  onOpenQrScanner,
  onOpenSafetyMode,
  onOpenGuides,
  onOpenContacts: _onOpenContacts,
  onOpenAndroidHub,
  onOpenHolidayMode,
  onOpenStealth: _onOpenStealth,
  isSirenActive,
  onToggleSiren,
  torchActive,
  onToggleTorch,
  holidayModeActive,
  safetyCheckActive,
  primaryContact,
  customLogoUrl,
  onTestVolumeBoost,
  volumeState,
}) => {
  const isHi = language === 'hi';
  const [searchQuery, setSearchQuery] = useState('');

  // Generate WhatsApp SOS link
  const generateWhatsAppLink = () => {
    const text = encodeURIComponent(
      `🚨 EMERGENCY SOS ALERT! I need immediate help! My battery is at ${batteryLevel ?? 'unknown'}%. Please check on me right now!`
    );
    const phone = primaryContact?.phone?.replace(/[^0-9]/g, '') || '';
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  // Feature Registry for Instant Search & Dead-Simple Navigation
  // Note: SIREN is strictly NOT in the normal grid - user explicitly instructed:
  // "remove the siren festure from the main home it is only available in voice command like when user says siren bajao tab else no siren the sound is iirriating"
  const allFeatures = useMemo(() => [
    {
      id: 'emergency_dialer',
      titleHi: '⚡ 1-टच इमरजेंसी डायलर (Direct Call)',
      titleEn: '⚡ Real 1-Touch Emergency Dialer',
      badgeHi: 'तुरंत कॉल',
      badgeEn: 'Direct Call',
      descHi: '112 पुलिस, 108 एम्बुलेंस और परिवार को 1-टैप में सीधा असली फोन कॉल लगाएं।',
      descEn: 'Direct real 1-touch phone call to 112 Police, 108 Ambulance, and your family.',
      btnHi: 'तुरंत कॉल लगाएं 📞',
      btnEn: 'Direct Call Now 📞',
      color: 'rose',
      icon: <PhoneCall className="w-6 h-6 text-white" />,
      action: onOpenEmergencyDialer,
      keywords: ['call', 'phone', 'dialer', 'police', 'ambulance', '112', '108', '100', 'family', 'number', 'phone lagao', 'call lagao']
    },
    {
      id: 'torch',
      titleHi: '🔦 स्ट्रोब टॉर्च / बत्ती',
      titleEn: '🔦 SOS Flashlight / Torch',
      badgeHi: torchActive ? 'टॉर्च ON' : 'टॉर्च OFF',
      badgeEn: torchActive ? 'Light ON' : 'Light OFF',
      descHi: 'अंधेरे में रास्ता देखने या खतरे में संकेत देने के लिए 1-क्लिक में स्क्रीन व कैमरा टॉर्च।',
      descEn: 'Instant high-brightness flashlight & signaling strobe for dark emergencies.',
      btnHi: torchActive ? 'टॉर्च बंद करें ✕' : 'टॉर्च चालू करें ⚡',
      btnEn: torchActive ? 'Turn Off Light ✕' : 'Turn On Light ⚡',
      color: 'amber',
      icon: <Zap className="w-6 h-6 text-black" />,
      action: onToggleTorch,
      activeState: torchActive,
      keywords: ['torch', 'light', 'flashlight', 'batti', 'strobe', 'andhera', 'roshni', 'batti jalao']
    },
    {
      id: 'qr_scanner',
      titleHi: '📷 स्मार्ट QR व लिंक स्कैनर',
      titleEn: '📷 Smart QR & Link Scanner',
      badgeHi: 'सुपर फास्ट',
      badgeEn: 'Ultra Fast',
      descHi: 'कैमरा सामने रखें — WhatsApp ग्रुप, Telegram, UPI पेमेंट और संपर्क 1 सेकंड में स्कैन करें।',
      descEn: 'Scan WhatsApp groups, Telegram channels, UPI payment & contacts in 1 second.',
      btnHi: 'स्कैनर खोलें 📷',
      btnEn: 'Open QR Scanner 📷',
      color: 'cyan',
      icon: <QrCode className="w-6 h-6 text-black" />,
      action: onOpenQrScanner,
      keywords: ['scanner', 'qr', 'scan', 'camera', 'upi', 'whatsapp', 'telegram', 'link', 'code', 'photo']
    },
    {
      id: 'ai_doctor',
      titleHi: '🤖 स्मार्ट AI डॉक्टर व फर्स्ट एड',
      titleEn: '🤖 Smart AI Copilot & First Aid',
      badgeHi: '24x7 सलाह',
      badgeEn: '24/7 AI Guide',
      descHi: 'चोट, दर्द, एक्सीडेंट या घबराहट? हिंदी या इंग्लिश में पूछें, तुरंत आसान समाधान पाएं।',
      descEn: 'Instant medical triage, accident first aid & emergency advice in simple words.',
      btnHi: 'AI से पूछें 🤖',
      btnEn: 'Ask AI Copilot 🤖',
      color: 'blue',
      icon: <Bot className="w-6 h-6 text-white" />,
      action: () => onOpenAiChat(),
      keywords: ['doctor', 'ai', 'bimari', 'dard', 'cpr', 'accident', 'first aid', 'chot', 'help', 'dawa']
    },
    {
      id: 'otp_shield',
      titleHi: '🛡️ साइबर व OTP फ्रॉड शील्ड',
      titleEn: '🛡️ Cyber & OTP Scam Shield',
      badgeHi: 'हेल्पलाइन 1930',
      badgeEn: 'Helpline 1930',
      descHi: 'संदिग्ध SMS, बैंक मैसेज या फर्जी लिंक चेक करें। साइबर फ्रॉड हेल्पलाइन 1930 से जुड़ा।',
      descEn: 'Analyze suspicious SMS, fake bank OTPs & scam links. Direct link to Helpline 1930.',
      btnHi: 'मैसेज चेक करें 🛡️',
      btnEn: 'Check Fraud SMS 🛡️',
      color: 'purple',
      icon: <Lock className="w-6 h-6 text-white" />,
      action: onOpenOtpShield,
      keywords: ['fraud', 'otp', 'scam', '1930', 'cyber', 'bank', 'sms', 'dhoka', 'thagi', 'phishing']
    },
    {
      id: 'walk_guard',
      titleHi: '🚶 स्मार्ट वॉक गार्ड (सफर सुरक्षा)',
      titleEn: '🚶 Smart Walk Guard (Solo Travel)',
      badgeHi: safetyCheckActive ? 'चल रहा है (ON)' : 'टाइमर',
      badgeEn: safetyCheckActive ? 'Active (ON)' : 'Timer',
      descHi: 'रात में अकेले चलते समय टाइमर लगाएं। समय पर न पहुंचने पर परिवार को ऑटोमैटिक SOS।',
      descEn: 'Solo walk escort timer. If you do not check in, auto-dispatches SOS to family.',
      btnHi: safetyCheckActive ? 'टाइमर चल रहा है →' : 'वॉक गार्ड शुरू करें 🚶',
      btnEn: safetyCheckActive ? 'Timer Active →' : 'Start Walk Guard 🚶',
      color: 'emerald',
      icon: <Clock className="w-6 h-6 text-white" />,
      action: onOpenSafetyMode,
      activeState: safetyCheckActive,
      keywords: ['walk', 'guard', 'safar', 'travel', 'night', 'rasta', 'timer', 'safety timer', 'alone']
    },
    {
      id: 'visual_guides',
      titleHi: '📖 चित्रमय फर्स्ट एड गाइड',
      titleEn: '📖 Visual First Aid Guides',
      badgeHi: 'आसान चित्र',
      badgeEn: 'Illustrated',
      descHi: 'CPR, दम घुटना, सांप का काटना और जलने पर क्या करें — बच्चों जैसे आसान चित्रों सहित।',
      descEn: 'Step-by-step illustrated guides for CPR, choking, snake bite, burns & shock.',
      btnHi: 'गाइड देखें 📖',
      btnEn: 'View Visual Guides 📖',
      color: 'teal',
      icon: <BookOpen className="w-6 h-6 text-white" />,
      action: onOpenGuides,
      keywords: ['guide', 'cpr', 'choking', 'snake', 'burns', 'saamp', 'aag', 'chitra', 'first aid guide']
    },
    {
      id: 'android_apk',
      titleHi: '📱 असली ऐप व APK डाउनलोड',
      titleEn: '📱 Native App & APK Download',
      badgeHi: 'Full Kotlin APK',
      badgeEn: 'Full Kotlin APK',
      descHi: 'सीधे फोन में असली Android APK इंस्टॉल करें या होम स्क्रीन पर 1-टैप में ऐप जोड़ें।',
      descEn: 'Download full functional Android APK or install directly to phone home screen.',
      btnHi: 'APK डाउनलोड करें ⬇️',
      btnEn: 'Download APK ⬇️',
      color: 'cyan',
      icon: <Download className="w-6 h-6 text-black" />,
      action: onOpenAndroidHub,
      keywords: ['download', 'apk', 'app', 'install', 'android', 'kotlin', 'mobile', 'setup', 'phone app']
    },
    {
      id: 'volume_boost',
      titleHi: '🔊 100% इमरजेंसी वॉल्यूम-बूस्ट',
      titleEn: '🔊 100% Emergency Volume-Boost',
      badgeHi: 'ऑटो-रिस्टोर',
      badgeEn: 'Auto-Restore',
      descHi: `खतरे में फोन की आवाज खुद 100% हो जाती है और संकट टलने पर वापस ${Math.round((volumeState?.normalVolume || 0.65) * 100)}% पर लौट आती है।`,
      descEn: `Automatically spikes volume to 100% during active emergencies, then cleanly restores to ${Math.round((volumeState?.normalVolume || 0.65) * 100)}%.`,
      btnHi: 'वॉल्यूम टेस्ट करें 🔊',
      btnEn: 'Test Volume Boost 🔊',
      color: 'orange',
      icon: <Volume2 className="w-6 h-6 text-white" />,
      action: onTestVolumeBoost,
      activeState: volumeState?.isBoosted,
      keywords: ['volume', 'sound', 'loud', 'awaaz', 'audio', 'boost', 'speaker', 'tez']
    },
    {
      id: 'holiday_mode',
      titleHi: '✈️ घूमने का मोड (Holiday Mode)',
      titleEn: '✈️ Wander / Holiday Mode',
      badgeHi: holidayModeActive ? 'सक्रिय है (ON)' : 'मोड',
      badgeEn: holidayModeActive ? 'Active (ON)' : 'Mode',
      descHi: 'छुट्टी या यात्रा के दौरान बेवजह के इनएक्टिविटी SOS को रोके रखें ताकि परेशानी न हो।',
      descEn: 'Pauses automated inactivity checks while you relax or travel freely.',
      btnHi: holidayModeActive ? 'मोड ऑन है (ON)' : 'सेट करें ✈️',
      btnEn: holidayModeActive ? 'Mode Active' : 'Configure ✈️',
      color: 'indigo',
      icon: <Smartphone className="w-6 h-6 text-white" />,
      action: onOpenHolidayMode,
      activeState: holidayModeActive,
      keywords: ['holiday', 'wander', 'travel', 'chhutti', 'yatra', 'ghoomna', 'vacation']
    }
  ], [
    isHi,
    torchActive,
    safetyCheckActive,
    holidayModeActive,
    volumeState,
    onOpenEmergencyDialer,
    onToggleTorch,
    onOpenQrScanner,
    onOpenAiChat,
    onOpenOtpShield,
    onOpenSafetyMode,
    onOpenGuides,
    onOpenAndroidHub,
    onTestVolumeBoost,
    onOpenHolidayMode
  ]);

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return allFeatures;
    const query = searchQuery.toLowerCase().trim();
    return allFeatures.filter((f) => {
      const matchTitleHi = f.titleHi.toLowerCase().includes(query);
      const matchTitleEn = f.titleEn.toLowerCase().includes(query);
      const matchDescHi = f.descHi.toLowerCase().includes(query);
      const matchDescEn = f.descEn.toLowerCase().includes(query);
      const matchKeywords = f.keywords.some((k) => k.toLowerCase().includes(query));
      return matchTitleHi || matchTitleEn || matchDescHi || matchDescEn || matchKeywords;
    });
  }, [allFeatures, searchQuery]);

  const queryMentionsSiren = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return q.includes('siren') || q.includes('alarm') || q.includes('sound');
  }, [searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-4 sm:space-y-6 animate-fade-in">
      
      {/* ACTIVE VOICE SIREN BANNER (ONLY APPEARS IF USER STARTED SIREN VIA VOICE COMMAND "siren bajao") */}
      {isSirenActive && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-2xl flex items-center justify-between animate-pulse border-2 border-red-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center font-black animate-bounce shrink-0">
              <VolumeX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {isHi ? '🔊 लाउड सायरन बज रहा है!' : '🔊 Voice Siren is Sounding!'}
              </h3>
              <p className="text-xs text-rose-100">
                {isHi ? 'माइक में बोलें "siren band" या नीचे लाल बटन दबाएं' : 'Say "siren band" to mic or tap Stop below'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleSiren}
            className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-rose-100 font-black text-xs sm:text-sm cursor-pointer shadow-lg active:scale-95 transition-transform shrink-0"
          >
            {isHi ? 'सायरन बंद करें ✕' : 'Stop Siren ✕'}
          </button>
        </div>
      )}

      {/* 1. TOP INSTALL APP BANNER */}
      <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-cyan-950/70 via-blue-950/70 to-purple-950/70 border-cyan-500/40'
          : 'bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border-cyan-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black shadow-md shrink-0">
            <Smartphone className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs sm:text-sm text-cyan-400">
                {isHi ? '📱 अपने फोन में असली App / APK डाउनलोड करें' : '📱 Download Real Android APK / App'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold hidden sm:inline">
                Full Kotlin APK
              </span>
            </div>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isHi
                ? 'डायरेक्ट APK डाउनलोड करें या 1-टैप में होम स्क्रीन पर बिना ब्राउज़र चलाएं'
                : 'Direct APK download with full Kotlin files or 1-tap phone installation'}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAndroidHub}
          className="px-3 sm:px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs cursor-pointer shadow-md shadow-cyan-500/30 shrink-0 transition-transform active:scale-95 flex items-center space-x-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isHi ? 'APK डाउनलोड' : 'Download APK'}</span>
        </button>
      </div>

      {/* 2. SYSTEM STATUS & HEADER CARD */}
      <div className={`p-4 rounded-3xl border shadow-lg relative overflow-hidden backdrop-blur-md ${
        isDarkMode
          ? 'bg-[#121626]/90 border-white/10 text-white'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <JashpiLogo size="md" customSrc={customLogoUrl || undefined} />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">
                  {userName ? (isHi ? `नमस्ते, ${userName}` : `Hello, ${userName}`) : (isHi ? 'JASHPI सुरक्षा' : 'JASHPI Safety')}
                </h2>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isHi ? 'सुरक्षित' : 'Protected'}</span>
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHi ? 'एक टैप, एक सांस, एक ज़िंदगी · आसान व सुरक्षित' : 'Simple, Foolproof All-In-One Emergency Protection'}
              </p>
            </div>
          </div>

          {/* Quick status pills: Quiet Voice toggle & Battery */}
          <div className="flex items-center space-x-2 self-start sm:self-auto text-xs">
            <button
              onClick={onToggleVoice}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 cursor-pointer transition-colors ${
                voiceActive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={voiceActive ? 'Microphone Voice Commands ON (Silent & Fast)' : 'Microphone Paused'}
            >
              {voiceActive ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
              <span className="font-bold text-[11px]">{voiceActive ? 'माइक ON' : 'माइक OFF'}</span>
            </button>

            <div className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
              isDarkMode ? 'bg-black/30 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px] font-bold">
                {batteryLevel !== null ? `${batteryLevel}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NEW: PROMINENT DEAD-SIMPLE SEARCH BAR (User requested: "add a serach bar if possible") */}
      <div className={`p-4 rounded-3xl border shadow-lg ${
        isDarkMode ? 'bg-[#0f1424] border-cyan-500/30' : 'bg-white border-cyan-200'
      }`}>
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-cyan-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHi
                ? '🔍 कुछ भी खोजें (जैसे: siren, police, torch, scanner, doctor, call)...'
                : '🔍 Search any feature (e.g. siren, torch, police, scanner, doctor)...'
            }
            className={`w-full pl-11 pr-10 py-3 rounded-2xl text-sm font-semibold outline-none transition-all ${
              isDarkMode
                ? 'bg-black/50 border border-slate-700 focus:border-cyan-400 text-white placeholder-slate-400'
                : 'bg-slate-50 border border-slate-300 focus:border-cyan-500 text-slate-900 placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Instant Search Preset Chips */}
        <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs">
          <span className={`text-[11px] font-bold mr-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isHi ? 'त्वरित खोज:' : 'Quick Tags:'}
          </span>
          {[
            { label: '🚨 SOS', query: 'sos' },
            { label: '⚡ 112 कॉल', query: 'call' },
            { label: '🔦 टॉर्च', query: 'torch' },
            { label: '📷 स्कैनर', query: 'scanner' },
            { label: '🤖 AI डॉक्टर', query: 'doctor' },
            { label: '🛡️ फ्रॉड 1930', query: 'fraud' },
            { label: '🎙️ सायरन (Voice)', query: 'siren' },
            { label: '📱 APK डाउनलोड', query: 'apk' },
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(chip.query === searchQuery ? '' : chip.query)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                searchQuery.toLowerCase() === chip.query
                  ? 'bg-cyan-500 text-black shadow-md'
                  : isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Special Voice Siren Explanation if searched "siren" */}
        {queryMentionsSiren && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">
                  {isHi ? 'सायरन केवल आवाज से चालू होता है:' : 'Siren is Voice-Controlled Only:'}
                </span>{' '}
                <span>
                  {isHi
                    ? 'होम स्क्रीन से सायरन हटा दिया गया है ताकि आवाज परेशान न करे। माइक में बोलें: "siren bajao" (चालू करने के लिए) और "siren band" (रोकने के लिए)।'
                    : 'The home siren button was removed to prevent annoying loud noise. It works exclusively via voice: say "siren bajao" to start, and "siren band" to stop.'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleVoice}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shrink-0 cursor-pointer hover:bg-amber-400"
            >
              {voiceActive ? 'माइक चालू है ✓' : 'माइक चालू करें 🎙️'}
            </button>
          </div>
        )}
      </div>

      {/* 4. HERO EMERGENCY SOS BUTTON SECTION */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl text-center relative overflow-hidden ${
        isDarkMode
          ? 'bg-gradient-to-b from-[#1e0e2e]/90 via-[#130d22]/95 to-[#0a0714] border-red-500/30'
          : 'bg-gradient-to-b from-red-50 via-white to-rose-50 border-red-200'
      }`}>
        {/* Glow ambient background aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* SOS Countdown or Normal Button */}
        {countdown !== null && countdown > 0 ? (
          <div className="relative z-10 flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-amber-400 animate-ping absolute opacity-50" />
              <button
                onClick={onCancelCountdown}
                className="w-40 h-40 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 border-4 border-amber-300 text-white flex flex-col items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.8)] cursor-pointer active:scale-95 transition-transform z-10"
              >
                <span className="text-4xl font-black">{countdown}s</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-black/40 rounded-full uppercase mt-1 text-amber-200">
                  {isHi ? 'रद्द करें (Cancel)' : 'Cancel'}
                </span>
              </button>
            </div>
            <p className="mt-4 text-sm font-bold text-amber-400 animate-pulse">
              {isHi
                ? 'आपातकालीन कॉल 112 रवाना हो रहा है! रोकने के लिए ऊपर टैप करें।'
                : 'Emergency Dispatching to 112 & Contacts! Tap above to cancel.'}
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center my-2">
              <div className="w-44 h-44 rounded-full bg-red-600/20 animate-ping pointer-events-none absolute" />
              <div className="w-52 h-52 rounded-full border border-red-500/30 animate-pulse pointer-events-none absolute" />
              <button
                onClick={onTriggerSos}
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 border-4 border-rose-300 text-white flex flex-col items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.7)] hover:shadow-[0_0_70px_rgba(239,68,68,0.9)] cursor-pointer active:scale-95 transition-all z-10"
              >
                <ShieldAlert className="w-10 h-10 mb-1 animate-pulse" />
                <span className="text-3xl font-black tracking-wider drop-shadow-md">SOS</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-100">
                  {isHi ? '1-टैप खतरा बटन' : 'ONE-TOUCH SOS'}
                </span>
              </button>
            </div>

            <div className="mt-4 max-w-sm mx-auto">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isHi ? '🚨 आपातकालीन खतरा बटन (SOS)' : '🚨 Instant Emergency SOS Button'}
              </h3>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {isHi
                  ? 'टैप करते ही 112 और परिवार को लाइव GPS लोकेशन और कॉल तैयार हो जाएगी।'
                  : 'Instantly alerts National Emergency (112) & your family circle with live GPS.'}
              </p>
            </div>
          </div>
        )}

        {/* ONE-TOUCH NATIONAL HOTLINES STRIP */}
        <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-cyan-400 text-[11px]">
              {isHi ? 'सीधा फोन कॉल नंबर (1-क्लिक कॉल):' : 'National Emergency Hotlines (India):'}
            </span>
            <span className="text-[10px] text-slate-400">1-Touch Direct Call</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: isHi ? '112 ऑल-इन-वन' : '112 Unified', number: '112', color: 'from-red-600 to-rose-700' },
              { label: isHi ? '108 एम्बुलेंस' : '108 Ambulance', number: '108', color: 'from-emerald-600 to-teal-700' },
              { label: isHi ? '100 पुलिस' : '100 Police', number: '100', color: 'from-blue-600 to-indigo-700' },
              { label: isHi ? '1930 साइबर फ्रॉड' : '1930 Cyber Fraud', number: '1930', color: 'from-purple-600 to-indigo-700' },
              { label: isHi ? '1091 महिला सुरक्षा' : '1091 Women Helpline', number: '1091', color: 'from-pink-600 to-rose-700' },
              { label: isHi ? '101 दमकल' : '101 Fire Dept', number: '101', color: 'from-amber-600 to-orange-700' },
            ].map((hotline, idx) => (
              <a
                key={idx}
                href={`tel:${hotline.number}`}
                className={`py-2 px-1.5 rounded-2xl bg-gradient-to-br ${hotline.color} text-white text-center font-bold text-xs flex flex-col items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-transform`}
              >
                <PhoneCall className="w-3.5 h-3.5 mb-0.5 opacity-90" />
                <span className="text-xs font-black leading-tight">{hotline.number}</span>
                <span className="text-[9px] opacity-80 truncate">{hotline.label.split(' ')[1]}</span>
              </a>
            ))}
          </div>

          {/* WhatsApp SOS Button */}
          <div className="mt-3 flex justify-center">
            <a
              href={generateWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'परिवार को WhatsApp पर तुरंत लाइव GPS भेजें' : 'Send WhatsApp SOS with Live GPS to Family'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 5. DEAD-SIMPLE FEATURES GRID (Siren removed from home, available via voice) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>{isHi ? 'सभी स्मार्ट फीचर्स' : 'All Smart Features'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                {filteredFeatures.length} {isHi ? 'फीचर्स उपलब्ध' : 'Tools'}
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isHi
                ? 'बिलकुल आसान व सीधे टूल्स — किसी भी स्थिति में 1-टैप में काम करें'
                : 'Dead-simple, 1-tap emergency safety tools designed for instant access'}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              {isHi ? 'सभी देखें (Reset)' : 'Show All'}
            </button>
          )}
        </div>

        {filteredFeatures.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/50">
            <p className="text-sm font-bold text-slate-300">
              {isHi ? `"${searchQuery}" से कोई फीचर नहीं मिला` : `No features found matching "${searchQuery}"`}
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
            >
              {isHi ? 'सभी फीचर्स देखें' : 'View All Tools'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFeatures.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.action}
                className={`p-4 rounded-3xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-md flex flex-col justify-between ${
                  tool.activeState
                    ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400 text-white'
                    : isDarkMode
                    ? 'bg-[#151c2e] hover:bg-[#1a233a] border-cyan-500/20 text-white'
                    : 'bg-white hover:bg-slate-50 border-cyan-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black shadow-md">
                      {tool.icon}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      {isHi ? tool.badgeHi : tool.badgeEn}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-cyan-300">
                    {isHi ? tool.titleHi : tool.titleEn}
                  </h4>
                  <p className={`text-xs mt-1 leading-snug line-clamp-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isHi ? tool.descHi : tool.descEn}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>{isHi ? tool.btnHi : tool.btnEn}</span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. VOICE NOTICE BANNER: Clarifies Siren and Voice Commands */}
      <div className={`p-4 rounded-3xl border ${
        isDarkMode ? 'bg-[#101628]/80 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {isHi ? 'माइक व आवाज कमांड्स:' : 'Voice Commands Guide:'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {voiceActive ? (isHi ? 'माइक चालू है' : 'Mic Active') : (isHi ? 'माइक बंद है' : 'Mic Off')}
          </span>
        </div>

        <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {isHi
            ? '🔊 सायरन बजाने के लिए बोलें: "siren bajao" | सायरन बंद करने के लिए: "siren band" | टॉर्च: "torch on" | मदद: "bachao" या "112 call"'
            : '🔊 To sound siren say: "siren bajao" | To stop siren: "siren band" | Flashlight: "torch on" | Help: "help me" or "call 112"'}
        </p>
      </div>

      {/* 7. SMART AI QUICK PROMPT CHIPS */}
      <div className={`p-4 rounded-3xl border ${
        isDarkMode ? 'bg-[#121626]/80 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 mb-2.5">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            {isHi ? 'AI डॉक्टर से तुरंत पूछें (1-टैप सवाल):' : 'Ask Smart AI (1-Tap Emergency Questions):'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { hi: '🚑 रोड एक्सीडेंट हुआ है — फर्स्ट एड बताओ', en: '🚑 Road accident first aid steps' },
            { hi: '💔 किसी को दिल का दौरा (Heart Attack) पड़ा है', en: '💔 Person having heart attack / CPR guide' },
            { hi: '🐍 सांप ने काट लिया — तुरंत क्या करें?', en: '🐍 Snake bite emergency treatment' },
            { hi: '🔥 आग या गैस लीक में क्या सावधानी बरतें?', en: '🔥 Gas leak / fire safety evacuation' },
            { hi: '🚶 रात में अकेले यात्रा के लिए सेफ्टी टिप्स', en: '🚶 Solo night travel security precautions' },
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onOpenAiChat(isHi ? prompt.hi : prompt.en)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
                isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
              }`}
            >
              {isHi ? prompt.hi : prompt.en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
