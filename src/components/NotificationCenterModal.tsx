import React, { useState } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { LicenseRecord } from '../types';
import { evaluateLicenseStatus, formatCurrency, formatThaiDate, getDaysRemaining } from '../utils/licenseUtils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLicense?: LicenseRecord | null;
  licenses: LicenseRecord[];
  onTriggerBulkNotification: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  selectedLicense,
  licenses,
  onTriggerBulkNotification,
}) => {
  if (!isOpen) return null;

  // If a specific license was selected, focus on it; otherwise pick first expiring or first in list
  const expiringList = licenses.filter((l) => getDaysRemaining(l.expiryDate) <= 30 && getDaysRemaining(l.expiryDate) >= 0);
  const targetLicense = selectedLicense || expiringList[0] || licenses[0];

  const [channel, setChannel] = useState<'LINE' | 'EMAIL' | 'SMS'>('LINE');
  const [notify30DaysEnabled, setNotify30DaysEnabled] = useState(true);
  const [notify15DaysEnabled, setNotify15DaysEnabled] = useState(true);
  const [notify7DaysEnabled, setNotify7DaysEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const daysLeft = targetLicense ? getDaysRemaining(targetLicense.expiryDate) : 0;
  const evalStatus = targetLicense ? evaluateLicenseStatus(targetLicense.expiryDate, targetLicense.status) : null;

  const handleSendTestNotification = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#06C755] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#06C755] flex items-center justify-center font-bold shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  ระบบแจ้งเตือนอัตโนมัติ LINE OA & Email
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 rounded-full">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                แจ้งเตือนวันหมดอายุล่วงหน้า 30 วัน และรายงานสถานะการดำเนินการ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Channel Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setChannel('LINE')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                channel === 'LINE'
                  ? 'bg-white text-[#06C755] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>LINE Official Account (LINE OA)</span>
            </button>
            <button
              onClick={() => setChannel('EMAIL')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                channel === 'EMAIL'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>อีเมลราชการ (Email Alert)</span>
            </button>
          </div>

          {/* Target Business Card */}
          {targetLicense && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">ผู้รับการแจ้งเตือน:</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  {targetLicense.businessName}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  ผู้ขอ: {targetLicense.ownerFullName} | เลขที่: {targetLicense.licenseNo}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${evalStatus?.badgeClass}`}
                >
                  {daysLeft >= 0 ? `เหลือ ${daysLeft} วัน` : `หมดอายุแล้ว`}
                </span>
              </div>
            </div>
          )}

          {/* Live Preview of LINE OA Flex Message */}
          {channel === 'LINE' && targetLicense && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-100 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 self-start">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                ตัวอย่างข้อความแจ้งเตือนบน LINE OA (Flex Message Preview)
              </div>

              {/* Chat bubble simulation */}
              <div className="max-w-sm w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                {/* Flex Message Top Banner */}
                <div className="bg-gradient-to-r from-[#06C755] to-emerald-700 p-3.5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wide uppercase bg-black/20 px-2 py-0.5 rounded">
                      กองสาธารณสุขและสิ่งแวดล้อม
                    </span>
                    <span className="text-[10px] text-emerald-100">Smart Alert</span>
                  </div>
                  <h4 className="font-bold text-sm mt-2">
                    {daysLeft <= 30 && daysLeft >= 0
                      ? '⚠️ แจ้งเตือนวันหมดอายุใบอนุญาตล่วงหน้า'
                      : daysLeft < 0
                      ? '🚨 ใบอนุญาตประกอบกิจการหมดอายุแล้ว'
                      : 'ℹ️ ตรวจสอบสถานะใบอนุญาตประกอบกิจการ'}
                  </h4>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    {daysLeft <= 30 && daysLeft >= 0
                      ? `ใบอนุญาตของท่านจะหมดอายุในอีก ${daysLeft} วันข้างหน้า`
                      : 'กรุณาตรวจสอบข้อมูลและดำเนินการตามกำหนดเวลา'}
                  </p>
                </div>

                {/* Flex Message Body */}
                <div className="p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">สถานประกอบการ:</span>
                    <span className="font-semibold text-slate-800 text-right">{targetLicense.businessName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">เลขที่ใบอนุญาต:</span>
                    <span className="font-mono text-slate-800">{targetLicense.licenseNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">วันหมดอายุ:</span>
                    <span className="font-bold text-rose-600">{formatThaiDate(targetLicense.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">ค่าธรรมเนียมต่ออายุ:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(targetLicense.feeAmount)}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-900">
                    💡 ท่านสามารถต่ออายุออนไลน์ได้ทันที และชำระผ่าน PromptPay QR Code เพื่อลดขั้นตอนการติดต่อสำนักงาน
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-1.5">
                  <div className="w-full py-2 bg-[#06C755] text-white font-bold text-xs text-center rounded-lg shadow-2xs">
                    📱 ชำระค่าธรรมเนียม PromptPay ทันที
                  </div>
                  <div className="w-full py-1.5 bg-slate-200 text-slate-700 font-semibold text-xs text-center rounded-lg">
                    ยื่นคำขอต่ออายุออนไลน์ (Portal)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Template Preview */}
          {channel === 'EMAIL' && targetLicense && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="border-b border-slate-200 pb-2 text-xs text-slate-500">
                <div><span className="font-semibold text-slate-700">ถึง:</span> {targetLicense.contactEmail || 'owner@example.com'}</div>
                <div className="mt-1">
                  <span className="font-semibold text-slate-700">เรื่อง:</span> แจ้งเตือนการต่ออายุใบอนุญาตประกอบกิจการ (ล่วงหน้า 30 วัน) - {targetLicense.businessName}
                </div>
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <p>เรียน {targetLicense.ownerFullName},</p>
                <p>
                  ตามระเบียบกองสาธารณสุขและสิ่งแวดล้อม ใบอนุญาตประกอบกิจการ <strong>"{targetLicense.businessName}"</strong> หมายเลข <strong>{targetLicense.licenseNo}</strong> จะหมดอายุในวันที่ <strong>{formatThaiDate(targetLicense.expiryDate)}</strong> (เหลือระยะเวลาอีก {daysLeft} วัน)
                </p>
                <p>
                  ขอความร่วมมือให้ท่านยื่นคำขอต่ออายุใบอนุญาตและชำระค่าธรรมเนียมประจำปี จำนวน <strong>{formatCurrency(targetLicense.feeAmount)}</strong> ผ่านช่องทางออนไลน์ PromptPay หรือติดต่อสำนักงานเทศบาล
                </p>
                <div className="pt-2 text-slate-500">
                  ด้วยความเคารพอย่างสูง<br />
                  กลุ่มงานสุขาภิบาลและอนามัยสิ่งแวดล้อม
                </div>
              </div>
            </div>
          )}

          {/* Automation Configuration Switches */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              การตั้งค่าเงื่อนไขการแจ้งเตือนอัตโนมัติ (Automated Trigger Rules)
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-800">
                    แจ้งเตือนล่วงหน้า 30 วัน (30-Day Advance Reminder)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ส่งข้อความเตือนรอบแรกทันทีเมื่อใบอนุญาตเหลืออายุ 30 วัน
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notify30DaysEnabled}
                  onChange={(e) => setNotify30DaysEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-semibold text-slate-800">
                    แจ้งเตือนซ้ำ 15 วัน และ 7 วัน ก่อนหมดอายุ
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ส่งข้อความเตือนซ้ำกรณีที่ยังไม่ได้ยื่นคำขอต่ออายุหรือยังไม่ชำระเงิน
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notify15DaysEnabled}
                  onChange={(e) => setNotify15DaysEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Success Banner */}
          {sendSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ส่งข้อความแจ้งเตือนผ่าน {channel} สำเร็จแล้ว! บันทึกประวัติการส่งเรียบร้อย
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onTriggerBulkNotification}
            className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
          >
            ส่งแจ้งเตือนทุกรายการที่ใกล้หมดอายุ ({expiringList.length} ฉบับ)
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={handleSendTestNotification}
              disabled={isSending}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#06C755] hover:bg-[#05b34c] text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {isSending ? (
                'กำลังส่งข้อความ...'
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  ส่งแจ้งเตือนทันที
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
