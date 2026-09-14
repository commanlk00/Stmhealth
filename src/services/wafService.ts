import { WAFSecurityStats } from '../types';
import { recordAuditLog } from './auditLogService';

let wafStats: WAFSecurityStats = {
  wafStatus: 'ACTIVE_SHIELD',
  totalInspectedRequests: 148290,
  blockedAttacks: 342,
  sqlInjectionBlocks: 184,
  xssOwaspBlocks: 96,
  ddosMitigatedCount: 48,
  rateLimitThrottled: 14,
  tlsVersion: 'TLS 1.3 (ChaCha20-Poly1305 / HSTS Preloaded)',
  lastThreatDetected: {
    type: 'SQL Injection attempt (UNION SELECT bypass)',
    sourceIp: '185.220.101.5 (Tor Exit Node)',
    timestamp: '2026-09-13 09:12:44',
    actionTaken: 'HTTP 403 Forbidden + IP Greylisted 24h',
  },
};

export const getWAFStats = (): WAFSecurityStats => {
  return { ...wafStats };
};

export const simulateAttackTest = (attackType: 'SQLI' | 'DDOS' | 'XSS' | 'PATH_TRAVERSAL'): {
  blocked: boolean;
  ruleTriggered: string;
  mitigation: string;
} => {
  let ruleTriggered = '';
  let mitigation = '';
  let attackDesc = '';

  if (attackType === 'SQLI') {
    wafStats.sqlInjectionBlocks += 1;
    wafStats.blockedAttacks += 1;
    ruleTriggered = 'OWASP CRS Rule 942100 - SQL Injection Detect';
    mitigation = 'WAF Blocked payload with HTTP 403. Sanitized query parameter.';
    attackDesc = "SQL Injection Payload: ' OR '1'='1' -- Detected on parameter `license_id`";
  } else if (attackType === 'DDOS') {
    wafStats.ddosMitigatedCount += 1;
    wafStats.blockedAttacks += 1;
    ruleTriggered = 'Anti-DDoS SYN-Flood & Layer 7 Rate Limit Filter (>120 req/sec)';
    mitigation = 'Traffic absorbed by Reverse Proxy edge shield. Rate limit applied.';
    attackDesc = 'Layer 7 HTTP Flood (1,450 req/sec from botnet cluster)';
  } else if (attackType === 'XSS') {
    wafStats.xssOwaspBlocks += 1;
    wafStats.blockedAttacks += 1;
    ruleTriggered = 'OWASP CRS Rule 941110 - XSS Script Tag Detection';
    mitigation = 'Payload neutralized by CSP Header & WAF input filter.';
    attackDesc = 'Stored XSS Vector <script>alert(document.cookie)</script>';
  } else {
    wafStats.blockedAttacks += 1;
    ruleTriggered = 'OWASP CRS Rule 930110 - Directory/Path Traversal';
    mitigation = 'Blocked attempt to access sensitive system files (../../etc/passwd)';
    attackDesc = 'Path Traversal attempt on file storage URI';
  }

  wafStats.lastThreatDetected = {
    type: attackDesc,
    sourceIp: `45.${Math.floor(100 + Math.random() * 90)}.${Math.floor(10 + Math.random() * 80)}.${Math.floor(1 + Math.random() * 250)} (Malicious Crawler)`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    actionTaken: 'HTTP 403 Forbidden & Logged to 90-day Forensic Vault',
  };

  // Record to Audit Log according to Computer Crime Act
  recordAuditLog({
    actorName: 'Web Application Firewall (WAF Edge)',
    actorRole: 'AUDITOR_ADMIN',
    actorIp: wafStats.lastThreatDetected.sourceIp,
    action: `WAF_THREAT_INTERCEPTED: ${attackType}`,
    category: 'SECURITY',
    targetResource: '/api/v1/secure-gateway',
    details: `${ruleTriggered} | ${mitigation}`,
    status: 'BLOCKED',
  });

  return {
    blocked: true,
    ruleTriggered,
    mitigation,
  };
};
