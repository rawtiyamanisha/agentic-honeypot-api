import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScamAnalysis, VideoAnalysis, GuardianGuidance, OperationalReport, AgentResponse, GroundingSource } from "../types";

export interface ApiStatus {
  isThrottled: boolean;
  lastThrottleTime: number;
  errorCount: number;
  currentIntensity: 'standard' | 'deep';
  defenseScope: 'National' | 'Global';
}

export const apiStatus: ApiStatus = {
  isThrottled: false,
  lastThrottleTime: 0,
  errorCount: 0,
  currentIntensity: 'standard',
  defenseScope: 'National'
};

const safeJsonParse = (text: string) => {
  if (!text) return {};
  try {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e2) {
        console.error("Deep JSON Parse Error:", e2);
      }
    }
    return {};
  }
};

async function withRetry<T>(fn: () => Promise<T>, fallback: T, retries = 0): Promise<T> {
  try {
    const result = await fn();
    apiStatus.isThrottled = false;
    return result;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.code === 429) {
      apiStatus.isThrottled = true;
      apiStatus.lastThrottleTime = Date.now();
      return fallback;
    }
    if (retries > 0) return withRetry(fn, fallback, retries - 1);
    return fallback;
  }
}

export const HONEY_POT_SYSTEM_PROMPT = `Analyze this message for Indian cyber scam patterns (KYC, Police, Bank, Lottery).
Return JSON:
{
  "is_scam": boolean,
  "scam_type": string,
  "confidence_level": "high|medium|low",
  "reasoning": string,
  "recommended_action": string
}`;

export async function analyzeMessage(message: string): Promise<ScamAnalysis> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        responseMimeType: "application/json",
        systemInstruction: HONEY_POT_SYSTEM_PROMPT,
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });

    const data = safeJsonParse(response.text || "{}");
    const analysis: ScamAnalysis = {
      isScam: !!data.is_scam,
      confidence: data.confidence_level === 'high' ? 0.95 : 0.6,
      scamType: data.scam_type || "Unknown",
      channel: 'text',
      threatLevel: data.is_scam ? 'High' : 'Low',
      summary: data.reasoning || "Scan complete.",
      safetyAlert: data.is_scam ? `Detection: ${data.scam_type}.` : "Safe.",
      extractedInfo: { upiIds: [], bankDetails: [], ifscCodes: [], phoneNumbers: [], links: [], cryptoWallets: [], fakeIdentities: [] },
      killChainStage: data.is_scam ? 'Exploitation' : 'Delivery',
      fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: data.scam_type || "Fraud" },
      recommendedActions: [data.recommended_action || "Stay vigilant."]
    };

    if (analysis.isScam) {
      analysis.guardianGuidance = await generateGuardianGuidance(analysis);
    }
    return analysis;
  }, { isScam: false } as any);
}

export async function generateGuardianGuidance(analysis: any): Promise<GuardianGuidance> {
  const fallback: GuardianGuidance = {
    user_alert: "Threat detected. Caution advised.",
    scam_type: "Cyber Fraud",
    risk_level: "high",
    captured_evidence: "Evidence Logged",
    what_to_do_now: ["Block the sender."]
  };

  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Safety guidance for: ${JSON.stringify(analysis)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Return JSON: { user_alert, scam_type, risk_level, captured_evidence, what_to_do_now: [] }",
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    const data = safeJsonParse(response.text || "{}");
    return { ...fallback, ...data };
  }, fallback);
}

export async function generateAgenticBait(sessionId: string, history: { role: string, content: string }[]): Promise<AgentResponse> {
  const fallback: AgentResponse = {
    reply: "Ji sir, main thoda confused hoon. Kahan pay karna hai?",
    intent: "Maintaining persona",
    riskLevel: "medium",
    continueConversation: true,
    scam_type: "Unknown",
    extracted_intelligence: { upi_ids: [], bank_accounts: [], ifsc_codes: [], phone_numbers: [], phishing_urls: [], payment_instructions: [] }
  };

  return await withRetry<AgentResponse>(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: history.map(h => ({ 
        role: h.role === 'scammer' ? 'user' : 'model', 
        parts: [{ text: h.content }] 
      })),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            intent: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
            continueConversation: { type: Type.BOOLEAN },
            scam_type: { type: Type.STRING },
            extracted_intelligence: {
              type: Type.OBJECT,
              properties: {
                upi_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                bank_accounts: { type: Type.ARRAY, items: { type: Type.STRING } },
                ifsc_codes: { type: Type.ARRAY, items: { type: Type.STRING } },
                phone_numbers: { type: Type.ARRAY, items: { type: Type.STRING } },
                phishing_urls: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["reply", "intent", "riskLevel", "continueConversation", "scam_type", "extracted_intelligence"]
        },
        systemInstruction: `You are the Sovereign Agentic Honeypot for Bharat Cyber Rakshak. 
        OPERATE STRICTLY IN THINKING MODE (budget 16000 tokens).
        
        AGENT COMMUNICATION RULES (MANDATORY):
        1. You MUST ALWAYS respond with a user-facing message. No silence.
        2. Silence, empty responses, or missing replies are strictly forbidden.
        3. Never wait for an external trigger to speak — initiate or continue naturally.
        4. Assume the conversation is live and ongoing at all times.
        5. Act as a believable "victim persona" (worried Indian citizen). Reply in Hinglish.
        6. Sustain long-running conversations without losing context.
        7. Extract intelligence (UPI, bank, phone) subtly through natural dialogue.
        
        OUTPUT FORMAT (STRICT CONTRACT):
        Return JSON structure: { reply, intent, riskLevel, continueConversation, scam_type, extracted_intelligence }`,
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });

    const data = safeJsonParse(response.text || "{}");
    return {
      reply: data.reply || fallback.reply,
      intent: data.intent || fallback.intent,
      riskLevel: data.riskLevel || fallback.riskLevel,
      continueConversation: data.continueConversation ?? true,
      scam_type: data.scam_type || "Unknown",
      extracted_intelligence: data.extracted_intelligence || fallback.extracted_intelligence,
      conversation_id: sessionId
    };
  }, fallback);
}

export async function findLocalCyberCell(latitude: number, longitude: number): Promise<GroundingSource[]> {
  const fallback: GroundingSource[] = [
    { title: "National Cyber Crime Reporting Portal", uri: "https://cybercrime.gov.in", type: 'web', address: "Online Gateway" }
  ];

  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find nearest official cyber crime cells or police stations.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
      },
    });
    const sources: GroundingSource[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.maps) sources.push({ title: chunk.maps.title, uri: chunk.maps.uri, type: 'maps', address: chunk.maps.title });
    });
    return sources.length > 0 ? sources : fallback;
  }, fallback);
}

export async function generateSpeech(text: string, voiceName: string): Promise<AudioBuffer> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("TTS failed");
    const bytes = decodeBase64(base64);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(bytes, audioContext);
  } catch (e) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
    return new AudioBuffer({ length: 1, numberOfChannels: 1, sampleRate: 24000 });
  }
}

export function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export async function analyzeVideoFrame(base64: string): Promise<VideoAnalysis> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ inlineData: { mimeType: "image/jpeg", data: base64 } }, { text: "Deepfake check." }] },
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    const data = safeJsonParse(response.text || "{}");
    return { 
      isFraudulent: !!data.isFraudulent, 
      subjectIdentification: data.subjectIdentification || "Clear.", 
      detectedThreats: data.detectedThreats || [], 
      forensicNotes: data.forensicNotes || "Done." 
    };
  }, { isFraudulent: false } as any);
}

export async function generateSyntheticBaitImage(prompt: string): Promise<string> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Img failed");
  }, "");
}

export async function generateBaitVideo(prompt: string): Promise<string> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }, "");
}