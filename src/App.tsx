import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { LicenseTable } from './components/LicenseTable';
import { AddEditLicenseModal } from './components/AddEditLicenseModal';
import { RenewalModal } from './components/RenewalModal';
import { PromptPayModal } from './components/PromptPayModal';
import { LicenseDetailModal } from './components/LicenseDetailModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SecurityPinModal } from './components/SecurityPinModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { AuthModal } from './components/AuthModal';
import { WAFSecurityModal } from './components/WAFSecurityModal';
import { AuditLogModal } from './components/AuditLogModal';
import { DatabaseExplorerModal } from './components/DatabaseExplorerModal';
import { ELicenseModal } from './components/ELicenseModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { StaffRegisterModal } from './components/StaffRegisterModal';
import { LicenseRecord, UploadedDocument, UserSession, DigitalSignature } from './types';
import { getStoredLicenses, saveStoredLicenses, loadDemoLicenses, clearAllLicenses } from './data/mockLicenses';
import {
  subscribeToOnlineLicenses,
  saveLicenseOnline,
  syncLicensesToOnline,
} from './services/firestoreService';
import { initStaffAccountsListener } from './services/staffService';
import { googleSignIn, initAuth, logout, signInAsOfficer } from './services/firebaseAuth';
import { getCurrentSession, saveCurrentSession, hasPermission } from './services/rbacService';
import { recordAuditLog } from './services/auditLogService';
import {
  createLicenseSpreadsheet,
  syncAllLicensesToGoogleSheet,
  updateLicenseRenewalInGoogleSheet,
} from './services/sheetsService';
import { getDaysRemaining } from './utils/licenseUtils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Licenses data
  const [licenses, setLicenses] = useState<LicenseRecord[]>(() => getStoredLicenses());

  // RBAC User Session State
  const [currentSession, setCurrentSession] = useState<UserSession>(() => getCurrentSession());

  // Google Auth & Workspace state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() =>
    localStorage.getItem('gov_sheet_id')
  );
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() =>
    localStorage.getItem('gov_sheet_url')
  );
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);

  // PDPA Security PIN (Masking national IDs)
  const [isSecurityUnlocked, setIsSecurityUnlocked] = useState<boolean>(false);

  // Table status filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedLicenseForEdit, setSelectedLicenseForEdit] = useState<LicenseRecord | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  // Security & Infrastructure Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [isStaffRegisterModalOpen, setIsStaffRegisterModalOpen] = useState<boolean>(false);
  const [isWAFModalOpen, setIsWAFModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  const [selectedLicenseForDetail, setSelectedLicenseForDetail] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForRenewal, setSelectedLicenseForRenewal] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForPayment, setSelectedLicenseForPayment] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForNotification, setSelectedLicenseForNotification] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForELicense, setSelectedLicenseForELicense] = useState<LicenseRecord | null>(null);
  const [previewDocState, setPreviewDocState] = useState<{
    doc: UploadedDocument;
    license: LicenseRecord;
  } | null>(null);

  // Toast / System feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        // Keep local state unchanged if not explicitly logged out
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time synchronization with Cloud Firestore online database
  useEffect(() => {
    const unsubscribe = subscribeToOnlineLicenses(
      (onlineLicenses) => {
        if (onlineLicenses && onlineLicenses.length > 0) {
          setLicenses(onlineLicenses);
          saveStoredLicenses(onlineLicenses);
        }
      },
      (err) => {
        console.warn('Real-time Firestore subscription notice:', err);
      }
    );

    // Also subscribe to staff accounts in real-time
    const unsubscribeStaff = initStaffAccountsListener();

    return () => {
      unsubscribe();
      unsubscribeStaff();
    };
  }, []);

  // Save changes to localStorage whenever licenses change
  const updateLicensesState = (updater: (prev: LicenseRecord[]) => LicenseRecord[]) => {
    setLicenses((prev) => {
      const updated = updater(prev);
      saveStoredLicenses(updated);
      return updated;
    });
  };

  // Sync all licenses to Cloud Firestore
  const handleSyncAllToCloud = async () => {
    const res = await syncLicensesToOnline(licenses);
    showToast(`ซิงค์ข้อมูลทั้งหมด ${res.count} รายการขึ้น Cloud Firestore เรียบร้อย`);
  };

  // Demo Data handler (Optional import for testing)
  const handleLoadDemoData = () => {
    const demos = loadDemoLicenses();
    setLicenses([...demos]);
    showToast(`นำเข้าข้อมูลตัวอย่าง ${demos.length} รายการสำหรับทดสอบระบบเรียบร้อย`);
  };

  const handleClearLicenses = () => {
    clearAllLicenses();
    setLicenses([]);
    showToast('ล้างข้อมูลทั้งหมด ฐานข้อมูลว่างเปล่าพร้อมใช้งานจริง', 'info');
  };

  // Google Login Handler
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user as User);
        setToken(res.accessToken);
        showToast(`เข้าสู่ระบบในชื่อ ${res.user.displayName || res.user.email} สำเร็จ`);
      } else {
        // User closed or cancelled popup window
        showToast('ยกเลิกการเข้าสู่ระบบ (หน้าต่างถูกปิด)', 'info');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      showToast(msg || 'เข้าสู่ระบบไม่สำเร็จ กรุณาอนุญาตป๊อปอัปหรือลองใหม่อีกครั้ง', 'warning');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Session & RBAC Switcher
  const handleSessionChange = (newSession: UserSession) => {
    setCurrentSession(newSession);
    saveCurrentSession(newSession);
    recordAuditLog({
      action: 'LOGIN',
      resource: 'AUTH',
      actor: newSession.name,
      actorRole: newSession.role,
      status: 'SUCCESS',
      details: `สลับบทบาทผู้ใช้งานเป็น ${newSession.roleTitle} (${newSession.authMethod || 'MOCK'})`,
    });
    showToast(`สลับบทบาทเป็น: ${newSession.roleTitle}`);
  };

  // Quick Officer Sign-in (for quick testing without Google popup)
  const handleOfficerLogin = () => {
    const officer = signInAsOfficer();
    setUser(officer.user as User);
    setToken(officer.accessToken);
    recordAuditLog({
      action: 'LOGIN',
      resource: 'AUTH',
      actor: 'เจ้าพนักงานสาธารณสุขชำนาญการ',
      actorRole: 'OFFICER',
      status: 'SUCCESS',
      details: 'เข้าสู่ระบบในโหมดเจ้าพนักงานสาธารณสุข (Quick Login)',
    });
    showToast(`เข้าสู่ระบบในโหมดเจ้าพนักงานสาธารณสุขเรียบร้อย`);
  };

  // Logout
  const handleLogout = async () => {
    recordAuditLog({
      action: 'LOGOUT',
      resource: 'AUTH',
      actor: currentSession.name,
      actorRole: currentSession.role,
      status: 'SUCCESS',
      details: 'ออกจากระบบ Google และเคลียร์เซสชัน',
    });
    await logout();
    setUser(null);
    setToken(null);
    showToast('ออกจากระบบเรียบร้อย', 'info');
  };

  // Check RBAC permission before adding license
  const handleOpenAddLicense = () => {
    if (!hasPermission(currentSession.role, 'CREATE_LICENSE')) {
      showToast('บทบาทของท่านไม่มีสิทธิ์ออกใบอนุญาตใหม่ (เฉพาะเจ้าพนักงานหรือผู้ดูแลระบบ)', 'warning');
      return;
    }
    setSelectedLicenseForEdit(null);
    setIsAddModalOpen(true);
  };

  // Check RBAC permission before editing license
  const handleOpenEditLicense = (lic: LicenseRecord) => {
    if (!hasPermission(currentSession.role, 'EDIT_LICENSE')) {
      showToast('บทบาทของท่านไม่มีสิทธิ์แก้ไขข้อมูลใบอนุญาต (เฉพาะเจ้าหน้าที่หรือผู้ดูแลระบบ)', 'warning');
      return;
    }
    setSelectedLicenseForEdit(lic);
    setIsAddModalOpen(true);
  };

  // Check RBAC permission before renewing
  const handleOpenRenewal = (lic: LicenseRecord) => {
    if (!hasPermission(currentSession.role, 'RENEW_LICENSE')) {
      showToast('บทบาทของท่านไม่มีสิทธิ์ดำเนินการต่ออายุ (เฉพาะเจ้าพนักงานสาธารณสุขหรือการเงิน)', 'warning');
      return;
    }
    setSelectedLicenseForRenewal(lic);
  };

  // Digital Signature signing for E-License
  const handleSignELicense = (licenseId: string) => {
    const signature: DigitalSignature = {
      signatoryName: currentSession.name || 'นพ.เกียรติศักดิ์ เจริญผล',
      signatoryPosition: currentSession.roleTitle || 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม',
      signedAt: new Date().toLocaleString('th-TH'),
      signatureAlgorithm: 'SHA256withRSA',
      signatureDigest: '9a4c8e12b7f3d9e018a4521c7e9a4f61b83cd912e74a89bc2130e9d4a82fb10e',
      tsaTimestamp: new Date().toISOString(),
      certificateAuthority: 'Thailand National Root CA (NRCA-TH-GOV-2026)',
      verificationQrUrl: `https://e-license.localgov.go.th/verify?id=${licenseId}`,
      isValid: true,
    };

    updateLicensesState((prev) =>
      prev.map((item) =>
        item.id === licenseId
          ? {
              ...item,
              eLicenseSignature: signature,
              approvalStatus: 'approved',
              approvedBy: signature.signatoryName,
              approvedAt: signature.signedAt,
            }
          : item
      )
    );

    setSelectedLicenseForELicense((prev) =>
      prev && prev.id === licenseId
        ? {
            ...prev,
            eLicenseSignature: signature,
            approvalStatus: 'approved',
            approvedBy: signature.signatoryName,
            approvedAt: signature.signedAt,
          }
        : prev
    );

    // Save signed license to Cloud Firestore
    const targetLicense = licenses.find((l) => l.id === licenseId);
    if (targetLicense) {
      saveLicenseOnline({
        ...targetLicense,
        eLicenseSignature: signature,
        approvalStatus: 'approved',
        approvedBy: signature.signatoryName,
        approvedAt: signature.signedAt,
      }).catch((e) => console.warn('Cloud Firestore save error:', e));
    }

    showToast(`ลงนามดิจิทัลรับรองใบอนุญาตอิเล็กทรอนิกส์สำเร็จ!`);
  };

  // Create Google Spreadsheet or Re-link
  const handleCreateOrLinkSheet = async () => {
    let currentToken = token;
    if (!currentToken || currentToken === 'officer_mock_token') {
      try {
        setIsLoggingIn(true);
        const authRes = await googleSignIn();
        if (!authRes) {
          showToast('ยกเลิกการเชื่อมต่อ Google Sheets (หน้าต่างลงชื่อเข้าใช้ถูกปิด)', 'info');
          return;
        }
        currentToken = authRes.accessToken;
        setUser(authRes.user as User);
        setToken(authRes.accessToken);
      } catch (e: any) {
        showToast(e?.message || 'ไม่สามารถเปิดหน้าต่าง Google Auth ได้', 'warning');
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    try {
      setIsSyncingSheet(true);
      showToast('กำลังสร้าง Google Sheet ฐานข้อมูลหลัก...', 'info');

      const sheetRes = await createLicenseSpreadsheet(currentToken);
      setSpreadsheetId(sheetRes.id);
      setSpreadsheetUrl(sheetRes.url);
      localStorage.setItem('gov_sheet_id', sheetRes.id);
      localStorage.setItem('gov_sheet_url', sheetRes.url);

      // Immediately sync current data
      await syncAllLicensesToGoogleSheet(currentToken, sheetRes.id, licenses);
      setIsSyncingSheet(false);
      recordAuditLog({
        action: 'EXPORT_DATA',
        resource: 'GOOGLE_SHEETS',
        actor: currentSession.name,
        actorRole: currentSession.role,
        status: 'SUCCESS',
        details: `สร้างและเชื่อมต่อ Google Sheet ID: ${sheetRes.id}`,
      });
      showToast('สร้างและเชื่อมโยง Google Sheet สำเร็จแล้ว! ข้อมูลทั้งหมดถูกซิงค์เรียบร้อย');
    } catch (err: any) {
      setIsSyncingSheet(false);
      showToast(`การเชื่อมต่อ Google Sheets: ${err?.message || 'โปรดตรวจสอบสิทธิ์บัญชี'}`, 'warning');
    }
  };

  // Sync all licenses to existing Google Sheet
  const handleSyncAllToSheet = async () => {
    if (!token || !spreadsheetId) {
      handleCreateOrLinkSheet();
      return;
    }

    try {
      setIsSyncingSheet(true);
      const success = await syncAllLicensesToGoogleSheet(token, spreadsheetId, licenses);
      setIsSyncingSheet(false);
      if (success) {
        recordAuditLog({
          action: 'EXPORT_DATA',
          resource: 'GOOGLE_SHEETS',
          actor: currentSession.name,
          actorRole: currentSession.role,
          status: 'SUCCESS',
          details: `ซิงค์ข้อมูลใบอนุญาตทั้งหมด (${licenses.length} รายการ) ไปยัง Google Sheets`,
        });
        showToast('อัปเดตข้อมูลทั้งหมดไปยัง Google Sheets สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการซิงค์ข้อมูล Google Sheet');
      }
    } catch (err: any) {
      console.error('Sync failed', err);
      setIsSyncingSheet(false);
      alert('ไม่สามารถซิงค์ข้อมูลได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือเข้าสู่ระบบใหม่');
    }
  };

  // License Renewal Handler (Auto updates Google Sheets and logs audit trail)
  const handleConfirmRenewal = async (
    licenseId: string,
    newExpiryDate: string,
    officerNotes: string,
    syncToSheet: boolean
  ) => {
    let renewedItem: LicenseRecord | null = null;

    updateLicensesState((prev) =>
      prev.map((item) => {
        if (item.id === licenseId) {
          const newHistory = [
            ...(item.renewalHistory || []),
            {
              renewalDate: new Date().toISOString().split('T')[0],
              previousExpiryDate: item.expiryDate,
              newExpiryDate: newExpiryDate,
              feeAmount: item.feeAmount,
              paidVia: 'PromptPay' as const,
              transactionRef: `PP-RNW-${Date.now().toString().slice(-6)}`,
              syncedToGoogleSheet: Boolean(token && spreadsheetId && syncToSheet),
              officerName: currentSession.name || 'เจ้าพนักงานสาธารณสุข',
              notes: officerNotes,
            },
          ];

          renewedItem = {
            ...item,
            expiryDate: newExpiryDate,
            status: 'active',
            paymentStatus: 'paid',
            notification30DaysSent: false,
            syncedToSheet: Boolean(token && spreadsheetId && syncToSheet),
            renewalHistory: newHistory,
          };

          return renewedItem;
        }
        return item;
      })
    );

    // Record Centralized Audit Log
    recordAuditLog({
      action: 'RENEW_LICENSE',
      resource: 'LICENSES',
      resourceId: licenseId,
      actor: currentSession.name,
      actorRole: currentSession.role,
      status: 'SUCCESS',
      details: `ต่ออายุใบอนุญาต ${renewedItem?.licenseNo || licenseId} ถึงวันที่ ${newExpiryDate} บันทึก: ${officerNotes || 'ต่ออายุตามระเบียบ'}`,
    });

    // If Google Sheet is connected and toggle enabled, auto update Google Sheet row!
    if (token && spreadsheetId && syncToSheet && renewedItem) {
      try {
        await updateLicenseRenewalInGoogleSheet(token, spreadsheetId, renewedItem);
        showToast(
          `ต่ออายุใบอนุญาต ${renewedItem.licenseNo} สำเร็จ! ข้อมูลอัปเดตไปยัง Google Sheets อัตโนมัติแล้ว`
        );
      } catch (sheetErr) {
        console.warn('Background sheet update warning', sheetErr);
        showToast(`ต่ออายุใบอนุญาตสำเร็จ (บันทึกในเครื่องเรียบร้อย)`);
      }
    } else {
      showToast(`ต่ออายุใบอนุญาตสำเร็จ (ขยายเวลาถึง ${newExpiryDate})`);
    }

    // Save to Cloud Firestore
    if (renewedItem) {
      saveLicenseOnline(renewedItem).catch((e) => console.warn('Firestore renewal sync error:', e));
    }
  };

  // Instant PromptPay Digital Payment Success
  const handlePaymentSuccess = async (licenseId: string, transactionRef: string) => {
    let updatedTarget: LicenseRecord | null = null;

    updateLicensesState((prev) =>
      prev.map((item) => {
        if (item.id === licenseId) {
          updatedTarget = {
            ...item,
            paymentStatus: 'paid',
            promptpayRef: transactionRef,
            paidAt: new Date().toLocaleString('th-TH'),
            status: item.status === 'expired' ? 'active' : item.status,
          };
          return updatedTarget;
        }
        return item;
      })
    );

    recordAuditLog({
      action: 'PAYMENT_RECEIPT',
      resource: 'PAYMENT',
      resourceId: licenseId,
      actor: currentSession.name,
      actorRole: currentSession.role,
      status: 'SUCCESS',
      details: `รับชำระค่าธรรมเนียมใบอนุญาตผ่าน PromptPay เลขที่อ้างอิง: ${transactionRef}`,
    });

    setSelectedLicenseForPayment(null);
    showToast(`รับชำระเงินผ่าน PromptPay เลขที่ ${transactionRef} สำเร็จ!`);

    // Save to Cloud Firestore
    if (updatedTarget) {
      saveLicenseOnline(updatedTarget).catch((e) => console.warn('Firestore payment sync error:', e));
    }

    // Auto sync to sheet if connected
    if (token && spreadsheetId && updatedTarget) {
      try {
        await updateLicenseRenewalInGoogleSheet(token, spreadsheetId, updatedTarget);
      } catch (e) {
        console.error('Sheet update failed', e);
      }
    }
  };

  // Add or Edit license handler
  const handleSaveLicense = async (savedLicense: LicenseRecord, isEditing: boolean) => {
    if (isEditing) {
      updateLicensesState((prev) =>
        prev.map((item) => (item.id === savedLicense.id ? savedLicense : item))
      );

      // If license detail modal is open for this item, keep it updated
      setSelectedLicenseForDetail((prev) =>
        prev && prev.id === savedLicense.id ? savedLicense : prev
      );

      recordAuditLog({
        action: 'UPDATE_LICENSE',
        resource: 'LICENSES',
        resourceId: savedLicense.id,
        actor: currentSession.name,
        actorRole: currentSession.role,
        status: 'SUCCESS',
        details: `แก้ไขข้อมูลใบอนุญาตเลขที่ ${savedLicense.licenseNo} (${savedLicense.businessName})`,
      });

      showToast(`บันทึกการแก้ไขข้อมูลใบอนุญาต ${savedLicense.licenseNo} เรียบร้อยแล้ว`);
    } else {
      updateLicensesState((prev) => [savedLicense, ...prev]);

      recordAuditLog({
        action: 'CREATE_LICENSE',
        resource: 'LICENSES',
        resourceId: savedLicense.id,
        actor: currentSession.name,
        actorRole: currentSession.role,
        status: 'SUCCESS',
        details: `ลงทะเบียนและออกใบอนุญาตใหม่เลขที่ ${savedLicense.licenseNo} (${savedLicense.businessName})`,
      });

      showToast(`ลงทะเบียนและออกใบอนุญาต ${savedLicense.licenseNo} สำเร็จ`);
    }

    // Always persist to Cloud Firestore online
    saveLicenseOnline(savedLicense).catch((err) => {
      console.warn('Firestore online save notice:', err);
    });

    // Auto sync to sheet
    if (token && spreadsheetId && savedLicense.syncedToSheet) {
      try {
        await updateLicenseRenewalInGoogleSheet(token, spreadsheetId, savedLicense);
      } catch (e) {
        console.error('Sheet update error', e);
      }
    }
  };

  // Bulk Notification trigger
  const handleBulkNotification = () => {
    updateLicensesState((prev) =>
      prev.map((item) => {
        const days = getDaysRemaining(item.expiryDate);
        if (days <= 30 && days >= 0) {
          return {
            ...item,
            notification30DaysSent: true,
            lastNotifiedDate: new Date().toLocaleString('th-TH'),
          };
        }
        return item;
      })
    );

    recordAuditLog({
      action: 'SEND_NOTIFICATION',
      resource: 'NOTIFICATIONS',
      actor: currentSession.name,
      actorRole: currentSession.role,
      status: 'SUCCESS',
      details: 'สั่งยิงระบบแจ้งเตือนล่วงหน้า 30 วันอัตโนมัติผ่าน LINE Official Account และ Email แบบกลุ่ม',
    });

    showToast('ส่งข้อความแจ้งเตือนล่วงหน้า 30 วันผ่าน LINE OA และ Email ให้สถานประกอบการทั้งหมดแล้ว!');
  };

  const expiringCount = licenses.filter((l) => {
    const days = getDaysRemaining(l.expiryDate);
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* Toast Feedback Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Gov Navbar */}
      <Navbar
        user={user}
        token={token}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onOfficerLogin={handleOfficerLogin}
        onLogout={handleLogout}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        isSyncingSheet={isSyncingSheet}
        onSyncAllToSheet={handleSyncAllToSheet}
        onCreateOrLinkSheet={handleCreateOrLinkSheet}
        isSecurityUnlocked={isSecurityUnlocked}
        onToggleSecurity={() => {
          if (isSecurityUnlocked) {
            setIsSecurityUnlocked(false);
            recordAuditLog({
              action: 'DATA_MASK_TOGGLE',
              resource: 'PDPA',
              actor: currentSession.name,
              actorRole: currentSession.role,
              status: 'SUCCESS',
              details: 'เปิดใช้งานการซ่อนข้อมูลส่วนบุคคล (PDPA Masking)',
            });
            showToast('ล็อคการแสดงข้อมูลส่วนบุคคล (PDPA Protected)', 'info');
          } else {
            setIsPinModalOpen(true);
          }
        }}
        expiringCount={expiringCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenAddModal={handleOpenAddLicense}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        currentSession={currentSession}
        onOpenWAFModal={() => setIsWAFModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenStaffRegister={() => setIsStaffRegisterModalOpen(true)}
      />

      {/* Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Dashboard Stat Cards & 30-Day Urgent Banner */}
        <DashboardStats
          licenses={licenses}
          activeFilter={statusFilter}
          onFilterChange={(filter) => setStatusFilter(filter)}
          onSelectLicense={(lic) => setSelectedLicenseForDetail(lic)}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
        />

        {/* License Table with Search, 4 Category Filter, Actions, RBAC */}
        <LicenseTable
          licenses={licenses}
          activeStatusFilter={statusFilter}
          onStatusFilterChange={(st) => setStatusFilter(st)}
          isSecurityUnlocked={isSecurityUnlocked}
          onSelectLicense={(lic) => setSelectedLicenseForDetail(lic)}
          onOpenRenewal={(lic) => handleOpenRenewal(lic)}
          onOpenPromptPay={(lic) => setSelectedLicenseForPayment(lic)}
          onOpenNotification={(lic) => {
            setSelectedLicenseForNotification(lic);
            setIsNotificationModalOpen(true);
          }}
          onOpenDocPreview={(doc, lic) => setPreviewDocState({ doc, license: lic })}
          currentSession={currentSession}
          onOpenELicense={(lic) => setSelectedLicenseForELicense(lic)}
          onOpenEditLicense={(lic) => handleOpenEditLicense(lic)}
          onOpenAddLicense={handleOpenAddLicense}
          onLoadDemoData={handleLoadDemoData}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          ระบบตรวจเช็คใบอนุญาตประกอบกิจการออนไลน์และแจ้งเตือนวันหมดอายุอัตโนมัติ ©{' '}
          {new Date().getFullYear()} กองสาธารณสุขและสิ่งแวดล้อม
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          เชื่อมโยงข้อมูลแบบเรียลไทม์กับ Google Sheets, Google Drive, PromptPay, LINE OA, และ WAF Security Architecture
        </p>
      </footer>

      {/* Modals */}
      <AddEditLicenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedLicenseForEdit(null);
        }}
        licenseToEdit={selectedLicenseForEdit}
        onSaveLicense={handleSaveLicense}
        hasGoogleSheetConnected={Boolean(token && spreadsheetId)}
      />

      <RenewalModal
        license={selectedLicenseForRenewal}
        onClose={() => setSelectedLicenseForRenewal(null)}
        onConfirmRenewal={handleConfirmRenewal}
        hasGoogleSheetConnected={Boolean(token && spreadsheetId)}
      />

      <PromptPayModal
        license={selectedLicenseForPayment}
        onClose={() => setSelectedLicenseForPayment(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <LicenseDetailModal
        license={selectedLicenseForDetail}
        onClose={() => setSelectedLicenseForDetail(null)}
        isSecurityUnlocked={isSecurityUnlocked}
        onToggleSecurity={() => {
          if (isSecurityUnlocked) {
            setIsSecurityUnlocked(false);
          } else {
            setIsPinModalOpen(true);
          }
        }}
        onOpenRenewal={(lic) => handleOpenRenewal(lic)}
        onOpenPromptPay={(lic) => setSelectedLicenseForPayment(lic)}
        onOpenNotification={(lic) => {
          setSelectedLicenseForNotification(lic);
          setIsNotificationModalOpen(true);
        }}
        onOpenDocPreview={(doc, lic) => setPreviewDocState({ doc, license: lic })}
        currentSession={currentSession}
        onOpenELicense={(lic) => setSelectedLicenseForELicense(lic)}
        onOpenEditLicense={(lic) => handleOpenEditLicense(lic)}
      />

      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        licenses={licenses}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          setSelectedLicenseForNotification(null);
        }}
        selectedLicense={selectedLicenseForNotification}
        licenses={licenses}
        onTriggerBulkNotification={handleBulkNotification}
      />

      <SecurityPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsSecurityUnlocked(true);
          recordAuditLog({
            action: 'DATA_MASK_TOGGLE',
            resource: 'PDPA',
            actor: currentSession.name,
            actorRole: currentSession.role,
            status: 'SUCCESS',
            details: 'ยืนยันรหัส PIN ปลดล็อคการแสดงเลขบัตรประชาชนครบ 13 หลัก',
          });
          showToast('ยืนยันรหัส PIN สำเร็จ: ปลดล็อคการแสดงผลข้อมูลส่วนบุคคล');
        }}
      />

      <DocumentPreviewModal
        document={previewDocState?.doc || null}
        license={previewDocState?.license || null}
        onClose={() => setPreviewDocState(null)}
      />

      {/* Security Infrastructure Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentSession={currentSession}
        onSelectSession={handleSessionChange}
        onOpenStaffManagement={() => setIsStaffModalOpen(true)}
        onOpenStaffRegister={() => setIsStaffRegisterModalOpen(true)}
      />

      <StaffRegisterModal
        isOpen={isStaffRegisterModalOpen}
        onClose={() => setIsStaffRegisterModalOpen(false)}
        onOpenLogin={() => {
          setIsStaffRegisterModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onRegisteredSuccess={() => {
          showToast('ส่งคำขอลงทะเบียนเจ้าหน้าที่สำเร็จ อยู่ระหว่างรอการอนุมัติสิทธิ์');
        }}
      />

      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        currentSession={currentSession}
      />

      <WAFSecurityModal
        isOpen={isWAFModalOpen}
        onClose={() => setIsWAFModalOpen(false)}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        currentRole={currentSession.role}
      />

      <DatabaseExplorerModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        licenses={licenses}
        currentSession={currentSession}
        onSyncAllToCloud={handleSyncAllToCloud}
      />

      <ELicenseModal
        isOpen={Boolean(selectedLicenseForELicense)}
        onClose={() => setSelectedLicenseForELicense(null)}
        license={selectedLicenseForELicense}
        currentSession={currentSession}
        onSignLicense={handleSignELicense}
      />
    </div>
  );
}
