import React from 'react';
import {
  PhoneCall,
  X,
  Phone,
  ShieldAlert,
  HeartPulse,
  Flame,
  UserCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { EmergencyContact } from '../types';

interface RealEmergencyDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  language?: string;
  isDarkMode?: boolean;
}

export const RealEmergencyDialerModal: React.FC<RealEmergencyDialerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  language = 'en',
  isDarkMode = true,
}) => {
  if (!isOpen) return null;

  const isHi = language.startsWith('hi');
  const primaryContact = contacts.find((c) => c.callEnabled) || contacts[0];

  const nationalHelplines = [
    {
      number: '112',
      name: isHi ? '112 राष्ट्रीय आपातकाल (पुलिस/सभी)' : '112 National Emergency (Police & All)',
      desc: isHi ? 'अखिल भारतीय एकीकृत पुलिस और सुरक्षा सहायता' : 'All-in-one emergency response system (ERSS)',
      color: 'bg-rose-600 hover:bg-rose-500 text-white',
      border: 'border-rose-500/40',
      icon: ShieldAlert,
    },
    {
      number: '108',
      name: isHi ? '108 एम्बुलेंस व चिकित्सा आपातकाल' : '108 Ambulance & Medical Trauma',
      desc: isHi ? '24/7 निःशुल्क आपातकालीन एम्बुलेंस व ट्रॉमा सेवा' : '24/7 Free emergency medical & ambulance service',
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      border: 'border-emerald-500/40',
      icon: HeartPulse,
    },
    {
      number: '1091',
      name: isHi ? '1091 महिला सुरक्षा हेल्पलाइन' : '1091 Women Safety Helpline',
      desc: isHi ? 'महिलाओं की सुरक्षा व त्वरित संकट निवारण दल' : 'Immediate distress and protection dispatch for women',
      color: 'bg-purple-600 hover:bg-purple-500 text-white',
      border: 'border-purple-500/40',
      icon: AlertTriangle,
    },
    {
      number: '101',
      name: isHi ? '101 दमकल सेवा (फायर ब्रिगेड)' : '101 Fire Brigade Services',
      desc: isHi ? 'आग, गैस रिसाव या भवन ढहने पर त्वरित दल' : 'Immediate fire rescue and disaster evacuation',
      color: 'bg-amber-600 hover:bg-amber-500 text-white',
      border: 'border-amber-500/40',
      icon: Flame,
    },
    {
      number: '1930',
      name: isHi ? '1930 साइबर वित्तीय धोखाधड़ी सेल' : '1930 National Cyber Fraud Helpline',
      desc: isHi ? 'बैंक फ्रॉड, यूपीआई स्कैम तुरंत फ्रीज करवाएं' : 'Freeze illicit bank/UPI transactions immediately',
      color: 'bg-cyan-600 hover:bg-cyan-500 text-black',
      border: 'border-cyan-500/40',
      icon: ExternalLink,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-3xl border-2 shadow-2xl overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#150a24] border-[#00F3FF]/40 text-slate-100'
            : 'bg-white border-blue-500/30 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isHi ? '⚡ वास्तविक 1-टच इमरजेंसी डायलर' : '⚡ Real 1-Touch Emergency Dialer'}
              </h2>
              <p className="text-xs text-rose-300 font-semibold mt-0.5">
                {isHi ? 'असली फोन कॉल — एक क्लिक में तुरंत कॉल लगाएं' : 'Real Cellular Calling — Instant Direct Connection'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Primary Contact Real Direct Call Card */}
          {primaryContact && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border-2 border-blue-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-300 flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isHi ? 'प्राथमिक परिवार संपर्क' : 'PRIMARY FAMILY CONTACT'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  REAL DIRECT CALL
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="text-base font-extrabold text-white">{primaryContact.name}</h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">{primaryContact.phone}</p>
                </div>

                <a
                  href={`tel:${primaryContact.phone}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>{isHi ? 'कॉल लगाएं' : 'Call Now'}</span>
                </a>
              </div>
            </div>
          )}

          {/* National Dials */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isHi ? 'सरकारी आपातकालीन नंबर (निःशुल्क)' : 'National Emergency Hotlines (Toll-Free)'}
            </h4>

            {nationalHelplines.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.number}
                  className={`p-3.5 rounded-2xl bg-black/40 border ${item.border} flex items-center justify-between gap-3 hover:bg-black/60 transition-all`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-white font-mono">{item.number}</span>
                        <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${item.number}`}
                    className={`px-4 py-2 rounded-xl font-black text-xs shrink-0 flex items-center space-x-1.5 cursor-pointer shadow transition-transform active:scale-95 ${item.color}`}
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>{isHi ? 'डायल' : 'Dial'}</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealEmergencyDialerModal;
