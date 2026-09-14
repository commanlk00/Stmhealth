import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Calendar,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  X,
} from 'lucide-react';
import { getAuditLogs } from '../services/auditLogService';
import { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorIp.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Role', 'IP Address', 'Action', 'Category', 'Target Resource', 'Details', 'SHA256 Hash'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      `"${l.actorIp}"`,
      l.action,
      l.category,
      `"${l.targetResource}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.sha256Hash,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Log_Retention_90Days_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  ศูนย์บันทึกข้อมูลจราจรและประวัติการทำธุรกรรม (Centralized Audit Log)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  พ.ร.บ. คอมพิวเตอร์ฯ ๙๐ วัน
                </span>
              </div>
              <p className="text-xs text-slate-300">
                จัดเก็บประวัติการเข้าถึง (Who, When, What) พร้อมลงรหัสแฮช SHA-256 ป้องกันการแก้ไข
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

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหา Log ID, ผู้ปฏิบัติงาน, IP, หรือการกระทำ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">ทุกหมวดหมู่ (All Categories)</option>
              <option value="AUTH">AUTH (การยืนยันตัวตน)</option>
              <option value="LICENSE_ISSUE">LICENSE (การออก/ต่ออายุ)</option>
              <option value="PAYMENT">PAYMENT (ธุรกรรมการเงิน)</option>
              <option value="SECURITY">SECURITY (WAF & Security)</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกรายงาน (CSV)</span>
            </button>
          </div>
        </div>

        {/* Log Table Container */}
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">วัน-เวลา (Timestamp)</th>
                  <th className="p-3">ผู้กระทำ (Actor / Role)</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">การกระทำ (Action)</th>
                  <th className="p-3">รายละเอียด (Details)</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">SHA-256 Hash Chain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                      {log.timestamp}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                      {log.actorIp}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{log.details}</td>
                    <td className="p-3 whitespace-nowrap">
                      {log.status === 'SUCCESS' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          สำเร็จ (200 OK)
                        </span>
                      )}
                      {log.status === 'BLOCKED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          สกัดกั้น (403)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={log.sha256Hash}>
                      {log.sha256Hash.substring(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Log Storage เข้ารหัสแบบ Write-Once-Read-Many (WORM) เพื่อคุ้มครองพยานหลักฐานทางอิเล็กทรอนิกส์
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
