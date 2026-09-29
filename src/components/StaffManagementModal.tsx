import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Search,
  Check,
  RefreshCw,
  X,
  Building,
  Mail,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { StaffAccount, StaffAccountStatus, UserRole, UserSession } from '../types';
import {
  getStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
  toggleStaffStatus,
  resetStaffPassword,
  SYSTEM_PERMISSIONS,
  getDefaultPermissionsForRole,
} from '../services/staffService';
import { ROLE_PROFILES } from '../services/rbacService';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onStaffAccountUpdated?: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onStaffAccountUpdated,
}) => {
  const [accounts, setAccounts] = useState<StaffAccount[]>(() => getStaffAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('OFFICER');
  const [formStatus, setFormStatus] = useState<StaffAccountStatus>('ACTIVE');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset Password Dialog State
  const [resetModalId, setResetModalId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const reloadAccounts = () => {
    const list = getStaffAccounts();
    setAccounts([...list]);
    if (onStaffAccountUpdated) onStaffAccountUpdated();
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormUsername('');
    setFormPassword('GovPass#2026');
    setShowPassword(false);
    setFormName('');
    setFormPosition('เจ้าพนักงานสาธารณสุข');
    setFormDepartment('ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม');
    setFormEmail('');
    setFormPhone('');
    setFormRole('OFFICER');
    setFormStatus('ACTIVE');
    setFormPermissions(getDefaultPermissionsForRole('OFFICER'));
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (acc: StaffAccount) => {
    setEditingId(acc.id);
    setFormUsername(acc.username);
    setFormPassword(acc.password);
    setShowPassword(false);
    setFormName(acc.name);
    setFormPosition(acc.position || '');
    setFormDepartment(acc.department);
    setFormEmail(acc.email);
    setFormPhone(acc.phone || '');
    setFormRole(acc.role);
    setFormStatus(acc.status);
    setFormPermissions(acc.allowedPermissions || getDefaultPermissionsForRole(acc.role));
    setFormNotes(acc.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Role change in form auto-populates defaults if desired
  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    setFormPermissions(getDefaultPermissionsForRole(newRole));
    const profile = ROLE_PROFILES[newRole];
    if (profile) {
      setFormDepartment(profile.department);
      if (!editingId) {
        setFormPosition(profile.roleTitle);
      }
    }
  };

  // Toggle permission check
  const handleTogglePermission = (permCode: string) => {
    setFormPermissions((prev) =>
      prev.includes(permCode)
        ? prev.filter((p) => p !== permCode)
        : [...prev, permCode]
    );
  };

  // Select all or preset
  const handleApplyRolePreset = () => {
    setFormPermissions(getDefaultPermissionsForRole(formRole));
  };

  // Submit Add / Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const adminActor = {
      name: currentSession.name,
      role: currentSession.role,
    };

    const roleInfo = ROLE_PROFILES[formRole];

    if (editingId) {
      // Update
      const res = updateStaffAccount(
        editingId,
        {
          username: formUsername,
          password: formPassword,
          name: formName,
          position: formPosition,
          department: formDepartment,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          roleTitle: roleInfo ? roleInfo.roleTitle : formRole,
          status: formStatus,
          allowedPermissions: formPermissions,
          notes: formNotes,
        },
        adminActor
      );

      if (!res.success) {
        setFormError(res.error || 'เกิดข้อผิดพลาดในการบันทึก');
        return;
      }
    } else {
      // Create
      const res = createStaffAccount(
        {
          username: formUsername,
          password: formPassword,
          name: formName,
          position: formPosition,
          department: formDepartment,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          roleTitle: roleInfo ? roleInfo.roleTitle : formRole,
          status: formStatus,
          allowedPermissions: formPermissions,
          notes: formNotes,
        },
        adminActor
      );

      if (!res.success) {
        setFormError(res.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
        return;
      }
    }

    setIsFormOpen(false);
    reloadAccounts();
  };

  // Toggle status
  const handleToggleStatus = (acc: StaffAccount) => {
    const nextStatus: StaffAccountStatus = acc.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = toggleStaffStatus(acc.id, nextStatus, {
      name: currentSession.name,
      role: currentSession.role,
    });
    if (!res.success) {
      alert(res.error);
    } else {
      reloadAccounts();
    }
  };

  // Delete staff
  const handleDeleteStaff = (acc: StaffAccount) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีเจ้าหน้าที่ "${acc.name} (${acc.username})"?`)) {
      return;
    }
    const res = deleteStaffAccount(acc.id, {
      name: currentSession.name,
      role: currentSession.role,
    });
    if (!res.success) {
      alert(res.error);
    } else {
      reloadAccounts();
    }
  };

  // Reset password submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalId) return;
    setResetError(null);
    setResetSuccess(null);

    const res = resetStaffPassword(resetModalId, newPasswordInput, {
      name: currentSession.name,
      role: currentSession.role,
    });

    if (!res.success) {
      setResetError(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } else {
      setResetSuccess('เปลี่ยนรหัสผ่านเจ้าหน้าที่สำเร็จแล้ว!');
      setTimeout(() => {
        setResetModalId(null);
        setResetSuccess(null);
        reloadAccounts();
      }, 1000);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || acc.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || acc.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const targetResetAccount = accounts.find((a) => a.id === resetModalId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  ระบบตั้งค่าและจัดการสิทธิ์การเข้าถึงเจ้าหน้าที่ (Staff Access Control)
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ผู้ดูแลระบบเป็นผู้สร้างและกำหนดรหัสประจำตัว (ID), รหัสผ่าน (Password) และสิทธิ์การใช้งานของเจ้าหน้าที่ทุกคน
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

        {/* Top Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-slate-500 font-medium">เจ้าหน้าที่ทั้งหมด</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{accounts.length} บัญชี</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              เปิดใช้งาน (Active)
            </div>
            <div className="text-xl font-bold text-emerald-800 mt-0.5">
              {accounts.filter((a) => a.status === 'ACTIVE').length} บัญชี
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
            <div className="text-rose-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              ระงับสิทธิ์ (Suspended)
            </div>
            <div className="text-xl font-bold text-rose-800 mt-0.5">
              {accounts.filter((a) => a.status === 'SUSPENDED').length} บัญชี
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex flex-col justify-center">
            <button
              onClick={handleOpenAdd}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มเจ้าหน้าที่ใหม่</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วย ID, ชื่อ-นามสกุล, ตำแหน่ง, หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกลำดับตำแหน่ง (All Roles)</option>
              <option value="OFFICER">เจ้าพนักงานสาธารณสุข</option>
              <option value="FINANCE">เจ้าพนักงานการเงิน</option>
              <option value="DIRECTOR">ผู้อำนวยการ/ผู้บริหาร</option>
              <option value="AUDITOR_ADMIN">ผู้ดูแลระบบ (Admin)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">ใช้งานอยู่ (Active)</option>
              <option value="SUSPENDED">ระงับชั่วคราว (Suspended)</option>
            </select>
          </div>
        </div>

        {/* Accounts Table List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">ไม่พบข้อมูลบัญชีเจ้าหน้าที่ตามเงื่อนไข</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-3">รหัสประจำตัว (ID)</th>
                    <th className="p-3">ชื่อ-นามสกุล / ตำแหน่ง</th>
                    <th className="p-3">สังกัด / แผนก</th>
                    <th className="p-3">บทบาทและสิทธิ์</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3">เข้าสู่ระบบล่าสุด</th>
                    <th className="p-3 text-right">จัดการบัญชี</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredAccounts.map((acc) => {
                    const isMasterAdmin = acc.username === 'admin';
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* ID / Username */}
                        <td className="p-3 font-mono font-bold text-blue-700">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 bg-blue-50 rounded border border-blue-200">
                              <Key className="w-3 h-3 text-blue-600" />
                            </span>
                            <span>{acc.username}</span>
                          </div>
                        </td>

                        {/* Name & Position */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{acc.name}</div>
                          <div className="text-[11px] text-slate-500">{acc.position || acc.roleTitle}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{acc.email}</span>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="p-3 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">{acc.department}</span>
                          </div>
                          {acc.phone && (
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{acc.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Role & Permissions Badge */}
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.role === 'DIRECTOR'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : acc.role === 'FINANCE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : acc.role === 'AUDITOR_ADMIN'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {acc.roleTitle}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {acc.allowedPermissions?.length || 0} สิทธิ์ที่อนุญาต
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          {acc.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              เปิดใช้งาน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              ระงับการใช้
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="p-3 text-[11px] text-slate-500">
                          {acc.lastLoginAt ? (
                            <div>
                              <div>{new Date(acc.lastLoginAt).toLocaleDateString('th-TH')}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(acc.lastLoginAt).toLocaleTimeString('th-TH')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">- ยังไม่เคยเข้า -</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(acc)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
                              title="แก้ไขข้อมูลและสิทธิ์การเข้าถึง"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => {
                                setResetModalId(acc.id);
                                setNewPasswordInput('');
                                setResetError(null);
                                setResetSuccess(null);
                              }}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors"
                              title="รีเซ็ตรหัสผ่านเจ้าหน้าที่"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Suspend / Active */}
                            <button
                              onClick={() => handleToggleStatus(acc)}
                              disabled={isMasterAdmin}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isMasterAdmin
                                  ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400'
                                  : acc.status === 'ACTIVE'
                                  ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                                  : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200'
                              }`}
                              title={
                                isMasterAdmin
                                  ? 'ไม่สามารถระงับบัญชีผู้ดูแลระบบหลัก'
                                  : acc.status === 'ACTIVE'
                                  ? 'คลิกเพื่อระงับบัญชี (Suspend)'
                                  : 'คลิกเพื่อเปิดใช้งานบัญชี (Activate)'
                              }
                            >
                              {acc.status === 'ACTIVE' ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteStaff(acc)}
                              disabled={isMasterAdmin}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isMasterAdmin
                                  ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400'
                                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                              }`}
                              title={isMasterAdmin ? 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก' : 'ลบบัญชีเจ้าหน้าที่'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>ทุกการเพิ่ม, ลบ, แก้ไข และรีเซ็ตรหัสผ่าน จะถูกบันทึกใน Audit Trail ตาม พ.ร.บ. คอมพิวเตอร์ฯ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Add / Edit Staff Account Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingId ? 'แก้ไขข้อมูลและสิทธิ์เจ้าหน้าที่' : 'เพิ่มบัญชีเจ้าหน้าที่ใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Username / ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รหัสประจำตัวเจ้าหน้าที่ (Login ID) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="เช่น officer02, finance03"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">ใช้เป็น Username ในการเข้าสู่ระบบ</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รหัสผ่านเข้าสู่ระบบ (Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {editingId ? 'สามารถระบุรหัสผ่านใหม่เพื่อแก้ไขได้ทันที' : 'แอดมินเป็นผู้กำหนดรหัสผ่านเริ่มต้น'}
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น นายสมเกียรติ มั่นคง"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Position Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ตำแหน่งหน้าที่</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="เช่น เจ้าพนักงานสาธารณสุขชำนาญการ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    บทบาทหลักในระบบ (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OFFICER">เจ้าพนักงานสาธารณสุขปฏิบัติการ (Officer)</option>
                    <option value="FINANCE">เจ้าพนักงานการเงินและบัญชี (Finance)</option>
                    <option value="DIRECTOR">ผู้อำนวยการกอง / ผู้บริหาร (Director)</option>
                    <option value="AUDITOR_ADMIN">ผู้ดูแลระบบและความมั่นคงปลอดภัย (Admin)</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สังกัด / ฝ่าย / กอง</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมลราชการ</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@localgov.go.th"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="02-123-4567 ต่อ 302"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">สถานะการอนุญาตเข้าใช้งาน</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={formStatus === 'ACTIVE'}
                      onChange={() => setFormStatus('ACTIVE')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-emerald-700">✓ เปิดใช้งาน (Active)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={formStatus === 'SUSPENDED'}
                      onChange={() => setFormStatus('SUSPENDED')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-rose-700">✗ ระงับการใช้งานชั่วคราว (Suspended)</span>
                  </label>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs">
                      กำหนดสิทธิ์การเข้าถึงแบบละเอียด (Access Permissions)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      เลือกสิทธิ์ที่เจ้าหน้าที่คนนี้ได้รับอนุญาตให้ดำเนินการ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyRolePreset}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    คืนค่าสิทธิ์ตามบทบาทมาตรฐาน
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.code)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-[11px]">
                          <div className="font-bold">{perm.name}</div>
                          <div className="text-[10px] text-slate-500 leading-tight">{perm.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุบันทึกโดยผู้ดูแลระบบ</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="เช่น มอบหมายหน้าที่ตรวจสอบหมวด 7.1 และ 7.2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  {editingId ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างบัญชีเจ้าหน้าที่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalId && targetResetAccount && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">รีเซ็ตรหัสผ่านเจ้าหน้าที่</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {targetResetAccount.name} ({targetResetAccount.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetModalId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสผ่านใหม่ (New Password)</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('Pass#' + Math.floor(100000 + Math.random() * 900000))}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>สุ่มรหัสผ่านอัตโนมัติ</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetModalId(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
