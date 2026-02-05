import React, { useState } from 'react';
import { IntelligenceLog, GroundingSource } from '../types';
import { findLocalCyberCell, generateSpeech } from '../services/geminiService';
import ForensicLab from './ForensicLab';
import KillChainVisualizer from './KillChainVisualizer';

interface Props {
  analysis: IntelligenceLog;
  seniorMode?: boolean;
  onClose: () => void;
}

const ResultPanel: React.FC<Props> = ({ analysis, seniorMode, onClose }) => {
  const [localAuthorities, setLocalAuthorities] = useState<GroundingSource[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const isScam = analysis.isScam;
  const guardian = analysis.guardianGuidance;
  const webGrounding = (analysis.groundingSources || []).filter(s => s.type === 'web');

  const handleLocateAuthorities = async () => {
    setIsLocating(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const results = await findLocalCyberCell(pos.coords.latitude, pos.coords.longitude);
        setLocalAuthorities(results);
        setIsLocating(false);
      }, (err) => {
        console.error(err);
        setIsLocating(false);
        alert("Please allow location access to find the nearest Cyber Police station.");
      });
    } catch (e) {
      console.error(e);
      setIsLocating(false);
    }
  };

  const speakReport = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const textToSpeak = `${isScam ? 'Alert: This is a scam message.' : 'Good news: This message appears safe.'} ${guardian?.user_alert || analysis.summary}. I recommend you: ${guardian?.what_to_do_now.join('. ')}`;
      const audioBuffer = await generateSpeech(textToSpeak, 'Kore');
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      console.error("Speech synthesis failed", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700" role="region" aria-label="Scam Analysis Result">
      <div className={`rounded-[4rem] border-8 shadow-2xl overflow-hidden ${
          isScam ? 'bg-red-50 border-red-600' : 'bg-emerald-50 border-emerald-600'
        }`}>
        <div className="px-12 py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex flex-col lg:flex-row items-center gap-10 text-center lg:text-left">
            <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center text-6xl shadow-2xl ${
              isScam ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isScam ? '⚠️' : '✅'}
            </div>
            <div className="space-y-3">
              <h2 className={`text-6xl font-black uppercase tracking-tighter ${
                isScam ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {isScam ? 'STOP! IT\'S A SCAM' : 'MESSAGE IS SAFE'}
              </h2>
              <p className="text-slate-600 font-bold uppercase text-lg tracking-widest">SCANNED BY NATIONAL AI DEFENSE</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center lg:items-end gap-6">
            <button 
              onClick={speakReport}
              disabled={isSpeaking}
              className={`flex items-center space-x-4 px-12 py-6 rounded-[2.5rem] font-black uppercase text-xl transition-all ${isSpeaking ? 'bg-slate-200 text-slate-400' : 'bg-slate-950 text-white hover:bg-slate-800 shadow-2xl scale-110 active:scale-95'}`}
              aria-label="Click to hear this report spoken out loud"
            >
              <span className="text-3xl">{isSpeaking ? '🔊' : '🔈'}</span>
              <span>{isSpeaking ? 'Reading...' : 'Listen to Result'}</span>
            </button>
            <div className="text-center lg:text-right">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AI Confidence Score</div>
              <div className="text-5xl font-black text-slate-900">{(analysis.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-t-[4rem]">
          <div className="space-y-10">
            <div className="space-y-6" role="alert" aria-live="polite">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em]">What you should do now:</h4>
              <p className="text-3xl font-black text-slate-900 leading-tight">{guardian?.user_alert}</p>
              <div className="space-y-4 pt-4">
                {(guardian?.what_to_do_now || []).map((step, i) => (
                  <div key={i} className="flex items-center space-x-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-xl">{i + 1}</div>
                    <span className="text-xl font-bold text-slate-800">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {isScam && (
              <div className="space-y-6 pt-10 border-t-2 border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.4em]">Find Police Help:</h4>
                  {!localAuthorities.length && (
                    <button onClick={handleLocateAuthorities} disabled={isLocating} className="text-sm font-black bg-emerald-600 text-white px-8 py-4 rounded-2xl uppercase tracking-widest transition-all hover:bg-emerald-500 shadow-xl disabled:opacity-50">
                      {isLocating ? 'Locating...' : 'Find Nearest Cyber Cell'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {localAuthorities.map((auth, i) => (
                    <div key={i} className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-black text-emerald-900 uppercase">{auth.title}</p>
                        <p className="text-sm text-emerald-700 font-bold opacity-80">{auth.address}</p>
                      </div>
                      <a href={auth.uri} target="_blank" className="px-8 py-4 bg-white text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-500 hover:text-white transition-all">Directions</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-10">
             <div className="space-y-6">
                <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em]">Proof from the Web:</h4>
                <div className="grid grid-cols-1 gap-4">
                  {webGrounding.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl flex items-center justify-between group hover:bg-white transition-all hover:shadow-2xl">
                      <div className="flex items-center space-x-6 overflow-hidden">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{source.title}</p>
                          <p className="text-xs text-blue-600 font-black mt-1 uppercase tracking-widest">{new URL(source.uri).hostname}</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-blue-600 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  ))}
                </div>
             </div>

             {isScam && (
               <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-6 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="w-4 h-4 bg-red-600 rounded-full animate-ping" />
                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.5em]">Honeypot protocol active</h4>
                     </div>
                     <h3 className="text-3xl font-black tracking-tight leading-none mb-4">I am engaging this scammer right now.</h3>
                     <p className="text-lg text-slate-400 font-medium leading-relaxed">
                       Don't worry. I am pretending to be a confused user to trap them. Scroll down to see the live chat.
                     </p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-10">
        <div className="lg:col-span-4"><KillChainVisualizer analysis={analysis} /></div>
        <div className="lg:col-span-8"><ForensicLab analysis={analysis} /></div>
      </div>

      <div className="flex justify-center pb-20">
        <button onClick={onClose} className="px-20 py-8 bg-white border-4 border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white rounded-[3rem] font-black uppercase text-xl tracking-[0.3em] transition-all hover:shadow-2xl active:scale-95">
          Close Report
        </button>
      </div>
    </div>
  );
};

export default ResultPanel;