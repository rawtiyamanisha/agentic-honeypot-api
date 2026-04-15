import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // In-memory intelligence store
  const memory: any[] = [];

  app.get("/health", (_, res) => {
    res.json({ status: "ok" });
  });

  const getAI = () => {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('API key must be set when using the Gemini API.');
    }
    return new GoogleGenAI({ apiKey: key });
  };

  /**
   * SOVEREIGN DEFENSE PERSONA
   * Designed to act as a believable, slightly worried Indian citizen to bait scammers.
   */
  const RAKSHAK_SYSTEM_PROMPT = `You are an undercover AI Honeypot Agent for the Bharat Cyber Rakshak system.
  Your mission is to detect scams, engage the scammer, and extract intelligence (UPI IDs, bank accounts, links).

  BEHAVIORAL RULES:
  1. ACT AS A VICTIM: Be polite, slightly panicked, and technically confused. Use "Hinglish" nuances (e.g., "Sir please don't block", "I am trying but app is slow").
  2. KEEP THEM TALKING: Your goal is to keep the conversation going as long as possible.
  3. EXTRACT INTEL: Ask for their payment details to "verify" or "pay the fine". Force them to reveal mule accounts.
  4. NEVER REVEAL: Do not mention you are an AI, a detection system, or that this is a scam.

  JSON OUTPUT FORMAT (MANDATORY):
  Return ONLY a valid JSON object.
  {
    "is_scam": boolean,
    "scam_type": "KYC | Bank | Courier | Job | Crypto | Unknown",
    "agent_reply": "Your next message to send to the scammer",
    "extracted_intelligence": {
      "upi_ids": [],
      "bank_accounts": [],
      "ifsc_codes": [],
      "phone_numbers": [],
      "phishing_urls": []
    },
    "tactics_detected": ["Urgency", "Authority Impersonation", etc.],
    "confidence_score": number
  }`;

  app.post('/rakshak', async (req, res) => {
    const { conversation_id, message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    try {
      const ai = getAI();
      const contents = history.map((h: any) => ({
        role: h.role === 'scammer' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents,
        config: {
          systemInstruction: RAKSHAK_SYSTEM_PROMPT,
          responseMimeType: "application/json"
        },
      });

      const rawOutput = response.text || "{}";
      const cleanedJson = rawOutput.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      res.json({
        ...parsed,
        conversation_id: conversation_id || `BCR-NODE-${Date.now()}`
      });

    } catch (error: any) {
      console.error("Rakshak Core Error:", error);
      res.status(500).json({ error: "Forensic extraction failed", details: error.message });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { message, language = "English" } = req.body;

      if (!message || message.trim() === "") {
        return res.json(getFallbackResponse("Empty input provided"));
      }

      const ai = getAI();
      const aiResult = await analyzeWithAI(message, language, ai);
      const safeResult = formatResponse(aiResult);

      // Store in intelligence memory
      memory.push({
        timestamp: Date.now(),
        input: message,
        output: safeResult,
        language
      });

      res.json(safeResult);

    } catch (err: any) {
      res.json(getFallbackResponse(err.message || "System failure"));
    }
  });

  app.get("/api/intelligence/dashboard", (req, res) => {
    const total = memory.length;
    const scams = memory.filter(m => m.output.is_scam).length;
    const safe = total - scams;
    const types: Record<string, number> = {};
    
    memory.forEach(m => {
      const type = m.output.scam_type || "Unknown";
      types[type] = (types[type] || 0) + 1;
    });

    res.json({
      total,
      scams,
      safe,
      types,
      recent: memory.slice(-5).reverse()
    });
  });

  app.get("/api/intelligence/clusters", (req, res) => {
    const clusters: Record<string, any[]> = {};
    memory.forEach(m => {
      const key = m.output.scam_type || "Uncategorized";
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push({
        message: m.input,
        confidence: m.output.confidence,
        timestamp: m.timestamp
      });
    });
    res.json(clusters);
  });

  app.get("/api/intelligence/network", (req, res) => {
    const nodes: Set<string> = new Set();
    const links: { source: string, target: string, weight: number }[] = [];
    
    memory.forEach(m => {
      const entities = m.output.entities || [];
      entities.forEach((e: string) => nodes.add(e));
      
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          links.push({ source: entities[i], target: entities[j], weight: 1 });
        }
      }
    });

    res.json({
      nodes: Array.from(nodes).map(id => ({ id, group: 1 })),
      links
    });
  });

  async function analyzeWithAI(message: string, language: string, aiInstance: GoogleGenAI) {
    const prompt = `
You are Bharat Cyber Rakshak AI.

Analyze the message and return ONLY JSON:

{
  "is_scam": true/false,
  "confidence": 0-100,
  "scam_type": "",
  "agent_reply": "",
  "entities": [],
  "risk_level": "low/medium/high"
}

Respond in ${language}

Message: "${message}"
`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    return response.text || "";
  }

  function formatResponse(raw: string) {
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        is_scam: parsed.is_scam ?? false,
        confidence: parsed.confidence ?? 0,
        scam_type: parsed.scam_type ?? "unknown",
        agent_reply: parsed.agent_reply ?? "Stay cautious.",
        entities: parsed.entities ?? [],
        risk_level: parsed.risk_level ?? "medium"
      };

    } catch {
      return getFallbackResponse("Parsing failed");
    }
  }

  function getFallbackResponse(reason: string = "Unknown error") {
    return {
      is_scam: false,
      confidence: 0,
      scam_type: "unknown",
      agent_reply: `System issue: ${reason}`,
      entities: [],
      risk_level: "low"
    };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️ Bharat Cyber Rakshak active on http://0.0.0.0:${PORT}`);
  });
}

startServer();