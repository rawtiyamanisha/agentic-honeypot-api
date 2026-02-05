
import React, { useEffect, useRef, useState } from 'react';
import { apiStatus } from '../services/geminiService';

interface SafetyAlert {
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  details: string;
  isEngaging?: boolean;
}

interface Props {
  alert: SafetyAlert | null;
  onDismiss: () => void;
}

const SafetyBanner: React.FC<Props> = ({ alert, onDismiss }) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isThrottled, setIsThrottled] = useState(false);

  useEffect(() => {
    if (alert && bannerRef.current) {
      bannerRef.current.focus();
    }
    
    const interval = setInterval(() => {
      setIsThrottled(apiStatus.isThrottled);
    }, 2000);
    return () => clearInterval(interval);
  }, [alert]);

  if (!alert && !isThrottled) return null;

  // If throttled, we show a permanent yellow warning about Local Shield mode
  if (isThrottled && !alert) {
    return (
      <div className="sticky top-[73px] z-50 w-full bg-amber-500 text-white px-6 py-2 shadow-xl border-b border-white/10 flex items-center justify-center space-x-3">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">Local Shield Active // Neural Link Quota Exhausted // Heuristic Protection Enabled</span>
      </div>
    );
  }

  const isCritical = alert?.level === 'Critical';
  const isHigh = alert?.level === 'High' || isCritical;
  const isMed = alert?.level === 'Medium';
  const isLow = alert?.level === 'Low';

  const bgColor = isCritical ? 'bg-red-700' : isHigh ? 'bg-red-600' : isMed ? 'bg-orange-500' : 'bg-green-600';
  const icon = isLow ? (
    <svg className="w-7 h-7 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ) : (
    <svg className="w-7 h-7 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div 
      ref={bannerRef}
      tabIndex={-1}
      role="alert" 
      aria-live="assertive"
      className={`sticky top-[73px] z-50 w-full ${bgColor} text-white px-6 py-4 shadow-2xl animate-in slide-in-from-top-full duration-500 border-b border-white/10 transition-colors focus:outline-none`}
    >
      <div className="container mx-auto max-w-4xl flex items-center justify-between">
        <div className="flex items-center space-x-5 flex-1">
          <div className="relative shrink-0">
            <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner ${isHigh ? 'animate-bounce' : 'animate-pulse'}`}>
              {icon}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="sr-only">Important Security Alert: Level {alert?.level}</span>
              <h4 className="font-black text-[10px] uppercase tracking-[0.1em] text-white/80">
                CITIZEN SAFETY ADVISORY // {alert?.level} RISK {isLow ? 'VERIFIED' : 'DETECTION'}
              </h4>
            </div>
            <div className="flex flex-col">
              <p className="text-xl font-extrabold leading-tight">
                {alert?.message}
              </p>
              <p className="font-medium italic text-sm mt-1 text-white/90">{alert?.details}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onDismiss} 
          aria-label="Dismiss alert"
          className="p-3 hover:bg-white/10 rounded-full transition-all ml-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SafetyBanner;
