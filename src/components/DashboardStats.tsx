import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Ban, ArrowRight, BellRing, Sparkles } from 'lucide-react';
import { LicenseRecord } from '../types';
import { formatCurrency, getDaysRemaining } from '../utils/licenseUtils';

interface DashboardStatsProps {
  licenses: LicenseRecord[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSelectLicense: (license: LicenseRecord) => void;
  onOpenNotifications: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  licenses,
  activeFilter,
  onFilterChange,
  onSelectLicense,
  onOpenNotifications,
}) => {
  const totalCount = licenses.length;
  const expiringSoonList = licenses.filter((l) => {
    const days = getDaysRemaining(l.expiryDate);
    return days >= 0 && days <= 30 && l.status !== 'renewing';
  });
  const expiredCount = licenses.filter((l) => getDaysRemaining(l.expiryDate) < 0).length;
  const activeCount = licenses.filter((l) => getDaysRemaining(l.expiryDate) > 30).length;

  const totalFeesCollected = licenses.reduce((sum, item) => {
    return sum + (item.paymentStatus === 'paid' ? item.feeAmount : 0);
  }, 0);

  return (
    <div className="space-y-4 mb-6">
      {/* 30-Day Advance Warning Urgent Banner */}
      {expiringSoonList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 bg-white p-4 rounded-xl shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-amber-950">
                    แจ้งเตือนล่วงหน้า 30 วัน: พบใบอนุญาตใกล้หมดอายุ {expiringSoonList.length} รายการ
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-200 text-amber-900">
                    ด่วน
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  ตามระเบียบราชการ ผู้ประกอบการต้องยื่นคำขอต่ออายุล่วงหน้าก่อนใบอนุญาตสิ้นสุด
                  สามารถส่งข้อความเตือนผ่าน LINE OA / Email หรือกดต่ออายุและชำระ PromptPay ได้ทันที
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={onOpenNotifications}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                ส่งแจ้งเตือน LINE OA
              </button>
              <button
                onClick={() => onFilterChange('expiring_soon')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-2xs transition-colors"
              >
                <span>ดูรายการทั้งหมด ({expiringSoonList.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick chip previews for expiring items */}
          <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap gap-2">
            {expiringSoonList.slice(0, 3).map((item) => {
              const daysLeft = getDaysRemaining(item.expiryDate);
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectLicense(item)}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-100/80 hover:bg-amber-200/80 text-xs text-amber-950 transition-colors border border-amber-300/60"
                >
                  <span className="font-semibold">{item.businessName}</span>
                  <span className="text-[11px] text-amber-800">({item.licenseNo})</span>
                  <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                    เหลือ {daysLeft} วัน
                  </span>
                </button>
              );
            })}
            {expiringSoonList.length > 3 && (
              <span className="text-xs text-amber-800 self-center">
                และอีก {expiringSoonList.length - 3} รายการ...
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4 Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Licenses */}
        <div
          onClick={() => onFilterChange('all')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeFilter === 'all'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ใบอนุญาตทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-500">ฉบับในระบบ</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium">
            ครอบคลุมกิจการ 4 กลุ่มตาม พ.ร.บ.
          </div>
        </div>

        {/* Expiring Soon (30 Days) */}
        <div
          onClick={() => onFilterChange('expiring_soon')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeFilter === 'expiring_soon'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">ใกล้หมดอายุ (≤ 30 วัน)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{expiringSoonList.length}</span>
            <span className="text-xs text-amber-700 font-medium">ต้องต่ออายุด่วน</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700">
            ระบบแจ้งเตือนอัตโนมัติเปิดใช้งาน
          </div>
        </div>

        {/* Expired */}
        <div
          onClick={() => onFilterChange('expired')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeFilter === 'expired'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700">หมดอายุแล้ว</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{expiredCount}</span>
            <span className="text-xs text-rose-600 font-medium">เกินกำหนด</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600">
            ต้องระงับชั่วคราวหรือต่ออายุ
          </div>
        </div>

        {/* Active & Revenue */}
        <div
          onClick={() => onFilterChange('active')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            activeFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">สถานะปกติ / จัดเก็บแล้ว</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeCount}</span>
            <span className="text-xs text-emerald-600 font-medium">
              {formatCurrency(totalFeesCollected)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            ชำระผ่านระบบดิจิทัล PromptPay
          </div>
        </div>
      </div>
    </div>
  );
};
