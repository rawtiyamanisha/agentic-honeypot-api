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

const VideoScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<VideoAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [mode, setMode] = useState<'live' | 'upload'>('live');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setMode('live');
      }
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
      setMode('upload');
      setIsActive(true);
    }
  };

  const captureAndAnalyze = async () => {
    const targetVideo = mode === 'live' ? videoRef.current : uploadVideoRef.current;
    if (!targetVideo || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    const canvas = canvasRef.current;
    canvas.width = targetVideo.videoWidth || 640;
    canvas.height = targetVideo.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      try {
        const result = await analyzeVideoFrame(base64);
        setLastAnalysis(result);
      } catch (e) {
        console.error("Frame analysis error", e);
      } finally {
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(captureAndAnalyze, 5000); 
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex space-x-2 bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-white/10">
           <button onClick={() => { setMode('live'); stopCamera(); startCamera(); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'live' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Live Feed</button>
           <button onClick={() => { setMode('upload'); stopCamera(); fileInputRef.current?.click(); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Analyze File</button>
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="video/*" className="hidden" />
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
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )
          ) : (
            uploadedUrl ? (
              <video ref={uploadVideoRef} src={uploadedUrl} controls autoPlay loop className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload video for deepfake analysis</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-lg">Select Video</button>
              </div>
            )
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
          <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Neural Forensic Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <DetectionPill active={!!lastAnalysis} label="Subsurface Scattering" />
            <DetectionPill active={!!lastAnalysis} label="Acoustic Alignment" />
            <DetectionPill active={!!lastAnalysis} label="Frame Interpolation" />
            <DetectionPill active={!!lastAnalysis} label="Eye Blink Sync" />
            <DetectionPill active={!!lastAnalysis} label="Facial Landmark Drift" />
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

export default VideoScanner;