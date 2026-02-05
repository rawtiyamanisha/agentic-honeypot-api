import React, { useState, useEffect, useRef } from 'react';
import { generateAgenticBait } from '../services/geminiService';
import { ChatMessage, ExtractedInfo, AgentResponse } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  sessionId: string;
  initialMessages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onIntelExtracted: (info: ExtractedInfo) => void;
  onOperationalReportGenerated?: (report: any) => void;
}

const BaitSession: React.FC<Props> = ({ sessionId, initialMessages, onMessagesUpdate, onIntelExtracted, onOperationalReportGenerated }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [isSimulatingScammer, setIsSimulatingScammer] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProcessedRef = useRef<number>(0);
  
  const safeMessages = Array.isArray(initialMessages) ? initialMessages : [];
  const lastMessage = safeMessages.length > 0 ? safeMessages[safeMessages.length - 1] : null;

  // Auto-trigger AI reply if the last message is from the scammer and hasn't been processed
  useEffect(() => {
    if (lastMessage && lastMessage.role === 'scammer' && lastMessage.timestamp > lastProcessedRef.current && !isTyping && !isSimulatingScammer) {
      console.debug(`[BaitSession] Detected new scammer message, triggering agent turn. Timestamp: ${lastMessage.timestamp}`);
      lastProcessedRef.current = lastMessage.timestamp;
      
      const timer = setTimeout(() => {
        runAgenticTurn(safeMessages);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [lastMessage?.timestamp, lastMessage?.content]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [safeMessages.length, isTyping, isSimulatingScammer]);

  const runAgenticTurn = async (currentMessages: ChatMessage[]) => {
    if (isTyping) return;
    setIsTyping(true);
    
    try {
      const history = currentMessages.map(m => ({ 
        role: m.role === 'bot' ? 'agent' : 'scammer', 
        content: m.content 
      }));
      
      const result: AgentResponse = await generateAgenticBait(sessionId, history);
      
      const updatedMessages: ChatMessage[] = [...currentMessages, { 
        role: 'bot', 
        content: result.reply || "Ji sir, main thoda confused hoon. Kaunsa KYC block hua hai?", 
        timestamp: Date.now(),
        extractedData: result.extracted_intelligence,
        verdict: result.scam_type,
        intent: result.intent,
        riskLevel: result.riskLevel
      }];
      
      onMessagesUpdate(updatedMessages);

      const intel = result.extracted_intelligence;
      if (intel && (intel.upi_ids?.length > 0 || intel.bank_accounts?.length > 0 || intel.phone_numbers?.length > 0)) {
        const info: ExtractedInfo = {
          upiIds: (intel.upi_ids || []).map(v => ({ value: v, confidence: 98, timestamp: Date.now() })),
          bankDetails: (intel.bank_accounts || []).map(acc => ({ value: typeof acc === 'string' ? acc : JSON.stringify(acc), confidence: 95, timestamp: Date.now() })),
          ifscCodes: (intel.ifsc_codes || []).map(v => ({ value: v, confidence: 95, timestamp: Date.now() })),
          phoneNumbers: (intel.phone_numbers || []).map(v => ({ value: v, confidence: 95, timestamp: Date.now() })),
          links: (intel.phishing_urls || []).map(v => ({ value: v, confidence: 95, timestamp: Date.now() })),
          cryptoWallets: [],
          fakeIdentities: []
        };
        onIntelExtracted(info);
      }

      // If continueConversation is true but no response from scammer (simulated silence), 
      // the agent can choose to send another message after a delay if the logic was recursive.
      // For now, the loop is triggered by scammer messages.

    } catch (e) {
      console.error("Agentic Turn Error:", e);
    } finally {
      setIsTyping(false);
    }
  };

  const simulateScammerReply = async () => {
    if (isTyping || isSimulatingScammer) return;
    setIsSimulatingScammer(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a rude, aggressive Indian scammer. The victim is acting confused and slow. 
      Respond to the last message and DEMAND payment immediately. Tell them police will come.
      Send a fake UPI ID if they ask where to pay.
      Last few messages: ${JSON.stringify(safeMessages.slice(-3))}. 
      Return ONLY the text of your aggressive response.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const reply = response.text || "Jaldi payment karo varna police case hoga! 5 minute mein payment nahi aayi toh bank account block!";
      const updatedMessages: ChatMessage[] = [...safeMessages, { 
        role: 'scammer', 
        content: reply, 
        timestamp: Date.now() 
      }];
      onMessagesUpdate(updatedMessages);
    } catch (e) {
      console.error("Scammer Simulation Error", e);
    } finally {
      setIsSimulatingScammer(false);
    }
  };

  const handleManualScammerReply = async (reply: string) => {
    if (!reply.trim() || isTyping || isSimulatingScammer) return;
    const updatedMessages: ChatMessage[] = [...safeMessages, { 
      role: 'scammer', 
      content: reply, 
      timestamp: Date.now() 
    }];
    onMessagesUpdate(updatedMessages);
    setInput('');
  };

  return (
    <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in duration-700">
      <header className="p-8 flex items-center justify-between border-b border-white/5 bg-blue-600/5">
        <div className="flex items-center space-x-5">
           <div className={`w-3 h-3 rounded-full ${isTyping ? 'bg-emerald-500 animate-ping' : 'bg-blue-500 animate-pulse'} shadow-[0_0_15px_#3b82f6]`} />
           <div>
             <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Sovereign Autonomous Agent</h3>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
               {isTyping ? 'STATUS: THINKING MODE (16000 TOKENS)...' : 'STATUS: LIVE CONTINUOUS ENGAGEMENT'}
             </p>
           </div>
        </div>
        
        <button 
          onClick={simulateScammerReply}
          disabled={isTyping || isSimulatingScammer}
          className="px-6 py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center space-x-2"
        >
          <span className="text-sm">🤖</span>
          <span>{isSimulatingScammer ? 'Target Responding...' : 'Auto-Simulate Scammer'}</span>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-[radial-gradient(circle_at_bottom,_rgba(37,99,235,0.05)_0%,_transparent_70%)]">
        {safeMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'scammer' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-4`}>
            <div className={`max-w-[80%] space-y-2 ${m.role === 'scammer' ? 'items-start' : 'items-end'} flex flex-col`}>
               <div className="flex items-center space-x-3 px-2">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                   {m.role === 'scammer' ? 'Target (Adversary)' : 'Sovereign Agent (Defender)'}
                 </span>
                 {m.intent && (
                   <span className="text-[8px] font-bold text-blue-500/60 uppercase">[{m.intent}]</span>
                 )}
                 {m.riskLevel && (
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                     m.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 
                     m.riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' : 
                     'bg-green-500/20 text-green-400'
                   }`}>Risk: {m.riskLevel}</span>
                 )}
               </div>
               <div className={`px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-2xl ${
                 m.role === 'scammer' 
                   ? 'bg-slate-900 text-slate-100 rounded-bl-none border border-white/10' 
                   : 'bg-blue-600 text-white rounded-br-none glow-blue'
               }`}>
                 {m.content}
                 {m.extractedData && (m.extractedData.upi_ids?.length > 0 || m.extractedData.phone_numbers?.length > 0) && (
                   <div className="mt-4 pt-3 border-t border-white/20">
                      <div className="text-[8px] font-black text-blue-200 uppercase mb-1">Intelligence Extracted:</div>
                      {m.extractedData.upi_ids?.map((id, idx) => (
                        <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300">UPI: {id}</div>
                      ))}
                      {m.extractedData.phone_numbers?.map((ph, idx) => (
                        <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300">TEL: {ph}</div>
                      ))}
                   </div>
                 )}
               </div>
            </div>
          </div>
        ))}
        {(isTyping || isSimulatingScammer) && (
          <div className={isTyping ? "flex justify-end" : "flex justify-start"}>
            <div className="bg-slate-800/50 px-5 py-3 rounded-2xl border border-white/10 flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-black/60 border-t border-white/5">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleManualScammerReply(input);
          }}
          className="relative"
        >
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping || isSimulatingScammer}
            placeholder="Talk as the target to test the autonomous agent..."
            className="w-full bg-slate-900 border border-white/10 rounded-full py-5 pl-8 pr-32 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-all font-medium placeholder:text-slate-600 shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping || isSimulatingScammer}
            className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
          >
            Submit Reply
          </button>
        </form>
      </div>
    </div>
  );
};

export default BaitSession;