// JASHPI Emergency PWA Controller
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

const sosBtn = document.getElementById('sos-btn');
const callPrimaryBtn = document.getElementById('call-primary-btn');
const batteryStatusEl = document.getElementById('battery-status');

if (navigator.getBattery) {
  navigator.getBattery().then((battery) => {
    batteryStatusEl.textContent = `${Math.round(battery.level * 100)}% ${battery.charging ? '⚡' : ''}`;
  });
} else {
  batteryStatusEl.textContent = 'Normal';
}

function triggerEmergency(source = 'MANUAL_SOS') {
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
  const eventId = 'evt_' + Date.now();
  console.log('[JASHPI] Triggering Emergency event:', eventId, source);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          triggerType: source,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
      }).catch(console.error);
    }, () => {
      fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, triggerType: source })
      }).catch(console.error);
    });
  }

  // Initiate call to primary emergency contact
  window.location.href = 'tel:112';
}

sosBtn.addEventListener('click', () => triggerEmergency('MANUAL_SOS'));
callPrimaryBtn.addEventListener('click', () => window.location.href = 'tel:112');

// Hands-free Voice recognition in web browser
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  recognition.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript.toLowerCase();
      if (text.includes('bachao') || text.includes('help me') || text.includes('emergency')) {
        triggerEmergency('VOICE_HANDS_FREE');
      }
    }
  };

  recognition.onend = () => {
    try { recognition.start(); } catch (_) {}
  };

  try { recognition.start(); } catch (_) {}
}
