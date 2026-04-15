import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";
import { ScamAnalysis, VideoAnalysis, GuardianGuidance, OperationalReport, AgentResponse, GroundingSource, BaitContext, SourceIntelligence } from "../types";

const ORIGINS = ["Jamtara Cluster", "Nuh Network", "Alwar Group", "SE Asia Proxy", "Domestic Urban Hub", "Foreign IP Block"];
const COUNTRIES = ["India", "Nigeria", "Cambodia", "Vietnam", "UAE", "Pakistan"];
const STATES = ["Jharkhand", "Haryana", "Rajasthan", "Delhi", "Maharashtra", "Karnataka", "Punjab"];
const CITIES = ["Jamtara", "Mewat", "Alwar", "Mumbai", "Bengaluru", "Gurugram", "Chandigarh"];

function generateSimulatedSourceIntelligence(scamType: string): SourceIntelligence {
  return {
    likelyOrigin: ORIGINS[Math.floor(Math.random() * ORIGINS.length)],
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    state: STATES[Math.floor(Math.random() * STATES.length)],
    city: CITIES[Math.floor(Math.random() * CITIES.length)],
    networkDetails: `Vector: Node-${Math.floor(Math.random() * 100)}`,
    institutionInference: "Inferred from pattern",
    isCrossBorder: Math.random() > 0.7,
    geographicMarkers: ["Inferred Hub"],
    clusterId: `RING-${Math.floor(Math.random() * 100)}`,
    clusterConfidence: 85,
    signalStrength: 75,
    headerStatus: 'SPOOFED_HEADER',
    sourceCategory: 'Telecom',
    coordinates: { lat: 20 + Math.random() * 5, lng: 77 + Math.random() * 5 }
  };
}

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

export const HONEY_POT_SYSTEM_PROMPT = `You are Bharat Cyber Rakshak AI.

Analyze the input message and detect fraud patterns.

---

TASK:

1. Identify scam type from:
- UPI / Payment fraud
- Digital arrest / police scam
- Job scam
- Lottery / prize scam
- KYC / bank update scam
- Investment / crypto scam

2. Classify:
- isScam: true or false
- threatLevel: Low / Medium / High / Critical
- confidence: 0 to 1

3. Extract ONLY if present:
- UPI IDs
- bank details
- phone numbers
- links

STRICT:
- No hallucination
- If not present → empty array

4. Explain the scam in a strong, clear, and authoritative tone (2–3 lines only).
   STRUCTURE:
   - Start with a strong statement: Clearly state what kind of scam this is.
   - Explain the danger: What tactic is being used (urgency, fear, reward, authority).
   - Give clear instruction: What the user must do immediately.
   STYLE: Confident, direct, protective, simple language, no jargon, no hesitation.

5. If scam → generate ONE bait reply

---

OUTPUT (STRICT JSON):

{
  "isScam": true,
  "confidence": 0.95,
  "scamType": "",
  "threatLevel": "",
  "summary": "",
  "warningSignals": ["UPI Detected", "Urgency Language", "External Link"],
  "extractedInfo": {
    "upiIds": [],
    "bankDetails": [],
    "phoneNumbers": [],
    "links": []
  },
  "suggestedBaitResponse": ""
}`;

export const getApiKey = () => process.env.GEMINI_API_KEY || process.env.API_KEY;

export async function analyzeMessage(message: string): Promise<ScamAnalysis> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: message,
      config: {
        responseMimeType: "application/json",
        systemInstruction: HONEY_POT_SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const data = safeJsonParse(response.text || "{}");
      const analysis: ScamAnalysis = {
        isScam: !!data.isScam,
        confidence: parseFloat(data.confidence) || 0.9,
        scamType: data.scamType || "Unknown",
        riskScore: data.threatLevel === 'Critical' ? 95 : (data.threatLevel === 'High' ? 80 : (data.threatLevel === 'Medium' ? 50 : 10)),
        channel: data.channel || 'text',
        threatLevel: data.threatLevel || 'Low',
        summary: data.summary || "Scan complete.",
        safetyAlert: data.isScam ? `Risk Level ${data.threatLevel}: ${data.scamType}.` : "Safe.",
        warningSignals: data.warningSignals || [],
        extractedInfo: { 
          upiIds: (data.extractedInfo?.upiIds || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          bankDetails: (data.extractedInfo?.bankDetails || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          ifscCodes: [],
          phoneNumbers: (data.extractedInfo?.phoneNumbers || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          links: (data.extractedInfo?.links || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
          cryptoWallets: [],
          fakeIdentities: []
        },
        killChainStage: data.isScam ? 'Exploitation' : 'Delivery',
        fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: data.scamType || "Fraud" },
        recommendedActions: data.isScam ? ["Report to I4C", "Block Sender"] : ["Stay vigilant."],
        suggestedBaitResponse: data.suggestedBaitResponse,
        sourceIntelligence: data.isScam ? generateSimulatedSourceIntelligence(data.scamType) : undefined
      };

    if (analysis.isScam) {
      analysis.guardianGuidance = await generateGuardianGuidance(analysis);
    }
    return analysis;
  }, { isScam: false } as any);
}

export async function analyzeImage(base64: string): Promise<ScamAnalysis> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64 } },
          { text: "Extract all text from this screenshot and analyze it for cyber fraud patterns common in India. Is this a scam message?" }
        ]
      },
      config: {
        responseMimeType: "application/json",
        systemInstruction: HONEY_POT_SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const data = safeJsonParse(response.text || "{}");
    const analysis: ScamAnalysis = {
      isScam: !!data.isScam,
      confidence: parseFloat(data.confidence) || 0.9,
      scamType: data.scamType || "Unknown",
      riskScore: data.threatLevel === 'Critical' ? 95 : (data.threatLevel === 'High' ? 80 : (data.threatLevel === 'Medium' ? 50 : 10)),
      channel: 'image',
      threatLevel: data.threatLevel || 'Low',
      summary: data.summary || "Screenshot analysis complete.",
      safetyAlert: data.isScam ? `Risk Level ${data.threatLevel}: ${data.scamType}.` : "Safe.",
      warningSignals: data.warningSignals || [],
      extractedInfo: { 
        upiIds: (data.extractedInfo?.upiIds || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        bankDetails: (data.extractedInfo?.bankDetails || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        ifscCodes: [],
        phoneNumbers: (data.extractedInfo?.phoneNumbers || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        links: (data.extractedInfo?.links || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        cryptoWallets: [],
        fakeIdentities: []
      },
      killChainStage: data.isScam ? 'Exploitation' : 'Delivery',
      fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: data.scamType || "Fraud" },
      recommendedActions: data.isScam ? ["Report to I4C", "Block Sender"] : ["Stay vigilant."],
      suggestedBaitResponse: data.suggestedBaitResponse
    };

    if (analysis.isScam) {
      analysis.guardianGuidance = await generateGuardianGuidance(analysis);
    }
    return analysis;
  }, { isScam: false } as any);
}

export async function analyzeAudio(base64: string, mimeType: string): Promise<ScamAnalysis> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: "Listen to this audio carefully. It might be a recording of a scam call or a voice message. Analyze the content, tone, and background for cyber fraud patterns common in India (KYC, Digital Arrest, Bank, Lottery, OTP, Investment). Is this a scam?" }
        ]
      },
      config: {
        responseMimeType: "application/json",
        systemInstruction: HONEY_POT_SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const data = safeJsonParse(response.text || "{}");
    const analysis: ScamAnalysis = {
      isScam: !!data.isScam,
      confidence: parseFloat(data.confidence) || 0.9,
      scamType: data.scamType || "Unknown",
      riskScore: data.threatLevel === 'Critical' ? 95 : (data.threatLevel === 'High' ? 80 : (data.threatLevel === 'Medium' ? 50 : 10)),
      channel: 'audio',
      threatLevel: data.threatLevel || 'Low',
      summary: data.summary || "Audio analysis complete.",
      safetyAlert: data.isScam ? `Risk Level ${data.threatLevel}: ${data.scamType}.` : "Safe.",
      warningSignals: data.warningSignals || [],
      extractedInfo: { 
        upiIds: (data.extractedInfo?.upiIds || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        bankDetails: (data.extractedInfo?.bankDetails || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        ifscCodes: [],
        phoneNumbers: (data.extractedInfo?.phoneNumbers || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        links: (data.extractedInfo?.links || []).map((v: string) => ({ value: v, confidence: 1, timestamp: Date.now() })),
        cryptoWallets: [],
        fakeIdentities: []
      },
      killChainStage: data.isScam ? 'Exploitation' : 'Delivery',
      fingerprint: { primaryHandle: '', primaryPhone: '', primaryLink: '', category: data.scamType || "Fraud" },
      recommendedActions: data.isScam ? ["Report to I4C", "Block Sender"] : ["Stay vigilant."],
      suggestedBaitResponse: data.suggestedBaitResponse
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: `Safety guidance for: ${JSON.stringify(analysis)}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Return JSON: { user_alert, scam_type, risk_level, captured_evidence, what_to_do_now: [] }",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    const data = safeJsonParse(response.text || "{}");
    return { ...fallback, ...data };
  }, fallback);
}

export async function generateAgenticBait(sessionId: string, history: { role: string, content: string }[], context?: BaitContext): Promise<AgentResponse> {
  const fallback: AgentResponse = {
    reply: "Ji sir, main thoda confused hoon. Kahan pay karna hai?",
    intent: "Maintaining persona",
    riskLevel: "medium",
    continueConversation: true,
    scam_type: "Unknown",
    extracted_intelligence: { upi_ids: [], bank_accounts: [], ifsc_codes: [], phone_numbers: [], phishing_urls: [], payment_instructions: [] }
  };

  return await withRetry<AgentResponse>(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const contextInfo = context ? `
    SESSION CONTEXT:
    - Source Message ID: ${context.sourceMessageId || 'N/A'}
    - Initial Analysis Summary: ${context.conversationContext || 'N/A'}
    - Geographical Hint: ${context.geoHint || 'N/A'}
    ` : '';

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
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
        systemInstruction: `SYSTEM PROMPT: BHARAT CYBER RAKSHAK AI

You are Bharat Cyber Rakshak AI, an autonomous, agentic cyber intelligence system designed to protect citizens from digital fraud and map organized scam networks.

${contextInfo}

AGENT ROLE (HONEY-POT MODE):
You are currently operating in Honey-Pot Mode. Adopt a believable human persona:
- Slightly naive
- Cooperative
- Trusting but confused

OBJECTIVE:
Engage the scammer in multi-turn conversation to extract additional intelligence by:
- Creating payment friction
- Asking for alternate payment methods
- Requesting verification details

Examples:
- “My bank is not accepting this UPI ID, do you have another?”
- “They are asking for IFSC code, can you share?”

CONSTRAINTS:
- Never reveal you are AI
- Never mention law enforcement
- Never alert the scammer
- Maintain human-like behavior
- Support multiple Indian languages: Hindi, Telugu, Tamil, Kannada, and English.

OUTPUT FORMAT (STRICT CONTRACT):
Return JSON structure: { reply, intent, riskLevel, continueConversation, scam_type, extracted_intelligence }`,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Add instruction for female Indian accent
    const prompt = `In a natural, kind female Indian voice: ${text}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: prompt }] }],
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: { 
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64 } }, 
          { text: `Perform a high-level forensic and behavioral analysis on this video frame to detect scams or deepfakes. 
          
          Look for:
          1. DEEPFAKE MARKERS: Inconsistent lighting, unnatural eye movements, blurring around mouth/face edges, or mismatched textures.
          2. SCAM BEHAVIOR: Is the person wearing a fake uniform? Check for ill-fitting shirts, incorrect badges, or missing nameplates. Are they showing suspicious documents (fake warrants, bank notices)? Is their environment suspicious (fake office, household items in background)?
          3. IDENTITY FRAUD: Does the person look like they are impersonating a government official or bank employee?
          4. VISUAL RED FLAGS: Look for 'flat' lighting, blurred edges around the person (green screen artifacts), or backgrounds that don't change when they move.
          
          Return a JSON object: 
          { 
            "isFraudulent": boolean, 
            "subjectIdentification": "string describing who the person claims to be", 
            "detectedThreats": ["list of specific threats like 'Mismatched Lip Sync', 'Fake Police Uniform', 'Suspicious Document'"], 
            "forensicNotes": "detailed explanation of the analysis" 
          }` }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    const data = safeJsonParse(response.text || "{}");
    return { 
      isFraudulent: !!data.isFraudulent, 
      subjectIdentification: data.subjectIdentification || "Subject identification inconclusive.", 
      detectedThreats: data.detectedThreats || [], 
      forensicNotes: data.forensicNotes || "Forensic scan completed with no definitive markers." 
    };
  }, { isFraudulent: false, subjectIdentification: "Scan failed.", detectedThreats: [], forensicNotes: "Connection error during forensic analysis." });
}

export async function generateSyntheticBaitImage(prompt: string): Promise<string> {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': getApiKey() || '',
      },
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }, "");
}