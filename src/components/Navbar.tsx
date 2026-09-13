import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, LogIn, LogOut, FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  token: string | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onOfficerLogin: () => void;
  onLogout: () => void;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncingSheet: boolean;
  onSyncAllToSheet: () => void;
  onCreateOrLinkSheet: () => void;
  isSecurityUnlocked: boolean;
  onToggleSecurity: () => void;
  expiringCount: number;
  onOpenNotifications: () => void;
  onOpenAddModal: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  token,
  isLoggingIn,
  onLogin,
  onOfficerLogin,
  onLogout,
  spreadsheetId,
  spreadsheetUrl,
  isSyncingSheet,
  onSyncAllToSheet,
  onCreateOrLinkSheet,
  isSecurityUnlocked,
  onToggleSecurity,
  expiringCount,
  onOpenNotifications,
  onOpenAddModal,
  onOpenReportModal,
}) => {
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Gov ribbon */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>ระบบบริการภาครัฐดิจิทัล (E-Government Business License Portal)</span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">พ.ร.บ. การสาธารณสุข พ.ศ. 2535</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          {spreadsheetId ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ซิงค์ Google Sheets หลักแล้ว
            </span>
          ) : (
            <span className="text-amber-400">ยังไม่ได้เชื่อม Google Sheets</span>
          )}
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  ระบบตรวจเช็คใบอนุญาตประกอบกิจการออนไลน์
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Smart Gov 4.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ตรวจเช็ค แจ้งเตือนล่วงหน้า 30 วัน ต่ออายุอัตโนมัติ และชำระผ่าน PromptPay
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Security PIN toggle for PDPA protection */}
            <button
              onClick={onToggleSecurity}
              title={isSecurityUnlocked ? 'โหมดปลดล็อค: กำลังแสดงเลขบัตรประชาชนครบ 13 หลัก' : 'คลิกเพื่อปลดล็อคแสดงข้อมูลส่วนบุคคลด้วย PIN'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSecurityUnlocked
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {isSecurityUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-amber-700" />
                  <span className="hidden md:inline">PDPA ปลดล็อคแล้ว</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="hidden md:inline">ซ่อนข้อมูล ปชช. (PDPA)</span>
                </>
              )}
            </button>

            {/* Monthly Report button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <span>สรุปรายงาน</span>
            </button>

            {/* Google Sheets Sync integration */}
            <div className="relative">
              <button
                onClick={() => setShowSheetDropdown(!showSheetDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  spreadsheetId
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">
                  {spreadsheetId ? 'ฐานข้อมูล Sheets' : 'เชื่อม Google Sheets'}
                </span>
              </button>

              {showSheetDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                  <div className="text-xs font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    เชื่อมต่อฐานข้อมูลหลัก Google Sheets
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    อัปเดตข้อมูลอัตโนมัติทุกครั้งที่มีการต่ออายุ ลดข้อผิดพลาดจากการคีย์ข้อมูลด้วยมือ
                  </p>

                  {spreadsheetId ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                        <div className="font-medium">เชื่อมต่อแล้ว (Master Sheet)</div>
                        <a
                          href={spreadsheetUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline block truncate mt-0.5 text-[11px]"
                        >
                          เปิดดู Google Sheets ในแท็บใหม่ ↗
                        </a>
                      </div>

                      <button
                        onClick={() => {
                          onSyncAllToSheet();
                          setShowSheetDropdown(false);
                        }}
                        disabled={isSyncingSheet}
                        className="w-full py-1.5 px-3 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                        {isSyncingSheet ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลทั้งหมดเดี๋ยวนี้'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onCreateOrLinkSheet();
                        setShowSheetDropdown(false);
                      }}
                      className="w-full py-2 px-3 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      สร้างหรือเชื่อม Google Sheets อัตโนมัติ
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Add New License button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <span>+ เพิ่มใบอนุญาต</span>
            </button>

            {/* Google Sign-in / User status */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ Google"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <div className="w-4 h-4">
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">
                    {isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบ Google'}
                  </span>
                </button>

                {/* Quick Officer login link */}
                <div className="absolute right-0 top-full mt-1 text-[10px] text-right whitespace-nowrap">
                  <button
                    onClick={onOfficerLogin}
                    className="text-slate-500 hover:text-blue-700 underline"
                  >
                    หรือเข้าสู่ระบบในโหมดเจ้าพนักงาน
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
