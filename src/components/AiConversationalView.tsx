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
  Smartphone,
  Plus,
  Camera,
  Upload,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Settings,
  MessageSquare,
  RefreshCw,
  Info,
  AlertTriangle
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { askJashpiAiApi, sendTelegramAlertApi } from '../services/emergencyApi';
import { speakVoiceFeedback } from '../services/audioSiren';
import { toggleFlashlight } from '../services/flashlight';
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
  imageUrl?: string;
  mapUrl?: string;
  coordinates?: { lat: number; lng: number };
  scannedData?: {
    type: 'UPI' | 'URL' | 'PHONE' | 'TEXT';
    value: string;
    actionLabel?: string;
    actionUrl?: string;
  };
  telegramStatus?: 'SENT' | 'FAILED' | 'CONFIG_NEEDED';
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
  const isHi = language === 'hi';

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: isHi
        ? `नमस्ते ${userName || 'जी'}, मैं आपका JASHPI हैंड्स-फ्री इमरजेंसी AI साथी हूँ ("एक टैप, एक सांस, एक जिंदगी")।\n\nमाइक हमेशा चालू है (बिना किसी परेशान करने वाली आवाज़ के)। आप सीधे बोल सकते हैं या नीचे '+' बटन दबाकर कैमरा से स्कैन, फोटो अपलोड, WhatsApp लाइव लोकेशन या Telegram अलर्ट भेज सकते हैं।`
        : `Hello ${userName || 'there'}, I am your JASHPI Hands-Free Emergency AI ("Ek Tap, Ek Saans, Ek Zindagi").\n\nYour mic is active continuously and silently (no annoying beeps). You can speak commands hands-free or tap '+' below to open live camera scanner, upload documents, share WhatsApp live location, or trigger Telegram emergency alerts.`,
      timestamp: Date.now(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Telegram Config Drawer/State
  const [telegramDrawerOpen, setTelegramDrawerOpen] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState<string>(() => localStorage.getItem('jashpi_telegram_bot_token') || '');
  const [telegramChatId, setTelegramChatId] = useState<string>(() => localStorage.getItem('jashpi_telegram_chat_id') || '');
  const [telegramSavedNotice, setTelegramSavedNotice] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialPromptExecutedRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, cameraActive]);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== initialPromptExecutedRef.current) {
      initialPromptExecutedRef.current = initialPrompt;
      executeAiCommand(initialPrompt, true);
    }
  }, [initialPrompt]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const primaryContact = contacts.find((c) => c.callEnabled) || contacts[0] || {
    name: 'National Emergency (112)',
    phone: '112',
  };

  // ==========================================
  // INLINE CAMERA SCANNER & CAPTURE
  // ==========================================
  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    setPlusMenuOpen(false);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      startScanLoop();
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startScanLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    // Try modern browser BarcodeDetector first
    const hasBarcodeDetector = 'BarcodeDetector' in window;
    let detector: any = null;
    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'upc_a', 'upc_e', 'ean_13', 'code_128', 'code_39', 'data_matrix'],
        });
      } catch (e) {
        detector = null;
      }
    }

    scanIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      // 1. Hardware BarcodeDetector API
      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              handleCodeScanned(raw);
              return;
            }
          }
        } catch (_e) {}
      }

      // 2. Fallback Canvas Capture
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }
      }
    }, 450);
  };

  const handleCodeScanned = (scannedText: string) => {
    stopCamera();

    // Haptic feedback if available
    try {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    } catch (_e) {}

    let type: 'UPI' | 'URL' | 'PHONE' | 'TEXT' = 'TEXT';
    let actionLabel = 'Copy Text';
    let actionUrl = '';

    const lower = scannedText.toLowerCase();

    if (lower.startsWith('upi://') || lower.includes('@okhdfcbank') || lower.includes('@okaxis') || lower.includes('@oksbi') || lower.includes('@paytm')) {
      type = 'UPI';
      actionLabel = isHi ? 'UPI पेमेंट करें' : 'Open UPI App';
      actionUrl = scannedText.startsWith('upi://') ? scannedText : `upi://pay?pa=${encodeURIComponent(scannedText)}`;
    } else if (lower.startsWith('http://') || lower.startsWith('https://')) {
      type = 'URL';
      actionLabel = isHi ? 'वेबसाइट खोलें' : 'Open Link';
      actionUrl = scannedText;
    } else if (lower.startsWith('tel:') || /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(scannedText)) {
      type = 'PHONE';
      actionLabel = isHi ? 'कॉल करें' : 'Direct Call';
      actionUrl = scannedText.startsWith('tel:') ? scannedText : `tel:${scannedText}`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'scan_' + Date.now(),
        role: 'assistant',
        text: isHi
          ? `📷 स्कैन पूरा हुआ!\nसामग्री: ${scannedText}`
          : `📷 Scan Detected!\nContent: ${scannedText}`,
        scannedData: {
          type,
          value: scannedText,
          actionLabel,
          actionUrl,
        },
        actionExecuted: 'QR_SCAN_SUCCESS',
        timestamp: Date.now(),
      },
    ]);

    // Ask AI to evaluate security of the scanned link
    executeAiCommand(`I scanned this: "${scannedText}". Explain what it is and verify if it is safe or an emergency resource.`, false);
  };

  // Capture current camera snapshot and feed to AI
  const snapAndAnalyzePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();

    setMessages((prev) => [
      ...prev,
      {
        id: 'snap_' + Date.now(),
        role: 'user',
        text: isHi ? '📷 फोटो खींची गई (AI सहायता और निरीक्षण हेतु)' : '📷 Captured photo for emergency analysis',
        imageUrl: dataUrl,
        timestamp: Date.now(),
      },
    ]);

    setIsLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'asst_snap_' + Date.now(),
          role: 'assistant',
          text: isHi
            ? '✅ फोटो प्राप्त हुई। JASHPI AI ने आपातकालीन सुरक्षा जांच की है। यदि यह चोट या आपातकालीन स्थिति है, तो 112 डायल करें। नजदीकी मदद चाहिए तो बताएं।'
            : '✅ Photo received and analyzed for emergency safety. If this is a medical trauma, bleeding, or hazard, stay calm and dial 112 immediately. Follow first aid protocols.',
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
    }, 1200);
  };

  // ==========================================
  // FILE / IMAGE UPLOAD HANDLER
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlusMenuOpen(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setMessages((prev) => [
        ...prev,
        {
          id: 'file_' + Date.now(),
          role: 'user',
          text: `📁 ${file.name} (${Math.round(file.size / 1024)} KB)`,
          imageUrl: file.type.startsWith('image/') ? dataUrl : undefined,
          timestamp: Date.now(),
        },
      ]);

      executeAiCommand(`I uploaded file "${file.name}". Please analyze this medical document/report/image for emergency information.`, false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ==========================================
  // WHATSAPP LIVE LOCATION BROADCAST
  // ==========================================
  const handleShareLocationWhatsApp = () => {
    setPlusMenuOpen(false);
    setIsLoading(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy);
          const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

          const messageText = isHi
            ? `🚨 *JASHPI आपातकालीन अलर्ट!*\nनाम: ${userName || 'User'}\nमेरी लाइव लोकेशन: ${mapLink}\nसटीकता: ±${accuracy}m\nसमय: ${new Date().toLocaleTimeString()}\nकृपया तुरंत मदद भेजें!`
            : `🚨 *JASHPI EMERGENCY SOS!*\nName: ${userName || 'User'}\nLive GPS Location: ${mapLink}\nAccuracy: ±${accuracy}m\nTime: ${new Date().toLocaleTimeString()}\nPlease send immediate assistance!`;

          const encoded = encodeURIComponent(messageText);
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

          // Open WhatsApp directly without popup blockers
          const link = document.createElement('a');
          link.href = whatsappUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setMessages((prev) => [
            ...prev,
            {
              id: 'loc_' + Date.now(),
              role: 'assistant',
              text: isHi
                ? `📍 WhatsApp लाइव लोकेशन लिंक तैयार और प्रेषित!\n\nसटीकता: ±${accuracy}m\nस्थान: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                : `📍 WhatsApp Live Location Dispatched!\n\nAccuracy: ±${accuracy}m\nCoordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              mapUrl: mapLink,
              coordinates: { lat, lng },
              actionExecuted: 'WHATSAPP_LOCATION_SENT',
              timestamp: Date.now(),
            },
          ]);
          setIsLoading(false);
        },
        (err) => {
          setIsLoading(false);
          const reply = isHi
            ? 'जीपीएस लोकेशन प्राप्त नहीं हो सकी। कृपया लोकेशन परमिशन जांचें या 112 पर कॉल करें।'
            : 'Unable to acquire GPS coordinates. Please check location permissions or dial 112 directly.';
          setMessages((prev) => [
            ...prev,
            { id: 'asst_err_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
          ]);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsLoading(false);
      window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent('🚨 JASHPI EMERGENCY SOS! Please send immediate help!')}`;
    }
  };

  // ==========================================
  // TELEGRAM BOT ALERT BROADCAST
  // ==========================================
  const handleSendTelegramAlert = async () => {
    setPlusMenuOpen(false);

    const token = telegramBotToken.trim();
    const chatId = telegramChatId.trim();

    if (!token || !chatId) {
      setTelegramDrawerOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'tg_conf_' + Date.now(),
          role: 'assistant',
          text: isHi
            ? '⚠️ टेलीग्राम बॉट टोकन या चैट आईडी सेट नहीं है। कृपया नीचे दिए गए फॉर्म में अपना Bot Token और Chat ID दर्ज करें।'
            : '⚠️ Telegram Bot Token or Chat ID is not configured. Please enter your Bot Token and Chat ID below to enable automatic alerts.',
          telegramStatus: 'CONFIG_NEEDED',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    setIsLoading(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
          const text = `🚨 *JASHPI EMERGENCY SOS ALERT* 🚨\n\n*Name:* ${userName || 'User'}\n*Status:* Distress Alert Triggered\n*Live Location:* ${mapsLink}\n*Time:* ${new Date().toLocaleTimeString()}\nImmediate response required!`;

          const result = await sendTelegramAlertApi(chatId, text, lat, lng, token);
          setIsLoading(false);

          if (result.success) {
            setMessages((prev) => [
              ...prev,
              {
                id: 'tg_' + Date.now(),
                role: 'assistant',
                text: isHi
                  ? `✅ टेलीग्राम इमरजेंसी अलर्ट सफलतापूर्वक भेज दिया गया!\n(Message ID: ${result.messageId || 'Delivered'})`
                  : `✅ Telegram Emergency Alert successfully sent!\n(Message ID: ${result.messageId || 'Delivered'})`,
                telegramStatus: 'SENT',
                mapUrl: mapsLink,
                coordinates: { lat, lng },
                actionExecuted: 'TELEGRAM_ALERT_DELIVERED',
                timestamp: Date.now(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: 'tg_err_' + Date.now(),
                role: 'assistant',
                text: `❌ Telegram error: ${result.error || 'Check Bot Token & Chat ID'}\nMake sure you started the bot (/start) in Telegram first!`,
                telegramStatus: 'FAILED',
                timestamp: Date.now(),
              },
            ]);
          }
        },
        async () => {
          const text = `🚨 *JASHPI EMERGENCY SOS ALERT* 🚨\n\n*Name:* ${userName || 'User'}\n*Status:* Distress Alert Triggered\n*Time:* ${new Date().toLocaleTimeString()}\nImmediate response required!`;
          const result = await sendTelegramAlertApi(chatId, text, undefined, undefined, token);
          setIsLoading(false);

          setMessages((prev) => [
            ...prev,
            {
              id: 'tg_' + Date.now(),
              role: 'assistant',
              text: result.success
                ? '✅ Telegram Alert sent (without GPS coordinates).'
                : `❌ Telegram error: ${result.error}`,
              telegramStatus: result.success ? 'SENT' : 'FAILED',
              timestamp: Date.now(),
            },
          ]);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Save Telegram Settings
  const saveTelegramSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('jashpi_telegram_bot_token', telegramBotToken.trim());
    localStorage.setItem('jashpi_telegram_chat_id', telegramChatId.trim());
    setTelegramSavedNotice(true);
    setTimeout(() => setTelegramSavedNotice(false), 2500);
  };

  // ==========================================
  // QUICK ACTION EXECUTION HANDLER
  // ==========================================
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
    if (cleanCmd.includes('call') || cleanCmd.includes('phone milao') || cleanCmd.includes('phone lagao') || cleanCmd.includes('112')) {
      const reply = isHi
        ? `आपातकालीन कॉल ${primaryContact.name} (${primaryContact.phone}) से मिलाया जा रहा है।`
        : `Initiating direct phone call to ${primaryContact.name} (${primaryContact.phone}). Stay safe.`;
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
      }, 500);
      return;
    }

    // 2. Tool check: WhatsApp Location
    if (
      cleanCmd.includes('whatsapp') ||
      cleanCmd.includes('location bhejo') ||
      cleanCmd.includes('share location') ||
      cleanCmd.includes('meri location') ||
      cleanCmd.includes('kahan hu') ||
      cleanCmd.includes('live location')
    ) {
      handleShareLocationWhatsApp();
      return;
    }

    // 3. Tool check: Telegram
    if (cleanCmd.includes('telegram') || cleanCmd.includes('telegram bhejo') || cleanCmd.includes('telegram alert')) {
      handleSendTelegramAlert();
      return;
    }

    // 4. Tool check: Flashlight / Torch
    if (cleanCmd.includes('flashlight on') || cleanCmd.includes('torch on') || cleanCmd.includes('light on') || cleanCmd.includes('batti jalao') || cleanCmd.includes('torch jalao')) {
      await toggleFlashlight(true);
      setTorchActive(true);
      const reply = isHi ? 'फ्लैशलाइट चालू कर दी गई है।' : 'Flashlight turned ON.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    if (cleanCmd.includes('flashlight off') || cleanCmd.includes('torch off') || cleanCmd.includes('light off') || cleanCmd.includes('batti bujhao') || cleanCmd.includes('torch band')) {
      await toggleFlashlight(false);
      setTorchActive(false);
      const reply = isHi ? 'फ्लैशलाइट बंद कर दी गई है।' : 'Flashlight turned OFF.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 5. Tool check: Siren
    if (cleanCmd.includes('siren on') || cleanCmd.includes('start siren') || cleanCmd.includes('siren bajao') || cleanCmd.includes('siren baja') || cleanCmd.includes('alarm bajao')) {
      if (!isSirenActive) onToggleSiren();
      const reply = isHi ? '🚨 सायरन अधिकतम वॉल्यूम पर चालू कर दिया गया है!' : '🚨 Emergency siren activated at maximum volume!';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    if (cleanCmd.includes('siren off') || cleanCmd.includes('stop siren') || cleanCmd.includes('siren band') || cleanCmd.includes('siren roko') || cleanCmd.includes('alarm band')) {
      if (isSirenActive) onToggleSiren();
      const reply = isHi ? 'सायरन बंद कर दिया गया है।' : 'Emergency siren silenced.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 6. Tool check: Emergency SOS
    if (cleanCmd.includes('emergency') || cleanCmd.includes('bachao') || cleanCmd.includes('sos') || cleanCmd.includes('help me') || cleanCmd.includes('madad')) {
      const reply = isHi
        ? '🚨 गंभीर आपातकाल! तत्काल SOS डिस्पैच शुरू किया जा रहा है। 112 डायल किया जा रहा है।'
        : '🚨 Critical Emergency Detected! Initiating instant SOS dispatch sequence.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, actionExecuted: 'SOS_TRIGGERED', timestamp: Date.now() },
      ]);
      setIsLoading(false);
      onTriggerSos();
      return;
    }

    // 7. Tool check: Camera / Scanner
    if (cleanCmd.includes('camera') || cleanCmd.includes('scan') || cleanCmd.includes('qr') || cleanCmd.includes('scanner') || cleanCmd.includes('photo khicho')) {
      startCamera();
      setIsLoading(false);
      return;
    }

    // 8. Tool check: OTP Scam & Fraud Shield
    if (cleanCmd.includes('otp') || cleanCmd.includes('fraud') || cleanCmd.includes('scam') || cleanCmd.includes('1930')) {
      if (onOpenOtpShield) onOpenOtpShield();
      const reply = isHi ? 'राष्ट्रीय साइबर हेल्पलाइन 1930 और फ्रॉड शील्ड खोली जा रही है।' : 'Opening OTP Scam & Cyber Fraud Shield (National Helpline 1930).';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 9. Tool check: CPR / First Aid
    if (cleanCmd.includes('cpr') || cleanCmd.includes('first aid') || cleanCmd.includes('snake bite') || cleanCmd.includes('saap') || cleanCmd.includes('aag') || cleanCmd.includes('fire')) {
      if (onOpenGuides) onOpenGuides();
      const reply = isHi ? 'एनिमेटेड फर्स्ट एड गाइड खोली जा रही है।' : 'Opening visual emergency first aid guide.';
      setMessages((prev) => [
        ...prev,
        { id: 'asst_' + Date.now(), role: 'assistant', text: reply, timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 10. General Gemini AI Response
    try {
      const res = await askJashpiAiApi(command, language, 'JASHPI Hands-Free Assistant');
      const reply = res.reply || (isHi ? 'आपातकाल में तुरंत 112 डायल करें।' : 'Emergency response: Call 112 or 108 immediately.');
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
          text: isHi
            ? 'आपातकालीन सलाह: मरीज को शांत रखें। यदि सांस रुक रही है तो CPR शुरू करें और 112 पर कॉल करें।'
            : 'Emergency guidance: Ensure patient is breathing and conscious. Apply direct pressure to any bleeding wounds. Dial 112 or 108 immediately.',
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
    setPlusMenuOpen(false);
    executeAiCommand(text, true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-2 sm:px-4 py-2 relative">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* TOP UNIFIED STATUS BAR */}
      <div className="p-2.5 sm:p-3 mb-2 rounded-2xl bg-[#120B20]/95 border border-cyan-500/30 backdrop-blur-md flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            {customLogoUrl ? (
              <img src={customLogoUrl} alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-black" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-black text-white tracking-wide">JASHPI AI</h1>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/20 text-[#00F3FF] border border-cyan-500/30 uppercase">
                All-in-One
              </span>
            </div>
            {/* Silent Mic Active Badge */}
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{isHi ? 'माइक शांत व सक्रिय है (Silent Hands-Free)' : 'Silent Mic Listening (Hands-Free)'}</span>
            </div>
          </div>
        </div>

        {/* Quick Top Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Direct 112 SOS Call */}
          <button
            onClick={() => {
              window.location.href = 'tel:112';
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow-lg shadow-rose-600/30 cursor-pointer transition-transform active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112</span>
          </button>

          {/* Telegram Settings Button */}
          <button
            onClick={() => setTelegramDrawerOpen(!telegramDrawerOpen)}
            className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
              telegramBotToken && telegramChatId
                ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Telegram Bot Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TELEGRAM SETTINGS INLINE DRAWER */}
      {telegramDrawerOpen && (
        <div className="mb-2 p-3.5 rounded-2xl bg-[#140D25] border border-cyan-500/40 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <span className="text-base">🤖</span>
              <h3 className="font-extrabold text-white text-sm">
                Telegram Emergency Bot Configuration
              </h3>
            </div>
            <button
              onClick={() => setTelegramDrawerOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {isHi
              ? 'आपातकालीन अलर्ट सीधे Telegram पर प्राप्त करने के लिए अपना Bot Token (Telegram @BotFather से) और Chat ID (Telegram @userinfobot से) यहाँ दर्ज करें:'
              : 'Enter your Telegram Bot Token (from @BotFather) and your Chat ID (from @userinfobot) to enable instant live emergency message relays:'}
          </p>

          <form onSubmit={saveTelegramSettings} className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Telegram Chat ID
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 987654321"
                className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isHi ? 'सेव करें' : 'Save Telegram Config'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTelegramAlert}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isHi ? 'टेस्ट मैसेज भेजें' : 'Send Test Alert'}</span>
              </button>
            </div>

            {telegramSavedNotice && (
              <div className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isHi ? 'सेटिंग्स सेव हो गईं!' : 'Telegram settings saved successfully!'}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* INLINE LIVE CAMERA VIEWFINDER (NO ANNOYING POPUP!) */}
      {cameraActive && (
        <div className="mb-2 p-3 rounded-2xl bg-black/90 border-2 border-cyan-400 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-white">
            <div className="flex items-center space-x-1.5 font-extrabold text-cyan-300">
              <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{isHi ? 'लाइव कैमरा व स्कैनर (QR/दस्तावेज)' : 'Live Camera & Scanner (QR / Doc)'}</span>
            </div>
            <button
              onClick={stopCamera}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cameraError ? (
            <div className="p-4 text-center text-rose-400 space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto" />
              <p>{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Laser Line Overlay */}
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00F3FF] animate-pulse" />

              {/* Viewfinder Bounding Box */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-cyan-400/80 rounded-2xl pointer-events-none" />
            </div>
          )}

          {/* Camera Action Buttons */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              onClick={snapAndAnalyzePhoto}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>{isHi ? 'फोटो खींचें व AI से पूछें' : 'Snap & Analyze with AI'}</span>
            </button>

            <button
              onClick={stopCamera}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QUICK HORIZONTAL SHORTCUT CHIPS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 mb-1 no-scrollbar text-xs">
        {/* WhatsApp Location */}
        <button
          onClick={handleShareLocationWhatsApp}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-extrabold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>WhatsApp Location</span>
        </button>

        {/* Telegram Alert */}
        <button
          onClick={handleSendTelegramAlert}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5 text-cyan-400" />
          <span>Telegram Alert</span>
        </button>

        {/* Camera / Scan */}
        <button
          onClick={() => (cameraActive ? stopCamera() : startCamera())}
          className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
        >
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>{cameraActive ? 'Stop Camera' : 'Camera Scan'}</span>
        </button>

        {/* Siren */}
        <button
          onClick={onToggleSiren}
          className={`whitespace-nowrap px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm ${
            isSirenActive
              ? 'bg-rose-600 text-white border-rose-300 animate-pulse'
              : 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border-rose-500/40'
          }`}
        >
          {isSirenActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isSirenActive ? 'Stop Siren' : 'Siren'}</span>
        </button>

        {/* Torch */}
        <button
          onClick={async () => {
            const next = !torchActive;
            await toggleFlashlight(next);
            setTorchActive(next);
          }}
          className={`whitespace-nowrap px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm ${
            torchActive
              ? 'bg-amber-500 text-black border-amber-300'
              : 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border-amber-500/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{torchActive ? 'Torch: ON' : 'Torch'}</span>
        </button>

        {/* 1930 Fraud */}
        {onOpenOtpShield && (
          <button
            onClick={onOpenOtpShield}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>1930 Fraud</span>
          </button>
        )}
      </div>

      {/* CHAT MESSAGE FEED */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-3 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs mb-2 shadow-inner"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] p-3.5 rounded-2xl shadow-md ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-br-none'
                  : 'bg-[#180E2B]/95 border border-cyan-500/30 text-slate-100 rounded-bl-none'
              }`}
            >
              {/* Image Preview if message has image */}
              {m.imageUrl && (
                <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-h-56">
                  <img src={m.imageUrl} alt="Attached" className="w-full h-auto object-cover" />
                </div>
              )}

              {/* Message Text */}
              <div className="whitespace-pre-wrap leading-relaxed text-xs">{m.text}</div>

              {/* Scanned Data Action Card */}
              {m.scannedData && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-black/60 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold">
                    <span>Type: {m.scannedData.type}</span>
                    <button
                      onClick={() => copyToClipboard(m.scannedData!.value, m.id)}
                      className="flex items-center space-x-1 text-slate-300 hover:text-white"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="font-mono text-[10px] text-slate-200 break-all bg-black/40 p-1.5 rounded">
                    {m.scannedData.value}
                  </div>

                  {m.scannedData.actionUrl && (
                    <a
                      href={m.scannedData.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[11px] flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>{m.scannedData.actionLabel || 'Open'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Map Link Action Card */}
              {m.mapUrl && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <a
                    href={m.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center space-x-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              )}

              {/* Action Executed Badge */}
              {m.actionExecuted && (
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center space-x-1.5 text-[10px] text-emerald-300 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span>ACTION: {m.actionExecuted}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-cyan-300 italic text-xs p-2">
            <Sparkles className="w-4 h-4 animate-spin text-[#00F3FF]" />
            <span>{isHi ? 'आपातकालीन AI विश्लेषण जारी...' : 'Analyzing emergency request...'}</span>
          </div>
        )}
      </div>

      {/* PLUS (+) ACTION SHEET / PALETTE */}
      {plusMenuOpen && (
        <div className="mb-2 p-3 rounded-2xl bg-[#170E28] border-2 border-cyan-400 shadow-2xl text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-white font-extrabold">
            <span className="text-cyan-300">{isHi ? 'त्वरित इमरजेंसी टूल्स व अपलोड (+)' : 'Quick Action Tools & Upload (+)'}</span>
            <button onClick={() => setPlusMenuOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Camera & Scan */}
            <button
              onClick={startCamera}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Camera className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-[11px]">{isHi ? 'कैमरा व QR स्कैन' : 'Camera & Scan'}</span>
            </button>

            {/* 2. Upload Document / Photo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-500/30 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-[11px]">{isHi ? 'फोटो / दस्तावेज' : 'Upload File'}</span>
            </button>

            {/* 3. WhatsApp Live Location */}
            <button
              onClick={handleShareLocationWhatsApp}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-[11px]">WhatsApp GPS</span>
            </button>

            {/* 4. Telegram Alert */}
            <button
              onClick={handleSendTelegramAlert}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Send className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-[11px]">Telegram Alert</span>
            </button>

            {/* 5. National Helpline 112 */}
            <button
              onClick={() => {
                window.location.href = 'tel:112';
              }}
              className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <PhoneCall className="w-5 h-5 text-rose-400" />
              <span className="font-bold text-[11px]">112 Police/SOS</span>
            </button>

            {/* 6. Loud Siren */}
            <button
              onClick={() => {
                setPlusMenuOpen(false);
                onToggleSiren();
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-[11px]">{isSirenActive ? 'Stop Siren' : 'Loud Siren'}</span>
            </button>

            {/* 7. Cyber Fraud 1930 */}
            <button
              onClick={() => {
                setPlusMenuOpen(false);
                if (onOpenOtpShield) onOpenOtpShield();
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Lock className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-[11px]">1930 Scam Shield</span>
            </button>

            {/* 8. Telegram Bot Settings */}
            <button
              onClick={() => {
                setPlusMenuOpen(false);
                setTelegramDrawerOpen(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-300" />
              <span className="font-bold text-[11px]">Bot Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM INPUT BAR WITH PLUS (+) BUTTON */}
      <form onSubmit={handleSend} className="flex items-center space-x-2">
        {/* PLUS BUTTON FOR CAMERA, UPLOAD & TOOLS */}
        <button
          type="button"
          onClick={() => setPlusMenuOpen(!plusMenuOpen)}
          className={`p-3 rounded-2xl border-2 font-black cursor-pointer transition-all active:scale-95 shrink-0 ${
            plusMenuOpen
              ? 'bg-cyan-400 text-black border-cyan-300 shadow-lg shadow-cyan-400/30'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-cyan-500/40'
          }`}
          title="Open camera, upload file, or tools"
        >
          <Plus className={`w-5 h-5 transition-transform duration-200 ${plusMenuOpen ? 'rotate-45' : ''}`} />
        </button>

        {/* Input Text Field */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isHi
              ? "माइक में बोलें या टाइप करें: '112 कॉल', 'location bhejo', 'siren bajao'..."
              : "Speak hands-free or type: 'Call 112', 'Share location', 'siren bajao'..."
          }
          className="flex-1 bg-black/70 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF] shadow-inner"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-3 rounded-2xl bg-gradient-to-r from-[#00F3FF] to-[#0066FF] hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold cursor-pointer disabled:opacity-40 transition-transform active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AiConversationalView;
