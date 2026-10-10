import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const emergencyDatabase = new Map();
const recentRateLimitMap = new Map();

function rateLimiter(limitMs = 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const last = recentRateLimitMap.get(ip) || 0;
    if (now - last < limitMs) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please retry shortly.' });
    }
    recentRateLimitMap.set(ip, now);
    next();
  };
}

// GET /health
app.get('/health', (req, res) => {
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token');
  res.json({
    status: 'ok',
    service: 'JASHPI',
    timestamp: new Date().toISOString(),
    telegram: telegramConfigured,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    version: '1.0.0'
  });
});

// POST /api/emergency
app.post('/api/emergency', async (req, res) => {
  try {
    const {
      eventId,
      timestamp,
      triggerType = 'MANUAL_SOS',
      emergencyType = 'UNKNOWN',
      confidence = 1.0,
      latitude,
      longitude,
      accuracy,
      battery,
      network = 'ONLINE',
      userName = 'User',
      contacts = [],
      telegramChatId
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing required field: eventId' });
    }

    if (emergencyDatabase.has(eventId)) {
      return res.status(200).json({
        message: 'Emergency event already registered',
        event: emergencyDatabase.get(eventId),
        duplicate: true
      });
    }

    const newEvent = {
      eventId,
      timestamp: timestamp || Date.now(),
      triggerType,
      emergencyType,
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
      locationHistory: (latitude && longitude) ? [{ lat: latitude, lng: longitude, time: Date.now() }] : []
    };

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = telegramChatId || process.env.DEFAULT_TELEGRAM_CHAT_ID;

    if (botToken && botToken !== 'your_telegram_bot_token' && targetChatId) {
      try {
        const mapsLink = (latitude && longitude) ? `https://www.google.com/maps?q=${latitude},${longitude}` : 'Location unavailable';
        const textMessage = `🚨 *JASHPI EMERGENCY ALERT* 🚨\n\n*Name:* ${userName}\n*Emergency:* ${emergencyType}\n*Trigger:* ${triggerType} (Confidence: ${Math.round(confidence * 100)}%)\n*Battery:* ${battery ?? 'N/A'}%\n*Time:* ${new Date().toLocaleTimeString()}\n\n📍 *Location:* ${mapsLink}\n(Accuracy: ${accuracy ? Math.round(accuracy) + 'm' : 'approx'})`;

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: textMessage,
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          })
        });

        newEvent.telegramStatus = tgRes.ok ? 'SENT' : `FAILED_HTTP_${tgRes.status}`;
      } catch (err) {
        newEvent.telegramStatus = `ERROR_${err.message || 'NET_ERR'}`;
      }
    } else {
      newEvent.telegramStatus = 'NOT_CONFIGURED';
    }

    emergencyDatabase.set(eventId, newEvent);

    res.status(201).json({
      success: true,
      message: 'Emergency registered and dispatched',
      event: newEvent,
      broadcastResults: {
        telegram: newEvent.telegramStatus,
        contactsCount: contacts.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/location
app.post('/api/location', (req, res) => {
  const { eventId, latitude, longitude, accuracy, timestamp } = req.body;
  if (!eventId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing eventId or coordinates' });
  }

  const event = emergencyDatabase.get(eventId);
  if (!event) {
    return res.status(404).json({ error: 'Emergency event not found' });
  }

  event.latitude = latitude;
  event.longitude = longitude;
  event.accuracy = accuracy;
  if (!event.locationHistory) event.locationHistory = [];
  event.locationHistory.push({ lat: latitude, lng: longitude, time: timestamp || Date.now() });

  res.json({ success: true, pointsCount: event.locationHistory.length });
});

// POST /api/telegram
app.post('/api/telegram', rateLimiter(500), async (req, res) => {
  try {
    const { chatId, message, latitude, longitude } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken || botToken === 'your_telegram_bot_token') {
      return res.status(503).json({
        success: false,
        error: 'Telegram bot token is not configured on the server. Set TELEGRAM_BOT_TOKEN in .env'
      });
    }

    const targetChatId = chatId || process.env.DEFAULT_TELEGRAM_CHAT_ID;
    if (!targetChatId) {
      return res.status(400).json({ error: 'Missing chatId' });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message || '🚨 JASHPI Emergency Alert Notification',
        parse_mode: 'Markdown'
      })
    });

    const data = await tgRes.json();
    if (!tgRes.ok) {
      return res.status(tgRes.status).json({ success: false, telegramError: data });
    }

    if (latitude && longitude) {
      fetch(`https://api.telegram.org/bot${botToken}/sendLocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChatId, latitude, longitude })
      }).catch(() => {});
    }

    res.json({ success: true, messageId: data.result?.message_id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/device-status
app.post('/api/device-status', (req, res) => {
  const { battery, network, sensors, voiceActive } = req.body;
  res.json({
    acknowledged: true,
    serverTime: Date.now(),
    batterySavingRecommended: typeof battery === 'number' && battery < 20,
    status: { battery, network, sensors, voiceActive }
  });
});

// POST /api/events/sync
app.post('/api/events/sync', (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'Expected an array of events' });
  }

  let syncedCount = 0;
  for (const evt of events) {
    if (evt && evt.eventId && !emergencyDatabase.has(evt.eventId)) {
      emergencyDatabase.set(evt.eventId, evt);
      syncedCount++;
    }
  }

  res.json({ success: true, syncedCount, totalStored: emergencyDatabase.size });
});

// GET /api/events
app.get('/api/events', (_req, res) => {
  const allEvents = Array.from(emergencyDatabase.values()).sort((a, b) => b.timestamp - a.timestamp);
  res.json({ events: allEvents });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JASHPI standalone backend listening on port ${PORT}`);
});
