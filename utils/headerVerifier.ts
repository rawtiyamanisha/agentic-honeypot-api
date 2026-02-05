
import { HeaderStatus } from '../types';

const OFFICIAL_SMS_HEADERS = [
  'AD-SBI', 'VK-SBI', 'VM-SBI', 'JM-SBI', 'AX-SBI',
  'AD-HDFC', 'VK-HDFC', 'VM-HDFC', 'JM-HDFC', 'AX-HDFC',
  'AD-ICICI', 'VK-ICICI', 'VM-ICICI', 'JM-ICICI', 'AX-ICICI',
  'AD-PNB', 'VK-PNB', 'VM-PNB', 'JM-PNB', 'AX-PNB',
  'AD-AXIS', 'VK-AXIS', 'VM-AXIS', 'JM-AXIS', 'AX-AXIS',
  'AD-PAYTM', 'VK-PAYTM', 'VM-PAYTM', 'JM-PAYTM', 'AX-PAYTM',
  'AD-GOOGLE', 'VK-GOOGLE', 'AD-GGL', 'VM-GGL',
  'AD-AMAZON', 'VK-AMAZON', 'AD-AMZN', 'VM-AMZN'
];

const OFFICIAL_DOMAINS = [
  'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'pnbindia.in', 
  'axisbank.com', 'paytm.com', 'google.com', 'amazon.in', 'gov.in', 'nic.in'
];

export const verifyHeader = (input: string): HeaderStatus => {
  const trimmed = input.trim().toUpperCase();

  // Check SMS Header Pattern (usually 2 alpha prefix + dash + sender)
  // or simple sender like "SBI-BNK"
  if (OFFICIAL_SMS_HEADERS.includes(trimmed)) {
    return 'VERIFIED_INSTITUTION';
  }

  // Check for email-like domains
  if (input.includes('@')) {
    const domain = input.split('@').pop()?.toLowerCase();
    if (domain && OFFICIAL_DOMAINS.some(d => domain.endsWith(d))) {
      return 'VERIFIED_INSTITUTION';
    }
  }

  // Common spoofing patterns (e.g., using numbers to mimic letters)
  const suspiciousKeywords = ['L0AN', 'W1N', 'LUCK', 'PR1ZE', 'URGENT', 'SHOR7'];
  if (suspiciousKeywords.some(kw => trimmed.includes(kw))) {
    return 'SPOOFED_HEADER';
  }

  // If it looks like a header (6 chars with a dash) but not in our list
  const headerRegex = /^[A-Z0-9]{2}-[A-Z0-9]{3,8}$/;
  if (headerRegex.test(trimmed)) {
    return 'UNKNOWN_SENDER';
  }

  return 'NOT_APPLICABLE';
};
