import { StaffAccount, StaffAccountStatus, UserRole, UserSession } from '../types';
import { recordAuditLog } from './auditLogService';
import { ROLE_PROFILES, canApproveStaff } from './rbacService';
import {
  saveStaffAccountOnline,
  deleteStaffAccountOnline,
  syncInitialStaffAccountsOnline,
  fetchOnlineStaffAccounts,
  subscribeToOnlineStaffAccounts,
} from './firestoreService';

const STAFF_STORAGE_KEY = 'gov_staff_accounts_v5';
export const STAFF_EVENT_KEY = 'gov_staff_accounts_updated';

export interface PermissionDefinition {
  code: string;
  name: string;
  category: 'LICENSE' | 'FINANCE' | 'APPROVAL' | 'SECURITY' | 'ADMIN';
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  {
    code: 'VIEW_LICENSES',
    name: 'ดูข้อมูลทะเบียนใบอนุญาต',
    category: 'LICENSE',
    description: 'เข้าดูรายชื่อและรายละเอียดใบอนุญาตทั้ง 4 หมวดหมู่',
  },
  {
    code: 'CREATE_LICENSE',
    name: 'ออกใบอนุญาตใหม่',
    category: 'LICENSE',
    description: 'บันทึกและขึ้นทะเบียนใบอนุญาตสถานประกอบการใหม่',
  },
  {
    code: 'EDIT_LICENSE',
    name: 'แก้ไขข้อมูลใบอนุญาต',
    category: 'LICENSE',
    description: 'แก้ไขข้อมูลสถานประกอบการและรายละเอียดผู้รับใบอนุญาต',
  },
  {
    code: 'RENEW_LICENSE',
    name: 'บันทึกการต่ออายุ',
    category: 'LICENSE',
    description: 'รับคำขอและบันทึกประวัติการต่ออายุใบอนุญาตประจำปี',
  },
  {
    code: 'UPLOAD_DOCUMENTS',
    name: 'ตรวจสอบเอกสารแนบ',
    category: 'LICENSE',
    description: 'ตรวจเช็คความถูกต้องของเอกสารหลักฐานและอัปโหลดหลักฐาน',
  },
  {
    code: 'VIEW_PAYMENTS',
    name: 'ดูรายการชำระค่าธรรมเนียม',
    category: 'FINANCE',
    description: 'เข้าดูประวัติและรายการชำระผ่าน PromptPay / เคาน์เตอร์',
  },
  {
    code: 'CONFIRM_PAYMENT',
    name: 'ตรวจสอบและยืนยันการชำระเงิน',
    category: 'FINANCE',
    description: 'ตรวจสอบสลิปโอนเงิน ยืนยันยอดเงิน และออกใบเสร็จรับเงิน',
  },
  {
    code: 'VIEW_FINANCIAL_REPORTS',
    name: 'ดูรายงานการเงินและค่าธรรมเนียม',
    category: 'FINANCE',
    description: 'ดูสรุปรายรับค่าธรรมเนียมสุขาภิบาลประจำเดือนและปีงบประมาณ',
  },
  {
    code: 'SIGN_DIGITAL_LICENSE',
    name: 'ลงนามดิจิทัล (Digital Signature)',
    category: 'APPROVAL',
    description: 'ผู้มีอำนาจลงนามรับรองใบอนุญาตอิเล็กทรอนิกส์ (E-License)',
  },
  {
    code: 'APPROVE_LICENSE',
    name: 'อนุมัติการออกใบอนุญาต',
    category: 'APPROVAL',
    description: 'อนุมัติคำขอออกหรือต่ออายุใบอนุญาตในระดับผู้บริหาร',
  },
  {
    code: 'VIEW_FULL_PDPA',
    name: 'เข้าถึงข้อมูลส่วนบุคคล (PDPA)',
    category: 'SECURITY',
    description: 'ปลดล็อคการดูเลขบัตรประชาชน 13 หลักและข้อมูลคุ้มครอง',
  },
  {
    code: 'VIEW_AUDIT_LOGS',
    name: 'ตรวจสอบ Audit Logs 90 วัน',
    category: 'SECURITY',
    description: 'ตรวจสอบประวัติจราจรทางคอมพิวเตอร์ตาม พ.ร.บ. คอมพิวเตอร์ฯ',
  },
  {
    code: 'VIEW_WAF_SECURITY',
    name: 'มอนิเตอร์ไฟร์วอลล์ WAF',
    category: 'SECURITY',
    description: 'ตรวจสอบการป้องกันภัยคุกคามและการโจมตีเครือข่าย',
  },
  {
    code: 'MANAGE_STAFF',
    name: 'ตั้งค่าการเข้าถึงและจัดการเจ้าหน้าที่ (Admin)',
    category: 'ADMIN',
    description: 'สร้าง แก้ไข ระงับ กำหนดสิทธิ์ และรีเซ็ตรหัสผ่านเจ้าหน้าที่',
  },
];

// Pre-seeded staff accounts set up by the system Admin
const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-admin-01',
    username: 'infosser',
    password: '464272010',
    name: 'ผู้ดูแลระบบหลัก (System Administrator)',
    position: 'ผู้ดูแลระบบและตรวจสอบความมั่นคงปลอดภัยสารสนเทศ',
    role: 'AUDITOR_ADMIN',
    roleTitle: 'ผู้ดูแลระบบความปลอดภัยและบัญชีผู้ใช้งาน',
    department: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    email: 'infosser@localgov.go.th',
    phone: '02-123-4567 ต่อ 101',
    status: 'ACTIVE',
    allowedPermissions: [
      'MANAGE_STAFF',
      'VIEW_LICENSES',
      'CREATE_LICENSE',
      'EDIT_LICENSE',
      'RENEW_LICENSE',
      'UPLOAD_DOCUMENTS',
      'VIEW_AUDIT_LOGS',
      'VIEW_WAF_SECURITY',
      'VIEW_FULL_PDPA',
      'VIEW_PAYMENTS',
      'CONFIRM_PAYMENT',
      'VIEW_FINANCIAL_REPORTS',
      'SIGN_DIGITAL_LICENSE',
      'APPROVE_LICENSE',
    ],
    createdAt: '2026-01-10T08:30:00Z',
    lastLoginAt: '2026-09-16T09:12:00Z',
    notes: 'บัญชีผู้ดูแลระบบหลัก (Master Administrator)',
  },
  {
    id: 'staff-director-01',
    username: 'director',
    password: 'Director#2026',
    name: 'นพ.เกียรติศักดิ์ เจริญผล',
    position: 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
    role: 'DIRECTOR',
    roleTitle: 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
    department: 'สำนักบริหารงานสาธารณสุข',
    email: 'kiattisak.c@localgov.go.th',
    phone: '02-123-4567 ต่อ 201',
    status: 'ACTIVE',
    allowedPermissions: [
      'VIEW_LICENSES',
      'SIGN_DIGITAL_LICENSE',
      'APPROVE_LICENSE',
      'VIEW_FULL_PDPA',
      'VIEW_FINANCIAL_REPORTS',
      'VIEW_AUDIT_LOGS',
      'MANAGE_STAFF',
    ],
    createdAt: '2026-01-12T09:00:00Z',
    lastLoginAt: '2026-09-15T14:45:00Z',
    notes: 'ผู้มีอำนาจลงนามอนุมัติใบอนุญาตดิจิทัล E-License',
  },
  {
    id: 'staff-officer-01',
    username: 'officer',
    password: 'Officer#2026',
    name: 'นางสาวจินตนา พรหมประสิทธิ์',
    position: 'เจ้าพนักงานสาธารณสุขปฏิบัติการ',
    role: 'OFFICER',
    roleTitle: 'เจ้าพนักงานสาธารณสุขปฏิบัติการ',
    department: 'ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม',
    email: 'jintana.p@localgov.go.th',
    phone: '02-123-4567 ต่อ 302',
    status: 'ACTIVE',
    allowedPermissions: [
      'VIEW_LICENSES',
      'CREATE_LICENSE',
      'EDIT_LICENSE',
      'RENEW_LICENSE',
      'UPLOAD_DOCUMENTS',
    ],
    createdAt: '2026-01-15T10:00:00Z',
    lastLoginAt: '2026-09-16T08:15:00Z',
    notes: 'ผู้ปฏิบัติงานตรวจสอบสุขลักษณะและบันทึกข้อมูลคำขอ',
  },
  {
    id: 'staff-finance-01',
    username: 'finance',
    password: 'Finance#2026',
    name: 'นายวิชาญ บุญนำ',
    position: 'เจ้าพนักงานการเงินและบัญชีชำนาญงาน',
    role: 'FINANCE',
    roleTitle: 'เจ้าพนักงานการเงินและบัญชีชำนาญงาน',
    department: 'กองคลังและพัสดุ (ฝ่ายการเงิน)',
    email: 'wichan.b@localgov.go.th',
    phone: '02-123-4567 ต่อ 405',
    status: 'ACTIVE',
    allowedPermissions: [
      'VIEW_LICENSES',
      'VIEW_PAYMENTS',
      'CONFIRM_PAYMENT',
      'VIEW_FINANCIAL_REPORTS',
    ],
    createdAt: '2026-01-18T11:30:00Z',
    lastLoginAt: '2026-09-15T16:20:00Z',
    notes: 'รับชำระค่าธรรมเนียมและตรวจสอบสลิป PromptPay',
  },
  {
    id: 'staff-sanitary-02',
    username: 'sanitary01',
    password: 'Staff#2026',
    name: 'นายสมพงษ์ สิทธิเวช',
    position: 'เจ้าพนักงานสุขาภิบาล',
    role: 'OFFICER',
    roleTitle: 'เจ้าพนักงานสุขาภิบาล',
    department: 'ฝ่ายควบคุมสุขลักษณะอาหารและสิ่งแวดล้อม',
    email: 'sompong.s@localgov.go.th',
    phone: '02-123-4567 ต่อ 305',
    status: 'ACTIVE',
    allowedPermissions: [
      'VIEW_LICENSES',
      'RENEW_LICENSE',
      'UPLOAD_DOCUMENTS',
    ],
    createdAt: '2026-02-01T08:45:00Z',
    lastLoginAt: '2026-09-12T11:00:00Z',
    notes: 'ตรวจสถานประกอบการและต่ออายุใบอนุญาต',
  },
  {
    id: 'staff-reg-pending-01',
    username: 'entry01',
    password: 'Entry#2026',
    name: 'นายสมเจตน์ ใจมั่น',
    position: 'เจ้าหน้าที่บันทึกข้อมูล (ธุรการจ้างเหมา)',
    role: 'DATA_ENTRY',
    roleTitle: 'เจ้าหน้าที่บันทึกข้อมูลคำขอ',
    department: 'ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม',
    email: 'somjet.data@localgov.go.th',
    phone: '089-123-4567',
    status: 'PENDING',
    allowedPermissions: ['VIEW_LICENSES', 'CREATE_LICENSE', 'EDIT_LICENSE', 'UPLOAD_DOCUMENTS'],
    createdAt: '2026-09-28T09:30:00Z',
    registeredAt: '2026-09-28T09:30:00Z',
    requestedRole: 'DATA_ENTRY',
    requestedReason: 'ขอเข้าใช้งานเพื่อบันทึกข้อมูลคำขอรับใบอนุญาตและสแกนอัปโหลดเอกสารหลักฐานของสถานประกอบการ',
    notes: 'ยื่นคำขอลงทะเบียน รอเจ้าพนักงานสาธารณสุขหรือผู้บริหารตรวจสอบอนุมัติสิทธิ์',
  },
];

// Merge online staff accounts with local accounts, guaranteeing admin account preservation
export const mergeStaffAccounts = (onlineAccounts: StaffAccount[]): StaffAccount[] => {
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    const localList: StaffAccount[] = raw ? JSON.parse(raw) : INITIAL_STAFF_ACCOUNTS;

    const accountMap = new Map<string, StaffAccount>();

    // 1. Put local accounts first
    for (const acc of localList) {
      if (acc && acc.username) {
        accountMap.set(acc.username.toLowerCase(), acc);
      }
    }

    // 2. Overlay / merge online accounts from Cloud Firestore
    for (const onl of onlineAccounts) {
      if (onl && onl.username) {
        const key = onl.username.toLowerCase();
        const existing = accountMap.get(key);
        if (existing) {
          accountMap.set(key, { ...existing, ...onl });
        } else {
          accountMap.set(key, onl);
        }
      }
    }

    // 3. Ensure master admin infosser / 464272010 is ALWAYS preserved
    const adminKey = 'infosser';
    const existingAdmin = accountMap.get(adminKey);
    accountMap.set(adminKey, {
      id: existingAdmin?.id || 'staff-admin-01',
      username: 'infosser',
      password: '464272010',
      name: existingAdmin?.name || 'ผู้ดูแลระบบกลาง (Master Admin)',
      position: existingAdmin?.position || 'หัวหน้าฝ่ายพัฒนาระบบเทคโนโลยีสารสนเทศ',
      department: existingAdmin?.department || 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
      email: existingAdmin?.email || 'admin.sys@localgov.go.th',
      phone: existingAdmin?.phone || '02-123-4567 ต่อ 9999',
      role: 'AUDITOR_ADMIN',
      roleTitle: 'ผู้ดูแลระบบและตรวจสอบ (Admin / Auditor)',
      status: 'ACTIVE',
      allowedPermissions: [
        'VIEW_LICENSES',
        'CREATE_LICENSE',
        'EDIT_LICENSE',
        'RENEW_LICENSE',
        'RECORD_PAYMENT',
        'PRINT_RECEIPT',
        'SIGN_E_LICENSE',
        'APPROVE_LICENSE',
        'VIEW_AUDIT_LOGS',
        'EXPORT_AUDIT_LOGS',
        'SECURITY_MONITOR',
        'MANAGE_STAFF',
      ],
      createdAt: existingAdmin?.createdAt || '2026-01-01T00:00:00Z',
    });

    const merged = Array.from(accountMap.values());
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(merged));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STAFF_EVENT_KEY, { detail: merged }));
    }

    return merged;
  } catch (err) {
    console.error('Error merging staff accounts:', err);
    return getStaffAccounts();
  }
};

// Manually fetch and sync all staff accounts from Cloud Firestore
export const syncStaffAccountsFromCloud = async (): Promise<StaffAccount[]> => {
  try {
    const onlineList = await fetchOnlineStaffAccounts();
    if (onlineList && onlineList.length > 0) {
      return mergeStaffAccounts(onlineList);
    } else {
      // Online collection empty, seed initial accounts
      const current = getStaffAccounts();
      for (const acc of current) {
        await saveStaffAccountOnline(acc);
      }
      return current;
    }
  } catch (err) {
    console.warn('Failed to sync staff accounts from cloud:', err);
    return getStaffAccounts();
  }
};

// Real-time synchronization listener for staff accounts
export const initStaffAccountsListener = (
  onUpdate?: (accounts: StaffAccount[]) => void
): (() => void) => {
  const unsubscribeFirestore = subscribeToOnlineStaffAccounts(
    (onlineList) => {
      if (Array.isArray(onlineList) && onlineList.length > 0) {
        const merged = mergeStaffAccounts(onlineList);
        if (onUpdate) onUpdate(merged);
      }
    },
    (err) => {
      console.warn('Firestore staff listener notice:', err);
    }
  );

  const handleLocalUpdate = (e: any) => {
    if (onUpdate) {
      onUpdate(e.detail || getStaffAccounts());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(STAFF_EVENT_KEY, handleLocalUpdate);
  }

  return () => {
    unsubscribeFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener(STAFF_EVENT_KEY, handleLocalUpdate);
    }
  };
};

// Load staff accounts from storage or init with seeded
export const getStaffAccounts = (): StaffAccount[] => {
  try {
    // Attempt online sync in the background
    syncInitialStaffAccountsOnline(INITIAL_STAFF_ACCOUNTS).catch(() => {});

    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let hasMasterAdmin = false;
        let modified = false;

        const updated = parsed.map((acc: StaffAccount) => {
          if (
            acc.username.toLowerCase() === 'infosser' ||
            acc.username.toLowerCase() === 'admin' ||
            acc.id === 'staff-admin-01' ||
            acc.role === 'AUDITOR_ADMIN'
          ) {
            hasMasterAdmin = true;
            if (acc.username !== 'infosser' || acc.password !== '464272010' || acc.status !== 'ACTIVE') {
              modified = true;
              return {
                ...acc,
                username: 'infosser',
                password: '464272010',
                status: 'ACTIVE' as const,
                role: 'AUDITOR_ADMIN' as const,
              };
            }
          }
          return acc;
        });

        if (!hasMasterAdmin) {
          const defaultAdmin = INITIAL_STAFF_ACCOUNTS.find((a) => a.username === 'infosser');
          if (defaultAdmin) {
            updated.unshift(defaultAdmin);
            modified = true;
          }
        }

        if (modified) {
          saveStaffAccounts(updated);
        }

        return updated;
      }
    }
  } catch (e) {
    console.error('Failed to load staff accounts:', e);
  }
  // Initialize and save
  saveStaffAccounts(INITIAL_STAFF_ACCOUNTS);
  return INITIAL_STAFF_ACCOUNTS;
};

export const saveStaffAccounts = (accounts: StaffAccount[]) => {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(accounts));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STAFF_EVENT_KEY, { detail: accounts }));
    }
    // Asynchronously sync each account to Cloud Firestore
    accounts.forEach((acc) => {
      saveStaffAccountOnline(acc).catch((err) => {
        console.warn('Sync staff account to Firestore notice:', err);
      });
    });
  } catch (e) {
    console.error('Failed to save staff accounts:', e);
  }
};

// Find account by ID or Username
export const getStaffByUsername = (username: string): StaffAccount | undefined => {
  const accounts = getStaffAccounts();
  const trimmed = username.trim().toLowerCase();
  return accounts.find((acc) => acc.username.toLowerCase() === trimmed);
};

// Create new staff account by Admin
export const createStaffAccount = (
  data: Omit<StaffAccount, 'id' | 'createdAt' | 'lastLoginAt'>,
  adminActor: { name: string; role: UserRole }
): { success: boolean; account?: StaffAccount; error?: string } => {
  const accounts = getStaffAccounts();
  const usernameTrimmed = data.username.trim();

  if (!usernameTrimmed) {
    return { success: false, error: 'กรุณากรอกรหัสประจำตัวเจ้าหน้าที่ (Username)' };
  }

  // Check unique username
  const exists = accounts.some(
    (acc) => acc.username.toLowerCase() === usernameTrimmed.toLowerCase()
  );
  if (exists) {
    return { success: false, error: `รหัสประจำตัว/Username "${usernameTrimmed}" มีอยู่ในระบบแล้ว` };
  }

  if (!data.password || data.password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  if (!data.name || data.name.trim().length === 0) {
    return { success: false, error: 'กรุณากรอกชื่อ-นามสกุลของเจ้าหน้าที่' };
  }

  const newAccount: StaffAccount = {
    ...data,
    id: `staff-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    username: usernameTrimmed,
    createdAt: new Date().toISOString(),
    status: data.status || 'ACTIVE',
    allowedPermissions: data.allowedPermissions || getDefaultPermissionsForRole(data.role),
  };

  const updated = [newAccount, ...accounts];
  saveStaffAccounts(updated);

  recordAuditLog({
    actorName: adminActor.name,
    actorRole: adminActor.role,
    action: 'CREATE_STAFF_ACCOUNT',
    category: 'AUTH',
    targetResource: `STAFF_USER:${newAccount.username}`,
    details: `ผู้ดูแลระบบสร้างบัญชีเจ้าหน้าที่ใหม่: ${newAccount.name} (${newAccount.username}) บทบาท: ${newAccount.roleTitle}`,
    status: 'SUCCESS',
  });

  return { success: true, account: newAccount };
};

// Update existing staff account by Admin
export const updateStaffAccount = (
  id: string,
  updates: Partial<StaffAccount>,
  adminActor: { name: string; role: UserRole }
): { success: boolean; account?: StaffAccount; error?: string } => {
  const accounts = getStaffAccounts();
  const index = accounts.findIndex((acc) => acc.id === id);

  if (index === -1) {
    return { success: false, error: 'ไม่พบบัญชีเจ้าหน้าที่ที่ต้องการแก้ไข' };
  }

  const current = accounts[index];

  // If changing username, check collision
  if (updates.username && updates.username.toLowerCase() !== current.username.toLowerCase()) {
    const conflict = accounts.some(
      (a) => a.id !== id && a.username.toLowerCase() === updates.username!.trim().toLowerCase()
    );
    if (conflict) {
      return { success: false, error: `รหัสประจำตัว "${updates.username}" มีอยู่ในระบบแล้ว` };
    }
  }

  const updatedAccount: StaffAccount = {
    ...current,
    ...updates,
    username: updates.username ? updates.username.trim() : current.username,
  };

  accounts[index] = updatedAccount;
  saveStaffAccounts(accounts);

  recordAuditLog({
    actorName: adminActor.name,
    actorRole: adminActor.role,
    action: 'UPDATE_STAFF_ACCOUNT',
    category: 'AUTH',
    targetResource: `STAFF_USER:${updatedAccount.username}`,
    details: `ผู้ดูแลระบบแก้ไขข้อมูลและสิทธิ์ของ ${updatedAccount.name} (${updatedAccount.username}) บทบาท: ${updatedAccount.roleTitle}, สถานะ: ${updatedAccount.status}`,
    status: 'SUCCESS',
  });

  return { success: true, account: updatedAccount };
};

// Reset staff password by Admin
export const resetStaffPassword = (
  id: string,
  newPass: string,
  adminActor: { name: string; role: UserRole }
): { success: boolean; error?: string } => {
  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  const accounts = getStaffAccounts();
  const acc = accounts.find((a) => a.id === id);
  if (!acc) {
    return { success: false, error: 'ไม่พบบัญชีเจ้าหน้าที่' };
  }

  acc.password = newPass;
  saveStaffAccounts(accounts);

  recordAuditLog({
    actorName: adminActor.name,
    actorRole: adminActor.role,
    action: 'RESET_STAFF_PASSWORD',
    category: 'AUTH',
    targetResource: `STAFF_USER:${acc.username}`,
    details: `ผู้ดูแลระบบรีเซ็ตรหัสผ่านให้แก่เจ้าหน้าที่: ${acc.name} (${acc.username})`,
    status: 'SUCCESS',
  });

  return { success: true };
};

// Toggle active/suspended status by Admin
export const toggleStaffStatus = (
  id: string,
  newStatus: StaffAccountStatus,
  adminActor: { name: string; role: UserRole }
): { success: boolean; error?: string } => {
  const accounts = getStaffAccounts();
  const acc = accounts.find((a) => a.id === id);
  if (!acc) return { success: false, error: 'ไม่พบบัญชี' };

  if ((acc.username === 'infosser' || acc.username === 'admin') && newStatus === 'SUSPENDED') {
    return { success: false, error: 'ไม่สามารถระงับบัญชีผู้ดูแลระบบหลัก (Master Admin) ได้' };
  }

  acc.status = newStatus;
  saveStaffAccounts(accounts);

  recordAuditLog({
    actorName: adminActor.name,
    actorRole: adminActor.role,
    action: newStatus === 'ACTIVE' ? 'ACTIVATE_STAFF' : 'SUSPEND_STAFF',
    category: 'AUTH',
    targetResource: `STAFF_USER:${acc.username}`,
    details: `ผู้ดูแลระบบเปลี่ยนสถานะบัญชี ${acc.username} เป็น: ${newStatus}`,
    status: 'SUCCESS',
  });

  return { success: true };
};

// Delete staff account (Admin only)
export const deleteStaffAccount = (
  id: string,
  adminActor: { name: string; role: UserRole }
): { success: boolean; error?: string } => {
  const accounts = getStaffAccounts();
  const acc = accounts.find((a) => a.id === id);
  if (!acc) return { success: false, error: 'ไม่พบบัญชี' };

  if (acc.username === 'infosser' || acc.username === 'admin') {
    return { success: false, error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Master Admin) ได้' };
  }

  const filtered = accounts.filter((a) => a.id !== id);
  saveStaffAccounts(filtered);
  deleteStaffAccountOnline(id).catch((err) => {
    console.warn('Delete staff online notice:', err);
  });

  recordAuditLog({
    actorName: adminActor.name,
    actorRole: adminActor.role,
    action: 'DELETE_STAFF_ACCOUNT',
    category: 'AUTH',
    targetResource: `STAFF_USER:${acc.username}`,
    details: `ผู้ดูแลระบบลบบัญชีเจ้าหน้าที่: ${acc.name} (${acc.username}) ออกจากระบบ`,
    status: 'WARNING',
  });

  return { success: true };
};

// Authenticate Staff via ID (Username) and Password
export const authenticateStaff = (
  usernameInput: string,
  passwordInput: string
): { success: boolean; session?: UserSession; error?: string } => {
  const trimmedUser = usernameInput.trim();
  const accounts = getStaffAccounts();

  const account = accounts.find(
    (a) => a.username.toLowerCase() === trimmedUser.toLowerCase()
  );

  if (!account) {
    recordAuditLog({
      actorName: trimmedUser || 'นิรนาม',
      actorRole: 'OFFICER',
      action: 'LOGIN_FAILED_NOT_FOUND',
      category: 'AUTH',
      targetResource: `AUTH:${trimmedUser}`,
      details: `พยายามเข้าสู่ระบบด้วยรหัสประจำตัวที่ไม่มีในระบบ: "${trimmedUser}"`,
      status: 'BLOCKED',
    });
    return { success: false, error: 'ไม่พบรหัสประจำตัวเจ้าหน้าที่นี้ในระบบ' };
  }

  // Check account active status
  if (account.status === 'PENDING') {
    return {
      success: false,
      error: 'บัญชีของท่านอยู่ระหว่างรอการอนุมัติและกำหนดสิทธิ์จากเจ้าพนักงานสาธารณสุขหรือผู้บริหาร',
    };
  }

  if (account.status === 'REJECTED') {
    return {
      success: false,
      error: `คำขอลงทะเบียนของท่านไม่ได้รับการอนุมัติ: ${account.rejectionReason || 'ไม่ผ่านเกณฑ์การตรวจสอบ'}`,
    };
  }

  if (account.status === 'SUSPENDED') {
    recordAuditLog({
      actorName: account.name,
      actorRole: account.role,
      action: 'LOGIN_BLOCKED_SUSPENDED',
      category: 'AUTH',
      targetResource: `STAFF_USER:${account.username}`,
      details: `พยายามเข้าสู่ระบบแต่ถูกระงับ: บัญชี ${account.username} ถูกระงับการใช้งานโดยผู้ดูแลระบบ`,
      status: 'BLOCKED',
    });
    return {
      success: false,
      error: 'บัญชีนี้ถูกระงับการใช้งานโดยผู้ดูแลระบบ (Suspended) กรุณาติดต่อฝ่ายไอที/แอดมิน',
    };
  }

  if (account.status === 'INACTIVE') {
    return {
      success: false,
      error: 'บัญชีนี้ยังไม่เปิดใช้งาน (Inactive) กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์',
    };
  }

  // Check password
  if (account.password !== passwordInput) {
    recordAuditLog({
      actorName: account.name,
      actorRole: account.role,
      action: 'LOGIN_FAILED_WRONG_PASSWORD',
      category: 'AUTH',
      targetResource: `STAFF_USER:${account.username}`,
      details: `รหัสผ่านไม่ถูกต้องสำหรับบัญชี ${account.username}`,
      status: 'BLOCKED',
    });
    return { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง' };
  }

  // Login Success!
  account.lastLoginAt = new Date().toISOString();
  saveStaffAccounts(accounts);

  const session: UserSession = {
    id: account.id,
    username: account.username,
    name: account.name,
    role: account.role,
    roleTitle: account.roleTitle,
    department: account.department,
    email: account.email,
    authMethod: 'PASSWORD_LOGIN',
    is2FAVerified: true,
    allowedPermissions: account.allowedPermissions,
  };

  recordAuditLog({
    actorName: session.name,
    actorRole: session.role,
    action: 'LOGIN_SUCCESS',
    category: 'AUTH',
    targetResource: `STAFF_SESSION:${session.username}`,
    details: `เข้าสู่ระบบสำเร็จด้วย ID: ${session.username} (${session.roleTitle})`,
    status: 'SUCCESS',
  });

  return { success: true, session };
};

// Default permissions fallback per role
export const getDefaultPermissionsForRole = (role: UserRole): string[] => {
  switch (role) {
    case 'DATA_ENTRY':
      return [
        'VIEW_LICENSES',
        'CREATE_LICENSE',
        'EDIT_LICENSE',
        'UPLOAD_DOCUMENTS',
      ];
    case 'DIRECTOR':
      return [
        'VIEW_LICENSES',
        'SIGN_DIGITAL_LICENSE',
        'APPROVE_LICENSE',
        'VIEW_FULL_PDPA',
        'VIEW_FINANCIAL_REPORTS',
        'VIEW_AUDIT_LOGS',
        'MANAGE_STAFF',
        'CREATE_LICENSE',
        'EDIT_LICENSE',
        'RENEW_LICENSE',
        'UPLOAD_DOCUMENTS',
      ];
    case 'AUDITOR_ADMIN':
      return [
        'MANAGE_STAFF',
        'VIEW_LICENSES',
        'VIEW_AUDIT_LOGS',
        'VIEW_WAF_SECURITY',
        'VIEW_FULL_PDPA',
        'CREATE_LICENSE',
        'EDIT_LICENSE',
      ];
    case 'FINANCE':
      return [
        'VIEW_LICENSES',
        'VIEW_PAYMENTS',
        'CONFIRM_PAYMENT',
        'VIEW_FINANCIAL_REPORTS',
      ];
    case 'OFFICER':
      return [
        'VIEW_LICENSES',
        'CREATE_LICENSE',
        'EDIT_LICENSE',
        'RENEW_LICENSE',
        'UPLOAD_DOCUMENTS',
        'MANAGE_STAFF',
      ];
    case 'CITIZEN':
      return ['VIEW_LICENSES'];
    default:
      return ['VIEW_LICENSES'];
  }
};

// Staff self-registration function (ลงทะเบียนสำหรับเจ้าหน้าที่บันทึกข้อมูล/เจ้าหน้าที่ใหม่)
export const registerStaffAccount = (data: {
  username: string;
  password: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  requestedRole: UserRole;
  requestedReason?: string;
}): { success: boolean; account?: StaffAccount; error?: string } => {
  const accounts = getStaffAccounts();
  const usernameTrimmed = data.username.trim();

  if (!usernameTrimmed) {
    return { success: false, error: 'กรุณากรอกรหัสประจำตัวผู้ใช้งาน (Username)' };
  }
  if (usernameTrimmed.length < 3) {
    return { success: false, error: 'รหัสผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร' };
  }

  // Check unique username
  const exists = accounts.some(
    (acc) => acc.username.toLowerCase() === usernameTrimmed.toLowerCase()
  );
  if (exists) {
    return { success: false, error: `รหัสผู้ใช้งาน "${usernameTrimmed}" มีอยู่ในระบบแล้ว กรุณาเลือกรหัสอื่น` };
  }

  if (!data.password || data.password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  if (!data.name || data.name.trim().length === 0) {
    return { success: false, error: 'กรุณากรอกชื่อ-นามสกุล' };
  }

  const role = data.requestedRole || 'DATA_ENTRY';
  const roleProfile = ROLE_PROFILES[role] || ROLE_PROFILES.DATA_ENTRY;

  const newAccount: StaffAccount = {
    id: `staff-reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    username: usernameTrimmed,
    password: data.password,
    name: data.name.trim(),
    position: data.position?.trim() || 'เจ้าหน้าที่บันทึกข้อมูล',
    department: data.department?.trim() || 'ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม',
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    role: role,
    roleTitle: roleProfile.roleTitle,
    status: 'PENDING',
    allowedPermissions: getDefaultPermissionsForRole(role),
    createdAt: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    requestedRole: role,
    requestedReason: data.requestedReason?.trim() || 'ขอเข้าใช้งานเพื่อบันทึกข้อมูลคำขอรับใบอนุญาต',
    notes: `คำขอลงทะเบียนโดยเจ้าหน้าที่ตนเอง เมื่อ ${new Date().toLocaleDateString('th-TH')}`,
  };

  const updated = [newAccount, ...accounts];
  saveStaffAccounts(updated);

  // Guarantee immediate push to Cloud Firestore
  saveStaffAccountOnline(newAccount).catch((err) => {
    console.warn('Direct push registered staff to Firestore notice:', err);
  });

  recordAuditLog({
    actorName: newAccount.name,
    actorRole: 'DATA_ENTRY',
    action: 'STAFF_REGISTRATION_SUBMITTED',
    category: 'AUTH',
    targetResource: `STAFF_USER:${newAccount.username}`,
    details: `เจ้าหน้าที่ยื่นคำขอลงทะเบียนใหม่: ${newAccount.name} (${newAccount.username}) ตำแหน่ง: ${newAccount.position} บทบาทที่ขอ: ${newAccount.roleTitle}`,
    status: 'SUCCESS',
  });

  return { success: true, account: newAccount };
};

// Approver (ระดับเจ้าพนักงานสาธารณสุขเป็นต้นไป) approves staff registration and assigns role + fine-grained permissions
export const approveStaffRegistration = (
  id: string,
  approver: { name: string; role: UserRole },
  assignedRole: UserRole,
  customPermissions?: string[],
  notes?: string
): { success: boolean; account?: StaffAccount; error?: string } => {
  if (!canApproveStaff(approver.role)) {
    return {
      success: false,
      error: 'ท่านไม่มีสิทธิ์อนุมัติเจ้าหน้าที่ (เฉพาะผู้ใช้งานระดับเจ้าพนักงานสาธารณสุขขึ้นไป)',
    };
  }

  const accounts = getStaffAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return { success: false, error: 'ไม่พบรายการคำขอลงทะเบียนที่ต้องการอนุมัติ' };
  }

  const target = accounts[index];
  const roleProfile = ROLE_PROFILES[assignedRole] || ROLE_PROFILES[target.role];
  const finalPermissions =
    customPermissions && customPermissions.length > 0
      ? customPermissions
      : getDefaultPermissionsForRole(assignedRole);

  const updated: StaffAccount = {
    ...target,
    role: assignedRole,
    roleTitle: roleProfile.roleTitle,
    allowedPermissions: finalPermissions,
    status: 'ACTIVE',
    approvedBy: `${approver.name} (${approver.role})`,
    approvedAt: new Date().toISOString(),
    notes: notes || `อนุมัติและกำหนดสิทธิ์โดย ${approver.name} เมื่อ ${new Date().toLocaleDateString('th-TH')}`,
  };

  accounts[index] = updated;
  saveStaffAccounts(accounts);

  recordAuditLog({
    actorName: approver.name,
    actorRole: approver.role,
    action: 'STAFF_REGISTRATION_APPROVED',
    category: 'AUTH',
    targetResource: `STAFF_USER:${updated.username}`,
    details: `ผู้อนุมัติ (${approver.name}) อนุมัติคำขอลงทะเบียนของ ${updated.name} (${updated.username}) กำหนดระดับสิทธิ์เป็น: ${updated.roleTitle} (สิทธิ์: ${finalPermissions.join(', ')})`,
    status: 'SUCCESS',
  });

  return { success: true, account: updated };
};

// Approver rejects staff registration
export const rejectStaffRegistration = (
  id: string,
  approver: { name: string; role: UserRole },
  reason: string
): { success: boolean; account?: StaffAccount; error?: string } => {
  if (!canApproveStaff(approver.role)) {
    return {
      success: false,
      error: 'ท่านไม่มีสิทธิ์ดำเนินการ (เฉพาะผู้ใช้งานระดับเจ้าพนักงานสาธารณสุขขึ้นไป)',
    };
  }

  const accounts = getStaffAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return { success: false, error: 'ไม่พบรายการคำขอลงทะเบียน' };
  }

  const target = accounts[index];
  const updated: StaffAccount = {
    ...target,
    status: 'REJECTED',
    approvedBy: approver.name,
    approvedAt: new Date().toISOString(),
    rejectionReason: reason || 'ไม่ผ่านเกณฑ์การตรวจสอบคุณสมบัติ',
    notes: `ปฏิเสธคำขอโดย ${approver.name}: ${reason || 'ไม่ระบุเหตุผล'}`,
  };

  accounts[index] = updated;
  saveStaffAccounts(accounts);

  recordAuditLog({
    actorName: approver.name,
    actorRole: approver.role,
    action: 'STAFF_REGISTRATION_REJECTED',
    category: 'AUTH',
    targetResource: `STAFF_USER:${updated.username}`,
    details: `ผู้อนุมัติ (${approver.name}) ปฏิเสธคำขอลงทะเบียนของ ${updated.name} (${updated.username}) เหตุผล: ${updated.rejectionReason}`,
    status: 'WARNING',
  });

  return { success: true, account: updated };
};

export const getPendingStaffAccounts = (): StaffAccount[] => {
  const accounts = getStaffAccounts();
  return accounts.filter((a) => a.status === 'PENDING');
};

export const getPendingStaffCount = (): number => {
  return getPendingStaffAccounts().length;
};
