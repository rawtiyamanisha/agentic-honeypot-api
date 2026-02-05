import React, { useState, useEffect } from 'react';

interface Props {
  activeView: string;
  onViewChange: (view: string) => void;
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Sovereign Greeting',
    description: 'Welcome to Bharat Cyber Rakshak. You have been authorized to use India\'s premier autonomous cyber-fraud defense grid. Prepare for a system calibration.',
    view: 'home',
    highlight: null,
  },
  {
    id: 'analyzer',
    title: 'Interception Terminal',
    description: 'Paste any suspicious message here. Our neural engine will analyze linguistic patterns, infrastructure metadata, and correlate them with thousands of known fraud signatures.',
    view: 'home',
    highlight: 'interceptor-input',
  },
  {
    id: 'navigation',
    title: 'Strategic Navigation',
    description: 'Access the tactical grid, Multimedia Intel for voice/video forensics, or the War Room for high-fidelity simulation and asset forging.',
    view: 'home',
    highlight: 'nav-grid',
  },
  {
    id: 'intelligence',
    title: 'National Threat Matrix',
    description: 'Visualize live threat clusters across the country. Monitor digital arrest loops and utility frauds as they propagate through the national grid.',
    view: 'intelligence',
    highlight: 'threat-grid',
  },
  {
    id: 'warroom',
    title: 'The Identity Forge',
    description: 'In the War Room, you can synthesize "Bait Assets"—fake IDs and bank statements—to engage scammers and safely siphon their critical intelligence.',
    view: 'warroom',
    highlight: 'forge-panel',
  },
  {
    id: 'multimedia',
    title: 'Live Audio Shield',
    description: 'Activate real-time monitoring for suspicious calls. Our system detects authority impersonation and pressure tactics as they happen in live conversation.',
    view: 'multimedia',
    highlight: 'live-shield',
  },
];

const OnboardingTour: React.FC<Props> = ({ activeView, onViewChange, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (step.view !== activeView) {
      onViewChange(step.view);
    }
  }, [currentStep, activeView, onViewChange, step.view]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => onComplete();

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={handleSkip} />
      
      <div className="relative z-[2001] w-full max-w-xl bg-slate-900 border border-blue-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(59,130,246,0.3)] overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 right-0 p-8">
          <div className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.4em] animate-pulse">
            STEP_{currentStep + 1}/06
          </div>
        </div>

        <div className="p-12 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] font-mono">
              System_Calibration // {step.id.toUpperCase()}
            </h3>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              {step.title}
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-white/5">
            <button 
              onClick={handleSkip}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
            >
              Skip Protocol
            </button>
            
            <div className="flex space-x-2">
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'bg-blue-500 w-6' : 'bg-slate-800'}`} 
                />
              ))}
            </div>

            <button 
              onClick={handleNext}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-blue-900/40 transition-all active:scale-95 cursor-pointer"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Activate Grid' : 'Proceed →'}
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;