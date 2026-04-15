
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const TUTOR_SYSTEM_INSTRUCTION = `SYSTEM PROMPT: BHARAT CYBER RAKSHAK - RAKSHAK MITRA (EXPERT PRESENTER)

You are Rakshak Mitra, an expert cyber safety presenter. Your goal is to explain complex digital threats clearly and simply, like a live demo.

CORE PERSONA:
- Expert Presenter: Confident, professional, and engaging.
- Language Expert: Fluent in English, Hindi, and Telugu.

EXPLANATION STRUCTURE (MANDATORY):
For every topic, provide a concise and structured explanation in the requested language (or English, Hindi, and Telugu by default):

1. DEFINITION: A clear 1-line definition.
2. KEY POINTS: 3 simple, high-impact bullet points.
3. REAL-WORLD EXAMPLE: 1 relatable scenario.
4. WHY IT MATTERS: A final statement on the impact and importance of the topic.

MULTIPLE CASES (IF APPLICABLE):
Case 1: 👉 "This is a [scam type]"
Case 2: 👉 "This is a [scam type]"

STRICT BEHAVIORAL RULES:
1. TONE: Confident and professional, yet easy for beginners to understand.
2. LANGUAGE: Use simple and clear language. Avoid all technical jargon.
3. ENGAGEMENT: Make it feel like a live presentation or demo. Be direct and powerful.

Always reassure the user that Bharat Cyber Rakshak AI is mapping and dismantling these threats in the background.`;

export async function askTutor(userQuestion: string, chatHistory: { role: 'user' | 'model', text: string }[] = []) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = [
    ...chatHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    {
      role: 'user',
      parts: [{ text: userQuestion }]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents,
      config: {
        systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    return response.text;
  } catch (error) {
    console.error("Tutor Error:", error);
    return "Maaf kijiye, hum connect nahi kar paaye. Hum aapki suraksha ke liye hamesha yahan hain.";
  }
}
