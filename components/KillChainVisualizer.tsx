import React, { useState } from 'react';
import { KillChainStage, ScamAnalysis } from '../types';
import { maskValue } from '../utils/masking';

interface Props {
  analysis: ScamAnalysis;
}

const stages: KillChainStage[] = ['Reconnaissance', 'Delivery', 'Exploitation', 'Actions on Objective'];

const KillChainVisualizer: React.FC<Props> = ({ analysis }) => {
  const [selectedStage, setSelectedStage] = useState<KillChainStage>(analysis.killChainStage);
  const currentIndex = stages.indexOf(analysis.killChainStage);
  const selectedIndex = stages.indexOf(selectedStage);

  const getStageContent = (stage: KillChainStage) => {
    switch (stage) {
      case 'Reconnaissance':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Inferred Origin</span>
                <div className="text-[10px] font-bold text-white uppercase">{analysis.sourceIntelligence?.likelyOrigin || 'Unknown'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Cluster Map</span>
                <div className="text-[10px] font-bold text-blue-400 font-mono">ID: {analysis.sourceIntelligence?.clusterId || 'PENDING'}</div>
              </div>
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 block">Rakshak System Action</span>
              <p className="text-[10px] text-slate-300 italic leading-relaxed">
                Identified source infrastructure via metadata triangulation. Correlated signature with existing {analysis.sourceIntelligence?.clusterId || 'unclassified'} ring.
              </p>
            </div>
          </div>
        );
      case 'Delivery':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Inbound Medium</span>
                <div className="text-[10px] font-bold text-white uppercase">{analysis.channel}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Latency</span>
                <div className="text-[10px] font-bold text-green-500 font-mono">112ms INTERCEPT</div>
              </div>
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 block">Rakshak System Action</span>
              <p className="text-[10px] text-slate-300 italic leading-relaxed">
                Autonomous payload interception. Message buffered for heuristic evaluation and pattern matching against Sovereign Memory Store.
              </p>
            </div>
          </div>
        );
      case 'Exploitation':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Intel Siphoned (IoCs)</span>
              <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">MALICIOUS</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar py-1">
              {(analysis.extractedInfo?.upiIds || []).map((u, i) => (
                <span key={i} className="text-[8px] font-mono text-white bg-blue-600/20 px-2 py-1 rounded border border-blue-500/30">{maskValue(u.value, 'UPI')}</span>
              ))}
              {(analysis.extractedInfo?.links || []).map((l, i) => (
                <span key={i} className="text-[8px] font-mono text-white bg-blue-600/20 px-2 py-1 rounded border border-blue-500/30">{maskValue(l.value, 'URL')}</span>
              ))}
              {(analysis.extractedInfo?.phoneNumbers || []).map((p, i) => (
                <span key={i} className="text-[8px] font-mono text-white bg-blue-600/20 px-2 py-1 rounded border border-blue-500/30">{maskValue(p.value, 'PHONE')}</span>
              ))}
              {(analysis.extractedInfo?.upiIds.length === 0 && analysis.extractedInfo?.links.length === 0) && <span className="text-[10px] text-slate-600">No technical indicators extracted yet.</span>}
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
              <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1 block">Rakshak System Action</span>
              <p className="text-[10px] text-slate-300 italic leading-relaxed">
                Extracted and masked technical indicators. Automatic blacklisting request initiated for institutional gateways.
              </p>
            </div>
          </div>
        );
      case 'Actions on Objective':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Prevention Value</span>
                <div className="text-[10px] font-bold text-green-500 font-mono">₹{analysis.potentialImpact?.toLocaleString() || '---'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Shield Status</span>
                <div className="text-[10px] font-bold text-blue-400 uppercase">ACTIVE_CONTAINMENT</div>
              </div>
            </div>
            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1 block">Rakshak System Action</span>
              <p className="text-[10px] text-slate-300 italic leading-relaxed">
                Engaged forensic bait agent to delay extraction. Generated sovereign safety alert for citizen containment.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-950/50 rounded-[2rem] border border-white/10 p-8 space-y-8 shadow-inner">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Cyber Kill Chain Visualization</h4>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Select nodes to drill down into specific forensic intel</p>
        </div>
        <div className="flex items-center space-x-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full ${analysis.isScam ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phase: {analysis.killChainStage}</span>
        </div>
      </div>

      <div className="relative flex justify-between items-center px-4 py-4">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-blue-500 -translate-y-1/2 z-0 transition-all duration-1000 shadow-[0_0_10px_#3b82f6]" 
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }} 
        />

        {stages.map((stage, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          const isSelected = stage === selectedStage;
          
          return (
            <button 
              key={stage} 
              onClick={() => setSelectedStage(stage)}
              className="relative z-10 flex flex-col items-center group"
            >
              <div className={`w-10 h-10 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center ${
                isSelected 
                ? 'bg-blue-600 border-white shadow-[0_0_30px_#3b82f6] -translate-y-1 scale-110' 
                : (isPast || isCurrent) 
                  ? 'bg-blue-900/40 border-blue-500 hover:border-white' 
                  : 'bg-slate-900 border-slate-800 opacity-60'
              } ${isCurrent ? 'animate-pulse' : ''}`}>
                {isPast && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCurrent && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />}
                {isFuture && <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />}
              </div>
              <span className={`absolute -bottom-8 text-[8px] font-black uppercase tracking-tighter text-center w-24 transition-all duration-300 ${
                isSelected ? 'text-white translate-y-1' : (isPast || isCurrent) ? 'text-blue-400' : 'text-slate-600'
              }`}>
                {stage}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-6">
        <div className="bg-black/60 rounded-3xl border border-white/5 p-6 min-h-[140px] flex flex-col justify-center relative overflow-hidden group/panel">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/panel:opacity-10 transition-opacity">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
          </div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">{selectedStage} Intelligence Drilldown</span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          {getStageContent(selectedStage)}
        </div>
      </div>
    </div>
  );
};

export default KillChainVisualizer;