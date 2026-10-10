import React, { useState, useEffect } from 'react';
import { PhoneCall, Share2, MessageSquare, MapPin, XCircle, Volume2, ShieldCheck, HelpCircle, Radio, WifiOff, VolumeX, Mic, Activity } from 'lucide-react';
import { EmergencyEvent, EmergencyContact } from '../types';
import { NearbyPeer } from '../services/nearbyMesh';
import { getVolumeState, subscribeVolumeState, VolumeState, speakVoiceFeedback } from '../services/audioSiren';

interface ActiveEmergencyOverlayProps {
  event: EmergencyEvent | null;
  contacts: EmergencyContact[];
  onCancel: () => void;
  isTestMode?: boolean;
  meshPeers?: NearbyPeer[];
  language?: string;
}

export const ActiveEmergencyOverlay: React.FC<ActiveEmergencyOverlayProps> = ({
  event,
  contacts,
  onCancel,
  isTestMode = false,
  meshPeers = [],
  language = 'en',
}) => {
  const [triageStep, setTriageStep] = useState<number>(0);
  const [userInjured, setUserInjured] = useState<boolean | null>(null);
  const [volState, setVolState] = useState<VolumeState>(getVolumeState());
  const isHi = language === 'hi';

  useEffect(() => {
    return subscribeVolumeState((state) => setVolState(state));
  }, []);

  if (!event) return null;

  const primaryContact = contacts.find((c) => c.callEnabled && c.phone) || contacts[0] || {
    name: 'National Emergency',
    phone: '112',
  };

  const triggerManualVoiceUpdate = () => {
    const text = isHi
      ? `आपातकालीन स्थिति: लाइव GPS ट्रैकिंग सक्रिय है। 112 और संपर्कों को अलर्ट भेजा जा चुका है। 100% लाउड वॉल्यूम पर घोषणा की जा रही है।`
      : `Emergency status: Live GPS tracking is active. Alerts sent to 112 and family. Voice guidance broadcasting at 100% volume boost.`;
    speakVoiceFeedback(text, isHi ? 'hi-IN' : 'en-IN');
  };

  const mapsLink = event.latitude && event.longitude
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
    : 'https://maps.google.com';

  const defaultMessage = `🚨 JASHPI EMERGENCY ALERT 🚨
Trigger: ${event.triggerType}
Emergency: ${event.emergencyType}
Status: Immediate Assistance Required
Location: ${mapsLink}
Accuracy: ${event.accuracy ? Math.round(event.accuracy) + 'm' : 'Acquiring GPS'}
Battery: ${event.battery ?? 80}%`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultMessage)}`;
  const smsUrl = `sms:${primaryContact.phone}?body=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#080810]/95 backdrop-blur-md flex flex-col p-4 overflow-y-auto animate-fade-in border-4 border-red-600/70">
      {/* Header alert banner */}
      <div className="flex items-center justify-between pb-3 border-b border-red-500/30">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
          <h2 className="text-xl font-black text-red-500 tracking-wider">
            {isTestMode ? 'TEST EMERGENCY SIMULATION' : '🚨 EMERGENCY RESPONSE ACTIVE'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 border border-slate-600 cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-red-400" />
          <span>STOP & CANCEL</span>
        </button>
      </div>

      {/* Main warning card */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-950/60 to-purple-950/60 border border-red-500/40">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded bg-red-600 text-white">
              {event.emergencyType}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Trigger Source: <span className="text-[#00F3FF]">{event.triggerType}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Live broadcast initiated. Tracking beacon is updating your coordinates.
            </p>
          </div>
          <Volume2 className="w-8 h-8 text-red-400 animate-pulse" />
        </div>

        {/* Location coordinates */}
        <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <MapPin className="w-4 h-4 text-[#00F3FF] shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 font-mono">
                {event.latitude && event.longitude
                  ? `${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)} (±${Math.round(event.accuracy || 10)}m)`
                  : 'Acquiring GPS fix...'}
              </span>
            </div>
          </div>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#00F3FF] hover:underline font-bold shrink-0 ml-2"
          >
            Open Map ↗
          </a>
        </div>
      </div>

      {/* AUTOMATED 100% EMERGENCY VOLUME-BOOST FEATURE CARD */}
      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-red-950/60 to-purple-950/70 border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  {isHi ? '🔊 100% आपातकालीन वॉल्यूम-बूस्ट सक्रिय' : '🔊 100% EMERGENCY VOLUME-BOOST ACTIVE'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-mono font-bold animate-pulse">
                  MAX 100%
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 font-medium">
                {isHi
                  ? `आवाज साफ सुनाई दे इसलिए वॉल्यूम 100% किया गया है। इमरजेंसी समाप्त होते ही यह वापस ${Math.round(volState.normalVolume * 100)}% हो जाएगा।`
                  : `Media volume temporarily forced to 100% so voice-guided updates are audible. Restores to ${Math.round(volState.normalVolume * 100)}% after.`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Visual audio equalizer bars */}
            <div className="flex items-end space-x-1 h-6 px-2 py-1 rounded bg-black/60 border border-amber-500/30">
              <div className="w-1 bg-amber-400 h-3 animate-pulse" />
              <div className="w-1 bg-amber-300 h-5 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 bg-amber-400 h-2 animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="w-1 bg-amber-300 h-4 animate-pulse" style={{ animationDelay: '450ms' }} />
              <div className="w-1 bg-amber-400 h-6 animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>

            <button
              onClick={triggerManualVoiceUpdate}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] cursor-pointer flex items-center space-x-1 shadow transition-transform active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'आवाज में सुनें' : 'Announce Status'}</span>
            </button>
          </div>
        </div>

        {/* Live Voice Status Transcript */}
        <div className="p-2 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2 truncate">
            <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
            <span className="text-slate-400 truncate">
              <strong className="text-white">{isHi ? 'लाइव वॉयस अपडेट:' : 'Voice Update:'}</strong>{' '}
              {volState.lastVoiceUpdate || (isHi ? 'इमरजेंसी ब्रॉडकास्ट सक्रिय है, GPS निर्देशांक भेजे जा रहे हैं।' : 'Emergency broadcast active. GPS coordinates dispatched.')}
            </span>
          </div>
          <span className="text-[10px] text-amber-300/80 font-mono shrink-0 ml-2">
            {volState.isBoosted ? 'BOOST: ON' : 'BOOST: OFF'}
          </span>
        </div>
      </div>

      {/* Offline Peer Mesh Alert Card (5 Nearest JASHPI Users) */}
      {meshPeers && meshPeers.length > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-purple-950/40 border-2 border-purple-500/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-300 font-extrabold text-xs">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>OFFLINE MESH: 5 NEAREST JASHPI PEERS ALERTED</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-mono">
              BLE & P2P RADIO
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            No internet required: High-priority local radio distress beacon broadcasted to 5 registered community peers in your direct vicinity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {meshPeers.map((peer) => (
              <div
                key={peer.id}
                className="p-2 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between text-[10px]"
              >
                <div>
                  <div className="font-bold text-white">{peer.name}</div>
                  <div className="text-slate-400 font-mono">Est. Distance: {peer.distanceMeters}m ({peer.signalDbm} dBm)</div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                  {peer.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Direct Call */}
        <a
          href={`tel:${primaryContact.phone}`}
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white flex flex-col items-center justify-center text-center shadow-lg font-bold transition-transform active:scale-95"
        >
          <PhoneCall className="w-6 h-6 mb-1" />
          <span className="text-sm">Call Primary Contact</span>
          <span className="text-xs text-emerald-200 mt-0.5">{primaryContact.name} ({primaryContact.phone})</span>
        </a>

        {/* WhatsApp Share */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white flex flex-col items-center justify-center text-center shadow-lg font-bold transition-transform active:scale-95"
        >
          <Share2 className="w-6 h-6 mb-1" />
          <span className="text-sm">WhatsApp SOS Alert</span>
          <span className="text-xs text-emerald-200 mt-0.5">Broadcast to Family & Groups</span>
        </a>

        {/* SMS Broadcast */}
        <a
          href={smsUrl}
          className="p-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white flex flex-col items-center justify-center text-center shadow-lg font-bold transition-transform active:scale-95"
        >
          <MessageSquare className="w-6 h-6 mb-1" />
          <span className="text-sm">Send SMS Distress</span>
          <span className="text-xs text-blue-200 mt-0.5">Offline GSM SMS to 112 / Contacts</span>
        </a>
      </div>

      {/* AI Emergency Triage Check */}
      <div className="mt-4 p-3.5 rounded-xl bg-[#1A0B2E] border border-cyan-500/30">
        <div className="flex items-center space-x-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#00F3FF]" />
          <h4 className="text-xs font-bold text-[#00F3FF] uppercase tracking-wider">
            JASHPI Instant Medical Triage
          </h4>
        </div>

        {triageStep === 0 && (
          <div className="text-xs text-slate-200">
            <p className="mb-2">Are you or anyone near you bleeding or injured?</p>
            <div className="flex space-x-2">
              <button
                onClick={() => { setUserInjured(true); setTriageStep(1); }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Yes, Injured / Bleeding
              </button>
              <button
                onClick={() => { setUserInjured(false); setTriageStep(1); }}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
              >
                No Injuries / Safe
              </button>
            </div>
          </div>
        )}

        {triageStep === 1 && (
          <div className="text-xs text-slate-200">
            {userInjured ? (
              <div className="p-2.5 rounded bg-red-950/40 border border-red-500/30 text-rose-200">
                <p className="font-bold">⚠️ Hemorrhage Protocol:</p>
                <p>Apply firm continuous pressure with clean cloth. Elevate injured limb if possible. Keep airway open and call 108 immediately.</p>
              </div>
            ) : (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                <p className="font-bold">✅ Scene Safety Confirmed:</p>
                <p>Move away from active roadway or fire hazards. Remain on line with emergency contacts.</p>
              </div>
            )}
            <button
              onClick={() => setTriageStep(0)}
              className="mt-2 text-[11px] text-[#00F3FF] underline cursor-pointer"
            >
              Reset Triage
            </button>
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="mt-4 p-2.5 rounded-lg bg-black/40 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Critical Safety Rule: JASHPI provides emergency assistance and coordinates communications. For life-threatening emergencies, always dial <b>112</b> or <b>108</b> directly.
        </p>
      </div>
    </div>
  );
};
