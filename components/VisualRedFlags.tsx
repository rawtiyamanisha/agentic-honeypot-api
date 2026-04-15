import React from 'react';
import { motion } from 'motion/react';

const VisualRedFlags = () => {
  const flags = [
    {
      title: "Platform Choice",
      description: "Official police business is NEVER conducted via WhatsApp, Skype, or Telegram video calls. If they are calling you on these apps, it is 100% a scam.",
      icon: "📱",
      highlight: true
    },
    {
      title: "Replica Uniforms",
      description: "Scammers use low-quality police uniforms. Look for ill-fitting shirts, incorrect badges, or missing nameplates. Real officers don't wear uniforms for random video calls.",
      icon: "👔"
    },
    {
      title: "The 'Police Station' Set",
      description: "They often sit in a room with a single police banner or a low-quality set. The lighting is usually poor, and you might see household items (like curtains or fans) that don't belong in a real station.",
      icon: "🎥"
    },
    {
      title: "Fake Station Backgrounds",
      description: "They use green screens or static photos of police stations. Look for 'flat' lighting, blurred edges around the person, or backgrounds that don't change when they move.",
      icon: "🏢"
    },
    {
      title: "Intimidation Tactics",
      description: "They maintain a very serious, aggressive, and authoritative tone. They will shout, threaten immediate arrest, and forbid you from talking to family or lawyers.",
      icon: "😠"
    },
    {
      title: "Fake Documents",
      description: "They show fake 'Arrest Warrants' or 'CBI Notices' on screen. These often have spelling errors, generic logos, and 'Urgent' stamps that real documents don't have.",
      icon: "📄"
    }
  ];

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 mt-12">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-2xl border border-red-500/30">
          🚨
        </div>
        <div>
          <h2 className="text-white font-black text-xl uppercase tracking-tight">Visual Red Flags: Digital Arrest</h2>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">How to spot a fake police officer on a video call</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flags.map((flag, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-3xl transition-all group border ${
              flag.highlight 
              ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]' 
              : 'bg-black/40 border-white/5 hover:border-red-500/30'
            }`}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">{flag.icon}</div>
            <h3 className="text-white font-black text-sm mb-2 uppercase tracking-tight">{flag.title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{flag.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-red-600/10 border border-red-500/20 rounded-3xl space-y-4">
        <p className="text-red-400 text-xs font-bold leading-relaxed flex items-start">
          <span className="mr-3 text-lg">⚠️</span>
          <span>
            <strong>IMPORTANT:</strong> If you are on a video call with someone claiming to be a police officer who asks you to stay on the call until you transfer money, <strong>DISCONNECT IMMEDIATELY</strong>. This is a scam. Real police will never "digitally arrest" you or ask for bail money via UPI.
          </span>
        </p>
        <div className="h-px bg-red-500/20" />
        <p className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center">
          <span className="mr-3 text-lg">📱</span>
          <span>Official police business is NEVER conducted via WhatsApp, Skype, or Telegram.</span>
        </p>
      </div>
    </div>
  );
};

export default VisualRedFlags;
