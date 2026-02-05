import React, { useState } from 'react';
import { generateSyntheticBaitImage, generateBaitVideo } from '../services/geminiService';
import { IntelligenceLog } from '../types';

interface Props {
  logs: IntelligenceLog[];
  onRunSimulation?: (count: number) => void;
}

const ScenarioCard = ({ title, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left transition-all hover:scale-[1.02] hover:bg-white/10 group flex flex-col justify-between h-44"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color} shadow-lg group-hover:animate-bounce`}>{icon}</div>
    <div className="space-y-1">
       <h4 className="text-sm font-black text-white uppercase tracking-tight">{title}</h4>
       <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Launch Use Case →</div>
    </div>
  </button>
);

const WarRoom: React.FC<Props> = ({ logs, onRunSimulation }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('An Indian police officer sitting in a formal office, low-angle shot, cinematic lighting');
  const [forgeLog, setForgeLog] = useState<string[]>(["WAR_ROOM_INITIALIZED", "GRID_STABLE"]);

  const runForge = async (type: string) => {
    setIsGenerating(true);
    setForgeLog(prev => [`INITIATING_${type}_SYNTHESIS`, ...prev]);
    try {
      const prompt = type === 'ID' 
        ? "high-security Aadhaar-style government ID card, front view, with placeholder text"
        : "official Indian bank transaction receipt with heavy security watermark";
      
      const url = await generateSyntheticBaitImage(prompt);
      setGeneratedId(url);
      setForgeLog(prev => [`${type}_FORGE_COMPLETE`, ...prev]);
    } catch (e) {
      setForgeLog(prev => [`FORGE_ERROR: ${e}`, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const runVideoForge = async () => {
    setIsVideoGenerating(true);
    setForgeLog(prev => ["INITIATING_VEO_VIDEO_GEN", ...prev]);
    try {
      const url = await generateBaitVideo(videoPrompt);
      setGeneratedVideo(url);
      setForgeLog(prev => ["VIDEO_READY_FOR_DEPLOYMENT", ...prev]);
    } catch (e) {
      setForgeLog(prev => [`VIDEO_ERROR: ${e}`, ...prev]);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-navy-900 tracking-tighter uppercase">Operations <span className="text-blue-600">War Room</span></h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Stress-test the system or create forensic bait assets for live operations.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => onRunSimulation?.(5000)}
             className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-red-500 transition-all active:scale-95"
           >
             Populate 5,000 Stats
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <ScenarioCard icon="🏛️" title="Digital Arrest" color="bg-orange-600" onClick={() => {}} />
         <ScenarioCard icon="💼" title="Job Task Fraud" color="bg-blue-600" onClick={() => {}} />
         <ScenarioCard icon="📉" title="Stock Market Scam" color="bg-emerald-600" onClick={() => {}} />
         <ScenarioCard icon="🛂" title="Passport/Customs" color="bg-indigo-600" onClick={() => {}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-slate-950 rounded-[3rem] p-12 border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
              <div className="relative z-10 flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.5em] mb-2">Live Threat Simulator</h3>
                    <h4 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Global Attack Matrix</h4>
                 </div>
                 <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking 12 Active Rings</span>
                 </div>
              </div>
              
              <div className="aspect-video bg-black/40 rounded-3xl border border-white/5 relative flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]" />
                 <svg className="w-full h-full text-blue-900/40 fill-current p-10" viewBox="0 0 800 600">
                    <path d="M400,100 L450,150 L500,130 L550,200 L600,250 L580,350 L620,450 L550,550 L500,700 L450,850 L350,850 L300,750 L250,650 L200,550 L180,450 L220,350 L200,250 L250,150 Z" />
                 </svg>
                 <div className="absolute top-[30%] left-[50%] w-4 h-4 bg-red-500 rounded-full animate-ping" />
                 <div className="absolute top-[55%] left-[42%] w-4 h-4 bg-orange-500 rounded-full animate-ping" />
                 <div className="absolute top-[20%] left-[25%] w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                 <div className="absolute bottom-10 left-10 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/80 p-3 rounded-lg border border-white/10">Sovereign Map v4.2 // Grid Online</div>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-[3rem] p-10 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Veo Video Forge</h4>
                 <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">Beta Testing</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center relative group">
                    {generatedVideo ? (
                      <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center opacity-30 space-y-2">
                         <span className="text-4xl block">🎬</span>
                         <span className="text-[9px] font-black uppercase tracking-widest">Awaiting Synthesis</span>
                      </div>
                    )}
                 </div>
                 <div className="space-y-4">
                    <textarea 
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all resize-none"
                      placeholder="Describe the background environment for the bait video..."
                    />
                    <button 
                      onClick={runVideoForge} 
                      disabled={isVideoGenerating}
                      className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isVideoGenerating ? 'Synthesizing...' : 'Generate 720p Bait Video'}
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-950 rounded-[3rem] p-10 h-full border border-white/5 shadow-2xl flex flex-col">
              <header className="mb-10">
                 <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Forensic Identity Lab</h3>
                 <h4 className="text-2xl font-black text-white uppercase tracking-tight">ID Forge Engine</h4>
              </header>

              <div className="flex-1 space-y-6">
                 <div className="aspect-[3/4] bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden flex items-center justify-center relative">
                    {generatedId ? (
                      <img src={generatedId} className="w-full h-full object-cover animate-in zoom-in-95 duration-700" />
                    ) : (
                      <div className="text-center opacity-20 space-y-2">
                         <span className="text-6xl block">🛂</span>
                         <span className="text-[10px] font-black uppercase tracking-widest">Forge Idle</span>
                      </div>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => runForge('ID')} disabled={isGenerating} className="py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl transition-all">Identity Card</button>
                    <button onClick={() => runForge('BANK')} disabled={isGenerating} className="py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl transition-all">Bank Receipt</button>
                 </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/10 flex-1 flex flex-col overflow-hidden">
                 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Forge Operations Log</h5>
                 <div className="space-y-3 overflow-y-auto no-scrollbar flex-1">
                    {forgeLog.map((log, i) => (
                      <div key={i} className="font-mono text-[9px] text-blue-400 border-l-2 border-blue-600 pl-3 py-1">
                        [{new Date().toLocaleTimeString()}] {log}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WarRoom;