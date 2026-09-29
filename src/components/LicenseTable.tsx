import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Clock,
  Eye,
  RefreshCw,
  QrCode,
  Send,
  Building2,
  Calendar,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Award,
  UserCheck,
  Edit3,
} from 'lucide-react';
import { BusinessCategory, LicenseRecord, LicenseStatus, UserSession } from '../types';
import { HAZARDOUS_BUSINESS_GROUPS } from '../data/hazardousBusinessData';
import { evaluateLicenseStatus, formatCurrency, formatThaiDate } from '../utils/licenseUtils';
import { maskNationalId } from '../services/maskingService';

interface LicenseTableProps {
  licenses: LicenseRecord[];
  activeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  isSecurityUnlocked: boolean;
  onSelectLicense: (license: LicenseRecord) => void;
  onOpenRenewal: (license: LicenseRecord) => void;
  onOpenPromptPay: (license: LicenseRecord) => void;
  onOpenNotification: (license: LicenseRecord) => void;
  onOpenDocPreview: (doc: any, license: LicenseRecord) => void;
  currentSession: UserSession;
  onOpenELicense: (license: LicenseRecord) => void;
  onOpenEditLicense?: (license: LicenseRecord) => void;
}

export const LicenseTable: React.FC<LicenseTableProps> = ({
  licenses,
  activeStatusFilter,
  onStatusFilterChange,
  isSecurityUnlocked,
  onSelectLicense,
  onOpenRenewal,
  onOpenPromptPay,
  onOpenNotification,
  onOpenDocPreview,
  currentSession,
  onOpenELicense,
  onOpenEditLicense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedHazardousGroupFilter, setSelectedHazardousGroupFilter] = useState<string>('ALL');
  const [filterCitizenOnly, setFilterCitizenOnly] = useState(currentSession.role === 'CITIZEN');

  // Filter licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter((item) => {
      // Citizen filter
      if (filterCitizenOnly && currentSession.role === 'CITIZEN') {
        const isSomchai = item.ownerFullName.includes('สมชาย') || item.ownerNationalId.includes('99823');
        if (!isSomchai) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Hazardous Sub-Group filter
      if (selectedCategory === 'HAZARDOUS_HEALTH' && selectedHazardousGroupFilter !== 'ALL') {
        if (item.hazardousGroupCode) {
          if (item.hazardousGroupCode !== selectedHazardousGroupFilter) return false;
        } else if (item.categoryLabel) {
          const groupObj = HAZARDOUS_BUSINESS_GROUPS.find((g) => g.id === selectedHazardousGroupFilter);
          if (groupObj && !item.categoryLabel.includes(groupObj.shortName)) return false;
        }
      }

      // Status filter
      const evaluated = evaluateLicenseStatus(item.expiryDate, item.status);
      if (activeStatusFilter === 'expiring_soon' && evaluated.status !== 'expiring_soon') {
        return false;
      }
      if (activeStatusFilter === 'expired' && evaluated.status !== 'expired') {
        return false;
      }
      if (activeStatusFilter === 'active' && evaluated.status !== 'active') {
        return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchNo = item.licenseNo.toLowerCase().includes(query);
        const matchOwner = item.ownerFullName.toLowerCase().includes(query);
        const matchBusiness = item.businessName.toLowerCase().includes(query);
        const matchAddress = item.businessAddress.toLowerCase().includes(query) || item.idCardAddress.toLowerCase().includes(query);
        const matchId = item.ownerNationalId.includes(query);
        const matchHazType = item.hazardousType?.toLowerCase().includes(query) || false;
        const matchHazGroup = item.hazardousGroup?.toLowerCase().includes(query) || false;
        const matchHazCode = item.hazardousTypeCode?.toLowerCase().includes(query) || false;
        return matchNo || matchOwner || matchBusiness || matchAddress || matchId || matchHazType || matchHazGroup || matchHazCode;
      }

      return true;
    });
  }, [licenses, selectedCategory, selectedHazardousGroupFilter, activeStatusFilter, searchTerm]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Citizen portal banner if in CITIZEN mode */}
      {currentSession.role === 'CITIZEN' && (
        <div className="bg-indigo-900 text-white p-3.5 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold">
                ระบบบริการประชาชนและผู้ประกอบการ (ผู้ประกอบการ: {currentSession.name})
              </div>
              <p className="text-[11px] text-indigo-200">
                ท่านสามารถตรวจสอบใบอนุญาตของท่าน, สแกนชำระเงินผ่าน PromptPay, และดาวน์โหลด E-License PDF/A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterCitizenOnly(!filterCitizenOnly)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterCitizenOnly
                  ? 'bg-indigo-500 text-white shadow-xs'
                  : 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700'
              }`}
            >
              {filterCitizenOnly ? '✓ กรองเฉพาะกิจการของฉัน' : 'แสดงกิจการทั้งหมดในระบบ'}
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามเลขที่, ชื่อกิจการ, ผู้ขอ, หรือที่อยู่..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs sm:text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Status Filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> สถานะ:
            </span>
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeStatusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({licenses.length})
            </button>
            <button
              onClick={() => onStatusFilterChange('expiring_soon')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeStatusFilter === 'expiring_soon'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              ใกล้หมดอายุ (≤30 วัน)
            </button>
            <button
              onClick={() => onStatusFilterChange('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeStatusFilter === 'active'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              ปกติ
            </button>
            <button
              onClick={() => onStatusFilterChange('expired')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeStatusFilter === 'expired'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              หมดอายุแล้ว
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-slate-400 whitespace-nowrap mr-1 font-medium">ประเภทกิจการ:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ทุกประเภท
          </button>
          <button
            onClick={() => setSelectedCategory('HAZARDOUS_HEALTH')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'HAZARDOUS_HEALTH'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            7.1 อันตรายต่อสุขภาพ
          </button>
          <button
            onClick={() => setSelectedCategory('FOOD_ESTABLISHMENT')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'FOOD_ESTABLISHMENT'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            7.2 จำหน่าย/สะสมอาหาร (&gt;200 / ≤200 ตร.ม.)
          </button>
          <button
            onClick={() => setSelectedCategory('MARKET')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'MARKET'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            7.3 กิจการตลาด
          </button>
          <button
            onClick={() => setSelectedCategory('WASTE_MANAGEMENT')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'WASTE_MANAGEMENT'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            7.4 ขน/กำจัดสิ่งปฏิกูล-ขยะ
          </button>
        </div>

        {/* Hazardous Health Sub-Groups Filter Bar */}
        {selectedCategory === 'HAZARDOUS_HEALTH' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 text-xs border-t border-slate-100 scrollbar-none bg-amber-50/50 p-2 rounded-lg">
            <span className="text-amber-950 font-bold whitespace-nowrap mr-1 flex items-center gap-1 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              หมวดกิจการ (13 หมวด):
            </span>
            <button
              onClick={() => setSelectedHazardousGroupFilter('ALL')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition-colors ${
                selectedHazardousGroupFilter === 'ALL'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-slate-200'
              }`}
            >
              ทุกหมวด (13 หมวด)
            </button>
            {HAZARDOUS_BUSINESS_GROUPS.map((grp) => (
              <button
                key={grp.id}
                onClick={() => setSelectedHazardousGroupFilter(grp.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                  selectedHazardousGroupFilter === grp.id
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-slate-200'
                }`}
              >
                ม.{grp.groupNo} {grp.shortName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">หมายเลข & ประเภทใบอนุญาต</th>
              <th className="py-3 px-4">สถานประกอบการ & เจ้าของ (PDPA)</th>
              <th className="py-3 px-4">ที่อยู่สถานประกอบการ</th>
              <th className="py-3 px-4">วันหมดอายุ & ตัวนับ</th>
              <th className="py-3 px-4 text-center">เอกสารดิจิทัล</th>
              <th className="py-3 px-4 text-right">ค่าธรรมเนียม</th>
              <th className="py-3 px-4 text-center">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLicenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  ไม่พบข้อมูลใบอนุญาตที่ตรงตามเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              filteredLicenses.map((lic) => {
                const evalStatus = evaluateLicenseStatus(lic.expiryDate, lic.status);
                const isExpiringUrgent = evalStatus.status === 'expiring_soon';

                return (
                  <tr
                    key={lic.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isExpiringUrgent ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* License No & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="text-blue-700 font-mono">{lic.licenseNo}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={lic.categoryLabel}>
                        {lic.categoryLabel}
                      </div>
                      {lic.foodSubtype && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700">
                          {lic.foodSubtype === 'OVER_200_SQM'
                            ? `พื้นที่ ${lic.areaSquareMeters || '>200'} ตร.ม. (ใบอนุญาต)`
                            : `พื้นที่ ${lic.areaSquareMeters || '≤200'} ตร.ม. (หนังสือรับรองการแจ้ง)`}
                        </span>
                      )}
                      {lic.category === 'HAZARDOUS_HEALTH' && (lic.hazardousTypeCode || lic.hazardousType) && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {lic.hazardousTypeCode && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              รหัส {lic.hazardousTypeCode}
                            </span>
                          )}
                          {lic.hazardousGroup && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-[130px]">
                              {lic.hazardousGroup.replace('หมวด ', 'ม.')}
                            </span>
                          )}
                          {lic.hazardousRiskLevel && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                lic.hazardousRiskLevel === 'HIGH'
                                  ? 'bg-rose-100 text-rose-800'
                                  : lic.hazardousRiskLevel === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {lic.hazardousRiskLevel === 'HIGH'
                                ? 'เสี่ยงสูง'
                                : lic.hazardousRiskLevel === 'MEDIUM'
                                ? 'เสี่ยงกลาง'
                                : 'เสี่ยงต่ำ'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Business & Owner */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={lic.businessName}>
                          {lic.businessName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {lic.ownerFullName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        บัตร ปชช: {maskNationalId(lic.ownerNationalId, currentSession.role, isSecurityUnlocked)}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="text-xs text-slate-600 line-clamp-2" title={lic.businessAddress}>
                        {lic.businessAddress}
                      </div>
                      <div
                        className="text-[11px] text-slate-400 line-clamp-1 mt-0.5"
                        title={`ที่อยู่ตามบัตร: ${lic.idCardAddress}`}
                      >
                        (ตามบัตร: {lic.idCardAddress})
                      </div>
                    </td>

                    {/* Expiry Date & Countdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatThaiDate(lic.expiryDate, true)}</span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${evalStatus.badgeClass}`}
                        >
                          <Clock className="w-3 h-3" />
                          {evalStatus.badgeText}
                        </span>
                      </div>
                    </td>

                    {/* Digital Documents */}
                    <td className="py-3.5 px-4 text-center">
                      {lic.documents && lic.documents.length > 0 ? (
                        <div className="inline-flex items-center gap-1">
                          {lic.documents.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => onOpenDocPreview(doc, lic)}
                              title={`ดูไฟล์: ${doc.docTitle} (${doc.name})`}
                              className="p-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          ))}
                          <span className="text-[11px] text-slate-400 ml-1">
                            ({lic.documents.length})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Fee & PromptPay Status */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(lic.feeAmount)}
                      </div>
                      <div className="mt-0.5">
                        {lic.paymentStatus === 'paid' ? (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            ชำระแล้ว ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenPromptPay(lic)}
                            className="text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            รอชำระ PromptPay ↗
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        {/* E-License & Digital Signature */}
                        <button
                          onClick={() => onOpenELicense(lic)}
                          title="ดู/พิมพ์ใบอนุญาตดิจิทัล E-License (PDF/A + ลายมือชื่ออิเล็กทรอนิกส์)"
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <FileCheck2 className="w-4 h-4" />
                        </button>

                        {/* View details */}
                        <button
                          onClick={() => onSelectLicense(lic)}
                          title="ดูรายละเอียดใบอนุญาตและเอกสารทั้งหมด"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit license */}
                        {onOpenEditLicense && currentSession.role !== 'CITIZEN' && (
                          <button
                            onClick={() => onOpenEditLicense(lic)}
                            title="แก้ไขข้อมูลใบอนุญาต"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Renew */}
                        <button
                          onClick={() => onOpenRenewal(lic)}
                          title="ต่ออายุใบอนุญาต (อัปเดต Google Sheet อัตโนมัติ)"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* PromptPay QR */}
                        <button
                          onClick={() => onOpenPromptPay(lic)}
                          title="สร้าง QR Code PromptPay ชำระค่าธรรมเนียม"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* LINE OA Reminder */}
                        <button
                          onClick={() => onOpenNotification(lic)}
                          title="ส่งแจ้งเตือนผ่าน LINE OA / Email"
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar showing item count */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div>
          แสดงผล <span className="font-semibold text-slate-700">{filteredLicenses.length}</span> จากทั้งหมด{' '}
          <span className="font-semibold text-slate-700">{licenses.length}</span> รายการ
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ข้อมูลพร้อมอัปเดตแบบเรียลไทม์</span>
        </div>
      </div>
    </div>
  );
};
