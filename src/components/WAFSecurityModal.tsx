import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Database,
  Lock,
  Zap,
  Activity,
  AlertTriangle,
  Play,
  Terminal,
  CheckCircle2,
  Server,
  Network,
  X,
} from 'lucide-react';
import { getWAFStats, simulateAttackTest } from '../services/wafService';
import { WAFSecurityStats } from '../types';

interface WAFSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThreatLogged?: () => void;
}

export const WAFSecurityModal: React.FC<WAFSecurityModalProps> = ({
  isOpen,
  onClose,
  onThreatLogged,
}) => {
  const [stats, setStats] = useState<WAFSecurityStats>(() => getWAFStats());
  const [testResult, setTestResult] = useState<{
    blocked: boolean;
    ruleTriggered: string;
    mitigation: string;
  } | null>(null);
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = (attackType: 'SQLI' | 'DDOS' | 'XSS' | 'PATH_TRAVERSAL') => {
    setActiveSimulation(attackType);
    setTimeout(() => {
      const res = simulateAttackTest(attackType);
      setTestResult(res);
      setStats(getWAFStats());
      setActiveSimulation(null);
      if (onThreatLogged) onThreatLogged();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  WAF & Reverse Proxy Threat Monitor
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SHIELD ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบ Web Application Firewall ป้องกัน DDoS, SQL Injection และ OWASP Top 10 อัตโนมัติ
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">คำขอที่ผ่านการตรวจ</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {stats.totalInspectedRequests.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">100% Inspected</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">ภัยคุกคามที่สกัดกั้น</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {stats.blockedAttacks.toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-300 mt-1">HTTP 403 Dropped</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">SQL Injection Block</span>
                <Database className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-300">
                {stats.sqlInjectionBlocks.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">OWASP Rule 942100</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">DDoS & Layer 7 Flood</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-300">
                {stats.ddosMitigatedCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Rate Limit Shield</div>
            </div>
          </div>

          {/* TLS & Infrastructure Specs */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">การเข้ารหัสช่องทางสื่อสาร (Transport Layer):</span>
                <span className="text-slate-400 ml-1 font-mono">{stats.tlsVersion}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-emerald-400 font-semibold font-mono text-[11px]">HSTS 31536000s</span>
            </div>
          </div>

          {/* Last Threat Detected */}
          {stats.lastThreatDetected && (
            <div className="bg-rose-950/30 border border-rose-900/60 p-4 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>การสกัดกั้นการโจมตีล่าสุด (Latest Incident Mitigated)</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {stats.lastThreatDetected.timestamp}
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                Type: <span className="text-rose-300">{stats.lastThreatDetected.type}</span>
                <br />
                Source IP:{' '}
                <span className="text-amber-400">{stats.lastThreatDetected.sourceIp}</span>
                <br />
                Mitigation:{' '}
                <span className="text-emerald-400">{stats.lastThreatDetected.actionTaken}</span>
              </div>
            </div>
          )}

          {/* Interactive Threat Simulator Bench */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>ห้องทดสอบระบบตรวจจับการโจมตี (WAF Attack Simulator)</span>
              </h3>
              <span className="text-[11px] text-slate-500">ทดสอบยิงเพย์โหลดและดูผลการสกัดกั้นทันที</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSimulate('SQLI')}
                disabled={Boolean(activeSimulation)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl text-left transition-all hover:border-amber-500/50"
              >
                <div className="font-bold text-amber-300 mb-0.5">SQL Injection</div>
                <div className="text-[10px] text-slate-400 font-mono">' OR 1=1 --</div>
              </button>

              <button
                onClick={() => handleSimulate('DDOS')}
                disabled={Boolean(activeSimulation)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl text-left transition-all hover:border-purple-500/50"
              >
                <div className="font-bold text-purple-300 mb-0.5">DDoS L7 Flood</div>
                <div className="text-[10px] text-slate-400 font-mono">1,400 req/sec</div>
              </button>

              <button
                onClick={() => handleSimulate('XSS')}
                disabled={Boolean(activeSimulation)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl text-left transition-all hover:border-blue-500/50"
              >
                <div className="font-bold text-blue-300 mb-0.5">OWASP XSS</div>
                <div className="text-[10px] text-slate-400 font-mono">&lt;script&gt;alert</div>
              </button>

              <button
                onClick={() => handleSimulate('PATH_TRAVERSAL')}
                disabled={Boolean(activeSimulation)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-xl text-left transition-all hover:border-emerald-500/50"
              >
                <div className="font-bold text-emerald-300 mb-0.5">Path Traversal</div>
                <div className="text-[10px] text-slate-400 font-mono">../../etc/passwd</div>
              </button>
            </div>

            {/* Test Execution Output */}
            {testResult && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WAF ได้ทำการตรวจจับและสกัดกั้นการโจมตีสำเร็จ!</span>
                </div>
                <div className="font-mono text-[11px] text-slate-300">
                  Triggered: <span className="text-amber-300">{testResult.ruleTriggered}</span>
                </div>
                <div className="text-slate-400 text-[11px]">{testResult.mitigation}</div>
                <div className="text-[10px] text-emerald-300/80 mt-1">
                  ✓ บันทึกหลักฐานดิจิทัลลงใน Log พ.ร.บ. คอมพิวเตอร์ฯ (มาตรา ๒๖) เรียบร้อย
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Reverse Proxy Cluster (Nginx + ModSecurity v3)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
