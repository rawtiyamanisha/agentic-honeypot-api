
import React, { useState, useRef, useEffect } from 'react';
import { askTutor } from '../services/tutorService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { decodeBase64, decodeAudioData } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const RakshakTutor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Namaste! Main aapka Rakshak Mitra hoon. Main yahan aapko cyber dhoke se bachane ke liye hoon. Aap mujhse kisi bhi bhasha mein baat kar sakte hain. Main aapki kaise madad karoon?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isVoiceActive]);

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const startVoiceMode = async () => {
    setIsVoiceActive(true);
    nextStartTimeRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user' && last?.text.startsWith('[Voice]')) {
                   return [...prev.slice(0, -1), { role: 'user', text: `[Voice] ${text}` }];
                }
                return [...prev, { role: 'user', text: `[Voice] ${text}` }];
              });
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model' && !last?.text.includes("Namaste")) {
                   return [...prev.slice(0, -1), { role: 'model', text: text }];
                }
                return [...prev, { role: 'model', text: text }];
              });
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              for (const s of sourcesRef.current.values()) { 
                try { s.stop(); } catch(e) {}
                sourcesRef.current.delete(s); 
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Tutor Voice Error", e),
          onclose: () => stopVoiceMode(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are Rakshak Mitra, the kind and confident cyber safety assistant. 

CORE RULES:
- Detect the user's language and style (Hindi, English, Hinglish, etc.) and reply EXACTLY in that language.
- Use a calm, kind, and reassuring voice.
- If a scam is detected, say clearly: "Yeh ek dhoka (scam) hai. Paise ya OTP share mat kijiye."
- NO technical or legal words. Use simple words for everything.
- Guide the user step-by-step through the app (e.g., "Niche waale button ko dabaiye").
- Make the user feel safe and supported.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Voice mode failed", err);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceMode = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsVoiceActive(false);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.debug("AudioContext close failed", e));
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.debug("AudioContext cleanup failed", e));
      }
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const response = await askTutor(userMsg, history);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: response || "Maaf kijiye, hum connect nahi kar paaye." }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-[90vw] md:w-[400px] h-[600px] bg-slate-900 border border-blue-500/30 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className={`p-6 flex items-center justify-between shadow-lg transition-colors duration-500 ${isVoiceActive ? 'bg-emerald-600' : 'bg-blue-600'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isVoiceActive ? 'bg-white/30 animate-pulse' : 'bg-white/20'}`}>
            <span className="text-xl">{isVoiceActive ? '🎙️' : '🧑‍🏫'}</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{isVoiceActive ? 'Voice Help' : 'Rakshak Mitra'}</h3>
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isVoiceActive ? 'bg-emerald-200' : 'bg-green-400'}`} />
              <span className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">{isVoiceActive ? 'Listening...' : 'Your Guardian'}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white">✕</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] relative">
        {isVoiceActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
             <div className="w-48 h-48 border-4 border-emerald-500 rounded-full animate-ping" />
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-5 py-3 rounded-2xl rounded-bl-none border border-white/5 flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={isVoiceActive ? stopVoiceMode : startVoiceMode}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
              isVoiceActive ? 'bg-red-600 animate-pulse shadow-[0_0_20px_#ef4444]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVoiceActive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          <form onSubmit={handleSend} className="flex-1 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping || isVoiceActive}
              placeholder={isVoiceActive ? "Main sun raha hoon..." : "Poochiye, main help karunga..."}
              className="w-full bg-slate-800 border border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping || isVoiceActive}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RakshakTutor;
