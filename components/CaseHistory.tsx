import React, { useState } from 'react';
import { IntelligenceLog, OperationalRequest } from '../types';
import { maskValue } from '../utils/masking';
import { exportToJSON, exportToCSV, exportToTextForensic } from '../utils/export';

interface Props {
  logs: IntelligenceLog[];
  onUpdateStatus: (id: string, status: 'Open' | 'Investigating' | 'Blocked' | 'Resolved') => void;
  onSendRequest: (caseId: string, requestId: string) => void;
}

const CaseHistory: React.FC<Props> = ({ logs, onUpdateStatus, onSendRequest }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'governance' | 'interaction'>('evidence');
  
  const safeLogs = Array.isArray(logs) ? logs : [];
  const selectedCase = safeLogs.find(l => l.id === selectedCaseId);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[750px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Ops Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Operations Dossiers
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {safeLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Interception feed empty...</div>
          ) : (
            safeLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedCaseId(log.id)}
                className={`w-full text-left p-5 transition-all hover:bg-white flex flex-col space-y-2 ${selectedCaseId === log.id ? 'bg-white ring-2 ring-inset ring-blue-500/10' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border ${
                    log.status === 'Open' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    log.status === 'Blocked' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 font-mono">#{log.id}</span>
                </div>
                <div className="text-xs font-black text-slate-800 truncate">{log.scamType}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Forensic Dossier */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {selectedCase ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Dossier Header */}
            <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 mb-6">
                <div className="flex items-center space-x-5">
                   <div className={`p-4 rounded-2xl text-white shadow-xl ${selectedCase.threatLevel === 'Critical' ? 'bg-red-600' : 'bg-orange-500'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                        Case: {selectedCase.id}
                        <span className={`ml-3 px-2 py-0.5 rounded uppercase text-[8px] font-black ${
                          selectedCase.governance?.legalStanding === 'Verified Threat' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {selectedCase.governance?.legalStanding || 'Investigating'}
                        </span>
                      </h2>
                      <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Interception Date: {new Date(selectedCase.timestamp).toLocaleString()}</p>
                   </div>
                </div>
                <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {(['Open', 'Investigating', 'Blocked', 'Resolved'] as const).map(s => (
                    <button key={s} onClick={() => onUpdateStatus(selectedCase.id, s)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCase.status === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex space-x-6 border-b border-slate-100">
                 <DossierTab active={activeTab === 'evidence'} onClick={() => setActiveTab('evidence')} label="Evidence Indicators" />
                 <DossierTab active={activeTab === 'governance'} onClick={() => setActiveTab('governance')} label="Legal & Compliance" />
                 <DossierTab active={activeTab === 'interaction'} onClick={() => setActiveTab('interaction')} label="Forensic Transcript" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'evidence' && (
                <div className="space-y-12 animate-in fade-in">
                  {/* Containment Protocol */}
                  <section className="bg-slate-900 text-white rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
                     <div className="relative z-10">
                        <h3 className="text-lg font-black uppercase tracking-tight text-blue-400 mb-2">Priority Containment Protocol</h3>
                        <p className="text-xs text-slate-400 font-medium mb-6">Actionable requests for institutional partners. Pending institutional review.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {(selectedCase.operationalRequests || []).map(req => (
                              <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                 <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">{req.type?.replace('_', ' ')}</div>
                                    <div className="text-xs font-bold font-mono text-blue-300">{maskValue(req.target, 'UPI')}</div>
                                 </div>
                                 <button onClick={() => onSendRequest(selectedCase.id, req.id)} disabled={req.status !== 'Pending'} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${req.status === 'Pending' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-green-600/20 text-green-400 cursor-default'}`}>
                                    {req.status === 'Pending' ? 'Request Review' : req.status === 'Sent' ? 'Under Review' : 'Executed'}
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </section>

                  {/* Evidence List */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Extracted Forensics (Secure Masking)</h4>
                      <div className="space-y-3">
                        {selectedCase.extractedInfo ? (Object.entries(selectedCase.extractedInfo) as [string, any[]][]).map(([key, items]) => {
                          if (!Array.isArray(items) || items.length === 0) return null;
                          return items.map((item, idx) => (
                            <div key={`${key}-${idx}`} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                               <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-blue-600 uppercase mb-1">{key}</span>
                                  <span className="text-xs font-bold font-mono text-slate-800">{maskValue(item?.value || '', 'UPI')}</span>
                               </div>
                               <span className="text-[10px] font-black text-slate-400">{item?.confidence || 0}% AI CONFIDENCE</span>
                            </div>
                          ));
                        }) : <p className="text-xs text-slate-400">No forensic data extracted.</p>}
                      </div>
                    </section>
                    <section>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Operational Export</h4>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                          <ExportBtn label="Legal Evidence (TXT)" onClick={() => exportToTextForensic(selectedCase)} />
                          <ExportBtn label="Authority Data Packet (JSON)" onClick={() => exportToJSON(selectedCase)} />
                       </div>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === 'governance' && (
                <div className="space-y-12 animate-in fade-in">
                   <section className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-8">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Governance Compliance Review</h3>
                            <p className="text-xs text-slate-500 font-medium">Auditing case integrity and privacy alignment.</p>
                         </div>
                         <div className="bg-blue-50 p-4 rounded-2xl text-center min-w-[120px]">
                            <div className="text-[9px] font-black text-blue-600 uppercase mb-1">Privacy Score</div>
                            <div className="text-3xl font-black text-blue-600">{selectedCase.governance?.privacyScore || 0}%</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ethics Audit Checklist</h4>
                            <div className="space-y-3">
                               <CheckItem label="Evidence-based intent detection" pass={selectedCase.governance?.ethicsChecklist?.noAssumedGuilt} />
                               <CheckItem label="PII Data explicitly submitted" pass={selectedCase.governance?.ethicsChecklist?.dataExplicitlyProvided} />
                               <CheckItem label="Algorithmic Bias Mitigation" pass={selectedCase.governance?.ethicsChecklist?.biasMitigationApplied} />
                               <CheckItem label="Institutional Review Flagged" pass={selectedCase.governance?.ethicsChecklist?.humanReviewFlagged} />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Immutable Case Audit</h4>
                            <div className="space-y-2">
                               {(selectedCase.governance?.auditLog || []).map((log: any, i: number) => (
                                 <div key={i} className="flex justify-between text-[10px] font-bold border-b border-slate-50 pb-2">
                                    <span className="text-slate-800 uppercase tracking-tight">{log.action || 'Unknown Action'}</span>
                                    <span className="text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </section>

                   <section className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                      <div className="relative z-10 space-y-4">
                         <h3 className="text-xl font-black uppercase tracking-tight">Institutional Authorization</h3>
                         <p className="text-sm font-medium opacity-90 leading-relaxed">This case is prepared for institutional handover. Banks and Telecom providers must verify evidence integrity hashes before executing containment actions.</p>
                         <div className="p-4 bg-white/10 rounded-2xl border border-white/20 font-mono text-[10px] break-all">
                            AUTH_HASH: {selectedCase.governance?.evidenceIntegrityHash || 'PENDING'}
                         </div>
                      </div>
                   </section>
                </div>
              )}

              {activeTab === 'interaction' && (
                <div className="space-y-4 animate-in fade-in">
                  {(selectedCase.messages || []).map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'scammer' ? 'items-start' : 'items-end'}`}>
                      <div className={`px-5 py-3 rounded-2xl text-xs font-medium leading-relaxed max-w-[85%] shadow-sm ${m.role === 'scammer' ? 'bg-slate-100 text-slate-700' : 'bg-blue-600 text-white'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 space-y-6">
            <div className="w-32 h-32 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center"><svg className="w-16 h-16 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Select an operational dossier for review</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DossierTab = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
    {label}
  </button>
);

const CheckItem = ({ label, pass }: any) => (
  <div className="flex items-center space-x-2">
    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${pass ? 'bg-green-500' : 'bg-slate-200'}`}>
      {pass && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
  </div>
);

const ExportBtn = ({ label, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
    <span className="text-xs font-black uppercase text-slate-700">{label}</span>
    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
  </button>
);

export default CaseHistory;