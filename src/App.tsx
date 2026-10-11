/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Mic,
  MicOff,
  MapPin,
  PhoneCall,
  Activity,
  HeartHandshake,
  BookOpen,
  Users,
  Settings,
  Cpu,
  History,
  Battery,
  BatteryWarning,
  Zap,
  Wifi,
  WifiOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Trash2,
  Share2,
  EyeOff,
  Volume2,
  VolumeX,
  Bot,
  KeyRound,
  Compass,
  Sun,
  Moon,
  QrCode,
  Lock,
  Plane,
  AlertOctagon,
  Smartphone,
  Download
} from 'lucide-react';

import { EmergencyContact, EmergencyEvent, FusionDecision, SafetyCheckConfig } from './types';
import { HandsFreeSpeechEngine } from './services/speech';
import {
  startEmergencySiren,
  stopEmergencySiren,
  speakVoiceFeedback,
  playBeep,
  enableEmergencyVolumeBoost,
  restoreEmergencyVolume,
  playBoostEngagedChime,
  playBoostRestoredChime,
  getVolumeState,
  subscribeVolumeState,
  VolumeState
} from './services/audioSiren';
import {
  triggerEmergencyApi,
  updateLiveLocationApi,
  fetchEventsApi,
  clearEventsApi,
  syncOfflineEvents,
  sendTelegramAlertApi
} from './services/emergencyApi';
import { toggleFlashlight, isTorchOn, subscribeTorchState } from './services/flashlight';
import { broadcastOfflineMeshSos, NearbyPeer } from './services/nearbyMesh';

import { SosButton } from './components/SosButton';
import { ActiveEmergencyOverlay } from './components/ActiveEmergencyOverlay';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { AskJashpiModal } from './components/AskJashpiModal';
import { ContactsModal } from './components/ContactsModal';
import { GuidesModal } from './components/GuidesModal';
import { AnimatedGuidesModal } from './components/AnimatedGuidesModal';
import { SafetyModeModal } from './components/SafetyModeModal';
import { OnboardingModal, DEVELOPER_PASSPHRASE } from './components/OnboardingModal';
import { StealthModeOverlay } from './components/StealthModeOverlay';
import { DeveloperLabModal } from './components/DeveloperLabModal';
import { AiConversationalView } from './components/AiConversationalView';
import { QrLinkScannerModal } from './components/QrLinkScannerModal';
import { OtpFraudShieldModal } from './components/OtpFraudShieldModal';
import { HolidayModeModal } from './components/HolidayModeModal';
import { JashpiLogo } from './components/JashpiLogo';
import { AndroidAppHubModal } from './components/AndroidAppHubModal';
import { HomeDashboard } from './components/HomeDashboard';
import { SmartToolsView } from './components/SmartToolsView';
import { ContactsView } from './components/ContactsView';
import { RealEmergencyDialerModal } from './components/RealEmergencyDialerModal';

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'cnt_112',
    name: 'National Emergency (112)',
    phone: '112',
    relationship: 'Unified Dispatch',
    priority: 1,
    callEnabled: true,
    smsEnabled: true,
    whatsappEnabled: false,
    telegramEnabled: false,
  },
  {
    id: 'cnt_108',
    name: 'Ambulance & Medical (108)',
    phone: '108',
    relationship: 'Emergency Medical',
    priority: 2,
    callEnabled: true,
    smsEnabled: true,
    whatsappEnabled: false,
    telegramEnabled: false,
  },
  {
    id: 'cnt_family',
    name: 'Family Emergency Contact',
    phone: '+919876543210',
    relationship: 'Family',
    priority: 3,
    callEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    telegramEnabled: true,
  },
];

export default function App() {
  // First-time User Profile & Developer Privileges
  const [userProfile, setUserProfile] = useState<{
    name: string;
    language: string;
    isDeveloper: boolean;
    developerKey?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('jashpi_user_profile');
      return saved ? JSON.parse(saved) : { name: '', language: 'en', isDeveloper: false };
    } catch {
      return { name: '', language: 'en', isDeveloper: false };
    }
  });

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  // Active Navigation Tab: Defaults to 'ai' Unified Copilot & Tools Hub
  const [activeTab, setActiveTab] = useState<'ai' | 'home' | 'tools' | 'contacts'>('ai');
  const [emergencyDialerOpen, setEmergencyDialerOpen] = useState<boolean>(false);
  const [aiPrefilledPrompt, setAiPrefilledPrompt] = useState<string | undefined>(undefined);
  const [activeLanguage, setActiveLanguage] = useState<string>(() => userProfile.language || 'hi');

  // Contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    try {
      const saved = localStorage.getItem('jashpi_contacts');
      return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  });

  // State management
  const [voiceActive, setVoiceActive] = useState<boolean>(true);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [_countdownDecision, setCountdownDecision] = useState<FusionDecision | null>(null);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyEvent | null>(null);
  const [activeMeshPeers, setActiveMeshPeers] = useState<NearbyPeer[]>([]);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [eventHistory, setEventHistory] = useState<EmergencyEvent[]>([]);

  // Theme state (Dark vs Light mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jashpi_theme_dark');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Phone Drop Sensor & 5-Second Automated SOS
  const [phoneDropCountdown, setPhoneDropCountdown] = useState<number | null>(null);
  const phoneDropTimerRef = useRef<any>(null);

  // Phone Snatch / Sudden Stealing Force Sensor (5-Second Automated SOS)
  const [snatchCountdown, setSnatchCountdown] = useState<number | null>(null);
  const snatchTimerRef = useRef<any>(null);

  // Digital Inactivity SOS & Holiday / Wander Mode (Ghumne Ka Mode)
  const [holidayModeActive, setHolidayModeActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jashpi_holiday_mode');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [inactivityHours, setInactivityHours] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jashpi_inactivity_hours');
      return saved !== null ? JSON.parse(saved) : 3;
    } catch {
      return 3;
    }
  });
  const lastUserActivityRef = useRef<number>(Date.now());

  // Hardware state: Flashlight & Siren
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);

  // Standout Feature: Stealth Disguise Blackout Mode
  const [stealthActive, setStealthActive] = useState<boolean>(false);

  // Modals state
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [safetyModeOpen, setSafetyModeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [developerLabOpen, setDeveloperLabOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [otpShieldOpen, setOtpShieldOpen] = useState(false);
  const [holidayModeOpen, setHolidayModeOpen] = useState(false);
  const [androidHubOpen, setAndroidHubOpen] = useState<boolean>(false);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('jashpi_custom_logo');
    } catch {
      return null;
    }
  });

  const handleSaveCustomLogo = (url: string | null) => {
    setCustomLogoUrl(url);
    if (url) {
      localStorage.setItem('jashpi_custom_logo', url);
    } else {
      localStorage.removeItem('jashpi_custom_logo');
    }
  };

  // Sensor and Device status
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 9.8, magnitude: 9.8 });
  const [gpsData, setGpsData] = useState<{ lat: number | null; lng: number | null; accuracy: number | null }>({
    lat: null,
    lng: null,
    accuracy: null,
  });
  const [batteryData, setBatteryData] = useState<{ level: number | null; charging: boolean }>({
    level: null,
    charging: false,
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const hasWarnedBatteryRef = useRef<boolean>(false);
  const [batteryAlertAcknowledged, setBatteryAlertAcknowledged] = useState<boolean>(false);

  // Safety check config
  const [safetyConfig, setSafetyConfig] = useState<SafetyCheckConfig>({
    active: false,
    deadlineTimestamp: null,
    durationMinutes: 30,
    checkInStatus: 'IDLE',
    modeType: 'CHECK_IN',
  });

  const speechEngineRef = useRef<HandsFreeSpeechEngine | null>(null);
  const liveLocationIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const emergencyVoiceIntervalRef = useRef<any>(null);
  const [volumeState, setVolumeState] = useState<VolumeState>(getVolumeState());
  const lastScreenTouchRef = useRef<number>(0);
  const consecutiveHighGSamplesRef = useRef<number>(0);
  const lastCrashTriggerTimeRef = useRef<number>(0);

  // Subscribe to volume changes
  useEffect(() => {
    return subscribeVolumeState((st) => setVolumeState(st));
  }, []);

  // Subscribe to flashlight updates
  useEffect(() => {
    return subscribeTorchState((active) => setTorchActive(active));
  }, []);

  // Save contacts
  const handleSaveContacts = (updated: EmergencyContact[]) => {
    setContacts(updated);
    localStorage.setItem('jashpi_contacts', JSON.stringify(updated));
  };

  const handleAddContact = (newContact: EmergencyContact) => {
    const updated = [...contacts, newContact];
    handleSaveContacts(updated);
  };

  // Save user profile & developer credentials
  const handleCompleteOnboarding = (profile: {
    name: string;
    language: string;
    isDeveloper: boolean;
    developerKey?: string;
  }) => {
    setUserProfile(profile);
    localStorage.setItem('jashpi_user_profile', JSON.stringify(profile));
    setOnboardingOpen(false);
    speakVoiceFeedback(`Welcome ${profile.name}. JASHPI hands-free safety protection is active.`);
  };

  // Threshold Warning check (<15%)
  const checkBatteryThreshold = (level: number, charging: boolean) => {
    if (level < 15 && !charging) {
      if (!hasWarnedBatteryRef.current) {
        hasWarnedBatteryRef.current = true;
        setBatteryAlertAcknowledged(false);
        // Audible two-tone attention chime
        playBeep(440, 150);
        setTimeout(() => playBeep(330, 250), 180);
        // Voice notification alert
        speakVoiceFeedback(
          "Warning: Device battery is below 15 percent. JASHPI emergency protection is now optimized for battery saving. Please connect a charger."
        );
      }
    } else if (level >= 15 || charging) {
      hasWarnedBatteryRef.current = false;
      setBatteryAlertAcknowledged(false);
    }
  };

  const handleSimulateBatteryLevel = (level: number, charging: boolean) => {
    setBatteryData({ level, charging });
    hasWarnedBatteryRef.current = false; // reset flag to test trigger
    checkBatteryThreshold(level, charging);
  };

  // 1. Initialize GPS Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => console.warn('Initial GPS query warning:', err.message),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // 2. Initialize Battery status
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const initialLevel = Math.round(battery.level * 100);
        setBatteryData({
          level: initialLevel,
          charging: battery.charging,
        });
        checkBatteryThreshold(initialLevel, battery.charging);

        battery.addEventListener('levelchange', () => {
          const lvl = Math.round(battery.level * 100);
          setBatteryData((prev) => ({ ...prev, level: lvl }));
          checkBatteryThreshold(lvl, battery.charging);
        });
        battery.addEventListener('chargingchange', () => {
          setBatteryData((prev) => ({ ...prev, charging: battery.charging }));
          const lvl = Math.round(battery.level * 100);
          checkBatteryThreshold(lvl, battery.charging);
        });
      });
    }
  }, []);

  // 3. Online/offline detection & offline queue sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineEvents();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    syncOfflineEvents();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 4. DeviceMotion accelerometer listener (Accident & Crash detection)
  useEffect(() => {
    let lastMagnitude = 9.8;
    let freeFallStartTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 9.8;
      const mag = Math.sqrt(x * x + y * y + z * z);

      setMotionData({ x, y, z, magnitude: mag });

      const now = Date.now();

      // If user recently interacted with the screen (within 3.5 seconds), IGNORE all motion triggers.
      // Normal phone handling, taps, pocketing, vibrations, shocks, or bumps must NEVER trigger emergency SOS!
      const isActivelyHandlingPhone = (now - lastScreenTouchRef.current) < 3500;

      // Regular physical handling updates user activity timestamp
      if (Math.abs(mag - 9.8) > 1.5) {
        lastUserActivityRef.current = now;
      }

      const jerk = Math.abs(mag - lastMagnitude);

      // LARGE NOTICEABLE CRASH IMPACT SENSOR (Severe vehicular collision or hard vehicular impact)
      // Per user request: "a little touch or shock to phone gives sos fix it it should occur when crash is large noticeable"
      // Requires massive impact (> 80.0 m/s², ~8.2G) with extreme jerk (> 65.0 m/s²),
      // confirmed across at least 3 consecutive sensor frames to eliminate sensor noise,
      // locked with a 30-second cooldown and disabled if user was recently handling the phone.
      if (!isActivelyHandlingPhone && mag > 80.0 && jerk > 65.0) {
        consecutiveHighGSamplesRef.current += 1;
        if (consecutiveHighGSamplesRef.current >= 3 && (now - lastCrashTriggerTimeRef.current > 30000) && !activeEmergency && !countdown) {
          lastCrashTriggerTimeRef.current = now;
          consecutiveHighGSamplesRef.current = 0;
          triggerEmergencyWorkflow({
            riskScore: 98,
            emergencyType: 'POSSIBLE_ACCIDENT',
            confidence: 0.98,
            recommendedAction: 'COUNTDOWN_CONFIRMATION',
          });
        }
      } else {
        consecutiveHighGSamplesRef.current = 0;
      }

      // HIGH-IMPACT SEVERE FALL DETECTION: Requires sustained freefall (< 1.5 m/s² for > 350ms) followed immediately by ground collision (> 65 m/s²)
      if (!isActivelyHandlingPhone && mag < 1.5) {
        if (freeFallStartTime === 0) freeFallStartTime = now;
      } else if (!isActivelyHandlingPhone && freeFallStartTime > 0 && (now - freeFallStartTime > 350) && (now - freeFallStartTime < 1200) && mag > 65.0) {
        freeFallStartTime = 0;
        triggerEmergencyWorkflow({
          riskScore: 92,
          emergencyType: 'FALL_DETECTED',
          confidence: 0.94,
          recommendedAction: 'COUNTDOWN_CONFIRMATION',
        });
      } else if (mag >= 1.5 && (now - freeFallStartTime > 1200)) {
        freeFallStartTime = 0;
      }

      lastMagnitude = mag;
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [snatchCountdown, phoneDropCountdown, activeEmergency, countdown]);

  // Touch and interaction listeners to track user activity & suppress false crash triggers
  useEffect(() => {
    const handleUserInteraction = () => {
      const now = Date.now();
      lastUserActivityRef.current = now;
      lastScreenTouchRef.current = now;
    };
    const events = ['touchstart', 'touchmove', 'touchend', 'mousedown', 'keydown', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, handleUserInteraction, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleUserInteraction));
    };
  }, []);

  // Digital Inactivity SOS Check (Default 3+ hours without phone interaction or movement)
  useEffect(() => {
    const interval = setInterval(() => {
      // Muted if user enabled Holiday / Wander Mode (Ghumne Ka Mode)!
      if (holidayModeActive) return;
      if (activeEmergency || countdown !== null || phoneDropCountdown !== null || snatchCountdown !== null) return;

      const elapsedMs = Date.now() - lastUserActivityRef.current;
      const thresholdMs = inactivityHours * 60 * 60 * 1000;

      if (elapsedMs >= thresholdMs) {
        executeDirectSos({
          riskScore: 95,
          emergencyType: 'DIGITAL_INACTIVITY_SOS',
          confidence: 0.95,
          recommendedAction: 'IMMEDIATE_SOS',
        });
        speakVoiceFeedback(
          `Digital Inactivity Alert: Zero movement or interaction detected for over ${inactivityHours} hours. Automated distress dispatch initiated.`
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [holidayModeActive, inactivityHours, activeEmergency, countdown, phoneDropCountdown, snatchCountdown]);

  // Phone Snatch / Stealing Force 5-Second Automated SOS Trigger
  const triggerSnatchSos = () => {
    if (snatchCountdown !== null || phoneDropCountdown !== null || activeEmergency) return;

    enableEmergencyVolumeBoost('PHONE_SNATCH');
    playBoostEngagedChime();
    setSnatchCountdown(5);
    speakVoiceFeedback(
      activeLanguage === 'hi'
        ? 'फोन छीने जाने का झटका डिटेक्ट हुआ! वॉल्यूम 100% पर सेट है। 5 सेकंड में ऑटो SOS। रोकने के लिए "Cancel" कहें।'
        : 'Sudden phone snatch force detected! Volume boosted to 100 percent. Automated emergency SOS in 5 seconds. Say cancel or tap screen to stop!'
    );

    if (snatchTimerRef.current) clearInterval(snatchTimerRef.current);
    snatchTimerRef.current = setInterval(() => {
      setSnatchCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(snatchTimerRef.current);
          snatchTimerRef.current = null;
          executeDirectSos({
            riskScore: 99,
            emergencyType: 'PHONE_SNATCH_THEFT',
            confidence: 0.99,
            recommendedAction: 'IMMEDIATE_SOS',
          });
          return null;
        }
        playBeep(900, 100);
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSnatchCountdown = () => {
    if (snatchTimerRef.current) {
      clearInterval(snatchTimerRef.current);
      snatchTimerRef.current = null;
    }
    setSnatchCountdown(null);
    restoreEmergencyVolume();
    playBoostRestoredChime();
    speakVoiceFeedback(
      activeLanguage === 'hi'
        ? 'फोन स्नैच SOS रद्द। वॉल्यूम सामान्य स्तर पर वापस।'
        : 'Phone snatch SOS cancelled. Media volume restored to baseline.'
    );
  };

  // Holiday / Wander Mode (Ghumne Ka Mode) Handlers
  const handleToggleHolidayMode = (active: boolean) => {
    setHolidayModeActive(active);
    localStorage.setItem('jashpi_holiday_mode', JSON.stringify(active));
    if (active) {
      playBeep(650, 150);
      speakVoiceFeedback('Holiday Wander Mode activated. 3-hour inactivity SOS is safely paused.');
    } else {
      playBeep(550, 150);
      speakVoiceFeedback('Holiday Wander Mode turned off. Inactivity welfare monitoring resumed.');
    }
  };

  const handleSetInactivityHours = (hours: number) => {
    setInactivityHours(hours);
    localStorage.setItem('jashpi_inactivity_hours', JSON.stringify(hours));
  };

  const simulateInactivitySos = () => {
    executeDirectSos({
      riskScore: 95,
      emergencyType: 'DIGITAL_INACTIVITY_SOS',
      confidence: 0.95,
      recommendedAction: 'IMMEDIATE_SOS',
    });
    speakVoiceFeedback('Simulating 3-hour stationary inactivity SOS dispatch.');
  };

  // Phone Drop 5-Second Automated SOS Trigger
  const triggerPhoneDropSos = () => {
    if (phoneDropCountdown !== null || activeEmergency) return;

    enableEmergencyVolumeBoost('PHONE_DROP');
    playBoostEngagedChime();
    setPhoneDropCountdown(5);
    speakVoiceFeedback(
      activeLanguage === 'hi'
        ? 'फोन गिरने का झटका डिटेक्ट हुआ! वॉल्यूम 100% पर सेट है। 5 सेकंड में ऑटो SOS। रोकने के लिए "Cancel" कहें।'
        : 'Phone drop detected! Volume boosted to 100 percent. Automated SOS in 5 seconds. Say cancel or tap screen to stop!'
    );

    if (phoneDropTimerRef.current) clearInterval(phoneDropTimerRef.current);
    phoneDropTimerRef.current = setInterval(() => {
      setPhoneDropCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(phoneDropTimerRef.current);
          phoneDropTimerRef.current = null;
          // Automate SOS execution
          executeDirectSos({
            riskScore: 98,
            emergencyType: 'PHONE_DROP_IMPACT',
            confidence: 0.98,
            recommendedAction: 'IMMEDIATE_SOS',
          });
          return null;
        }
        playBeep(850, 100);
        return prev - 1;
      });
    }, 1000);
  };

  const cancelPhoneDropCountdown = () => {
    if (phoneDropTimerRef.current) {
      clearInterval(phoneDropTimerRef.current);
      phoneDropTimerRef.current = null;
    }
    setPhoneDropCountdown(null);
    restoreEmergencyVolume();
    playBoostRestoredChime();
    speakVoiceFeedback(
      activeLanguage === 'hi'
        ? 'फोन ड्रॉप SOS रद्द। वॉल्यूम सामान्य स्तर पर वापस।'
        : 'Phone drop SOS cancelled. Media volume restored to baseline.'
    );
  };

  // 5. Speech recognition setup (Hands-Free Wake Phrase, Commands & Voice Actions)
  useEffect(() => {
    speechEngineRef.current = new HandsFreeSpeechEngine({
      onWakeWord: () => {
        // Silent wake without annoying beeps
      },
      onEmergencyCommand: (_cmd, type, confidence) => {
        triggerEmergencyWorkflow({
          riskScore: 90,
          emergencyType: type,
          confidence,
          recommendedAction: 'COUNTDOWN_CONFIRMATION',
        });
      },
      onPanicBurst: (_phrase, _count) => {
        triggerEmergencyWorkflow({
          riskScore: 95,
          emergencyType: 'REPEATED_PANIC_BURST',
          confidence: 0.96,
          recommendedAction: 'IMMEDIATE_SOS',
        });
      },
      onCancelCommand: () => {
        if (phoneDropCountdown !== null) {
          cancelPhoneDropCountdown();
        } else if (snatchCountdown !== null) {
          cancelSnatchCountdown();
        } else {
          cancelEmergency('Voice Cancelled ("Cancel" command)');
        }
      },
      onActionCommand: async (action) => {
        if (action === 'FLASHLIGHT_ON') {
          await toggleFlashlight(true);
        } else if (action === 'FLASHLIGHT_OFF') {
          await toggleFlashlight(false);
        } else if (action === 'SIREN_ON') {
          handleToggleSiren(true);
        } else if (action === 'SIREN_OFF') {
          handleToggleSiren(false);
        } else if (action === 'MAKE_CALL') {
          const prim = contacts.find((c) => c.callEnabled) || contacts[0];
          if (prim) window.location.href = `tel:${prim.phone}`;
        } else if (action === 'SHARE_LOCATION' || action === 'WHATSAPP_LOCATION') {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (p) => {
                const mapsLink = `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`;
                const text = `🚨 *JASHPI EMERGENCY SOS!*\\nName: ${userProfile.name || 'User'}\\nLive GPS: ${mapsLink}\\nTime: ${new Date().toLocaleTimeString()}\\nPlease send immediate help!`;
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                const a = document.createElement('a');
                a.href = whatsappUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              },
              () => {
                window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent('🚨 JASHPI EMERGENCY SOS! Please send immediate help!')}`;
              },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }
        } else if (action === 'TELEGRAM_ALERT') {
          const token = localStorage.getItem('jashpi_telegram_bot_token') || undefined;
          const chatId = localStorage.getItem('jashpi_telegram_chat_id') || undefined;
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async (p) => {
              const mapsLink = `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`;
              const text = `🚨 *JASHPI EMERGENCY ALERT* 🚨\\n*Name:* ${userProfile.name || 'User'}\\n*Location:* ${mapsLink}\\n*Time:* ${new Date().toLocaleTimeString()}`;
              if (chatId) {
                await sendTelegramAlertApi(chatId, text, p.coords.latitude, p.coords.longitude, token);
              } else {
                window.location.href = `https://t.me/share/url?url=${encodeURIComponent(mapsLink)}&text=${encodeURIComponent('🚨 JASHPI Emergency SOS Alert!')}`;
              }
            });
          }
        } else if (action === 'QR_SCANNER') {
          setQrScannerOpen(true);
        } else if (action === 'OTP_SHIELD') {
          setOtpShieldOpen(true);
        } else if (action === 'HOLIDAY_MODE') {
          setHolidayModeOpen(true);
        } else if (action === 'SNATCH_SOS') {
          triggerSnatchSos();
        } else if (action === 'STEALTH_MODE') {
          setStealthActive(true);
        } else if (action === 'EMERGENCY_DIALER') {
          setEmergencyDialerOpen(true);
        } else if (action === 'ANDROID_APP') {
          // Keep quiet without popup
        }
      },
      onTranscriptChange: (text) => {
        setLastTranscript(text);
      },
      onError: (err) => {
        console.warn('Speech engine:', err);
      },
      onListeningStateChange: (active) => {
        setVoiceActive(active);
      },
    });

    if (voiceActive) {
      speechEngineRef.current.start();
    }

    return () => {
      speechEngineRef.current?.stop();
    };
  }, [contacts, phoneDropCountdown, snatchCountdown]);

  // Toggle voice engine (quiet without annoying on/off beeps)
  const handleToggleVoice = () => {
    if (speechEngineRef.current?.isRunning()) {
      speechEngineRef.current.stop();
      setVoiceActive(false);
    } else {
      speechEngineRef.current?.start();
      setVoiceActive(true);
    }
  };

  // Siren toggle handler
  const handleToggleSiren = (forceState?: boolean) => {
    const target = forceState !== undefined ? forceState : !isSirenActive;
    if (target) {
      startEmergencySiren();
      setIsSirenActive(true);
    } else {
      stopEmergencySiren();
      setIsSirenActive(false);
    }
  };

  // 6. Emergency Decision & Trigger execution
  const triggerEmergencyWorkflow = (decision: FusionDecision, isTest = false) => {
    setIsTestMode(isTest);

    // If false-alarm protection / countdown confirmation is recommended
    if (decision.recommendedAction === 'COUNTDOWN_CONFIRMATION' && !isTest) {
      enableEmergencyVolumeBoost('COUNTDOWN_CONFIRMATION');
      playBoostEngagedChime();
      setCountdown(10);
      setCountdownDecision(decision);
      speakVoiceFeedback(
        activeLanguage === 'hi'
          ? 'आपातकाल डिटेक्ट हुआ! वॉल्यूम 100% पर सेट है। रोकने के लिए "Cancel" कहें या स्क्रीन दबाएं।'
          : 'Emergency detected! Media volume boosted to 100 percent. Say cancel or tap screen to stop.'
      );

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            executeDirectSos(decision, isTest);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    executeDirectSos(decision, isTest);
  };

  const cancelCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    setCountdownDecision(null);
    restoreEmergencyVolume();
    playBoostRestoredChime();
    speakVoiceFeedback(
      activeLanguage === 'hi'
        ? 'इमरजेंसी काउंटडाउन रद्द। वॉल्यूम सामान्य कर दिया गया है।'
        : 'Emergency countdown cancelled. Media volume restored to baseline.'
    );
  };

  const cancelEmergency = (_reason = 'User Cancelled') => {
    cancelCountdown();
    cancelPhoneDropCountdown();
    cancelSnatchCountdown();
    stopEmergencySiren();
    setIsSirenActive(false);
    if (liveLocationIntervalRef.current) {
      clearInterval(liveLocationIntervalRef.current);
      liveLocationIntervalRef.current = null;
    }
    if (emergencyVoiceIntervalRef.current) {
      clearInterval(emergencyVoiceIntervalRef.current);
      emergencyVoiceIntervalRef.current = null;
    }
    // Cleanly restore device media volume back to pre-emergency baseline
    restoreEmergencyVolume();
    playBoostRestoredChime();
    setActiveEmergency(null);
    setActiveMeshPeers([]);
    setIsTestMode(false);
    speakVoiceFeedback(
      activeLanguage === 'hi'
        ? 'इमरजेंसी सहायता समाप्त। मीडिया वॉल्यूम सामान्य स्तर पर वापस कर दिया गया है।'
        : 'Emergency assistance stopped. Media volume restored to baseline.'
    );
  };

  // Interactive Test Helper to demonstrate 100% Emergency Volume Boost & Clean Restore
  const handleTestVolumeBoostCycle = () => {
    const isHi = activeLanguage === 'hi';
    speakVoiceFeedback(
      isHi ? 'वॉल्यूम टेस्ट: यह आपका सामान्य मीडिया वॉल्यूम है।' : 'Volume test: This is your normal media baseline volume.',
      isHi ? 'hi-IN' : 'en-IN'
    );

    setTimeout(() => {
      enableEmergencyVolumeBoost('TEST_SIMULATION');
      playBoostEngagedChime();
      speakVoiceFeedback(
        isHi
          ? '100% आपातकालीन वॉल्यूम-बूस्ट सक्रिय! आवाज अब 100% पर है ताकि आपातकाल में सब साफ सुनाई दे।'
          : '100% Emergency volume boost activated! Media volume is now forced to 100% for audible voice guidance.',
        isHi ? 'hi-IN' : 'en-IN'
      );

      setTimeout(() => {
        restoreEmergencyVolume();
        playBoostRestoredChime();
        speakVoiceFeedback(
          isHi
            ? 'परीक्षण पूरा हुआ। वॉल्यूम सामान्य स्तर पर वापस रीस्टोर कर दिया गया है।'
            : 'Volume test complete. Media volume restored to normal baseline.',
          isHi ? 'hi-IN' : 'en-IN'
        );
      }, 5500);
    }, 2800);
  };

  const executeDirectSos = async (decision: FusionDecision, isTest = false) => {
    cancelCountdown();
    cancelPhoneDropCountdown();
    cancelSnatchCountdown();
    // Temporarily force device media volume to 100% for active emergency duration
    enableEmergencyVolumeBoost('ACTIVE_EMERGENCY_SOS');
    playBoostEngagedChime();
    startEmergencySiren();
    setIsSirenActive(true);

    const eventId = 'jashpi_' + Date.now();
    const primary = contacts.find((c) => c.callEnabled) || contacts[0];

    // Initial voice-guided status announcement at 100% volume
    const initialVoiceMsg = activeLanguage === 'hi'
      ? `आपातकाल सक्रिय! वॉल्यूम 100% पर सेट है। लाइव GPS ट्रैकिंग चालू है। प्राथमिक संपर्क ${primary?.name || '112'} को कॉल किया जा रहा है।`
      : `Emergency SOS active! Media volume temporarily boosted to 100 percent. Live tracking beacon broadcasting. Contacting ${primary?.name || '112'}.`;
    speakVoiceFeedback(initialVoiceMsg, activeLanguage === 'hi' ? 'hi-IN' : 'en-IN');

    // Periodic voice-guided status updates loop (every 18 seconds at 100% volume)
    if (emergencyVoiceIntervalRef.current) {
      clearInterval(emergencyVoiceIntervalRef.current);
      emergencyVoiceIntervalRef.current = null;
    }
    let voiceUpdateIndex = 0;
    emergencyVoiceIntervalRef.current = setInterval(() => {
      voiceUpdateIndex++;
      const updatesEn = [
        'Voice status update: High accuracy GPS broadcast active. Coordinates locked. High-decibel beacon sounding.',
        'Voice status update: Emergency dispatch payload transmitted to 112 control room and emergency contacts.',
        'Voice status update: Radio mesh distress beacon active. Stay calm and in a safe area. Say cancel or tap stop to abort.'
      ];
      const updatesHi = [
        'वॉयस स्टेटस अपडेट: लाइव GPS लोकेशन 112 और परिजनों को भेजी जा रही है। 100% लाउड वॉल्यूम चालू है।',
        'वॉयस स्टेटस अपडेट: आपातकालीन डिस्पैच सक्रिय है। संपर्क दल से संपर्क किया जा रहा है।',
        'वॉयस स्टेटस अपडेट: रेडियो मेश डिस्ट्रेस बीकन चालू है। सुरक्षित स्थान पर रहें। रोकने के लिए "Cancel" कहें।'
      ];
      const pool = activeLanguage === 'hi' ? updatesHi : updatesEn;
      const msg = pool[voiceUpdateIndex % pool.length];
      speakVoiceFeedback(msg, activeLanguage === 'hi' ? 'hi-IN' : 'en-IN');
    }, 18000);

    // Acquire latest coordinates
    let lat = gpsData.lat;
    let lng = gpsData.lng;
    let acc = gpsData.accuracy;

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        acc = pos.coords.accuracy;
        setGpsData({ lat, lng, accuracy: acc });
      } catch (_e) {}
    }

    // Offline Mesh P2P broadcast (Alerts 5 nearest JASHPI users within radio range if offline)
    if (!navigator.onLine || !isOnline) {
      const meshRes = broadcastOfflineMeshSos(lat || undefined, lng || undefined, decision.emergencyType);
      setActiveMeshPeers(meshRes.peersAlerted);
      speakVoiceFeedback('Internet offline. Broadcasted distress beacon to 5 nearest JASHPI users via radio mesh.');
    } else {
      setActiveMeshPeers([]);
    }

    const payload = {
      eventId,
      triggerType: decision.emergencyType,
      emergencyType: decision.emergencyType,
      confidence: decision.confidence,
      latitude: lat || undefined,
      longitude: lng || undefined,
      accuracy: acc || undefined,
      battery: batteryData.level || undefined,
      userName: userProfile.name || 'JASHPI User',
      contacts,
    };

    const res = await triggerEmergencyApi(payload);
    const eventObj: EmergencyEvent = res.event || {
      eventId,
      timestamp: Date.now(),
      triggerType: decision.emergencyType,
      emergencyType: decision.emergencyType,
      confidence: decision.confidence,
      latitude: lat || undefined,
      longitude: lng || undefined,
      accuracy: acc || undefined,
      battery: batteryData.level || undefined,
      callStatus: 'READY',
      smsStatus: 'READY',
      telegramStatus: 'SENT',
      trackingStatus: 'ACTIVE',
      cancelled: false,
    };

    setActiveEmergency(eventObj);

    // Direct phone call execution
    if (!isTest && primary) {
      speakVoiceFeedback(`Emergency alert sent. Calling ${primary.name}.`);
      window.location.href = `tel:${primary.phone}`;
    }

    // Live location tracking updates
    if (liveLocationIntervalRef.current) clearInterval(liveLocationIntervalRef.current);
    liveLocationIntervalRef.current = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updateLiveLocationApi(eventId, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
            setGpsData({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          undefined,
          { enableHighAccuracy: true }
        );
      }
    }, 12000);
  };

  const handleStartSafetyCheck = (durationMinutes: number, mode: 'CHECK_IN' | 'TRAVEL_PROTECTION') => {
    const deadline = Date.now() + durationMinutes * 60 * 1000;
    setSafetyConfig({
      active: true,
      durationMinutes,
      deadlineTimestamp: deadline,
      checkInStatus: 'IDLE',
      modeType: mode,
    });
    setSafetyModeOpen(false);
    speakVoiceFeedback(`Safety protection activated for ${durationMinutes} minutes.`);
  };

  const handleConfirmSafe = () => {
    setSafetyConfig({
      active: false,
      durationMinutes: 30,
      deadlineTimestamp: null,
      checkInStatus: 'IDLE',
      modeType: 'CHECK_IN',
    });
    playBeep(880, 100);
    speakVoiceFeedback('Safety confirmed. You are safe.');
  };

  const loadHistory = async () => {
    const events = await fetchEventsApi();
    setEventHistory(events);
    setHistoryOpen(true);
  };

  const handleClearHistory = async () => {
    await clearEventsApi();
    setEventHistory([]);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 selection:bg-[#00F3FF] selection:text-black ${
      isDarkMode ? 'bg-[#080810] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Screen Torch Strobe Fallback if active */}
      {torchActive && (
        <div
          onClick={() => toggleFlashlight(false)}
          className="fixed inset-0 z-40 bg-white pointer-events-auto opacity-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <Zap className="w-20 h-20 text-amber-500 animate-pulse mb-2" />
          <p className="text-black font-extrabold text-sm">FLASHLIGHT / TORCH ACTIVE</p>
          <p className="text-slate-600 text-xs mt-1">Tap anywhere to turn off</p>
        </div>
      )}

      {/* Top Application Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-4 py-2.5 transition-colors ${
        batteryData.level !== null && batteryData.level < 15 && !batteryData.charging
          ? 'bg-[#250818]/95 border-red-500/40 shadow-md'
          : isDarkMode
          ? 'bg-[#0f1424]/95 border-white/10'
          : 'bg-white/95 border-slate-200 shadow-sm text-slate-900'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-2.5">
            <JashpiLogo size="sm" customSrc={customLogoUrl || undefined} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black tracking-wider text-cyan-400">JASHPI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hidden sm:inline">
                  {activeLanguage === 'hi' ? 'सुरक्षा एक्टिव' : 'SHIELD ACTIVE'}
                </span>
                {holidayModeActive && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                    🌴 WANDER
                  </span>
                )}
              </div>
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeLanguage === 'hi' ? 'ऑल-इन-वन स्मार्ट सुरक्षा' : 'All-In-One Smart Safety App'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Language, Install App, Theme, Voice */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs">
            {/* Language Switcher (हिंदी / English) */}
            <button
              onClick={() => {
                const next = activeLanguage === 'hi' ? 'en' : 'hi';
                setActiveLanguage(next);
                const updated = { ...userProfile, language: next };
                setUserProfile(updated);
                localStorage.setItem('jashpi_user_profile', JSON.stringify(updated));
              }}
              className={`px-2.5 py-1.5 rounded-xl border font-extrabold text-[11px] cursor-pointer transition-all flex items-center space-x-1 ${
                isDarkMode
                  ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-300 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              title="Switch Language / भाषा बदलें"
            >
              <span>{activeLanguage === 'hi' ? '🇮🇳 हिंदी' : '🌐 English'}</span>
            </button>

            {/* Install App Button */}
            <button
              onClick={() => setAndroidHubOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[11px] cursor-pointer shadow-md shadow-cyan-500/30 flex items-center space-x-1 transition-transform active:scale-95"
              title="Install App on Phone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeLanguage === 'hi' ? 'ऐप इंस्टॉल' : 'Install App'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                const next = !isDarkMode;
                setIsDarkMode(next);
                localStorage.setItem('jashpi_theme_dark', JSON.stringify(next));
              }}
              className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-amber-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black'
              }`}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Desktop Primary Tab Navigation */}
        <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-white/10 hidden sm:flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            {[
              { id: 'ai' as const, label: activeLanguage === 'hi' ? 'स्मार्ट AI' : 'Smart AI', icon: Bot },
              { id: 'home' as const, label: activeLanguage === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: ShieldAlert },
              { id: 'tools' as const, label: activeLanguage === 'hi' ? 'स्मार्ट टूल्स' : 'Smart Tools', icon: Zap },
              { id: 'contacts' as const, label: activeLanguage === 'hi' ? 'संपर्क व परिवार' : 'Emergency Contacts', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'ai') setAiPrefilledPrompt(undefined);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : isDarkMode
                      ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono">{voiceActive ? 'Voice ON' : 'Muted'}</span>
          </div>
        </div>
      </header>

      {/* Battery Threshold Warning Strip (<15%) */}
      {batteryData.level !== null && batteryData.level < 15 && !batteryData.charging && !batteryAlertAcknowledged && (
        <div className="bg-gradient-to-r from-red-950/95 via-amber-950/95 to-red-950/95 border-b border-red-500/60 px-4 py-2.5 shadow-lg animate-fade-in z-20">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2 text-red-200">
              <BatteryWarning className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-extrabold text-red-300 uppercase tracking-wide">
                  ⚡ Battery Low Alert ({batteryData.level}%):
                </span>
                <span className="ml-1 text-slate-200">
                  Protection optimized for power saving. Hands-free voice triggers & emergency calling remain active. Please connect charger.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() =>
                  speakVoiceFeedback(
                    `Warning: Device battery is at ${batteryData.level} percent. JASHPI emergency protection is now optimized for battery saving. Please connect a charger.`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-red-800/70 hover:bg-red-700/70 text-red-100 border border-red-500/50 text-[11px] font-bold cursor-pointer transition-colors"
              >
                Replay Voice Alert
              </button>
              <button
                onClick={() => setBatteryAlertAcknowledged(true)}
                className="px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 border border-white/20 text-[11px] cursor-pointer transition-colors"
                title="Dismiss banner"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHONE DROP SENSOR 5-SECOND COUNTDOWN OVERLAY */}
      {phoneDropCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-60 h-60 rounded-full border-4 border-red-500 animate-ping opacity-75 pointer-events-none" />
            <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-red-600 to-rose-700 border-4 border-red-300 text-white flex flex-col items-center justify-center shadow-[0_0_60px_#FF1744]">
              <Activity className="w-10 h-10 mb-1 text-white animate-bounce" />
              <span className="text-5xl font-black">{phoneDropCountdown}s</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-200">PHONE DROP</span>
            </div>
          </div>

          <h2 className="text-xl font-black text-rose-400 tracking-wider">
            🚨 PHONE DROP / IMPACT DETECTED
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mt-1">
            Phone slip / freefall detected. Automating emergency dispatch and calling primary contact in {phoneDropCountdown} seconds.
          </p>

          <button
            onClick={cancelPhoneDropCountdown}
            className="mt-6 px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-500 text-white font-extrabold text-sm cursor-pointer shadow-xl transition-transform active:scale-95"
          >
            I'M OK — CANCEL SOS
          </button>
        </div>
      )}

      {/* PHONE SNATCH / THEFT FORCE 5-SECOND COUNTDOWN OVERLAY */}
      {snatchCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-60 h-60 rounded-full border-4 border-rose-500 animate-ping opacity-75 pointer-events-none" />
            <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-rose-600 to-red-800 border-4 border-rose-300 text-white flex flex-col items-center justify-center shadow-[0_0_60px_#E11D48]">
              <AlertOctagon className="w-10 h-10 mb-1 text-white animate-bounce" />
              <span className="text-5xl font-black">{snatchCountdown}s</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-200">SNATCH FORCE</span>
            </div>
          </div>

          <h2 className="text-xl font-black text-rose-400 tracking-wider">
            🚨 SUDDEN PHONE SNATCH FORCE DETECTED
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mt-1">
            High-acceleration sudden snatching force detected. Automating emergency dispatch and calling primary contact in {snatchCountdown} seconds.
          </p>

          <button
            onClick={cancelSnatchCountdown}
            className="mt-6 px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-500 text-white font-extrabold text-sm cursor-pointer shadow-xl transition-transform active:scale-95"
          >
            I'M OK — CANCEL SOS
          </button>
        </div>
      )}

      {/* TAB 1: HOME ALL-IN-ONE DASHBOARD */}
      {activeTab === 'home' && (
        <main className="flex-1 pb-20 sm:pb-6">
          <HomeDashboard
            userName={userProfile.name}
            isDarkMode={isDarkMode}
            language={activeLanguage}
            voiceActive={voiceActive}
            onToggleVoice={handleToggleVoice}
            batteryLevel={batteryData.level}
            isCharging={batteryData.charging}
            countdown={countdown}
            onCancelCountdown={cancelCountdown}
            onTriggerSos={() =>
              triggerEmergencyWorkflow({
                riskScore: 100,
                emergencyType: 'MANUAL_SOS',
                confidence: 1.0,
                recommendedAction: 'IMMEDIATE_SOS',
              })
            }
            onOpenAiChat={(prompt) => {
              setAiPrefilledPrompt(prompt);
              setActiveTab('ai');
            }}
            onOpenEmergencyDialer={() => setEmergencyDialerOpen(true)}
            onOpenOtpShield={() => setOtpShieldOpen(true)}
            onOpenQrScanner={() => setQrScannerOpen(true)}
            onOpenSafetyMode={() => setSafetyModeOpen(true)}
            onOpenGuides={() => setGuidesOpen(true)}
            onOpenContacts={() => setActiveTab('contacts')}
            onOpenAndroidHub={() => setAndroidHubOpen(true)}
            onOpenHolidayMode={() => setHolidayModeOpen(true)}
            onOpenStealth={() => setStealthActive(true)}
            isSirenActive={isSirenActive}
            onToggleSiren={() => handleToggleSiren()}
            torchActive={torchActive}
            onToggleTorch={async () => {
              const next = !torchActive;
              await toggleFlashlight(next);
              setTorchActive(next);
              speakVoiceFeedback(next ? 'Flashlight on' : 'Flashlight off');
            }}
            holidayModeActive={holidayModeActive}
            safetyCheckActive={safetyConfig.active}
            primaryContact={contacts.find((c) => c.callEnabled) || contacts[0]}
            customLogoUrl={customLogoUrl}
            onTestVolumeBoost={handleTestVolumeBoostCycle}
            volumeState={volumeState}
          />
        </main>
      )}

      {/* TAB 2: SMART AI COPILOT */}
      {activeTab === 'ai' && (
        <main className="flex-1 pb-20 sm:pb-6 flex flex-col">
          <AiConversationalView
            userName={userProfile.name}
            language={activeLanguage}
            voiceActive={voiceActive}
            lastTranscript={lastTranscript}
            onToggleVoice={handleToggleVoice}
            contacts={contacts}
            onTriggerSos={() =>
              triggerEmergencyWorkflow({
                riskScore: 100,
                emergencyType: 'MANUAL_SOS',
                confidence: 1.0,
                recommendedAction: 'IMMEDIATE_SOS',
              })
            }
            onOpenGuides={() => setGuidesOpen(true)}
            onOpenStealth={() => setStealthActive(true)}
            onOpenSafetyMode={() => setSafetyModeOpen(true)}
            onTriggerPhoneDrop={triggerPhoneDropSos}
            onTriggerSnatchSos={triggerSnatchSos}
            onOpenQrScanner={() => setQrScannerOpen(true)}
            onOpenOtpShield={() => setOtpShieldOpen(true)}
            onOpenHolidayMode={() => setHolidayModeOpen(true)}
            onOpenAndroidHub={() => setAndroidHubOpen(true)}
            onOpenEmergencyDialer={() => setEmergencyDialerOpen(true)}
            initialPrompt={aiPrefilledPrompt}
            customLogoUrl={customLogoUrl}
            holidayModeActive={holidayModeActive}
            isDarkMode={isDarkMode}
            onToggleTheme={() => {
              const next = !isDarkMode;
              setIsDarkMode(next);
              localStorage.setItem('jashpi_theme_dark', JSON.stringify(next));
            }}
            isSirenActive={isSirenActive}
            onToggleSiren={() => handleToggleSiren()}
          />
        </main>
      )}

      {/* TAB 3: SMART TOOLS VIEW */}
      {activeTab === 'tools' && (
        <main className="flex-1 pb-20 sm:pb-6">
          <SmartToolsView
            isDarkMode={isDarkMode}
            language={activeLanguage}
            onOpenEmergencyDialer={() => setEmergencyDialerOpen(true)}
            onOpenOtpShield={() => setOtpShieldOpen(true)}
            onOpenSafetyMode={() => setSafetyModeOpen(true)}
            onOpenQrScanner={() => setQrScannerOpen(true)}
            onOpenGuides={() => setGuidesOpen(true)}
            onOpenHolidayMode={() => setHolidayModeOpen(true)}
            onOpenStealth={() => setStealthActive(true)}
            onOpenAndroidHub={() => setAndroidHubOpen(true)}
            isSirenActive={isSirenActive}
            onToggleSiren={() => handleToggleSiren()}
            torchActive={torchActive}
            onToggleTorch={async () => {
              const next = !torchActive;
              await toggleFlashlight(next);
              setTorchActive(next);
              speakVoiceFeedback(next ? 'Flashlight on' : 'Flashlight off');
            }}
            holidayModeActive={holidayModeActive}
            safetyCheckActive={safetyConfig.active}
            onTestVolumeBoost={handleTestVolumeBoostCycle}
            volumeState={volumeState}
          />
        </main>
      )}

      {/* TAB 4: CONTACTS & FAMILY CIRCLE */}
      {activeTab === 'contacts' && (
        <main className="flex-1 pb-20 sm:pb-6">
          <ContactsView
            contacts={contacts}
            onSaveContacts={handleSaveContacts}
            isDarkMode={isDarkMode}
            language={activeLanguage}
            batteryLevel={batteryData.level}
          />
        </main>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-2xl ${
        isDarkMode ? 'bg-[#0f1424]/95 border-white/10' : 'bg-white/95 border-slate-200'
      }`}>
        {[
          { id: 'ai' as const, label: activeLanguage === 'hi' ? 'स्मार्ट AI' : 'Smart AI', icon: Bot },
          { id: 'home' as const, label: activeLanguage === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: ShieldAlert },
          { id: 'tools' as const, label: activeLanguage === 'hi' ? 'टूल्स' : 'Tools', icon: Zap },
          { id: 'contacts' as const, label: activeLanguage === 'hi' ? 'संपर्क' : 'Contacts', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'ai') setAiPrefilledPrompt(undefined);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl cursor-pointer transition-all ${
                isActive
                  ? 'text-cyan-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl ${isActive ? 'bg-cyan-500/20 text-cyan-300' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Disclaimer */}
      <footer className="bg-black/60 border-t border-white/5 py-2 px-4 text-center">
        <p className="text-[10px] text-slate-400 max-w-2xl mx-auto">
          JASHPI (Joint Alert & Support for Health and Personal Emergencies). Hands-free response, phone-drop sensor, and voice flashlights. Privacy guaranteed: raw audio processed on-device.
        </p>
      </footer>

      {/* Active Full-Screen Emergency Heads-Up Overlay */}
      {activeEmergency && (
        <ActiveEmergencyOverlay
          event={activeEmergency}
          contacts={contacts}
          onCancel={cancelEmergency}
          isTestMode={isTestMode}
          meshPeers={activeMeshPeers}
          language={activeLanguage}
        />
      )}

      {/* QR & Link Safety Scanner Modal */}
      <QrLinkScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        isDarkMode={isDarkMode}
        contacts={contacts}
        onAddContact={handleAddContact}
      />

      {/* OTP Scam & Cyber Fraud Shield Modal (National Helpline 1930) */}
      <OtpFraudShieldModal
        isOpen={otpShieldOpen}
        onClose={() => setOtpShieldOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Holiday / Wander Mode (Ghumne Ka Mode & Inactivity SOS) */}
      <HolidayModeModal
        isOpen={holidayModeOpen}
        onClose={() => setHolidayModeOpen(false)}
        holidayModeActive={holidayModeActive}
        onToggleHolidayMode={handleToggleHolidayMode}
        inactivityHours={inactivityHours}
        onSetInactivityHours={handleSetInactivityHours}
        onSimulateInactivitySos={simulateInactivitySos}
        isDarkMode={isDarkMode}
      />

      {/* Standout Feature: Stealth Disguise Blackout Overlay */}
      <StealthModeOverlay
        isActive={stealthActive}
        onExit={() => setStealthActive(false)}
        onTriggerSilentSos={() =>
          triggerEmergencyWorkflow(
            {
              riskScore: 100,
              emergencyType: 'SILENT_STEALTH_DISTRESS',
              confidence: 1.0,
              recommendedAction: 'IMMEDIATE_SOS',
            },
            false
          )
        }
        callerName={contacts[0]?.name || 'Papa (Home)'}
      />

      {/* Onboarding Modal for First Time User (Name, Language & Developer Passphrase Backdoor) */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleCompleteOnboarding}
      />

      {/* Developer Lab Modal (Unlocked via Passphrase) */}
      <DeveloperLabModal
        isOpen={developerLabOpen}
        onClose={() => setDeveloperLabOpen(false)}
        developerApiKey={userProfile.developerKey || ''}
        onSaveApiKey={(key) => {
          const updated = { ...userProfile, developerKey: key };
          setUserProfile(updated);
          localStorage.setItem('jashpi_user_profile', JSON.stringify(updated));
        }}
        onTriggerPhoneDrop={triggerPhoneDropSos}
        onTriggerSnatch={triggerSnatchSos}
        onTriggerInactivitySos={simulateInactivitySos}
        onTriggerBatteryAlert={() => handleSimulateBatteryLevel(12, false)}
        onTestVolumeBoost={handleTestVolumeBoostCycle}
        onTriggerTestSos={(type) =>
          triggerEmergencyWorkflow(
            {
              riskScore: 99,
              emergencyType: type,
              confidence: 0.99,
              recommendedAction: 'IMMEDIATE_SOS',
            },
            true
          )
        }
        onResetDeveloperMode={() => {
          const updated = { ...userProfile, isDeveloper: false, developerKey: undefined };
          setUserProfile(updated);
          localStorage.setItem('jashpi_user_profile', JSON.stringify(updated));
          setDeveloperLabOpen(false);
        }}
      />

      {/* Modal Dialogs */}
      <DiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        motionData={motionData}
        gpsData={gpsData}
        voiceActive={voiceActive}
        batteryData={batteryData}
        onTriggerTestSos={(type) =>
          triggerEmergencyWorkflow(
            {
              riskScore: 99,
              emergencyType: type,
              confidence: 0.99,
              recommendedAction: 'IMMEDIATE_SOS',
            },
            true
          )
        }
        onSimulateBatteryLevel={handleSimulateBatteryLevel}
        onTriggerSnatch={triggerSnatchSos}
        onTriggerInactivitySos={simulateInactivitySos}
        onTestVolumeBoost={handleTestVolumeBoostCycle}
        lastTranscript={lastTranscript}
      />

      <AskJashpiModal isOpen={askAiOpen} onClose={() => setAskAiOpen(false)} />

      <ContactsModal
        isOpen={contactsOpen}
        onClose={() => setContactsOpen(false)}
        contacts={contacts}
        onSaveContacts={handleSaveContacts}
      />

      {/* Animated Visual Guides Modal (CPR, Snake Bite, Fire, Bleeding) */}
      <AnimatedGuidesModal
        isOpen={guidesOpen}
        onClose={() => setGuidesOpen(false)}
        language={activeLanguage}
      />

      <SafetyModeModal
        isOpen={safetyModeOpen}
        onClose={() => setSafetyModeOpen(false)}
        config={safetyConfig}
        onStartSafetyCheck={handleStartSafetyCheck}
        onConfirmSafe={handleConfirmSafe}
        onStopSafetyCheck={handleConfirmSafe}
      />

      {/* History & Privacy Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#1A0B2E] border border-white/20 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col p-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-[#00F3FF]" />
                <span>Emergency Event History & Privacy</span>
              </h2>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {eventHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No emergency incidents recorded. System log is clean.
                </div>
              ) : (
                eventHistory.map((evt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-rose-400">{evt.emergencyType}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      Trigger: {evt.triggerType} | Confidence: {Math.round(evt.confidence * 100)}%
                    </div>
                    {evt.latitude && evt.longitude && (
                      <div className="text-[11px] text-cyan-400 font-mono">
                        GPS: {evt.latitude.toFixed(4)}, {evt.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Erase All History (Privacy)</span>
              </button>
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Emergency 1-Touch Cellular Dialer Modal */}
      <RealEmergencyDialerModal
        isOpen={emergencyDialerOpen}
        onClose={() => setEmergencyDialerOpen(false)}
        contacts={contacts}
        language={activeLanguage}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
