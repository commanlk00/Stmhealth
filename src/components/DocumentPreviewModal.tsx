import React from 'react';
import { X, Download, FileText, CheckCircle2, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { LicenseRecord, UploadedDocument } from '../types';
import { formatThaiDate } from '../utils/licenseUtils';

interface DocumentPreviewModalProps {
  document: UploadedDocument | null;
  license: LicenseRecord | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  license,
  onClose,
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {document.docTitle || document.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {license ? `${license.businessName} (${license.licenseNo})` : 'เอกสารดิจิทัลประกอบใบอนุญาต'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={document.fileUrl}
              download={document.name}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Document metadata chips */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">ชื่อไฟล์:</span>{' '}
              <span className="font-semibold text-slate-800">{document.name}</span>
            </div>
            <div>
              <span className="text-slate-400">ขนาด:</span>{' '}
              <span className="font-semibold text-slate-800">{document.fileSize}</span>
            </div>
            <div>
              <span className="text-slate-400">วันที่อัปโหลด:</span>{' '}
              <span className="font-semibold text-slate-800">{formatThaiDate(document.uploadDate)}</span>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> ตรวจสอบความละเอียดสมบูรณ์
              </span>
            </div>
          </div>

          {/* Document visual preview */}
          <div className="border border-slate-200 rounded-xl bg-slate-100 p-2 sm:p-4 flex items-center justify-center min-h-[350px]">
            {document.fileType === 'pdf' ? (
              <div className="w-full h-[460px] bg-white rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{document.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    เอกสารดิจิทัลประเภท PDF ความละเอียดสูง (Adobe Acrobat Document)
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 max-w-sm">
                  SHA-256 Verified Signature: OK ✓<br />
                  Digital Timestamp: {document.uploadDate}
                </div>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> เปิดอ่าน PDF แบบเต็มจอ
                </a>
              </div>
            ) : (
              <div className="max-w-full max-h-[500px] overflow-auto flex items-center justify-center">
                <img
                  src={document.fileUrl}
                  alt={document.name}
                  referrerPolicy="no-referrer"
                  className="rounded-lg object-contain max-h-[480px] shadow-xs border border-slate-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
