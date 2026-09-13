import React, { useState } from 'react';
import { X, RefreshCw, Calendar, CheckCircle, FileSpreadsheet, ArrowRight, ShieldCheck } from 'lucide-react';
import { LicenseRecord } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/licenseUtils';

interface RenewalModalProps {
  license: LicenseRecord | null;
  onClose: () => void;
  onConfirmRenewal: (
    licenseId: string,
    newExpiryDate: string,
    officerNotes: string,
    syncToSheet: boolean
  ) => Promise<void>;
  hasGoogleSheetConnected: boolean;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  license,
  onClose,
  onConfirmRenewal,
  hasGoogleSheetConnected,
}) => {
  if (!license) return null;

  // Calculate default +1 year from current expiry date
  const currentExpiry = new Date(license.expiryDate + 'T00:00:00');
  const nextYear = new Date(currentExpiry);
  nextYear.setFullYear(currentExpiry.getFullYear() + 1);
  const defaultNewExpiry = nextYear.toISOString().split('T')[0];

  const [newExpiryDate, setNewExpiryDate] = useState<string>(defaultNewExpiry);
  const [officerNotes, setOfficerNotes] = useState<string>('ผ่านการตรวจสอบสุขลักษณะและเอกสารถูกต้องตามเกณฑ์');
  const [syncToSheet, setSyncToSheet] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepStatus, setStepStatus] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      setStepStatus('กำลังคำนวณวันหมดอายุใหม่...');
      await new Promise((res) => setTimeout(res, 500));

      if (hasGoogleSheetConnected && syncToSheet) {
        setStepStatus('กำลังอัปเดตข้อมูลไปยังฐานข้อมูลหลัก Google Sheets...');
        await new Promise((res) => setTimeout(res, 700));
      }

      setStepStatus('กำลังบันทึกประวัติการต่ออายุและสร้างใบรับรอง...');
      await onConfirmRenewal(license.id, newExpiryDate, officerNotes, syncToSheet);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error('Error during renewal:', err);
      setIsProcessing(false);
      alert('เกิดข้อผิดพลาดในการต่ออายุใบอนุญาต');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-white/10">
              <RefreshCw className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">ต่ออายุใบอนุญาตประกอบกิจการ</h3>
              <p className="text-[11px] text-emerald-200">
                อัปเดตวันสิ้นสุดอายุและซิงค์ฐานข้อมูลหลักอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* License summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">หมายเลขใบอนุญาต:</span>
              <span className="font-mono font-bold text-blue-700">{license.licenseNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">สถานประกอบการ:</span>
              <span className="font-medium text-slate-900">{license.businessName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ผู้ถือใบอนุญาต:</span>
              <span className="text-slate-800">{license.ownerFullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ประเภทกิจการ:</span>
              <span className="text-slate-800 text-right max-w-[240px] truncate">{license.categoryLabel}</span>
            </div>
          </div>

          {/* Expiry comparison visual */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">วันหมดอายุเดิม</div>
              <div className="font-semibold text-slate-800 text-xs">
                {formatThaiDate(license.expiryDate)}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[11px] text-emerald-700 font-medium">วันหมดอายุใหม่ (+1 ปี)</div>
              <div className="font-bold text-emerald-800 text-xs">
                {formatThaiDate(newExpiryDate)}
              </div>
            </div>
          </div>

          {/* New Expiry Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              กำหนดวันหมดอายุรอบใหม่:
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                required
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fee details */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-medium text-slate-700 block">ค่าธรรมเนียมการต่ออายุประจำปี:</span>
              <span className="text-[11px] text-slate-400">ชำระผ่าน PromptPay ดิจิทัล</span>
            </div>
            <span className="text-base font-bold text-emerald-700">
              {formatCurrency(license.feeAmount)}
            </span>
          </div>

          {/* Officer notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              บันทึกผลการตรวจสอบของเจ้าพนักงาน:
            </label>
            <textarea
              rows={2}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="ระบุหมายเหตุการตรวจสถานที่ หรือผลการตรวจสุขาภิบาล..."
            />
          </div>

          {/* Auto Google Sheets Sync option */}
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="syncSheetCheckbox"
              checked={syncToSheet}
              onChange={(e) => setSyncToSheet(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="syncSheetCheckbox" className="text-xs text-slate-700 cursor-pointer">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                อัปเดตข้อมูลไปยังฐานข้อมูลหลัก Google Sheets โดยอัตโนมัติ
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                {hasGoogleSheetConnected
                  ? 'ระบบจะส่งข้อมูลวันหมดอายุใหม่และสถานะปกติไปยัง Google Sheets ทันที ไม่ต้องพิมพ์ซ้ำ'
                  : 'ยังไม่ได้เชื่อมต่อบัญชี Google (หากเปิดไว้จะซิงค์เมื่อเชื่อมต่อ)'}
              </p>
            </label>
          </div>

          {/* Processing status banner */}
          {isProcessing && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>{stepStatus}</span>
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ยืนยันการต่ออายุใบอนุญาต
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
