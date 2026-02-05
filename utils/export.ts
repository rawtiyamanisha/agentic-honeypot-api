import { IntelligenceLog } from '../types';

export const exportToJSON = (log: IntelligenceLog) => {
  const dataStr = JSON.stringify(log, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `case_${log.id}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportToCSV = (log: IntelligenceLog) => {
  const rows = [
    ["Field", "Value"],
    ["Case ID", log.id],
    ["Status", log.status],
    ["Channel", log.channel],
    ["Risk Level", log.threatLevel],
    ["Language", log.language || "N/A"],
    ["Scam Type", log.scamType],
    ["Summary", log.summary],
    ["Origin Origin", log.sourceIntelligence?.likelyOrigin || "N/A"],
    ["Is Cross-Border", log.sourceIntelligence?.isCrossBorder ? "Yes" : "No"],
    ["Network", log.sourceIntelligence?.networkDetails || "N/A"],
    ["UPI IDs", (log.extractedInfo?.upiIds || []).map(i => i.value).join("; ")],
    ["IFSC Codes", (log.extractedInfo?.ifscCodes || []).map(i => i.value).join("; ")],
    ["Phone Numbers", (log.extractedInfo?.phoneNumbers || []).map(i => i.value).join("; ")],
    ["Links", (log.extractedInfo?.links || []).map(i => i.value).join("; ")],
    ["Interaction Count", log.messages?.length.toString() || "0"],
  ];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `case_${log.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToTextForensic = (log: IntelligenceLog) => {
  const transcript = (log.messages || []).map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role === 'scammer' ? 'TARGET' : 'AI-RAKSHAK'}: ${m.content}`).join('\n');
  const content = `
BHARAT CYBER RAKSHAK - FORENSIC CASE REPORT
=========================================
CASE ID: ${log.id}
TIMESTAMP: ${new Date(log.timestamp).toLocaleString()}
STATUS: ${log.status}
THREAT LEVEL: ${log.threatLevel}
LANGUAGE: ${log.language}

SOURCE INTELLIGENCE:
-------------------
Origin: ${log.sourceIntelligence?.likelyOrigin || 'Inference Pending'}
Cross-Border: ${log.sourceIntelligence?.isCrossBorder ? 'YES' : 'NO'}
Network: ${log.sourceIntelligence?.networkDetails}
Institution: ${log.sourceIntelligence?.institutionInference}
Markers: ${log.sourceIntelligence?.geographicMarkers?.join(', ') || 'None'}

EXECUTIVE SUMMARY:
${log.summary}

EXTRACTED INDICATORS:
--------------------
UPI: ${(log.extractedInfo?.upiIds || []).map(i => i.value).join(', ') || 'None'}
IFSC: ${(log.extractedInfo?.ifscCodes || []).map(i => i.value).join(', ') || 'None'}
TEL: ${(log.extractedInfo?.phoneNumbers || []).map(i => i.value).join(', ') || 'None'}
URL: ${(log.extractedInfo?.links || []).map(i => i.value).join(', ') || 'None'}

FULL INTERACTION TRANSCRIPT:
---------------------------
${transcript}
  `;

  const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', `case_${log.id}_forensic.txt`);
  linkElement.click();
};