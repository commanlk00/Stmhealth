import React, { useState } from 'react';
import { X, ShieldCheck, Lock, KeyRound, AlertCircle } from 'lucide-react';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const correctPin = '123456';

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('รหัส PIN ไม่ถูกต้อง (รหัสเริ่มต้นสำหรับการทดสอบคือ 123456)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-white/10 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">การยืนยันตัวตนความปลอดภัยสูง (PDPA)</h3>
              <p className="text-[11px] text-slate-400">ป้องกันข้อมูลส่วนบุคคลรั่วไหล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleVerify} className="p-5 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              กรุณากรอกรหัส PIN เจ้าหน้าที่
            </h4>
            <p className="text-xs text-slate-500">
              เพื่อปลดล็อคการแสดงหมายเลขประจำตัวประชาชน 13 หลักและเอกสารลับส่วนบุคคล
            </p>
          </div>

          <div>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {error && (
              <p className="text-[11px] text-rose-600 text-center mt-1 font-medium">{error}</p>
            )}
          </div>

          <div className="p-2.5 bg-blue-50 rounded-xl text-[11px] text-blue-800 space-y-0.5">
            <div className="font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              มาตรการคุ้มครองข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
            </div>
            <div className="text-slate-500">
              รหัส PIN เริ่มต้นสำหรับการทดสอบของเจ้าหน้าที่: <strong className="font-mono text-blue-900">123456</strong>
            </div>
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              ยืนยันรหัส PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
