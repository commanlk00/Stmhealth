import * as XLSX from 'xlsx';
import { LicenseRecord } from '../types';
import { formatThaiDate, getDaysRemaining } from './licenseUtils';

export function exportLicensesToExcel(licenses: LicenseRecord[], monthName?: string): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: รายการใบอนุญาตทั้งหมด
  const tableData = licenses.map((lic, index) => {
    const daysLeft = getDaysRemaining(lic.expiryDate);
    const statusThai =
      lic.status === 'active'
        ? 'ปกติ'
        : lic.status === 'expiring_soon'
        ? `ใกล้หมดอายุ (เหลือ ${daysLeft} วัน)`
        : lic.status === 'expired'
        ? `หมดอายุแล้ว (${Math.abs(daysLeft)} วัน)`
        : 'กำลังต่ออายุ';

    return {
      'ลำดับ': index + 1,
      'หมายเลขใบอนุญาต': lic.licenseNo,
      'ประเภทกิจการ': lic.categoryLabel,
      'ชื่อสถานประกอบการ': lic.businessName,
      'ผู้ถือใบอนุญาต': lic.ownerFullName,
      'เลขประจำตัวประชาชน': lic.ownerNationalId,
      'ที่อยู่ตามบัตรประชาชน': lic.idCardAddress,
      'ที่อยู่สถานประกอบการ': lic.businessAddress,
      'เบอร์โทรศัพท์': lic.contactPhone || '-',
      'วันที่ออก': formatThaiDate(lic.issueDate),
      'วันหมดอายุ': formatThaiDate(lic.expiryDate),
      'วันคงเหลือ (วัน)': daysLeft,
      'สถานะ': statusThai,
      'ค่าธรรมเนียม (บาท)': lic.feeAmount,
      'สถานะชำระเงิน': lic.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอชำระ',
      'ต่ออายุล่าสุด': lic.renewalHistory?.length ? lic.renewalHistory[lic.renewalHistory.length - 1].renewalDate : '-',
    };
  });

  const wsLicenses = XLSX.utils.json_to_sheet(tableData);

  // Set column widths
  wsLicenses['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 18 }, // หมายเลขใบอนุญาต
    { wch: 35 }, // ประเภทกิจการ
    { wch: 28 }, // ชื่อสถานประกอบการ
    { wch: 25 }, // ผู้ถือใบอนุญาต
    { wch: 16 }, // เลขบัตร ปชช
    { wch: 40 }, // ที่อยู่บัตร
    { wch: 40 }, // ที่อยู่ร้าน
    { wch: 14 }, // เบอร์โทร
    { wch: 16 }, // วันที่ออก
    { wch: 16 }, // วันหมดอายุ
    { wch: 15 }, // วันคงเหลือ
    { wch: 22 }, // สถานะ
    { wch: 18 }, // ค่าธรรมเนียม
    { wch: 14 }, // ชำระเงิน
    { wch: 16 }, // ต่ออายุล่าสุด
  ];

  XLSX.utils.book_append_sheet(wb, wsLicenses, 'รายการใบอนุญาต');

  // Sheet 2: สรุปสถิติประจำเดือน
  const total = licenses.length;
  const expiringSoon = licenses.filter(l => l.status === 'expiring_soon').length;
  const expired = licenses.filter(l => l.status === 'expired').length;
  const active = licenses.filter(l => l.status === 'active').length;
  const totalRevenue = licenses.reduce((sum, l) => sum + (l.paymentStatus === 'paid' ? l.feeAmount : 0), 0);
  const pendingRevenue = licenses.reduce((sum, l) => sum + (l.paymentStatus !== 'paid' ? l.feeAmount : 0), 0);

  const summaryData = [
    { 'หัวข้อสรุป': 'ระบบตรวจเช็คใบอนุญาตประกอบกิจการออนไลน์', 'รายละเอียด': 'รายงานสรุปผลภาพรวม' },
    { 'หัวข้อสรุป': 'วันที่ออกรายงาน', 'รายละเอียด': new Date().toLocaleDateString('th-TH') },
    { 'หัวข้อสรุป': 'จำนวนใบอนุญาตทั้งหมด', 'รายละเอียด': `${total} รายการ` },
    { 'หัวข้อสรุป': 'สถานะปกติ (Active)', 'รายละเอียด': `${active} รายการ` },
    { 'หัวข้อสรุป': 'ใกล้หมดอายุภายใน 30 วัน (แจ้งเตือนด่วน)', 'รายละเอียด': `${expiringSoon} รายการ` },
    { 'หัวข้อสรุป': 'หมดอายุแล้ว (เกินกำหนด)', 'รายละเอียด': `${expired} รายการ` },
    { 'หัวข้อสรุป': 'ยอดค่าธรรมเนียมจัดเก็บได้ (บาท)', 'รายละเอียด': totalRevenue.toLocaleString('th-TH') },
    { 'หัวข้อสรุป': 'ยอดค่าธรรมเนียมค้างชำระ (บาท)', 'รายละเอียด': pendingRevenue.toLocaleString('th-TH') },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปสถิติภาพรวม');

  const fileName = `รายงานใบอนุญาตประกอบกิจการ_${monthName || 'รายเดือน'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
