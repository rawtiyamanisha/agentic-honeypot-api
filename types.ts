export interface ExtractedItem<T> {
  value: T;
  confidence: number; 
  timestamp: number;
}

export interface ExtractedInfo {
  upiIds: ExtractedItem<string>[];
  bankDetails: ExtractedItem<string>[];
  ifscCodes: ExtractedItem<string>[];
  phoneNumbers: ExtractedItem<string>[];
  links: ExtractedItem<string>[];
  cryptoWallets: ExtractedItem<string>[];
  fakeIdentities: ExtractedItem<string>[];
}

export interface GroundingSource {
  title: string;
  uri: string;
  type?: 'web' | 'maps';
  address?: string;
}

export interface AgentIntelligence {
  upi_ids: string[];
  bank_accounts: any[];
  ifsc_codes: string[];
  phone_numbers: string[];
  phishing_urls: string[];
  payment_instructions: string[];
}

export interface AgentResponse {
  reply: string;
  intent: string;
  riskLevel: 'low' | 'medium' | 'high';
  continueConversation: boolean;
  scam_type: "Bank" | "KYC" | "Courier" | "Job" | "Crypto" | "Romance" | "Loan" | "Unknown";
  extracted_intelligence: AgentIntelligence;
  conversation_id?: string;
  engagement?: {
    active: boolean;
    turns: number;
  };
  confidence_score?: number;
}

export interface ChatMessage {
  role: 'scammer' | 'bot';
  content: string;
  timestamp: number;
  verdict?: string; 
  intent?: string;
  extractedData?: AgentIntelligence;
  riskLevel?: 'low' | 'medium' | 'high';
}

export type ThreatPosture = 'Green' | 'Yellow' | 'Red';

export interface AnalyticsSummary {
  totalPreventionInr: number;
  potentialExposureInr: number;
  threatPosture: ThreatPosture;
  topIdentifiers: { value: string; type: string; count: number }[];
  scamLibrary: ScamSignature[];
  honeypotSuccessRate: number;
  governanceMetrics: {
    avgPrivacyScore: number;
    complianceRate: number;
  };
}

export type KillChainStage = 'Reconnaissance' | 'Delivery' | 'Exploitation' | 'Actions on Objective';
export type HeaderStatus = 'VERIFIED_INSTITUTION' | 'SPOOFED_HEADER' | 'UNKNOWN_SENDER' | 'NOT_APPLICABLE';

export interface SourceIntelligence {
  likelyOrigin: string;
  networkDetails: string;
  institutionInference: string;
  isCrossBorder: boolean;
  geographicMarkers: string[];
  clusterId: string;
  clusterConfidence: number;
  signalStrength: number;
  headerStatus: HeaderStatus;
  sourceCategory: string;
  coordinates: { lat: number; lng: number };
}

export interface ForensicReport {
  psychologicalTactics: string[];
}

export interface IntelligenceLog extends ScamAnalysis {
  id: string;
  originalMessage: string;
  timestamp: number;
  messages: ChatMessage[]; 
  status: 'Open' | 'Investigating' | 'Blocked' | 'Resolved';
  linkedCaseIds: string[];
  operationalRequests: OperationalRequest[];
  governance: GovernanceDossier;
}

export interface ScamAnalysis {
  isScam: boolean;
  confidence: number; 
  scamType: string;
  language?: string;
  channel: 'text' | 'call' | 'video' | 'audio' | 'qr' | 'app' | 'social' | 'screen-share';
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  safetyAlert: string;
  extractedInfo: ExtractedInfo;
  groundingSources?: GroundingSource[];
  fingerprint: {
    primaryHandle: string;
    primaryPhone: string;
    primaryLink: string;
    category: string;
  };
  recommendedActions: string[];
  guardianGuidance?: GuardianGuidance;
  operationalReport?: OperationalReport;
  potentialImpact?: number;
  estimatedImpact?: number;
  killChainStage: KillChainStage;
  sourceIntelligence?: SourceIntelligence;
  forensicReport?: ForensicReport;
  aiReasoningTrace?: string;
  multiPlatformPropagation?: boolean;
}

export interface GuardianGuidance {
  user_alert: string;
  scam_type: string;
  risk_level: 'low' | 'medium' | 'high';
  captured_evidence: string;
  what_to_do_now: string[];
}

export interface OperationalReport {
  fraud_id: string;
  scam_type: string;
  risk_score: number;
  evidence: any;
  actions: any;
  priority: string;
  timestamp: string;
}

export interface GovernanceDossier {
  privacyScore: number;
  evidenceIntegrityHash: string;
  ethicsChecklist: any;
  legalStanding: string;
  auditLog: any[];
}

export interface ScamSignature {
  id: string;
  type: string;
  firstMessage: string;
  extractedIndicators: string[];
  tactics: string[];
  timestamp: number;
  patternMeta: any;
}

export interface OperationalRequest {
  id: string;
  type: string;
  target: string;
  status: 'Pending' | 'Sent' | 'Executed';
  priority: string;
}

export interface VideoAnalysis {
  isFraudulent: boolean;
  subjectIdentification: string;
  detectedThreats: string[];
  forensicNotes: string;
}