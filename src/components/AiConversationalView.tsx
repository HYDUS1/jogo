import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  PhoneCall,
  MapPin,
  Flame,
  Activity,
  Zap,
  Volume2,
  VolumeX,
  ShieldAlert,
  ArrowRight,
  EyeOff,
  Radio,
  Share2,
  QrCode,
  Lock,
  Plane,
  Sun,
  Moon,
  AlertOctagon,
  Smartphone
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { askJashpiAiApi } from '../services/emergencyApi';
import { speakVoiceFeedback, playBeep } from '../services/audioSiren';
import { toggleFlashlight, isTorchOn } from '../services/flashlight';
import JashpiLogo from './JashpiLogo';

interface AiConversationalViewProps {
  userName: string;
  language: string;
  voiceActive: boolean;
  lastTranscript: string;
  onToggleVoice: () => void;
  contacts: EmergencyContact[];
  onTriggerSos: () => void;
  onOpenGuides: () => void;
  onOpenStealth: () => void;
  onOpenSafetyMode: () => void;
  onTriggerPhoneDrop: () => void;
  onTriggerSnatchSos?: () => void;
  onOpenQrScanner?: () => void;
  onOpenOtpShield?: () => void;
  onOpenHolidayMode?: () => void;
  onOpenAndroidHub?: () => void;
  onOpenEmergencyDialer?: () => void;
  initialPrompt?: string;
  customLogoUrl?: string | null;
  holidayModeActive?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actionExecuted?: string;
  timestamp: number;
}

export const AiConversationalView: React.FC<AiConversationalViewProps> = ({
  userName,
  language,
  voiceActive,
  lastTranscript,
  onToggleVoice,
  contacts,
  onTriggerSos,
  onOpenGuides,
  onOpenStealth,
  onOpenSafetyMode,
  onTriggerPhoneDrop,
  onTriggerSnatchSos,
  onOpenQrScanner,
  onOpenOtpShield,
  onOpenHolidayMode,
  onOpenAndroidHub,
  onOpenEmergencyDialer,
  initialPrompt,
  customLogoUrl,
  holidayModeActive = false,
  isDarkMode = true,
  onToggleTheme,
  isSirenActive,
  onToggleSiren,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${userName || 'there'}, I am your JASHPI Hands-Free Emergency Assistant ("Ek Tap, Ek Saans, Ek Zindagi").\n\nYou can speak hands-free or type anytime. I can dial emergency contacts, broadcast your live GPS coordinates, turn on your flashlight, activate sirens, and guide you through CPR, snake bites, or fires.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialPromptExecutedRef = useRef<string | null>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== initialPromptExecutedRef.current) {
      initialPromptExecutedRef.current = initialPrompt;
      executeAiCommand(initialPrompt, true);
    }
  }, [initialPrompt]);

  const primaryContact = contacts.find((c) => c.callEnabled) || contacts[0] || {
    name: 'National Emergency',
    phone: '112',
  };

  // Quick Action Execution Handler
  const executeAiCommand = async (command: string, isFromUser = true) => {
    const cleanCmd = command.toLowerCase().trim();
    if (isFromUser) {
      setMessages((prev) => [
        ...prev,
        { id: 'usr_' + Date.now(), role: 'user', text: command, timestamp: Date.now() },
      ]);
    }
    setIsLoading(true);

    // 1. Tool check: Call
    if (cleanCmd.includes('call') || cleanCmd.includes('phone milao') || cleanCmd.includes('phone lagao')) {
      const reply = `Initiating direct phone call to ${primaryContact.name} (${primaryContact.phone}). Stay safe.`;
      speakVoiceFeedback(reply);
      setMessages((prev) => [
        ...prev,
        {
          id: 'asst_' + Date.now(),
          role: 'assistant',
          text: reply,
          actionExecuted: `DIALED_${primaryContact.phone}`,
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
      setTimeout(() => {
        window.location.href = `tel:${primaryContact.phone}`;
      }, 700);
      return;
    }

    // 2. Tool check: Share Location
    if (cleanCmd.includes('location') || cleanCmd.includes('jagah bhejo') || cleanCmd.includes('track me')) {
      let locText = 'Acquiring GPS fix...';
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            const reply = `Live location acquired (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}). Preparing emergency broadcast link for all contacts.`;
            speakVoiceFeedback('Location acquired. Ready to broadcast.');
            setMessages((prev) => [
              ...prev,
              {
                id: 'asst_' + Date.now(),
                role: 'assistant',
                text: `${reply}\n\n📍 Map Link: ${link}`,
                actionExecuted: 'LOCATION_BROADCAST',
                timestamp: Date.now(),
              },
            ]);
            setIsLoading(false);
          },
          () => {
            const reply = 'Location unavailable or permission required. Dialing 112 directly.';
            setMessages((prev) => [
              ...prev,
              { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
            ]);
            setIsLoading(false);
          }
        );
      }
      return;
    }

    // 3. Tool check: Flashlight / Torch
    if (cleanCmd.includes('flashlight on') || cleanCmd.includes('torch on') || cleanCmd.includes('light on') || cleanCmd.includes('batti jalao')) {
      await toggleFlashlight(true);
      setTorchActive(true);
      const reply = 'Flashlight turned ON via hands-free voice command.';
      speakVoiceFeedback('Flashlight on');
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    if (cleanCmd.includes('flashlight off') || cleanCmd.includes('torch off') || cleanCmd.includes('light off') || cleanCmd.includes('batti bujhao')) {
      await toggleFlashlight(false);
      setTorchActive(false);
      const reply = 'Flashlight turned OFF.';
      speakVoiceFeedback('Flashlight off');
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 4. Tool check: Siren
    if (cleanCmd.includes('siren on') || cleanCmd.includes('start siren') || cleanCmd.includes('alarm bajao')) {
      if (!isSirenActive) onToggleSiren();
      const reply = 'Emergency alarm siren activated at maximum volume.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    if (cleanCmd.includes('siren off') || cleanCmd.includes('stop siren') || cleanCmd.includes('alarm band')) {
      if (isSirenActive) onToggleSiren();
      const reply = 'Emergency alarm siren silenced.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 5. Tool check: Emergency SOS
    if (cleanCmd.includes('emergency') || cleanCmd.includes('bachao') || cleanCmd.includes('sos') || cleanCmd.includes('help me')) {
      const reply = 'Critical Emergency Detected! Initiating instant SOS dispatch sequence.';
      speakVoiceFeedback(reply);
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, actionExecuted: 'SOS_TRIGGERED', timestamp: Date.now() },
      ]);
      setIsLoading(false);
      onTriggerSos();
      return;
    }

    // 6. Tool check: Phone drop
    if (cleanCmd.includes('phone drop') || cleanCmd.includes('gir gaya')) {
      onTriggerPhoneDrop();
      setIsLoading(false);
      return;
    }

    // 7. Tool check: Phone Snatch / Theft Force
    if (cleanCmd.includes('snatch') || cleanCmd.includes('theft') || cleanCmd.includes('chheen') || cleanCmd.includes('stealing')) {
      if (onTriggerSnatchSos) onTriggerSnatchSos();
      setIsLoading(false);
      return;
    }

    // 8. Tool check: QR & Link Scanner
    if (cleanCmd.includes('qr') || cleanCmd.includes('scanner') || cleanCmd.includes('scan link') || cleanCmd.includes('check link')) {
      if (onOpenQrScanner) onOpenQrScanner();
      const reply = 'Opening Live Camera QR & Link Safety Scanner.';
      speakVoiceFeedback(reply);
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 9. Tool check: OTP Scam & Fraud Shield
    if (cleanCmd.includes('otp') || cleanCmd.includes('fraud') || cleanCmd.includes('scam') || cleanCmd.includes('1930')) {
      if (onOpenOtpShield) onOpenOtpShield();
      const reply = 'Opening JASHPI OTP Scam & Cyber Fraud Shield (National Helpline 1930).';
      speakVoiceFeedback(reply);
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 10. Tool check: Holiday Mode
    if (cleanCmd.includes('holiday mode') || cleanCmd.includes('chhutti') || cleanCmd.includes('wander mode')) {
      if (onOpenHolidayMode) onOpenHolidayMode();
      const reply = 'Opening Holiday & Wander Mode settings. 3-hour inactivity SOS can be paused here.';
      speakVoiceFeedback(reply);
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 11. Tool check: Theme Switch
    if (cleanCmd.includes('light theme') || cleanCmd.includes('dark theme') || cleanCmd.includes('light mode') || cleanCmd.includes('dark mode')) {
      if (onToggleTheme) onToggleTheme();
      const reply = 'Theme toggled successfully.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 12. Tool check: Install App / Android APK
    if (cleanCmd.includes('install') || cleanCmd.includes('android app') || cleanCmd.includes('apk') || cleanCmd.includes('download app') || cleanCmd.includes('app chahiye') || cleanCmd.includes('not web app')) {
      if (onOpenAndroidHub) onOpenAndroidHub();
      const reply = 'Opening JASHPI Android App & APK Center!\n\nYou have two great options:\n1. 📲 1-Tap Direct Install on Android Phone: Tap "Install JASHPI on Phone" or in Chrome tap 3 dots (⋮) > "Install app" to get a full-screen app with home screen icon.\n2. 📦 Native APK & Studio: Full Kotlin Android Studio project ready in /android to compile into an APK (.apk) via "./gradlew assembleDebug".';
      speakVoiceFeedback('Opening Android App and APK Center');
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 13. Tool check: Real Emergency Dialer / Direct Call
    if (cleanCmd.includes('emergency call') || cleanCmd.includes('dial') || cleanCmd.includes('police call') || cleanCmd.includes('phone lagao') || cleanCmd.includes('call help')) {
      if (onOpenEmergencyDialer) onOpenEmergencyDialer();
      const reply = 'Opening 1-Touch Emergency Dialer for real immediate telephone connection to 112, 108, and your family.';
      speakVoiceFeedback(reply);
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 14. General Gemini LLM Query
    try {
      const res = await askJashpiAiApi(command, language, 'JASHPI Hands-Free Assistant');
      const reply = res.reply || 'Emergency response: Call 112 or 108 immediately.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'asst_' + Date.now(),
          role: 'assistant',
          text: 'Emergency guidance: Ensure patient is breathing and conscious. Apply direct pressure to any bleeding wounds. Dial 112 or 108 immediately.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue('');
    executeAiCommand(text, true);
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* Listening Status Orb & Waveform */}
      <div className="p-3 mb-2 rounded-2xl bg-[#1A0B2E]/90 border border-[#00F3FF]/30 backdrop-blur-md flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          {/* Official JASHPI Logo */}
          <JashpiLogo size="md" customSrc={customLogoUrl || undefined} />

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm text-white">JASHPI AI Command Center</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                voiceActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {voiceActive ? 'HANDS-FREE LISTENING' : 'VOICE MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-[#00F3FF] truncate max-w-xs sm:max-w-md italic">
              {lastTranscript ? `"${lastTranscript}"` : 'Say "Hello Jashpi", "Call my contact", or "Install app"...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleVoice}
            className={`p-2 rounded-xl border cursor-pointer transition-colors ${
              voiceActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={voiceActive ? 'Mute microphone' : 'Enable hands-free listening'}
          >
            {voiceActive ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Action Suggestion Chips Bar */}
      <div className="py-1 mb-2 overflow-x-auto flex space-x-2 shrink-0 scrollbar-none text-xs">
        {onOpenAndroidHub && (
          <button
            onClick={onOpenAndroidHub}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-400/60 text-[#00F3FF] font-black flex items-center space-x-1.5 cursor-pointer transition-all shadow-md shadow-cyan-900/30"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
            <span>📲 Android App & APK</span>
          </button>
        )}

        <button
          onClick={() => executeAiCommand('Call my primary contact')}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call Primary Contact</span>
        </button>

        <button
          onClick={() => executeAiCommand('Share my live location')}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Share Live GPS</span>
        </button>

        {onOpenQrScanner && (
          <button
            onClick={onOpenQrScanner}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR / Link Safety</span>
          </button>
        )}

        {onOpenOtpShield && (
          <button
            onClick={onOpenOtpShield}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>OTP Scam Shield (1930)</span>
          </button>
        )}

        {onOpenHolidayMode && (
          <button
            onClick={onOpenHolidayMode}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm ${
              holidayModeActive
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{holidayModeActive ? '🌴 Holiday Mode: ACTIVE' : 'Holiday Mode (Pause SOS)'}</span>
          </button>
        )}

        {onTriggerSnatchSos && (
          <button
            onClick={onTriggerSnatchSos}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-rose-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Phone Snatch Sensor (5s)</span>
          </button>
        )}

        <button
          onClick={async () => {
            const next = !torchActive;
            await toggleFlashlight(next);
            setTorchActive(next);
            speakVoiceFeedback(next ? 'Flashlight on' : 'Flashlight off');
          }}
          className={`whitespace-nowrap px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm ${
            torchActive
              ? 'bg-amber-500 text-black border-amber-300'
              : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-500/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{torchActive ? 'Flashlight: ON' : 'Turn On Torch'}</span>
        </button>

        <button
          onClick={onToggleSiren}
          className={`whitespace-nowrap px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm ${
            isSirenActive
              ? 'bg-red-600 text-white border-red-300 animate-pulse'
              : 'bg-red-950/70 hover:bg-red-900/80 text-rose-300 border-red-500/40'
          }`}
        >
          {isSirenActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isSirenActive ? 'Stop Siren' : 'Alarm Siren'}</span>
        </button>

        <button
          onClick={onTriggerPhoneDrop}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Phone Drop Sensor (5s)</span>
        </button>

        <button
          onClick={onOpenStealth}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
          <span>Stealth Disguise Mode</span>
        </button>
      </div>

      {/* Interactive Chat Message Stream */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-3 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-br-none shadow-md'
                  : 'bg-[#1A0B2E]/90 border border-cyan-500/30 text-slate-100 rounded-bl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

              {m.actionExecuted && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center space-x-2 text-[10px] text-emerald-300 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ACTION EXECUTED: {m.actionExecuted}</span>
                </div>
              )}

              {m.role === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-cyan-400 font-mono text-[9px]">JASHPI AI ENGINE</span>
                  <button
                    onClick={() => speakVoiceFeedback(m.text)}
                    className="flex items-center space-x-1 text-[#00F3FF] hover:underline cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-cyan-300 italic text-xs p-2">
            <Sparkles className="w-4 h-4 animate-spin text-[#00F3FF]" />
            <span>Analyzing emergency request...</span>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="mt-2 flex items-center space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Speak hands-free or type: 'Call contact', 'Share location', 'Flashlight on'..."
          className="flex-1 bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-3 rounded-2xl bg-gradient-to-r from-[#00F3FF] to-[#0044FF] text-black font-extrabold cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
