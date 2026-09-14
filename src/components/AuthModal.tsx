import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  QrCode,
  Smartphone,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertCircle,
  Building,
  CreditCard,
  FileCheck2,
  Terminal,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { ROLE_PROFILES, setCurrentSession } from '../services/rbacService';
import { recordAuditLog } from '../services/auditLogService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: (session: UserSession) => void;
  currentSession: UserSession;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSessionUpdated,
  currentSession,
}) => {
  const [authTab, setAuthTab] = useState<'OFFICER' | 'CITIZEN_THAID' | 'CITIZEN_OTP'>('OFFICER');

  // Officer state
  const [selectedRole, setSelectedRole] = useState<UserRole>('OFFICER');
  const [officerStep, setOfficerStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');
  const [officerPassword, setOfficerPassword] = useState('GovSecure#2026');
  const [totpCode, setTotpCode] = useState('');
  const [totpCountdown, setTotpCountdown] = useState(30);

  // Citizen ThaID state
  const [thaIdStatus, setThaIdStatus] = useState<'WAITING_SCAN' | 'VERIFYING' | 'SUCCESS'>('WAITING_SCAN');

  // Citizen OTP state
  const [phoneNumber, setPhoneNumber] = useState('081-987-6543');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);

  // 2FA Timer effect
  useEffect(() => {
    if (officerStep === '2FA') {
      const interval = setInterval(() => {
        setTotpCountdown((prev) => (prev > 1 ? prev - 1 : 30));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [officerStep]);

  // OTP Timer effect
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, otpTimer]);

  if (!isOpen) return null;

  // Handle Officer Credentials Submit -> proceed to 2FA
  const handleOfficerNext = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerStep('2FA');
    setTotpCode('849201'); // Pre-fill mock generated TOTP for ease of demonstration
  };

  // Handle 2FA verification complete
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const roleConfig = ROLE_PROFILES[selectedRole];
    const newSession: UserSession = {
      id: `usr-${selectedRole.toLowerCase()}-01`,
      name: roleConfig.defaultName,
      role: selectedRole,
      roleTitle: roleConfig.roleTitle,
      department: roleConfig.department,
      email: roleConfig.defaultEmail,
      authMethod: '2FA_CREDENTIAL',
      is2FAVerified: true,
    };

    setCurrentSession(newSession);
    onSessionUpdated(newSession);
    recordAuditLog({
      actorName: newSession.name,
      actorRole: newSession.role,
      actorIp: '203.144.144.20 (Gov Intranet)',
      action: 'LOGIN_2FA_SUCCESS',
      category: 'AUTH',
      targetResource: 'PORTAL_AUTH_GATEWAY',
      details: `ยืนยันตัวตน 2FA รหัสผ่านครั้งเดียวสำเร็จ กำหนดสิทธิ์ระดับ: ${newSession.roleTitle}`,
      status: 'SUCCESS',
    });
    onClose();
  };

  // Handle ThaID Scan simulation
  const handleThaIdScan = () => {
    setThaIdStatus('VERIFYING');
    setTimeout(() => {
      setThaIdStatus('SUCCESS');
      setTimeout(() => {
        const citizenConfig = ROLE_PROFILES.CITIZEN;
        const newSession: UserSession = {
          id: 'usr-citizen-thaid-01',
          name: 'นายสมชาย วัฒนพาณิชย์',
          role: 'CITIZEN',
          roleTitle: 'ผู้ประกอบการ (ยืนยัน ThaID กรมการปกครอง)',
          department: 'กิจการอาหารและเครื่องดื่ม',
          email: 'somchai.cleanfoods@gmail.com',
          authMethod: 'THAID',
          is2FAVerified: true,
          nationalId: '1-1004-99823-11-2',
        };

        setCurrentSession(newSession);
        onSessionUpdated(newSession);
        recordAuditLog({
          actorName: newSession.name,
          actorRole: 'CITIZEN',
          actorIp: '171.96.12.88 (ThaID Mobile Sub)',
          action: 'THAID_DOPA_VERIFIED',
          category: 'AUTH',
          targetResource: 'DOPA_THAID_OPENID',
          details: 'ยืนยันตัวตนดิจิทัลสำเร็จผ่านแอป ThaID กรมการปกครอง (Sub ID: tha-99210-x)',
          status: 'SUCCESS',
        });
        onClose();
      }, 1200);
    }, 1500);
  };

  // Handle OTP Submit
  const handleSendOtp = () => {
    setOtpSent(true);
    setOtpTimer(60);
    setOtpCode('512930');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: UserSession = {
      id: 'usr-citizen-otp-01',
      name: 'นายสมชาย วัฒนพาณิชย์',
      role: 'CITIZEN',
      roleTitle: 'ผู้ประกอบการ (ยืนยัน OTP เบอร์มือถือ)',
      department: 'กิจการจำหน่ายอาหาร',
      email: 'somchai.cleanfoods@gmail.com',
      authMethod: 'OTP',
      is2FAVerified: true,
      nationalId: '1-1004-99823-11-2',
    };

    setCurrentSession(newSession);
    onSessionUpdated(newSession);
    recordAuditLog({
      actorName: newSession.name,
      actorRole: 'CITIZEN',
      actorIp: '182.232.14.99 (Mobile IP)',
      action: 'LOGIN_SMS_OTP_SUCCESS',
      category: 'AUTH',
      targetResource: 'SMS_OTP_GATEWAY',
      details: `ยืนยันตัวตนผ่าน OTP ทางเบอร์โทรศัพท์ ${phoneNumber} สำเร็จ`,
      status: 'SUCCESS',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ศูนย์กลางการยืนยันตัวตนและกำหนดสิทธิ์ (Authentication Service)
              </h2>
              <p className="text-xs text-slate-300">
                รองรับ RBAC 4 ระดับตำแหน่งเจ้าหน้าที่ และ ThaID / OTP สำหรับผู้ประกอบการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setAuthTab('OFFICER');
              setOfficerStep('CREDENTIALS');
            }}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              authTab === 'OFFICER'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>เจ้าหน้าที่ (RBAC + 2FA)</span>
          </button>
          <button
            onClick={() => setAuthTab('CITIZEN_THAID')}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              authTab === 'CITIZEN_THAID'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>ผู้ประกอบการ (ThaID API)</span>
          </button>
          <button
            onClick={() => setAuthTab('CITIZEN_OTP')}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              authTab === 'CITIZEN_OTP'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ผู้ประกอบการ (OTP เบอร์มือถือ)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* 1. Officer Tab */}
          {authTab === 'OFFICER' && (
            <div className="space-y-4">
              {officerStep === 'CREDENTIALS' ? (
                <form onSubmit={handleOfficerNext} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      เลือกระดับตำแหน่งเจ้าหน้าที่ (Role-Based Access Control)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(['OFFICER', 'FINANCE', 'DIRECTOR', 'AUDITOR_ADMIN'] as UserRole[]).map((role) => {
                        const info = ROLE_PROFILES[role];
                        const isSelected = selectedRole === role;
                        return (
                          <div
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-slate-900">{info.roleTitle}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{info.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>ชื่อผู้ใช้งาน:</span>
                      <span className="font-semibold text-slate-800">{ROLE_PROFILES[selectedRole].defaultName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>อีเมลราชการ:</span>
                      <span className="font-mono text-slate-800">{ROLE_PROFILES[selectedRole].defaultEmail}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>สังกัด:</span>
                      <span className="text-slate-800">{ROLE_PROFILES[selectedRole].department}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสผ่านความปลอดภัยสูง (Password)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={officerPassword}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <span>ต่อไป: ยืนยันรหัสสองขั้นตอน (2-Factor Authentication)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Officer Step 2: 2FA */
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <KeyRound className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">ยืนยันตัวตน 2-Factor Authentication</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      กรอกรหัส TOTP 6 หลัก จากแอปพลิเคชัน Authenticator ของเจ้าหน้าที่
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>รหัส OTP จะเปลี่ยนใหม่ในอีก:</span>
                    </div>
                    <span className="font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded-md text-amber-900">
                      {totpCountdown} วินาที
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                      รหัสผ่านความปลอดภัย 6 หลัก (TOTP Code)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="000000"
                      required
                      className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-blue-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOfficerStep('CREDENTIALS')}
                      className="flex-1 py-2 text-xs border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      className="flex-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ยืนยันและเข้าสู่ระบบเจ้าหน้าที่</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 2. Citizen ThaID Tab */}
          {authTab === 'CITIZEN_THAID' && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-700 mb-1">
                <QrCode className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  ยืนยันตัวตนดิจิทัลผ่าน ThaID (กรมการปกครอง)
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  เปิดแอปพลิเคชัน ThaID บนโทรศัพท์มือถือ แล้วสแกน QR Code ด้านล่างเพื่อเข้าสู่ระบบ
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white border-2 border-dashed border-indigo-300 rounded-2xl inline-block shadow-inner relative">
                <div className="w-44 h-44 bg-slate-900 flex flex-col items-center justify-center rounded-xl p-3 text-white">
                  {thaIdStatus === 'WAITING_SCAN' && (
                    <>
                      <QrCode className="w-28 h-28 text-white opacity-90" />
                      <span className="text-[10px] text-indigo-200 mt-2 font-mono">DOPA:THAID-9942</span>
                    </>
                  )}
                  {thaIdStatus === 'VERIFYING' && (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                      <span className="text-xs font-semibold">กำลังตรวจสอบสิทธิ์กับ DOPA...</span>
                    </div>
                  )}
                  {thaIdStatus === 'SUCCESS' && (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">ยืนยันตัวตนสำเร็จ!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-xs mx-auto text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-medium">
                  <span>สถานะการเชื่อมต่อ:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    API กรมการปกครอง Online
                  </span>
                </div>
              </div>

              <button
                onClick={handleThaIdScan}
                disabled={thaIdStatus !== 'WAITING_SCAN'}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>จำลองการสแกนด้วยแอป ThaID (Simulate Scan)</span>
              </button>
            </div>
          )}

          {/* 3. Citizen OTP Tab */}
          {authTab === 'CITIZEN_OTP' && (
            <div className="space-y-4">
              <div className="text-center py-1">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">เข้าสู่ระบบด้วย OTP ผ่านหมายเลขโทรศัพท์</h3>
                <p className="text-xs text-slate-500">
                  สำหรับผู้ประกอบการที่ลงทะเบียนหมายเลขโทรศัพท์ไว้ในระบบใบอนุญาต
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมายเลขโทรศัพท์มือถือที่ลงทะเบียน
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSent && otpTimer > 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      {otpSent && otpTimer > 0 ? `ส่งอีกครั้ง (${otpTimer}s)` : 'ขอรหัส OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                      <span>รหัส OTP ส่งไปยัง {phoneNumber} แล้ว (รหัสทดสอบ: 512930)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                        กรอกรหัส OTP 6 หลัก
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000"
                        required
                        className="w-full text-center tracking-[0.4em] font-mono text-xl py-2 border-2 border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ยืนยันรหัส OTP และเข้าสู่ระบบผู้ประกอบการ</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 px-6 text-[11px] text-slate-500 flex items-center justify-between">
          <span>ความมั่นคงปลอดภัยสารสนเทศตามมาตรฐาน ISO/IEC 27001</span>
          <span className="font-semibold text-slate-700">GovAuth v3.4</span>
        </div>
      </div>
    </div>
  );
};

function Clock(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
