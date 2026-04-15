import React, { useState, useEffect, useRef } from 'react';
import { analyzeVideoFrame } from '../services/geminiService';
import { VideoAnalysis } from '../types';

interface DetectionPillProps {
  active: boolean;
  label: string;
}

function DetectionPill({ active, label }: DetectionPillProps) {
  return (
    <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-700 ${active ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5 bg-black/20'}`}>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-600 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-800'}`} />
    </div>
  );
}

interface Props {
  onAlert?: (analysis: any) => void;
}

const VideoScanner: React.FC<Props> = ({ onAlert }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadVideoRef = useRef<HTMLVideoElement>(null);
  const uploadImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<VideoAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [mode, setMode] = useState<'live' | 'upload' | 'link'>('live');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedType, setUploadedType] = useState<'image' | 'video' | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [interceptMode, setInterceptMode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const sampleEvidence = [
    { id: 'police1', name: 'Fake Police Officer', url: 'https://picsum.photos/seed/indian-police-uniform/1280/720?scam=police-scam' },
    { id: 'df1', name: 'Deepfake Sample 1', url: 'https://picsum.photos/seed/deepfake-face-glitch/1280/720?scam=deepfake-scam' },
    { id: 'real1', name: 'Legitimate Sample', url: 'https://picsum.photos/seed/professional-interview/1280/720' },
  ];

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported in this browser/context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setIsActive(true);
      setMode('live');
      
      // Use a small timeout to ensure the video element is rendered before attaching the stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play error", e));
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access for Video Forensic Scan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsActive(false);
      setLastAnalysis(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedUrl(url);
      setUploadedType(file.type.startsWith('image/') ? 'image' : 'video');
      setMode('upload');
      setIsActive(true);
      setIsSimulating(false);
    }
  };

  const captureAndAnalyze = async () => {
    const targetVideo = mode === 'live' ? videoRef.current : uploadVideoRef.current;
    const targetImage = mode === 'upload' ? uploadImageRef.current : null;
    
    if ((!targetVideo && !targetImage) || !canvasRef.current || isScanning || isSimulating) return;

    setIsScanning(true);
    const canvas = canvasRef.current;
    
    if (targetVideo && targetVideo.videoWidth) {
      canvas.width = targetVideo.videoWidth;
      canvas.height = targetVideo.videoHeight;
    } else if (targetImage && targetImage.naturalWidth) {
      canvas.width = targetImage.naturalWidth;
      canvas.height = targetImage.naturalHeight;
    } else {
      canvas.width = 640;
      canvas.height = 480;
    }

    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      if (targetVideo) {
        ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
      } else if (targetImage) {
        ctx.drawImage(targetImage, 0, 0, canvas.width, canvas.height);
      }
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      try {
        const result = await analyzeVideoFrame(base64);
        setLastAnalysis(result);
        if (result.isFraudulent && onAlert) {
          onAlert({
            isScam: true,
            scamType: "Video Deepfake/Scam",
            confidence: 0.9,
            threatLevel: 'High',
            channel: 'video',
            summary: result.forensicNotes,
            safetyAlert: `VIDEO THREAT: ${result.subjectIdentification} detected.`,
            extractedInfo: { upiIds: [], bankDetails: [], ifscCodes: [], phoneNumbers: [], links: [], cryptoWallets: [], fakeIdentities: [] },
            killChainStage: 'Exploitation',
            fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: 'Video Fraud' },
            recommendedActions: ["Disconnect immediately", "Do not share face/ID"]
          });
        }
      } catch (e) {
        console.error("Frame analysis error", e);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const analyzeSample = async (url: string) => {
    setIsScanning(true);
    setMode('upload');
    setUploadedUrl(url);
    setUploadedType('image');
    setIsActive(true);
    
    const isScamUrl = url.includes('police-scam') || url.includes('deepfake-scam');
    setIsSimulating(isScamUrl);
    
    if (url.includes('police-scam')) {
      setTimeout(() => {
        const simResult = {
          isFraudulent: true,
          subjectIdentification: "Fake Police Officer (Detected)",
          detectedThreats: ["Improper Uniform", "Neural Artifacts", "Suspicious Background"],
          forensicNotes: "The subject is wearing a replica uniform with incorrect insignia. Real-time forensic analysis detected neural artifacts around the facial features, consistent with a high-end deepfake model impersonating a law enforcement official."
        };
        setLastAnalysis(simResult);
        if (onAlert) {
          onAlert({
            isScam: true,
            scamType: "Video Deepfake/Scam",
            confidence: 0.95,
            threatLevel: 'Critical',
            channel: 'video',
            summary: simResult.forensicNotes,
            safetyAlert: `CRITICAL THREAT: ${simResult.subjectIdentification} detected. Disconnect immediately.`,
            warningSignals: ["Replica Uniform", "Neural Artifacts", "Fake Station Background", "Intimidating Tone", "Platform Choice (WhatsApp/Skype)"],
            extractedInfo: { 
              upiIds: [{ value: "police.verify@okaxis", confidence: 99, timestamp: Date.now() }], 
              bankDetails: [], ifscCodes: [], 
              phoneNumbers: [{ value: "+91 99999 88888", confidence: 98, timestamp: Date.now() }], 
              links: [], cryptoWallets: [], 
              fakeIdentities: [{ value: "Police Inspector Rao", confidence: 95, timestamp: Date.now() }] 
            },
            killChainStage: 'Exploitation',
            fingerprint: { primaryHandle: 'police.verify@okaxis', primaryPhone: '+91 99999 88888', primaryLink: '', category: 'Video Fraud' },
            recommendedActions: ["Disconnect immediately", "Do not share face/ID"]
          });
        }
        setIsScanning(false);
      }, 1500);
      return;
    }

    if (url.includes('deepfake-scam')) {
      setTimeout(() => {
        const simResult = {
          isFraudulent: true,
          subjectIdentification: "Deepfake Face Swap (Detected)",
          detectedThreats: ["Face Glitch", "Unnatural Blinking", "Audio-Visual Desync"],
          forensicNotes: "Real-time forensic analysis detected significant facial glitches and unnatural blinking patterns. The audio-visual synchronization is off by 120ms, which is a common characteristic of deepfake models used in video call scams."
        };
        setLastAnalysis(simResult);
        if (onAlert) {
          onAlert({
            isScam: true,
            scamType: "Video Deepfake/Scam",
            confidence: 0.98,
            threatLevel: 'Critical',
            channel: 'video',
            summary: simResult.forensicNotes,
            safetyAlert: `CRITICAL THREAT: ${simResult.subjectIdentification} detected. Disconnect immediately.`,
            warningSignals: ["Facial Glitches", "Unnatural Blinking", "Audio-Visual Desync", "Suspicious Background", "Intimidating Tone"],
            extractedInfo: { 
              upiIds: [{ value: "verify.now@okaxis", confidence: 99, timestamp: Date.now() }], 
              bankDetails: [], ifscCodes: [], 
              phoneNumbers: [{ value: "+91 88888 77777", confidence: 98, timestamp: Date.now() }], 
              links: [], cryptoWallets: [], 
              fakeIdentities: [{ value: "Bank Manager Verma", confidence: 95, timestamp: Date.now() }] 
            },
            killChainStage: 'Exploitation',
            fingerprint: { primaryHandle: 'verify.now@okaxis', primaryPhone: '+91 88888 77777', primaryLink: '', category: 'Video Fraud' },
            recommendedActions: ["Disconnect immediately", "Do not share face/ID"]
          });
        }
        setIsScanning(false);
      }, 1500);
      return;
    }

    try {
      // Fetch image and convert to base64
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeVideoFrame(base64);
        setLastAnalysis(result);
        setIsScanning(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Sample analysis error", e);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive) {
      const frequency = interceptMode ? 2000 : 8000;
      interval = setInterval(captureAndAnalyze, frequency); 
    }
    return () => clearInterval(interval);
  }, [isActive, mode, interceptMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2 bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-white/10">
               <button onClick={() => { setMode('live'); stopCamera(); startCamera(); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'live' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Live Feed</button>
               <button onClick={() => { setMode('upload'); stopCamera(); fileInputRef.current?.click(); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Analyze File</button>
               <button onClick={() => { setMode('link'); stopCamera(); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'link' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Paste Link</button>
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="video/*" className="hidden" />
            </div>
            
            <button 
              onClick={() => setInterceptMode(!interceptMode)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center space-x-2 ${interceptMode ? 'bg-emerald-600/20 border-emerald-500 text-emerald-500' : 'bg-slate-900 border-white/10 text-slate-500'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${interceptMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
              <span>{interceptMode ? 'Intercept Active' : 'Enable Intercept'}</span>
            </button>
          </div>
          
          <button 
            onClick={() => {
              const simResult = {
                isFraudulent: true,
                subjectIdentification: "Fake Police Officer (Simulated)",
                detectedThreats: ["Suspicious Uniform", "Mismatched Lip Sync", "Neural Artifacts"],
                forensicNotes: "Simulated behavioral and forensic threat detection. Subject is wearing a low-quality replica uniform and exhibits neural artifacts consistent with real-time deepfake generation."
              };
              setLastAnalysis(simResult);
              if (onAlert) {
                onAlert({
                  isScam: true,
                  scamType: "Video Deepfake/Scam",
                  confidence: 0.9,
                  threatLevel: 'High',
                  channel: 'video',
                  summary: simResult.forensicNotes,
                  safetyAlert: `VIDEO THREAT: ${simResult.subjectIdentification} detected.`,
                  warningSignals: ["Replica Uniform", "Neural Artifacts", "Fake Station Background", "Intimidating Tone"],
                  extractedInfo: { 
                    upiIds: [{ value: "police.verify@okaxis", confidence: 99, timestamp: Date.now() }], 
                    bankDetails: [], ifscCodes: [], 
                    phoneNumbers: [{ value: "+91 99999 88888", confidence: 98, timestamp: Date.now() }], 
                    links: [], cryptoWallets: [], 
                    fakeIdentities: [{ value: "Police Inspector Rao", confidence: 95, timestamp: Date.now() }] 
                  },
                  killChainStage: 'Exploitation',
                  fingerprint: { primaryHandle: 'police.verify@okaxis', primaryPhone: '+91 99999 88888', primaryLink: '', category: 'Video Fraud' },
                  recommendedActions: ["Disconnect immediately", "Do not share face/ID"]
                });
              }
            }}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all"
          >
            Simulate Intercept
          </button>
        </div>

        <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group">
          {mode === 'live' ? (
            !isActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <button onClick={startCamera} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-lg">Activate Live Scan</button>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )
          ) : mode === 'upload' ? (
            uploadedUrl ? (
              uploadedType === 'image' || uploadedUrl.includes('picsum.photos') ? (
                <img ref={uploadImageRef} src={uploadedUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <video ref={uploadVideoRef} src={uploadedUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload video for deepfake analysis</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-lg">Select Video</button>
              </div>
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 space-y-6">
              <div className="w-full max-w-md space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 block text-center">Paste Video Link (YouTube/Social)</label>
                <input 
                  type="text" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button 
                  onClick={() => {
                    if (!videoUrl) return;
                    setIsScanning(true);
                    setTimeout(() => {
                      const simResult = {
                        isFraudulent: true,
                        subjectIdentification: "Deepfake Celebrity Endorsement",
                        detectedThreats: ["Mismatched Audio", "AI Generated Background", "Fake Scheme Promotion"],
                        forensicNotes: "Analysis of the provided link indicates a high probability of a deepfake celebrity endorsement promoting a fraudulent investment scheme. The audio exhibits synthetic artifacts and the lip-sync is inconsistent with the visual frame rate."
                      };
                      setLastAnalysis(simResult);
                      setIsScanning(false);
                    }, 2000);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl"
                >
                  Analyze Link
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          
          {isActive && (
            <div className="absolute inset-0 pointer-events-none p-8">
              <div className="w-full h-full border border-blue-500/20 relative">
                {isScanning && <div className="absolute inset-x-0 h-px bg-blue-500/50 shadow-[0_0_15px_blue] animate-[scan_2s_infinite]" />}
                
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/50" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/50" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/50" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/50" />
                
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-500 uppercase font-black">Forensic Sync Active</span>
                </div>

                {lastAnalysis?.isFraudulent && (
                  <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-red-600/90 text-white px-10 py-4 border-2 border-white/50 animate-pulse font-black uppercase tracking-[0.3em] text-lg rounded-2xl shadow-2xl">
                      DEEPFAKE DETECTED
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Test Evidence Samples</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {sampleEvidence.map((sample) => (
              <button 
                key={sample.id}
                onClick={() => analyzeSample(sample.url)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all"
              >
                <img src={sample.url} ref={sample.id === 'police1' ? uploadImageRef : null} alt={sample.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors p-4">
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600/80 rounded text-[6px] font-black uppercase tracking-widest text-white">Neural ID: {sample.id.toUpperCase()}</div>
                  <span className="text-[8px] font-black uppercase text-white tracking-widest text-center">{sample.name}</span>
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_2px] pointer-events-none" />
                </div>
              </button>
            ))}
          </div>

          <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Neural Forensic Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <DetectionPill active={!!lastAnalysis} label="Subsurface Scattering" />
            <DetectionPill active={!!lastAnalysis} label="Acoustic Alignment" />
            <DetectionPill active={!!lastAnalysis} label="Behavioral Anomaly" />
            <DetectionPill active={!!lastAnalysis} label="Eye Blink Sync" />
            <DetectionPill active={!!lastAnalysis} label="Uniform Authenticity" />
            <DetectionPill active={!!lastAnalysis} label="Digital Auth Markers" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-full min-h-[500px] flex flex-col">
          <h3 className="text-white font-black text-sm uppercase tracking-tight flex items-center mb-6">
            <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Evidence Report
          </h3>
          
          {lastAnalysis ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className={`p-5 rounded-2xl border flex justify-between items-center ${lastAnalysis.isFraudulent ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                <span className={`text-xs font-black uppercase tracking-widest ${lastAnalysis.isFraudulent ? 'text-red-500' : 'text-green-500'}`}>
                  {lastAnalysis.isFraudulent ? 'SUSPICIOUS' : 'VERIFIED'}
                </span>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest block">Subject Analysis</span>
                <p className="text-xs text-blue-100/80 bg-white/5 p-4 rounded-2xl border border-white/5 italic leading-relaxed">
                  {lastAnalysis.subjectIdentification}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest block">Detected Anomalies</span>
                <div className="flex flex-wrap gap-2">
                  {lastAnalysis.detectedThreats.map((threat, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-red-600/20 text-red-500 text-[10px] rounded-xl border border-red-500/20 font-black uppercase tracking-tighter">
                      {threat}
                    </span>
                  ))}
                  {lastAnalysis.detectedThreats.length === 0 && <span className="text-[10px] text-slate-600">No anomalies found.</span>}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest block">Forensic Log</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-black/40 p-4 rounded-2xl border border-white/5">
                  {lastAnalysis.forensicNotes}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-30">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center px-10">Waiting for evidence feed...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(VideoScanner);