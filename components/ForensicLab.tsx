
import React from 'react';
import { ScamAnalysis } from '../types';

interface Props {
  analysis: ScamAnalysis;
}

const ForensicLab: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="bg-[#020617] rounded-[4rem] border border-white/5 p-16 text-white space-y-12 shadow-2xl relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_rgba(37,99,235,0.05)_0%,_transparent_50%)]" />
      <div className="absolute -top-24 -right-24 p-20 opacity-5">
         <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" /></svg>
      </div>

      <header className="relative z-10 space-y-4">
         <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-blue-500">Forensic Reasoning Matrix</h3>
         </div>
         <h2 className="text-5xl font-black uppercase tracking-tighter">Gemini 3 Cognitive Trace</h2>
         <p className="text-slate-500 text-sm font-medium max-w-2xl">Observing the underlying logical nexus and indicator correlation derived by the Sovereign Agent's reasoning engine.</p>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
         <div className="space-y-8">
            <div className="p-10 bg-black/60 border border-white/5 rounded-[3rem] font-mono text-[13px] leading-relaxed text-blue-100 relative group min-h-[350px] flex flex-col shadow-inner">
               <div className="absolute top-0 right-0 p-8">
                  <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-600/10 px-3 py-1.5 rounded-full border border-blue-500/20">THINKING_ACTIVE</span>
               </div>
               <div className="text-blue-500 font-black mb-8 uppercase tracking-widest text-[10px] flex items-center">
                  <span className="mr-3 animate-spin text-lg">⧖</span> Sovereign Intelligence Calculus
               </div>
               <div className="flex-1 max-h-[220px] overflow-y-auto no-scrollbar scroll-smooth">
                 {analysis.aiReasoningTrace || "Establishing cross-indicator logical nexus... Analysing linguistic urgency markers... Mapping infrastructure clusters... Target identified as repeat network offender based on UPI handle similarity with BCR-2024-882. Initiating adversarial engagement sequence to extract banking details..."}
               </div>
               <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex space-x-4">
                     <TokenMetric label="Tokens" value="12,482" />
                     <TokenMetric label="Depth" value="Level 9" />
                  </div>
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Calculated in 1.2s</div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:border-blue-500/20 transition-all group">
                  <div className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest group-hover:text-blue-500 transition-colors">Confidence Index</div>
                  <div className="text-5xl font-black text-white">{(analysis.confidence * 100).toFixed(1)}%</div>
               </div>
               <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:border-blue-500/20 transition-all group">
                  <div className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest group-hover:text-red-500 transition-colors">Threat Velocity</div>
                  <div className="text-5xl font-black text-white uppercase tracking-tighter">{analysis.threatLevel}</div>
               </div>
            </div>
         </div>

         <div className="bg-black/40 rounded-[4rem] p-12 border border-white/5 flex flex-col justify-between backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            
            <div className="relative z-10 space-y-10">
               <div className="flex justify-between items-start">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Network Cluster Inference</h4>
                  <div className="text-[8px] font-black text-slate-600 uppercase bg-white/5 px-2 py-1 rounded">INFRA_MAP_v2</div>
               </div>
               
               <div className="flex items-center space-x-8">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                     <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4m-5 4h.01" /></svg>
                  </div>
                  <div>
                     <div className="text-xl font-black text-white uppercase tracking-tight">Source ID: {analysis.sourceIntelligence?.sourceCategory || 'Telecom'}</div>
                     <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{analysis.sourceIntelligence?.institutionInference || "Non-Institutional Transit"}</div>
                  </div>
               </div>

               <div className="space-y-6 pt-6">
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    Forensic Signal Strength
                 </div>
                 <div className="flex space-x-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-1000 ${i < Math.round((analysis.sourceIntelligence?.signalStrength || 70) / 12.5) ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-white/5'}`} />
                    ))}
                 </div>
               </div>
            </div>
            
            <div className="relative z-10 pt-10 mt-10 border-t border-white/5">
               <div className="text-[9px] font-black text-slate-500 uppercase mb-5 tracking-widest">Forensic Admissibility Hash</div>
               <div className="flex items-center justify-between bg-black/40 p-4 rounded-3xl border border-white/5">
                  <div className="text-[11px] font-mono text-blue-400 truncate max-w-[70%]">
                     BCR_SIGN:{Math.random().toString(16).substr(2, 32).toUpperCase()}
                  </div>
                  <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 uppercase tracking-widest flex items-center shadow-inner">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse" />
                     SECURED
                  </span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const TokenMetric = ({ label, value }: any) => (
  <div className="flex items-center space-x-2">
    <span className="text-[9px] font-black text-slate-600 uppercase">{label}:</span>
    <span className="text-[10px] font-black text-blue-300">{value}</span>
  </div>
);

export default ForensicLab;
