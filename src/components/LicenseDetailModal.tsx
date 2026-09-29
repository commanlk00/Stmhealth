import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Calendar,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Send,
  Download,
  Eye,
  Shield,
  FileSpreadsheet,
  ExternalLink,
  FileCheck2,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { LicenseRecord, UploadedDocument, UserSession } from '../types';
import { CATEGORY_REQUIREMENTS } from '../data/categoryRequirements';
import { findHazardousTypeByCode } from '../data/hazardousBusinessData';
import { evaluateLicenseStatus, formatCurrency, formatThaiDate } from '../utils/licenseUtils';
import { maskNationalId } from '../services/maskingService';

interface LicenseDetailModalProps {
  license: LicenseRecord | null;
  onClose: () => void;
  isSecurityUnlocked: boolean;
  onToggleSecurity: () => void;
  onOpenRenewal: (license: LicenseRecord) => void;
  onOpenPromptPay: (license: LicenseRecord) => void;
  onOpenNotification: (license: LicenseRecord) => void;
  onOpenDocPreview: (doc: UploadedDocument, license: LicenseRecord) => void;
  currentSession: UserSession;
  onOpenELicense: (license: LicenseRecord) => void;
  onOpenEditLicense?: (license: LicenseRecord) => void;
}

export const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({
  license,
  onClose,
  isSecurityUnlocked,
  onToggleSecurity,
  onOpenRenewal,
  onOpenPromptPay,
  onOpenNotification,
  onOpenDocPreview,
  currentSession,
  onOpenELicense,
  onOpenEditLicense,
}) => {
  if (!license) return null;

  const evalStatus = evaluateLicenseStatus(license.expiryDate, license.status);

  // Find category rule
  const categoryRuleKey =
    license.category === 'FOOD_ESTABLISHMENT'
      ? license.foodSubtype === 'OVER_200_SQM'
        ? 'FOOD_ESTABLISHMENT_OVER_200'
        : 'FOOD_ESTABLISHMENT_UNDER_200'
      : license.category;

  const categoryRule = CATEGORY_REQUIREMENTS[categoryRuleKey] || CATEGORY_REQUIREMENTS.HAZARDOUS_HEALTH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">{license.businessName}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${evalStatus.badgeClass}`}
                >
                  {evalStatus.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                เลขที่ใบอนุญาต: {license.licenseNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEditLicense && currentSession.role !== 'CITIZEN' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditLicense(license);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                title="แก้ไขข้อมูลใบอนุญาตนี้"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขข้อมูล</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* 30-Day Alert Highlight if expiring */}
          {evalStatus.status === 'expiring_soon' && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                <div>
                  <div className="font-bold text-amber-950 text-xs sm:text-sm">
                    ใบอนุญาตนี้อยู่ในช่วงแจ้งเตือนล่วงหน้า 30 วัน (เหลืออีก {evalStatus.daysRemaining} วัน)
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    ผู้ประกอบการสามารถต่ออายุล่วงหน้าได้ทันที เพื่อความต่อเนื่องในการประกอบกิจการ
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenRenewal(license);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs whitespace-nowrap shadow-xs"
              >
                ต่ออายุตอนนี้
              </button>
            </div>
          )}

          {/* Grid 1: ข้อมูลผู้ขอและที่อยู่ (ตามข้อ 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner & ID Card Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> ข้อมูลผู้ประกอบการ / ผู้ขออนุญาต
                </span>
                <button
                  onClick={onToggleSecurity}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Shield className="w-3 h-3" />
                  {isSecurityUnlocked ? 'ซ่อนเลขบัตร' : 'แสดงเลขบัตร (PIN)'}
                </button>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">ชื่อ - นามสกุล:</span>
                <span className="font-semibold text-slate-800">{license.ownerFullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">เลขประจำตัวประชาชน (13 หลัก):</span>
                <span className="font-mono text-slate-800 font-medium">
                  {maskNationalId(license.ownerNationalId, currentSession.role, isSecurityUnlocked)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">ที่อยู่ตามบัตรประจำตัวประชาชน:</span>
                <span className="text-slate-700 leading-relaxed">{license.idCardAddress}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                <span>เบอร์โทร: {license.contactPhone || '-'}</span>
                <span>อีเมล: {license.contactEmail || '-'}</span>
              </div>
            </div>

            {/* Business Establishment & License Category */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="border-b border-slate-200 pb-2 font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" /> สถานประกอบการและประเภทกิจการ
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">ประเภทใบอนุญาตตามระเบียบ:</span>
                <span className="font-semibold text-slate-800">{categoryRule.issuanceTypeTitle}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {categoryRule.legalBasis}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">ที่อยู่สถานประกอบการ:</span>
                <span className="text-slate-700 leading-relaxed">{license.businessAddress}</span>
              </div>

              {/* Hazardous Business classification badges */}
              {license.category === 'HAZARDOUS_HEALTH' && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-900 flex items-center gap-1 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>{license.hazardousGroup || 'กิจการที่เป็นอันตรายต่อสุขภาพ'}</span>
                    </span>
                    {license.hazardousTypeCode && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-mono font-bold">
                        รหัส {license.hazardousTypeCode}
                      </span>
                    )}
                  </div>
                  {license.hazardousType && (
                    <div className="text-[11px] text-slate-800 font-medium">
                      {license.hazardousType}
                    </div>
                  )}
                  {license.hazardousRiskLevel && (
                    <div className="pt-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          license.hazardousRiskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : license.hazardousRiskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {license.hazardousRiskLevel === 'HIGH' && '⚠️ ความเสี่ยงสูง (High Risk)'}
                        {license.hazardousRiskLevel === 'MEDIUM' && '⚡ ความเสี่ยงปานกลาง'}
                        {license.hazardousRiskLevel === 'LOW' && '✓ ความเสี่ยงต่ำ'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {license.areaSquareMeters && (
                <div>
                  <span className="text-slate-400 block text-[11px]">ขนาดพื้นที่ประกอบการ:</span>
                  <span className="font-medium text-slate-800">
                    {license.areaSquareMeters} ตารางเมตร{' '}
                    {license.areaSquareMeters > 200
                      ? '(เกิน 200 ตร.ม. ยื่นขอ "ใบอนุญาต")'
                      : '(ไม่เกิน 200 ตร.ม. ยื่นขอ "หนังสือรับรองการแจ้ง")'}
                  </span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">อัตราค่าธรรมเนียมต่อปี:</span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(license.feeAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200">
            <div>
              <span className="text-[11px] text-blue-900 font-medium block">วันที่ออกใบอนุญาต:</span>
              <span className="font-semibold text-slate-800">{formatThaiDate(license.issueDate)}</span>
            </div>
            <div>
              <span className="text-[11px] text-blue-900 font-medium block">วันหมดอายุ:</span>
              <span className="font-bold text-rose-700">{formatThaiDate(license.expiryDate)}</span>
            </div>
            <div>
              <span className="text-[11px] text-blue-900 font-medium block">ระยะเวลาคงเหลือ:</span>
              <span className="font-semibold text-slate-800">
                {evalStatus.daysRemaining > 0
                  ? `เหลืออีก ${evalStatus.daysRemaining} วัน`
                  : `หมดอายุแล้ว ${Math.abs(evalStatus.daysRemaining)} วัน`}
              </span>
            </div>
          </div>

          {/* Required Document Checklist & Uploaded Files (ตามข้อ 4 และ 7) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  เอกสารดิจิทัลและรายการตรวจสอบตามประเภทกิจการ ({categoryRule.title})
                </h3>
                <p className="text-[11px] text-slate-500">
                  ตรวจสอบความครบถ้วนของเอกสาร ไฟล์ PDF หรือรูปภาพความละเอียดสูง
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryRule.documentChecklist.map((reqDoc) => {
                const uploaded = license.documents?.find(
                  (d) => d.categoryRequirementId === reqDoc.docId || d.name.toLowerCase().includes(reqDoc.docId.slice(4))
                );

                return (
                  <div
                    key={reqDoc.docId}
                    className={`p-3 rounded-xl border transition-all ${
                      uploaded
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : reqDoc.isRequired
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 text-xs">
                            {reqDoc.name}
                          </span>
                          {reqDoc.isRequired && (
                            <span className="text-[10px] text-rose-600 font-bold bg-rose-100 px-1.5 py-0.2 rounded">
                              จำเป็น
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{reqDoc.description}</p>
                      </div>

                      {uploaded ? (
                        <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">ยังไม่แนบ</span>
                      )}
                    </div>

                    {/* If uploaded, show file details and preview button */}
                    {uploaded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate max-w-[180px]">
                          {uploaded.name} ({uploaded.fileSize})
                        </span>
                        <button
                          onClick={() => onOpenDocPreview(uploaded, license)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> เปิดดูเอกสาร
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Renewal History & Google Sheets Sync Log */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-600" /> ประวัติการต่ออายุและฐานข้อมูลหลัก
              </span>
              {license.syncedToSheet && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> ซิงค์กับ Google Sheets แล้ว
                </span>
              )}
            </div>

            {license.renewalHistory && license.renewalHistory.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {license.renewalHistory.map((history, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        ต่ออายุเมื่อ: {formatThaiDate(history.renewalDate)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ขยายเวลาถึง {formatThaiDate(history.newExpiryDate)} | ผู้ตรวจ: {history.officerName}
                      </div>
                      {history.notes && (
                        <div className="text-[11px] text-slate-600 italic mt-0.5">
                          "{history.notes}"
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                        ชำระแล้ว {formatCurrency(history.feeAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                ยังไม่มีประวัติการต่ออายุ (เป็นใบอนุญาตออกใหม่)
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenELicense(license);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" /> E-License ดิจิทัล (PDF/A)
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenNotification(license);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> ส่งแจ้งเตือน
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPromptPay(license);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" /> ชำระ PromptPay
            </button>

            {onOpenEditLicense && currentSession.role !== 'CITIZEN' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditLicense(license);
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> แก้ไขข้อมูลใบอนุญาต
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenRenewal(license);
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> ดำเนินการต่ออายุ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
