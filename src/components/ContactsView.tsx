import React, { useState } from 'react';
import {
  Users,
  Phone,
  MessageSquare,
  Share2,
  Plus,
  Trash2,
  ShieldAlert,
  Heart,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EmergencyContact } from '../types';

interface ContactsViewProps {
  contacts: EmergencyContact[];
  onSaveContacts: (contacts: EmergencyContact[]) => void;
  isDarkMode: boolean;
  language: string;
  batteryLevel: number | null;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  onSaveContacts,
  isDarkMode,
  language,
  batteryLevel,
}) => {
  const isHi = language === 'hi';
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('Family');

  const nationalHelplines = [
    { name: isHi ? '112 राष्ट्रीय आपातकालीन (ऑल-इन-वन)' : '112 Unified Emergency Dispatch', number: '112', type: 'Police / Fire / Medical', color: 'from-red-600 to-rose-700' },
    { name: isHi ? '108 एम्बुलेंस व चिकित्सा सेवा' : '108 Emergency Medical & Ambulance', number: '108', type: 'Medical Services', color: 'from-emerald-600 to-teal-700' },
    { name: isHi ? '100 पुलिस सहायता' : '100 Police Immediate Response', number: '100', type: 'Police Department', color: 'from-blue-600 to-indigo-700' },
    { name: isHi ? '1930 साइबर वित्तीय धोखाधड़ी' : '1930 Cyber Fraud & Financial Scam', number: '1930', type: 'Govt Cyber Crime Cell', color: 'from-purple-600 to-indigo-700' },
    { name: isHi ? '1091 महिला हेल्पलाइन' : '1091 Women Safety Helpline', number: '1091', type: 'Women Protection', color: 'from-pink-600 to-rose-700' },
    { name: isHi ? '101 अग्निशमन सेवा' : '101 Fire Emergency Services', number: '101', type: 'Fire Brigade', color: 'from-amber-600 to-orange-700' },
  ];

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: 'cnt_' + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRelation,
      priority: contacts.length + 1,
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      telegramEnabled: false,
    };

    onSaveContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  const handleDeleteContact = (id: string) => {
    onSaveContacts(contacts.filter((c) => c.id !== id));
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `🚨 EMERGENCY ALERT from JASHPI! I need immediate help. My battery is at ${batteryLevel ?? 'unknown'}%. Please check my location!`
    );
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>{isHi ? 'आपातकालीन संपर्क व परिवार' : 'Emergency Contacts & Family Circle'}</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isHi
              ? 'SOS दबाने पर इन संपर्कों को सीधे कॉल, SMS और WhatsApp लोकेशन भेजी जाती है'
              : 'Direct 1-tap call, SMS, and WhatsApp GPS tracking for your loved ones'}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs cursor-pointer shadow-md shadow-cyan-500/30 flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isHi ? '+ नया संपर्क जोड़ें' : '+ Add New Contact'}</span>
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddContact}
          className={`p-4 rounded-3xl border shadow-xl space-y-3 animate-fade-in ${
            isDarkMode ? 'bg-[#151c2e] border-cyan-500/40 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
          }`}
        >
          <h3 className="font-extrabold text-sm text-cyan-400">
            {isHi ? 'नया आपातकालीन संपर्क जोड़ें' : 'Add Emergency Contact'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Name</label>
              <input
                type="text"
                placeholder="e.g. Papa, Sister, Rahul"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-cyan-400 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-cyan-400 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Relationship</label>
              <select
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-cyan-400 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Family">Family / परिवार</option>
                <option value="Spouse">Spouse / पति-पत्नी</option>
                <option value="Friend">Friend / दोस्त</option>
                <option value="Doctor">Doctor / डॉक्टर</option>
                <option value="Colleague">Colleague / सहकर्मी</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold cursor-pointer shadow-md"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Family Circle Contacts List */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider">
          {isHi ? 'मेरे व्यक्तिगत आपातकालीन संपर्क' : 'My Personal Emergency Circle'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map((contact, idx) => (
            <div
              key={contact.id || idx}
              className={`p-4 rounded-3xl border shadow-md flex items-center justify-between ${
                isDarkMode ? 'bg-[#131929]/90 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black">
                  <Heart className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-extrabold text-sm">{contact.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {contact.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{contact.phone}</p>
                </div>
              </div>

              {/* Action Buttons: Call, WhatsApp, Delete */}
              <div className="flex items-center space-x-1.5">
                <a
                  href={`tel:${contact.phone}`}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-transform active:scale-95"
                  title="Direct Call"
                >
                  <Phone className="w-4 h-4" />
                </a>

                <a
                  href={getWhatsAppLink(contact.phone, contact.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer transition-transform active:scale-95"
                  title="WhatsApp SOS GPS"
                >
                  <Share2 className="w-4 h-4" />
                </a>

                {contacts.length > 1 && (
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* National Hotlines Grid */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider">
          {isHi ? 'राष्ट्रीय आपातकालीन हेल्पलाइन (भारत)' : 'National Emergency Helplines (India)'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nationalHelplines.map((helpline, idx) => (
            <a
              key={idx}
              href={`tel:${helpline.number}`}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] shadow-sm ${
                isDarkMode ? 'bg-[#151c2e] hover:bg-[#1a233a] border-white/10 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <div>
                <span className="text-[10px] text-slate-400 font-semibold">{helpline.type}</span>
                <h4 className="font-extrabold text-sm">{helpline.name}</h4>
              </div>
              <div className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${helpline.color} text-white font-black text-xs flex items-center space-x-1 shadow-md`}>
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{helpline.number}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactsView;
