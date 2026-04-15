import React, { useState } from 'react';
import { IntelligenceLog, GroundingSource } from '../types';
import { findLocalCyberCell, generateSpeech } from '../services/geminiService';
import ForensicLab from './ForensicLab';
import KillChainVisualizer from './KillChainVisualizer';
import VisualRedFlags from './VisualRedFlags';

interface Props {
  analysis: IntelligenceLog;
  seniorMode?: boolean;
  onClose: () => void;
}

const ResultPanel: React.FC<Props> = ({ analysis, seniorMode, onClose }) => {
  const [localAuthorities, setLocalAuthorities] = useState<GroundingSource[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showI4CToast, setShowI4CToast] = useState(false);
  const [showReportToast, setShowReportToast] = useState(false);

  const handleI4CReport = () => {
    setShowI4CToast(true);
    setTimeout(() => setShowI4CToast(false), 5000);
  };

  const handleDownloadReport = () => {
    setShowReportToast(true);
    setTimeout(() => setShowReportToast(false), 5000);
  };
  
  const isScam = analysis.isScam;
  const guardian = analysis.guardianGuidance;
  const webGrounding = (analysis.groundingSources || []).filter(s => s.type === 'web');

  const riskIndicator = analysis.isScam 
    ? (analysis.threatLevel === 'Critical' ? '🔴 High Risk Scam' : '🟡 Suspicious') 
    : '🟢 Safe';

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
      if (ctx.state === 'suspended') await ctx.resume();
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
        {analysis.channel === 'video' && (
          <div className="relative aspect-video bg-black overflow-hidden border-b-8 border-red-600 group">
            <img 
              src={analysis.summary.toLowerCase().includes('police') || analysis.summary.toLowerCase().includes('uniform') || analysis.summary.toLowerCase().includes('officer')
                ? "https://picsum.photos/seed/police-station/1280/720" 
                : "https://picsum.photos/seed/office-interview/1280/720"} 
              className="w-full h-full object-cover opacity-60 grayscale-[0.3] blur-[1px]" 
              referrerPolicy="no-referrer"
              alt="Intercepted Video Feed"
            />
            <div className="absolute inset-0 pointer-events-none p-12">
              <div className="w-full h-full border-2 border-red-500/30 relative">
                <div className="absolute top-8 left-8 flex items-center space-x-4">
                  <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xl font-black text-red-600 uppercase tracking-[0.3em]">
                    {analysis.summary.toLowerCase().includes('police') || analysis.summary.toLowerCase().includes('uniform') || analysis.summary.toLowerCase().includes('officer')
                      ? 'LIVE INTERCEPT: POLICE_HQ_MUMBAI' 
                      : 'LIVE INTERCEPT: SECURE_CHANNEL_ALPHA'}
                  </span>
                </div>
                <div className="absolute bottom-8 right-8 text-right">
                  <div className="text-2xl font-mono text-red-500 font-black">REC 00:0{Math.floor(Math.random() * 9)}:2{Math.floor(Math.random() * 9)}</div>
                  <div className="text-xs font-mono text-red-500/70">{new Date().toISOString()}</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-red-600/90 text-white px-12 py-6 border-4 border-white/50 animate-pulse font-black uppercase tracking-[0.5em] text-4xl rounded-3xl shadow-2xl rotate-[-5deg]">
                      DEEPFAKE DETECTED
                   </div>
                </div>
                <div className="absolute inset-x-0 h-px bg-red-500/40 shadow-[0_0_20px_red] animate-[scan_3s_infinite]" />
              </div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
          </div>
        )}
        <div className="px-12 py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex flex-col lg:flex-row items-center gap-10 text-center lg:text-left">
            <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center text-6xl shadow-2xl ${
              isScam ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isScam ? '⚠️' : '✅'}
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{isScam ? '🔴' : '🟢'}</span>
                {analysis.scamType?.includes('Deepfake') && (
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white shadow-sm animate-pulse">
                    Deepfake Detected
                  </span>
                )}
                <h2 className={`text-6xl font-black uppercase tracking-tighter ${
                  isScam ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {isScam ? analysis.scamType.toUpperCase() : 'MESSAGE IS SAFE'}
                </h2>
              </div>
              <p className="text-slate-600 font-bold uppercase text-lg tracking-widest">{riskIndicator} | THREAT LEVEL: {analysis.threatLevel.toUpperCase()}</p>
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
            <div className="flex items-center space-x-8">
              <div className="text-center lg:text-right">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Risk Score</div>
                <div className={`text-5xl font-black ${analysis.riskScore > 70 ? 'text-red-600' : analysis.riskScore > 30 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                  {analysis.riskScore}/100
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AI Confidence</div>
                <div className="text-5xl font-black text-slate-900">{(analysis.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-t-[4rem]">
          <div className="space-y-10">
            <div className="space-y-6" role="alert" aria-live="polite">
              {isScam && (
                <div className="p-10 bg-yellow-50 border-4 border-yellow-200 rounded-[3rem] shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <span className="text-8xl">⚠️</span>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-xs font-black text-yellow-800 uppercase tracking-[0.3em] flex items-center">
                      <span className="mr-2">🧐</span> Forensic Verdict
                    </h4>
                    <h3 className="text-3xl font-black text-yellow-950 tracking-tight">
                      {analysis.scamType} • {analysis.threatLevel} Risk
                    </h3>
                  </div>
                  
                  <p className="text-xl font-bold text-yellow-900 leading-relaxed relative z-10">
                    {analysis.summary}
                  </p>

                  {analysis.warningSignals && analysis.warningSignals.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-4 relative z-10">
                      {analysis.warningSignals.map((signal, i) => (
                        <span key={i} className="px-5 py-2.5 bg-white/60 border-2 border-yellow-300 text-yellow-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm flex items-center">
                          <span className="mr-2 text-xs">🔍</span> {signal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isScam && (
                <>
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em]">Analysis Summary:</h4>
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 italic">
                    {analysis.summary}
                  </p>
                </>
              )}

              {analysis.warningSignals && analysis.warningSignals.length > 0 && (
                <>
                  <h4 className="text-xs font-black text-red-600 uppercase tracking-[0.4em] pt-6">Key Warning Signals (Red Flags):</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.warningSignals.map((signal, i) => (
                      <div key={i} className="flex items-center space-x-4 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                        <span className="text-red-600 text-xl">🚩</span>
                        <span className="text-lg font-bold text-red-900">{signal}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] pt-6">Recommended Actions:</h4>
              <p className="text-3xl font-black text-slate-900 leading-tight">{guardian?.user_alert}</p>
              <div className="space-y-4 pt-4">
                {(analysis.recommendedActions || []).map((step, i) => (
                  <div key={i} className="flex items-center space-x-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-xl">{i + 1}</div>
                    <span className="text-xl font-bold text-slate-800">{step}</span>
                  </div>
                ))}
                {isScam && (
                  <>
                    <div className="flex items-center space-x-6 bg-red-50 p-6 rounded-3xl border-2 border-red-100 shadow-sm">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl">!</div>
                      <span className="text-xl font-bold text-red-800">Do not click any links</span>
                    </div>
                    <div className="flex items-center space-x-6 bg-red-50 p-6 rounded-3xl border-2 border-red-100 shadow-sm">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl">!</div>
                      <span className="text-xl font-bold text-red-800">Do not share OTP or personal details</span>
                    </div>
                    <div className="flex items-center space-x-6 bg-red-50 p-6 rounded-3xl border-2 border-red-100 shadow-sm">
                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl">!</div>
                      <span className="text-xl font-bold text-red-800">Report immediately to 1930</span>
                    </div>
                  </>
                )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {localAuthorities.map((auth, i) => (
                    <div key={i} className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-black text-emerald-900 uppercase">{auth.title}</p>
                        <p className="text-sm text-emerald-700 font-bold opacity-80">{auth.address}</p>
                      </div>
                      <a href={auth.uri} target="_blank" className="px-8 py-4 bg-white text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-500 hover:text-white transition-all">Directions</a>
                    </div>
                  ))}
                  <button 
                    onClick={handleDownloadReport}
                    className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl flex items-center justify-between hover:bg-blue-100 transition-all group"
                  >
                    <div className="space-y-1">
                      <p className="text-lg font-black text-blue-900 uppercase">Forensic Report</p>
                      <p className="text-sm text-blue-700 font-bold opacity-80">Download PDF Dossier</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform">📄</div>
                  </button>
                  <button 
                    onClick={handleI4CReport}
                    className="col-span-full bg-slate-900 text-white p-8 rounded-[2.5rem] border-4 border-slate-800 flex items-center justify-between group hover:bg-slate-800 transition-all shadow-2xl"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">🏛️</div>
                      <div className="text-left">
                        <p className="text-xl font-black uppercase tracking-tight">Report to I4C Portal</p>
                        <p className="text-xs font-black text-blue-400 uppercase tracking-widest opacity-80">National Cyber Crime Reporting Portal (GoI)</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                      <svg className="w-6 h-6 text-white group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {showReportToast && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] w-full max-w-2xl px-6 animate-in slide-in-from-bottom-12 duration-500">
              <div className="bg-white border-4 border-slate-900 p-8 rounded-[3rem] shadow-2xl flex items-center space-x-8">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl shadow-inner">📥</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Report Generated</h3>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
                    Forensic Dossier #BCR-7742 (PDF) has been generated and is ready for download.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showI4CToast && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] w-full max-w-2xl px-6 animate-in slide-in-from-bottom-12 duration-500">
              <div className="bg-slate-900 border-4 border-blue-600 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(37,99,235,0.4)] flex items-center space-x-8">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-lg animate-bounce">🏛️</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">I4C Integration Active</h3>
                  <p className="text-blue-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                    Evidence Dossier #BCR-7742 has been prepared. In production, this securely transmits the forensic log to the GoI National Portal.
                  </p>
                </div>
              </div>
            </div>
          )}

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

      {(analysis.scamType.toLowerCase().includes('digital arrest') || 
        analysis.scamType.toLowerCase().includes('police impersonation') || 
        analysis.scamType.toLowerCase().includes('video deepfake') ||
        analysis.scamType.toLowerCase().includes('video fraud')) && (
        <div className="pt-10">
          <VisualRedFlags />
        </div>
      )}

      <div className="flex justify-center pb-20">
        <button onClick={onClose} className="px-20 py-8 bg-white border-4 border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white rounded-[3rem] font-black uppercase text-xl tracking-[0.3em] transition-all hover:shadow-2xl active:scale-95">
          Close Report
        </button>
      </div>
    </div>
  );
};

export default React.memo(ResultPanel);