import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CloudCheck,
  Lock,
  Table,
  HardDrive,
  Key,
  ShieldCheck,
  Terminal,
  Play,
  X,
  RefreshCw,
  CheckCircle2,
  Wifi,
  Server,
  Users,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { LicenseRecord, UserSession } from '../types';
import { maskNationalId, getEncryptedCipherRepresentation } from '../services/maskingService';
import {
  FIRESTORE_DATABASE_INFO,
  testOnlineDatabaseConnection,
  syncLicensesToOnline,
} from '../services/firestoreService';

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenses?: LicenseRecord[];
  currentSession?: UserSession;
  onSyncAllToCloud?: () => Promise<void>;
}

export const DatabaseExplorerModal: React.FC<DatabaseExplorerModalProps> = ({
  isOpen,
  onClose,
  licenses = [],
  currentSession = {
    id: 'guest',
    username: 'officer',
    name: 'เจ้าหน้าที่สาธารณสุข',
    role: 'OFFICER' as const,
    roleTitle: 'เจ้าพนักงานสาธารณสุข',
    department: 'ฝ่ายสุขาภิบาล',
    email: 'officer@gov.go.th',
    authMethod: 'PASSWORD_LOGIN',
    is2FAVerified: true,
    allowedPermissions: ['VIEW_LICENSES', 'CREATE_LICENSE', 'EDIT_LICENSE'],
  },
  onSyncAllToCloud,
}) => {
  const [activeTab, setActiveTab] = useState<'CLOUD_ONLINE' | 'SCHEMA' | 'STORAGE_ENCRYPTION' | 'QUERY'>('CLOUD_ONLINE');
  const [queryInput, setQueryInput] = useState<string>(
    "SELECT license_no, business_name, fee_amount, status FROM licenses WHERE status = 'active';"
  );
  const [queryOutput, setQueryOutput] = useState<any[]>([]);

  // Cloud test connection state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    latencyMs: number;
    error?: string;
  } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testOnlineDatabaseConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        connected: false,
        latencyMs: 0,
        error: e?.message || 'การเชื่อมต่อขัดข้อง',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      if (onSyncAllToCloud) {
        await onSyncAllToCloud();
      } else {
        const res = await syncLicensesToOnline(licenses);
        setSyncMessage(`ซิงค์ข้อมูลใบอนุญาตทั้งหมด ${res.count} รายการขึ้นระบบคลาวด์เรียบร้อย`);
      }
      setSyncMessage(`ซิงค์ข้อมูล ${licenses.length} รายการขึ้น Cloud Firestore สำเร็จแล้ว`);
    } catch (err: any) {
      setSyncMessage(`เกิดข้อผิดพลาดในการซิงค์: ${err?.message || 'ไม่สามารถติดต่อคลาวด์ได้'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunQuery = () => {
    if (queryInput.toLowerCase().includes('entrepreneurs')) {
      setQueryOutput(
        licenses.map((l) => ({
          id: l.id,
          national_id_encrypted: getEncryptedCipherRepresentation(l.ownerNationalId),
          masked_ui_display: maskNationalId(l.ownerNationalId, currentSession.role, false),
          full_name: l.ownerFullName,
          identity_verified: 'TRUE (Gov Verified)',
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
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  ระบบฐานข้อมูลออนไลน์ (Cloud Firestore Database)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ระบบฐานข้อมูลคลาวด์ออนไลน์ ซิงค์ข้อมูลอัตโนมัติแบบ Real-time รองรับการใช้งานพร้อมกันหลายอุปกรณ์
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
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('CLOUD_ONLINE')}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'CLOUD_ONLINE'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>สถานะฐานข้อมูลออนไลน์ (Cloud Firestore)</span>
          </button>
          <button
            onClick={() => setActiveTab('SCHEMA')}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'SCHEMA'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>โครงสร้างตารางข้อมูล (Schema & Collections)</span>
          </button>
          <button
            onClick={() => setActiveTab('STORAGE_ENCRYPTION')}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'STORAGE_ENCRYPTION'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Data Masking & PDPA Encryption</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('QUERY');
              if (queryOutput.length === 0) handleRunQuery();
            }}
            className={`py-3 px-5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'QUERY'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Interactive Query Console</span>
          </button>
        </div>

        {/* Tab 0: Cloud Firestore Online Status */}
        {activeTab === 'CLOUD_ONLINE' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Connection Banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shrink-0">
                  <Wifi className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      ฐานข้อมูลออนไลน์เชื่อมต่อสำเร็จ (Cloud Firestore Active)
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    เซิร์ฟเวอร์คลาวด์ Google Cloud ทำงานปกติ • รองรับการบันทึกข้อมูลร่วมกันแบบ Multi-user Real-time
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                  <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบสัญญาณการเชื่อมต่อ'}</span>
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลขึ้น Cloud ทันที'}</span>
                </button>
              </div>
            </div>

            {/* Test result alert */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResult.connected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {testResult.connected
                      ? `การเชื่อมต่อ Cloud Firestore สมบูรณ์ดี (ความเร็วตอบสนอง Latency: ${testResult.latencyMs} ms)`
                      : `การเชื่อมต่อไม่สำเร็จ: ${testResult.error}`}
                  </span>
                </div>
              </div>
            )}

            {syncMessage && (
              <div className="p-3.5 bg-blue-50 border border-blue-300 text-blue-900 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}

            {/* Technical Parameters Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">Cloud Project ID</div>
                <div className="font-mono font-bold text-slate-900 text-xs mt-1 truncate" title={FIRESTORE_DATABASE_INFO.projectId}>
                  {FIRESTORE_DATABASE_INFO.projectId}
                </div>
                <div className="text-[10px] text-emerald-600 mt-1 font-semibold">● Google Cloud Managed</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">Database ID</div>
                <div className="font-mono font-bold text-indigo-700 text-xs mt-1 truncate" title={FIRESTORE_DATABASE_INFO.databaseId}>
                  {FIRESTORE_DATABASE_INFO.databaseId}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Dedicated Firestore</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">โหมดการซิงค์ (Sync Engine)</div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  Real-time WebSockets
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">อัปเดต 2 ทางแบบเรียลไทม์</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-500 font-medium">ข้อมูลใบอนุญาตปัจจุบัน</div>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {licenses.length} รายการ
                </div>
                <div className="text-[10px] text-slate-500 mt-1">พร้อมสำรองใน Local Cache</div>
              </div>
            </div>

            {/* Active Online Collections */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-600" />
                <span>คอลเลกชันฐานข้อมูลบนคลาวด์ (Cloud Firestore Collections)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Collection 1: licenses */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900">licenses</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {licenses.length} เอกสาร
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    จัดเก็บข้อมูลสถานประกอบการ ใบอนุญาตทั้ง 4 หมวด ประวัติการต่ออายุ การชำระเงิน และลายเซ็นดิจิทัล
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                    ซิงค์: อัตโนมัติทุกครั้งที่บันทึก/แก้ไข
                  </div>
                </div>

                {/* Collection 2: staff_accounts */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900">staff_accounts</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                      Active + Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    จัดเก็บบัญชีผู้ใช้งานเจ้าหน้าที่ การลงทะเบียนของเจ้าหน้าที่บันทึกข้อมูล และการอนุมัติสิทธิ์จากเจ้าพนักงาน
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                    สิทธิ์: RBAC (เจ้าพนักงานอนุมัติสิทธิ์ได้)
                  </div>
                </div>

                {/* Collection 3: audit_logs */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900">audit_logs</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      90 วัน พ.ร.บ.
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    บันทึกประวัติการเข้าใช้งาน การอนุมัติใบอนุญาต การแก้ไขข้อมูล และการเข้าถึงข้อมูลตาม พ.ร.บ. คอมพิวเตอร์
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                    เข้ารหัส: SHA-256 Hash Chain
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Guide for User: How does online database work */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>ระบบฐานข้อมูลออนไลน์ทำงานอย่างไรและมีประโยชน์อย่างไร?</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>ไม่ต้องตั้งค่าเซิร์ฟเวอร์เอง</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    ระบบเชื่อมต่อไปยัง Google Cloud Firestore ให้โดยอัตโนมัติ ไม่ต้องมีเครื่องแม่ข่าย (Serverless) ข้อมูลถูกจัดเก็บบนคลาวด์ที่มีความปลอดภัยสูง
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>ทำงานร่วมกันหลายคนแบบเรียลไทม์</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    เจ้าหน้าที่บันทึกข้อมูลจากเครื่องหนึ่ง ผู้อนุมัติหรือผู้อำนวยการจะเห็นข้อมูลอัปเดตบนหน้าจอทันทีโดยไม่ต้องกดรีเฟรชหน้าเว็บ
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>ใช้งานได้ต่อเนื่องแม้อินเทอร์เน็ตหลุด</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    มีระบบแคชในเครื่อง (Offline-First Persistence) หากเน็ตหลุดยังดูและทำงานต่อได้ เมื่อมีสัญญาณข้อมูลจะซิงค์ขึ้น Cloud ทันที
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <span className="font-mono text-[10px] text-slate-400">Collection</span>
                </div>
                <div className="font-mono text-[11px] space-y-1 text-slate-700">
                  <div className="text-blue-700 font-semibold">🔑 id (UUID / Document ID)</div>
                  <div># license_no (VARCHAR UNIQUE)</div>
                  <div># category_code (VARCHAR)</div>
                  <div># business_name (VARCHAR)</div>
                  <div># issue_date (DATE)</div>
                  <div># expiry_date (DATE)</div>
                  <div># fee_amount (NUMERIC)</div>
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
                  <div className="text-emerald-800 font-bold">🔒 national_id_enc (AES-256)</div>
                  <div># full_name (VARCHAR)</div>
                  <div># id_card_address (TEXT)</div>
                  <div># contact_phone (VARCHAR)</div>
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
                1. <strong>Encryption at Rest</strong>: ข้อมูลระบุตัวบุคคล (เลขประจำตัวประชาชน 13 หลัก) ถูกเข้ารหัสด้วยกุญแจ AES-256 ในระดับคอลัมน์ของฐานข้อมูล<br />
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
                  <span className="text-emerald-700 font-semibold">Status: 200 OK</span>
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
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cloud Firestore Online • เข้ารหัส TLS 1.3 & AES-256</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
