import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Key,
  Lock,
  User,
  Building,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { UserRole } from '../types';
import { registerStaffAccount } from '../services/staffService';
import { ROLE_PROFILES } from '../services/rbacService';

interface StaffRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess?: () => void;
  onOpenLogin?: () => void;
}

export const StaffRegisterModal: React.FC<StaffRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisteredSuccess,
  onOpenLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('เจ้าหน้าที่บันทึกข้อมูล');
  const [department, setDepartment] = useState('ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('DATA_ENTRY');
  const [requestedReason, setRequestedReason] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredUsername, setRegisteredUsername] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('กรุณาระบุรหัสผู้ใช้งาน (Username)');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMessage('รหัสผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุลของเจ้าหน้าที่');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = registerStaffAccount({
        username,
        password,
        name,
        position,
        department,
        email,
        phone,
        requestedRole,
        requestedReason,
      });

      setIsLoading(false);

      if (!res.success || !res.account) {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        return;
      }

      setRegisteredUsername(res.account.username);
      setIsSuccess(true);
      if (onRegisteredSuccess) onRegisteredSuccess();
    }, 400);
  };

  const handleResetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setPosition('เจ้าหน้าที่บันทึกข้อมูล');
    setDepartment('ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม');
    setEmail('');
    setPhone('');
    setRequestedRole('DATA_ENTRY');
    setRequestedReason('');
    setErrorMessage(null);
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ลงทะเบียนเจ้าหน้าที่บันทึกข้อมูล / เจ้าหน้าที่ใหม่
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                ยื่นคำขอเปิดบัญชีผู้ใช้งานระบบทะเบียนใบอนุญาตสุขาภิบาล
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleResetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {isSuccess ? (
            <div className="py-6 px-4 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-bounce">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  ส่งคำขอลงทะเบียนสำเร็จเรียบร้อย!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  ข้อมูลของท่านได้ถูกส่งไปยังระบบเรียบร้อยแล้ว สถานะปัจจุบัน:{' '}
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    รอการอนุมัติ (PENDING)
                  </span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>ขั้นตอนถัดไป (Workflow):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    ผู้มีอำนาจระดับ <span className="font-bold text-slate-800">เจ้าพนักงานสาธารณสุข หรือ ผู้บริหารกองฯ</span> จะเข้าตรวจสอบคำขอและยืนยันตัวตน
                  </li>
                  <li>
                    ผู้อนุมัติจะกำหนดระดับสิทธิ์ (Role & Fine-grained Permissions) ที่เหมาะสมให้แก่ท่าน
                  </li>
                  <li>
                    เมื่อได้รับการอนุมัติ ท่านสามารถเข้าสู่ระบบด้วย Username:{' '}
                    <span className="font-mono font-bold text-blue-700">{registeredUsername}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    onClose();
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs flex items-center gap-2 transition-colors"
                >
                  <span>ไปยังหน้าเข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 text-xs transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Notice Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">ระบบควบคุมความมั่นคงปลอดภัยภาครัฐ:</span>{' '}
                  การลงทะเบียนนี้สำหรับเจ้าหน้าที่ผู้ปฏิบัติงานขององค์กรปกครองส่วนท้องถิ่น
                  เมื่อส่งคำขอแล้วจะต้องได้รับการอนุมัติและกำหนดระดับสิทธิ์จาก{' '}
                  <span className="font-semibold text-blue-950 underline">
                    เจ้าพนักงานสาธารณสุขปฏิบัติการขึ้นไป
                  </span>{' '}
                  ก่อนจึงจะสามารถเข้าใช้งานได้
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Account Credentials */}
              <div className="space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. ข้อมูลบัญชีผู้ใช้งาน (Login Credentials)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      รหัสผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        placeholder="เช่น somchai_data, clerk01"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ภาษาอังกฤษ ตัวเลข หรือขีดล่าง (3 ตัวอักษรขึ้นไป)
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      กำหนดรหัสผ่าน (Password) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        required
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-1.5 top-1.5"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Personal & Official Details */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. ข้อมูลประจำตัวและสังกัดหน่วยงาน</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ชื่อ-นามสกุล (Full Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น นายสมเจตน์ ใจมั่น"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ตำแหน่งหน้าที่ (Position) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="เช่น เจ้าหน้าที่บันทึกข้อมูล, พนักงานจ้างทั่วไป"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      สำนัก / กอง / ฝ่าย (Department)
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="กองสาธารณสุขและสิ่งแวดล้อม"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="เช่น 089-123-4567 หรือ ต่อ 302"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    อีเมลติดต่อราชการ (Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="เช่น officer@localgov.go.th"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Requested Role & Purpose */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. ระดับสิทธิ์ที่ขอใช้งาน (Requested Role & Scope)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    ประสงค์ขอเข้าใช้งานในระดับบทบาท:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestedRole('DATA_ENTRY')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        requestedRole === 'DATA_ENTRY'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>เจ้าหน้าที่บันทึกข้อมูล</span>
                        {requestedRole === 'DATA_ENTRY' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                        รับคำขอ, บันทึกข้อมูลใบอนุญาต, อัปโหลดเอกสาร
                      </div>
                      <span className="inline-block mt-1 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                        แนะนำสำหรับธุรการ
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRequestedRole('OFFICER')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        requestedRole === 'OFFICER'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>เจ้าพนักงานสาธารณสุข</span>
                        {requestedRole === 'OFFICER' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                        ตรวจสุขลักษณะ, บันทึกการต่ออายุ, จัดการสิทธิ์
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRequestedRole('FINANCE')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        requestedRole === 'FINANCE'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>เจ้าหน้าที่การเงิน</span>
                        {requestedRole === 'FINANCE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                        ตรวจสอบสลิป, รับชำระ PromptPay, ออกใบเสร็จ
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เหตุผลและความจำเป็นในการขอเข้าใช้งาน
                  </label>
                  <textarea
                    rows={2}
                    value={requestedReason}
                    onChange={(e) => setRequestedReason(e.target.value)}
                    placeholder="เช่น ปฏิบัติงานรับคำขอและคีย์ข้อมูลใบอนุญาตประกอบกิจการอันตรายต่อสุขภาพและอาหาร ประจำปี 2569"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    onClose();
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetForm();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>กำลังส่งคำขอ...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>ส่งคำขอลงทะเบียนเจ้าหน้าที่</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
