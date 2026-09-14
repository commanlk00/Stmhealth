import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  FileCheck2,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Award,
  Key,
  Calendar,
  Building,
  User,
  MapPin,
  Clock,
  X,
} from 'lucide-react';
import { LicenseRecord, UserSession } from '../types';
import { formatThaiDate, formatCurrency } from '../utils/licenseUtils';
import { maskNationalId } from '../services/maskingService';
import { recordAuditLog } from '../services/auditLogService';

interface ELicenseModalProps {
  license: LicenseRecord | null;
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onSignLicense?: (licenseId: string) => void;
}

export const ELicenseModal: React.FC<ELicenseModalProps> = ({
  license,
  isOpen,
  onClose,
  currentSession,
  onSignLicense,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isSigning, setIsSigning] = useState(false);
  const [showCertDetails, setShowCertDetails] = useState(false);

  useEffect(() => {
    if (license) {
      const verifyUrl = `https://e-license.localgov.go.th/verify?id=${license.licenseNo}&hash=${
        license.eLicenseSignature?.signatureDigest || '8f9210a7bc34e21'
      }&status=VALID`;
      QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code error', err));
    }
  }, [license]);

  if (!isOpen || !license) return null;

  const isDirector = currentSession.role === 'DIRECTOR';
  const hasDigitalSignature = Boolean(license.eLicenseSignature?.isValid);

  const handleApplySignature = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      if (onSignLicense) {
        onSignLicense(license.id);
      }
      recordAuditLog({
        actorName: currentSession.name,
        actorRole: 'DIRECTOR',
        actorIp: '203.144.144.10 (Executive Office)',
        action: 'DIGITAL_SIGNATURE_APPLIED',
        category: 'LICENSE_ISSUE',
        targetResource: license.licenseNo,
        details: `ลงรหัสลายมือชื่อดิจิทัล SHA256withRSA + TSA อนุมัติใบอนุญาต ${license.licenseNo} สถานประกอบการ ${license.businessName}`,
        status: 'SUCCESS',
      });
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Screen only) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-400/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold">ใบอนุญาตอิเล็กทรอนิกส์ (E-License PDF/A)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  มาตรฐาน มข.สธ.
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ลงรหัสลายมือชื่อดิจิทัลและมี QR Code ตรวจสอบความถูกต้องตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์ / บันทึก PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Security Notification Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              สถานะใบอนุญาตดิจิทัล:{' '}
              <strong>{hasDigitalSignature ? 'ลงลายมือชื่อดิจิทัลสมบูรณ์ (Valid Signature)' : 'รอการลงนามดิจิทัลจากผู้อำนวยการ'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!hasDigitalSignature && isDirector && (
              <button
                onClick={handleApplySignature}
                disabled={isSigning}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs text-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isSigning ? 'กำลังลงรหัสลายมือชื่อดิจิทัล...' : 'ลงลายมือชื่ออนุมัติ (E-Signature)'}</span>
              </button>
            )}

            <button
              onClick={() => setShowCertDetails(!showCertDetails)}
              className="text-emerald-700 underline font-medium text-[11px]"
            >
              {showCertDetails ? 'ซ่อนใบรับรองอิเล็กทรอนิกส์' : 'ดูใบรับรองอิเล็กทรอนิกส์ (TSA/Hash)'}
            </button>
          </div>
        </div>

        {/* Certificate Hash details drawer */}
        {showCertDetails && (
          <div className="bg-slate-900 text-slate-200 p-4 border-b border-slate-800 font-mono text-[11px] space-y-1.5 print:hidden">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
              <Key className="w-3.5 h-3.5" />
              <span>Digital Signature Cryptographic Evidence</span>
            </div>
            <div>Algorithm: SHA256withRSA (2048 bit Key)</div>
            <div className="break-all text-slate-400">
              Digest:{' '}
              {license.eLicenseSignature?.signatureDigest ||
                '8f9210a7bc34e21d59e8b61c920f01a34bc7e89df61a2b3c4d5e6f7a8b9c0d1e'}
            </div>
            <div>
              TSA Timestamp:{' '}
              {license.eLicenseSignature?.tsaTimestamp || `${new Date().toISOString()} (Electronic Transactions Act Compliant)`}
            </div>
            <div>
              Issuer: Thailand National Root CA / Department of Health Certificate Authority
            </div>
          </div>
        )}

        {/* Printable Official License Document */}
        <div className="p-6 sm:p-10 bg-white print:p-0">
          <div className="border-4 border-double border-slate-700 p-6 sm:p-8 relative bg-[#fffdfa] rounded-sm shadow-xs">
            {/* Corner Ornamental Accents */}
            <div className="absolute top-2 left-2 text-slate-400 text-xs font-serif">❖</div>
            <div className="absolute top-2 right-2 text-slate-400 text-xs font-serif">❖</div>
            <div className="absolute bottom-2 left-2 text-slate-400 text-xs font-serif">❖</div>
            <div className="absolute bottom-2 right-2 text-slate-400 text-xs font-serif">❖</div>

            {/* Official Garuda / Crest */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-2 text-amber-700 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-slate-800">
                  <path d="M50 5 L58 35 L88 35 L64 53 L73 83 L50 65 L27 83 L36 53 L12 35 L42 35 Z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-wide">
                {license.category === 'FOOD_ESTABLISHMENT' && license.foodSubtype === 'UNDER_200_SQM'
                  ? 'หนังสือรับรองการแจ้ง'
                  : 'ใบอนุญาต'}
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                ประกอบกิจการตามพระราชบัญญัติการสาธารณสุข พ.ศ. ๒๕๓๕
              </p>
              <div className="text-xs text-slate-600 mt-1 font-mono">
                เลขที่ใบอนุญาต: <span className="font-bold text-slate-900">{license.licenseNo}</span>
              </div>
            </div>

            {/* License Body */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-serif mt-6">
              <p className="indent-8 text-justify">
                เจ้าพนักงานสาธารณสุขได้ออกใบอนุญาตฉบับนี้ให้แก่{' '}
                <strong className="underline decoration-slate-400 underline-offset-4">
                  {license.ownerFullName}
                </strong>{' '}
                เลขประจำตัวประชาชน{' '}
                <strong className="font-mono">
                  {maskNationalId(license.ownerNationalId, currentSession.role, false)}
                </strong>{' '}
                อยู่บ้านเลขที่ {license.idCardAddress}
              </p>

              <p className="indent-8 text-justify">
                อนุญาตให้ประกอบกิจการประเภท{' '}
                <strong className="text-slate-900 bg-amber-100/60 px-1 py-0.5 rounded">
                  {license.categoryLabel}
                </strong>{' '}
                {license.foodSubtype === 'OVER_200_SQM' && '(พื้นที่เกิน ๒๐๐ ตารางเมตร)'}
                {license.foodSubtype === 'UNDER_200_SQM' && '(พื้นที่ไม่เกิน ๒๐๐ ตารางเมตร)'} ณ สถานประกอบการชื่อ{' '}
                <strong className="text-slate-900 font-bold underline decoration-slate-400 underline-offset-4">
                  "{license.businessName}"
                </strong>{' '}
                ตั้งอยู่เลขที่ {license.businessAddress}
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 font-sans">
                <div className="font-bold text-slate-800">เงื่อนไขเฉพาะตามกฎกระทรวงและข้อบัญญัติท้องถิ่น:</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-2">
                  <li>ต้องปฏิบัติตามมาตรฐานสุขอนามัยและมาตรการป้องกันมลพิษสิ่งแวดล้อมอย่างเคร่งครัด</li>
                  <li>ต้องแสดงใบอนุญาตนี้ไว้ในที่เปิดเผยและเห็นได้ง่าย ณ สถานประกอบการ</li>
                  <li>ใบอนุญาตมีอายุ ๑ ปี นับแต่วันที่ออกใบอนุญาต และต้องยื่นคำขอต่ออายุล่วงหน้าไม่น้อยกว่า ๓๐ วัน</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    วันที่ออกใบอนุญาต: <strong>{formatThaiDate(license.issueDate)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>
                    วันสิ้นอายุใบอนุญาต: <strong className="text-rose-700">{formatThaiDate(license.expiryDate)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Signature & Verification QR Code */}
            <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              {/* Left: QR Code Verification */}
              <div className="flex items-center space-x-3">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="E-License QR"
                    className="w-24 h-24 border border-slate-300 p-1 bg-white rounded-lg shadow-2xs"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>สแกนตรวจสอบความถูกต้อง</span>
                  </div>
                  <p className="text-slate-500">
                    ตรวจสอบสถานะใบอนุญาตและข้อมูลลายมือชื่อดิจิทัลแบบเรียลไทม์
                  </p>
                  <div className="font-mono text-[10px] text-slate-400">
                    Ref: {license.licenseNo.replace(/\//g, '-')}
                  </div>
                </div>
              </div>

              {/* Right: Official Digital Signature */}
              <div className="text-center sm:text-right font-serif">
                <div className="inline-block text-center min-w-[200px]">
                  {hasDigitalSignature ? (
                    <div className="mb-1 p-2 bg-emerald-50 border border-emerald-300 rounded-lg inline-block">
                      <div className="text-xs font-bold text-emerald-900 font-sans flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Digitally Signed</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        {license.eLicenseSignature?.signatoryName || 'นพ.เกียรติศักดิ์ เจริญผล'}
                      </div>
                      <div className="text-[9px] text-emerald-600 font-mono">
                        {license.eLicenseSignature?.signedAt || new Date().toLocaleString('th-TH')}
                      </div>
                    </div>
                  ) : (
                    <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-slate-400 text-xs italic">
                      ( รอลงนามดิจิทัล )
                    </div>
                  )}

                  <div className="text-xs font-bold text-slate-900 mt-1">
                    ( {license.approvedBy || 'นพ.เกียรติศักดิ์ เจริญผล'} )
                  </div>
                  <div className="text-[11px] text-slate-600">ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม</div>
                  <div className="text-[10px] text-slate-500">ปฏิบัติราชการแทนนายกเทศมนตรี</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>ค่าธรรมเนียม: {formatCurrency(license.feeAmount)} (ชำระแล้วผ่าน PromptPay)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
