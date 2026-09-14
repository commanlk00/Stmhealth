import { UserRole, UserSession } from '../types';
import { recordAuditLog } from './auditLogService';

export const ROLE_PROFILES: Record<UserRole, {
  roleTitle: string;
  department: string;
  defaultName: string;
  defaultEmail: string;
  description: string;
  permissions: string[];
}> = {
  OFFICER: {
    roleTitle: 'เจ้าพนักงานสาธารณสุขปฏิบัติการ',
    department: 'ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม',
    defaultName: 'นางสาวจินตนา พรหมประสิทธิ์',
    defaultEmail: 'jintana.p@localgov.go.th',
    description: 'ตรวจสอบสุขลักษณะสถานประกอบการ, ตรวจสอบเอกสารคำขอ, บันทึกการต่ออายุ',
    permissions: ['VIEW_LICENSES', 'CREATE_LICENSE', 'EDIT_LICENSE', 'RENEW_LICENSE', 'UPLOAD_DOCUMENTS'],
  },
  FINANCE: {
    roleTitle: 'เจ้าพนักงานการเงินและบัญชีชำนาญงาน',
    department: 'กองคลังและพัสดุ',
    defaultName: 'นายวิชาญ บุญนำ',
    defaultEmail: 'wichan.b@localgov.go.th',
    description: 'ตรวจสอบสลิปโอนเงิน PromptPay, จัดการ Webhook ธุรกรรม, ออกใบเสร็จรับเงินราชการ',
    permissions: ['VIEW_PAYMENTS', 'CONFIRM_PAYMENT', 'ISSUE_RECEIPT', 'VIEW_FINANCIAL_REPORTS'],
  },
  DIRECTOR: {
    roleTitle: 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
    department: 'สำนักบริหารงานสาธารณสุข',
    defaultName: 'นพ.เกียรติศักดิ์ เจริญผล',
    defaultEmail: 'kiattisak.c@localgov.go.th',
    description: 'ผู้มีอำนาจลงนามอนุมัติใบอนุญาตดิจิทัล (E-Signature), ตรวจสอบ PDPA เต็มรูปแบบ, อนุมัติการออกใบอนุญาต',
    permissions: ['ALL_ACCESS', 'SIGN_DIGITAL_LICENSE', 'APPROVE_LICENSE', 'VIEW_FULL_PDPA', 'VIEW_EXECUTIVE_REPORTS'],
  },
  AUDITOR_ADMIN: {
    roleTitle: 'ผู้ดูแลระบบและตรวจสอบความมั่นคงปลอดภัยสารสนเทศ',
    department: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    defaultName: 'นายณัฐพล ทวีทรัพย์ (CISA/CISSP)',
    defaultEmail: 'nattapon.admin@localgov.go.th',
    description: 'ตรวจสอบ WAF & Reverse Proxy, ควบคุม Audit Logs ไม่น้อยกว่า 90 วันตาม พ.ร.บ. คอมพิวเตอร์ฯ, ตรวจสอบความปลอดภัย DB',
    permissions: ['VIEW_WAF_SECURITY', 'VIEW_AUDIT_LOGS', 'EXPORT_AUDIT_LOGS', 'INSPECT_DATABASE_SCHEMA'],
  },
  CITIZEN: {
    roleTitle: 'ผู้ประกอบการ / ประชาชน (ยืนยันผ่าน ThaID)',
    department: 'ประชาชนผู้ใช้บริการระบบอิเล็กทรอนิกส์',
    defaultName: 'นายสมชาย วัฒนพาณิชย์',
    defaultEmail: 'somchai.cleanfoods@gmail.com',
    description: 'เข้าดูใบอนุญาตของตนเองผ่าน ThaID/OTP, ชำระค่าธรรมเนียม PromptPay, ดาวน์โหลด E-License PDF/A',
    permissions: ['VIEW_OWN_LICENSE', 'PAY_PROMPTPAY', 'DOWNLOAD_E_LICENSE', 'REQUEST_RENEWAL'],
  },
};

const SESSION_STORAGE_KEY = 'gov_current_user_session_v1';

export const getCurrentSession = (): UserSession => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }

  // Default initial session: OFFICER
  const defaultOfficer = ROLE_PROFILES.OFFICER;
  return {
    id: 'usr-officer-01',
    name: defaultOfficer.defaultName,
    role: 'OFFICER',
    roleTitle: defaultOfficer.roleTitle,
    department: defaultOfficer.department,
    email: defaultOfficer.defaultEmail,
    authMethod: '2FA_CREDENTIAL',
    is2FAVerified: true,
  };
};

export const USER_ROLES: UserRole[] = ['OFFICER', 'FINANCE', 'DIRECTOR', 'AUDITOR_ADMIN', 'CITIZEN'];

export const setCurrentSession = (session: UserSession) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  
  recordAuditLog({
    actorName: session.name,
    actorRole: session.role,
    actorIp: session.authMethod === 'THAID' ? '171.96.12.88 (Mobile ThaID)' : '203.144.144.15 (GovNet)',
    action: `USER_SESSION_SWITCH: ${session.role}`,
    category: 'AUTH',
    targetResource: 'RBAC_CONTROLLER',
    details: `เปลี่ยนผู้ใช้งานเป็น ${session.name} (${session.roleTitle}) ผ่านวิธี ${session.authMethod} (2FA: ${session.is2FAVerified ? 'Verified' : 'Pending'})`,
    status: 'SUCCESS',
  });
};

export const saveCurrentSession = setCurrentSession;

// Permission checking helpers
export const hasPermission = (target: UserSession | UserRole, permission: string): boolean => {
  const role: UserRole = typeof target === 'string' ? target : target.role;
  if (role === 'DIRECTOR') return true;
  const roleInfo = ROLE_PROFILES[role];
  return roleInfo ? roleInfo.permissions.includes(permission) : false;
};
