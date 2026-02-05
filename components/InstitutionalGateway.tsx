
import React from 'react';
import { OperationalRequest } from '../types';

interface Props {
  requests: OperationalRequest[];
  onSend: (id: string) => void;
}

const InstitutionalGateway: React.FC<Props> = ({ requests, onSend }) => {
  return (
    <div className="bg-black border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Sovereign API Gateway // Institutional</h3>
        </div>
        <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-500">
          <span>SEC_LEVEL: 4</span>
          <span>AUTH: VERIFIED</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-700 space-y-2 opacity-50">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">No Pending Requests</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                    req.priority === 'Urgent' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}>{req.priority}</span>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{req.type}</span>
                </div>
                <div className="text-xs font-mono text-slate-300">{req.target}</div>
                <div className="text-[7px] font-mono text-slate-600">REQ_ID: {req.id}</div>
              </div>
              <button 
                onClick={() => onSend(req.id)}
                disabled={req.status !== 'Pending'}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  req.status === 'Pending' 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20' 
                  : 'bg-green-600/20 text-green-400 border border-green-500/20'
                }`}
              >
                {req.status === 'Pending' ? 'Execute' : 'Executed'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-white/5">
        <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
          <span>Integrity Check</span>
          <span className="text-blue-500">SHA-256 Passed</span>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalGateway;
