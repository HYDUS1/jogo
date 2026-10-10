// Hardware Torch (Flashlight) controller with screen strobe fallback

let mediaStream: MediaStream | null = null;
let videoTrack: MediaStreamTrack | null = null;
let isTorchActive = false;
let listeners: Array<(active: boolean) => void> = [];

export function subscribeTorchState(cb: (active: boolean) => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function notifyListeners(active: boolean) {
  isTorchActive = active;
  listeners.forEach((cb) => cb(active));
}

export async function toggleFlashlight(forceState?: boolean): Promise<boolean> {
  const target = forceState !== undefined ? forceState : !isTorchActive;

  if (!target) {
    // Turn off
    try {
      if (videoTrack) {
        await (videoTrack as any).applyConstraints({ advanced: [{ torch: false }] });
        videoTrack.stop();
        videoTrack = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
    } catch (_e) {}
    notifyListeners(false);
    return false;
  }

  // Turn on
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities?.() || {};
        if (capabilities.torch) {
          await (videoTrack as any).applyConstraints({ advanced: [{ torch: true }] });
          notifyListeners(true);
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[JASHPI Torch] Hardware camera torch not available:', err);
  }

  // Fallback: screen torch mode
  notifyListeners(true);
  return true;
}

export function isTorchOn(): boolean {
  return isTorchActive;
}
