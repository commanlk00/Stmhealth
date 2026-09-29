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
  Clock,
  ThumbsUp,
  ThumbsDown,
  SlidersHorizontal,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { StaffAccount, StaffAccountStatus, UserRole, UserSession } from '../types';
import {
  getStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
  toggleStaffStatus,
  resetStaffPassword,
  approveStaffRegistration,
  rejectStaffRegistration,
  SYSTEM_PERMISSIONS,
  getDefaultPermissionsForRole,
} from '../services/staffService';
import { ROLE_PROFILES, canApproveStaff } from '../services/rbacService';

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
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCOUNTS'>('PENDING');
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
  const [formRole, setFormRole] = useState<UserRole>('DATA_ENTRY');
  const [formStatus, setFormStatus] = useState<StaffAccountStatus>('ACTIVE');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Approval & Permission Configuration Modal
  const [approvingAccount, setApprovingAccount] = useState<StaffAccount | null>(null);
  const [approvalAssignedRole, setApprovalAssignedRole] = useState<UserRole>('DATA_ENTRY');
  const [approvalPermissions, setApprovalPermissions] = useState<string[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Rejection Modal
  const [rejectingAccount, setRejectingAccount] = useState<StaffAccount | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

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

  const isAuthorizedApprover = canApproveStaff(currentSession.role);
  const pendingAccounts = accounts.filter((a) => a.status === 'PENDING');

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormUsername('');
    setFormPassword('GovPass#2026');
    setShowPassword(false);
    setFormName('');
    setFormPosition('เจ้าหน้าที่บันทึกข้อมูล');
    setFormDepartment('ฝ่ายสุขาภิบาลและอนามัยสิ่งแวดล้อม');
    setFormEmail('');
    setFormPhone('');
    setFormRole('DATA_ENTRY');
    setFormStatus('ACTIVE');
    setFormPermissions(getDefaultPermissionsForRole('DATA_ENTRY'));
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

  // Open Approval Dialog for Pending Applicant
  const handleOpenApproveModal = (acc: StaffAccount) => {
    setApprovingAccount(acc);
    const targetRole = acc.requestedRole || acc.role || 'DATA_ENTRY';
    setApprovalAssignedRole(targetRole);
    setApprovalPermissions(acc.allowedPermissions?.length ? acc.allowedPermissions : getDefaultPermissionsForRole(targetRole));
    setApprovalNotes(`อนุมัติและกำหนดสิทธิ์โดย ${currentSession.name} (${currentSession.roleTitle})`);
    setApprovalError(null);
  };

  // Confirm Approval and Role/Permissions Assignment
  const handleConfirmApproval = () => {
    if (!approvingAccount) return;
    setApprovalError(null);

    const res = approveStaffRegistration(
      approvingAccount.id,
      { name: currentSession.name, role: currentSession.role },
      approvalAssignedRole,
      approvalPermissions,
      approvalNotes
    );

    if (!res.success) {
      setApprovalError(res.error || 'เกิดข้อผิดพลาดในการอนุมัติ');
      return;
    }

    setApprovingAccount(null);
    reloadAccounts();
  };

  // Open Rejection Dialog
  const handleOpenRejectModal = (acc: StaffAccount) => {
    setRejectingAccount(acc);
    setRejectionReason('');
    setRejectionError(null);
  };

  // Confirm Rejection
  const handleConfirmRejection = () => {
    if (!rejectingAccount) return;
    if (!rejectionReason.trim()) {
      setRejectionError('กรุณาระบุเหตุผลในการปฏิเสธคำขอ');
      return;
    }

    const res = rejectStaffRegistration(
      rejectingAccount.id,
      { name: currentSession.name, role: currentSession.role },
      rejectionReason
    );

    if (!res.success) {
      setRejectionError(res.error || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
      return;
    }

    setRejectingAccount(null);
    reloadAccounts();
  };

  // Role change in form auto-populates defaults
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

  const handleApprovalRoleChange = (newRole: UserRole) => {
    setApprovalAssignedRole(newRole);
    setApprovalPermissions(getDefaultPermissionsForRole(newRole));
  };

  const handleTogglePermission = (permCode: string) => {
    setFormPermissions((prev) =>
      prev.includes(permCode) ? prev.filter((p) => p !== permCode) : [...prev, permCode]
    );
  };

  const handleToggleApprovalPermission = (permCode: string) => {
    setApprovalPermissions((prev) =>
      prev.includes(permCode) ? prev.filter((p) => p !== permCode) : [...prev, permCode]
    );
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
                  ระบบจัดการเจ้าหน้าที่และอนุมัติสิทธิ์ (Staff & Access Control)
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ระดับเจ้าพนักงานสาธารณสุขขึ้นไป
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ตรวจสอบคำขอลงทะเบียนของเจ้าหน้าที่บันทึกข้อมูล อนุมัติ และกำหนดสิทธิ์การเข้าถึงในระดับต่างๆ
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

        {/* Permission Check Notice if not authorized */}
        {!isAuthorizedApprover ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              ไม่มีสิทธิ์เข้าถึงส่วนงานอนุมัติเจ้าหน้าที่
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              เฉพาะผู้ใช้งานระดับ <span className="font-bold text-slate-700">เจ้าพนักงานสาธารณสุขปฏิบัติการ, ผู้อำนวยการกองสาธารณสุข, หรือผู้ดูแลระบบ</span> เท่านั้นที่มีอำนาจอนุมัติและกำหนดระดับสิทธิ์
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Navigation Tabs & Summary Badges */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 pt-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-2 ${
                    activeTab === 'PENDING'
                      ? 'bg-white border-slate-200 text-blue-700 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>คำขอรอการอนุมัติ</span>
                  {pendingAccounts.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                      {pendingAccounts.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('ACCOUNTS')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors flex items-center gap-2 ${
                    activeTab === 'ACCOUNTS'
                      ? 'bg-white border-slate-200 text-blue-700 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>บัญชีเจ้าหน้าที่ทั้งหมด ({accounts.length})</span>
                </button>
              </div>

              <div className="pb-2">
                <button
                  onClick={handleOpenAdd}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มเจ้าหน้าที่โดยตรง</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PENDING REQUESTS APPROVAL */}
            {activeTab === 'PENDING' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      รายการคำขอลงทะเบียนของเจ้าหน้าที่ใหม่:
                    </span>
                    <span>ผู้อนุมัติสามารถตรวจสอบคุณสมบัติและกำหนดสิทธิ์ก่อนเปิดใช้งาน</span>
                  </div>
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    รออนุมัติ {pendingAccounts.length} รายการ
                  </span>
                </div>

                {pendingAccounts.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <h4 className="text-sm font-bold text-slate-700">ไม่มีคำขอลงทะเบียนที่รอการอนุมัติ</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      เมื่อเจ้าหน้าที่บันทึกข้อมูลหรือเจ้าหน้าที่ใหม่ยื่นคำขอลงทะเบียนผ่านหน้าแรก รายชื่อจะปรากฏที่นี่ทันที
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="bg-white border-2 border-amber-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              รอการอนุมัติ (PENDING)
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{acc.name}</span>
                            <span className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              @{acc.username}
                            </span>
                            <span className="text-xs text-slate-500">
                              ตำแหน่ง: <span className="font-medium text-slate-800">{acc.position || 'เจ้าหน้าที่บันทึกข้อมูล'}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-slate-400 block text-[10px]">สังกัด / กอง:</span>
                              <span className="font-medium text-slate-800">{acc.department}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">เบอร์โทรศัพท์:</span>
                              <span className="font-medium text-slate-800">{acc.phone || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">อีเมล:</span>
                              <span className="font-medium text-slate-800">{acc.email || '-'}</span>
                            </div>
                          </div>

                          {acc.requestedReason && (
                            <div className="text-xs text-slate-600">
                              <span className="text-slate-400 text-[11px]">เหตุผลความจำเป็น: </span>
                              <span className="italic text-slate-700">"{acc.requestedReason}"</span>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>วันที่ยื่นคำขอ: {new Date(acc.createdAt).toLocaleString('th-TH')}</span>
                            <span>•</span>
                            <span>
                              สิทธิ์ที่ประสงค์ขอ:{' '}
                              <span className="font-semibold text-blue-700">
                                {ROLE_PROFILES[acc.requestedRole || acc.role]?.roleTitle || acc.roleTitle}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Approval Action Buttons */}
                        <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenApproveModal(acc)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>อนุมัติและกำหนดสิทธิ์</span>
                          </button>

                          <button
                            onClick={() => handleOpenRejectModal(acc)}
                            className="w-full sm:w-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>ปฏิเสธคำขอ</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ALL ACCOUNTS TABLE */}
            {activeTab === 'ACCOUNTS' && (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Search & Filter Bar */}
                <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white shrink-0">
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
                      <option value="DATA_ENTRY">เจ้าหน้าที่บันทึกข้อมูล</option>
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
                      <option value="ACTIVE">เปิดใช้งาน (Active)</option>
                      <option value="PENDING">รอการอนุมัติ (Pending)</option>
                      <option value="SUSPENDED">ระงับชั่วคราว (Suspended)</option>
                      <option value="REJECTED">ปฏิเสธคำขอ (Rejected)</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto p-4">
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
                            <th className="p-3 text-right">จัดการบัญชี</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {filteredAccounts.map((acc) => {
                            const isMasterAdmin = acc.username === 'infosser' || acc.username === 'admin';
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
                                    <span>{acc.email || '-'}</span>
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
                                        : acc.role === 'DATA_ENTRY'
                                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                                    }`}
                                  >
                                    {acc.roleTitle}
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    {acc.allowedPermissions?.length || 0} สิทธิ์การเข้าถึง
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="p-3 text-center">
                                  {acc.status === 'ACTIVE' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      เปิดใช้งาน
                                    </span>
                                  ) : acc.status === 'PENDING' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                      <Clock className="w-3 h-3" />
                                      รออนุมัติ
                                    </span>
                                  ) : acc.status === 'REJECTED' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                                      ปฏิเสธ
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      ระงับสิทธิ์
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {acc.status === 'PENDING' ? (
                                      <button
                                        onClick={() => handleOpenApproveModal(acc)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                      >
                                        <UserCheck className="w-3 h-3" />
                                        <span>อนุมัติ</span>
                                      </button>
                                    ) : (
                                      <>
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
                                      </>
                                    )}
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
              </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>ผู้อนุมัติปัจจุบัน: {currentSession.name} ({currentSession.roleTitle}) • มีอำนาจอนุมัติและกำหนดระดับสิทธิ์</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </>
        )}
      </div>

      {/* APPROVAL & PERMISSION CONFIGURATION MODAL (กำหนดสิทธิ์การเข้าถึงในระดับต่างๆ) */}
      {approvingAccount && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/75 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    อนุมัติคำขอลงทะเบียนและกำหนดสิทธิ์การเข้าถึง
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    กำหนดระดับบทบาท (Role) และสิทธิ์การเข้าถึงเมนูต่างๆ ให้แก่เจ้าหน้าที่
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovingAccount(null)}
                className="text-emerald-200 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {approvalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{approvalError}</span>
                </div>
              )}

              {/* Applicant Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{approvingAccount.name}</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Username: {approvingAccount.username}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>ตำแหน่ง: <span className="font-medium text-slate-800">{approvingAccount.position}</span></div>
                  <div>สังกัด: <span className="font-medium text-slate-800">{approvingAccount.department}</span></div>
                  <div>เบอร์โทร: <span className="font-medium text-slate-800">{approvingAccount.phone || '-'}</span></div>
                  <div>อีเมล: <span className="font-medium text-slate-800">{approvingAccount.email || '-'}</span></div>
                </div>
                {approvingAccount.requestedReason && (
                  <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-1.5 mt-1">
                    <span className="text-slate-400">เหตุผลที่ขอใช้งาน: </span>
                    <span className="italic">{approvingAccount.requestedReason}</span>
                  </div>
                )}
              </div>

              {/* 1. Assign Role Level */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-xs">
                  1. เลือกระดับบทบาทการใช้งาน (Assign Role Level): <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprovalRoleChange('DATA_ENTRY')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      approvalAssignedRole === 'DATA_ENTRY'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>เจ้าหน้าที่บันทึกข้อมูล (Data Entry)</span>
                      {approvalAssignedRole === 'DATA_ENTRY' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      รับคำขอ, คีย์ข้อมูลใบอนุญาต, อัปโหลดเอกสาร
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprovalRoleChange('OFFICER')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      approvalAssignedRole === 'OFFICER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>เจ้าพนักงานสาธารณสุขปฏิบัติการ</span>
                      {approvalAssignedRole === 'OFFICER' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      ตรวจสถานที่, บันทึกการต่ออายุ, อนุมัติสิทธิ์
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprovalRoleChange('FINANCE')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      approvalAssignedRole === 'FINANCE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>เจ้าพนักงานการเงินและบัญชี</span>
                      {approvalAssignedRole === 'FINANCE' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      ตรวจสอบสลิป, รับชำระ PromptPay, ออกใบเสร็จ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprovalRoleChange('DIRECTOR')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      approvalAssignedRole === 'DIRECTOR'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>ผู้อำนวยการกอง/ผู้บริหาร</span>
                      {approvalAssignedRole === 'DIRECTOR' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      อนุมัติออกใบอนุญาต, ลงนามดิจิทัล E-License
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Fine-grained Permissions Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    2. กำหนดสิทธิ์การเข้าถึงแบบละเอียด (Fine-grained Permissions):
                  </label>
                  <button
                    type="button"
                    onClick={() => setApprovalPermissions(getDefaultPermissionsForRole(approvalAssignedRole))}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ใช้สิทธิ์ตามมาตรฐานของ {approvalAssignedRole}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = approvalPermissions.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleApprovalPermission(perm.code)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-xs flex items-center justify-between">
                            <span>{perm.name}</span>
                            <span className="text-[9px] font-mono text-slate-400">{perm.category}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{perm.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Approval Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  บันทึกกำกับการอนุมัติ (Approval Notes):
                </label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="เช่น อนุมัติสิทธิ์เจ้าหน้าที่บันทึกข้อมูลประจำปีงบประมาณ 2569"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Approver Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ผู้อนุมัติ: <span className="font-bold">{currentSession.name}</span> ({currentSession.roleTitle})
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setApprovingAccount(null)}
                className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันอนุมัติและเปิดใช้งานบัญชี</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingAccount && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/75 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ปฏิเสธคำขอลงทะเบียน</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {rejectingAccount.name} ({rejectingAccount.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingAccount(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rejectionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {rejectionError}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                ระบุเหตุผลในการปฏิเสธคำขอ: <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="เช่น ไม่พบข้อมูลในสารบบเจ้าหน้าที่ของกองสาธารณสุข, กรอกข้อมูลไม่ถูกต้อง"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectingAccount(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                ยืนยันการปฏิเสธคำขอ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Account Modal (Direct creation by Approver) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
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

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
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
                    รหัสประจำตัวเจ้าหน้าที่ (Username / ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="เช่น sompong.s หรือ officer02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น นายสมใจ ดีจริง"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ตำแหน่งหน้าที่</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="เช่น เจ้าหน้าที่บันทึกข้อมูล"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ระดับบทบาท (Role)</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="DATA_ENTRY">เจ้าหน้าที่บันทึกข้อมูล (Data Entry)</option>
                    <option value="OFFICER">เจ้าพนักงานสาธารณสุขปฏิบัติการ</option>
                    <option value="FINANCE">เจ้าพนักงานการเงินและบัญชี</option>
                    <option value="DIRECTOR">ผู้อำนวยการกองสาธารณสุข/ผู้บริหาร</option>
                    <option value="AUDITOR_ADMIN">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะการใช้งาน</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StaffAccountStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="ACTIVE">เปิดใช้งาน (Active)</option>
                    <option value="SUSPENDED">ระงับชั่วคราว (Suspended)</option>
                    <option value="INACTIVE">ยังไม่เปิดใช้งาน (Inactive)</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สังกัด / กอง / ฝ่าย</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@localgov.go.th"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Fine-grained Permissions Selector */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800">
                    กำหนดสิทธิ์การเข้าถึงเมนูต่างๆ (Fine-grained Permissions)
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormPermissions(getDefaultPermissionsForRole(formRole))}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    รีเซ็ตตามบทบาท {formRole}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.code)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-xs">{perm.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{perm.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  {editingId ? 'บันทึกการแก้ไข' : 'สร้างบัญชีเจ้าหน้าที่'}
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
