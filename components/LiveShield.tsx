import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { decodeBase64, decodeAudioData } from '../services/geminiService';
import { ScamAnalysis } from '../types';

interface Props {
  onAlert: (analysis: ScamAnalysis) => void;
}

const LiveShield: React.FC<Props> = ({ onAlert }) => {
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [threatLevel, setThreatLevel] = useState<'Low' | 'Medium' | 'High'>('Low');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  const startShield = async () => {
    setIsActive(true);
    setErrorMsg(null);
    setTranscription([]);
    nextStartTimeRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev.slice(-4), `Target: ${msg.serverContent.inputTranscription.text}`]);
            }
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => {
            console.error(e);
            setErrorMsg("Connection Lost. Check your API Key or VPN settings.");
            stopShield();
          },
          onclose: () => stopShield(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "Protect user from phone scams."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setErrorMsg("Camera/Mic access denied. Please allow permissions.");
      setIsActive(false);
    }
  };

  const stopShield = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setIsActive(false);
  };

  return (
    <div className="bg-[#020617] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
      <div className={`px-10 py-10 flex items-center justify-between border-b border-white/5 ${isActive ? 'bg-blue-600/10' : 'bg-slate-900/50'}`}>
        <div className="flex items-center space-x-6">
          <div className={`p-5 rounded-3xl ${isActive ? 'bg-blue-600 shadow-xl' : 'bg-white/5'}`}>
            <span className="text-4xl">🎙️</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Call Protection Shield</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">AI VOICEOVER DEFENSE STANDBY</p>
          </div>
        </div>
        <button onClick={isActive ? stopShield : startShield} className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {isActive ? 'Disconnect' : 'Start Secure Call'}
        </button>
      </div>

      <div className="p-10">
        {errorMsg && (
          <div className="bg-red-600/20 border border-red-500 p-6 rounded-2xl mb-8 text-red-500 font-bold text-center">
            {errorMsg}
          </div>
        )}
        
        <div className="aspect-video bg-slate-950 rounded-[3rem] border border-white/10 flex items-center justify-center relative overflow-hidden">
           {!isActive ? (
             <div className="text-center opacity-30 space-y-4">
                <span className="text-6xl block">📵</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Connect to live feed for audio analysis</p>
             </div>
           ) : (
             <div className="w-full h-full p-12 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="bg-blue-600/20 px-4 py-2 rounded-xl text-blue-400 font-black text-[10px]">LIVE_PROTECT_01</div>
                </div>
                <div className="flex justify-center space-x-2">
                   {[...Array(20)].map((_, i) => (
                     <div key={i} className="w-2 bg-blue-600 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 80}%` }} />
                   ))}
                </div>
                <div className="space-y-2">
                   {transcription.map((t, i) => (
                     <div key={i} className="text-xs text-blue-200 font-bold bg-white/5 p-3 rounded-xl">{t}</div>
                   ))}
                </div>
             </div>
           )}
           <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        </div>
      </div>
    </div>
  );
};

export default LiveShield;