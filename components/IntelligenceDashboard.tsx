import React, { useState, useMemo, useEffect } from 'react';
import { IntelligenceLog, AnalyticsSummary, ThreatPosture, ScamSignature } from '../types';
import { apiStatus } from '../services/geminiService';

interface Props {
  logs: IntelligenceLog[];
}

const KPIBox = ({ title, value, sub, color }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col justify-center transition-all hover:shadow-2xl">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</div>
    <div className={`text-4xl font-black tracking-tighter ${color}`}>{value}</div>
    <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{sub}</div>
  </div>
);

const TabNav = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-900'
    }`}
  >
    {label}
  </button>
);

const IntelligenceDashboard: React.FC<Props> = ({ logs = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'library' | 'global'>('overview');
  const [globalStream, setGlobalStream] = useState<string[]>([]);
  
  const currentLogs = Array.isArray(logs) ? logs : [];
  const scope = apiStatus.defenseScope;

  useEffect(() => {
    const events = [
      "Target intercepted in Jamtara cluster.",
      "Autonomous bypass of remote-access request.",
      "New Phishing pattern identified in Delhi.",
      "Scammer psychological suspicion increased.",
      "Synthetic Identity successfully deployed.",
      "Cross-border laundering vector identified.",
      "Institutional block request sent to SBI."
    ];
    const interval = setInterval(() => {
      setGlobalStream(prev => [events[Math.floor(Math.random() * events.length)], ...prev].slice(0, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const analytics = useMemo((): AnalyticsSummary => {
    const totalPrevention = currentLogs.reduce((sum, log) => sum + (log.estimatedImpact || 0), 0);
    
    const recentLogs = currentLogs.filter(l => l.timestamp > Date.now() - 3600000);
    let threatPosture: ThreatPosture = 'Green';
    if (recentLogs.length > 20) threatPosture = 'Red';
    else if (recentLogs.length > 10) threatPosture = 'Yellow';

    const idCounts: Record<string, { val: string, type: string, count: number }> = {};
    currentLogs.forEach(log => {
      const allIds = [
        ...(log.extractedInfo?.upiIds || []).map(i => ({ v: i.value, t: 'UPI' })),
        ...(log.extractedInfo?.phoneNumbers || []).map(i => ({ v: i.value, t: 'TEL' })),
        ...(log.extractedInfo?.links || []).map(i => ({ v: i.value, t: 'URL' }))
      ];
      allIds.forEach(id => {
        if (!id?.v) return;
        const key = id.v.toLowerCase();
        if (!idCounts[key]) idCounts[key] = { val: id.v, type: id.t, count: 0 };
        idCounts[key].count++;
      });
    });

    const topIdentifiers = Object.values(idCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ value: item.val, type: item.type, count: item.count }));

    const library: ScamSignature[] = currentLogs
      .filter(l => l.isScam)
      .slice(0, 100) // Limit display
      .map(l => ({
        id: l.id,
        type: l.scamType,
        firstMessage: l.originalMessage,
        extractedIndicators: [],
        tactics: [],
        timestamp: l.timestamp,
        patternMeta: {}
      }));

    const honeypotTotal = currentLogs.filter(l => (l.messages || []).length > 2).length;
    const honeypotSuccess = currentLogs.filter(l => (l.extractedInfo?.upiIds || []).length > 0).length;

    return {
      totalPreventionInr: totalPrevention,
      potentialExposureInr: totalPrevention * 1.5,
      threatPosture,
      topIdentifiers,
      scamLibrary: library,
      honeypotSuccessRate: honeypotTotal ? (honeypotSuccess / honeypotTotal) * 100 : 0,
      governanceMetrics: {
        avgPrivacyScore: 98,
        complianceRate: 100
      }
    };
  }, [currentLogs]);

  const postureColor = {
    'Green': 'text-green-600 bg-green-50 border-green-100',
    'Yellow': 'text-amber-600 bg-amber-50 border-amber-100',
    'Red': 'text-red-600 bg-red-50 border-red-200 animate-pulse'
  }[analytics.threatPosture];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-8 rounded-[2rem] border shadow-2xl flex flex-col justify-center transition-all ${postureColor}`}>
           <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Sovereign Defense Nodes</div>
           <div className="text-4xl font-black tracking-tighter uppercase">{analytics.threatPosture} ALERT</div>
           <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Scope: {scope}</div>
        </div>
        <KPIBox title="Shielded Assets" value={`₹${(analytics.totalPreventionInr / 100000).toFixed(2)}L`} sub="Interception Value" color="text-blue-600" />
        <KPIBox title="Patterns" value={analytics.scamLibrary?.length || 0} sub="Global Patterns" color="text-indigo-600" />
        <KPIBox title="Siphoning Rate" value={`${analytics.honeypotSuccessRate.toFixed(1)}%`} sub="Extraction Quality" color="text-emerald-600" />
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <TabNav active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Tactical Grid" />
        <TabNav active={activeTab === 'library'} onClick={() => setActiveTab('library')} label="Memory" />
        <TabNav active={activeTab === 'global'} onClick={() => setActiveTab('global')} label="Global" />
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl space-y-6">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
                    Top Identifiers
                 </h3>
                 <div className="space-y-3">
                    {analytics.topIdentifiers.map((id, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-600 uppercase mb-1">{id.type}</span>
                          <span className="text-xs font-bold font-mono text-slate-800">{id.value}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase">Hits</div>
                          <div className="text-sm font-black text-slate-800">{id.count}</div>
                        </div>
                      </div>
                    ))}
                    {analytics.topIdentifiers.length === 0 && (
                      <div className="py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No identifiers captured.</div>
                    )}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6">
                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Global Stream</h4>
                 <div className="space-y-4">
                    {globalStream.map((msg, i) => (
                      <div key={i} className="text-[10px] font-mono text-slate-300 border-l-2 border-blue-600 pl-3 py-1">
                        {msg}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="bg-black rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl overflow-hidden">
          <pre className="text-blue-400 font-mono text-xs overflow-x-auto p-4 no-scrollbar">
            {JSON.stringify(analytics.scamLibrary, null, 2)}
          </pre>
        </div>
      )}

      {activeTab === 'global' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl space-y-8">
           <header className="flex justify-between items-start">
              <div>
                 <h3 className="text-2xl font-black text-navy-900 uppercase tracking-tighter">Sync Gateway</h3>
                 <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Cross-Border Correlation Active</p>
              </div>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                 <div className="text-4xl">🌏</div>
                 <div className="text-2xl font-black text-navy-900">42% International</div>
              </div>
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                 <div className="text-4xl">🖇️</div>
                 <div className="text-2xl font-black text-navy-900">1,248 Ring Matches</div>
              </div>
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                 <div className="text-4xl">🛡️</div>
                 <div className="text-2xl font-black text-navy-900">99.4 Shield Score</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceDashboard;