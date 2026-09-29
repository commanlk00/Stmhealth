import React, { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  Sparkles,
  Users,
  Settings,
  X,
  UserPlus,
} from 'lucide-react';
import { UserSession } from '../types';
import {
  authenticateStaff,
  getStaffAccounts,
} from '../services/staffService';
import { setCurrentSession } from '../services/rbacService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onSelectSession?: (session: UserSession) => void;
  onSessionUpdated?: (session: UserSession) => void;
  onOpenStaffManagement?: () => void;
  onOpenStaffRegister?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSelectSession,
  onSessionUpdated,
  onOpenStaffManagement,
  onOpenStaffRegister,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccessName, setLoginSuccessName] = useState<string | null>(null);

  if (!isOpen) return null;

  const staffAccounts = getStaffAccounts();

  const handleUpdateSession = (session: UserSession) => {
    setCurrentSession(session);
    if (onSelectSession) onSelectSession(session);
    if (onSessionUpdated) onSessionUpdated(session);
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateStaff(usernameInput, passwordInput);
      setIsLoading(false);

      if (!res.success || !res.session) {
        setErrorMessage(res.error || 'รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      setLoginSuccessName(res.session.name);
      setTimeout(() => {
        handleUpdateSession(res.session!);
        setLoginSuccessName(null);
        onClose();
      }, 700);
    }, 400);
  };

  // Quick Account Select (for fast testing / demo)
  const handleQuickSelect = (username: string, pass: string) => {
    setUsernameInput(username);
    setPasswordInput(pass);
    setErrorMessage(null);

    // Auto authenticate immediately
    setIsLoading(true);
    setTimeout(() => {
      const res = authenticateStaff(username, pass);
      setIsLoading(false);
      if (res.success && res.session) {
        setLoginSuccessName(res.session.name);
        setTimeout(() => {
          handleUpdateSession(res.session!);
          setLoginSuccessName(null);
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between relative border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ระบบเข้าสู่ระบบเจ้าหน้าที่ (Staff Authentication)
              </h2>
              <p className="text-xs text-slate-400">
                เข้าสู่ระบบด้วยรหัสประจำตัว (ID) และรหัสผ่าน (Password)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">ผู้ใช้งานปัจจุบัน:</span>
            <span className="font-bold text-slate-900">{currentSession.name}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {currentSession.roleTitle}
            </span>
          </div>
          {currentSession.username && (
            <span className="font-mono text-[11px] text-slate-500">ID: {currentSession.username}</span>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Success Banner */}
          {loginSuccessName && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">เข้าสู่ระบบสำเร็จ</div>
                <div className="text-[11px] text-emerald-700">
                  ยินดีต้อนรับ {loginSuccessName} กำลังโหลดสิทธิ์การทำงาน...
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* ID / Username Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>รหัสประจำตัวเจ้าหน้าที่ (Officer ID / Username)</span>
                </span>
                <span className="text-[10px] text-slate-400">กำหนดโดย Admin</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="เช่น infosser, officer, finance, director"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>รหัสผ่าน (Password)</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="กรอกรหัสผ่านของท่าน"
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
              <span className="text-[11px] text-slate-400">
                หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ (Admin)
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Switcher Section (Demo & Fast Test) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>บัญชีเจ้าหน้าที่ที่ตั้งค่าไว้ในระบบ (เลือกเพื่อเข้าสู่ระบบทันที):</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {staffAccounts.slice(0, 4).map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickSelect(acc.username, acc.password)}
                  className="p-2.5 text-left border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs font-bold text-blue-700 group-hover:text-blue-800 flex items-center gap-1">
                      <Key className="w-3 h-3 text-slate-400" />
                      <span>{acc.username}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        acc.role === 'AUDITOR_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : acc.role === 'DIRECTOR'
                          ? 'bg-amber-100 text-amber-700'
                          : acc.role === 'FINANCE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-800 mt-1 truncate">
                    {acc.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{acc.roleTitle}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                    รหัสผ่าน: {acc.password}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* New Staff Registration Option */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-blue-950">ยังไม่มีบัญชีเจ้าหน้าที่?</div>
                <div className="text-[11px] text-blue-700">
                  ลงทะเบียนสำหรับเจ้าหน้าที่บันทึกข้อมูลเพื่อรอการอนุมัติสิทธิ์
                </div>
              </div>
            </div>
            {onOpenStaffRegister && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStaffRegister();
                }}
                className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors shrink-0"
              >
                ลงทะเบียนใหม่
              </button>
            )}
          </div>

          {/* Admin Staff Access Management Shortcut */}
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">ผู้ดูแลระบบ (Admin Setting)</div>
                <div className="text-[10px] text-slate-500">
                  ต้องการเพิ่มเจ้าหน้าที่ แก้ไขสิทธิ์ หรือรีเซ็ตรหัสผ่าน?
                </div>
              </div>
            </div>
            {onOpenStaffManagement && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStaffManagement();
                }}
                className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs transition-colors"
              >
                จัดการสิทธิ์เจ้าหน้าที่
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
          ระบบสารสนเทศกองสาธารณสุขและสิ่งแวดล้อม • เข้ารหัสความปลอดภัย TLS 1.3 & AES-256
        </div>
      </div>
    </div>
  );
};
