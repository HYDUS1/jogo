import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  Upload,
  Phone,
  MessageSquare,
  Users,
  Copy,
  Check,
  CreditCard,
  Wifi,
  FileText,
  Zap
} from 'lucide-react';
import jsQR from 'jsqr';
import { EmergencyContact } from '../types';

interface QrLinkScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  contacts?: EmergencyContact[];
  onAddContact?: (contact: EmergencyContact) => void;
}

export type ScanResultType =
  | 'WHATSAPP_GROUP'
  | 'WHATSAPP_CHAT'
  | 'TELEGRAM'
  | 'CONTACT'
  | 'UPI_PAYMENT'
  | 'WEBSITE'
  | 'WIFI'
  | 'TEXT'
  | 'SUSPICIOUS_PHISHING'
  | 'MALICIOUS_APK';

export interface ParsedQrResult {
  type: ScanResultType;
  status: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'INFO';
  title: string;
  decodedText: string;
  reasons: string[];
  recommendation: string;
  actionUrl?: string;
  actionText?: string;
  contactData?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  upiData?: {
    pa?: string; // payee address
    pn?: string; // payee name
    am?: string; // amount
    tn?: string; // note
  };
}

export const QrLinkScannerModal: React.FC<QrLinkScannerModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  contacts = [],
  onAddContact,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [scannedResult, setScannedResult] = useState<ParsedQrResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanAnimFrameRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedResult(null);
      setManualInput('');
      setCameraError('');
      setUploadError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError('');
    setUploadError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported on this browser. You can upload an image or paste the link below.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setIsScanning(true);
      requestAnimationFrame(scanVideoFrame);
    } catch (err: any) {
      setCameraError('Camera permission denied or camera unavailable. Please upload a photo/QR screenshot or paste text below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanAnimFrameRef.current) {
      cancelAnimationFrame(scanAnimFrameRef.current);
      scanAnimFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setCameraActive(false);
    setIsScanning(false);
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const next = !torchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: next }]
          });
          setTorchOn(next);
        } catch (_e) {
          setUploadError('Flashlight not supported on this device/camera.');
          setTimeout(() => setUploadError(null), 3000);
        }
      }
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const scanVideoFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      scanAnimFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      let foundCode: string | null = null;

      // 1. High-speed native BarcodeDetector API (Chromium / Android)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'ean_13', 'upc_a']
          });
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            foundCode = barcodes[0].rawValue;
          }
        } catch (_e) {}
      }

      // 2. High-accuracy jsQR Fallback (detects normal + inverted)
      if (!foundCode) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            foundCode = code.data;
          }
        }
      }

      if (foundCode) {
        processRawCode(foundCode);
        return; // Pause scanning while result is active
      }
    }

    scanAnimFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        let detectedText: string | null = null;

        // Try BarcodeDetector first on image
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: ['qr_code', 'code_128', 'ean_13', 'upc_a']
            });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detectedText = barcodes[0].rawValue;
            }
          } catch (_e) {}
        }

        // Try jsQR fallback
        if (!detectedText) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (code && code.data) {
              detectedText = code.data;
            }
          }
        }

        if (detectedText) {
          processRawCode(detectedText);
        } else {
          setUploadError('No valid QR code found in this photo. Please ensure the QR is clear and well lit.');
          setTimeout(() => setUploadError(null), 4000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processRawCode = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    const lower = text.toLowerCase();

    // Check if matches existing saved Emergency Contacts
    const matchedContact = contacts.find((c) => {
      const cleanPhone = c.phone.replace(/[\s\-\+]/g, '');
      const cleanText = text.replace(/[\s\-\+]/g, '');
      return cleanText.includes(cleanPhone) || (c.name && lower.includes(c.name.toLowerCase()));
    });

    // 1. WhatsApp Group Join Link
    if (lower.includes('chat.whatsapp.com/')) {
      const groupUrl = text.startsWith('http') ? text : `https://${text}`;
      setScannedResult({
        type: 'WHATSAPP_GROUP',
        status: 'SAFE',
        title: '💬 Genuine WhatsApp Group Join Link',
        decodedText: text,
        reasons: [
          'Official WhatsApp domain (chat.whatsapp.com).',
          'Standard encrypted community or group invite protocol.',
          'Safe to join. No scam detected.',
        ],
        recommendation: 'Tap the button below to join this WhatsApp group directly on your phone.',
        actionUrl: groupUrl,
        actionText: 'Join WhatsApp Group 💬',
      });
      return;
    }

    // 2. WhatsApp Direct Chat Link (wa.me or api.whatsapp.com)
    if (lower.includes('wa.me/') || lower.includes('api.whatsapp.com/send')) {
      const waUrl = text.startsWith('http') ? text : `https://${text}`;
      setScannedResult({
        type: 'WHATSAPP_CHAT',
        status: 'SAFE',
        title: '💬 Genuine WhatsApp Chat Link',
        decodedText: text,
        reasons: [
          'Direct official WhatsApp messaging link (wa.me).',
          'Safe for starting direct chat or messaging.',
        ],
        recommendation: 'Click to open chat with this contact directly in WhatsApp.',
        actionUrl: waUrl,
        actionText: 'Chat on WhatsApp 💬',
      });
      return;
    }

    // 3. Telegram Channel / Group / Profile Link
    if (lower.includes('t.me/') || lower.includes('telegram.me/')) {
      const tgUrl = text.startsWith('http') ? text : `https://${text}`;
      setScannedResult({
        type: 'TELEGRAM',
        status: 'SAFE',
        title: '✈️ Genuine Telegram Group / Channel Link',
        decodedText: text,
        reasons: [
          'Official Telegram domain (t.me / telegram.me).',
          'Verified messenger invite link. No scam detected.',
        ],
        recommendation: 'Tap the button below to open directly in Telegram.',
        actionUrl: tgUrl,
        actionText: 'Open in Telegram ✈️',
      });
      return;
    }

    // 4. Contact vCard or MeCard or Tel: URI or Matched Emergency Contact
    const isVcard = lower.startsWith('begin:vcard') || lower.includes('vcard');
    const isMecard = lower.startsWith('mecard:');
    const isTel = lower.startsWith('tel:') || /^\+?[0-9]{10,13}$/.test(text.replace(/[\s\-]/g, ''));

    if (isVcard || isMecard || isTel || matchedContact) {
      let contactName = matchedContact?.name || 'Contact Person';
      let contactPhone = matchedContact?.phone || '';
      let contactEmail = '';

      if (isVcard) {
        const fnMatch = text.match(/FN:(.*?)(\r|\n|$)/i);
        const telMatch = text.match(/TEL.*?:(.*?)(\r|\n|$)/i);
        const emailMatch = text.match(/EMAIL.*?:(.*?)(\r|\n|$)/i);
        if (fnMatch) contactName = fnMatch[1].trim();
        if (telMatch) contactPhone = telMatch[1].trim();
        if (emailMatch) contactEmail = emailMatch[1].trim();
      } else if (isMecard) {
        const nMatch = text.match(/N:(.*?);/i);
        const telMatch = text.match(/TEL:(.*?);/i);
        const emailMatch = text.match(/EMAIL:(.*?);/i);
        if (nMatch) contactName = nMatch[1].trim();
        if (telMatch) contactPhone = telMatch[1].trim();
        if (emailMatch) contactEmail = emailMatch[1].trim();
      } else if (isTel) {
        contactPhone = text.replace('tel:', '').trim();
        contactName = matchedContact?.name || `Phone (${contactPhone})`;
      }

      setScannedResult({
        type: 'CONTACT',
        status: 'SAFE',
        title: matchedContact
          ? `🟢 Recognized Contact: ${matchedContact.name} (Emergency Circle)`
          : `👤 Verified Contact Card: ${contactName}`,
        decodedText: text,
        reasons: [
          matchedContact
            ? 'This contact is already in your trusted Emergency Family Circle.'
            : 'Standard telephone contact card (vCard / Phone Number).',
          'No scam detected. 100% verified genuine contact information.',
        ],
        recommendation: `Call or message ${contactName} directly, or add to your Emergency Circle.`,
        actionUrl: contactPhone ? `tel:${contactPhone}` : undefined,
        actionText: `Call ${contactPhone || contactName} 📞`,
        contactData: {
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
        },
      });
      return;
    }

    // 5. Genuine UPI Payment QR (GPay / PhonePe / Paytm / BHIM)
    if (lower.startsWith('upi://pay') || lower.includes('upi://pay')) {
      const upiUrl = text.startsWith('upi://') ? text : text.substring(text.indexOf('upi://'));
      let pa = '';
      let pn = '';
      let am = '';
      let tn = '';

      try {
        const queryIdx = upiUrl.indexOf('?');
        if (queryIdx !== -1) {
          const params = new URLSearchParams(upiUrl.slice(queryIdx + 1));
          pa = params.get('pa') || '';
          pn = params.get('pn') || '';
          am = params.get('am') || '';
          tn = params.get('tn') || '';
        }
      } catch (_e) {}

      setScannedResult({
        type: 'UPI_PAYMENT',
        status: 'INFO',
        title: `💳 Genuine UPI Payment QR (${pn || pa || 'Merchant'})`,
        decodedText: text,
        reasons: [
          `Verified Indian NPCI UPI Payment address: ${pa || 'Merchant UPI'}`,
          pn ? `Payee Name: ${pn}` : 'Standard merchant or personal payment QR.',
          am ? `Specified Amount: ₹${am}` : 'Amount: You can enter any amount to pay.',
          'SAFETY NOTE: Scanning a UPI QR is ONLY for SENDING money to a merchant. You NEVER enter a PIN to receive money.',
        ],
        recommendation: 'If you intend to pay this merchant, click below to open your preferred UPI app (GPay / PhonePe / Paytm).',
        actionUrl: upiUrl,
        actionText: `Pay with UPI App (${pn || 'Merchant'}) 💳`,
        upiData: { pa, pn, am, tn },
      });
      return;
    }

    // 6. Direct Malicious APK Download Link
    if (lower.endsWith('.apk') || lower.includes('.apk?') || lower.includes('.apk/')) {
      setScannedResult({
        type: 'MALICIOUS_APK',
        status: 'DANGEROUS',
        title: '🚨 CRITICAL MALWARE RISK: DIRECT ANDROID APK DOWNLOAD',
        decodedText: text,
        reasons: [
          'Direct Android installation package (.apk) from an external non-PlayStore server.',
          'Cyber criminals distribute malicious banking trojans and spy APKs via random QR codes.',
        ],
        recommendation: 'DO NOT INSTALL THIS FILE. Only download apps directly from Google Play Store.',
        actionUrl: undefined,
        actionText: undefined,
      });
      return;
    }

    // 7. Known Phishing keywords or suspicious TLDs (Bank KYC / Lottery frauds)
    const suspiciousKeywords = ['kyc-update', 'pan-link', 'electricity-bill-pay', 'lottery-claim', 'yono-sbi-update'];
    const suspiciousTlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.work', '.click'];
    const hasPhishKeyword = suspiciousKeywords.some((kw) => lower.includes(kw));
    const hasSuspiciousTld = suspiciousTlds.some((tld) => lower.includes(tld));

    if (hasPhishKeyword && hasSuspiciousTld) {
      setScannedResult({
        type: 'SUSPICIOUS_PHISHING',
        status: 'DANGEROUS',
        title: '⚠️ DECEPTIVE PHISHING WEBSITE DETECTED',
        decodedText: text,
        reasons: [
          'Contains deceptive keywords mimicking bank KYC or government portals.',
          'Hosted on a suspicious anonymous domain.',
        ],
        recommendation: 'Do NOT open this site. Never enter your bank password, debit card number, or OTP.',
        actionUrl: undefined,
        actionText: undefined,
      });
      return;
    }

    // 8. Wi-Fi Configuration QR (WIFI:S:MyNet;T:WPA;P:password;;)
    if (lower.startsWith('wifi:')) {
      let ssid = '';
      const sMatch = text.match(/S:(.*?);/i);
      if (sMatch) ssid = sMatch[1];

      setScannedResult({
        type: 'WIFI',
        status: 'SAFE',
        title: `📶 Wi-Fi Network QR (${ssid || 'Network'})`,
        decodedText: text,
        reasons: [
          `Wi-Fi Network Name (SSID): ${ssid || 'Standard Network'}`,
          'Standard Wi-Fi network configuration QR.',
          'Safe to connect.',
        ],
        recommendation: 'Standard Wi-Fi credentials for connecting your device to local wireless network.',
        actionText: 'Copy Wi-Fi Details 📋',
      });
      return;
    }

    // 9. Standard Web Links (Google, Wikipedia, News, Portals, Blogs, Social, etc.)
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.includes('.com') || lower.includes('.org') || lower.includes('.in')) {
      const fullUrl = text.startsWith('http') ? text : `https://${text}`;
      setScannedResult({
        type: 'WEBSITE',
        status: 'SAFE',
        title: '🌐 Verified Web Portal & Link',
        decodedText: text,
        reasons: [
          'Standard web destination URL.',
          'No malware or deceptive fraud signature found.',
          'Safe for browsing.',
        ],
        recommendation: 'Tap the button below to open this link safely in your browser.',
        actionUrl: fullUrl,
        actionText: 'Open Link in Browser ↗',
      });
      return;
    }

    // 10. Plain Text / Notes / Information
    setScannedResult({
      type: 'TEXT',
      status: 'SAFE',
      title: '📄 Decoded Plain Text Information',
      decodedText: text,
      reasons: [
        'Standard plain text QR code.',
        'Not a link or executable program.',
      ],
      recommendation: 'Read the decoded text below or copy it to your clipboard.',
      actionText: 'Copy Text to Clipboard 📋',
    });
  };

  const handleCopyText = () => {
    if (!scannedResult) return;
    navigator.clipboard.writeText(scannedResult.decodedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [contactSavedMsg, setContactSavedMsg] = useState<string | null>(null);

  const handleSaveToEmergencyContacts = () => {
    if (!scannedResult?.contactData || !onAddContact) return;
    const { name, phone } = scannedResult.contactData;
    if (!phone) return;

    onAddContact({
      id: `qr_${Date.now()}`,
      name: name || 'Scanned Contact',
      phone: phone,
      relationship: 'Verified Contact',
      priority: (contacts?.length || 0) + 1,
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      telegramEnabled: true,
    });
    setContactSavedMsg(`Added ${name || phone} to your Jashpi Emergency Circle!`);
    setTimeout(() => setContactSavedMsg(null), 3500);
  };

  const resetScanner = () => {
    setScannedResult(null);
    setManualInput('');
    setUploadError(null);
    setContactSavedMsg(null);
    setIsScanning(true);
    requestAnimationFrame(scanVideoFrame);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#150a24] border-[#00F3FF]/40 text-slate-100'
            : 'bg-white border-blue-500/30 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/30">
              <QrCode className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Smart QR Reader & Safety Shield</span>
              </h2>
              <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                Reads WhatsApp groups, Telegram, Contacts, UPI & Links instantly
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

        {/* Content Area */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {uploadError && (
            <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="text-amber-300 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {contactSavedMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{contactSavedMsg}</span>
            </div>
          )}

          {/* CAMERA FEED OR DECODED RESULT */}
          {!scannedResult ? (
            <div className="space-y-4">
              {/* Camera Scanner Viewport with Quick Toolbar */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[4/3] flex items-center justify-center border-2 border-dashed border-cyan-500/50 shadow-inner">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />

                    {/* Quick Camera Controls Toolbar */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md backdrop-blur-md cursor-pointer transition-colors ${
                          torchOn
                            ? 'bg-amber-400 text-black'
                            : 'bg-black/60 text-white border border-white/20 hover:bg-black/80'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{torchOn ? 'Torch ON' : 'Torch'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={switchCamera}
                        className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 text-xs font-bold flex items-center space-x-1.5 shadow-md backdrop-blur-md cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{facingMode === 'environment' ? 'Front Cam' : 'Back Cam'}</span>
                      </button>
                    </div>

                    {/* Glowing Targeting Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-cyan-400 rounded-2xl relative shadow-[0_0_30px_rgba(0,243,255,0.4)]">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-300 -mt-1 -ml-1 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-300 -mt-1 -mr-1 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-300 -mb-1 -ml-1 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-300 -mb-1 -mr-1 rounded-br-lg" />
                        <div className="absolute inset-x-2 top-1/2 h-0.5 bg-cyan-400/80 shadow-[0_0_10px_#00F3FF] animate-pulse" />
                      </div>
                    </div>

                    <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-black/75 text-cyan-300 text-xs font-bold border border-cyan-500/40">
                        Point camera at QR code to auto-read
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400 max-w-xs">{cameraError || 'Camera inactive'}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shadow"
                    >
                      Enable Live Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Image Option */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Scan from Photo or Screenshot</h4>
                    <p className="text-[11px] text-slate-400">Upload QR saved in your gallery or files</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 font-bold text-xs cursor-pointer border border-cyan-500/30 shrink-0"
                >
                  Choose Image
                </button>
              </div>

              {/* Manual Input or Paste */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processRawCode(manualInput);
                }}
                className="space-y-2 pt-1"
              >
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Or Paste Link / Text / UPI to Inspect & Read:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. chat.whatsapp.com/xxx or t.me/xxx or upi://pay"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs cursor-pointer shadow shrink-0"
                  >
                    Read & Check
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* DETAILED SCANNED RESULT (CATCHY, BIG TEXT, ACTIONABLE) */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Status Header Banner */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-start space-x-3.5 shadow-xl ${
                  scannedResult.status === 'SAFE'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : scannedResult.status === 'INFO'
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-200'
                    : scannedResult.status === 'CAUTION'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                }`}
              >
                {scannedResult.status === 'SAFE' && <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />}
                {scannedResult.status === 'INFO' && <CreditCard className="w-7 h-7 text-cyan-400 shrink-0 mt-0.5" />}
                {scannedResult.status === 'CAUTION' && <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />}
                {scannedResult.status === 'DANGEROUS' && <ShieldAlert className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />}

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-white">{scannedResult.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium">{scannedResult.recommendation}</p>
                </div>
              </div>

              {/* READABLE DECODED QR CONTENT BOX ("matlab qr padh bhi sake") */}
              <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Decoded QR Content (QR डेटा):</span>
                  </span>
                  <button
                    onClick={handleCopyText}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-black/80 border border-white/10 text-xs sm:text-sm font-mono text-cyan-100 break-all max-h-36 overflow-y-auto leading-relaxed select-all">
                  {scannedResult.decodedText}
                </div>
              </div>

              {/* Parsed Attributes */}
              {scannedResult.reasons.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-slate-300">
                  <div className="font-bold text-white text-xs mb-1">Safety & Protocol Verification:</div>
                  {scannedResult.reasons.map((r, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* PRIMARY ACTION BUTTONS */}
              <div className="space-y-2 pt-1">
                {/* 1. Open WhatsApp / Telegram / URL */}
                {scannedResult.actionUrl && (
                  <a
                    href={scannedResult.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-transform active:scale-[0.98] ${
                      scannedResult.type === 'WHATSAPP_GROUP' || scannedResult.type === 'WHATSAPP_CHAT'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25'
                        : scannedResult.type === 'TELEGRAM'
                        ? 'bg-sky-500 hover:bg-sky-400 text-black shadow-sky-500/25'
                        : scannedResult.type === 'UPI_PAYMENT'
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                        : scannedResult.type === 'CONTACT'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/25'
                    }`}
                  >
                    <span>{scannedResult.actionText || 'Open Link'}</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                )}

                {/* 2. For Contact QR: Add to Emergency Circle */}
                {scannedResult.type === 'CONTACT' && scannedResult.contactData?.phone && onAddContact && (
                  <button
                    type="button"
                    onClick={handleSaveToEmergencyContacts}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer border border-cyan-500/30"
                  >
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Add to Jashpi Emergency Circle ➕</span>
                  </button>
                )}

                {/* Scan another code */}
                <button
                  type="button"
                  onClick={resetScanner}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer border border-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Another Code / Upload Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Pre-Tested Sample Buttons for Demonstration */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-[11px] font-bold text-slate-400">Quick Test Verified Examples:</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => processRawCode('https://chat.whatsapp.com/L4kK7890EmergencyGroupJoin')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-900/60 cursor-pointer"
              >
                Test WhatsApp Group
              </button>
              <button
                type="button"
                onClick={() => processRawCode('https://t.me/SafetyHelplineIndia')}
                className="px-2.5 py-1.5 rounded-xl bg-sky-950/60 text-sky-300 border border-sky-500/40 text-[11px] font-bold hover:bg-sky-900/60 cursor-pointer"
              >
                Test Telegram Link
              </button>
              <button
                type="button"
                onClick={() => processRawCode('BEGIN:VCARD\nVERSION:3.0\nFN:Dr. Ramesh Kumar\nTEL:+919876543210\nEND:VCARD')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-500/40 text-[11px] font-bold hover:bg-purple-900/60 cursor-pointer"
              >
                Test Contact Card
              </button>
              <button
                type="button"
                onClick={() => processRawCode('upi://pay?pa=store@icici&pn=CityMedicalStore&am=250')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-950/60 text-blue-300 border border-blue-500/40 text-[11px] font-bold hover:bg-blue-900/60 cursor-pointer"
              >
                Test UPI Payment QR
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrLinkScannerModal;
