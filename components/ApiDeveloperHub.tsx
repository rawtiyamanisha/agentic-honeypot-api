
import React from 'react';

const ApiDeveloperHub: React.FC = () => {
  const serverCode = `import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const HONEY_POT_SYSTEM_PROMPT = \`You are the undercover Honey-Pot Agent... [Full prompt in server.js]\`;

app.post("/rakshak", async (req, res) => {
  const { conversation_id, message, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...history.map(h => ({ role: h.role === 'scammer' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: HONEY_POT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);`;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h2 className="text-4xl font-black text-navy-900 tracking-tighter uppercase">Developer API Hub</h2>
        <p className="text-slate-600 font-medium max-w-2xl">Integrate Bharat Cyber Rakshak's intelligence into your own systems using our standard REST gateway.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">server.js (Node.js ESM)</span>
             </div>
             <button onClick={() => {
                navigator.clipboard.writeText(serverCode);
                alert("Code copied to clipboard!");
             }} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Copy Code</button>
          </div>
          <pre className="font-mono text-[11px] text-blue-300/80 leading-relaxed overflow-x-auto h-[400px] custom-scrollbar">
            {serverCode}
          </pre>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-6">
              <h3 className="text-xl font-black text-navy-900 uppercase tracking-tight">API Reference</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Endpoint</span>
                    <span className="text-xs font-mono font-bold text-navy-900">POST /rakshak</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Auth</span>
                    <span className="text-xs font-mono font-bold text-blue-600">Env: GEMINI_API_KEY</span>
                 </div>
              </div>
              <div className="pt-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Production Deployment</h4>
                 <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                       <p className="text-xs font-bold text-blue-800">1. Install Node.js 18+</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                       <p className="text-xs font-bold text-blue-800">2. Run `npm install`</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                       <p className="text-xs font-bold text-blue-800">3. Set GEMINI_API_KEY in .env</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDeveloperHub;
