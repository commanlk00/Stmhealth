import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Calendar,
  PieChart,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  ShieldCheck,
} from 'lucide-react';
import { LicenseRecord } from '../types';
import { exportLicensesToExcel } from '../utils/exportUtils';
import { formatCurrency, formatThaiDate, getDaysRemaining, THAI_MONTHS } from '../utils/licenseUtils';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenses: LicenseRecord[];
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  licenses,
}) => {
  if (!isOpen) return null;

  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September (0-indexed 8)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const totalCount = licenses.length;
  const expiringCount = licenses.filter((l) => {
    const days = getDaysRemaining(l.expiryDate);
    return days >= 0 && days <= 30;
  }).length;
  const expiredCount = licenses.filter((l) => getDaysRemaining(l.expiryDate) < 0).length;
  const activeCount = licenses.filter((l) => getDaysRemaining(l.expiryDate) > 30).length;

  const totalRevenue = licenses.reduce(
    (sum, l) => sum + (l.paymentStatus === 'paid' ? l.feeAmount : 0),
    0
  );

  // Group by category
  const hazardousCount = licenses.filter((l) => l.category === 'HAZARDOUS_HEALTH').length;
  const foodCount = licenses.filter((l) => l.category === 'FOOD_ESTABLISHMENT').length;
  const marketCount = licenses.filter((l) => l.category === 'MARKET').length;
  const wasteCount = licenses.filter((l) => l.category === 'WASTE_MANAGEMENT').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const monthStr = `${THAI_MONTHS[selectedMonth]}_${selectedYear + 543}`;
    exportLicensesToExcel(licenses, monthStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                สรุปรายงานสถานะใบอนุญาตทั้งหมดรายเดือน
              </h2>
              <p className="text-xs text-slate-400">
                สถิติการออกใบอนุญาต การต่ออายุ และยอดจัดเก็บค่าธรรมเนียมตาม พ.ร.บ. สาธารณสุข
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Document Body (Optimized for Screen & Print) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800">
          {/* Official Government Header Style */}
          <div className="text-center border-b border-slate-300 pb-5 space-y-1">
            <div className="inline-block p-2 rounded-full bg-slate-100 text-slate-700 mb-1">
              <ShieldCheck className="w-8 h-8 mx-auto text-blue-700" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              รายงานสรุปสถานะใบอนุญาตประกอบกิจการและการต่ออายุรายเดือน
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              กองสาธารณสุขและสิ่งแวดล้อม องค์กรปกครองส่วนท้องถิ่น
            </p>
            <p className="text-xs text-slate-500">
              ประจำเดือน {THAI_MONTHS[selectedMonth]} พ.ศ. {selectedYear + 543} | ข้อมูล ณ วันที่{' '}
              {new Date().toLocaleDateString('th-TH')}
            </p>
          </div>

          {/* 4 Summary Stats Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">ใบอนุญาตทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
              <div className="text-[11px] text-slate-400">ฉบับ</div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-xs text-emerald-800 font-medium">สถานะปกติ (Active)</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
              <div className="text-[11px] text-emerald-600">
                {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}%
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-xs text-amber-800 font-medium">ใกล้หมดอายุ (≤30 วัน)</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{expiringCount}</div>
              <div className="text-[11px] text-amber-700">แจ้งเตือนผู้ขอแล้ว</div>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <div className="text-xs text-rose-800 font-medium">หมดอายุแล้ว</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">{expiredCount}</div>
              <div className="text-[11px] text-rose-600">ต้องเร่งรัดต่ออายุ</div>
            </div>
          </div>

          {/* Financial & Fee summary */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                ยอดจัดเก็บค่าธรรมเนียมใบอนุญาต (ผ่านระบบดิจิทัล PromptPay)
              </div>
              <div className="text-xs text-slate-500">
                รายได้เข้ากองสาธารณสุขและสิ่งแวดล้อมเพื่อการตรวจสอบสุขอนามัยชุมชน
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                ตรวจสอบความถูกต้องครบ 100%
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              การจำแนกตามประเภทกิจการ 4 กลุ่มหลัก (ตาม พ.ร.บ. การสาธารณสุข พ.ศ. 2535)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    7.1 กิจการที่เป็นอันตรายต่อสุขภาพ
                  </div>
                  <div className="text-[11px] text-slate-500">โรงงาน คาร์แคร์ อู่พ่นสี โรงแรม</div>
                </div>
                <div className="text-right font-bold text-slate-900 text-sm">
                  {hazardousCount} ฉบับ
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    7.2 สถานที่จำหน่าย/สะสมอาหาร
                  </div>
                  <div className="text-[11px] text-slate-500">
                    พื้นที่ &gt;200 ตร.ม. (ใบอนุญาต) / ≤200 ตร.ม. (หนังสือรับรอง)
                  </div>
                </div>
                <div className="text-right font-bold text-slate-900 text-sm">
                  {foodCount} ฉบับ
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">7.3 กิจการตลาด</div>
                  <div className="text-[11px] text-slate-500">ตลาดสดประเภท 1 และ 2</div>
                </div>
                <div className="text-right font-bold text-slate-900 text-sm">
                  {marketCount} ฉบับ
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    7.4 รับขนหรือกำจัดสิ่งปฏิกูล/มูลฝอย
                  </div>
                  <div className="text-[11px] text-slate-500">รถขนถ่ายขยะ บ่อฝังกลบ</div>
                </div>
                <div className="text-right font-bold text-slate-900 text-sm">
                  {wasteCount} ฉบับ
                </div>
              </div>
            </div>
          </div>

          {/* Expiring this month table */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              รายการใบอนุญาตที่ต้องต่ออายุเร่งด่วนในรอบเดือน (ล่วงหน้า ≤30 วัน)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">เลขที่ใบอนุญาต</th>
                    <th className="py-2.5 px-3">สถานประกอบการ</th>
                    <th className="py-2.5 px-3">ผู้ถือใบอนุญาต</th>
                    <th className="py-2.5 px-3">วันหมดอายุ</th>
                    <th className="py-2.5 px-3">คงเหลือ</th>
                    <th className="py-2.5 px-3 text-right">ค่าธรรมเนียม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenses
                    .filter((l) => getDaysRemaining(l.expiryDate) <= 30)
                    .map((item) => {
                      const days = getDaysRemaining(item.expiryDate);
                      return (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-mono font-medium text-blue-700">
                            {item.licenseNo}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {item.businessName}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{item.ownerFullName}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">
                            {formatThaiDate(item.expiryDate, true)}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                days < 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {days < 0 ? `เกิน ${Math.abs(days)} วัน` : `เหลือ ${days} วัน`}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-800">
                            {formatCurrency(item.feeAmount)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures Box for Municipal Report Printing */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs print-only">
            <div className="space-y-12">
              <div>ลงชื่อ ........................................................... ผู้จัดทำรายงาน</div>
              <div>( ........................................................... )</div>
              <div className="text-slate-500">เจ้าพนักงานสาธารณสุขปฏิบัติงาน</div>
            </div>

            <div className="space-y-12">
              <div>ลงชื่อ ........................................................... ผู้รับรองรายงาน</div>
              <div>( ........................................................... )</div>
              <div className="text-slate-500">ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
