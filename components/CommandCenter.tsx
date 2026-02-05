import React, { useMemo } from 'react';
import { IntelligenceLog } from '../types';

interface Props {
  logs: IntelligenceLog[];
}

const CommandCenter: React.FC<Props> = ({ logs }) => {
  const safeLogs = Array.isArray(logs) ? logs : [];
  
  const stats = useMemo(() => {
    const recent = safeLogs.filter(l => l.timestamp > Date.now() - 3600000);
    const sims = safeLogs.filter(l => l.id?.startsWith('SIM-'));
    return {
      activeThreats: recent.length,
      highVelocityRings: safeLogs.filter(l => l.threatLevel === 'Critical').length,
      globalReach: safeLogs.filter(l => l.sourceIntelligence?.isCrossBorder).length,
      preventionRate: 94.8,
      simulationStatus: sims.length > 0 ? 'Testing Resiliency' : 'Nominal',
      simulationCoverage: sims.length > 0 ? 88.4 : 100,
    };
  }, [safeLogs]);

  return (
    <div className="bg-slate-950 text-white min-h-[600px] rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_blue]">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Sovereign Command Center</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Defense Grid // Area: National
            </p>
          </div>
        </div>
        <div className="flex space-x-6 text-right">
           <div className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Readiness Status</div>
              <div className={`text-xl font-black ${stats.simulationStatus === 'Nominal' ? 'text-green-400' : 'text-blue-400 animate-pulse'}`}>
                {stats.simulationStatus}
              </div>
           </div>
           <div className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Containments</div>
              <div className="text-xl font-black text-blue-400">{stats.activeThreats}</div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Visual Threat Map Simulation */}
           <div className="aspect-video bg-slate-900 rounded-3xl border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.1)_0%,_transparent_70%)]" />
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-[80%] h-[80%] border border-blue-500/10 rounded-full animate-ping duration-1000" />
                 <div className="w-[60%] h-[60%] border border-blue-500/10 rounded-full animate-ping duration-[1500ms]" />
              </div>

              {/* Dynamic Threat Blips */}
              {(safeLogs || []).slice(0, 15).map((l, i) => (
                <div 
                  key={l.id || i} 
                  className="absolute animate-pulse" 
                  style={{ 
                    top: `${15 + Math.random() * 70}%`, 
                    left: `${15 + Math.random() * 70}%` 
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${l.threatLevel === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_red]' : (l.id?.startsWith('SIM-') ? 'bg-blue-400 shadow-[0_0_10px_blue]' : 'bg-blue-600')}`} />
                  <div className="absolute top-4 left-0 bg-black/80 text-[7px] font-black uppercase px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                    {l.scamType?.substring(0, 15)}...
                  </div>
                </div>
              ))}

              <div className="absolute bottom-6 right-6 flex items-center space-x-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Offshore</span>
                 </div>
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Active Sim</span>
                 </div>
              </div>

              <div className="absolute top-6 left-6">
                 <div className="bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center">
                    <svg className="w-3 h-3 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Coverage: {stats.simulationCoverage.toFixed(1)}% Subnet Scan
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Tactical Origin Distribution</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                       <span>International (Asia-Pac)</span>
                       <span>{Math.round(stats.globalReach / (safeLogs.length || 1) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-red-500" style={{ width: `${Math.round(stats.globalReach / (safeLogs.length || 1) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                       <span>Domestic (Internal)</span>
                       <span>{100 - Math.round(stats.globalReach / (safeLogs.length || 1) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${100 - Math.round(stats.globalReach / (safeLogs.length || 1) * 100)}%` }} />
                    </div>
                 </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">System Resilience Status</h4>
                 <div className="flex items-end justify-between h-16 space-x-1">
                    {[3, 5, 2, 8, 4, 9, 6, 4, 7, 5, 8, 3, 6].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm ${stats.simulationStatus === 'Nominal' ? 'bg-blue-500/20' : 'bg-green-500/30'}`} style={{ height: `${h * 10}%` }} />
                    ))}
                 </div>
                 <div className="mt-2 text-[9px] font-black text-slate-500 uppercase text-center tracking-widest">Integrity Hash Verified</div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse" />
              Strategic Intelligence Feed
           </h4>
           <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
              {safeLogs.filter(l => !l.id?.startsWith('SIM-')).map((log, i) => (
                <div key={log.id || i} className="bg-white/5 border border-white/5 p-4 rounded-2xl group hover:border-blue-500/50 transition-all cursor-pointer">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                          log.threatLevel === 'Critical' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {log.threatLevel}
                        </span>
                        {log.multiPlatformPropagation && (
                          <span className="text-[8px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase">CROSS-PLATFORM</span>
                        )}
                      </div>
                      <span className="text-[8px] font-bold text-slate-600 uppercase">#{log.id?.split('-').pop()}</span>
                   </div>
                   <div className="text-xs font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate">
                      {log.scamType}
                   </div>
                   <div className="mt-2 flex items-center justify-between">
                      <div className="text-[8px] font-black text-slate-500 uppercase">
                         Loss Potential: ₹{log.potentialImpact?.toLocaleString()}
                      </div>
                      <div className="text-[8px] font-black text-slate-500 uppercase">
                         {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </div>
              ))}
              {safeLogs.filter(l => !l.id?.startsWith('SIM-')).length === 0 && (
                <div className="py-20 text-center opacity-20 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                   No Interceptions Logged
                </div>
              )}
           </div>
           
           <div className="pt-6 border-t border-white/10">
              <button className="w-full py-4 bg-white/5 text-slate-400 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                 Download National Exposure Report
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;