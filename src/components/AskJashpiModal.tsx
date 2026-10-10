import React, { useState } from 'react';
import { X, Sparkles, Send, Volume2, VolumeX, ShieldAlert, HeartPulse } from 'lucide-react';
import { askJashpiAiApi } from '../services/emergencyApi';
import { speakVoiceFeedback } from '../services/audioSiren';

interface AskJashpiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

export const AskJashpiModal: React.FC<AskJashpiModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello, I am JASHPI Emergency AI ("Ek Tap, Ek Saans, Ek Zindagi"). Ask me any first-aid, CPR, or immediate health question. In critical life-threatening situations, always dial 112 or 108 first.',
      source: 'JASHPI_CORE',
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: 'Adult CPR Steps', query: 'Step by step adult CPR instructions' },
    { label: 'Severe Bleeding', query: 'How to stop severe bleeding from a deep wound' },
    { label: 'Choking / Heimlich', query: 'How to perform Heimlich maneuver for a choking adult' },
    { label: 'Burns First Aid', query: 'First aid for second degree burns and scalds' },
    { label: 'Heart Attack Signs', query: 'Early warning signs of a cardiac arrest or heart attack' },
    { label: 'Hindi: CPR कैसे करें', query: 'CPR कैसे किया जाता है और आपातकालीन कदम क्या हैं' },
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || prompt).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await askJashpiAiApi(textToSend, language);
      const assistantMsg: Message = {
        role: 'assistant',
        text: res.reply || 'Emergency information unavailable. Please call 112/108 immediately.',
        source: res.source,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Emergency guidance: Ensure patient is breathing and conscious. Apply direct pressure to any bleeding wounds. Dial 112 or 108 immediately.',
          source: 'OFFLINE_FAILSAFE',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    speakVoiceFeedback(text, language === 'hi' ? 'hi-IN' : 'en-IN');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1A0B2E] border border-[#00F3FF]/40 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-[0_0_40px_rgba(0,243,255,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-black">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Ask Jashpi AI Assistant</span>
              </h2>
              <p className="text-[11px] text-cyan-300">CPR, First Aid, and Emergency Triage</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
              className="bg-black/40 border border-white/20 text-xs text-white rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#00F3FF]"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 border-b border-white/5 overflow-x-auto flex space-x-2 scrollbar-none bg-black/20 shrink-0">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.query)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#00F3FF]/10 hover:bg-[#00F3FF]/20 text-[#00F3FF] border border-[#00F3FF]/30 text-[11px] font-medium transition-colors cursor-pointer"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-[#0044FF] text-white rounded-br-none'
                    : 'bg-black/50 border border-white/10 text-slate-100 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                {m.role === 'assistant' && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400">
                      {m.source || 'AI PROTOCOL'}
                    </span>
                    <button
                      onClick={() => handleSpeak(m.text)}
                      className="flex items-center space-x-1 text-[#00F3FF] hover:underline cursor-pointer"
                      title="Read out loud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen Hands-Free</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-cyan-300 text-xs italic">
              <HeartPulse className="w-4 h-4 animate-spin text-[#00F3FF]" />
              <span>Analyzing medical guidance...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-3 border-t border-white/10 bg-black/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask emergency or first-aid question..."
              className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00F3FF]"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F3FF] to-[#0044FF] text-black font-bold text-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
