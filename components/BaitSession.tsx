import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateAgenticBait, getApiKey } from '../services/geminiService';
import { ChatMessage, ExtractedInfo, AgentResponse, SessionScore } from '../types';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

interface Props {
  sessionId: string;
  initialMessages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onIntelExtracted: (info: ExtractedInfo) => void;
  onScoreUpdate?: (score: SessionScore) => void;
  onOperationalReportGenerated?: (report: any) => void;
  sourceMessageId?: string;
  conversationContext?: string;
  geoHint?: string;
}

const BaitSession: React.FC<Props> = ({ 
  sessionId, 
  initialMessages, 
  onMessagesUpdate, 
  onIntelExtracted, 
  onScoreUpdate,
  onOperationalReportGenerated,
  sourceMessageId,
  conversationContext,
  geoHint
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [isSimulatingScammer, setIsSimulatingScammer] = useState(false);
  const [autoPilot, setAutoPilot] = useState(true);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'analyzing' | 'extracting' | 'generating'>('idle');
  const [input, setInput] = useState('');
  const [startTime] = useState(Date.now());
  const [firstUPITime, setFirstUPITime] = useState<number | null>(null);
  const [extractedIntelSet] = useState(new Set<string>());
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProcessedRef = useRef<number>(0);
  const lastScammerRef = useRef<number>(0);
  
  const safeMessages = Array.isArray(initialMessages) ? initialMessages : [];
  const lastMessage = safeMessages.length > 0 ? safeMessages[safeMessages.length - 1] : null;

  // Auto-trigger AI reply if the last message is from the scammer and hasn't been processed
  useEffect(() => {
    if (lastMessage && lastMessage.role === 'scammer' && lastMessage.timestamp > lastProcessedRef.current && !isTyping && !isSimulatingScammer) {
      lastProcessedRef.current = lastMessage.timestamp;
      const timer = setTimeout(() => {
        runAgenticTurn(safeMessages);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastMessage?.timestamp, lastMessage?.content, isTyping, isSimulatingScammer]);

  // Auto-pilot: trigger scammer reply after agent replies
  useEffect(() => {
    if (autoPilot && lastMessage && lastMessage.role === 'bot' && lastMessage.timestamp > lastScammerRef.current && !isTyping && !isSimulatingScammer) {
      console.debug(`[BaitSession] Auto-pilot: Triggering scammer reply. Timestamp: ${lastMessage.timestamp}`);
      lastScammerRef.current = lastMessage.timestamp;
      
      const timer = setTimeout(() => {
        simulateScammerReply();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastMessage?.timestamp, lastMessage?.role, autoPilot]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [safeMessages.length, isTyping, isSimulatingScammer]);

  const runAgenticTurn = async (currentMessages: ChatMessage[]) => {
    if (isTyping) return;
    setIsTyping(true);
    setAgentStatus('analyzing');
    
    try {
      const history = currentMessages.map(m => ({ 
        role: m.role === 'bot' ? 'agent' : 'scammer', 
        content: m.content 
      }));
      
      setAgentStatus('generating');
      const result: AgentResponse = await generateAgenticBait(sessionId, history, {
        sourceMessageId,
        conversationContext,
        geoHint
      });
      
      if (result.extracted_intelligence && (
        (result.extracted_intelligence.upi_ids?.length ?? 0) > 0 || 
        (result.extracted_intelligence.phone_numbers?.length ?? 0) > 0 ||
        (result.extracted_intelligence.bank_accounts?.length ?? 0) > 0 ||
        (result.extracted_intelligence.ifsc_codes?.length ?? 0) > 0 ||
        (result.extracted_intelligence.phishing_urls?.length ?? 0) > 0
      )) {
        setAgentStatus('extracting');
        await new Promise(r => setTimeout(r, 1000));
      }

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
      if (intel) {
        let newIntelFound = false;
        const allIntel = [
          ...(intel.upi_ids || []),
          ...(intel.phone_numbers || []),
          ...(intel.bank_accounts || []),
          ...(intel.ifsc_codes || []),
          ...(intel.phishing_urls || [])
        ];

        allIntel.forEach(item => {
          if (!extractedIntelSet.has(item)) {
            extractedIntelSet.add(item);
            newIntelFound = true;
          }
        });

        if (intel.upi_ids?.length > 0 && firstUPITime === null) {
          setFirstUPITime(Math.floor((Date.now() - startTime) / 1000));
        }

        if (newIntelFound || (intel.upi_ids?.length ?? 0) > 0 || (intel.phone_numbers?.length ?? 0) > 0) {
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
      }

      // If continueConversation is true but no response from scammer (simulated silence), 
      // the agent can choose to send another message after a delay if the logic was recursive.
      // For now, the loop is triggered by scammer messages.

    } catch (e) {
      console.error("Agentic Turn Error:", e);
    } finally {
      setIsTyping(false);
      setAgentStatus('idle');
    }
  };

  const simulateScammerReply = async () => {
    if (isTyping || isSimulatingScammer) return;
    setIsSimulatingScammer(true);
    
    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const personalities = [
        "aggressive and rude, demanding immediate payment and threatening police action",
        "overly friendly and helpful, trying to 'guide' the victim through a fake process",
        "authoritative and official, impersonating a high-ranking government or bank officer",
        "desperate and emotional, claiming to be a relative in a life-or-death emergency",
        "technical and professional, pretending to be a support engineer fixing a 'security breach'"
      ];
      const personality = personalities[Math.floor(Math.random() * personalities.length)];

      const prompt = `You are a professional cyber scammer in India. Your personality is: ${personality}.
      The victim is acting confused, slow, and potentially vulnerable. 
      Your goal is to extract money, OTPs, or sensitive personal information.
      
      Guidelines:
      1. Use a mix of English and local Indian languages (Hindi, Telugu, Tamil, etc.) as appropriate.
      2. Be persistent. If the victim hesitates, use pressure tactics or emotional manipulation.
      3. If they ask for verification, provide fake but realistic-looking details.
      4. CRITICAL: If the victim asks for payment details (UPI ID, Bank Account, Phone Number), you MUST provide fake ones immediately. Never say you don't have them.
      5. Keep the conversation flowing. Don't give up easily.
      
      Last few messages: ${JSON.stringify(safeMessages.slice(-5))}. 
      Return ONLY the text of your response.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
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

  const sessionScore: SessionScore = useMemo(() => {
    const depth = safeMessages.length;
    const intelCount = extractedIntelSet.size;
    
    // Heuristic for accuracy: check if agent's scam_type is mentioned in context
    let accuracy = 85; // Base accuracy
    const lastBotMsg = [...safeMessages].reverse().find(m => m.role === 'bot');
    if (lastBotMsg?.verdict && conversationContext) {
      if (conversationContext.toLowerCase().includes(lastBotMsg.verdict.toLowerCase())) {
        accuracy = 98;
      }
    }

    return {
      intelExtractedCount: intelCount,
      timeToFirstUPI: firstUPITime,
      scamTypeAccuracy: accuracy,
      conversationDepth: depth
    };
  }, [safeMessages.length, extractedIntelSet.size, firstUPITime, conversationContext]);

  // Sync score to parent
  const lastSyncedScoreRef = useRef<string>('');
  useEffect(() => {
    const scoreStr = JSON.stringify(sessionScore);
    if (scoreStr !== lastSyncedScoreRef.current) {
      onScoreUpdate?.(sessionScore);
      lastSyncedScoreRef.current = scoreStr;
    }
  }, [sessionScore, onScoreUpdate]);

  return (
    <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in duration-700">
      <header className="p-8 flex items-center justify-between border-b border-white/5 bg-blue-600/5">
        <div className="flex items-center space-x-5">
           <div className={`w-3 h-3 rounded-full ${isTyping ? 'bg-emerald-500 animate-ping' : 'bg-blue-500 animate-pulse'} shadow-[0_0_15px_#3b82f6]`} />
           <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Sovereign Autonomous Agent</h3>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {isTyping ? (
                    <span className="text-emerald-400">
                      {agentStatus === 'analyzing' && 'STATUS: ANALYZING ADVERSARY INTENT...'}
                      {agentStatus === 'generating' && 'STATUS: GENERATING ADAPTIVE COUNTER-BAIT...'}
                      {agentStatus === 'extracting' && 'STATUS: EXTRACTING FORENSIC INTELLIGENCE...'}
                    </span>
                  ) : isSimulatingScammer ? (
                    <span className="text-red-400">STATUS: MONITORING TARGET RESPONSE...</span>
                  ) : (
                    'STATUS: LIVE CONTINUOUS ENGAGEMENT'
                  )}
                </p>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center space-x-3 text-[8px] font-black uppercase tracking-tighter">
                  <span className="text-blue-400">Intel: {sessionScore.intelExtractedCount}</span>
                  <span className="text-emerald-400">Depth: {sessionScore.conversationDepth}</span>
                  <span className="text-orange-400">Accuracy: {sessionScore.scamTypeAccuracy}%</span>
                  {sessionScore.timeToFirstUPI && (
                    <span className="text-purple-400">UPI Speed: {sessionScore.timeToFirstUPI}s</span>
                  )}
                </div>
              </div>
            </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setAutoPilot(!autoPilot)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${autoPilot ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-800 text-slate-500 border border-white/10'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${autoPilot ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <span>{autoPilot ? 'AUTO-PILOT: ON' : 'AUTO-PILOT: OFF'}</span>
          </button>

          <button 
            onClick={() => runAgenticTurn(safeMessages)}
            disabled={isTyping || isSimulatingScammer}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50"
          >
            <span className="text-sm">🛡️</span>
            <span>Force Agent Turn</span>
          </button>
          
          <button 
            onClick={simulateScammerReply}
            disabled={isTyping || isSimulatingScammer}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50"
          >
            <span className="text-sm">🤖</span>
            <span>{isSimulatingScammer ? 'Target Responding...' : 'Force Target Reply'}</span>
          </button>
        </div>
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
                 {m.extractedData && (
                    (m.extractedData.upi_ids?.length ?? 0) > 0 || 
                    (m.extractedData.phone_numbers?.length ?? 0) > 0 ||
                    (m.extractedData.bank_accounts?.length ?? 0) > 0 ||
                    (m.extractedData.ifsc_codes?.length ?? 0) > 0 ||
                    (m.extractedData.phishing_urls?.length ?? 0) > 0
                  ) && (
                    <div className="mt-4 pt-3 border-t border-white/20 space-y-2">
                       <div className="text-[8px] font-black text-blue-200 uppercase mb-1">Intelligence Extracted:</div>
                       <div className="flex flex-wrap gap-2">
                         {m.extractedData.upi_ids?.map((id, idx) => (
                           <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/20">UPI: {id}</div>
                         ))}
                         {m.extractedData.phone_numbers?.map((ph, idx) => (
                           <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/20">TEL: {ph}</div>
                         ))}
                         {m.extractedData.bank_accounts?.map((acc, idx) => (
                           <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/20">ACC: {acc}</div>
                         ))}
                         {m.extractedData.ifsc_codes?.map((ifsc, idx) => (
                           <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/20">IFSC: {ifsc}</div>
                         ))}
                         {m.extractedData.phishing_urls?.map((url, idx) => (
                           <div key={idx} className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/20">URL: {url}</div>
                         ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end animate-in slide-in-from-right-2">
            <div className="bg-slate-800/50 px-4 py-2 rounded-2xl rounded-br-none border border-white/10 flex space-x-1 items-center">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        {isSimulatingScammer && (
          <div className="flex justify-start animate-in slide-in-from-left-2">
            <div className="bg-slate-900 px-4 py-2 rounded-2xl rounded-bl-none border border-white/5 flex space-x-1 items-center">
              <span className="text-[8px] font-black text-slate-500 uppercase mr-2 tracking-widest">Adversary Typing</span>
              <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]" />
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

export default React.memo(BaitSession);