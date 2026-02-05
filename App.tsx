import React, { useState, useRef, useEffect } from 'react';
import IntelligenceDashboard from './components/IntelligenceDashboard';
import ResultPanel from './components/ResultPanel';
import LiveShield from './components/LiveShield';
import VideoScanner from './components/VideoScanner';
import SafetyBanner from './components/SafetyBanner';
import BaitSession from './components/BaitSession';
import WarRoom from './components/WarRoom';
import RakshakTutor from './components/RakshakTutor';
import OnboardingTour from './components/OnboardingTour';
import { ScamAnalysis, IntelligenceLog, ExtractedInfo, ChatMessage } from './types';
import { analyzeMessage, apiStatus, generateSpeech } from './services/geminiService';
import { generateSimulatedCase } from './utils/scamGenerator';

interface NavBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}

function NavBtn({ active, onClick, label, icon }: NavBtnProps) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }} 
      className={`px-8 py-3 rounded-2xl flex items-center space-x-3 transition-all border-2 cursor-pointer ${
        active 
        ? 'bg-blue-600 border-blue-500 text-white shadow-xl scale-105' 
        : 'bg-white border-slate-100 text-slate-500 hover:text-slate-900 hover:border-slate-300'
      }`}
    >
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

const QuickDemoCard = ({ label, text, icon, onClick }: { label: string, text: string, icon: string, onClick: (t: string) => void }) => (
  <button 
    onClick={() => onClick(text)}
    className="flex-1 min-w-[200px] p-6 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-3xl text-left transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
  >
    <div className="text-4xl mb-3 group-hover:animate-bounce">{icon}</div>
    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">{label}</h4>
    <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{text}</p>
    <div className="mt-4 text-[9px] font-black text-blue-400 uppercase tracking-widest">TAP TO SCAN →</div>
  </button>
);

const App: React.FC = () => {
  const [logs, setLogs] = useState<IntelligenceLog[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<{message: string, analysis: IntelligenceLog, sessionId: string} | null>(null);
  const [view, setView] = useState<'home' | 'intelligence' | 'warroom' | 'multimedia'>('home');
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showTour, setShowTour] = useState(false); 
  const [seniorMode, setSeniorMode] = useState(false);
  
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seniorMode) document.body.classList.add('senior-mode');
    else document.body.classList.remove('senior-mode');
  }, [seniorMode]);

  useEffect(() => {
    if (latestAnalysis && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [latestAnalysis?.sessionId]);

  const handleManualAnalyze = async (message: string) => {
    if (!message.trim()) {
      setActiveAlert({ level: 'Medium', message: 'Input Required', details: 'Please paste the suspicious text in the white box.' });
      return;
    }
    
    setIsAnalyzing(true);
    setLatestAnalysis(null);
    
    try {
      const result = await analyzeMessage(message);
      handleAnalysisComplete(message, result);
    } catch (e: any) {
      console.error(e);
      setActiveAlert({
        level: 'Critical',
        message: 'Grid Connection Lost',
        details: 'Failed to reach the AI Defense Node. Please check your internet or retry.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisComplete = (message: string, analysis: ScamAnalysis) => {
    const sessionId = `BCR-${Date.now()}`;
    const newLog: IntelligenceLog = {
      ...analysis,
      id: sessionId,
      originalMessage: message,
      timestamp: Date.now(),
      status: 'Open',
      linkedCaseIds: [],
      operationalRequests: [],
      governance: {
        privacyScore: 98,
        evidenceIntegrityHash: `SHA-${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
        ethicsChecklist: { confirmed: true },
        legalStanding: analysis.isScam ? 'Verified Threat' : 'Investigation',
        auditLog: []
      },
      messages: analysis.isScam ? [{ role: 'scammer', content: message, timestamp: Date.now() }] : []
    };

    setLogs(prev => [newLog, ...prev]);
    setLatestAnalysis({ message, analysis: newLog, sessionId });

    if (analysis.isScam) {
      setActiveAlert({
        level: analysis.threatLevel,
        message: analysis.safetyAlert,
        details: "AI Agent 'Rakshak' is now trapping the scammer."
      });
    }
  };

  const handleMessagesUpdate = (sessionId: string, msgs: ChatMessage[]) => {
    // Update the logs array
    setLogs(prev => prev.map(l => l.id === sessionId ? { ...l, messages: msgs } : l));
    
    // CRITICAL: Update latestAnalysis so BaitSession receives new props
    setLatestAnalysis(prev => {
      if (prev && prev.sessionId === sessionId) {
        return {
          ...prev,
          analysis: {
            ...prev.analysis,
            messages: msgs
          }
        };
      }
      return prev;
    });
  };

  const handleIntelExtracted = (sessionId: string, info: ExtractedInfo) => {
    setLogs(prev => prev.map(l => l.id === sessionId ? { ...l, extractedInfo: info } : l));
    
    setLatestAnalysis(prev => {
      if (prev && prev.sessionId === sessionId) {
        return {
          ...prev,
          analysis: {
            ...prev.analysis,
            extractedInfo: info
          }
        };
      }
      return prev;
    });
  };

  const handleQuickDemo = (text: string) => {
    if (mainInputRef.current) {
      mainInputRef.current.value = text;
      setView('home');
      handleManualAnalyze(text);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600/10">
      {showTour && <OnboardingTour activeView={view} onViewChange={(v) => setView(v as any)} onComplete={() => setShowTour(false)} />}

      <header className="bg-white/95 backdrop-blur-xl px-12 py-5 flex items-center justify-between sticky top-0 z-[60] border-b border-slate-200 shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="bg-slate-950 p-3 rounded-3xl shadow-2xl">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <button onClick={() => setView('home')} className="text-left cursor-pointer hover:opacity-80">
            <h1 className="text-3xl font-black tracking-tighter text-slate-950 uppercase">Bharat <span className="text-blue-600">Cyber</span> Rakshak</h1>
          </button>
        </div>

        <nav className="hidden lg:flex items-center space-x-3 bg-slate-100 p-2 rounded-[2.5rem] border-2 border-slate-200">
           <NavBtn active={view === 'home'} onClick={() => setView('home')} label="Check Safety" icon="🛡️" />
           <NavBtn active={view === 'multimedia'} onClick={() => setView('multimedia')} label="Multimedia" icon="📷" />
           <NavBtn active={view === 'intelligence'} onClick={() => setView('intelligence')} label="Statistics" icon="📊" />
           <NavBtn active={view === 'warroom'} onClick={() => setView('warroom')} label="War Room" icon="⚔️" />
        </nav>

        <div className="flex items-center space-x-4">
          <button 
             onClick={() => setSeniorMode(!seniorMode)}
             className={`flex items-center space-x-3 px-6 py-3 rounded-2xl border-2 transition-all cursor-pointer ${seniorMode ? 'bg-orange-600 border-orange-500 text-white shadow-2xl scale-110' : 'bg-white border-slate-200 text-slate-600'}`}
          >
             <span className="text-2xl" aria-hidden="true">👵</span>
             <span className="text-sm font-black uppercase tracking-widest">EASY MODE</span>
          </button>
          <button 
            onClick={() => setShowTour(true)}
            className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
            title="Help Tour"
          >
            ❓
          </button>
        </div>
      </header>

      <SafetyBanner alert={activeAlert} onDismiss={() => setActiveAlert(null)} />

      <main id="interceptor-main" className="flex-1">
        {view === 'home' ? (
          <div className="animate-in fade-in duration-1000">
             <section className="hero-pattern py-28 px-8 text-center text-white">
                <div className="max-w-5xl mx-auto space-y-12">
                   <div className="space-y-4">
                      <h2 className="text-8xl font-black tracking-tighter leading-none mb-4">
                        Is this message <br/>a <span className="text-blue-400">Cyber Scam</span>?
                      </h2>
                      <p className="text-2xl text-blue-100/60 font-medium italic">Paste the text into the box below to start the scan.</p>
                   </div>
                   
                   <div className="pt-8 space-y-12">
                      <div className="max-w-4xl mx-auto bg-white rounded-[4rem] p-6 shadow-2xl flex flex-col gap-6 ring-[16px] ring-white/10 transition-all focus-within:ring-blue-500/20">
                        <div className="relative">
                          <label className="absolute top-6 left-10 text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 opacity-50">⬇️ PASTE THE TEXT HERE ⬇️</label>
                          <textarea 
                            id="interceptor-input"
                            ref={mainInputRef}
                            className="w-full h-56 px-10 pt-16 pb-10 text-slate-900 placeholder:text-slate-200 text-3xl outline-none rounded-[3rem] font-bold bg-slate-50 border-4 border-slate-100 focus:border-blue-600 transition-all resize-none shadow-inner"
                            placeholder="Example: Your bank account will be blocked..."
                          />
                        </div>
                        
                        <button 
                          onClick={() => mainInputRef.current && handleManualAnalyze(mainInputRef.current.value)}
                          disabled={isAnalyzing}
                          className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[3.5rem] font-black text-3xl transition-all shadow-[0_20px_60px_rgba(37,99,235,0.4)] active:scale-95 glow-blue flex items-center justify-center space-x-6 cursor-pointer disabled:opacity-50"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-10 h-10 border-[6px] border-white border-t-transparent rounded-full animate-spin" />
                              <span>SEARCHING GRID...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-4xl">🛡️</span>
                              <span>START PROTECTION SCAN</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-center space-x-4">
                           <div className="h-px w-20 bg-white/10" />
                           <span className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">Click a button to test a demo scam</span>
                           <div className="h-px w-20 bg-white/10" />
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                          <QuickDemoCard icon="🏦" label="Bank Fraud" text="ALERT: Your SBI account is blocked for KYC updates. Login here: http://bit.ly/sbi-kyc" onClick={handleQuickDemo} />
                          <QuickDemoCard icon="👮" label="Police Threat" text="I am Mumbai Police. Your Aadhaar is linked to drugs. Pay ₹25k now to clear your name." onClick={handleQuickDemo} />
                          <QuickDemoCard icon="🎁" label="Prize Scam" text="Congrats! You won ₹10 Lakhs from KBC. Pay ₹2k processing fee to UPI: kbc.prize@ybl" onClick={handleQuickDemo} />
                        </div>
                      </div>
                   </div>
                </div>
             </section>

             {latestAnalysis && (
               <div ref={resultsRef} className="container mx-auto px-12 max-w-7xl py-24 space-y-24 results-enter">
                 <ResultPanel analysis={latestAnalysis.analysis} seniorMode={seniorMode} onClose={() => setLatestAnalysis(null)} />
                 
                 {latestAnalysis.analysis.isScam && (
                    <div className="space-y-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-1 bg-blue-600" />
                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-950">AI Counter-Intelligence Active</h3>
                      </div>
                      <div className="h-[900px] border-[10px] border-slate-950 rounded-[5rem] overflow-hidden shadow-2xl bg-slate-900">
                        <BaitSession 
                          key={latestAnalysis.sessionId}
                          sessionId={latestAnalysis.sessionId}
                          initialMessages={latestAnalysis.analysis.messages}
                          onMessagesUpdate={(msgs) => handleMessagesUpdate(latestAnalysis.sessionId, msgs)}
                          onIntelExtracted={(info) => handleIntelExtracted(latestAnalysis.sessionId, info)}
                        />
                      </div>
                    </div>
                 )}
               </div>
             )}
          </div>
        ) : view === 'intelligence' ? (
          <div className="container mx-auto px-12 py-20 max-w-7xl"><IntelligenceDashboard logs={logs} /></div>
        ) : view === 'warroom' ? (
          <div className="container mx-auto px-12 py-20 max-w-7xl"><WarRoom logs={logs} onRunSimulation={(count) => {
            const sims = Array.from({ length: count }).map((_, i) => generateSimulatedCase(`SIM-${Date.now()}-${i}`));
            setLogs(prev => [...sims, ...prev]);
            setView('intelligence');
          }} /></div>
        ) : (
          <div className="container mx-auto px-12 py-20 max-w-7xl space-y-24 animate-in fade-in">
             <LiveShield onAlert={(analysis) => handleAnalysisComplete("LIVE_VOICE_INTERCEPT", analysis)} />
             <VideoScanner />
          </div>
        )}
      </main>

      <button 
        onClick={() => setShowTutor(true)} 
        className="fixed bottom-12 right-12 z-[200] w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group border-4 border-blue-500 cursor-pointer"
      >
        <span className="text-5xl group-hover:animate-bounce">🧑‍🏫</span>
      </button>

      {showTutor && <RakshakTutor onClose={() => setShowTutor(false)} />}
    </div>
  );
};

export default App;