
import React, { useState, useRef, useEffect } from 'react';
import { askTutor } from '../services/tutorService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { decodeBase64, decodeAudioData, generateSpeech } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  audio?: AudioBuffer;
}

const RakshakTutor: React.FC<{ 
  onClose: () => void, 
  startDemoOnMount?: boolean,
  forcedScenario?: { label: string, text: string } | null,
  onDemoAction?: (action: 'input' | 'scan' | 'scroll_to_bait' | 'scroll_to_dossier' | 'scroll_to_warroom' | 'scroll_to_redflags' | 'switch_view', data?: string) => void,
  onDemoEnd?: () => void,
  language?: 'Hindi' | 'English' | 'Telugu' | 'Tamil' | 'Kannada'
}> = ({ onClose, startDemoOnMount, forcedScenario, onDemoAction, onDemoEnd, language = 'Hindi' }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: language === 'Hindi' 
      ? "Namaste! Main Bharat Cyber Rakshak hoon – aapka digital guardian. Main aapko SMS, WhatsApp, aur screenshots mein hone waale cyber dhoke se bacha sakta hoon. Aap mujhse Hindi, English, Telugu, Tamil, ya Kannada mein baat kar sakte hain. Main aapki kaise madad karoon?"
      : language === 'English'
      ? "Namaste! I am Bharat Cyber Rakshak – your digital guardian. I can protect you from cyber fraud in SMS, WhatsApp, and screenshots. You can talk to me in Hindi, English, Telugu, Tamil, or Kannada. How can I help you?"
      : language === 'Telugu'
      ? "నమస్తే! నేను భారత్ సైబర్ రక్షక్ – మీ డిజిటల్ గార్డియన్. SMS, WhatsApp మరియు స్క్రీన్‌షాట్ల నుండి జరిగే సైబర్ మోసాల నుండి నేను మిమ్మల్ని రక్షించగలను. మీరు నాతో హిందీ, ఇంగ్లీஷ், తెలుగు, తమిళం లేదా కన్నడలో మాట్లాడవచ్చు. నేను మీకు ఎలా సహాయం చేయగలను?"
      : language === 'Tamil'
      ? "வணக்கம்! நான் பாரத் சைபர் ரக்ஷக் – உங்கள் டிஜிட்டல் பாதுகாவலர். SMS, WhatsApp மற்றும் ஸ்கிரீன்ஷாட்களில் நடக்கும் சைபர் மோசடிகளில் இருந்து உங்களை என்னால் பாதுகாக்க முடியும். நீங்கள் என்னிடம் இந்தி, ஆங்கிலம், தெலுங்கு, தமிழ் அல்லது கன்னடத்தில் பேசலாம். நான் உங்களுக்கு எப்படி உதவ முடியும்?"
      : "ನಮಸ್ತೆ! ನಾನು ಭಾರತ್ ಸೈಬರ್ ರಕ್ಷಕ್ – ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಗಾರ್ಡಿಯನ್. SMS, WhatsApp ಮತ್ತು ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳಲ್ಲಿ ನಡೆಯುವ ಸೈಬರ್ ವಂಚನೆಗಳಿಂದ ನಾನು ನಿಮ್ಮನ್ನು ರಕ್ಷಿಸಬಲ್ಲೆ. ನೀವು ನನ್ನೊಂದಿಗೆ ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್, ತೆಲುಗು, ತಮಿಳು ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಹುದು. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const demoIdRef = useRef<number>(0);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const getAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const lastStartedScenarioRef = useRef<string | null>(null);
  
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const response = await askTutor(userMsg, history);
    
    setIsTyping(false);
    const modelMsg: Message = { role: 'model', text: response || "Maaf kijiye, hum connect nahi kar paaye." };
    
    if (autoSpeak && response) {
      try {
        const audio = await generateSpeech(response, 'Kore');
        modelMsg.audio = audio;
        playMessageAudio(audio, messages.length + 1);
      } catch (e) {
        console.error("Auto-speak failed", e);
      }
    }
    
    setMessages(prev => [...prev, modelMsg]);
  };

  const startDemo = async (specificScenario?: { label: string; text: string }) => {
    const currentDemoId = ++demoIdRef.current;
    setIsDemoMode(true);
    
    const scenarios = [
      {
        label: "Digital Arrest Scam",
        text: "This is DCP Vikram Rao from Mumbai Police Cyber Cell. You are under 'Digital Arrest' for high-value money laundering. Transfer ₹50,000 for 'Bail Verification' to our secure nodal account: mumbai.police.verify@okaxis"
      },
      {
        label: "AI Deepfake Scam",
        text: "[AI Voice Synthesis] Beta, main hospital mein hoon. Mera accident ho gaya hai. Doctor operation shuru nahi kar rahe jab tak ₹20,000 deposit nahi hote. Jaldi se emergency.medical.help@okaxis par bhej do."
      },
      {
        label: "Investment Scam",
        text: "VIP Institutional Trading Group: Our AI-driven predictive models guarantee 200% returns in 7 days. Download the 'ProTrader' app: http://pro-trader-app.in/download"
      }
    ];

    const demoScenarios = specificScenario ? [specificScenario] : (forcedScenario ? [forcedScenario] : scenarios);
    
    const runStep = async (stepNum: number, module: string, action: string, uiEvent: string, data: string, narration: { en: string, hi: string, te: string }) => {
      if (currentDemoId !== demoIdRef.current) return;
      
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 1000));
      
      if (uiEvent !== 'none' && onDemoAction) {
        onDemoAction(uiEvent as any, data);
      }

      const text = `STEP ${stepNum}:\nMODULE: ${module}\nACTION: ${action}\nUI_EVENT: ${uiEvent}\n\nNARRATION:\n- English: ${narration.en}\n- Hindi: ${narration.hi}\n- Telugu: ${narration.te}`;
      
      const msg: Message = { role: 'model', text };
      if (autoSpeak) {
        try {
          const speechText = language === 'Hindi' ? narration.hi : language === 'Telugu' ? narration.te : narration.en;
          const audio = await generateSpeech(speechText, 'Kore');
          msg.audio = audio;
        } catch (e) {}
      }
      
      setMessages(prev => {
        const newMessages = [...prev, msg];
        if (msg.audio) playMessageAudio(msg.audio, newMessages.length - 1);
        return newMessages;
      });
      
      setIsTyping(false);
      await new Promise(r => setTimeout(r, 4000));
    };

    await runStep(0, "Multilingual Interaction Layer", "System Initialization", "none", "", {
      en: "Initializing AI-Based Multimodal Cyber Fraud Detection and Interactive Response System (Bharat Cyber Rakshak).",
      hi: "AI-Based Multimodal Cyber Fraud Detection and Interactive Response System (Bharat Cyber Rakshak) ko prarambh kiya ja raha hai.",
      te: "AI-ఆధారిత మల్టీమోడల్ సైబర్ ఫ్రాడ్ డిటెక్షన్ మరియు ఇంటరాక్టివ్ రెస్పాన్స్ సిస్టమ్ (భారత్ సైబర్ రక్షక్) ప్రారంభించబడుతోంది."
    });

    for (let sIdx = 0; sIdx < demoScenarios.length; sIdx++) {
      const caseData = demoScenarios[sIdx];
      
      await runStep(1, "Input Processing Module", "Receive suspicious input", "input", caseData.text, {
        en: `Processing Case ${sIdx + 1}: ${caseData.label}. Input Processing Module is ingesting the suspicious communication vector.`,
        hi: `Case ${sIdx + 1}: ${caseData.label} ko process kiya ja raha hai. Input Processing Module sandigdh sanchar ko grahan kar raha hai.`,
        te: `కేస్ ${sIdx + 1}: ${caseData.label} ప్రాసెస్ చేయబడుతోంది. ఇన్‌పుట్ ప్రాసెసింగ్ మాడ్యూల్ అనుమానాస్పద సమాచారాన్ని స్వీకరిస్తోంది.`
      });

      await runStep(2, "AI Fraud Detection Engine", "Detect and classify fraud", "scan", caseData.text, {
        en: "AI Fraud Detection Engine is executing classification algorithms to identify fraud patterns and intent.",
        hi: "AI Fraud Detection Engine fraud patterns aur uddeshya ki pehchan ke liye classification algorithms chala raha hai.",
        te: "AI ఫ్రాడ్ డిటెక్షన్ ఇంజిన్ మోసపూరిత నమూనాలు మరియు ఉద్దేశ్యాన్ని గుర్తించడానికి క్లాసిఫికేషన్ అల్గారిథమ్‌లను అమలు చేస్తోంది."
      });

      await runStep(3, "Multimodal Analysis Engine", "Analyze text / voice / visual signals", "scroll_to_redflags", "", {
        en: "Multimodal Analysis Engine is correlating cross-modal signals including linguistic urgency and visual red flags.",
        hi: "Multimodal Analysis Engine bhashayi jaldbazi aur drishya sanketon sahit cross-modal signals ka vishleshan kar raha hai.",
        te: "మల్టీమోడల్ అనాలిసిస్ ఇంజిన్ భాషాపరమైన అత్యవసర స్థితి మరియు దృశ్య సంకేతాలతో సహా క్రాస్-మోడల్ సిగ్నల్స్‌ను విశ్లేషిస్తోంది."
      });

      await runStep(4, "Honeypot Interaction Engine", "Engage scammer and extract data", "scroll_to_bait", "", {
        en: "Honeypot Interaction Engine is initiating autonomous engagement to extract adversary intelligence and UPI footprints.",
        hi: "Honeypot Interaction Engine scammer se sampark karke unka UPI handle aur data nikal raha hai.",
        te: "హనీపాట్ ఇంటరాక్షన్ ఇంజిన్ స్కామర్ నుండి UPI హ్యాండిల్ మరియు డేటాను సేకరించడానికి స్వయంప్రతిపత్తితో నిమగ్నమై ఉంది."
      });

      await runStep(5, "Intelligence Generation Module", "Generate cyber intelligence dossier", "scroll_to_dossier", "", {
        en: "Intelligence Generation Module is compiling a comprehensive cyber intelligence dossier for governance reporting.",
        hi: "Intelligence Generation Module governance reporting ke liye ek vistrit cyber intelligence dossier taiyaar kar raha hai.",
        te: "ఇంటెలిజెన్స్ జనరేషన్ మాడ్యూల్ గవర్నెన్స్ రిపోర్టింగ్ కోసం సమగ్ర సైబర్ ఇంటెలిజెన్స్ డాసియర్‌ను రూపొందిస్తోంది."
      });

      await runStep(6, "War Room Monitoring System", "Map threat to larger patterns", "scroll_to_warroom", "", {
        en: "War Room Monitoring System is mapping the extracted threat to national infrastructure and cluster patterns.",
        hi: "War Room Monitoring System nikale gaye khatre ko rashtriya infrastructure aur cluster patterns se map kar raha hai.",
        te: "వార్ రూమ్ మానిటరింగ్ సిస్టమ్ సేకరించిన ముప్పును జాతీయ మౌలిక సదుపాయాలు మరియు క్లస్టర్ నమూనాలతో మ్యాప్ చేస్తోంది."
      });

      await runStep(7, "AI Fraud Detection Engine", "Output risk level and recommendation", "none", "", {
        en: "Final risk assessment output generated with autonomous action recommendations for citizen protection.",
        hi: "Nagrik suraksha ke liye autonomous action recommendations ke saath antim risk assessment output taiyaar kiya gaya hai.",
        te: "పౌర రక్షణ కోసం స్వయంప్రతిపత్తి చర్య సిఫార్సులతో తుది రిస్క్ అసెస్‌మెంట్ అవుట్‌పుట్ రూపొందించబడింది."
      });
    }

    await runStep(8, "Intelligence Generation Module", "Correlate multiple fraud cases", "switch_view", "intelligence", {
      en: "The system correlates multiple fraud cases to identify organized network patterns and scale across diverse scenarios.",
      hi: "System sangathit network patterns ki pehchan karne ke liye kai fraud cases ko aapas mein jodta hai.",
      te: "ఆర్గనైజ్డ్ నెట్‌వర్క్ నమూనాలను గుర్తించడానికి సిస్టమ్ బహుళ మోసపూరిత కేసులను పరస్పరం అనుసంధానిస్తుంది."
    });

    await runStep(9, "Multilingual Interaction Layer", "Final Novelty Statement", "none", "", {
      en: "Novelty: This system's uniqueness lies in its autonomous closed-loop engagement and real-time multimodal correlation, differing from traditional passive detection systems.",
      hi: "Novelty: Is system ki visheshta iske autonomous closed-loop engagement aur real-time multimodal correlation mein hai, jo ise paramparagat detection systems se alag banata hai.",
      te: "నవ్యత: ఈ సిస్టమ్ యొక్క ప్రత్యేకత దాని స్వయంప్రతిపత్తి క్లోజ్డ్-లూప్ ఎంగేజ్‌మెంట్ మరియు రియల్-టైమ్ మల్టీమోడల్ కోరిలేషన్‌లో ఉంది, ఇది సాంప్రదాయ డిటెక్షన్ సిస్టమ్స్ నుండి భిన్నంగా ఉంటుంది."
    });

    setIsDemoMode(false);
    if (onDemoEnd) onDemoEnd();
  };

  useEffect(() => {
    const scenarioKey = forcedScenario ? forcedScenario.label : (startDemoOnMount ? 'default' : null);
    if (scenarioKey && scenarioKey !== lastStartedScenarioRef.current) {
      lastStartedScenarioRef.current = scenarioKey;
      startDemo();
    }
  }, [startDemoOnMount, forcedScenario]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isVoiceActive]);

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const startVoiceMode = async () => {
    setIsVoiceActive(true);
    nextStartTimeRef.current = 0;
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported in this browser/context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmPart = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ audio: pcmPart }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text || '';
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user' && last?.text.startsWith('[Voice]')) {
                   return [...prev.slice(0, -1), { role: 'user', text: `[Voice] ${text}` }];
                }
                return [...prev, { role: 'user', text: `[Voice] ${text}` }];
              });
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text || '';
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model' && !last?.text.includes("Namaste")) {
                   return [...prev.slice(0, -1), { role: 'model', text: text }];
                }
                return [...prev, { role: 'model', text: text }];
              });
            }

            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data && audioContextRef.current) {
                  const base64Audio = part.inlineData.data;
                  const ctx = audioContextRef.current;
                  if (ctx.state === 'suspended') await ctx.resume();
                  
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  
                  const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  source.addEventListener('ended', () => sourcesRef.current.delete(source));
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                }
              }
            }

            if (msg.serverContent?.interrupted) {
              for (const s of sourcesRef.current.values()) { 
                try { s.stop(); } catch(e) {}
                sourcesRef.current.delete(s); 
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Tutor Voice Error", e),
          onclose: () => stopVoiceMode(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `SYSTEM PROMPT: BHARAT CYBER RAKSHAK - RAKSHAK MITRA (EXPERT PRESENTER)

You are Rakshak Mitra, an expert cyber safety presenter. Explain threats with precision and impact, like a live demo.

CORE RULES:
- Use a structured format: 1-line Definition, 3 Key Points, 1 Real-world Example, 1 "Why it Matters" statement.
- If summarizing multiple cases, use this format: Case 1: 👉 "This is a [scam type]", Case 2: 👉 "This is a [scam type]".
- Deliver in the user's preferred language (English, Hindi, or Telugu).
- Tone: Confident, professional, and engaging. Easy for beginners to understand.
- Use a calm, kind, and reassuring female Indian voice.
- NO technical jargon.
- Guide the user step-by-step through the app.
- Operate with calm intelligence and zero hallucination.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Voice mode failed", err);
      setErrorMsg(err.message || "Voice mode failed. Please check permissions.");
      setIsVoiceActive(false);
    }
  };

  const stopVoiceMode = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsVoiceActive(false);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.debug("AudioContext close failed", e));
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.debug("AudioContext cleanup failed", e));
      }
    };
  }, []);

  const playMessageAudio = async (audio: AudioBuffer, index: number) => {
    if (speakingMsgIndex !== null && speakingMsgIndex !== index) return;
    setSpeakingMsgIndex(index);
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = audio;
    source.connect(ctx.destination);
    source.onended = () => {
      setSpeakingMsgIndex(null);
    };
    source.start();
  };

  const handleSpeakMessage = async (text: string, index: number) => {
    if (speakingMsgIndex !== null) return;
    setSpeakingMsgIndex(index);
    try {
      const audio = await generateSpeech(text, 'Kore');
      playMessageAudio(audio, index);
    } catch (e) {
      console.error("Manual speak failed", e);
      setSpeakingMsgIndex(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-[90vw] md:w-[400px] h-[600px] bg-slate-900 border border-blue-500/30 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className={`p-6 flex items-center justify-between shadow-lg transition-colors duration-500 ${isVoiceActive ? 'bg-emerald-600' : 'bg-blue-600'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isVoiceActive ? 'bg-white/30 animate-pulse' : 'bg-white/20'}`}>
            <span className="text-xl">{isVoiceActive ? '🎙️' : '🧑‍🏫'}</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{isVoiceActive ? 'Voice Help' : 'Rakshak Mitra'}</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isVoiceActive ? 'bg-emerald-200' : 'bg-green-400'}`} />
                <span className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">{isVoiceActive ? 'Listening...' : 'Your Guardian'}</span>
              </div>
              {!isVoiceActive && (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all ${autoSpeak ? 'bg-white text-blue-600 border-white' : 'bg-white/10 text-white border-white/20'}`}
                  >
                    {autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}
                  </button>
                  <button 
                    onClick={() => isDemoMode ? (demoIdRef.current++) : startDemo()}
                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-all ${isDemoMode ? 'bg-red-500 text-white border-red-400' : 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400'}`}
                  >
                    {isDemoMode ? 'Stop Demo' : 'Live Demo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white">✕</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] relative">
        {errorMsg && (
          <div className="bg-red-600/20 border border-red-500 p-4 rounded-xl text-red-500 text-[10px] font-bold text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}
        {isVoiceActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
             <div className="w-48 h-48 border-4 border-emerald-500 rounded-full animate-ping" />
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 group`}>
            <div className={`relative max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
            }`}>
              {m.text}
              {m.role === 'model' && (
                <button 
                  onClick={() => handleSpeakMessage(m.text, i)}
                  disabled={speakingMsgIndex !== null}
                  className={`absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs transition-all opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white disabled:opacity-30 ${speakingMsgIndex === i ? 'opacity-100 text-blue-500' : ''}`}
                >
                  {speakingMsgIndex === i ? '🔊' : '🔈'}
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-5 py-3 rounded-2xl rounded-bl-none border border-white/5 flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={isVoiceActive ? stopVoiceMode : startVoiceMode}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
              isVoiceActive ? 'bg-red-600 animate-pulse shadow-[0_0_20px_#ef4444]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVoiceActive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          <form onSubmit={handleSend} className="flex-1 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping || isVoiceActive}
              placeholder={isVoiceActive ? "Main sun raha hoon..." : "Poochiye, main help karunga..."}
              className="w-full bg-slate-800 border border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping || isVoiceActive}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RakshakTutor;
