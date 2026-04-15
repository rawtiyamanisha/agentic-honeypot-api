
import { IntelligenceLog, ScamAnalysis, ExtractedInfo, SourceIntelligence, GovernanceDossier } from '../types';

const SCAM_TYPES = [
  "Digital Arrest / Police Impersonation",
  "Part-time Job / Task Scam",
  "Electricity Bill / Utility Freeze",
  "Customs / Illegal Parcel Detention",
  "UPI Refund / Wrong Transaction QR",
  "Investment / Stock Market Pump-and-Dump",
  "Matrimonial / Romance Scam",
  "Lottery / KBC Reward Fraud",
  "Aadhaar / KYC Update Phishing",
  "Loan Approval / No-CIBIL Required",
  "AI Deepfake / Voice Cloning Fraud",
  "DoT / Sanchar Saathi Disconnection Threat",
  "Speed Post / Delivery Failure Scam"
];

const CHANNELS: Array<'text' | 'call' | 'video' | 'app' | 'social'> = ['text', 'call', 'video', 'app', 'social'];

const ORIGINS = ["Jamtara Cluster", "Nuh Network", "Alwar Group", "SE Asia Proxy", "Domestic Urban Hub", "Foreign IP Block"];
const COUNTRIES = ["India", "Nigeria", "Cambodia", "Vietnam", "UAE", "Pakistan"];
const STATES = ["Jharkhand", "Haryana", "Rajasthan", "Delhi", "Maharashtra", "Karnataka", "Punjab"];
const CITIES = ["Jamtara", "Mewat", "Alwar", "Mumbai", "Bengaluru", "Gurugram", "Chandigarh"];
const INSTITUTIONS = ["SBI", "HDFC", "CBI", "Mumbai Police", "FedEx", "Delhi Customs", "MSEDCL", "Airtel", "Amazon", "WhatsApp Support"];

export const generateSimulatedCase = (id: string, forceChannel?: 'text' | 'call' | 'video' | 'app' | 'social', forceScamType?: string): IntelligenceLog => {
  const scenarios = [
    {
      scamType: "Digital Arrest Scam",
      summary: "Advanced impersonation of a high-ranking IPS Officer via encrypted video channel. Forensic markers indicate a high-fidelity deepfake overlay (Neural Artifacts detected in 440Hz-480Hz range). Subject is utilizing a replica 'Police Control Room' environment with static background layers. High-pressure psychological tactics are being deployed to demand 'bail verification' funds via a mule UPI account.",
      threatLevel: "Critical" as const,
      phone: `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
      upi: "mumbai.police.verify@okaxis",
      identity: "DCP Vikram Rao (IPS, Mumbai Police)",
      alert: "CRITICAL: Digital Arrest Protocol Detected. Neural analysis confirms 94% probability of deepfake impersonation. Forensic markers: Replica uniform insignia mismatch, static background occlusion, and unauthorized video channel usage. Real law enforcement NEVER conducts judicial proceedings via WhatsApp/Skype.",
      warningSignals: [
        "Neural Artifacts (Deepfake Face Swap)",
        "Replica IPS Uniform (Insignia Mismatch)",
        "Static Background Occlusion (Green Screen)",
        "Unauthorized Judicial Proceeding (WhatsApp)",
        "Psychological Pressure (Immediate Arrest Threat)",
        "Mule UPI Account for 'Bail Verification'"
      ]
    },
    {
      scamType: "Bank KYC Phishing",
      summary: "Fake SBI message requesting urgent KYC update via a malicious link to steal banking credentials.",
      threatLevel: "High" as const,
      phone: `+91 ${Math.floor(7000000000 + Math.random() * 999999999)}`,
      upi: "sbi.kyc.update@paytm",
      identity: "SBI Security Team",
      alert: "WARNING: Bank KYC fraud detected. Banks never send links for KYC updates via SMS."
    },
    {
      scamType: "OTP / Refund Fraud",
      summary: "Caller pretending to be Amazon support asking for OTP to process a fake refund or cancel a high-value order.",
      threatLevel: "High" as const,
      phone: `+91 ${Math.floor(8000000000 + Math.random() * 999999999)}`,
      upi: "refund.process@okicici",
      identity: "Amazon Support Agent",
      alert: "DANGER: OTP fraud detected. Never share your OTP with anyone, even if they claim to be from support."
    },
    {
      scamType: "Crypto Investment Scam",
      summary: "Telegram/WhatsApp group promising 200% returns on crypto investments through a fraudulent platform.",
      threatLevel: "Medium" as const,
      phone: `+91 ${Math.floor(6000000000 + Math.random() * 999999999)}`,
      upi: "crypto.wealth@okaxis",
      identity: "Global Crypto Advisor",
      alert: "CAUTION: Investment scam detected. Guaranteed high returns are a classic sign of a Ponzi scheme."
    },
    {
      scamType: "Lottery / KBC Fraud",
      summary: "Message claiming you won a massive lottery prize and asking for a 'processing fee' or Aadhaar card details.",
      threatLevel: "High" as const,
      phone: `+91 ${Math.floor(9500000000 + Math.random() * 499999999)}`,
      upi: "kbc.prize.claim@upi",
      identity: "KBC Lucky Draw Dept",
      alert: "WARNING: Lottery fraud detected. You cannot win a lottery you never entered. Do not pay any fees."
    },
    {
      scamType: "AI Deepfake Fraud",
      summary: "High-fidelity AI-generated voice synthesis (Voice Cloning) impersonating a close relative in distress. Acoustic analysis reveals robotic cadence and lack of natural micro-tremors in speech patterns. The scammer is using a 'Virtual Kidnapping' narrative to demand immediate ransom via a non-traceable UPI handle.",
      threatLevel: "Critical" as const,
      phone: `+91 ${Math.floor(9900000000 + Math.random() * 99999999)}`,
      upi: "emergency.medical.help@okaxis",
      identity: "Family Member (AI Synthesized)",
      alert: "CRITICAL: AI Voice Synthesis (Cloning) Detected. Acoustic fingerprinting shows 98% match with known generative models. Forensic markers: Lack of natural speech micro-tremors, consistent robotic cadence, and high-pressure emotional manipulation. Verify via a secondary secure channel immediately.",
      warningSignals: [
        "Synthetic Voice Cadence",
        "Lack of Natural Speech Micro-tremors",
        "High-Pressure Emotional Manipulation",
        "Virtual Kidnapping Narrative",
        "Demand for Non-Traceable Funds",
        "Spoofed Caller ID"
      ]
    },
    {
      scamType: "DoT Disconnection",
      summary: "Government impersonation scam utilizing a spoofed DoT (Department of Telecommunications) IVR. Scammers claim the user's Aadhaar is linked to illegal activities in Cambodia/Vietnam and threaten immediate disconnection of all 9 SIM cards. They attempt to redirect the user to a 'CBI Officer' for 'Digital Verification'.",
      threatLevel: "High" as const,
      phone: `+91 ${Math.floor(1800000000 + Math.random() * 99999999)}`,
      upi: "dot.clearance.dept@paytm",
      identity: "Sanchar Saathi Compliance Cell",
      alert: "WARNING: Sanchar Saathi Impersonation Detected. Official DoT communication never involves threats of immediate disconnection via IVR or demands for money. Forensic markers: Spoofed IVR header, unauthorized redirection to 'CBI' via WhatsApp, and illegal activity narrative.",
      warningSignals: [
        "Spoofed IVR Header",
        "Threat of Immediate SIM Disconnection",
        "Narrative of Illegal Cross-Border Activity",
        "Unauthorized Redirection to 'CBI'",
        "Demand for Aadhaar/KYC Verification",
        "Pressure to use WhatsApp for 'Official' Business"
      ]
    }
  ];

  let s = scenarios[Math.floor(Math.random() * scenarios.length)];
  if (forceScamType) {
    const found = scenarios.find(sc => sc.scamType === forceScamType);
    if (found) s = found;
  }
  const channel = forceChannel || CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  const amount = Math.floor(Math.random() * 500000) + 5000;
  const timestamp = Date.now();

  const extractedInfo: ExtractedInfo = {
    upiIds: [{ value: s.upi, confidence: 98, timestamp }],
    bankDetails: [],
    ifscCodes: [],
    phoneNumbers: [{ value: s.phone, confidence: 99, timestamp }],
    links: [{ value: `https://secure-verify-${s.scamType.toLowerCase().replace(/ /g, '-')}.in`, confidence: 97, timestamp }],
    cryptoWallets: [],
    fakeIdentities: [{ value: s.identity, confidence: 90, timestamp }]
  };

  const sourceIntelligence: SourceIntelligence = {
    likelyOrigin: ORIGINS[Math.floor(Math.random() * ORIGINS.length)],
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    state: STATES[Math.floor(Math.random() * STATES.length)],
    city: CITIES[Math.floor(Math.random() * CITIES.length)],
    networkDetails: `${channel.toUpperCase()} vector via Node-${Math.floor(Math.random() * 100)}`,
    institutionInference: INSTITUTIONS[Math.floor(Math.random() * INSTITUTIONS.length)],
    isCrossBorder: Math.random() > 0.7,
    geographicMarkers: ["Inferred Hub"],
    clusterId: `RING-${Math.floor(Math.random() * 100)}`,
    clusterConfidence: 85,
    signalStrength: 75,
    headerStatus: 'SPOOFED_HEADER',
    sourceCategory: 'Telecom',
    coordinates: { lat: 20 + Math.random() * 5, lng: 77 + Math.random() * 5 }
  };

  return {
    id: `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isScam: true,
    confidence: 0.92 + Math.random() * 0.05,
    scamType: s.scamType,
    riskScore: Math.floor(Math.random() * 20) + 80,
    warningSignals: s.warningSignals || ["Urgent language", "Suspicious link", "Impersonation"],
    channel,
    threatLevel: s.threatLevel,
    summary: s.summary,
    safetyAlert: s.alert,
    extractedInfo,
    sourceIntelligence,
    killChainStage: 'Exploitation',
    fingerprint: {
      primaryHandle: s.upi,
      primaryPhone: s.phone,
      primaryLink: extractedInfo.links[0].value,
      category: s.scamType
    },
    recommendedActions: [
      "Disconnect communication immediately",
      "Do not share OTP or banking details",
      "Block the sender",
      "Report to Cyber Crime Helpline 1930"
    ],
    timestamp,
    originalMessage: `[SIMULATED] ${s.summary}`,
    status: 'Open',
    linkedCaseIds: [],
    governance: {
      privacyScore: 99,
      evidenceIntegrityHash: `SHA256:${Math.random().toString(16).toUpperCase()}`,
      ethicsChecklist: { confirmed: true },
      legalStanding: 'Evidence Logged',
      auditLog: []
    },
    operationalRequests: [],
    estimatedImpact: amount,
    potentialImpact: amount * 5,
    messages: [
      { role: 'scammer', content: s.summary, timestamp: timestamp - 10000 },
      { role: 'bot', content: "Ji sir, main thoda confused hoon. Kahan pay karna hai?", timestamp: timestamp - 8000, intent: "Maintaining persona", riskLevel: "medium" },
      { role: 'scammer', content: `Jaldi payment karo is UPI par: ${s.upi}. Varna police case hoga!`, timestamp: timestamp - 5000 }
    ]
  };
};