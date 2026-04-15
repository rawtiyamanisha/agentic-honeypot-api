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
  const [activeTab, setActiveTab] = useState<'overview' | 'dossiers' | 'library' | 'global' | 'clusters' | 'network'>('overview');
  const [globalStream, setGlobalStream] = useState<string[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  
  const currentLogs = Array.isArray(logs) ? logs : [];

  // Auto-select latest if none selected and logs exist
  useEffect(() => {
    if (!selectedDossierId && currentLogs.length > 0) {
      setSelectedDossierId(currentLogs[0].id);
    }
  }, [currentLogs, selectedDossierId]);

  const selectedDossier = useMemo(() => 
    currentLogs.find(l => l.id === selectedDossierId) || null
  , [currentLogs, selectedDossierId]);

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

  const analytics = useMemo((): AnalyticsSummary & { locationStats: any } => {
    const totalPrevention = currentLogs.reduce((sum, log) => sum + (log.estimatedImpact || 0), 0);
    
    const recentLogs = currentLogs.filter(l => l.timestamp > Date.now() - 3600000);
    let threatPosture: ThreatPosture = 'Green';
    if (recentLogs.length > 20) threatPosture = 'Red';
    else if (recentLogs.length > 10) threatPosture = 'Yellow';

    const idCounts: Record<string, { val: string, type: string, count: number }> = {};
    const countryCounts: Record<string, number> = {};
    const stateCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};

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

      if (log.sourceIntelligence) {
        const { country, state, city } = log.sourceIntelligence;
        if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
        if (state) stateCounts[state] = (stateCounts[state] || 0) + 1;
        if (city) cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });

    const topIdentifiers = Object.values(idCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ value: item.val, type: item.type, count: item.count }));

    const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const library: ScamSignature[] = currentLogs
      .filter(l => l.isScam)
      .slice(0, 100)
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
      },
      locationStats: {
        countries: topCountries,
        states: topStates,
        cities: topCities
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
        <TabNav active={activeTab === 'dossiers'} onClick={() => setActiveTab('dossiers')} label="Case Dossiers" />
        <TabNav active={activeTab === 'clusters'} onClick={() => setActiveTab('clusters')} label="Clusters" />
        <TabNav active={activeTab === 'network'} onClick={() => setActiveTab('network')} label="Network" />
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

              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                       <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
                       Threat Hotspots
                    </h3>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global // National // Local</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Top Countries</h4>
                      <div className="space-y-2">
                        {analytics.locationStats.countries.map(([name, count]: any) => (
                          <div key={name} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">{name}</span>
                            <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{count}</span>
                          </div>
                        ))}
                        {analytics.locationStats.countries.length === 0 && <div className="text-[10px] text-slate-400 italic font-bold uppercase tracking-widest">No data</div>}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Top States</h4>
                      <div className="space-y-2">
                        {analytics.locationStats.states.map(([name, count]: any) => (
                          <div key={name} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">{name}</span>
                            <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{count}</span>
                          </div>
                        ))}
                        {analytics.locationStats.states.length === 0 && <div className="text-[10px] text-slate-400 italic font-bold uppercase tracking-widest">No data</div>}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Top Cities</h4>
                      <div className="space-y-2">
                        {analytics.locationStats.cities.map(([name, count]: any) => (
                          <div key={name} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">{name}</span>
                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{count}</span>
                          </div>
                        ))}
                        {analytics.locationStats.cities.length === 0 && <div className="text-[10px] text-slate-400 italic font-bold uppercase tracking-widest">No data</div>}
                      </div>
                    </div>
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

      {activeTab === 'dossiers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {currentLogs.map((log, index) => (
              <button 
                key={log.id}
                onClick={() => setSelectedDossierId(log.id)}
                className={`w-full p-6 rounded-3xl border text-left transition-all ${
                  selectedDossierId === log.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xl' 
                    : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    selectedDossierId === log.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Case {currentLogs.length - index}
                  </span>
                  <span className={`text-[8px] font-black uppercase ${
                    selectedDossierId === log.id ? 'text-blue-100' : 'text-blue-600'
                  }`}>
                    {log.id}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">👉</span>
                  <p className="text-xs font-bold line-clamp-2">"This is a {log.scamType.toLowerCase()}"</p>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-[9px] opacity-60">Turns: {log.messages?.length || 0}</span>
                  <span className="text-[9px] opacity-60">•</span>
                  <span className="text-[9px] opacity-60">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </button>
            ))}
            {currentLogs.length === 0 && (
              <div className="py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No active dossiers.</div>
            )}
          </div>
          
          <div className="lg:col-span-8">
            {selectedDossier ? (
              <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[600px]">
                <header className="p-8 border-b border-white/5 bg-white/5">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Case Engagement Log: {selectedDossier.id}</h3>
                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">Status: {selectedDossier.status} // Threat: {selectedDossier.threatLevel}</p>
                </header>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                  {/* Intelligence Breakdown for Demo */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Risk Level</div>
                      <div className={`text-lg font-black uppercase ${
                        selectedDossier.threatLevel === 'Critical' || selectedDossier.threatLevel === 'High' ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {selectedDossier.threatLevel}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Primary Intent</div>
                      <div className="text-lg font-black text-white uppercase truncate">
                        {selectedDossier.scamType}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Entities Extracted</div>
                      <div className="text-lg font-black text-emerald-500">
                        {(selectedDossier.extractedInfo?.upiIds?.length || 0) + 
                         (selectedDossier.extractedInfo?.phoneNumbers?.length || 0) + 
                         (selectedDossier.extractedInfo?.links?.length || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Extracted Entities</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDossier.extractedInfo?.upiIds?.map((id, i) => (
                        <span key={`upi-${i}`} className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-lg font-mono">{id.value}</span>
                      ))}
                      {selectedDossier.extractedInfo?.phoneNumbers?.map((id, i) => (
                        <span key={`tel-${i}`} className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg font-mono">{id.value}</span>
                      ))}
                      {selectedDossier.extractedInfo?.links?.map((id, i) => (
                        <span key={`url-${i}`} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded-lg font-mono truncate max-w-[200px]">{id.value}</span>
                      ))}
                      {selectedDossier.extractedInfo?.fakeIdentities?.map((id, i) => (
                        <span key={`fake-${i}`} className="px-3 py-1 bg-slate-600/20 border border-slate-500/30 text-slate-400 text-[10px] font-bold rounded-lg font-mono">{id.value}</span>
                      ))}
                      {(!selectedDossier.extractedInfo?.upiIds?.length && !selectedDossier.extractedInfo?.phoneNumbers?.length && !selectedDossier.extractedInfo?.links?.length && !selectedDossier.extractedInfo?.fakeIdentities?.length) && (
                        <span className="text-[10px] text-slate-500 italic">No entities extracted yet.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Engagement Log</div>
                    {selectedDossier.messages?.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'scammer' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'scammer' 
                          ? 'bg-slate-900 text-slate-200 border border-white/5' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        <div className="text-[8px] font-black uppercase opacity-50 mb-1">
                          {m.role === 'scammer' ? 'Adversary' : 'Sovereign Agent'}
                        </div>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
                <footer className="p-6 bg-black/40 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                         <div className="text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase">Risk</div>
                            <div className="text-xs font-black text-red-500">{selectedDossier.riskScore}</div>
                         </div>
                         <div className="text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase">Intel</div>
                            <div className="text-xs font-black text-emerald-500">{(selectedDossier.extractedInfo?.upiIds?.length || 0) + (selectedDossier.extractedInfo?.phoneNumbers?.length || 0)}</div>
                         </div>
                         {selectedDossier.sessionScore && (
                           <>
                             <div className="text-center">
                                <div className="text-[8px] font-black text-slate-500 uppercase">Accuracy</div>
                                <div className="text-xs font-black text-blue-500">{selectedDossier.sessionScore.scamTypeAccuracy}%</div>
                             </div>
                             <div className="text-center">
                                <div className="text-[8px] font-black text-slate-500 uppercase">Depth</div>
                                <div className="text-xs font-black text-indigo-500">{selectedDossier.sessionScore.conversationDepth}</div>
                             </div>
                             <div className="text-center">
                                <div className="text-[8px] font-black text-slate-500 uppercase">Response</div>
                                <div className="text-xs font-black text-orange-500">
                                  {selectedDossier.sessionScore.timeToFirstUPI ? `${selectedDossier.sessionScore.timeToFirstUPI}s` : 'N/A'}
                                </div>
                             </div>
                           </>
                         )}
                      </div>
                      <div className="text-[9px] font-mono text-blue-500/50">{selectedDossier.governance?.evidenceIntegrityHash}</div>
                   </div>
                </footer>
              </div>
            ) : (
              <div className="h-[600px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <span className="text-6xl">📂</span>
                <span className="text-xs font-black uppercase tracking-widest">Select a dossier to view engagement logs</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'clusters' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl space-y-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-navy-900 uppercase tracking-tighter">Pattern Clusters</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Identifying Systemic Fraud Vectors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(analytics.scamLibrary.reduce((acc: any, log: any) => {
              if (!acc[log.type]) acc[log.type] = [];
              acc[log.type].push(log);
              return acc;
            }, {})).map(([type, msgs]: any) => (
              <div key={type} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-slate-900 uppercase">{type}</h4>
                  <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full">{msgs.length} Cases</span>
                </div>
                <div className="space-y-2">
                  {msgs.slice(0, 3).map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-slate-600 italic">
                      "{m.firstMessage.slice(0, 100)}..."
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {analytics.scamLibrary.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No clusters identified yet.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl space-y-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-navy-900 uppercase tracking-tighter">Fraud Network Map</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Visualizing Entity Relationships</p>
          </div>
          <div className="relative h-[500px] bg-slate-950 rounded-[2rem] overflow-hidden border-4 border-slate-900 shadow-inner flex items-center justify-center">
             {/* Simple SVG Network Map */}
             <svg className="w-full h-full">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#2563EB" />
                  </marker>
                </defs>
                {analytics.topIdentifiers.map((id, i) => {
                  const angle = (i / analytics.topIdentifiers.length) * 2 * Math.PI;
                  const x = 400 + 200 * Math.cos(angle);
                  const y = 250 + 150 * Math.sin(angle);
                  return (
                    <g key={id.value}>
                      {analytics.topIdentifiers.slice(i + 1).map((target, j) => {
                        const targetAngle = ((i + j + 1) / analytics.topIdentifiers.length) * 2 * Math.PI;
                        const tx = 400 + 200 * Math.cos(targetAngle);
                        const ty = 250 + 150 * Math.sin(targetAngle);
                        return (
                          <line key={`${id.value}-${target.value}`} x1={x} y1={y} x2={tx} y2={ty} stroke="#2563EB" strokeWidth="1" strokeOpacity="0.3" />
                        );
                      })}
                      <circle cx={x} cy={y} r="30" fill="#1E293B" stroke="#2563EB" strokeWidth="2" />
                      <text x={x} y={y + 45} textAnchor="middle" fill="#94A3B8" className="text-[8px] font-black uppercase">{id.value.slice(0, 15)}</text>
                      <text x={x} y={y + 5} textAnchor="middle" fill="white" className="text-[10px] font-black">{id.type}</text>
                    </g>
                  );
                })}
                {analytics.topIdentifiers.length === 0 && (
                  <text x="50%" y="50%" textAnchor="middle" fill="#475569" className="text-xs font-black uppercase tracking-widest">Insufficient Data for Network Mapping</text>
                )}
             </svg>
             <div className="absolute top-6 left-6 flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Correlation Active</span>
             </div>
          </div>
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

export default React.memo(IntelligenceDashboard);