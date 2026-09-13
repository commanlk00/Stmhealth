import { LicenseRecord } from '../types';

export const INITIAL_LICENSES: LicenseRecord[] = [
  {
    id: 'lic-001',
    licenseNo: 'สธ-กอ-2568/0042',
    category: 'HAZARDOUS_HEALTH',
    categoryLabel: '7.1 กิจการที่เป็นอันตรายต่อสุขภาพ (อู่เคาะพ่นสีรถยนต์)',
    businessName: 'เจริญยนต์ ออโต้เพ้นท์ เซอร์วิส',
    ownerFullName: 'นายสมศักดิ์ วัฒนากิจโกศล',
    ownerNationalId: '1100400892145',
    idCardAddress: '142/5 หมู่ 3 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    businessAddress: '88/12 ถนนรัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    contactPhone: '081-456-7890',
    contactEmail: 'somsak.charoenyont@gmail.com',
    lineId: '@charoenyont',
    issueDate: '2025-10-02',
    expiryDate: '2026-10-02', // ~19 days left (within 30 days warning!)
    feeAmount: 2500,
    status: 'expiring_soon',
    paymentStatus: 'paid',
    promptpayRef: 'PP-2025-1002-42',
    paidAt: '2025-10-02 10:15',
    notification30DaysSent: true,
    lastNotifiedDate: '2026-09-02 09:00',
    syncedToSheet: true,
    documents: [
      {
        id: 'doc-001-1',
        name: 'สำเนาบัตรประชาชน_สมศักดิ์.pdf',
        categoryRequirementId: 'doc_id_copy',
        docTitle: 'สำเนาบัตรประจำตัวประชาชนและทะเบียนบ้าน',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80',
        fileSize: '1.4 MB',
        uploadDate: '2025-09-28',
        isVerified: true,
      },
      {
        id: 'doc-001-2',
        name: 'ผังระบบระบายละอองสี_และบำบัดกลิ่น.pdf',
        categoryRequirementId: 'doc_env_safety_plan',
        docTitle: 'มาตรการป้องกันผลกระทบสิ่งแวดล้อมและห้องพ่นสี',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
        fileSize: '3.8 MB',
        uploadDate: '2025-09-30',
        isVerified: true,
      },
    ],
    renewalHistory: [
      {
        renewalDate: '2025-10-02',
        previousExpiryDate: '2025-10-02',
        newExpiryDate: '2026-10-02',
        feeAmount: 2500,
        paidVia: 'PromptPay',
        transactionRef: 'PP-20251002-0042',
        syncedToGoogleSheet: true,
        officerName: 'นางสาวจินตนา พรหมประสิทธิ์ (นักวิชาการสุขาภิบาลชำนาญการ)',
        notes: 'ต่ออายุประจำปี 2568 ตรวจสอบห้องอบพ่นสีผ่านมาตรฐาน',
      },
    ],
    notes: 'สถานประกอบการติดตั้งระบบกรองคาร์บอนและม่านน้ำดักละอองสีครบถ้วน',
  },

  {
    id: 'lic-002',
    licenseNo: 'สธ-อน-2568/0119',
    category: 'FOOD_ESTABLISHMENT',
    categoryLabel: '7.2.1 สถานที่จำหน่ายอาหาร (พื้นที่เกิน 200 ตร.ม.)',
    foodSubtype: 'OVER_200_SQM',
    areaSquareMeters: 380,
    businessName: 'ภัตตาคารริเวอร์ไซด์ คูซีน',
    ownerFullName: 'นางสาวพิมพา สุวรรณเวช',
    ownerNationalId: '3102000542318',
    idCardAddress: '55/9 ซอยแจ้งวัฒนะ 14 แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210',
    businessAddress: '240/1 หมู่ 2 ริมแม่น้ำเจ้าพระยา ต.สวนพริกไทย อ.เมือง จ.ปทุมธานี 12000',
    contactPhone: '089-771-2234',
    contactEmail: 'pimpa.riverside@gmail.com',
    lineId: '@riversidecuisine',
    issueDate: '2025-09-25',
    expiryDate: '2026-09-25', // ~12 days left (URGENT < 30 days warning!)
    feeAmount: 3000,
    status: 'expiring_soon',
    paymentStatus: 'paid',
    promptpayRef: 'PP-2025-0925-119',
    paidAt: '2025-09-25 14:20',
    notification30DaysSent: true,
    lastNotifiedDate: '2026-08-25 10:00',
    syncedToSheet: true,
    documents: [
      {
        id: 'doc-002-1',
        name: 'วุฒิบัตรสุขาภิบาลอาหาร_พิมพา.pdf',
        categoryRequirementId: 'doc_food_sanitation_cert',
        docTitle: 'วุฒิบัตรผ่านการอบรมหลักสูตรสุขาภิบาลอาหาร (กรมอนามัย)',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        fileSize: '2.1 MB',
        uploadDate: '2025-09-20',
        isVerified: true,
      },
      {
        id: 'doc-002-2',
        name: 'แปลนบ่อดักไขมันขนาด_2000L.jpg',
        categoryRequirementId: 'doc_layout_grease_trap',
        docTitle: 'แผนผังจุดปรุงอาหารและระบบบ่อดักไขมันสแตนเลส',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        fileSize: '3.4 MB',
        uploadDate: '2025-09-22',
        isVerified: true,
      },
    ],
    renewalHistory: [
      {
        renewalDate: '2025-09-25',
        previousExpiryDate: '2025-09-25',
        newExpiryDate: '2026-09-25',
        feeAmount: 3000,
        paidVia: 'PromptPay',
        transactionRef: 'PP-20250925-0119',
        syncedToGoogleSheet: true,
        officerName: 'นายธีรภัทร ชาญวิทย์ (เจ้าพนักงานสาธารณสุข)',
      },
    ],
    notes: 'พื้นที่ 380 ตร.ม. เกินเกณฑ์ 200 ตร.ม. ต้องออกเป็น "ใบอนุญาต"',
  },

  {
    id: 'lic-003',
    licenseNo: 'สธ-สอ-2568/0871',
    category: 'FOOD_ESTABLISHMENT',
    categoryLabel: '7.2.2 สถานที่จำหน่ายอาหาร (พื้นที่ไม่เกิน 200 ตร.ม.)',
    foodSubtype: 'UNDER_200_SQM',
    areaSquareMeters: 65,
    businessName: 'ร้านกาแฟ อาร์ทิซาน คาเฟ่ แอนด์ เบเกอรี่',
    ownerFullName: 'นายวีระยุทธ ปัญญาวงศ์',
    ownerNationalId: '1509900321782',
    idCardAddress: '23/4 หมู่ 5 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200',
    businessAddress: '19/1 ถนนนิมมานเหมินท์ ซอย 9 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200',
    contactPhone: '095-882-3490',
    contactEmail: 'weerayuth.artisan@gmail.com',
    issueDate: '2026-03-10',
    expiryDate: '2027-03-10', // Active (Healthy)
    feeAmount: 1000,
    status: 'active',
    paymentStatus: 'paid',
    promptpayRef: 'PP-2026-0310-871',
    paidAt: '2026-03-10 11:30',
    notification30DaysSent: false,
    syncedToSheet: true,
    documents: [
      {
        id: 'doc-003-1',
        name: 'ใบผ่านการอบรมผู้สัมผัสอาหาร.pdf',
        categoryRequirementId: 'doc_food_under_cert',
        docTitle: 'ใบผ่านการอบรมสุขาภิบาลอาหารเบื้องต้น',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
        fileSize: '1.2 MB',
        uploadDate: '2026-03-05',
        isVerified: true,
      },
    ],
    renewalHistory: [],
    notes: 'พื้นที่ 65 ตร.ม. ได้รับ "หนังสือรับรองการแจ้ง" อัตราค่าธรรมเนียม 1,000 บาท/ปี',
  },

  {
    id: 'lic-004',
    licenseNo: 'สธ-ตล-2567/0014',
    category: 'MARKET',
    categoryLabel: '7.3 กิจการตลาด (ตลาดสดประเภทที่ 1 มีโครงสร้างถาวร)',
    businessName: 'ตลาดสดทรัพย์ทวี มาร์เก็ต',
    ownerFullName: 'นางกานดา ชัยเจริญสุขเกษม',
    ownerNationalId: '3700100458921',
    idCardAddress: '99/1 ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000',
    businessAddress: '108 ถนนมิตรภาพ ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000',
    contactPhone: '086-339-1122',
    contactEmail: 'kanda.subthawee@gmail.com',
    lineId: '@subthaweemarket',
    issueDate: '2025-08-15',
    expiryDate: '2026-08-15', // EXPIRED ~29 days ago
    feeAmount: 4000,
    status: 'expired',
    paymentStatus: 'pending',
    notification30DaysSent: true,
    lastNotifiedDate: '2026-07-16 09:30',
    syncedToSheet: true,
    documents: [
      {
        id: 'doc-004-1',
        name: 'ผังสุขาภิบาลตลาด_และบ่อบำบัด.pdf',
        categoryRequirementId: 'doc_market_sanitation_plan',
        docTitle: 'แผนผังระบบสุขาภิบาลตลาดและการจัดการน้ำเสีย',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=600&q=80',
        fileSize: '4.5 MB',
        uploadDate: '2025-08-01',
        isVerified: true,
      },
    ],
    renewalHistory: [],
    notes: 'ใบอนุญาตหมดอายุเกินกำหนด แจ้งเตือนผู้ประกอบการให้รีบดำเนินการต่ออายุทันที',
  },

  {
    id: 'lic-005',
    licenseNo: 'สธ-ขย-2568/0009',
    category: 'WASTE_MANAGEMENT',
    categoryLabel: '7.4 กิจการรับทำการเก็บ ขน สิ่งปฏิกูลและมูลฝอย',
    businessName: 'บริษัท คลีน แอนด์ กรีน เวสต์ แมเนจเมนท์ จำกัด',
    ownerFullName: 'นายธนาธิป เลิศปรีชากุล',
    ownerNationalId: '1103700293811',
    idCardAddress: '12/8 หมู่ 7 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',
    businessAddress: '45/2 โซนอุตสาหกรรม ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',
    contactPhone: '084-219-9000',
    contactEmail: 'thanathip.cleangreen@gmail.com',
    issueDate: '2026-01-20',
    expiryDate: '2027-01-20', // Active (Healthy)
    feeAmount: 5000,
    status: 'active',
    paymentStatus: 'paid',
    promptpayRef: 'PP-2026-0120-009',
    paidAt: '2026-01-20 16:45',
    notification30DaysSent: false,
    syncedToSheet: true,
    documents: [
      {
        id: 'doc-005-1',
        name: 'ใบคู่มือจดทะเบียนรถบรรทุกขยะอัดท้าย_5คัน.pdf',
        categoryRequirementId: 'doc_waste_vehicle_registration',
        docTitle: 'ทะเบียนรถบรรทุกขยะและภาพถ่ายอุปกรณ์เก็บขนมิดชิด',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
        fileSize: '3.1 MB',
        uploadDate: '2026-01-15',
        isVerified: true,
      },
      {
        id: 'doc-005-2',
        name: 'สัญญาจุดทิ้งขยะโรงกำจัดขยะเทศบาล.pdf',
        categoryRequirementId: 'doc_waste_disposal_site_contract',
        docTitle: 'สัญญาอนุญาตนำขยะไปกำจัด ณ เตาเผาขยะมูลฝอยถูกต้องตามสุขาภิบาล',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
        fileSize: '2.8 MB',
        uploadDate: '2026-01-16',
        isVerified: true,
      },
    ],
    renewalHistory: [],
    notes: 'รถบรรทุกเก็บขนขยะจำนวน 5 คัน ติดตั้งระบบ GPS และมีถังรองรับน้ำชะขยะรั่วไหลครบถ้วน',
  },

  {
    id: 'lic-006',
    licenseNo: 'สธ-กอ-2568/0098',
    category: 'HAZARDOUS_HEALTH',
    categoryLabel: '7.1 กิจการที่เป็นอันตรายต่อสุขภาพ (โรงเลื่อยและแปรรูปไม้)',
    businessName: 'โรงเลื่อยไม้ไทยสมบูรณ์การค้า',
    ownerFullName: 'นายอนุชา พงษ์ศิริรักษ์',
    ownerNationalId: '3100600129487',
    idCardAddress: '28 หมู่ 4 ต.บ้านเกาะ อ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา 13000',
    businessAddress: '28/2 หมู่ 4 ถนนสายเอเชีย ต.บ้านเกาะ อ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา 13000',
    contactPhone: '083-991-0023',
    contactEmail: 'anucha.thaisomboon@gmail.com',
    issueDate: '2025-09-18',
    expiryDate: '2026-09-18', // ~5 days left (VERY URGENT <= 30 days)
    feeAmount: 2500,
    status: 'expiring_soon',
    paymentStatus: 'paid',
    promptpayRef: 'PP-2025-0918-098',
    paidAt: '2025-09-18 13:00',
    notification30DaysSent: true,
    lastNotifiedDate: '2026-08-18 10:00',
    syncedToSheet: true,
    documents: [
      {
        id: 'doc-006-1',
        name: 'มาตรการป้องกันอัคคีภัย_และระบบดักฝุ่นขี้เลื่อย.pdf',
        categoryRequirementId: 'doc_env_safety_plan',
        docTitle: 'มาตรการควบคุมฝุ่นละอองและระบบสปริงเกลอร์ดับเพลิง',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        fileSize: '3.6 MB',
        uploadDate: '2025-09-10',
        isVerified: true,
      },
    ],
    renewalHistory: [],
    notes: 'ส่งแจ้งเตือนทาง LINE OA และอีเมลแล้ว อยู่ระหว่างผู้ประกอบการเตรียมชำระค่าธรรมเนียมต่ออายุ',
  },
];

const STORAGE_KEY = 'thai_business_licenses_v1';

export function getStoredLicenses(): LicenseRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LICENSES));
      return INITIAL_LICENSES;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load licenses from storage', err);
    return INITIAL_LICENSES;
  }
}

export function saveStoredLicenses(licenses: LicenseRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses));
  } catch (err) {
    console.error('Failed to save licenses to storage', err);
  }
}
