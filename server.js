import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

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

  // Use process.env.API_KEY as per guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured in environment." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Construct conversation parts
    const contents = history.map(h => ({
      role: h.role === 'scammer' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents,
      config: {
        systemInstruction: RAKSHAK_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        // Thinking budget allows the model to reason about the scammer's trickery before replying
        thinkingConfig: { thinkingBudget: 16000 }
      },
    });

    const rawOutput = response.text;
    const cleanedJson = rawOutput.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    res.json({
      ...parsed,
      conversation_id: conversation_id || `BCR-NODE-${Date.now()}`
    });

  } catch (error) {
    console.error("Rakshak Core Error:", error);
    res.status(500).json({ error: "Forensic extraction failed", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛡️ Bharat Cyber Rakshak API active on port ${PORT}`);
});