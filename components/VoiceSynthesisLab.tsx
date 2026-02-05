
import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';

const VoiceSynthesisLab: React.FC = () => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    try {
      const buffer = await generateSpeech(text, voice);
      
      // Convert AudioBuffer to Blob for playback/download
      const wav = audioBufferToWav(buffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to convert AudioBuffer to WAV format
  function audioBufferToWav(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = new Int16Array(buffer.length * numChannels);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        data[i * numChannels + channel] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
      }
    }
    
    const bufferArr = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(bufferArr);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 32 + data.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, data.length * 2, true);
    
    const dataView = new Uint8Array(bufferArr, 44);
    dataView.set(new Uint8Array(data.buffer));
    
    return bufferArr;
  }

  return (
    <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 space-y-10">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Deep-Acoustic Synthesis</h3>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Transform text bait into forensic voice files</p>
        </div>
        <div className="flex space-x-2">
          {['Kore', 'Puck', 'Zephyr', 'Charon'].map(v => (
            <button 
              key={v}
              onClick={() => setVoice(v)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${voice === v ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder=">>> ENTER TEXT FOR VOICE SYNTHESIS..."
          className="w-full h-32 bg-black border border-white/10 rounded-[2rem] p-8 text-sm text-blue-100 font-mono outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
        />

        <div className="flex gap-4">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !text}
            className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            {isGenerating ? 'Synthesizing Neural Waveform...' : 'Generate Forensic Audio'}
          </button>
          {audioUrl && (
            <a 
              href={audioUrl} 
              download="bait_audio.wav"
              className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-400 transition-all shadow-xl active:scale-95"
            >
              Download WAV
            </a>
          )}
        </div>

        {audioUrl && (
          <div className="pt-6 animate-in fade-in slide-in-from-top-4">
            <audio controls src={audioUrl} className="w-full opacity-80" />
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] text-center mt-4">Forensic Asset Ready for Deployment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSynthesisLab;
