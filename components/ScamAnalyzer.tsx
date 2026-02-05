

import React, { useState, useEffect, useRef } from 'react';
import { analyzeMessage } from '../services/geminiService';
import { ScamAnalysis, ScamSignature } from '../types';

interface Props {
  onAnalysisComplete: (message: string, analysis: ScamAnalysis) => void;
  onAnalysisStart: () => void;
  onClear: () => void;
  scamLibrary?: ScamSignature[];
}

const COMMON_SCAM_EXAMPLES = [
  "Police: Your Aadhaar is linked to money laundering. Pay now to avoid arrest.",
  "HDFC Alert: Your KYC is expired. Click here to verify your account.",
  "Earn 5000 daily from home. Follow t.me/profit_tasks.",
  "Power Cut: Pay pending electricity bill immediately to call 7001234455."
];

const ScamAnalyzer: React.FC<Props> = ({ onAnalysisComplete, onAnalysisStart, onClear, scamLibrary = [] }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    onAnalysisStart();
    try {
      // Fix: analyzeMessage only expects 1 argument (the message string)
      const result = await analyzeMessage(input);
      onAnalysisComplete(input, result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 mb-2">
           <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Checking Message Integrity</span>
        </div>

        <textarea
          ref={inputRef}
          className="w-full min-h-[10rem] p-6 bg-slate-50 border border-slate-200 rounded-3xl text-slate-900 outline-none transition-all resize-none text-lg font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
          placeholder="Paste the suspicious text here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || input.length < 5}
            className={`flex-1 py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-3 active:scale-95 ${
              loading || input.length < 5 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl'
            }`}
          >
            {loading ? <span>Analyzing...</span> : <span>Check Safety</span>}
          </button>
          <button
             onClick={() => {setInput(''); onClear();}}
             className="px-8 py-5 bg-slate-100 text-slate-500 hover:text-navy-900 rounded-2xl font-bold transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {COMMON_SCAM_EXAMPLES.map((ex, i) => (
          <button 
            key={i}
            onClick={() => setInput(ex)}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-600 uppercase tracking-wider transition-all"
          >
            Example {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScamAnalyzer;
