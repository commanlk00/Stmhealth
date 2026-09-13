import { LicenseRecord, LicenseStatus } from '../types';

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function formatThaiDate(dateStr: string, isShort = false): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = isShort ? THAI_MONTHS_SHORT[d.getMonth()] : THAI_MONTHS[d.getMonth()];
  const thaiYear = d.getFullYear() + 543;
  return `${day} ${month} ${thaiYear}`;
}

export function getDaysRemaining(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  // Use current app local reference time or new Date()
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr + 'T00:00:00');
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function evaluateLicenseStatus(expiryDateStr: string, currentStatus?: LicenseStatus): {
  status: LicenseStatus;
  daysRemaining: number;
  badgeText: string;
  badgeClass: string;
} {
  const daysRemaining = getDaysRemaining(expiryDateStr);

  if (currentStatus === 'renewing') {
    return {
      status: 'renewing',
      daysRemaining,
      badgeText: 'กำลังต่ออายุ',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      badgeText: `หมดอายุแล้ว (${Math.abs(daysRemaining)} วัน)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  } else if (daysRemaining <= 30) {
    return {
      status: 'expiring_soon',
      daysRemaining,
      badgeText: `ใกล้หมดอายุ (เหลือ ${daysRemaining} วัน)`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-medium animate-pulse',
    };
  } else {
    return {
      status: 'active',
      daysRemaining,
      badgeText: `ปกติ (เหลือ ${daysRemaining} วัน)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }
}

export function maskNationalId(id: string, isUnlocked: boolean): string {
  if (!id) return '-';
  const clean = id.replace(/[^0-9]/g, '');
  if (clean.length !== 13) return id;

  if (isUnlocked) {
    // Format: X-XXXX-XXXXX-XX-X
    return `${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean[12]}`;
  }

  // Masked: 1-1004-XXXXX-XX-5
  return `${clean[0]}-${clean.slice(1, 5)}-XXXXX-XX-${clean[12]}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}
