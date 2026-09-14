import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle2, Download, Upload, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { LicenseRecord } from '../types';
import { generatePromptPayPayload } from '../services/promptpay';
import { formatCurrency, formatThaiDate } from '../utils/licenseUtils';

interface PromptPayModalProps {
  license: LicenseRecord | null;
  onClose: () => void;
  onPaymentSuccess: (licenseId: string, transactionRef: string) => void;
}

export const PromptPayModal: React.FC<PromptPayModalProps> = ({
  license,
  onClose,
  onPaymentSuccess,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isVerifyingSlip, setIsVerifyingSlip] = useState<boolean>(false);
  const [verificationDone, setVerificationDone] = useState<boolean>(false);
  const [uploadedSlipName, setUploadedSlipName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promptpayId = '0994000162534'; // Tax ID กองสาธารณสุข

  useEffect(() => {
    if (!license) return;
    try {
      const payload = generatePromptPayPayload(
        promptpayId,
        license.feeAmount,
        license.licenseNo.replace(/[^a-zA-Z0-9]/g, '')
      );

      QRCode.toDataURL(payload, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).then((url) => {
        setQrDataUrl(url);
      });
    } catch (err: any) {
      console.error('Error creating QR', err);
      setErrorMsg('เกิดข้อผิดพลาดในการสร้าง QR Code');
    }
  }, [license]);

  if (!license) return null;

  const handleSimulateSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedSlipName(file.name);
    setIsVerifyingSlip(true);
    setErrorMsg('');

    // Simulate instant AI / Banking API slip verification
    setTimeout(() => {
      setIsVerifyingSlip(false);
      setVerificationDone(true);
      const generatedRef = `TXN-${Date.now().toString().slice(-8)}`;

      setTimeout(() => {
        onPaymentSuccess(license.id, generatedRef);
      }, 1200);
    }, 1500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `PromptPay_${license.licenseNo}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold">
              PP
            </div>
            <div>
              <h3 className="font-bold text-sm">ชำระค่าธรรมเนียมออนไลน์ผ่าน PromptPay</h3>
              <p className="text-[11px] text-blue-200">ตรวจสอบยอดและอนุมัติทันที (Instant Digital Payment)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {verificationDone ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">ตรวจสอบสลิปและรับชำระเงินเรียบร้อย!</h4>
              <p className="text-xs text-slate-500">
                ระบบได้บันทึกยอดเงิน {formatCurrency(license.feeAmount)} และอัปเดตสถานะใบอนุญาต พร้อมส่งต่อข้อมูลไปยัง Google Sheets แล้ว
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 max-w-xs mx-auto">
                เลขอ้างอิง: TXN-{Date.now().toString().slice(-8)}
              </div>
            </div>
          ) : (
            <>
              {/* Fee info card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">สถานประกอบการ:</span>
                  <span className="font-semibold text-slate-900 text-right">{license.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">หมายเลขใบอนุญาต:</span>
                  <span className="font-mono text-blue-700">{license.licenseNo}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-700 font-medium">ยอดชำระตามข้อบัญญัติ:</span>
                  <span className="text-base font-bold text-emerald-600">
                    {formatCurrency(license.feeAmount)}
                  </span>
                </div>
              </div>

              {/* QR Code Container styled with official Thai PromptPay badge */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col items-center justify-center shadow-xs">
                {/* Official looking PromptPay Header */}
                <div className="w-full bg-[#003B70] text-white py-1.5 px-4 rounded-lg flex items-center justify-center gap-2 mb-3">
                  <span className="font-bold text-xs tracking-wider">พร้อมเพย์</span>
                  <span className="text-[10px] text-blue-200">| PROMPTPAY</span>
                </div>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="PromptPay QR Code"
                    className="w-52 h-52 object-contain rounded-lg border border-slate-100 p-1"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-xs text-slate-400">
                    กำลังสร้าง QR Code...
                  </div>
                )}

                <div className="mt-2 text-center">
                  <div className="text-xs font-semibold text-slate-800">
                    บัญชี: เทศบาล / องค์การบริหารส่วนท้องถิ่น (กองสาธารณสุข)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Ref: {license.licenseNo.replace(/[^a-zA-Z0-9]/g, '')}
                  </div>
                </div>

                <button
                  onClick={handleDownloadQr}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> บันทึกภาพ QR Code เพื่อสแกนในแอปธนาคาร
                </button>
              </div>

              {/* Slip upload and instant verification */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleSimulateSlipUpload}
                />

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-blue-950">
                        อัปโหลดสลิปโอนเงิน (Slip Verification)
                      </div>
                      <div className="text-[11px] text-blue-800">
                        รองรับรูปถ่ายหรือ PDF ตรวจสอบยอดและปรับสถานะทันที
                      </div>
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isVerifyingSlip}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      {isVerifyingSlip ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          กำลังตรวจสอบ...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          แนบสลิป
                        </>
                      )}
                    </button>
                  </div>

                  {uploadedSlipName && (
                    <div className="mt-2 text-[11px] text-blue-900 font-mono truncate">
                      ไฟล์ที่เลือก: {uploadedSlipName}
                    </div>
                  )}
                </div>

                {/* Gateway Webhook Simulator */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Payment Gateway Webhook (HMAC-SHA256)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">POST /api/webhooks/promptpay</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    รองรับ Webhook จากธนาคาร/Payment Gateway เพื่อยืนยันยอดเงินและปรับสถานะใบอนุญาตอัตโนมัติ
                  </p>
                  <button
                    onClick={() => {
                      setIsVerifyingSlip(true);
                      setTimeout(() => {
                        setIsVerifyingSlip(false);
                        setVerificationDone(true);
                        const webhookRef = `WH-PP-GATEWAY-${Date.now().toString().slice(-6)}`;
                        setTimeout(() => {
                          onPaymentSuccess(license.id, webhookRef);
                        }, 900);
                      }, 1000);
                    }}
                    disabled={isVerifyingSlip}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSlip ? 'animate-spin' : ''}`} />
                    <span>จำลอง Webhook ยืนยันการชำระเงินอัตโนมัติ (Trigger Webhook)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
