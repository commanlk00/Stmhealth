import { AuditLogEntry, UserRole } from '../types';

const AUDIT_LOG_STORAGE_KEY = 'gov_audit_logs_v1';

// Initial pre-populated audit logs adhering to 90-day retention
const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-2026-0913-001',
    timestamp: '2026-09-13 08:30:15',
    actorName: 'นางสาวจินตนา พรหมประสิทธิ์',
    actorRole: 'OFFICER',
    actorIp: '203.144.144.22 (Intranet GovNet)',
    action: 'LOGIN_2FA_SUCCESS',
    category: 'AUTH',
    targetResource: 'AUTH_GATEWAY',
    details: 'เข้าสู่ระบบสำเร็จผ่าน OTP/2FA รหัสผ่านครั้งเดียว',
    sha256Hash: 'a7b93c8e4f12d59e8b61c920f01a34bc7e89df61a2b3c4d5e6f7a8b9c0d1e2f3',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-0913-002',
    timestamp: '2026-09-13 09:12:44',
    actorName: 'WAF Guard Engine v3.4',
    actorRole: 'AUDITOR_ADMIN',
    actorIp: '185.220.101.5 (Tor Exit Node)',
    action: 'WAF_SQLI_BLOCKED',
    category: 'SECURITY',
    targetResource: '/api/v1/licenses?search=admin%27%20OR%201=1--',
    details: 'ตรวจพบและบล็อกการโจมตี SQL Injection ตามกฎ OWASP Top 10 (RuleID: 942100)',
    sha256Hash: 'b8c04d9f5a23e60f9c72d031a12b45cd8f90ea72b3c4d5e6f7a8b9c0d1e2f3a4',
    status: 'BLOCKED',
  },
  {
    id: 'LOG-2026-0913-003',
    timestamp: '2026-09-13 10:05:18',
    actorName: 'นายประสิทธิ์ สุขสมบัติ (จนท.สุขาภิบาล)',
    actorRole: 'OFFICER',
    actorIp: '192.168.10.45 (GovNet LAN)',
    action: 'STAFF_LOGIN_SUCCESS',
    category: 'AUTH',
    targetResource: 'AUTH_SERVICE',
    details: 'เข้าสู่ระบบด้วยรหัสประจำตัวเจ้าหน้าที่ (ID: officer) และรหัสผ่านสำเร็จ',
    sha256Hash: 'c9d15e0a6b34f71a0d83e142b23c56de9a01fb83c4d5e6f7a8b9c0d1e2f3a4b5',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-0913-004',
    timestamp: '2026-09-13 11:20:00',
    actorName: 'นายวิชาญ บุญนำ (จนท.การเงิน)',
    actorRole: 'FINANCE',
    actorIp: '203.144.144.35 (Finance VLAN)',
    action: 'PROMPTPAY_WEBHOOK_CONFIRMED',
    category: 'PAYMENT',
    targetResource: 'TX-PP-883921',
    details: 'ยืนยันยอดชำระค่าธรรมเนียมผ่าน PromptPay Gateway 3,000.00 บาท อัตโนมัติ',
    sha256Hash: 'd0e26f1b7c45a82b1e94f253c34d67ef0b12ac94d5e6f7a8b9c0d1e2f3a4b5c6',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-0913-005',
    timestamp: '2026-09-13 13:45:10',
    actorName: 'นพ.เกียรติศักดิ์ เจริญผล (ผอ.กองสาธารณสุข)',
    actorRole: 'DIRECTOR',
    actorIp: '203.144.144.10 (Executive Office)',
    action: 'DIGITAL_SIGNATURE_APPLIED',
    category: 'LICENSE_ISSUE',
    targetResource: 'LIC-2569-0012',
    details: 'ลงรหัสลายมือชื่อดิจิทัล (SHA256withRSA + TSA) อนุมัติ E-License แบบ สธ.๑',
    sha256Hash: 'e1f37a2c8d56b93c2f05a364d45e78fa1c23bd05e6f7a8b9c0d1e2f3a4b5c6d7',
    status: 'SUCCESS',
  },
];

export const getAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_LOGS;
  }
};

export interface LogPayload {
  actorName?: string;
  actor?: string;
  actorRole?: UserRole;
  actorIp?: string;
  action: string;
  category?: 'AUTH' | 'ACCESS' | 'PAYMENT' | 'LICENSE_ISSUE' | 'RENEWAL' | 'SECURITY' | 'PDPA_UNMASK';
  targetResource?: string;
  resource?: string;
  resourceId?: string;
  details: string;
  status?: 'SUCCESS' | 'BLOCKED' | 'WARNING';
}

export const recordAuditLog = (entry: LogPayload): AuditLogEntry => {
  const currentLogs = getAuditLogs();
  const now = new Date();
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const id = `LOG-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const actorName = entry.actorName || entry.actor || 'เจ้าพนักงานผู้ปฏิบัติงาน';
  const actorRole = entry.actorRole || 'OFFICER';
  const actorIp = entry.actorIp || '203.144.144.25 (Intranet GovNet)';
  const targetResource = entry.targetResource || (entry.resource ? `${entry.resource}${entry.resourceId ? `:${entry.resourceId}` : ''}` : 'SYSTEM_RESOURCES');
  
  let category = entry.category;
  if (!category) {
    if (entry.action.includes('LOGIN') || entry.action.includes('LOGOUT') || entry.action.includes('AUTH')) {
      category = 'AUTH';
    } else if (entry.action.includes('PAY')) {
      category = 'PAYMENT';
    } else if (entry.action.includes('RENEW')) {
      category = 'RENEWAL';
    } else if (entry.action.includes('LICENSE') || entry.action.includes('CREATE')) {
      category = 'LICENSE_ISSUE';
    } else if (entry.action.includes('MASK') || entry.action.includes('PDPA')) {
      category = 'PDPA_UNMASK';
    } else if (entry.action.includes('SECURITY') || entry.action.includes('WAF')) {
      category = 'SECURITY';
    } else {
      category = 'ACCESS';
    }
  }

  const status = entry.status || 'SUCCESS';

  // Generate simple hash chain simulator
  const payloadToHash = `${id}|${timestampStr}|${actorName}|${actorRole}|${entry.action}|${targetResource}`;
  let hash = 0;
  for (let i = 0; i < payloadToHash.length; i++) {
    const char = payloadToHash.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0') + 'e4f12d59e8b61c920f01a34bc7e89df6';

  const newLog: AuditLogEntry = {
    id,
    timestamp: timestampStr,
    actorName,
    actorRole,
    actorIp,
    action: entry.action,
    category,
    targetResource,
    details: entry.details,
    sha256Hash: hexHash,
    status,
  };

  const updated = [newLog, ...currentLogs];
  localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
  return newLog;
};
