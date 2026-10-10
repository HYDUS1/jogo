// JASHPI Automated Emergency Volume-Boost Manager
// Forces media and voice guidance volume to 100% during active emergency events,
// then cleanly restores pre-emergency baseline volume afterwards.

export interface VolumeState {
  isBoosted: boolean;
  currentVolume: number; // 0.0 to 1.0
  normalVolume: number;  // 0.0 to 1.0
  lastVoiceUpdate: string;
  boostTimestamp: number | null;
}

const STORAGE_KEY_NORMAL_VOLUME = 'jashpi_normal_volume';
const DEFAULT_NORMAL_VOLUME = 0.65; // 65% normal media volume

let isBoosted = false;
let savedPreEmergencyVolume = DEFAULT_NORMAL_VOLUME;
let lastVoiceUpdateText = '';
let boostTimestamp: number | null = null;

const listeners = new Set<(state: VolumeState) => void>();

// Load saved preferred normal media volume
export function getSavedNormalVolume(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_NORMAL_VOLUME);
    if (val !== null) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 1.0) {
        return parsed;
      }
    }
  } catch (_e) {}
  return DEFAULT_NORMAL_VOLUME;
}

export function saveNormalVolume(vol: number): void {
  const clamped = Math.max(0.1, Math.min(1.0, vol));
  try {
    localStorage.setItem(STORAGE_KEY_NORMAL_VOLUME, clamped.toFixed(2));
  } catch (_e) {}
  if (!isBoosted) {
    savedPreEmergencyVolume = clamped;
  }
  notifyListeners();
}

export function getVolumeState(): VolumeState {
  return {
    isBoosted,
    currentVolume: isBoosted ? 1.0 : getSavedNormalVolume(),
    normalVolume: getSavedNormalVolume(),
    lastVoiceUpdate: lastVoiceUpdateText,
    boostTimestamp,
  };
}

export function subscribeVolumeState(callback: (state: VolumeState) => void): () => void {
  listeners.add(callback);
  callback(getVolumeState());
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners() {
  const state = getVolumeState();
  listeners.forEach((cb) => {
    try {
      cb(state);
    } catch (_e) {}
  });
}

/**
 * Temporarily forces device media volume and speech synthesis to 100%
 * for the duration of the active emergency event.
 */
export function enableEmergencyVolumeBoost(reason: string = 'ACTIVE_EMERGENCY'): void {
  if (!isBoosted) {
    savedPreEmergencyVolume = getSavedNormalVolume();
  }
  isBoosted = true;
  boostTimestamp = Date.now();

  // 1. Boost all HTMLMediaElement audio & video elements currently in the document
  try {
    const mediaElements = document.querySelectorAll<HTMLMediaElement>('audio, video');
    mediaElements.forEach((el) => {
      if (!el.dataset.preEmergencyVolume) {
        el.dataset.preEmergencyVolume = String(el.volume);
      }
      el.volume = 1.0;
      el.muted = false;
    });
  } catch (_e) {}

  notifyListeners();
  console.log(`[JASHPI Audio Engine] 🔊 100% Volume Boost ACTIVATED (${reason}). Pre-emergency baseline: ${Math.round(savedPreEmergencyVolume * 100)}%`);
}

/**
 * Restores device media volume back to the pre-emergency baseline level.
 */
export function restoreEmergencyVolume(): void {
  if (!isBoosted) return;

  const restoredVol = savedPreEmergencyVolume;
  isBoosted = false;
  boostTimestamp = null;

  // 1. Restore HTMLMediaElements to their pre-emergency volumes
  try {
    const mediaElements = document.querySelectorAll<HTMLMediaElement>('audio, video');
    mediaElements.forEach((el) => {
      const prev = el.dataset.preEmergencyVolume;
      if (prev !== undefined) {
        const parsed = parseFloat(prev);
        if (!isNaN(parsed)) {
          el.volume = Math.max(0.0, Math.min(1.0, parsed));
        }
        delete el.dataset.preEmergencyVolume;
      } else {
        el.volume = restoredVol;
      }
    });
  } catch (_e) {}

  notifyListeners();
  console.log(`[JASHPI Audio Engine] 🔉 Emergency Volume Boost RESTORED to normal baseline (${Math.round(restoredVol * 100)}%)`);
}

/**
 * Speaks voice guidance updates with guaranteed volume boost during emergencies.
 * If volume boost is active, utterance volume is forced to 1.0 (100%).
 * If normal, it uses the user's preferred normal volume.
 */
export function speakWithVolumeBoost(text: string, lang = 'en-IN', forceBoost = false): void {
  if (!('speechSynthesis' in window)) return;

  lastVoiceUpdateText = text;
  notifyListeners();

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Force 100% (1.0) volume during active emergency or when forceBoost is requested
    if (isBoosted || forceBoost) {
      utterance.volume = 1.0; // 100% maximum media output
      utterance.rate = 1.02;  // Slightly urgent, crisp diction
      utterance.pitch = 1.08; // Slightly elevated pitch cuts through ambient noise
    } else {
      utterance.volume = getSavedNormalVolume();
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[JASHPI Voice Output] Speech synthesis failed:', err);
  }
}
