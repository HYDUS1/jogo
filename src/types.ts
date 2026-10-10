export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  callEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
}

export interface EmergencyEvent {
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
}

export interface FusionDecision {
  riskScore: number;
  emergencyType: string;
  confidence: number;
  recommendedAction: 'IMMEDIATE_SOS' | 'COUNTDOWN_CONFIRMATION' | 'MONITORING' | 'CANCEL';
}

export interface SensorStatus {
  motionAvailable: boolean;
  accelX: number;
  accelY: number;
  accelZ: number;
  magnitude: number;
  speechSupported: boolean;
  micActive: boolean;
  audioDistressSupported: boolean;
  batteryLevel: number | null;
  isCharging: boolean;
  networkOnline: boolean;
}

export interface SafetyCheckConfig {
  active: boolean;
  deadlineTimestamp: number | null;
  durationMinutes: number;
  checkInStatus: 'IDLE' | 'PENDING_CONFIRMATION' | 'ESCALATING';
  modeType: 'CHECK_IN' | 'TRAVEL_PROTECTION';
}
