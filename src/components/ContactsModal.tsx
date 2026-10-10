import React, { useState } from 'react';
import { X, UserPlus, Phone, Trash2, Check, Star, Shield } from 'lucide-react';
import { EmergencyContact } from '../types';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onSaveContacts: (contacts: EmergencyContact[]) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSaveContacts,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [callEnabled, setCallEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.trim();
    if (!name.trim()) {
      setErrorMsg('Please enter a contact name.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 3) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    // Check duplicate
    if (contacts.some((c) => c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))) {
      setErrorMsg('A contact with this phone number already exists.');
      return;
    }

    const newContact: EmergencyContact = {
      id: 'cnt_' + Date.now(),
      name: name.trim(),
      phone: cleanPhone,
      relationship,
      priority: contacts.length + 1,
      callEnabled,
      smsEnabled,
      whatsappEnabled,
      telegramEnabled: false,
    };

    onSaveContacts([...contacts, newContact]);
    setName('');
    setPhone('');
  };

  const handleRemove = (id: string) => {
    onSaveContacts(contacts.filter((c) => c.id !== id));
  };

  const handleMakePrimary = (id: string) => {
    const target = contacts.find((c) => c.id === id);
    if (!target) return;
    const others = contacts.filter((c) => c.id !== id);
    onSaveContacts([target, ...others]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1A0B2E] border border-[#00F3FF]/40 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-[0_0_40px_rgba(0,243,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#00F3FF]" />
            <h2 className="text-base font-bold text-white">Emergency Contacts & SOS Dialing</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <p className="text-slate-300">
            JASHPI automatically initiates hands-free phone calls to the <b>Primary Contact</b> and broadcasts location alerts via SMS and WhatsApp.
          </p>

          <div className="space-y-2 mt-2">
            {contacts.map((c, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isPrimary
                      ? 'bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border-emerald-500/50 shadow-sm'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-emerald-400" />
                          <span>PRIMARY CALL TARGET</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-300 mt-0.5 flex items-center space-x-2 font-mono">
                      <span>{c.phone}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-cyan-400">{c.relationship}</span>
                    </div>
                    <div className="flex space-x-2 text-[10px] text-slate-400 mt-1">
                      {c.callEnabled && <span>📞 Call</span>}
                      {c.smsEnabled && <span>💬 SMS</span>}
                      {c.whatsappEnabled && <span>🟢 WhatsApp</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 cursor-pointer"
                      title="Direct Dial"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    {!isPrimary && (
                      <button
                        onClick={() => handleMakePrimary(c.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        Set Primary
                      </button>
                    )}
                    {contacts.length > 1 && (
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add contact form */}
          <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/10">
            <h3 className="text-xs font-bold text-[#00F3FF] uppercase tracking-wider mb-2 flex items-center space-x-1">
              <UserPlus className="w-4 h-4" />
              <span>Add Emergency Contact</span>
            </h3>

            {errorMsg && (
              <p className="text-rose-400 text-[11px] mb-2 font-semibold">{errorMsg}</p>
            )}

            <form onSubmit={handleAdd} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +91 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Family">Family</option>
                  <option value="Spouse/Partner">Spouse / Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Trusted Friend">Trusted Friend</option>
                  <option value="Emergency Service">Emergency Service</option>
                </select>

                <div className="flex items-center space-x-3 text-[11px]">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={callEnabled}
                      onChange={(e) => setCallEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span>Call</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 rounded-lg bg-[#0044FF] hover:bg-[#0038d1] text-white font-bold cursor-pointer transition-colors"
              >
                Save Contact
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
