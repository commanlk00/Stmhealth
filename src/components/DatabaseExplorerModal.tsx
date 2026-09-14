import React, { useState } from 'react';
import {
  Database,
  Lock,
  Eye,
  EyeOff,
  Table,
  HardDrive,
  Key,
  ShieldCheck,
  Terminal,
  Play,
  FileCode,
  Layers,
  X,
} from 'lucide-react';
import { LicenseRecord, UserSession } from '../types';
import { maskNationalId, getEncryptedCipherRepresentation } from '../services/maskingService';

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenses: LicenseRecord[];
  currentSession: UserSession;
}

export const DatabaseExplorerModal: React.FC<DatabaseExplorerModalProps> = ({
  isOpen,
  onClose,
  licenses,
  currentSession,
}) => {
  const [activeTab, setActiveTab] = useState<'SCHEMA' | 'QUERY' | 'STORAGE_ENCRYPTION'>('SCHEMA');
  const [selectedTable, setSelectedTable] = useState<'licenses' | 'entrepreneurs' | 'payment_transactions'>('licenses');
  const [queryInput, setQueryInput] = useState<string>(
    "SELECT license_no, business_name, fee_amount, status FROM licenses WHERE status = 'active';"
  );
  const [queryOutput, setQueryOutput] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleRunQuery = () => {
    // Basic simulator
    if (queryInput.toLowerCase().includes('entrepreneurs')) {
      setQueryOutput(
        licenses.map((l) => ({
          id: l.id,
          national_id_encrypted: getEncryptedCipherRepresentation(l.ownerNationalId),
          masked_ui_display: maskNationalId(l.ownerNationalId, currentSession.role, false),
          full_name: l.ownerFullName,
          thaid_verified: 'TRUE (DOPA Cert)',
        }))
      );
    } else if (queryInput.toLowerCase().includes('payment')) {
      setQueryOutput(
        licenses.map((l) => ({
          tx_id: `TX-${l.id.toUpperCase()}`,
          license_no: l.licenseNo,
          amount_thb: l.feeAmount,
          payment_method: 'PROMPTPAY_QR_EMVCO',
          gateway_ref: l.promptpayRef || 'PP-DIRECT-8921',
          status: l.paymentStatus.toUpperCase(),
        }))
      );
    } else {
      setQueryOutput(
        licenses.map((l) => ({
          license_no: l.licenseNo,
          business_name: l.businessName,
          category: l.category,
          expiry_date: l.expiryDate,
          status: l.status,
          e_signature: l.eLicenseSignature?.isValid ? 'SIGNED_VALID' : 'PENDING_SIGN',
        }))
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  สถาปัตยกรรมฐานข้อมูลเชิงสัมพันธ์และการเข้ารหัส (Data & Storage Tier)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  PostgreSQL 16 + AES-256
                </span>
              </div>
              <p className="text-xs text-slate-300">
                โครงสร้างตารางข้อมูล พ.ร.บ. แต่ละกลุ่มกิจการ, Data Masking Engine, และ Object Storage Access Control
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SCHEMA')}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'SCHEMA'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>โครงสร้างตารางเชิงสัมพันธ์ (Relational Schema)</span>
          </button>
          <button
            onClick={() => setActiveTab('STORAGE_ENCRYPTION')}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'STORAGE_ENCRYPTION'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Data Masking & Encryption at Rest (PDPA)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('QUERY');
              if (queryOutput.length === 0) handleRunQuery();
            }}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'QUERY'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Interactive Query Console</span>
          </button>
        </div>

        {/* Tab 1: Relational Schema View */}
        {activeTab === 'SCHEMA' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Table: licenses */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-blue-600" />
                    <span>licenses (ใบอนุญาต)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">InnoDB/PG</span>
                </div>
                <div className="font-mono text-[11px] space-y-1 text-slate-700">
                  <div className="text-blue-700 font-semibold">🔑 id (UUID PRIMARY KEY)</div>
                  <div># license_no (VARCHAR UNIQUE)</div>
                  <div># category_code (VARCHAR FK)</div>
                  <div># business_name (VARCHAR)</div>
                  <div># issue_date (DATE)</div>
                  <div># expiry_date (DATE)</div>
                  <div># fee_amount (NUMERIC(10,2))</div>
                  <div># status (ENUM)</div>
                  <div># digital_signature_hash (TEXT)</div>
                </div>
              </div>

              {/* Table: entrepreneurs */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>entrepreneurs (ผู้ประกอบการ)</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 font-semibold">ENCRYPTED</span>
                </div>
                <div className="font-mono text-[11px] space-y-1 text-slate-700">
                  <div className="text-blue-700 font-semibold">🔑 id (UUID PRIMARY KEY)</div>
                  <div className="text-emerald-800 font-bold">🔒 national_id_enc (BYTEA AES-256)</div>
                  <div># full_name (VARCHAR)</div>
                  <div># id_card_address (TEXT)</div>
                  <div># contact_phone (VARCHAR)</div>
                  <div># thaid_sub_id (VARCHAR)</div>
                  <div># verified_at (TIMESTAMPTZ)</div>
                </div>
              </div>

              {/* Table: payment_transactions */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-purple-600" />
                    <span>payment_transactions</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Ledger</span>
                </div>
                <div className="font-mono text-[11px] space-y-1 text-slate-700">
                  <div className="text-blue-700 font-semibold">🔑 id (UUID PRIMARY KEY)</div>
                  <div>🔗 license_id (UUID FK)</div>
                  <div># amount (NUMERIC(10,2))</div>
                  <div># payment_method ('PROMPTPAY')</div>
                  <div># webhook_signature (VARCHAR)</div>
                  <div># gateway_ref (VARCHAR)</div>
                  <div># paid_timestamp (TIMESTAMPTZ)</div>
                </div>
              </div>
            </div>

            {/* Object Storage Access Control Details */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    การจัดการสิทธิ์การเข้าถึงไฟล์เอกสาร (Object Storage Access Control)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Time-Limited Pre-Signed URLs
                </span>
              </div>
              <p className="text-xs text-slate-600">
                ไฟล์แนบหลักฐาน (เช่น สำเนาบัตรประชาชน, สัญญาเช่า, แผนผังบ่อดักไขมัน) และไฟล์ E-License PDF จะถูกจัดเก็บใน Private Object Storage Bucket ที่ปิดการเข้าถึงแบบ Public ทั้งหมด โดยการดาวน์โหลดต้องผ่าน URL ที่ลงรหัสลายเซ็น (Pre-Signed URL) มีอายุจำกัด ๑๕ นาที
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                https://storage.localgov.go.th/licenses/docs/plan-food-2026.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900&X-Amz-Signature=89f01ab3c...
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Storage Encryption & Data Masking Engine */}
        {activeTab === 'STORAGE_ENCRYPTION' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>หลักการทำงานของ Data Masking Engine ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
              </div>
              <p className="text-indigo-900 leading-relaxed">
                1. <strong>Encryption at Rest</strong>: ข้อมูลระบุตัวบุคคล (เลขประจำตัวประชาชน 13 หลัก) ถูกเข้ารหัสด้วยกุญแจ AES-256-GCM ในระดับคอลัมน์ของฐานข้อมูล<br />
                2. <strong>Dynamic Presentation Masking</strong>: เมื่อส่งข้อมูลขึ้นมาแสดงผล ระบบจะตรวจสอบสิทธิ์ของ Role ปัจจุบัน ({currentSession.roleTitle}) เพื่อกำหนดว่าตัวเลขหลักใดจะถูก Mask ด้วยเครื่องหมาย 'X'
              </p>
            </div>

            {/* Comparison Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ชื่อสถานประกอบการ</th>
                    <th className="p-3">ชื่อเจ้าของ</th>
                    <th className="p-3 font-mono text-emerald-800">Database Cipher (Encrypted at Rest)</th>
                    <th className="p-3">UI Presentation (Masked for {currentSession.role})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {licenses.slice(0, 4).map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{lic.businessName}</td>
                      <td className="p-3 text-slate-700">{lic.ownerFullName}</td>
                      <td className="p-3 font-mono text-[11px] text-emerald-700 bg-emerald-50/40">
                        {getEncryptedCipherRepresentation(lic.ownerNationalId)}
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-blue-900">
                        {maskNationalId(lic.ownerNationalId, currentSession.role, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive SQL Query Console */}
        {activeTab === 'QUERY' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>SQL Query Editor (Read-only Database Replica)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setQueryInput("SELECT license_no, business_name, fee_amount, status FROM licenses;")
                    }
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    โหลด: ตาราง licenses
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setQueryInput("SELECT * FROM entrepreneurs;")}
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    โหลด: ตาราง entrepreneurs
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleRunQuery}
                  className="absolute right-3 bottom-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute SQL</span>
                </button>
              </div>
            </div>

            {/* Query Output */}
            {queryOutput.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 p-2.5 px-4 font-mono text-[11px] text-slate-600 flex justify-between">
                  <span>Query Result: {queryOutput.length} rows returned</span>
                  <span className="text-emerald-700 font-semibold">Status: 200 OK (Execution: 4ms)</span>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        {Object.keys(queryOutput[0] || {}).map((col) => (
                          <th key={col} className="p-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {queryOutput.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(row).map((val: any, cIdx) => (
                            <td key={cIdx} className="p-2.5 whitespace-nowrap text-slate-800">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>ความมั่นคงปลอดภัยฐานข้อมูลและการป้องกันข้อมูลส่วนบุคคลรั่วไหล (Data Leak Prevention)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
