
import React, { useState } from 'react';
import { generateAgenticBait } from '../services/geminiService';

const ApiExplorer: React.FC = () => {
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    conversation_id: `BCR-${Date.now()}`,
    message: "Sir I am call from HDFC. Your account is block. Please pay 5000 penalty at UPI: hdfc.fine@ybl",
    history: []
  }, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(testPayload);
      // Fix: Removed the third 'chat' argument as generateAgenticBait only accepts two arguments (conversationId, history).
      const result = await generateAgenticBait(parsed.conversation_id, parsed.history || []);
      setResponse(result);
    } catch (e: any) {
      setResponse({ error: "Invalid Payload", details: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#020617] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[700px] animate-in fade-in duration-700">
      <div className="p-10 border-b border-white/5 bg-black flex items-center justify-between">
         <div className="flex items-center space-x-5">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">API Simulation Gateway</h3>
         </div>
         <span className="text-[10px] font-mono text-blue-500 uppercase">POST /rakshak</span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
         <div className="p-10 space-y-6 border-r border-white/5 bg-slate-900/30 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Payload</h4>
            <textarea 
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-2xl p-6 text-xs text-blue-100 font-mono outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
              spellCheck={false}
            />
            <button 
               onClick={runSimulation}
               disabled={loading}
               className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl active:scale-95"
            >
               {loading ? 'Synthesizing Response...' : 'Execute Request'}
            </button>
         </div>

         <div className="bg-black p-10 overflow-hidden flex flex-col">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Standardized Output</h4>
            <div className="flex-1 bg-slate-950/50 rounded-2xl border border-white/5 p-8 overflow-y-auto custom-scrollbar font-mono text-[11px] text-blue-400/80 leading-relaxed">
               {response ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
               ) : (
                  <div className="h-full flex items-center justify-center text-slate-800 italic">
                     Awaiting valid JSON payload...
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default ApiExplorer;