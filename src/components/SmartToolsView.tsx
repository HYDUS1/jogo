import React from 'react';
import {
  Phone,
  PhoneCall,
  Lock,
  Clock,
  Volume2,
  VolumeX,
  Zap,
  BookOpen,
  QrCode,
  Plane,
  EyeOff,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { VolumeState } from '../services/volumeManager';

interface SmartToolsViewProps {
  isDarkMode: boolean;
  language: string;
  onOpenEmergencyDialer: () => void;
  onOpenOtpShield: () => void;
  onOpenSafetyMode: () => void;
  onOpenQrScanner: () => void;
  onOpenGuides: () => void;
  onOpenHolidayMode: () => void;
  onOpenStealth: () => void;
  onOpenAndroidHub: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
  torchActive: boolean;
  onToggleTorch: () => void;
  holidayModeActive: boolean;
  safetyCheckActive: boolean;
  onTestVolumeBoost?: () => void;
  volumeState?: VolumeState;
}

export const SmartToolsView: React.FC<SmartToolsViewProps> = ({
  isDarkMode,
  language,
  onOpenEmergencyDialer,
  onOpenOtpShield,
  onOpenSafetyMode,
  onOpenQrScanner,
  onOpenGuides,
  onOpenHolidayMode,
  onOpenStealth,
  onOpenAndroidHub,
  isSirenActive,
  onToggleSiren,
  torchActive,
  onToggleTorch,
  holidayModeActive,
  safetyCheckActive,
  onTestVolumeBoost,
  volumeState,
}) => {
  const isHi = language === 'hi';

  const tools = [
    {
      id: 'volume_boost',
      title: isHi ? '🔊 100% आपातकालीन वॉल्यूम-बूस्ट (ऑटो रीस्टोर)' : '🔊 100% Emergency Volume-Boost (Auto Restore)',
      desc: isHi
        ? `आपातकाल सक्रिय होने पर मीडिया वॉल्यूम तुरंत 100% पर लॉक हो जाता है ताकि वॉयस गाइडेंस साफ सुनाई दे, और समाप्त होने पर वापस ${Math.round((volumeState?.normalVolume || 0.65) * 100)}% पर लौट आता है।`
        : `Automatically forces device media volume to 100% during active emergencies for crystal-clear voice guidance, then safely restores it to ${Math.round((volumeState?.normalVolume || 0.65) * 100)}% after.`,
      icon: Volume2,
      color: 'from-amber-500 to-orange-600',
      actionText: isHi ? 'वॉल्यूम बूस्ट टेस्ट करें 🔊' : 'Test 100% Volume Boost 🔊',
      action: onTestVolumeBoost || (() => {}),
      highlight: Boolean(volumeState?.isBoosted),
    },
    {
      id: 'emergency_dialer',
      title: isHi ? '⚡ वास्तविक 1-टच इमरजेंसी डायलर' : '⚡ Real 1-Touch Emergency Dialer',
      desc: isHi
        ? '112 पुलिस, 108 एम्बुलेंस और परिवार को एक क्लिक में सीधा असली फोन कॉल लगाएं।'
        : 'Direct real 1-touch telephone calling to 112, 108 Ambulance, and primary emergency contact.',
      icon: PhoneCall,
      color: 'from-rose-500 to-red-600',
      actionText: isHi ? 'कॉल लगाएं' : 'Direct Call',
      action: onOpenEmergencyDialer,
      highlight: false,
    },
    {
      id: 'otp_shield',
      title: isHi ? 'साइबर फ्रॉड व OTP शील्ड (1930)' : 'Cyber Fraud & OTP Shield (1930)',
      desc: isHi
        ? 'बैंक फ्रॉड, संदिग्ध लॉटरी SMS और फर्जी APK लिंक की तुरंत AI जांच करें।'
        : 'Analyze fake bank KYC messages, lottery phishing & malware APKs. Report directly to 1930.',
      icon: Lock,
      color: 'from-rose-500 to-red-600',
      actionText: isHi ? 'मैसेज जांचें' : 'Scan Message',
      action: onOpenOtpShield,
      highlight: false,
    },
    {
      id: 'walk_guard',
      title: isHi ? 'स्मार्ट वॉक गार्ड (Travel Escort)' : 'Smart Walk Guard / Travel Escort',
      desc: isHi
        ? 'रात में अकेले चलते समय सेफ्टी टाइमर लगाएं। समय पर चेक-इन न करने पर परिजनों को अलर्ट।'
        : 'Set a countdown while walking alone. If you do not tap safe before time ends, family is alerted.',
      icon: Clock,
      color: 'from-emerald-500 to-teal-600',
      actionText: safetyCheckActive ? (isHi ? 'चल रहा है (Active)' : 'Running') : (isHi ? 'टाइमर लगाएं' : 'Set Timer'),
      action: onOpenSafetyMode,
      highlight: safetyCheckActive,
    },
    {
      id: 'siren',
      title: isHi ? '🎙️ वॉयस सायरन (Voice-Activated)' : '🎙️ Voice-Activated Loud Siren',
      desc: isHi
        ? 'माइक में बोलें: "siren bajao" चालू करने के लिए, "siren band" रोकने के लिए।'
        : 'Controlled strictly via voice command: say "siren bajao" to start, "siren band" to stop.',
      icon: isSirenActive ? VolumeX : Volume2,
      color: 'from-amber-500 to-red-600',
      actionText: isSirenActive ? (isHi ? 'सायरन बंद करें ✕' : 'Stop Siren ✕') : (isHi ? 'बोलें "siren bajao" 🎙️' : 'Say "siren bajao" 🎙️'),
      action: onToggleSiren,
      highlight: isSirenActive,
    },
    {
      id: 'torch',
      title: isHi ? 'SOS स्ट्रोब टॉर्च (Strobe Light)' : 'SOS Strobe Flashlight',
      desc: isHi
        ? 'रात में रोशनी पाने या आपातकाल में दूर से संकेत देने के लिए स्क्रीन व कैमरा फ्लैश।'
        : 'Emergency blinding strobe and steady illumination for search and rescue or dark paths.',
      icon: Zap,
      color: 'from-yellow-400 to-amber-500',
      actionText: torchActive ? (isHi ? 'टॉर्च बंद करें' : 'Turn Off') : (isHi ? 'टॉर्च जलाएं' : 'Turn On'),
      action: onToggleTorch,
      highlight: torchActive,
    },
    {
      id: 'guides',
      title: isHi ? 'सचित्र फर्स्ट एड गाइड्स (Visual Guides)' : 'Animated First Aid & CPR Guides',
      desc: isHi
        ? 'CPR, दम घुटना, गंभीर रक्तस्राव, करंट और सांप के काटने पर जीवन रक्षक कदम सीखें।'
        : 'Visual step-by-step instructions for CPR, choking (Heimlich), snake bites, burns & shock.',
      icon: BookOpen,
      color: 'from-teal-500 to-emerald-600',
      actionText: isHi ? 'गाइड्स खोलें' : 'Open Guides',
      action: onOpenGuides,
      highlight: false,
    },
    {
      id: 'qr_scanner',
      title: isHi ? 'QR व लिंक सुरक्षा स्कैनर' : 'QR & Suspicious Link Safety Scanner',
      desc: isHi
        ? 'किसी भी संदिग्ध QR कोड या वेब लिंक को खोलने से पहले वायरस और फिशिंग के लिए जांचें।'
        : 'Scan malicious QR codes and URLs safely before opening them on your phone.',
      icon: QrCode,
      color: 'from-cyan-500 to-blue-600',
      actionText: isHi ? 'QR स्कैन करें' : 'Scan QR',
      action: onOpenQrScanner,
      highlight: false,
    },
    {
      id: 'holiday',
      title: isHi ? 'हॉलिडे व घुमक्कड़ मोड (Wander Mode)' : 'Holiday / Wander Mode',
      desc: isHi
        ? 'जब आप आराम कर रहे हों या छुट्टी पर हों, तो डिजिटल इनएक्टिविटी SOS को अस्थायी रूप से रोकें।'
        : 'Temporarily pause inactivity check-ins and false alarms during travel or vacations.',
      icon: Plane,
      color: 'from-blue-500 to-indigo-600',
      actionText: holidayModeActive ? (isHi ? 'मोड ऑन है (Active)' : 'Active (ON)') : (isHi ? 'सेट करें' : 'Configure'),
      action: onOpenHolidayMode,
      highlight: holidayModeActive,
    },
    {
      id: 'stealth',
      title: isHi ? 'स्टेल्थ मोड (गोपनीय स्क्रीन)' : 'Stealth Disguise Mode',
      desc: isHi
        ? 'स्क्रीन को साधारण घड़ी या कैलकुलेटर जैसा दिखाएं, जबकि बैकग्राउंड में सुरक्षा चालू रहे।'
        : 'Blackout or disguise screen as a clock/notes app while keeping emergency triggers ready.',
      icon: EyeOff,
      color: 'from-slate-600 to-slate-800',
      actionText: isHi ? 'स्टेल्थ ऑन करें' : 'Enable Stealth',
      action: onOpenStealth,
      highlight: false,
    },
    {
      id: 'android_app',
      title: isHi ? 'मोबाइल App इंस्टॉल करें (APK / PWA)' : 'Install as Native Phone App',
      desc: isHi
        ? 'इस सुरक्षा कवच को बिना ब्राउज़र के अपने फोन में सीधे इंस्टॉल करके होम स्क्रीन पर रखें।'
        : 'Add JASHPI to your phone home screen with 1 tap or inspect Android APK instructions.',
      icon: Smartphone,
      color: 'from-cyan-500 to-blue-600',
      actionText: isHi ? 'ऐप इंस्टॉल करें' : 'Install App',
      action: onOpenAndroidHub,
      highlight: false,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>{isHi ? 'ऑल-इन-वन स्मार्ट टूल्स' : 'All-In-One Smart Safety Toolkit'}</span>
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isHi
              ? 'आपकी दैनिक व आपातकालीन सुरक्षा के लिए सभी स्मार्ट टूल्स एक ही जगह पर'
              : 'Complete suite of proactive safety tools designed for personal security & emergency escape'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className={`p-4 rounded-3xl border shadow-md flex flex-col justify-between transition-all ${
                tool.highlight
                  ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/40 text-white'
                  : isDarkMode
                  ? 'bg-[#131929]/90 border-white/10 text-white hover:border-cyan-500/30'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${tool.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                    {tool.title}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {tool.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
                <button
                  onClick={tool.action}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5 ${
                    tool.highlight
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  <span>{tool.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartToolsView;
