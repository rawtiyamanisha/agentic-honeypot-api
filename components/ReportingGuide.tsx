import React from 'react';

interface Props {
  onClose: () => void;
}

const ReportingGuide: React.FC<Props> = ({ onClose }) => {
  const steps = [
    {
      title: "Call 1930 Immediately",
      desc: "This is the National Cyber Crime Helpline. Call as soon as you realize you've been defrauded. The first 2 hours (Golden Hour) are critical to freeze the money in the scammer's account.",
      icon: "📞"
    },
    {
      title: "Visit cybercrime.gov.in",
      desc: "Go to the official National Cyber Crime Reporting Portal. Click on 'Report Women/Child Related Crime' or 'Report Other Cyber Crime'.",
      icon: "🌐"
    },
    {
      title: "Keep Evidence Ready",
      desc: "Save screenshots of the scam message, transaction receipts, bank statements, and the scammer's phone number or UPI ID.",
      icon: "📸"
    },
    {
      title: "File a Complaint",
      desc: "Fill in the details of the incident, including the platform used (WhatsApp, Facebook, etc.) and the amount lost. Provide the evidence you saved.",
      icon: "📝"
    },
    {
      title: "Contact Your Bank",
      desc: "Inform your bank's nodal officer about the fraudulent transaction to block your cards or accounts and initiate a chargeback if possible.",
      icon: "🏦"
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
        <header className="p-10 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-4xl">🚨</div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">How to Report Cyber Fraud</h2>
              <p className="text-red-100 font-bold uppercase text-xs tracking-widest mt-1">Official Government Guidelines</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white text-2xl">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-8 rounded-[3rem] border-2 border-red-100 flex flex-col items-center text-center space-y-4">
              <span className="text-xs font-black text-red-600 uppercase tracking-widest">National Helpline</span>
              <span className="text-6xl font-black text-red-700">1930</span>
              <p className="text-sm text-red-800 font-bold leading-relaxed">Available 24/7. Call immediately to freeze fraudulent transactions.</p>
            </div>
            <div className="bg-blue-50 p-8 rounded-[3rem] border-2 border-blue-100 flex flex-col items-center text-center space-y-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Official Portal</span>
              <a href="https://cybercrime.gov.in" target="_blank" className="text-2xl font-black text-blue-700 underline underline-offset-8">cybercrime.gov.in</a>
              <p className="text-sm text-blue-800 font-bold leading-relaxed">File a formal complaint online with all your evidence.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] text-center">Step-by-Step Instructions</h3>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start space-x-6 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{step.icon}</div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-950 uppercase tracking-tight">{step.title}</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-10 rounded-[3rem] text-white text-center space-y-4">
            <h4 className="text-xl font-black uppercase tracking-widest">Remember: The Golden Hour</h4>
            <p className="text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
              The first 2 hours after a fraud occurs are the most critical. Reporting within this time increases the chances of recovering your money by up to 80%.
            </p>
          </div>
        </div>

        <footer className="p-8 bg-slate-50 border-t border-slate-200 flex justify-center">
          <button onClick={onClose} className="px-16 py-5 bg-slate-950 text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            I Understand
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ReportingGuide;
