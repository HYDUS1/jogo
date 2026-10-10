// Web Audio API emergency sound synthesizer and acoustic distress listener
import {
  enableEmergencyVolumeBoost,
  restoreEmergencyVolume,
  getVolumeState,
  subscribeVolumeState,
  saveNormalVolume,
  speakWithVolumeBoost,
  VolumeState,
} from './volumeManager';

export {
  enableEmergencyVolumeBoost,
  restoreEmergencyVolume,
  getVolumeState,
  subscribeVolumeState,
  saveNormalVolume,
  speakWithVolumeBoost,
};

export type { VolumeState };

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let sirenOscillator1: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let sirenInterval: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Setup master gain & dynamics compressor for anti-clipping maximum volume output
  if (!masterGain && audioCtx) {
    try {
      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
      compressor.knee.setValueAtTime(20, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.15, audioCtx.currentTime);

      masterGain = audioCtx.createGain();
      const state = getVolumeState();
      masterGain.gain.setValueAtTime(state.isBoosted ? 1.0 : state.normalVolume, audioCtx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(audioCtx.destination);
    } catch (_e) {
      if (masterGain) masterGain.connect(audioCtx.destination);
    }
  }

  // Sync master gain with volume manager state
  if (masterGain && audioCtx) {
    const state = getVolumeState();
    const targetGain = state.isBoosted ? 1.0 : state.normalVolume;
    masterGain.gain.setValueAtTime(targetGain, audioCtx.currentTime);
  }

  return audioCtx;
}

export function startEmergencySiren() {
  stopEmergencySiren();
  try {
    const ctx = getAudioContext();
    const destination = masterGain || ctx.destination;

    sirenGain = ctx.createGain();
    // In emergency, siren runs at full power
    sirenGain.gain.setValueAtTime(0.35, ctx.currentTime);
    sirenGain.connect(destination);

    sirenOscillator1 = ctx.createOscillator();
    sirenOscillator1.type = 'sawtooth';
    sirenOscillator1.frequency.setValueAtTime(700, ctx.currentTime);
    sirenOscillator1.connect(sirenGain);
    sirenOscillator1.start();

    let highPitch = false;
    sirenInterval = setInterval(() => {
      if (!sirenOscillator1 || !audioCtx) return;
      const targetFreq = highPitch ? 960 : 650;
      sirenOscillator1.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
      highPitch = !highPitch;
    }, 450);
  } catch (err) {
    console.warn('Audio siren start failed:', err);
  }
}

export function stopEmergencySiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  try {
    if (sirenOscillator1) {
      sirenOscillator1.stop();
      sirenOscillator1.disconnect();
      sirenOscillator1 = null;
    }
    if (sirenGain) {
      sirenGain.disconnect();
      sirenGain = null;
    }
  } catch (_e) {}
}

export function playBeep(freq = 880, durationMs = 120) {
  try {
    const ctx = getAudioContext();
    const destination = masterGain || ctx.destination;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (_e) {}
}

/**
 * High-intensity ascending chime to alert user that Emergency 100% Volume Boost is active
 */
export function playBoostEngagedChime() {
  try {
    const ctx = getAudioContext();
    const freqs = [520, 680, 880, 1100];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        playBeep(freq, 90);
      }, idx * 80);
    });
  } catch (_e) {}
}

/**
 * Calming descending chime to signal Volume Boost has been restored to normal baseline
 */
export function playBoostRestoredChime() {
  try {
    const ctx = getAudioContext();
    const freqs = [880, 660, 440];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        playBeep(freq, 120);
      }, idx * 100);
    });
  } catch (_e) {}
}

export function speakVoiceFeedback(text: string, lang = 'en-IN') {
  speakWithVolumeBoost(text, lang);
}

