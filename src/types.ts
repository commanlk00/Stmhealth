export type BusinessCategory =
  | 'HAZARDOUS_HEALTH' // 7.1 กิจการที่เป็นอันตรายต่อสุขภาพ
  | 'FOOD_ESTABLISHMENT' // 7.2 สถานที่จำหน่ายอาหารหรือสะสมอาหาร
  | 'MARKET' // 7.3 กิจการตลาด
  | 'WASTE_MANAGEMENT'; // 7.4 กิจการรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูล/มูลฝอย

export interface HazardousBusinessTypeItem {
  code: string; // e.g. "6(1)"
  name: string; // ชื่อเต็มตามประกาศกระทรวง
  shortName: string; // ชื่อเรียกสั้น
  typicalFee: number; // อัตราค่าธรรมเนียมมาตรฐาน (บาท)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  keySanitationRequirements: string[]; // สุขาภิบาลและการควบคุมมลพิษ
  popular?: boolean;
}

export interface HazardousBusinessGroup {
  id: string; // "group-1" ... "group-13"
  groupNo: number; // 1 - 13
  name: string; // e.g. "หมวด 6 กิจการที่เกี่ยวกับโลหะหรือแร่"
  shortName: string;
  description: string;
  types: HazardousBusinessTypeItem[];
}

export type FoodEstablishmentSubtype = 'OVER_200_SQM' | 'UNDER_200_SQM';

export type LicenseStatus = 'active' | 'expiring_soon' | 'expired' | 'renewing' | 'pending_approval';

// User Roles for Role-Based Access Control (RBAC)
export type UserRole =
  | 'OFFICER' // เจ้าพนักงานสาธารณสุขปฏิบัติการ (ตรวจสถานที่/ตรวจเอกสาร)
  | 'FINANCE' // เจ้าพนักงานการเงินและบัญชี (ตรวจสลิป/รับชำระเงิน/ออกใบเสร็จ)
  | 'DIRECTOR' // ผู้อำนวยการกอง/นายกเทศมนตรี (ผู้อนุมัติ/ลงนามดิจิทัล E-Signature)
  | 'AUDITOR_ADMIN' // ผู้ดูแลระบบและตรวจสอบความปลอดภัย (WAF/Audit Logs 90 วัน/จัดการสิทธิ์เจ้าหน้าที่)
  | 'CITIZEN'; // ผู้ประกอบการ / ประชาชน

export type StaffAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface StaffAccount {
  id: string;
  username: string; // รหัสประจำตัวเจ้าหน้าที่ (Login ID)
  password: string; // รหัสผ่าน (Password)
  name: string; // ชื่อ-นามสกุล
  position?: string; // ตำแหน่ง
  role: UserRole;
  roleTitle: string;
  department: string;
  email: string;
  phone?: string;
  status: StaffAccountStatus;
  allowedPermissions: string[];
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface UserSession {
  id: string;
  username?: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  email: string;
  authMethod: 'PASSWORD_LOGIN' | '2FA_CREDENTIAL' | 'GOOGLE' | 'OTP';
  is2FAVerified: boolean;
  nationalId?: string;
  avatarUrl?: string;
  allowedPermissions?: string[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  categoryRequirementId: string;
  docTitle: string;
  fileType: 'pdf' | 'image';
  fileUrl: string;
  fileSize: string;
  uploadDate: string;
  isVerified: boolean;
  signedUrlExpiresAt?: string; // Object Storage Access Control
}

export interface RenewalRecord {
  renewalDate: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  feeAmount: number;
  paidVia: 'PromptPay' | 'Counter' | 'GoogleSheetSync';
  transactionRef: string;
  syncedToGoogleSheet: boolean;
  officerName: string;
  notes?: string;
}

export interface ELicenseDigitalSignature {
  signatoryName: string;
  signatoryPosition: string;
  signedAt: string;
  signatureAlgorithm: 'SHA256withRSA';
  signatureDigest: string;
  tsaTimestamp: string;
  certificateAuthority: string;
  verificationQrUrl: string;
  isValid: boolean;
}

export type DigitalSignature = ELicenseDigitalSignature;

export interface LicenseRecord {
  id: string;
  licenseNo: string; // หมายเลขใบอนุญาต
  category: BusinessCategory;
  categoryLabel: string;
  foodSubtype?: FoodEstablishmentSubtype; // สำหรับ 7.2.1 (>200 ตร.ม.) หรือ (<=200 ตร.ม.)
  businessName: string; // ชื่อสถานประกอบการ
  areaSquareMeters?: number; // ขนาดพื้นที่สถานประกอบการ (ตร.ม.)
  
  // 7.1 กิจการที่เป็นอันตรายต่อสุขภาพ (Hazardous Business Categories & Types)
  hazardousGroup?: string; // e.g. "หมวด 6 กิจการที่เกี่ยวกับโลหะหรือแร่"
  hazardousGroupCode?: string; // e.g. "group-6"
  hazardousType?: string; // e.g. "การเคาะ ปะผุ พ่นสี หรือซ่อมแซมตัวถังยานยนต์ (อู่เคาะพ่นสี)"
  hazardousTypeCode?: string; // e.g. "6(1)"
  hazardousRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  // 1. ข้อมูลส่วนบุคคลและที่อยู่
  ownerFullName: string; // ชื่อ - นามสกุล
  ownerNationalId: string; // หมายเลขประจำตัวประชาชน 13 หลัก (Encrypted at Rest)
  idCardAddress: string; // ที่อยู่ตามบัตรประชาชน
  businessAddress: string; // ที่อยู่สถานประกอบการ
  contactPhone: string;
  contactEmail: string;
  lineId?: string;

  // วันที่และค่าธรรมเนียม
  issueDate: string; // วันที่ออก (YYYY-MM-DD)
  expiryDate: string; // วันหมดอายุ (YYYY-MM-DD)
  feeAmount: number; // ค่าธรรมเนียมตามกฎหมาย (บาท)

  // สถานะและเอกสารดิจิทัล
  status: LicenseStatus;
  documents: UploadedDocument[];
  
  // การชำระเงินดิจิทัล PromptPay
  paymentStatus: 'paid' | 'pending' | 'verifying';
  promptpayRef?: string;
  paidAt?: string;

  // การแจ้งเตือนและการซิงค์
  notification30DaysSent: boolean;
  lastNotifiedDate?: string;
  syncedToSheet: boolean;
  lastSheetSyncTime?: string;

  // ประวัติการต่ออายุ
  renewalHistory: RenewalRecord[];
  notes?: string;

  // Digital E-License and Signatures
  eLicenseSignature?: ELicenseDigitalSignature;
  approvalStatus?: 'approved' | 'pending_director_signature' | 'under_review';
  approvedBy?: string;
  approvedAt?: string;
}

export interface CategoryRequirement {
  id: string;
  title: string;
  description: string;
  requiredFor: BusinessCategory;
  foodSubtypeRule?: 'OVER_200_SQM' | 'UNDER_200_SQM' | 'BOTH';
  documentChecklist: {
    docId: string;
    name: string;
    description: string;
    acceptedFormats: string;
    isRequired: boolean;
  }[];
  standardAnnualFee: number;
  issuanceTypeTitle: string; // e.g. "ใบอนุญาต" หรือ "หนังสือรับรองการแจ้ง"
  legalBasis: string;
}

// Centralized Audit Log (พ.ร.บ. การกระทำความผิดเกี่ยวกับคอมพิวเตอร์ฯ)
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  actorIp: string;
  action: string;
  category: 'AUTH' | 'ACCESS' | 'PAYMENT' | 'LICENSE_ISSUE' | 'RENEWAL' | 'SECURITY' | 'PDPA_UNMASK';
  targetResource: string;
  details: string;
  sha256Hash: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING';
}

// WAF & Security Status
export interface WAFSecurityStats {
  wafStatus: 'ACTIVE_SHIELD' | 'UNDER_ATTACK' | 'MONITORING';
  totalInspectedRequests: number;
  blockedAttacks: number;
  sqlInjectionBlocks: number;
  xssOwaspBlocks: number;
  ddosMitigatedCount: number;
  rateLimitThrottled: number;
  tlsVersion: string;
  lastThreatDetected?: {
    type: string;
    sourceIp: string;
    timestamp: string;
    actionTaken: string;
  };
}

