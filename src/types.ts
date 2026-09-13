export type BusinessCategory =
  | 'HAZARDOUS_HEALTH' // 7.1 กิจการที่เป็นอันตรายต่อสุขภาพ
  | 'FOOD_ESTABLISHMENT' // 7.2 สถานที่จำหน่ายอาหารหรือสะสมอาหาร
  | 'MARKET' // 7.3 กิจการตลาด
  | 'WASTE_MANAGEMENT'; // 7.4 กิจการรับทำการเก็บ ขน หรือกำจัดสิ่งปฏิกูล/มูลฝอย

export type FoodEstablishmentSubtype = 'OVER_200_SQM' | 'UNDER_200_SQM';

export type LicenseStatus = 'active' | 'expiring_soon' | 'expired' | 'renewing' | 'pending_approval';

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

export interface LicenseRecord {
  id: string;
  licenseNo: string; // หมายเลขใบอนุญาต
  category: BusinessCategory;
  categoryLabel: string;
  foodSubtype?: FoodEstablishmentSubtype; // สำหรับ 7.2.1 (>200 ตร.ม.) หรือ (<=200 ตร.ม.)
  businessName: string; // ชื่อสถานประกอบการ
  areaSquareMeters?: number; // ขนาดพื้นที่สถานประกอบการ (ตร.ม.)
  
  // 1. ข้อมูลส่วนบุคคลและที่อยู่
  ownerFullName: string; // ชื่อ - นามสกุล
  ownerNationalId: string; // หมายเลขประจำตัวประชาชน 13 หลัก
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
