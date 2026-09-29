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
  DATA_ENTRY: {
    roleTitle: 'เจ้าหน้าที่บันทึกข้อมูลคำขอ',
    department: 'ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม',
    defaultName: 'นายธีรพงศ์ บันทึกงาน',
    defaultEmail: 'teerapong.d@localgov.go.th',
    description: 'รับเรื่องและบันทึกข้อมูลคำขอรับใบอนุญาต, อัปโหลดเอกสารหลักฐาน, ตรวจสอบข้อมูลเบื้องต้น',
    permissions: ['VIEW_LICENSES', 'CREATE_LICENSE', 'EDIT_LICENSE', 'UPLOAD_DOCUMENTS'],
  },
  OFFICER: {
    roleTitle: 'เจ้าพนักงานสาธารณสุขปฏิบัติการ',
    department: 'ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม',
    defaultName: 'นางสาวจินตนา พรหมประสิทธิ์',
    defaultEmail: 'jintana.p@localgov.go.th',
    description: 'ตรวจสอบสุขลักษณะสถานประกอบการ, ตรวจสอบเอกสารคำขอ, บันทึกการต่ออายุ, อนุมัติสิทธิ์เจ้าหน้าที่',
    permissions: ['VIEW_LICENSES', 'CREATE_LICENSE', 'EDIT_LICENSE', 'RENEW_LICENSE', 'UPLOAD_DOCUMENTS', 'MANAGE_STAFF'],
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
    description: 'ผู้มีอำนาจลงนามอนุมัติใบอนุญาตดิจิทัล (E-Signature), ตรวจสอบ PDPA เต็มรูปแบบ, อนุมัติการออกใบอนุญาต, กำหนดสิทธิ์เจ้าหน้าที่',
    permissions: ['ALL_ACCESS', 'SIGN_DIGITAL_LICENSE', 'APPROVE_LICENSE', 'VIEW_FULL_PDPA', 'VIEW_EXECUTIVE_REPORTS', 'MANAGE_STAFF'],
  },
  AUDITOR_ADMIN: {
    roleTitle: 'ผู้ดูแลระบบและตรวจสอบความมั่นคงปลอดภัยสารสนเทศ',
    department: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    defaultName: 'นายณัฐพล ทวีทรัพย์ (CISA/CISSP)',
    defaultEmail: 'nattapon.admin@localgov.go.th',
    description: 'ตรวจสอบ WAF & Reverse Proxy, ควบคุม Audit Logs, ตั้งค่าสิทธิ์และบัญชีเจ้าหน้าที่',
    permissions: ['VIEW_WAF_SECURITY', 'VIEW_AUDIT_LOGS', 'EXPORT_AUDIT_LOGS', 'INSPECT_DATABASE_SCHEMA', 'MANAGE_STAFF', 'VIEW_LICENSES', 'CREATE_LICENSE', 'EDIT_LICENSE'],
  },
  CITIZEN: {
    roleTitle: 'ผู้ประกอบการ / ประชาชนทั่วไป',
    department: 'ประชาชนผู้ขอรับใบอนุญาต',
    defaultName: 'นายสมชาย วัฒนพาณิชย์',
    defaultEmail: 'somchai.cleanfoods@gmail.com',
    description: 'เข้าดูใบอนุญาตของตนเอง, ชำระค่าธรรมเนียม PromptPay, ดาวน์โหลด E-License PDF/A',
    permissions: ['VIEW_OWN_LICENSE', 'PAY_PROMPTPAY', 'DOWNLOAD_E_LICENSE', 'REQUEST_RENEWAL'],
  },
};

const SESSION_STORAGE_KEY = 'gov_current_user_session_v2';

export const getCurrentSession = (): UserSession => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }

  // Default initial session: ADMIN or OFFICER
  const defaultOfficer = ROLE_PROFILES.OFFICER;
  return {
    id: 'staff-officer-01',
    username: 'officer',
    name: defaultOfficer.defaultName,
    role: 'OFFICER',
    roleTitle: defaultOfficer.roleTitle,
    department: defaultOfficer.department,
    email: defaultOfficer.defaultEmail,
    authMethod: 'PASSWORD_LOGIN',
    is2FAVerified: true,
    allowedPermissions: defaultOfficer.permissions,
  };
};

export const USER_ROLES: UserRole[] = ['DATA_ENTRY', 'OFFICER', 'FINANCE', 'DIRECTOR', 'AUDITOR_ADMIN', 'CITIZEN'];

// เช็คสิทธิ์ผู้อนุมัติ: ระดับเจ้าพนักงานสาธารณสุขเป็นต้นไป (OFFICER, DIRECTOR, AUDITOR_ADMIN)
export const canApproveStaff = (role: UserRole): boolean => {
  return role === 'OFFICER' || role === 'DIRECTOR' || role === 'AUDITOR_ADMIN';
};

export const setCurrentSession = (session: UserSession) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  
  recordAuditLog({
    actorName: session.name,
    actorRole: session.role,
    actorIp: '203.144.144.15 (GovNet)',
    action: `USER_SESSION_SWITCH: ${session.role}`,
    category: 'AUTH',
    targetResource: 'RBAC_CONTROLLER',
    details: `เปลี่ยนผู้ใช้งานเป็น ${session.name} (${session.roleTitle}) ผ่านวิธี ${session.authMethod}`,
    status: 'SUCCESS',
  });
};

export const saveCurrentSession = setCurrentSession;

// Permission checking helpers
export const hasPermission = (target: UserSession | UserRole, permission: string): boolean => {
  if (typeof target === 'object' && target !== null) {
    if (target.role === 'DIRECTOR') return true;
    if (Array.isArray(target.allowedPermissions) && target.allowedPermissions.length > 0) {
      return target.allowedPermissions.includes(permission);
    }
    const roleInfo = ROLE_PROFILES[target.role];
    return roleInfo ? roleInfo.permissions.includes(permission) : false;
  }
  const role = target as UserRole;
  if (role === 'DIRECTOR') return true;
  const roleInfo = ROLE_PROFILES[role];
  return roleInfo ? roleInfo.permissions.includes(permission) : false;
};
