
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
  "Loan Approval / No-CIBIL Required"
];

const CHANNELS: Array<'text' | 'call' | 'video' | 'app' | 'social'> = ['text', 'call', 'video', 'app', 'social'];

const ORIGINS = ["Jamtara Cluster", "Nuh Network", "Alwar Group", "SE Asia Proxy", "Domestic Urban Hub", "Foreign IP Block"];
const INSTITUTIONS = ["SBI", "HDFC", "CBI", "Mumbai Police", "FedEx", "Delhi Customs", "MSEDCL", "Airtel", "Amazon", "WhatsApp Support"];

export const generateSimulatedCase = (id: string): IntelligenceLog => {
  const type = SCAM_TYPES[Math.floor(Math.random() * SCAM_TYPES.length)];
  const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
  const inst = INSTITUTIONS[Math.floor(Math.random() * INSTITUTIONS.length)];
  const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  const amount = Math.floor(Math.random() * 500000) + 5000;
  const threatLevel: 'Low' | 'Medium' | 'High' | 'Critical' = Math.random() > 0.8 ? 'Critical' : Math.random() > 0.5 ? 'High' : 'Medium';
  
  const timestamp = Date.now() - Math.floor(Math.random() * 86400000 * 30); // Random time in last 30 days

  const extractedInfo: ExtractedInfo = {
    upiIds: [{ value: `scam.${Math.random().toString(36).substring(7)}@upi`, confidence: 98, timestamp }],
    bankDetails: Math.random() > 0.5 ? [{ value: `${Math.floor(1000000000 + Math.random() * 9000000000)}`, confidence: 95, timestamp }] : [],
    ifscCodes: [],
    phoneNumbers: [{ value: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`, confidence: 99, timestamp }],
    links: [{ value: `https://secure-${inst.toLowerCase()}-verify.in/auth`, confidence: 97, timestamp }],
    cryptoWallets: [],
    fakeIdentities: [{ value: `Officer ${['Kumar', 'Singh', 'Sharma', 'Patel'][Math.floor(Math.random() * 4)]}`, confidence: 90, timestamp }]
  };

  const sourceIntelligence: SourceIntelligence = {
    likelyOrigin: origin,
    networkDetails: `${channel.toUpperCase()} vector via Node-${Math.floor(Math.random() * 100)}`,
    institutionInference: inst,
    isCrossBorder: origin.includes('Foreign') || origin.includes('SE Asia'),
    geographicMarkers: [origin],
    clusterId: `RING-${Math.floor(Math.random() * 100)}`,
    clusterConfidence: 80 + Math.random() * 20,
    signalStrength: Math.floor(Math.random() * 100),
    headerStatus: Math.random() > 0.7 ? 'SPOOFED_HEADER' : 'UNKNOWN_SENDER',
    sourceCategory: channel === 'text' ? 'Telecom' : channel === 'call' ? 'Telecom' : 'Web',
    coordinates: { lat: 8 + Math.random() * 25, lng: 68 + Math.random() * 25 }
  };

  const governance: GovernanceDossier = {
    privacyScore: 95 + Math.random() * 5,
    evidenceIntegrityHash: `SHA256:${Math.random().toString(16).substring(2, 40).toUpperCase()}`,
    ethicsChecklist: { confirmed: true },
    legalStanding: 'Evidence Logged',
    auditLog: [{ action: 'AUTO_INTERCEPT', timestamp, actor: 'AI_RAKSHAK' }]
  };

  return {
    id,
    isScam: true,
    confidence: 0.9 + Math.random() * 0.1,
    scamType: type,
    channel,
    threatLevel,
    summary: `Autonomous interception of ${type} via ${channel.toUpperCase()} targeting citizen.`,
    safetyAlert: `DANGER: ${type} identified. Source cluster: ${origin}.`,
    extractedInfo,
    sourceIntelligence,
    killChainStage: ['Delivery', 'Exploitation', 'Actions on Objective'][Math.floor(Math.random() * 3)] as any,
    fingerprint: {
      primaryHandle: extractedInfo.upiIds[0].value,
      primaryPhone: extractedInfo.phoneNumbers[0].value,
      primaryLink: extractedInfo.links[0].value,
      category: `${channel.toUpperCase()} Fraud`
    },
    // Fix: Removed suggestedBaitResponse property as it does not exist on IntelligenceLog/ScamAnalysis.
    recommendedActions: ["Block Source", "Institutional Alert", "Freeze Assets"],
    timestamp,
    originalMessage: `[SIMULATED ${channel.toUpperCase()}] ${inst} security alert: Action required immediately.`,
    messages: [{ role: 'scammer', content: `URGENT: ${inst} update required.`, timestamp }],
    status: 'Open',
    linkedCaseIds: [],
    governance,
    operationalRequests: [],
    estimatedImpact: amount,
    potentialImpact: amount * 10
  };
};