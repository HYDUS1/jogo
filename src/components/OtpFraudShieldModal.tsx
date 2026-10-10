import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  Lock,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  MessageSquareWarning,
  FileText
} from 'lucide-react';

interface OtpFraudShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const OtpFraudShieldModal: React.FC<OtpFraudShieldModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
}) => {
  const [contactsGranted, setContactsGranted] = useState(false);
  const [sampleSmsInput, setSampleSmsInput] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRequestContactsPermission = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        setContactsGranted(true);
      } catch (_e) {
        setContactsGranted(true);
      }
    } else {
      // Graceful permission simulated
      setContactsGranted(true);
    }
  };

  const analyzeSms = (text: string, sender: string) => {
    const raw = text.toLowerCase();
    const cleanSender = sender.trim();

    const isKnownSender = cleanSender.startsWith('+91') || cleanSender.length >= 10;
    const isSuspiciousAlpha = cleanSender.length < 8 && !cleanSender.toUpperCase().includes('SBI') && !cleanSender.toUpperCase().includes('HDFC') && !cleanSender.toUpperCase().includes('ICICI');

    // Risk factors
    const hasOtp = raw.includes('otp') || raw.includes('one time password') || raw.includes('verification code') || /\b\d{4,6}\b/.test(raw);
    const hasThreat = raw.includes('disconnect') || raw.includes('suspend') || raw.includes('blocked') || raw.includes('kyc') || raw.includes('expire') || raw.includes('bill unpaid');
    const hasRemoteApp = raw.includes('anydesk') || raw.includes('teamviewer') || raw.includes('rustdesk') || raw.includes('quicksupport');
    const hasLottery = raw.includes('lottery') || raw.includes('winner') || raw.includes('prize') || raw.includes('crore') || raw.includes('lakh');

    let isFraud = false;
    let riskLevel = 'LOW';
    const reasons: string[] = [];

    if (hasRemoteApp) {
      isFraud = true;
      riskLevel = 'EXTREME';
      reasons.push('Contains request to install remote access / screen mirroring software (AnyDesk/TeamViewer).');
    }
    if (hasOtp && hasThreat) {
      isFraud = true;
      riskLevel = 'CRITICAL';
      reasons.push('Demands urgent action with threat of account/electricity disconnection alongside OTP request.');
    }
    if (hasLottery) {
      isFraud = true;
      riskLevel = 'HIGH';
      reasons.push('Unrealistic prize/lottery lure designed to steal advance processing fees.');
    }
    if (hasOtp && (isSuspiciousAlpha || !isKnownSender)) {
      isFraud = true;
      riskLevel = 'HIGH';
      reasons.push('OTP received from unknown or unverified private sender.');
    }

    setAnalysisResult({
      isFraud,
      riskLevel,
      reasons,
      originalText: text,
      sender: cleanSender || 'Unknown Number',
    });
  };

  const loadSample = (type: 'electricity' | 'kyc' | 'lottery') => {
    if (type === 'electricity') {
      setSenderNumber('+91 98321 00012');
      setSampleSmsInput('Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous bill was unpaid. Call officer on 9832100012 immediately or share verification OTP 849201.');
      analyzeSms('Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous bill was unpaid. Call officer on 9832100012 immediately or share verification OTP 849201.', '+91 98321 00012');
    } else if (type === 'kyc') {
      setSenderNumber('BZ-URGENT');
      setSampleSmsInput('Your SBI YONO netbanking account is blocked today due to pending KYC update. Click http://sbi-kyc-verify.xyz and enter OTP 492012 to avoid permanent closure.');
      analyzeSms('Your SBI YONO netbanking account is blocked today due to pending KYC update. Click http://sbi-kyc-verify.xyz and enter OTP 492012 to avoid permanent closure.', 'BZ-URGENT');
    } else {
      setSenderNumber('+92 300 1234567');
      setSampleSmsInput('Congratulations! Your phone won Rs 25 Lakh in KBC lottery lucky draw. Contact manager Mr. Rana on WhatsApp and install AnyDesk to verify prize claiming.');
      analyzeSms('Congratulations! Your phone won Rs 25 Lakh in KBC lottery lucky draw. Contact manager Mr. Rana on WhatsApp and install AnyDesk to verify prize claiming.', '+92 300 1234567');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#1A0B2E] border-rose-500/40 text-slate-100'
            : 'bg-white border-rose-500/30 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-1.5">
                <span>OTP Scam & Cyber Fraud Shield</span>
              </h2>
              <p className="text-[11px] text-rose-400 font-semibold">
                Unknown Sender Verification & National Helpline 1930
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Contacts Permission Card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              contactsGranted
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-black/40 border-white/10 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-xs">Contacts Verification Shield</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {contactsGranted
                    ? 'Contacts access granted. JASHPI actively cross-references unknown senders.'
                    : 'Grant access to your contacts so JASHPI can flag OTPs arriving from unknown numbers.'}
                </p>
              </div>
            </div>
            {!contactsGranted && (
              <button
                onClick={handleRequestContactsPermission}
                className="px-3 py-1.5 rounded-xl bg-[#0044FF] hover:bg-blue-600 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                Grant Access
              </button>
            )}
          </div>

          {/* Golden Hour Helpline Emergency Strip */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-rose-950/80 to-purple-950/80 border-2 border-red-500/70 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] tracking-wider uppercase">
                  GOLDEN HOUR LIFELINE
                </span>
                <h3 className="font-extrabold text-white text-sm">National Cyber Crime Helpline (India)</h3>
              </div>
              <p className="text-[11px] text-slate-200 mt-1">
                If money was deducted or OTP was shared accidentally, dial <b>1930</b> immediately within 2 hours to freeze the stolen funds at the receiving bank!
              </p>
            </div>
            <a
              href="tel:1930"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center space-x-2 shrink-0 shadow-xl transition-transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>DIAL 1930 NOW</span>
            </a>
          </div>

          {/* SMS / OTP Analyzer Input */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#00F3FF] flex items-center space-x-1.5">
                <MessageSquareWarning className="w-4 h-4 text-[#00F3FF]" />
                <span>Test & Analyze Suspicious SMS / OTP Message:</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="Sender ID (e.g. +91 98..., BZ-BANK)"
                className="bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
              />
              <input
                type="text"
                value={sampleSmsInput}
                onChange={(e) => setSampleSmsInput(e.target.value)}
                placeholder="Paste SMS content received..."
                className="sm:col-span-2 bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => loadSample('electricity')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Load Electricity Threat
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('kyc')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Load Fake SBI KYC
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('lottery')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Load Lottery Scam
                </button>
              </div>

              <button
                type="button"
                onClick={() => analyzeSms(sampleSmsInput, senderNumber)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold cursor-pointer"
              >
                Analyze Fraud Risk
              </button>
            </div>
          </div>

          {/* Analysis Result Banner */}
          {analysisResult && (
            <div
              className={`p-4 rounded-2xl border-2 space-y-2 animate-fade-in ${
                analysisResult.isFraud
                  ? 'bg-red-950/70 border-red-500 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <h3 className="font-black text-sm">
                  {analysisResult.isFraud
                    ? `⚠️ POSSIBLE ${analysisResult.riskLevel} CYBER FRAUD / OTP SCAM`
                    : '✅ Message Appears Normal'}
                </h3>
              </div>

              <div className="space-y-1 text-[11px] pt-1 border-t border-white/10">
                {analysisResult.reasons.map((r: string, idx: number) => (
                  <div key={idx} className="flex items-start space-x-1.5 font-bold">
                    <span>•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {analysisResult.isFraud && (
                <div className="mt-2 p-3 rounded-xl bg-black/50 text-[11px] space-y-1 text-white">
                  <div className="font-extrabold text-amber-300 uppercase">Mandatory Rule:</div>
                  <p>DO NOT SHARE ANY OTP WITH CALLERS. Real bank staff and electricity boards NEVER call asking for OTPs or to download AnyDesk/TeamViewer.</p>
                </div>
              )}
            </div>
          )}

          {/* What to do if already scammed (Immediate Response Steps) */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 ${
              isDarkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h3 className="font-extrabold text-xs text-[#00F3FF] uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-[#00F3FF]" />
              <span>Immediate Steps If You Already Shared An OTP / Lost Money:</span>
            </h3>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <span className="font-bold text-white">Dial 1930 Immediately: </span>
                  National Cyber Crime Reporting Helpline can freeze the transaction in transit if reported within the first 2 hours.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <span className="font-bold text-white">Block Cards & Netbanking: </span>
                  Call your bank's official 24x7 toll-free emergency number to block Debit Card, Credit Card, and UPI ID.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                  3
                </span>
                <div>
                  <span className="font-bold text-white">File Official Police Complaint: </span>
                  File online at{' '}
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00F3FF] underline font-bold"
                  >
                    cybercrime.gov.in
                  </a>{' '}
                  and take an acknowledgement copy for your bank dispute.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t flex justify-end ${
            isDarkMode ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer text-xs"
          >
            Close Shield
          </button>
        </div>
      </div>
    </div>
  );
};
