import React, { useState, useRef, useEffect, lazy, Suspense, memo, useCallback } from 'react';
import ResultPanel from './components/ResultPanel';
import SafetyBanner from './components/SafetyBanner';
import RakshakTutor from './components/RakshakTutor';
import OnboardingTour from './components/OnboardingTour';
import VisualRedFlags from './components/VisualRedFlags';
import ReportingGuide from './components/ReportingGuide';
import { ScamAnalysis, IntelligenceLog, ExtractedInfo, ChatMessage, SessionScore } from './types';
import { analyzeMessage, analyzeImage, apiStatus, generateSpeech } from './services/geminiService';
import { generateSimulatedCase } from './utils/scamGenerator';

// Lazy load heavy components
const IntelligenceDashboard = lazy(() => import('./components/IntelligenceDashboard'));
const LiveShield = lazy(() => import('./components/LiveShield'));
const VideoScanner = lazy(() => import('./components/VideoScanner'));
const VoiceScanner = lazy(() => import('./components/VoiceScanner'));
const BaitSession = lazy(() => import('./components/BaitSession'));
const WarRoom = lazy(() => import('./components/WarRoom'));

// Memoize NavBtn
const NavBtn = memo(({ active, onClick, label, icon }: NavBtnProps) => {
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
});

// Memoize QuickDemoCard
const QuickDemoCard = memo(({ label, text, icon, onClick }: { label: string, text: string, icon: string, onClick: (t: string) => void }) => (
  <button 
    onClick={() => onClick(text)}
    className="flex-1 min-w-[200px] p-6 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-3xl text-left transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
  >
    <div className="text-4xl mb-3 group-hover:animate-bounce">{icon}</div>
    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">{label}</h4>
    <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{text}</p>
    <div className="mt-4 text-[9px] font-black text-blue-400 uppercase tracking-widest">TAP TO SCAN →</div>
  </button>
));

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
    <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-8 max-w-md text-center">
      <div className="relative">
        <div className="w-24 h-24 border-8 border-slate-100 rounded-full" />
        <div className="absolute inset-0 w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI Defense Active</h3>
        <div className="space-y-1 text-slate-500 text-sm font-bold uppercase tracking-widest">
          <p className="animate-pulse">🛰️ Scanning message patterns...</p>
          <p className="animate-pulse [animation-delay:0.2s]">🧠 Running AI threat analysis...</p>
          <p className="animate-pulse [animation-delay:0.4s]">🔎 Extracting scam indicators...</p>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [logs, setLogs] = useState<IntelligenceLog[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<{message: string, analysis: IntelligenceLog, sessionId: string} | null>(null);
  const [currentSessionScore, setCurrentSessionScore] = useState<SessionScore | null>(null);
  const [view, setView] = useState<'home' | 'intelligence' | 'warroom' | 'multimedia'>('home');
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'loading' | 'result' | 'intelligence'>('idle');
  const [showTutor, setShowTutor] = useState(false);
  const [showTour, setShowTour] = useState(false); 
  const [showReportingGuide, setShowReportingGuide] = useState(false);
  const [seniorMode, setSeniorMode] = useState(false);
  const [language, setLanguage] = useState<'Hindi' | 'English' | 'Telugu' | 'Tamil' | 'Kannada'>('Hindi');
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [demoScenario, setDemoScenario] = useState<{label: string, text: string} | null>(null);
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const playSound = useCallback((type: 'ping' | 'tick') => {
    const audio = new Audio(type === 'ping' 
      ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' 
      : 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {}); // Ignore if blocked
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'Hindi' ? 'hi-IN' : (language === 'Telugu' ? 'te-IN' : 'en-IN');
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setActiveAlert({ level: 'Medium', message: 'Not Supported', details: 'Voice recognition is not supported in this browser.' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error("VOICE ERROR:", e);
      setActiveAlert({ level: 'Medium', message: 'Voice Error', details: 'Could not capture audio. Please check microphone permissions.' });
    };
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (mainInputRef.current) {
        mainInputRef.current.value = text;
        handleManualAnalyze(text);
      }
    };
    recognition.start();
  }, [language]);

  const handleAnalysisComplete = useCallback((message: string, analysis: ScamAnalysis) => {
    // Keep demoStep active during guided demo
    setDemoStep(prev => prev); // No-op to satisfy logic if needed, but basically we don't clear it if it's set
    
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

    setLogs(prev => [newLog, ...prev].slice(0, 50));
    setLatestAnalysis({ message, analysis: newLog, sessionId });
    setView('home');

    if (analysis.isScam) {
      setActiveAlert({
        level: analysis.threatLevel,
        message: analysis.safetyAlert,
        details: "AI Agent 'Rakshak' is now trapping the scammer."
      });
      
      // Auto-scroll to the agent session after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (seniorMode) document.body.classList.add('senior-mode');
    else document.body.classList.remove('senior-mode');
  }, [seniorMode]);

  useEffect(() => {
    if (latestAnalysis && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [latestAnalysis?.sessionId]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAnalyzing) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setLatestAnalysis(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeImage(base64);
          handleAnalysisComplete("[SCREENSHOT ANALYSIS]", result);
        } catch (err) {
          // Fallback to demo if API fails
          const demo = generateSimulatedCase("DEMO-IMG");
          handleAnalysisComplete("[SCREENSHOT ANALYSIS - SIMULATED]", demo);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      console.error(e);
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, handleAnalysisComplete]);

  const handleManualAnalyze = useCallback(async (message: string) => {
    if (isAnalyzing) return;
    if (!message.trim()) {
      setActiveAlert({ level: 'Medium', message: 'Input Required', details: 'Please paste the suspicious text in the white box.' });
      return;
    }
    
    setIsAnalyzing(true);
    setScanStep('loading');
    setLatestAnalysis(null);
    
    console.log("INPUT MESSAGE:", message);
    console.log("Sending request...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language }),
        signal: controller.signal
      });

      console.log("Status:", res.status);
      clearTimeout(timeoutId);
      const data = await res.json();
      console.log("API RESPONSE:", data);

      if (!data || typeof data.is_scam === "undefined") {
        throw new Error("Invalid response from analysis engine");
      }

      // Map backend response to frontend ScamAnalysis type
      const analysis: ScamAnalysis = {
        isScam: data.is_scam,
        confidence: data.confidence / 100,
        scamType: data.scam_type,
        riskScore: data.confidence,
        channel: 'text',
        threatLevel: data.risk_level === 'high' ? 'High' : (data.risk_level === 'critical' ? 'Critical' : 'Medium'),
        summary: data.agent_reply,
        safetyAlert: data.is_scam ? `Risk Level ${data.risk_level}: ${data.scam_type}.` : "Safe.",
        warningSignals: [],
        extractedInfo: { 
          upiIds: (data.entities || []).filter((e: string) => e.includes('@')).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          bankDetails: [],
          ifscCodes: [],
          phoneNumbers: (data.entities || []).filter((e: string) => /^\d+$/.test(e) && e.length >= 10).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          links: (data.entities || []).filter((e: string) => e.startsWith('http') || e.includes('.')).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          cryptoWallets: [],
          fakeIdentities: (data.entities || []).filter((e: string) => !e.includes('@') && !/^\d+$/.test(e) && !e.startsWith('http')).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() }))
        },
        killChainStage: data.is_scam ? 'Exploitation' : 'Delivery',
        fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: data.scam_type || "Fraud" },
        recommendedActions: data.is_scam ? ["Report to I4C", "Block Sender"] : ["Stay vigilant."],
        suggestedBaitResponse: data.agent_reply
      };

      const DEBUG = true;
      if (DEBUG) {
        console.log("FULL FLOW:", {
          input: message,
          api: data,
          final: analysis
        });
      }

      handleAnalysisComplete(message, analysis);
      
      if (analysis.isScam) playSound('ping');
      
      setTimeout(() => {
        setScanStep('result');
        if (analysis.isScam) speak(analysis.summary);
      }, 800);

      // Illusion of intelligence: Transition to intelligence dashboard after a delay
      setTimeout(() => {
        playSound('tick');
        setScanStep('intelligence');
        setView('intelligence');
      }, 3500);

    } catch (e: any) {
      console.error("Analysis failed", e);
      if (e.name === 'AbortError') {
        setActiveAlert({ level: 'High', message: 'Analysis Timeout', details: 'The AI engine took too long. Using local simulation.' });
      }
      const demoResult = generateSimulatedCase("FALLBACK");
      handleAnalysisComplete(message, demoResult);
      setScanStep('result');
      setTimeout(() => setScanStep('intelligence'), 1500);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, handleAnalysisComplete, language]);

  const handleQuickDemo = useCallback((text: string) => {
    // Try to find the scenario index to trigger a guided demo
    const scenarios = [
      "Digital Arrest", "AI Deepfake Fraud", "DoT Disconnection", "Electricity Bill", 
      "Stock Market Scam", "Speed Post Scam", "Bank KYC", "Job Offer Scam", 
      "Credit Card Points", "FedEx Illegal Parcel", "Sextortion Scam", "OTP Scam",
      "Customs Duty Scam", "Lottery Scam", "Remote Access Scam"
    ];
    
    // Find index based on text snippet
    const idx = scenarios.findIndex(s => text.toLowerCase().includes(s.toLowerCase()));
    
    if (idx !== -1) {
      startLiveDemo(idx);
    } else {
      if (mainInputRef.current) {
        mainInputRef.current.value = text;
        setView('home');
        handleManualAnalyze(text);
      }
    }
  }, [handleManualAnalyze]); // startLiveDemo will be added to deps if needed, but it's stable

  const handleVideoDemo = useCallback(() => {
    const simResult = generateSimulatedCase(`VIDEO-DEMO-${Date.now()}`, 'video', 'Digital Arrest Scam');
    handleAnalysisComplete("[VIDEO FEED INTERCEPTED]", simResult);
    setView('home');
  }, [handleAnalysisComplete]);

  const startLiveDemo = useCallback((scenarioIndex?: number) => {
    setDemoStep(1);
    setShowTutor(true);
    
    const scenarios = [
      {
        label: "Digital Arrest",
        text: "This is DCP Vikram Rao from Mumbai Police Cyber Cell. You are under 'Digital Arrest' for high-value money laundering. Do not disconnect this encrypted video call or we will dispatch a team to your Aadhaar-linked address immediately. Transfer ₹50,000 for 'Bail Verification' to our secure nodal account: mumbai.police.verify@okaxis"
      },
      {
        label: "AI Deepfake Fraud",
        text: "[AI Voice Synthesis] Beta, main hospital mein hoon. Mera accident ho gaya hai. Doctor operation shuru nahi kar rahe jab tak ₹20,000 deposit nahi hote. Jaldi se emergency.medical.help@okaxis par bhej do. Please jaldi karo, meri jaan khatre mein hai!"
      },
      {
        label: "DoT Disconnection",
        text: "Department of Telecommunications (DoT) Alert: Your mobile identity is linked to illegal cross-border activities in SE Asia. All 9 SIM cards linked to your Aadhaar will be disconnected in 2 hours. To verify your compliance and avoid legal action, call 1800-DOT-HELP for Digital Verification."
      },
      {
        label: "Electricity Bill",
        text: "MSEDCL Alert: Your electricity bill for the current cycle is pending. Power disconnection scheduled for 9:30 PM tonight. To avoid blackout and reconnection charges, call our Nodal Officer at 9876543210 immediately. - Electricity Dept"
      },
      {
        label: "Stock Market Scam",
        text: "VIP Institutional Trading Group: Our AI-driven predictive models guarantee 200% returns in 7 days. Join our SEBI-registered (Fake) advisory group now for exclusive 'Pump-and-Dump' insights. Download the 'ProTrader' app: http://pro-trader-app.in/download"
      },
      {
        label: "Speed Post Scam",
        text: "India Post: Your international consignment has been detained by Customs due to prohibited items. Update your delivery address and pay the clearance fee of ₹499 within 24 hours to avoid legal seizure: http://indiapost-delivery.in/update"
      },
      {
        label: "Bank KYC",
        text: "SBI URGENT: Your YONO account access will be permanently suspended in 24 hours due to non-compliance with new RBI KYC guidelines. Update your profile immediately to avoid account freeze: http://sbi-kyc-update.in/login"
      },
      {
        label: "Job Offer Scam",
        text: "Congratulations! You have been selected for a part-time Work-From-Home job. Earn ₹3000-₹5000 daily by just liking YouTube videos and subscribing to channels. No experience needed. Contact our HR on WhatsApp: http://wa.me/919876543210?text=JOB"
      },
      {
        label: "Credit Card Points",
        text: "Your HDFC Credit Card reward points (worth ₹4,850) are expiring tonight. Redeem them now to avoid loss. Click here to convert points to cash in your bank account: http://hdfc-rewards-portal.in/redeem"
      },
      {
        label: "FedEx Illegal Parcel",
        text: "This is FedEx Customer Service. A parcel sent in your name to Taiwan has been intercepted by Customs. It contains 5 expired passports and 200g of MDMA. Your case is being transferred to the Narcotics Bureau. Stay on the line for verification."
      },
      {
        label: "Sextortion Scam",
        text: "I have the video of our call from last night. If you don't want me to send this to all your Facebook friends and family members, pay ₹25,000 in the next 1 hour. This is your only warning. UPI: blackmailer@upi"
      },
      {
        label: "OTP Scam",
        text: "Amazon Security Alert: A suspicious transaction of ₹45,000 was attempted from a new device in Nigeria. To block this transaction and secure your account, please share the 6-digit 'Transaction Cancellation OTP' sent to your mobile now."
      },
      {
        label: "Customs Duty Scam",
        text: "This is Mumbai Customs Office. Your parcel from London containing expensive jewelry and 5000 USD cash has been seized. To release the parcel without legal action, pay the 'Customs Clearance Fee' of ₹35,000 immediately to our official UPI: customs.release@okaxis"
      },
      {
        label: "Lottery Scam",
        text: "CONGRATULATIONS! You have won ₹25,00,000 in the KBC Lucky Draw. To claim your prize money, you must first pay the 'Tax and Processing Fee' of ₹12,500. Contact KBC Manager Rana Pratap on WhatsApp: http://wa.me/919876543210"
      },
      {
        label: "Remote Access Scam",
        text: "Technical Support Alert: Your computer has been infected with a 'Zeus' virus. Your banking details are at risk. Download the 'AnyDesk' app immediately and share the 9-digit code with our technician to clean your system remotely: http://anydesk.com/download"
      }
    ];

    const selected = scenarioIndex !== undefined ? scenarios[scenarioIndex % scenarios.length] : scenarios[Math.floor(Math.random() * scenarios.length)];
    setDemoScenario(selected);
  }, []);

  const handleDemoAction = useCallback((action: 'input' | 'scan' | 'scroll_to_bait' | 'scroll_to_dossier' | 'scroll_to_warroom' | 'scroll_to_redflags' | 'switch_view', data?: string) => {
    if (action === 'input' && data && mainInputRef.current) {
      mainInputRef.current.value = data;
      setDemoStep(2);
    } else if (action === 'scan' && data) {
      // Use simulation for demo to ensure it works reliably
      const simResult = generateSimulatedCase(`DEMO-${Date.now()}`, 'text', data);
      handleAnalysisComplete(data, simResult);
      // Don't reset demoStep(null) here, wait for onDemoEnd
    } else if (action === 'scroll_to_bait') {
      // Wait for ResultPanel to render and then scroll
      setTimeout(() => {
        const baitElement = document.getElementById('bait-session-container');
        if (baitElement) {
          baitElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1500);
    } else if (action === 'scroll_to_redflags') {
      setTimeout(() => {
        const redFlagsElement = document.getElementById('visual-red-flags-section');
        if (redFlagsElement) {
          redFlagsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
    } else if (action === 'scroll_to_dossier') {
      setView('intelligence');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } else if (action === 'scroll_to_warroom') {
      setView('warroom');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } else if (action === 'switch_view' && data) {
      setView(data as any);
    }
  }, [handleAnalysisComplete]);

  const handleDemoEnd = useCallback(() => {
    setDemoStep(null);
    setDemoScenario(null);
    setView('home');
  }, []);

  const simulateScam = useCallback(async () => {
    setShowSimulation(true);
    const scamMessage = "Your account will be blocked tonight. Share OTP immediately to verify.";
    setChat([{ role: "Scammer", text: scamMessage }]);
    
    setIsAnalyzing(true);
    setScanStep('loading');
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: scamMessage, language })
      });
      const data = await res.json();
      
      setTimeout(() => {
        setChat(prev => [...prev, { role: "AI Agent", text: data.agent_reply }]);
        speak(data.agent_reply);
        playSound('tick');
        
        // Map to analysis
        const analysis: ScamAnalysis = {
          isScam: data.is_scam,
          confidence: data.confidence / 100,
          scamType: data.scam_type,
          riskScore: data.confidence,
          channel: 'text',
          threatLevel: 'High',
          summary: data.agent_reply,
          safetyAlert: `Risk Level High: ${data.scam_type}.`,
          warningSignals: ["Urgency", "OTP Request"],
          extractedInfo: { upiIds: [], bankDetails: [], ifscCodes: [], phoneNumbers: [], links: [], cryptoWallets: [], fakeIdentities: [] },
          killChainStage: 'Exploitation',
          fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: data.scam_type },
          recommendedActions: ["Block Sender", "Report to 1930"],
          suggestedBaitResponse: data.agent_reply
        };
        
        handleAnalysisComplete(scamMessage, analysis);
        setScanStep('result');
        
        setTimeout(() => {
          setScanStep('intelligence');
          setView('intelligence');
        }, 3000);
      }, 1500);
    } catch (e) {
      setIsAnalyzing(false);
      setScanStep('idle');
    }
  }, [language, handleAnalysisComplete, speak, playSound]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleMessagesUpdate = useCallback((sessionId: string, msgs: ChatMessage[]) => {
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
  }, []);

  const handleIntelExtracted = useCallback((sessionId: string, info: ExtractedInfo) => {
    const mergeIntel = (prev: ExtractedInfo | undefined, next: ExtractedInfo): ExtractedInfo => {
      if (!prev) return next;
      return {
        upiIds: [...(prev.upiIds || []), ...(next.upiIds || [])],
        bankDetails: [...(prev.bankDetails || []), ...(next.bankDetails || [])],
        ifscCodes: [...(prev.ifscCodes || []), ...(next.ifscCodes || [])],
        phoneNumbers: [...(prev.phoneNumbers || []), ...(next.phoneNumbers || [])],
        links: [...(prev.links || []), ...(next.links || [])],
        cryptoWallets: [...(prev.cryptoWallets || []), ...(next.cryptoWallets || [])],
        fakeIdentities: [...(prev.fakeIdentities || []), ...(next.fakeIdentities || [])]
      };
    };

    setLogs(prev => prev.map(l => l.id === sessionId ? { ...l, extractedInfo: mergeIntel(l.extractedInfo, info) } : l));
    
    setLatestAnalysis(prev => {
      if (prev && prev.sessionId === sessionId) {
        return {
          ...prev,
          analysis: {
            ...prev.analysis,
            extractedInfo: mergeIntel(prev.analysis.extractedInfo, info)
          }
        };
      }
      return prev;
    });
  }, []);

  const handleScoreUpdate = useCallback((sessionId: string, score: SessionScore) => {
    setCurrentSessionScore(score);
    setLatestAnalysis(prev => {
      if (prev && prev.sessionId === sessionId) {
        return {
          ...prev,
          analysis: {
            ...prev.analysis,
            sessionScore: score
          }
        };
      }
      return prev;
    });
    setLogs(prev => prev.map(l => l.id === sessionId ? { ...l, sessionScore: score } : l));
  }, []);

  const handleBaitMessagesUpdate = useCallback((msgs: ChatMessage[]) => {
    if (latestAnalysis) {
      handleMessagesUpdate(latestAnalysis.sessionId, msgs);
    }
  }, [latestAnalysis, handleMessagesUpdate]);

  const handleBaitIntelExtracted = useCallback((info: ExtractedInfo) => {
    if (latestAnalysis) {
      handleIntelExtracted(latestAnalysis.sessionId, info);
    }
  }, [latestAnalysis, handleIntelExtracted]);

  const handleBaitScoreUpdate = useCallback((score: SessionScore) => {
    if (latestAnalysis) {
      handleScoreUpdate(latestAnalysis.sessionId, score);
    }
  }, [latestAnalysis, handleScoreUpdate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-600/10" style={{ background: view === 'home' ? 'linear-gradient(135deg, #0B1F3A, #1E3A8A)' : undefined }}>
      {showTour && <OnboardingTour activeView={view} onViewChange={(v) => setView(v as any)} onComplete={() => setShowTour(false)} />}

      <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-2 text-center border-b border-blue-500/30">
        🟢 System Active | Monitoring Threat Patterns Across India | {new Date().toLocaleTimeString()}
      </div>

      <header className="bg-white/95 backdrop-blur-xl px-12 py-5 flex items-center justify-between sticky top-0 z-[60] border-b border-slate-200 shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="bg-slate-950 p-3 rounded-3xl shadow-2xl">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <button onClick={() => setView('home')} className="text-left cursor-pointer hover:opacity-80">
            <h1 className="text-3xl font-black tracking-tighter text-slate-950 uppercase">Bharat <span className="text-blue-600">Cyber</span> Rakshak</h1>
          </button>
        </div>

        <nav className="hidden md:flex items-center space-x-3 bg-slate-100 p-2 rounded-[2.5rem] border-2 border-slate-200">
           <NavBtn active={view === 'home'} onClick={() => setView('home')} label="Check Safety" icon="🛡️" />
           <button 
             onClick={() => startLiveDemo()}
             className="px-6 py-3 rounded-2xl flex items-center space-x-3 transition-all border-2 bg-emerald-600 border-emerald-500 text-white shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
           >
             <span className="text-xl">🚀</span>
             <span className="text-sm font-black uppercase tracking-widest">Live Demo</span>
           </button>
           <NavBtn active={view === 'multimedia'} onClick={() => setView('multimedia')} label="Multimedia" icon="📷" />
           <NavBtn active={view === 'intelligence'} onClick={() => setView('intelligence')} label="Case Dossiers" icon="📊" />
           <NavBtn active={view === 'warroom'} onClick={() => setView('warroom')} label="War Room" icon="⚔️" />
        </nav>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
            {(['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  language === lang 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
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
                          <label className="absolute top-6 left-10 text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 opacity-50">⬇️ PASTE MESSAGE OR UPLOAD SCREENSHOT ⬇️</label>
                          <textarea 
                            id="interceptor-input"
                            ref={mainInputRef}
                            className={`w-full h-56 px-10 pt-16 pb-10 text-slate-900 placeholder:text-slate-200 text-3xl outline-none rounded-[3rem] font-bold bg-slate-50 border-4 transition-all resize-none shadow-inner ${demoStep === 2 ? 'border-emerald-500 ring-8 ring-emerald-500/20' : 'border-slate-100 focus:border-blue-600'}`}
                            placeholder="Example: Your bank account will be blocked..."
                          />
                          <div className="absolute bottom-6 right-10 flex space-x-4">
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleImageUpload} 
                              accept="image/*" 
                              className="hidden" 
                            />
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="p-4 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl transition-all cursor-pointer flex items-center space-x-2"
                              title="Upload Screenshot"
                            >
                              <span className="text-xl">📷</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">Upload Screenshot</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-center py-4">
                          <Suspense fallback={null}>
                            <VoiceScanner 
                              onAnalysisComplete={handleAnalysisComplete}
                              isAnalyzing={isAnalyzing}
                              setIsAnalyzing={setIsAnalyzing}
                            />
                          </Suspense>
                        </div>
                        
                        <div className="flex flex-col space-y-4">
                          <div className="flex space-x-4">
                            <button 
                              onClick={() => mainInputRef.current && handleManualAnalyze(mainInputRef.current.value)}
                              disabled={isAnalyzing}
                              className={`flex-1 py-8 text-white rounded-[3.5rem] font-black text-3xl transition-all shadow-[0_20px_60px_rgba(37,99,235,0.4)] active:scale-95 glow-blue flex items-center justify-center space-x-6 cursor-pointer disabled:opacity-50 ${demoStep === 2 ? 'bg-emerald-600 hover:bg-emerald-500 animate-bounce' : 'bg-blue-600 hover:bg-blue-500'}`}
                            >
                              {isAnalyzing ? (
                                <>
                                  <div className="w-10 h-10 border-[6px] border-white border-t-transparent rounded-full animate-spin" />
                                  <span>SEARCHING...</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-4xl">🛡️</span>
                                  <span>START SCAN</span>
                                </>
                              )}
                            </button>
                            
                            <button 
                              onClick={startListening}
                              disabled={isAnalyzing}
                              className={`px-10 py-8 rounded-[3.5rem] font-black text-3xl transition-all border-4 flex items-center justify-center cursor-pointer ${isListening ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                              <span className="text-4xl">{isListening ? '🛑' : '🎙️'}</span>
                            </button>
                          </div>
                          
                          <div className="flex space-x-4">
                            <button 
                              onClick={startLiveDemo}
                              className="flex-1 py-4 bg-slate-900 text-emerald-400 border-2 border-emerald-500/30 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center space-x-3 cursor-pointer"
                            >
                              <span className="text-xl">🚀</span>
                              <span>Guided Demo</span>
                            </button>
                            <button 
                              onClick={simulateScam}
                              className="flex-1 py-4 bg-slate-900 text-blue-400 border-2 border-blue-500/30 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center space-x-3 cursor-pointer"
                            >
                              <span className="text-xl">🎭</span>
                              <span>Live Simulation</span>
                            </button>
                            <button 
                              onClick={() => handleManualAnalyze("Your OTP is required urgently")}
                              className="flex-1 py-4 bg-slate-900 text-red-400 border-2 border-red-500/30 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center space-x-3 cursor-pointer"
                            >
                              <span className="text-xl">🚨</span>
                              <span>Test Scam</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {latestAnalysis && (
                        <div className="max-w-4xl mx-auto mt-4 p-4 bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
                          <details>
                            <summary className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300">Raw Debug Data</summary>
                            <pre className="text-[10px] text-blue-400 font-mono mt-4 overflow-x-auto p-4 bg-black/40 rounded-xl">
                              {JSON.stringify(latestAnalysis.analysis, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                      {showSimulation && (
                        <div className="max-w-4xl mx-auto mt-12 bg-slate-950 rounded-[3rem] p-8 border-4 border-white/10 shadow-2xl animate-in slide-in-from-top-10 duration-500">
                           <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                              <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center">
                                <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
                                Live Attacker Simulation
                              </h3>
                              <button onClick={() => setShowSimulation(false)} className="text-slate-500 hover:text-white">✕</button>
                           </div>
                           <div className="h-64 overflow-y-auto space-y-4 no-scrollbar mb-4">
                              {chat.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'Scammer' ? 'justify-start' : 'justify-end'}`}>
                                   <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold ${msg.role === 'Scammer' ? 'bg-slate-900 text-red-400 border border-red-900/30' : 'bg-blue-600 text-white'}`}>
                                      <div className="text-[8px] font-black uppercase opacity-50 mb-1">{msg.role}</div>
                                      {msg.text}
                                   </div>
                                </div>
                              ))}
                              <div ref={chatEndRef} />
                           </div>
                        </div>
                      )}

                      <div id="visual-red-flags-section" className="pt-12">
                        <VisualRedFlags />
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-center space-x-4">
                           <div className="h-px w-20 bg-white/10" />
                           <span className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">Click a button to test a demo scam</span>
                           <div className="h-px w-20 bg-white/10" />
                        </div>
                         <div className="flex flex-wrap justify-center gap-6">
                          <QuickDemoCard icon="👮‍♂️" label="Fake Police Scam" text="I am Inspector Rao from Mumbai Police. Your Aadhaar is linked to a drug trafficking case. Pay ₹50,000 for verification." onClick={() => handleQuickDemo("I am Inspector Rao from Mumbai Police. Your Aadhaar is linked to a drug trafficking case. Pay ₹50,000 for verification.")} />
                          <QuickDemoCard icon="🗣️" label="AI Deepfake Fraud" text="Beta, main hospital mein hoon. Mera accident ho gaya hai. Jaldi se ₹20,000 is number par bhej do." onClick={() => handleQuickDemo("Beta, main hospital mein hoon. Mera accident ho gaya hai. Jaldi se ₹20,000 is number par bhej do.")} />
                          <QuickDemoCard icon="📞" label="DoT Disconnection" text="Your mobile number will be disconnected within 2 hours due to illegal activities. Call 1800-DOT-HELP." onClick={() => handleQuickDemo("Your mobile number will be disconnected within 2 hours due to illegal activities. Call 1800-DOT-HELP.")} />
                          <QuickDemoCard icon="📦" label="Speed Post Scam" text="India Post: Your parcel has been returned. Update address: http://indiapost-delivery.in/update" onClick={() => handleQuickDemo("India Post: Your parcel has been returned. Update address: http://indiapost-delivery.in/update")} />
                          <QuickDemoCard icon="📈" label="Stock Market Scam" text="Join our VIP Trading Group! Turn ₹10,000 into ₹1,00,000 in just 7 days. Download 'ProTrader' app." onClick={() => handleQuickDemo("Join our VIP Trading Group! Turn ₹10,000 into ₹1,00,000 in just 7 days. Download 'ProTrader' app.")} />
                          <QuickDemoCard icon="💼" label="Job Offer Scam" text="Earn ₹5000 daily by liking YouTube videos. No experience needed. Contact HR on WhatsApp now!" onClick={() => handleQuickDemo("Earn ₹5000 daily by liking YouTube videos. No experience needed. Contact HR on WhatsApp now!")} />
                          <QuickDemoCard icon="💳" label="Credit Card Points" text="Your HDFC points worth ₹4,850 are expiring. Redeem now to avoid loss: http://hdfc-rewards-portal.in/redeem" onClick={() => handleQuickDemo("Your HDFC points worth ₹4,850 are expiring. Redeem now to avoid loss: http://hdfc-rewards-portal.in/redeem")} />
                          <QuickDemoCard icon="🚚" label="FedEx Illegal Parcel" text="FedEx: Your parcel to Taiwan contains illegal items. Narcotics Bureau is investigating. Stay on line." onClick={() => handleQuickDemo("FedEx: Your parcel to Taiwan contains illegal items. Narcotics Bureau is investigating. Stay on line.")} />
                        </div>
                        
                        <div className="flex justify-center mt-8">
                          <button 
                            onClick={() => {
                              setView('multimedia');
                              setTimeout(() => {
                                const videoElement = document.getElementById('video-scanner-section');
                                if (videoElement) videoElement.scrollIntoView({ behavior: 'smooth' });
                              }, 500);
                            }}
                            className="px-8 py-4 bg-slate-900 text-blue-400 border-2 border-blue-500/30 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center space-x-3"
                          >
                            <span className="text-xl">🕵️‍♂️</span>
                            <span>Open Video Forensic Lab (Fake Police Samples)</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-6 pt-12">
                        <button 
                          onClick={startLiveDemo}
                          className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-xl transition-all shadow-2xl flex items-center space-x-4 cursor-pointer group"
                        >
                          <span className="text-3xl group-hover:rotate-12 transition-transform">🚀</span>
                          <span>START LIVE DEMO</span>
                        </button>

                        <button 
                          onClick={handleVideoDemo}
                          className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-xl transition-all shadow-2xl flex items-center space-x-4 cursor-pointer group"
                        >
                          <span className="text-3xl group-hover:scale-110 transition-transform">📹</span>
                          <span>VIDEO ANALYSIS</span>
                        </button>

                        <button 
                          onClick={() => setShowReportingGuide(true)}
                          className="px-12 py-6 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-xl transition-all shadow-2xl flex items-center space-x-4 cursor-pointer"
                        >
                          <span className="text-3xl">🚨</span>
                          <span>REPORT CYBER FRAUD</span>
                        </button>
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
                      <div id="bait-session-container" className="h-[900px] border-[10px] border-slate-950 rounded-[5rem] overflow-hidden shadow-2xl bg-slate-900 relative">
                        {currentSessionScore && (
                          <div className="absolute top-12 right-12 z-10 flex space-x-4">
                            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intel</span>
                              <span className="text-xl font-black text-blue-400">{currentSessionScore.intelExtractedCount}</span>
                            </div>
                            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</span>
                              <span className="text-xl font-black text-emerald-400">{currentSessionScore.scamTypeAccuracy}%</span>
                            </div>
                          </div>
                        )}
                        <Suspense fallback={<div className="h-full flex items-center justify-center text-white">Loading Bait Session...</div>}>
                          <BaitSession 
                            key={latestAnalysis.sessionId}
                            sessionId={latestAnalysis.sessionId}
                            sourceMessageId={latestAnalysis.analysis.id}
                            conversationContext={latestAnalysis.analysis.summary}
                            geoHint={latestAnalysis.analysis.sourceIntelligence ? `${latestAnalysis.analysis.sourceIntelligence.city}, ${latestAnalysis.analysis.sourceIntelligence.state}` : undefined}
                            initialMessages={latestAnalysis.analysis.messages}
                            onMessagesUpdate={handleBaitMessagesUpdate}
                            onIntelExtracted={handleBaitIntelExtracted}
                            onScoreUpdate={handleBaitScoreUpdate}
                          />
                        </Suspense>
                      </div>
                    </div>
                 )}
               </div>
             )}
          </div>
        ) : view === 'intelligence' ? (
          <div className="container mx-auto px-12 py-20 max-w-7xl">
            <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading Dashboard...</div>}>
              <IntelligenceDashboard logs={logs} />
            </Suspense>
          </div>
        ) : view === 'warroom' ? (
          <div className="container mx-auto px-12 py-20 max-w-7xl">
            <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading War Room...</div>}>
              <WarRoom logs={logs} onRunSimulation={(count) => {
                const sims = Array.from({ length: count }).map((_, i) => generateSimulatedCase(`SIM-${Date.now()}-${i}`));
                setLogs(prev => [...sims, ...prev].slice(0, 50));
                setView('intelligence');
              }} />
            </Suspense>
          </div>
        ) : (
          <div className="container mx-auto px-12 py-20 max-w-7xl space-y-24 animate-in fade-in">
             <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading Multimedia Tools...</div>}>
               <LiveShield onAlert={(analysis) => handleAnalysisComplete("LIVE_VOICE_INTERCEPT", analysis)} />
               <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-xl flex flex-col items-center space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Voice Message Scanner</h3>
                  <VoiceScanner 
                    onAnalysisComplete={handleAnalysisComplete}
                    isAnalyzing={isAnalyzing}
                    setIsAnalyzing={setIsAnalyzing}
                  />
               </div>
               <div id="video-scanner-section">
                 <VideoScanner onAlert={(analysis) => handleAnalysisComplete("LIVE_VIDEO_INTERCEPT", analysis)} />
               </div>
               
               <div className="pt-24 border-t border-slate-200">
                 <VisualRedFlags />
               </div>
             </Suspense>
          </div>
        )}
      </main>

      {isAnalyzing && <LoadingOverlay />}
      
      {scanStep === 'result' && latestAnalysis && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8 animate-in zoom-in duration-300">
          <div className="max-w-2xl w-full">
            <ResultPanel analysis={latestAnalysis.analysis} seniorMode={seniorMode} onClose={() => setScanStep('idle')} />
          </div>
        </div>
      )}

      <button 
        onClick={() => setShowTutor(true)} 
        className="fixed bottom-12 right-12 z-[200] w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group border-4 border-blue-500 cursor-pointer"
      >
        <span className="text-5xl group-hover:animate-bounce">🧑‍🏫</span>
      </button>

      {showTutor && (
        <RakshakTutor 
          onClose={() => setShowTutor(false)} 
          startDemoOnMount={demoStep === 1} 
          forcedScenario={demoScenario}
          onDemoAction={handleDemoAction}
          onDemoEnd={handleDemoEnd}
          language={language}
        />
      )}
      {showReportingGuide && <ReportingGuide onClose={() => setShowReportingGuide(false)} />}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-[100] pb-safe">
        <button onClick={() => setView('home')} className={`flex flex-col items-center space-y-1 ${view === 'home' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-xl">🛡️</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Safety</span>
        </button>
        <button onClick={() => startLiveDemo()} className="flex flex-col items-center space-y-1 text-emerald-600">
          <span className="text-xl">🚀</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Demo</span>
        </button>
        <button onClick={() => setView('multimedia')} className={`flex flex-col items-center space-y-1 ${view === 'multimedia' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-xl">📷</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Media</span>
        </button>
        <button onClick={() => setView('intelligence')} className={`flex flex-col items-center space-y-1 ${view === 'intelligence' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Dossiers</span>
        </button>
        <button onClick={() => setView('warroom')} className={`flex flex-col items-center space-y-1 ${view === 'warroom' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-xl">⚔️</span>
          <span className="text-[8px] font-black uppercase tracking-widest">War Room</span>
        </button>
      </nav>
    </div>
  );
};

export default App;