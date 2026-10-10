# JASHPI — Hands-Free Emergency Response Platform

> **Full Form:** Joint Alert & Support for Health and Personal Emergencies  
> **Tagline:** *Ek Tap, Ek Saans, Ek Zindagi*  
> **Core Principle:** When a person cannot reach or touch their phone, JASHPI can still detect distress and initiate emergency response workflows.

---

## 1. System Overview & Three-Layer Architecture

JASHPI combines AI acoustic intelligence, speech recognition, multi-sensor fusion, geolocation broadcasting, and resilient telephony channels into a single emergency assistance platform.

```
                              ┌──────────────────────────────────┐
                              │          USER DISTRESS           │
                              │ (Hands-free voice / Fall / Crash)│
                              └─────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    ┌───────────────────────────┐                                 ┌───────────────────────────┐
    │  MODULE 1: ANDROID NATIVE │                                 │   MODULE 2: MOBILE PWA    │
    │        SAFETY ENGINE      │                                 │     (CYBER-EMERGENCY)     │
    │ • WakeWordService (Fg)    │                                 │ • Web Speech API Engine   │
    │ • Fall & Crash Detectors  │                                 │ • DeviceMotion Fall Fusion│
    │ • Telephony (CALL_PHONE)  │                                 │ • Audio Metronome for CPR │
    │ • SMS Dispatch Engine     │                                 │ • Gemini AI First-Aid Bot │
    │ • Room Local Database     │                                 │ • Offline Service Worker  │
    └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                  │                                                             │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │     MODULE 3: NODE.JS     │
                                   │      BACKEND SERVICE      │
                                   │ • /api/emergency Relay    │
                                   │ • Telegram Bot Dispatch   │
                                   │ • Idempotent Queue Sync   │
                                   │ • Gemini AI API Proxy     │
                                   │ • Live Location Tracker   │
                                   └───────────────────────────┘
```

---

## 2. Directory Structure

```text
JASHPI/
│
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/jashpi/
│   │           ├── MainActivity.kt
│   │           ├── WakeWordService.kt
│   │           ├── EmergencyManager.kt
│   │           ├── VoiceTriggerEngine.kt
│   │           ├── FallDetector.kt
│   │           ├── AccidentDetector.kt
│   │           ├── AcousticDetector.kt
│   │           ├── SensorFusionEngine.kt
│   │           ├── LocationManager.kt
│   │           ├── CommunicationManager.kt
│   │           ├── ContactManager.kt
│   │           ├── EmergencyDatabase.kt
│   │           ├── NotificationManager.kt
│   │           ├── BootReceiver.kt
│   │           └── BatteryManager.kt
│   ├── build.gradle
│   └── settings.gradle
│
├── pwa/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.json
│   └── sw.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── src/                          # Full-Stack Interactive Web Application
│   ├── App.tsx                   # Main Cyber-Emergency Dashboard
│   ├── types.ts                  # Shared Type Contracts
│   ├── services/
│   │   ├── speech.ts             # Web Speech Hands-Free Wake & Panic Engine
│   │   ├── audioSiren.ts         # Web Audio API Siren & CPR Metronome
│   │   └── emergencyApi.ts       # Backend & Offline Event Queue Client
│   └── components/
│       ├── SosButton.tsx         # Glowing SOS with Cancellation Ring
│       ├── ActiveEmergencyOverlay.tsx # Heads-up Emergency Screen
│       ├── DiagnosticsModal.tsx  # Developer Diagnostics & Test Mode
│       ├── AskJashpiModal.tsx    # Gemini AI Emergency & CPR Assistant
│       ├── ContactsModal.tsx     # Emergency Contact Manager
│       ├── GuidesModal.tsx       # Offline First-Aid & CPR Guides
│       └── SafetyModeModal.tsx   # Check-In & Travel Protection
│
├── server.ts                     # Full-Stack Dev & Production Express Server
├── index.html                    # PWA HTML Entry Point
├── metadata.json                 # AI Studio Configuration
├── package.json
└── README.md
```

---

## 3. Native Android Safety Engine

### Prerequisites
- **Android Studio:** Hedgehog (2023.1.1) or newer
- **JDK Version:** Java 17 (Eclipse Temurin 17 or OpenJDK 17)
- **Android SDK:**
  - `compileSdk`: 34
  - `minSdk`: 28 (Android 9 Pie)
  - `targetSdk`: 34 (Android 14)

### Building the Android App
1. Open Android Studio.
2. Select **File > Open** and choose the `android/` directory.
3. Allow Gradle to synchronize dependencies:
   - Kotlin Coroutines & Room Database (`androidx.room`)
   - Google Play Services Location (`play-services-location`)
   - OkHttp (`com.squareup.okhttp3:okhttp`)
4. Build APK:
   ```bash
   ./gradlew assembleDebug
   ```
5. Install onto your physical device:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Android Permissions & Manifest Breakdown
| Permission | Purpose |
|------------|---------|
| `RECORD_AUDIO` | Continuous wake-phrase detection ("Hello Jashpi") and acoustic distress analysis |
| `ACCESS_FINE_LOCATION` | Pinpointing user's GPS coordinates for 112 / SMS / Telegram dispatch |
| `FOREGROUND_SERVICE` | Keeping the safety engine alive when the phone screen is locked |
| `FOREGROUND_SERVICE_MICROPHONE` | Android 14 requirement for background microphone listening |
| `FOREGROUND_SERVICE_LOCATION` | Continuous live tracking broadcast during active emergency |
| `CALL_PHONE` | Direct phone call initiation without requiring the user to press a button |
| `SEND_SMS` | Dispatching offline cellular SMS to configured emergency contacts |
| `POST_NOTIFICATIONS` | Urgent emergency alerts with cancel actions |
| `RECEIVE_BOOT_COMPLETED` | Auto-starting protection on device reboot (`BootReceiver.kt`) |

---

## 4. Hands-Free Voice Response & Wake Words

JASHPI listens for emergency voice phrases hands-free in **English, Hindi, and Hinglish**:

1. **Wake Phrase:**
   - `"Hello Jashpi"` → JASHPI answers: *"Yes, I'm listening. What is your emergency?"*
2. **Direct Emergency Commands:**
   - `Help` / `Help me` / `Madad karo`
   - `Bachao` / `Bachao mujhe`
   - `Accident ho gaya` / `I had an accident`
   - `Call my family` / `Call emergency contact`
   - `Send my location`
   - `Medical emergency` / `Ambulance` / `Police` / `Fire`
3. **Panic Burst Trigger:**
   - Repeating `"Bachao"` or `"Help"` **3 times within 10 seconds** triggers an instant high-priority emergency.
4. **Voice Cancellation:**
   - Saying `"Cancel"`, `"I'm OK"`, or `"Stop"` immediately aborts the emergency countdown.

---

## 5. Backend & Telegram Configuration

### Environment Variables (`.env`)
```bash
PORT=3000
NODE_ENV=production

# Gemini AI API Key (automatically injected in AI Studio or configured manually)
GEMINI_API_KEY="your_gemini_api_key"

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Target Telegram Chat ID / Channel ID
DEFAULT_TELEGRAM_CHAT_ID="your_telegram_chat_id"
```

### Setting Up the Telegram Relay
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the instructions to get your `TELEGRAM_BOT_TOKEN`.
3. Start a chat with your bot or add it to an emergency family group.
4. Obtain your numeric Chat ID:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
5. Place the token and chat ID in `.env`. When an emergency triggers, JASHPI sends:
   - User Name & Emergency Type
   - Trigger Source & Confidence %
   - Google Maps live location link
   - Precise GPS coordinates pinpoint

---

## 6. Testing & Diagnostic Scenarios

Open the in-app **Developer Diagnostics & Test Mode** screen (`Cpu` icon):

1. **Scenario 1 — Manual SOS (Highest Priority):**
   - Tap the central glowing SOS button.
   - Siren sounds, coordinates lock, direct call to primary contact initiates.
2. **Scenario 2 — Voice Trigger:**
   - Speak clearly into the device: *"Hello Jashpi"* or *"Bachao"*.
   - Observe live voice ticker updating.
3. **Scenario 3 — Panic Burst:**
   - Say: *"Bachao ... Bachao ... Bachao"* within 10 seconds.
   - High-confidence emergency dispatch initiates.
4. **Scenario 4 — False-Alarm Cancellation Countdown:**
   - Trigger a medium-confidence command.
   - Observe the 10-second amber countdown ring.
   - Say *"Cancel"* or tap "Tap to CANCEL" to verify abort.
5. **Scenario 5 — Simulated Fall:**
   - In Diagnostics modal, tap **Simulate Fall (Sensor)**.
   - Freefall (<3.2 m/s²) → Impact (>24 m/s²) → Stillness sequence executes.
6. **Scenario 6 — Offline Resilience:**
   - Disconnect Wi-Fi and mobile data.
   - Trigger SOS: verify local queue storage.
   - Reconnect: verify automatic sync to `/api/events/sync`.

---

## 7. Next-Gen Safety Capabilities & Standout Features

### A. Phone Drop Sensor (5-Second Automated SOS)
- **Continuous Monitoring:** Uses device accelerometer to identify phone slips and freefalls (`< 2.5 m/s²`) followed immediately by sudden ground impact (`> 22.0 m/s²`).
- **5-Second Countdown:** Immediately triggers an urgent 5-second countdown with voice notification:
  > *"Phone drop detected! Automated SOS in 5 seconds. Say cancel or tap screen to stop!"*
- **Auto-Dispatch:** If user is knocked unconscious or unable to reach the phone, SOS automatically dials the primary contact, sounds the alarm, and sends GPS coordinates to all saved numbers.

### B. Illustrated Animated Life-Saving Guides
- **Adult CPR:** Heart rhythm pulse animation with interactive 110 BPM metronome (*Stayin' Alive* cadence).
- **Snake Bite (साँप का काटना):** Visual puncture identification, mandatory limb immobilization below heart level, and strict DOs & DONTs (no cuts, no sucking, no tourniquets).
- **Fire / Aag Lagna (आग लगना व बचाव):** Animated *Stop, Drop & Roll* guide, low smoke crawl evacuation, 20-minute water cooling for burns.
- **Severe Bleeding, Choking, & Electric Shock:** Step-by-step graphical first-aid instructions.

### C. Voice-Controlled Flashlight & Siren
- **Voice Commands:**
  - *"Flashlight on"* / *"Torch on"* / *"Batti jalao"* $\to$ Activates rear camera torch or high-intensity screen strobe.
  - *"Flashlight off"* / *"Torch off"* / *"Batti bujhao"* $\to$ Turns off flashlight.
  - *"Siren on"* / *"Start siren"* / *"Alarm bajao"* $\to$ Sounds multi-frequency alarm oscillator siren.
  - *"Siren off"* / *"Stop siren"* $\to$ Silences alarm.

### D. Stealth Disguise Mode & Fake Call Simulator (Standout Feature)
- **Blackout Screen:** Disguises the phone as completely dead or locked while background microphone, phone-drop sensor, and whisper detection remain 100% active.
- **Triple-Tap Silent Distress:** Tapping the dark screen 3 times silently dispatches live GPS coordinates via SMS / Telegram with zero screen illumination or noise.
- **Fake Escape Call Simulator:** Generates an authentic simulated incoming phone call (from "Papa" or "Inspector Verma") with realistic voice dialogue giving the user a legitimate reason to escape an unsafe situation.

### E. Developer Passphrase & Custom Gemini API Key
- On first launch, user inputs Name & Language.
- Entering the master developer passphrase (`Dev@Master#Jashpi$2026!` or `JASHPI@Dev#Master_99X$Omni`) unlocks the **Developer Lab**:
  - Test custom Google Gemini API keys.
  - Live model testing sandbox (`gemini-3.8-flash`).
  - Fleet simulation triggers for phone drop, crash impact, and low-battery events.

---

## 8. Critical Safety Rule

> **JASHPI is an emergency assistance and dispatch coordination platform.**  
> It does not replace official municipal emergency services (Ambulance 108, Police 100, Unified 112). Emergency communications are explicit, observable, and auditable. JASHPI never falsely claims emergency services were dispatched unless confirmed by the system.
