import { EmergencyEvent } from '../types';

const OFFLINE_QUEUE_KEY = 'jashpi_offline_event_queue';

export function getOfflineEventQueue(): EmergencyEvent[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_e) {
    return [];
  }
}

export function queueOfflineEvent(event: EmergencyEvent) {
  const queue = getOfflineEventQueue();
  queue.push(event);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function syncOfflineEvents() {
  const queue = getOfflineEventQueue();
  if (queue.length === 0) return;

  try {
    const res = await fetch('/api/events/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: queue }),
    });
    if (res.ok) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch (err) {
    console.warn('Sync offline events postponed:', err);
  }
}

export async function triggerEmergencyApi(payload: {
  eventId: string;
  triggerType: string;
  emergencyType: string;
  confidence?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  battery?: number;
  userName?: string;
  contacts?: any[];
  telegramChatId?: string;
}): Promise<{ success: boolean; event?: EmergencyEvent; error?: string }> {
  try {
    const res = await fetch('/api/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server rejected trigger');
    }
    return { success: true, event: data.event };
  } catch (err: any) {
    // If network failed, save locally in offline queue
    const fallbackEvent: EmergencyEvent = {
      eventId: payload.eventId,
      timestamp: Date.now(),
      triggerType: payload.triggerType,
      emergencyType: payload.emergencyType,
      confidence: payload.confidence || 1.0,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      battery: payload.battery,
      network: 'OFFLINE_SAVED',
      callStatus: 'LOCAL_ONLY',
      smsStatus: 'LOCAL_ONLY',
      telegramStatus: 'QUEUED',
      trackingStatus: 'ACTIVE',
      cancelled: false,
    };
    queueOfflineEvent(fallbackEvent);
    return { success: false, error: err.message, event: fallbackEvent };
  }
}

export async function updateLiveLocationApi(
  eventId: string,
  latitude: number,
  longitude: number,
  accuracy?: number
) {
  try {
    await fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, latitude, longitude, accuracy, timestamp: Date.now() }),
    });
  } catch (_e) {}
}

export async function sendTelegramAlertApi(chatId: string, message: string, latitude?: number, longitude?: number, botToken?: string) {
  const cleanChatId = (chatId || '').trim();
  const cleanToken = (botToken || '').trim();
  const cleanMessage = message || '🚨 JASHPI Emergency Alert Notification';

  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: cleanChatId, message: cleanMessage, latitude, longitude, botToken: cleanToken }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
  } catch (_err) {
    // Server fetch failed, proceed to direct client fallback if token is available
  }

  // 2. Direct Telegram API fallback if client token is present
  if (cleanToken && cleanChatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: cleanMessage,
          disable_web_page_preview: false,
        }),
      });

      const tgData = await tgRes.json().catch(() => ({}));

      if (tgRes.ok) {
        if (latitude && longitude) {
          try {
            await fetch(`https://api.telegram.org/bot${cleanToken}/sendLocation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: cleanChatId,
                latitude: Number(latitude),
                longitude: Number(longitude),
              }),
            });
          } catch (_e) {}
        }
        return { success: true, messageId: tgData.result?.message_id };
      } else {
        return {
          success: false,
          error: tgData.description || `Telegram API error (${tgRes.status})`,
        };
      }
    } catch (directErr: any) {
      return { success: false, error: directErr.message || 'Direct Telegram network error' };
    }
  }

  return { success: false, error: 'Telegram dispatch failed: missing valid token or chat ID.' };
}

export async function fetchHealthApi() {
  try {
    const res = await fetch('/health');
    return await res.json();
  } catch (_e) {
    return { status: 'offline', telegram: false, geminiConfigured: false };
  }
}

export async function fetchEventsApi(): Promise<EmergencyEvent[]> {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    return data.events || [];
  } catch (_e) {
    return getOfflineEventQueue();
  }
}

export async function clearEventsApi() {
  try {
    await fetch('/api/events', { method: 'DELETE' });
  } catch (_e) {}
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  localStorage.removeItem('jashpi_local_events');
}

export async function askJashpiAiApi(
  prompt: string,
  language = 'en',
  context?: string,
  customApiKey?: string
) {
  try {
    // If not supplied explicitly, check localStorage developer key
    let keyToUse = customApiKey;
    if (!keyToUse) {
      try {
        const saved = localStorage.getItem('jashpi_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          keyToUse = parsed.developerKey;
        }
      } catch (_e) {}
    }

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, language, context, customApiKey: keyToUse }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      reply: 'Emergency assistance offline. Call 112 or 108 immediately. Keep calm, check breathing, and apply direct pressure if bleeding.',
      source: 'LOCAL_FAILSAFE',
      isAi: false,
    };
  }
}
