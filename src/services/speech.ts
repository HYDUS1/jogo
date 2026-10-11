import { speakVoiceFeedback } from './audioSiren';

export interface VoiceEventHandlers {
  onWakeWord?: () => void;
  onEmergencyCommand?: (command: string, type: string, confidence: number) => void;
  onPanicBurst?: (phrase: string, count: number) => void;
  onCancelCommand?: () => void;
  onActionCommand?: (action: 'FLASHLIGHT_ON' | 'FLASHLIGHT_OFF' | 'SIREN_ON' | 'SIREN_OFF' | 'MAKE_CALL' | 'EMERGENCY_DIALER' | 'SHARE_LOCATION' | 'WHATSAPP_LOCATION' | 'TELEGRAM_ALERT' | 'STEALTH_MODE' | 'QR_SCANNER' | 'OTP_SHIELD' | 'HOLIDAY_MODE' | 'SNATCH_SOS' | 'ANDROID_APP') => void;
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
  onListeningStateChange?: (active: boolean) => void;
}

export class HandsFreeSpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldRun: boolean = false;
  private handlers: VoiceEventHandlers = {};
  private panicTimestamps: number[] = [];
  private lastExecutedAction: string = '';
  private lastExecutedTime: number = 0;
  private readonly PANIC_WINDOW_MS = 10000;
  private readonly PANIC_THRESHOLD = 3;

  private emergencyKeywords: Record<string, string> = {
    'bachao mujhe': 'PERSONAL_SAFETY',
    'bachao': 'PERSONAL_SAFETY',
    'bchao': 'PERSONAL_SAFETY',
    'help me': 'DISTRESS',
    'help': 'DISTRESS',
    'madad': 'DISTRESS',
    'madad karo': 'DISTRESS',
    'emergency': 'CRITICAL_EMERGENCY',
    'accident ho gaya': 'ACCIDENT',
    'accident': 'ACCIDENT',
    'i had an accident': 'ACCIDENT',
    'call my family': 'CALL_FAMILY',
    'call emergency contact': 'CALL_CONTACT',
    'send my location': 'LOCATION_BROADCAST',
    'i am not safe': 'PERSONAL_SAFETY',
    'someone is hurting me': 'VIOLENCE_ALERT',
    'medical emergency': 'MEDICAL',
    'dil ka daura': 'MEDICAL',
    'fire': 'FIRE',
    'aag lag gayi': 'FIRE',
    'police': 'POLICE',
    'ambulance': 'MEDICAL'
  };

  private cancelKeywords = ['cancel', "i'm ok", 'im ok', 'i am ok', 'stop', 'galat tha', 'ruk jao', 'roko', 'band karo'];

  constructor(handlers: VoiceEventHandlers) {
    this.handlers = handlers;
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.handlers.onError?.('Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Robust for Hindi & English mixed speech

      this.recognition.onstart = () => {
        this.isListening = true;
        this.handlers.onListeningStateChange?.(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.handlers.onListeningStateChange?.(false);
        // Automatically and quietly restart if engine is supposed to be running
        if (this.shouldRun) {
          setTimeout(() => {
            if (this.shouldRun) {
              try {
                this.recognition?.start();
              } catch (_e) {}
            }
          }, 350);
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('[JASHPI Voice Engine] Speech event:', e.error);
        }
        if (e.error === 'not-allowed') {
          this.shouldRun = false;
          this.handlers.onError?.('Microphone permission denied.');
        }
      };

      this.recognition.onresult = (e: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim().toLowerCase();
        if (currentText) {
          this.handlers.onTranscriptChange?.(currentText, Boolean(finalTranscript));
          this.evaluatePhrase(currentText);
        }
      };
    } catch (err: any) {
      this.handlers.onError?.('Failed to initialize speech engine: ' + err.message);
    }
  }

  public start() {
    this.shouldRun = true;
    if (this.recognition && !this.isListening) {
      try {
        // Quiet start without annoying on/off beeps
        this.recognition.start();
      } catch (_e) {}
    }
  }

  public stop() {
    this.shouldRun = false;
    if (this.recognition) {
      try {
        // Quiet stop without annoying beeps
        this.recognition.stop();
      } catch (_e) {}
    }
  }

  public isRunning(): boolean {
    return this.shouldRun && this.isListening;
  }

  private dispatchActionWithDebounce(action: 'FLASHLIGHT_ON' | 'FLASHLIGHT_OFF' | 'SIREN_ON' | 'SIREN_OFF' | 'MAKE_CALL' | 'EMERGENCY_DIALER' | 'SHARE_LOCATION' | 'WHATSAPP_LOCATION' | 'TELEGRAM_ALERT' | 'STEALTH_MODE' | 'QR_SCANNER' | 'OTP_SHIELD' | 'HOLIDAY_MODE' | 'SNATCH_SOS' | 'ANDROID_APP', voiceMsg?: string) {
    const now = Date.now();
    if (this.lastExecutedAction === action && now - this.lastExecutedTime < 2000) {
      return; // Prevent duplicate rapid bursts
    }
    this.lastExecutedAction = action;
    this.lastExecutedTime = now;
    this.handlers.onActionCommand?.(action);
    if (voiceMsg) {
      speakVoiceFeedback(voiceMsg);
    }
  }

  private evaluatePhrase(rawText: string) {
    const text = rawText.toLowerCase().replace(/[,.?!]/g, ' ');

    // 1. Check for cancel phrase
    for (const cancelKw of this.cancelKeywords) {
      if (text.includes(cancelKw)) {
        this.handlers.onCancelCommand?.();
        return;
      }
    }

    // 2. Siren Controls (Explicit voice-only command: "siren bajao", "siren on", "siren band")
    const isSirenOn =
      text.includes('siren bajao') ||
      text.includes('siren baja do') ||
      text.includes('siren bajao na') ||
      text.includes('siren baja') ||
      text.includes('siren chalao') ||
      text.includes('siren on') ||
      text.includes('start siren') ||
      text.includes('play siren') ||
      text.includes('sound siren') ||
      text.includes('alarm bajao') ||
      text.includes('alarm on') ||
      text.includes('police siren');

    if (isSirenOn) {
      this.dispatchActionWithDebounce('SIREN_ON', 'Siren activated.');
      return;
    }

    const isSirenOff =
      text.includes('siren off') ||
      text.includes('stop siren') ||
      text.includes('siren band') ||
      text.includes('siren band karo') ||
      text.includes('siren roko') ||
      text.includes('alarm band') ||
      text.includes('alarm off') ||
      text.includes('siren chup');

    if (isSirenOff) {
      this.dispatchActionWithDebounce('SIREN_OFF', 'Siren stopped.');
      return;
    }

    // 3. Flashlight / Torch Controls
    const isFlashlightOn =
      text.includes('flashlight on') ||
      text.includes('torch on') ||
      text.includes('light on') ||
      text.includes('batti jalao') ||
      text.includes('torch jalao') ||
      text.includes('torch chalu') ||
      text.includes('light jalao');

    if (isFlashlightOn) {
      this.dispatchActionWithDebounce('FLASHLIGHT_ON', 'Flashlight turned on.');
      return;
    }

    const isFlashlightOff =
      text.includes('flashlight off') ||
      text.includes('torch off') ||
      text.includes('light off') ||
      text.includes('batti bujhao') ||
      text.includes('torch band') ||
      text.includes('light bujhao') ||
      text.includes('light band');

    if (isFlashlightOff) {
      this.dispatchActionWithDebounce('FLASHLIGHT_OFF', 'Flashlight turned off.');
      return;
    }

    // 4. Phone Calls & Emergency Numbers
    if (
      text.includes('make a call') ||
      text.includes('call my contact') ||
      text.includes('call my family') ||
      text.includes('phone lagao') ||
      text.includes('call lagao') ||
      text.includes('call police') ||
      text.includes('police ko call') ||
      text.includes('112 call')
    ) {
      this.dispatchActionWithDebounce('MAKE_CALL', 'Calling emergency contact.');
      return;
    }

    // 5. Emergency Dialer
    if (
      text.includes('emergency dialer') ||
      text.includes('dialer kholo') ||
      text.includes('dialer open') ||
      text.includes('phone milao') ||
      text.includes('number dial')
    ) {
      this.dispatchActionWithDebounce('EMERGENCY_DIALER');
      return;
    }

    // 6. Share Location & WhatsApp Live Location
    if (
      text.includes('whatsapp') ||
      text.includes('whatsapp pe') ||
      text.includes('whatsapp location') ||
      text.includes('share my location') ||
      text.includes('share location') ||
      text.includes('send location') ||
      text.includes('location bhejo') ||
      text.includes('live location') ||
      text.includes('kahan hu') ||
      text.includes('meri location')
    ) {
      this.dispatchActionWithDebounce('WHATSAPP_LOCATION');
      return;
    }

    // 6b. Telegram Emergency Alert
    if (
      text.includes('telegram') ||
      text.includes('telegram bhejo') ||
      text.includes('telegram alert') ||
      text.includes('telegram message') ||
      text.includes('send telegram')
    ) {
      this.dispatchActionWithDebounce('TELEGRAM_ALERT');
      return;
    }

    // 7. QR & Link Scanner
    if (
      text.includes('qr') ||
      text.includes('scanner') ||
      text.includes('scan link') ||
      text.includes('scan code') ||
      text.includes('scan qr') ||
      text.includes('scanner kholo')
    ) {
      this.dispatchActionWithDebounce('QR_SCANNER');
      return;
    }

    // 8. Cyber & OTP Fraud Shield
    if (
      text.includes('otp') ||
      text.includes('fraud') ||
      text.includes('cyber crime') ||
      text.includes('1930') ||
      text.includes('scam')
    ) {
      this.dispatchActionWithDebounce('OTP_SHIELD');
      return;
    }

    // 9. Holiday / Wander Mode
    if (
      text.includes('holiday mode') ||
      text.includes('chhutti mode') ||
      text.includes('wander mode') ||
      text.includes('travel mode')
    ) {
      this.dispatchActionWithDebounce('HOLIDAY_MODE');
      return;
    }

    // 10. Phone Snatch / Theft SOS
    if (
      text.includes('snatch') ||
      text.includes('chheen liya') ||
      text.includes('mobile chheena') ||
      text.includes('theft force')
    ) {
      this.dispatchActionWithDebounce('SNATCH_SOS');
      return;
    }

    // 11. Stealth / Blackout Mode
    if (
      text.includes('stealth mode') ||
      text.includes('blackout mode') ||
      text.includes('chhupa lo') ||
      text.includes('silent mode')
    ) {
      this.dispatchActionWithDebounce('STEALTH_MODE');
      return;
    }

    // 12. App & APK Download
    if (
      text.includes('install app') ||
      text.includes('android app') ||
      text.includes('download app') ||
      text.includes('apk') ||
      text.includes('app chahiye') ||
      text.includes('app download')
    ) {
      this.dispatchActionWithDebounce('ANDROID_APP');
      return;
    }

    // 13. Wake Phrase: "Hello Jashpi" or "Jashpi" (Silent wake without annoying beep)
    if (text.includes('hello jashpi') || text.includes('jashpi')) {
      this.handlers.onWakeWord?.();
      speakVoiceFeedback("I'm listening. What is your emergency?");
      return;
    }

    // 14. Repeated panic phrase burst ("bachao" or "help" 3 times in 10s)
    if (text.includes('bachao') || text.includes('help')) {
      const now = Date.now();
      this.panicTimestamps.push(now);
      this.panicTimestamps = this.panicTimestamps.filter((t) => now - t <= this.PANIC_WINDOW_MS);

      if (this.panicTimestamps.length >= this.PANIC_THRESHOLD) {
        this.handlers.onPanicBurst?.(text, this.panicTimestamps.length);
        this.panicTimestamps = [];
        return;
      }
    }

    // 15. Emergency keywords (Police, Ambulance, Accident, Fire, Bachao)
    for (const [kw, type] of Object.entries(this.emergencyKeywords)) {
      if (text.includes(kw)) {
        this.handlers.onEmergencyCommand?.(kw, type, 0.95);
        return;
      }
    }
  }
}

