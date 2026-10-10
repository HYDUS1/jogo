import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security and utility headers
app.use(express.json({ limit: '2mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Simple in-memory storage for emergency events and idempotency
interface EmergencyEvent {
  eventId: string;
  timestamp: number;
  triggerType: string;
  emergencyType: string;
  confidence: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  battery?: number;
  network?: string;
  callStatus?: string;
  smsStatus?: string;
  telegramStatus?: string;
  trackingStatus?: string;
  cancelled?: boolean;
  notes?: string;
  locationHistory?: Array<{ lat: number; lng: number; time: number }>;
}

const emergencyDatabase: Map<string, EmergencyEvent> = new Map();
const recentRateLimitMap: Map<string, number> = new Map();

// Rate limiting middleware for sensitive endpoints
function rateLimiter(limitMs: number = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const last = recentRateLimitMap.get(ip) || 0;
    if (now - last < limitMs) {
      res.status(429).json({ error: 'Too many requests. Please slow down.' });
      return;
    }
    recentRateLimitMap.set(ip, now);
    next();
  };
}

// 1. Health check
app.get('/health', (_req: Request, res: Response) => {
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here');
  res.json({
    status: 'ok',
    service: 'JASHPI',
    timestamp: new Date().toISOString(),
    telegram: telegramConfigured,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    version: '1.0.0',
    capabilities: [
      'HANDS_FREE_VOICE_TRIGGER',
      'ACCIDENT_DETECTION',
      'FALL_DETECTION',
      'TELEGRAM_RELAY',
      'LIVE_LOCATION_TRACKING',
      'AI_TRIAGE',
      'NATIVE_ANDROID_KOTLIN_APK'
    ],
  });
});

// Download Endpoints for Android APK and Kotlin Project
app.get('/api/download/apk', (_req: Request, res: Response) => {
  const apkPath = path.resolve(__dirname, 'public', 'downloads', 'JASHPI_Emergency_Safety_v2.0.apk');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="JASHPI_Emergency_Safety_v2.0.apk"');
  res.sendFile(apkPath);
});

app.get(['/api/download/kotlin-source', '/api/download/android-studio-zip'], (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'downloads', 'JASHPI_AI_Emergency_Kotlin_Android_Project.zip');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="JASHPI_AI_Emergency_Kotlin_Android_Project.zip"');
  res.sendFile(zipPath);
});

// 2. Emergency Trigger and Idempotent Dispatch
app.post('/api/emergency', async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      timestamp,
      triggerType,
      emergencyType,
      confidence = 1.0,
      latitude,
      longitude,
      accuracy,
      battery,
      network = 'ONLINE',
      userName = 'User',
      contacts = [],
      telegramChatId,
    } = req.body;

    if (!eventId) {
      res.status(400).json({ error: 'Missing required field: eventId' });
      return;
    }

    // Idempotency check: if already processed, return existing state
    if (emergencyDatabase.has(eventId)) {
      const existing = emergencyDatabase.get(eventId)!;
      res.status(200).json({
        message: 'Emergency event already registered',
        event: existing,
        duplicate: true,
      });
      return;
    }

    const newEvent: EmergencyEvent = {
      eventId,
      timestamp: timestamp || Date.now(),
      triggerType: triggerType || 'MANUAL_SOS',
      emergencyType: emergencyType || 'UNKNOWN',
      confidence,
      latitude,
      longitude,
      accuracy,
      battery,
      network,
      callStatus: 'QUEUED',
      smsStatus: 'QUEUED',
      telegramStatus: 'PENDING',
      trackingStatus: 'ACTIVE',
      cancelled: false,
      locationHistory: latitude && longitude ? [{ lat: latitude, lng: longitude, time: Date.now() }] : [],
    };

    // Relay to Telegram if configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = telegramChatId || process.env.DEFAULT_TELEGRAM_CHAT_ID;

    if (botToken && botToken !== 'your_telegram_bot_token_here' && targetChatId) {
      try {
        const mapsLink = latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : 'Location unavailable';
        const textMessage = `🚨 *JASHPI EMERGENCY ALERT* 🚨\n\n*Name:* ${userName}\n*Emergency:* ${emergencyType}\n*Trigger:* ${triggerType} (Confidence: ${Math.round(confidence * 100)}%)\n*Battery:* ${battery ?? 'N/A'}%\n*Time:* ${new Date().toLocaleTimeString()}\n\n📍 *Location:* ${mapsLink}\n(Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'approx'})`;

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: textMessage,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
          }),
        });

        if (tgRes.ok) {
          newEvent.telegramStatus = 'SENT';
        } else {
          newEvent.telegramStatus = 'FAILED_HTTP_' + tgRes.status;
        }
      } catch (err: any) {
        newEvent.telegramStatus = 'ERROR_' + (err.message || 'NET_ERR');
      }
    } else {
      newEvent.telegramStatus = 'NOT_CONFIGURED';
    }

    emergencyDatabase.set(eventId, newEvent);

    res.status(201).json({
      success: true,
      message: 'Emergency triggered and registered successfully',
      event: newEvent,
      broadcastResults: {
        telegram: newEvent.telegramStatus,
        contactsCount: contacts.length,
      },
    });
  } catch (error: any) {
    console.error('Error handling emergency trigger:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. Live Location Updates
app.post('/api/location', (req: Request, res: Response) => {
  try {
    const { eventId, latitude, longitude, accuracy, timestamp } = req.body;
    if (!eventId || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Missing eventId or coordinates' });
      return;
    }

    const event = emergencyDatabase.get(eventId);
    if (!event) {
      res.status(404).json({ error: 'Emergency event not found' });
      return;
    }

    event.latitude = latitude;
    event.longitude = longitude;
    event.accuracy = accuracy;
    if (!event.locationHistory) event.locationHistory = [];
    event.locationHistory.push({ lat: latitude, lng: longitude, time: timestamp || Date.now() });

    // Keep history manageable
    if (event.locationHistory.length > 500) {
      event.locationHistory.shift();
    }

    res.json({ success: true, pointsCount: event.locationHistory.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Telegram Relay Endpoint
app.post('/api/telegram', rateLimiter(500), async (req: Request, res: Response) => {
  try {
    const { chatId, message, latitude, longitude } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken || botToken === 'your_telegram_bot_token_here') {
      res.status(503).json({
        success: false,
        error: 'Telegram bot token is not configured on the server. Set TELEGRAM_BOT_TOKEN in .env',
      });
      return;
    }

    const targetChatId = chatId || process.env.DEFAULT_TELEGRAM_CHAT_ID;
    if (!targetChatId) {
      res.status(400).json({ error: 'Missing chatId' });
      return;
    }

    // Send text
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message || '🚨 JASHPI Emergency Alert Notification',
        parse_mode: 'Markdown',
      }),
    });

    const data = await tgRes.json();

    // If coordinates provided, send location pinpoint as well
    if (latitude && longitude && tgRes.ok) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendLocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            latitude,
            longitude,
          }),
        });
      } catch (locErr) {
        console.warn('Failed to send telegram location pin:', locErr);
      }
    }

    if (!tgRes.ok) {
      res.status(tgRes.status).json({ success: false, telegramError: data });
      return;
    }

    res.json({ success: true, messageId: data.result?.message_id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Device Status Reporting
app.post('/api/device-status', (req: Request, res: Response) => {
  const { battery, network, sensors, voiceActive } = req.body;
  res.json({
    acknowledged: true,
    serverTime: Date.now(),
    batterySavingRecommended: typeof battery === 'number' && battery < 20,
    status: {
      battery,
      network,
      sensors,
      voiceActive,
    },
  });
});

// 6. Offline Events Queue Synchronization
app.post('/api/events/sync', (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Expected an array of events' });
      return;
    }

    let syncedCount = 0;
    for (const evt of events) {
      if (evt && evt.eventId) {
        if (!emergencyDatabase.has(evt.eventId)) {
          emergencyDatabase.set(evt.eventId, evt);
          syncedCount++;
        }
      }
    }

    res.json({ success: true, syncedCount, totalStored: emergencyDatabase.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get and delete events (History & Privacy)
app.get('/api/events', (_req: Request, res: Response) => {
  const allEvents = Array.from(emergencyDatabase.values()).sort((a, b) => b.timestamp - a.timestamp);
  res.json({ events: allEvents });
});

app.delete('/api/events/:eventId', (req: Request, res: Response) => {
  const { eventId } = req.params;
  const deleted = emergencyDatabase.delete(eventId);
  res.json({ success: deleted });
});

app.delete('/api/events', (_req: Request, res: Response) => {
  emergencyDatabase.clear();
  res.json({ success: true, message: 'All emergency logs erased from server memory' });
});

// 8. AI Ask JASHPI Assistant (First Aid, CPR, Triage, and Emergency Procedures)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, language = 'en', context, customApiKey } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const effectiveApiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      // Deterministic emergency fallback if no API key is present
      const fallbackResponse = getEmergencyFallbackGuide(prompt, language);
      res.json({
        reply: fallbackResponse,
        source: 'OFFLINE_FIRST_AID_PROTOCOL',
        isAi: false,
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
    const systemInstruction = `You are JASHPI Emergency AI ("Ek Tap, Ek Saans, Ek Zindagi"), an instant emergency assistance & first aid expert.
Rules:
1. Provide concise, direct, life-saving instructions first. Highlight step 1, step 2, step 3.
2. In severe medical emergencies, always remind the user to call Indian Emergency Number 112 (Ambulance 108) immediately.
3. Keep instructions clean, short, and calm. No excessive conversational filler.
4. Support English, Hindi (Devanagari or Romanized Hinglish) depending on the user query.
5. Never hallucinate that an ambulance is currently on its way unless the user asked you for a procedure.
6. Topic focus: CPR, choking, bleeding, fractures, burns, accidents, panic attacks, stroke, heat stroke, poison, fire evacuation.`;

    const fullPrompt = `${systemInstruction}\n\nLanguage Preference: ${language}\nCurrent User Situation: ${context || 'General Emergency Query'}\n\nUser Question: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
    });

    const replyText = response.text?.trim() || 'Please call emergency services (112 or 108) immediately for help.';

    res.json({
      reply: replyText,
      source: 'GEMINI_LIVE',
      isAi: true,
    });
  } catch (error: any) {
    console.error('Gemini API call failed, falling back to local guide:', error);
    const { prompt, language } = req.body;
    res.json({
      reply: getEmergencyFallbackGuide(prompt || '', language || 'en'),
      source: 'OFFLINE_RECOVERY_PROTOCOL',
      isAi: false,
    });
  }
});

function getEmergencyFallbackGuide(query: string, lang: string): string {
  const q = query.toLowerCase();
  const isHindi = lang.startsWith('hi') || q.includes('bachao') || q.includes('kya kare');

  if (q.includes('cpr') || q.includes('heart') || q.includes('cardiac') || q.includes('dil')) {
    if (isHindi) {
      return `🔴 CPR आपातकालीन निर्देश (तुरंत 108/112 पर कॉल करें):
1. मरीज की चेतना जांचें: कंधे थपथपाएं और जोर से बोलें।
2. छाती के बीच में दोनों हाथों को एक दूसरे के ऊपर रखें।
3. तेजी और गहराई से दबाएं: 100-120 बार प्रति मिनट (लगभग 2 इंच गहरा)।
4. 'Stayin' Alive' गाने की लय में निरंतर दबाते रहें जब तक मदद न पहुंचे।`;
    }
    return `🔴 ADULT CPR EMERGENCY GUIDE (Call 112/108 IMMEDIATELY):
1. Check responsiveness: Tap shoulders and shout "Are you okay?".
2. Hand Placement: Heel of one hand on center of chest, other hand interlaced on top.
3. Hard & Fast Compressions: Push down 2 inches deep at 100–120 beats/minute.
4. Allow full chest recoil. Do not stop until paramedics arrive or AED is ready.`;
  }

  if (q.includes('bleed') || q.includes('khoon') || q.includes('blood')) {
    if (isHindi) {
      return `🔴 खून बहने पर प्राथमिक उपचार:
1. सीधे घाव पर साफ कपड़ा या पट्टी रखकर लगातार दबाव डालें।
2. घायल हिस्से को दिल की ऊंचाई से ऊपर उठाएं (अगर हड्डी न टूटी हो)।
3. पट्टी को हटाएं नहीं; अगर भीग जाए तो ऊपर से और कपड़ा रखें।
4. अगर खून न रुके, तुरंत नजदीकी अस्पताल या 108 बुलाएं।`;
    }
    return `🔴 SEVERE BLEEDING PROTOCOL:
1. Direct Pressure: Press firmly on the wound with clean cloth or sterile gauze.
2. Maintain Continuous Pressure: Do not lift the cloth to check.
3. Elevate: Raise the bleeding limb above the heart if no bone fracture is suspected.
4. Tourniquet: For life-threatening limb bleeds, apply tourniquet 2-3 inches above wound. Call 112.`;
  }

  if (q.includes('chok') || q.includes('gala') || q.includes('saans')) {
    if (isHindi) {
      return `🔴 दम घुटने (Choking) पर:
1. अगर व्यक्ति खांस सकता है, तो उसे खांसने दें।
2. 5 पीठ पर थपकी (Back blows) दोनों कंधों के बीच दें।
3. हीमलिक मैनूवर (Abdominal thrusts): पीछे खड़े होकर नाभि के ठीक ऊपर पेट को अंदर और ऊपर दबाएं।
4. बेहोश होने पर तुरंत CPR शुरू करें।`;
    }
    return `🔴 CHOKING / HEIMLICH MANEUVER:
1. Encourage coughing if they can speak or cough.
2. 5 Back Blows: Stand behind, lean them forward, deliver 5 firm blows between shoulder blades.
3. 5 Abdominal Thrusts: Place fist just above belly button, grasp with other hand, pull inward and upward sharply.
4. Repeat 5 blows + 5 thrusts until object dislodges or emergency help arrives.`;
  }

  if (isHindi) {
    return `🚨 JASHPI आपातकालीन निर्देश:
1. खुद को सुरक्षित स्थान पर ले जाएं।
2. भारत आपातकालीन नंबर 112 या एम्बुलेंस 108 डायल करें।
3. शांत रहें और गहरी सांस लें। JASHPI ने आपके आपातकालीन संपर्कों को तैयार कर लिया है।`;
  }

  return `🚨 JASHPI EMERGENCY PROTOCOL:
1. Ensure scene safety: Move away from active traffic, fire, or hazards.
2. Dial 112 (National Emergency) or 108 (Ambulance).
3. Keep phone accessible. JASHPI live location is broadcasted to your emergency network.`;
}

// Development Vite integration or Production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JASHPI] Emergency Platform Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
