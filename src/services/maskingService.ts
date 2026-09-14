import { UserRole } from '../types';

export const maskNationalId = (id: string, role?: UserRole, isUnlocked?: boolean): string => {
  if (isUnlocked || role === 'DIRECTOR') {
    // Show full formatted 13-digit ID: X-XXXX-XXXXX-XX-X
    const clean = id.replace(/\D/g, '');
    if (clean.length === 13) {
      return `${clean[0]}-${clean.substring(1, 5)}-${clean.substring(5, 10)}-${clean.substring(10, 12)}-${clean[12]}`;
    }
    return id;
  }

  // Mask middle digits: 1-1004-XXXXX-XX-1
  const clean = id.replace(/\D/g, '');
  if (clean.length === 13) {
    return `${clean[0]}-${clean.substring(1, 5)}-XXXXX-XX-${clean[12]}`;
  }
  return 'X-XXXX-XXXXX-XX-X';
};

export const maskPhoneNumber = (phone: string, isUnlocked?: boolean): string => {
  if (isUnlocked) return phone;
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.substring(0, 3)}-XXX-${clean.substring(6)}`;
  }
  return phone;
};

export const maskAddress = (address: string, isUnlocked?: boolean): string => {
  if (isUnlocked) return address;
  // Keep province and district, mask house number
  const parts = address.split(' ');
  if (parts.length > 2) {
    return `เลขที่ [ซ่อนตามเกณฑ์ PDPA] ${parts.slice(2).join(' ')}`;
  }
  return address;
};

// Simulate AES-256 Encryption at Rest representation
export const getEncryptedCipherRepresentation = (plainText: string): string => {
  const b64 = btoa(unescape(encodeURIComponent(plainText)));
  return `ENC[AES-256-GCM]:${b64.substring(0, 16)}...${b64.slice(-4)}`;
};
