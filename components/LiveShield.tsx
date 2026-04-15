import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from '@google/genai';
import { decodeBase64, decodeAudioData, getApiKey } from '../services/geminiService';
import { ScamAnalysis } from '../types';

interface Props {
  onAlert: (analysis: ScamAnalysis) => void;
}

const LiveShield: React.FC<Props> = ({ onAlert }) => {
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [threatLevel, setThreatLevel] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Low');
  const [scamProbability, setScamProbability] = useState(0);
  const [detectedSignals, setDetectedSignals] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const createAudioBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const stopShield = useCallback(() => {
    setIsActive(false);
    setThreatLevel('Low');
    setScamProbability(0);
    setDetectedSignals([]);
    
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextInRef.current) {
      audioContextInRef.current.close().catch(() => {});
      audioContextInRef.current = null;
    }

    if (audioContextOutRef.current) {
      audioContextOutRef.current.close().catch(() => {});
      audioContextOutRef.current = null;
    }

    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
  }, []);

  const startShield = async () => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setErrorMsg("Security Protocol Error: Live Shield requires a secure context (HTTPS or localhost).");
      return;
    }

    setIsActive(true);
    setErrorMsg(null);
    setTranscription([]);
    setDetectedSignals([]);
    nextStartTimeRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }, 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const apiKey = getApiKey();
      if (!apiKey) throw new Error("System Configuration Error: API Key missing.");
      
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = inputCtx;
      audioContextOutRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({ media: createAudioBlob(e.inputBuffer.getChannelData(0)) });
              }
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current && sessionRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0);
                  const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionRef.current.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                }
              }
            }, 2000);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev.slice(-3), `User: ${msg.serverContent?.inputTranscription?.text || ''}`]);
            }
            if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscription(prev => [...prev.slice(-3), `AI: ${msg.serverContent?.modelTurn?.parts?.[0]?.text}`]);
            }

            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'reportScam') {
                  const args = call.args as any;
                  setThreatLevel(args.threatLevel);
                  setScamProbability(args.confidence * 100);
                  if (args.detectedThreats) setDetectedSignals(args.detectedThreats);
                  
                  if (args.isScam && args.confidence > 0.7) {
                    onAlert({
                      isScam: true,
                      scamType: args.scamType,
                      confidence: args.confidence,
                      riskScore: args.confidence * 100,
                      threatLevel: args.threatLevel,
                      channel: 'video',
                      summary: args.summary,
                      safetyAlert: `CRITICAL: ${args.scamType} detected. ${args.summary}`,
                      warningSignals: args.detectedThreats || [],
                      extractedInfo: {
                        phoneNumbers: args.extractedInfo?.phoneNumbers?.map((v: string) => ({ value: v, confidence: 90, timestamp: Date.now() })) || [],
                        upiIds: args.extractedInfo?.upiIds?.map((v: string) => ({ value: v, confidence: 90, timestamp: Date.now() })) || [],
                        links: args.extractedInfo?.links?.map((v: string) => ({ value: v, confidence: 90, timestamp: Date.now() })) || [],
                        fakeIdentities: args.extractedInfo?.fakeIdentities?.map((v: string) => ({ value: v, confidence: 90, timestamp: Date.now() })) || [],
                        bankDetails: [], ifscCodes: [], cryptoWallets: []
                      },
                      killChainStage: 'Exploitation',
                      fingerprint: { primaryHandle: '', primaryPhone: args.extractedInfo?.phoneNumbers?.[0] || '', primaryLink: args.extractedInfo?.links?.[0] || '', category: args.scamType },
                      recommendedActions: args.recommendedActions || ["Disconnect immediately", "Do not share OTP"]
                    });
                  }
                  sessionRef.current?.sendToolResponse({ functionResponses: [{ name: 'reportScam', response: { status: 'received' }, id: call.id }] });
                }
              }
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              if (ctx.state === 'suspended') await ctx.resume();
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Shield Failure:", e);
            setErrorMsg("AI Link Interrupted. Auto-reconnecting...");
            stopShield();
            setTimeout(startShield, 3000);
          },
          onclose: () => { if (isActive) stopShield(); },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are Bharat Cyber Rakshak, a high-precision AI scam protection shield.
          Your mission: Monitor live audio/video for cybercrime.
          
          SCAMS TO DETECT:
          1. OTP/Bank Fraud: Urgency to share codes or account access.
          2. Digital Arrest: Impersonating police/CBI to threaten arrest.
          3. Electricity/Utility: Threatening disconnection for unpaid bills.
          4. Job/Task Fraud: Promising money for simple online tasks.
          5. Deepfakes: Analyze video frames for unnatural facial movements or mismatched audio.
          
          SECURITY LOGIC:
          - Detect urgency language: "immediately", "account blocked", "arrest warrant".
          - Detect identity impersonation.
          - If a scam is detected, call 'reportScam' tool with structured data.
          - Warn the user via audio in a calm but firm voice.
          - Be concise.`,
          tools: [{
            functionDeclarations: [{
              name: "reportScam",
              description: "Report detected scam details for live alerting.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  isScam: { type: Type.BOOLEAN },
                  scamType: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  threatLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
                  summary: { type: Type.STRING },
                  detectedThreats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific signals like 'Urgency Language', 'Deepfake Markers'" },
                  recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  extractedInfo: {
                    type: Type.OBJECT,
                    properties: {
                      phoneNumbers: { type: Type.ARRAY, items: { type: Type.STRING } },
                      upiIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      links: { type: Type.ARRAY, items: { type: Type.STRING } },
                      fakeIdentities: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                required: ["isScam", "scamType", "confidence", "threatLevel", "summary"]
              }
            }]
          }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } } },
        }
      });
      sessionRef.current = session;
    } catch (err: any) {
      setErrorMsg(err.message || "Hardware Access Denied. Check camera/mic permissions.");
      stopShield();
    }
  };

  useEffect(() => { return () => stopShield(); }, [stopShield]);

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'Critical': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      default: return 'text-emerald-500';
    }
  };

  return (
    <div className="bg-[#020617] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
      <div className={`px-10 py-10 flex items-center justify-between border-b border-white/5 ${isActive ? 'bg-blue-600/10' : 'bg-slate-900/50'}`}>
        <div className="flex items-center space-x-6">
          <div className={`p-5 rounded-3xl transition-all duration-500 ${isActive ? 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 'bg-white/5'}`}>
            <span className={`text-4xl ${isActive ? 'animate-pulse' : ''}`}>🛡️</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Sovereign Shield <span className="text-blue-500">Live</span></h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">AI-Powered Cyber Defense Matrix</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Threat Status</span>
             <span className={`text-sm font-black uppercase tracking-tight ${getThreatColor()}`}>{threatLevel}</span>
          </div>
          <button onClick={isActive ? stopShield : startShield} className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 ${isActive ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
            {isActive ? 'Deactivate Shield' : 'Activate Shield'}
          </button>
        </div>
      </div>

      <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {errorMsg && (
            <div className="bg-red-600/20 border border-red-500 p-6 rounded-2xl text-red-500 font-bold text-center animate-in fade-in slide-in-from-top-4">
              {errorMsg}
            </div>
          )}
          
          <div className="aspect-video bg-slate-950 rounded-[3rem] border border-white/10 flex items-center justify-center relative overflow-hidden group">
             {!isActive ? (
               <div className="text-center opacity-30 space-y-4">
                  <span className="text-6xl block">📵</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Secure Link...</p>
               </div>
             ) : (
               <div className="w-full h-full p-12 flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="bg-blue-600/20 px-4 py-2 rounded-xl text-blue-400 font-black text-[10px] border border-blue-500/30">ENCRYPTED_FEED_01</div>
                     <div className="flex flex-col items-end">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Scam Probability</div>
                        <div className="text-2xl font-black text-white">{scamProbability.toFixed(0)}%</div>
                     </div>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                     {[...Array(24)].map((_, i) => (
                       <div key={i} className="w-1.5 bg-blue-600 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }} />
                     ))}
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                     {transcription.map((t, i) => (
                       <div key={i} className="text-[11px] text-blue-200 font-bold bg-white/5 p-3 rounded-xl border border-white/5 animate-in slide-in-from-left-2">{t}</div>
                     ))}
                  </div>
               </div>
             )}
             <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-0'}`} autoPlay playsInline muted />
             <canvas ref={canvasRef} className="hidden" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Security Signals</h4>
              <div className="space-y-3">
                 {detectedSignals.length > 0 ? detectedSignals.map((s, i) => (
                   <div key={i} className="flex items-center space-x-3 bg-red-600/10 border border-red-500/20 p-3 rounded-xl animate-in zoom-in-95">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-tight">{s}</span>
                   </div>
                 )) : (
                   <div className="text-center py-10 opacity-20">
                      <span className="text-xs font-black uppercase tracking-widest">No Threats Detected</span>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2.5rem] p-8">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">AI Status</h4>
              <div className="flex items-center space-x-4">
                 <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-700'}`} />
                 <span className="text-xs font-black text-white uppercase tracking-widest">{isActive ? 'Monitoring Live' : 'Standby'}</span>
              </div>
              {isActive && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 leading-relaxed">
                  Analyzing audio harmonics and visual artifacts for deepfake detection.
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LiveShield);
