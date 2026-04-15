import React, { useState, useRef, useEffect } from 'react';
import { analyzeAudio } from '../services/geminiService';
import { ScamAnalysis } from '../types';

interface Props {
  onAnalysisComplete: (message: string, analysis: ScamAnalysis) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
}

const VoiceScanner: React.FC<Props> = ({ onAnalysisComplete, isAnalyzing, setIsAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported in this browser/context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Please allow microphone access for Voice Scam Detection.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeAudio(base64, 'audio/webm');
          onAnalysisComplete("[VOICE MESSAGE ANALYSIS]", result);
        } catch (err) {
          console.error("Audio analysis error", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Audio processing error", err);
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {isRecording && (
          <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping" />
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-500 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          } disabled:opacity-50`}
        >
          {isRecording ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="text-center space-y-4">
        <p className={`text-xs font-black uppercase tracking-widest ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
          {isRecording ? `RECORDING: ${formatTime(recordingTime)}` : 'TAP TO SCAN VOICE SCAM'}
        </p>
        <p className="text-[10px] text-slate-400 font-medium mt-1">Record a snippet of a suspicious call or voice note</p>
        
        {!isRecording && !isAnalyzing && (
          <button 
            onClick={() => {
              const simResult = {
                isScam: true,
                scamType: "Voice Message Fraud",
                confidence: 0.88,
                threatLevel: 'High',
                channel: 'audio',
                summary: "Voice message analysis indicates a 'Digital Arrest' scam attempt. The speaker uses official-sounding jargon to intimidate the recipient.",
                safetyAlert: "WARNING: Fraudulent voice message detected. Impersonation of law enforcement detected.",
                extractedInfo: { upiIds: [], bankDetails: [], ifscCodes: [], phoneNumbers: [], links: [], cryptoWallets: [], fakeIdentities: [{ value: "Inspector Sharma", confidence: 92, timestamp: Date.now() }] },
                killChainStage: 'Exploitation',
                fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: 'Voice Fraud' },
                recommendedActions: ["Do not respond to the message", "Block the sender", "Report on CyberCrime portal"]
              };
              onAnalysisComplete("[SIMULATED VOICE SCAM]", simResult as any);
            }}
            className="px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-all"
          >
            Simulate Voice Scam
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(VoiceScanner);
