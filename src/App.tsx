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
import { LicenseRecord, UploadedDocument } from './types';
import { getStoredLicenses, saveStoredLicenses } from './data/mockLicenses';
import { googleSignIn, initAuth, logout, signInAsOfficer } from './services/firebaseAuth';
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
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  const [selectedLicenseForDetail, setSelectedLicenseForDetail] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForRenewal, setSelectedLicenseForRenewal] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForPayment, setSelectedLicenseForPayment] = useState<LicenseRecord | null>(null);
  const [selectedLicenseForNotification, setSelectedLicenseForNotification] = useState<LicenseRecord | null>(null);
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

  // Save changes to localStorage whenever licenses change
  const updateLicensesState = (updater: (prev: LicenseRecord[]) => LicenseRecord[]) => {
    setLicenses((prev) => {
      const updated = updater(prev);
      saveStoredLicenses(updated);
      return updated;
    });
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

  // Quick Officer Sign-in (for quick testing without Google popup)
  const handleOfficerLogin = () => {
    const officer = signInAsOfficer();
    setUser(officer.user as User);
    setToken(officer.accessToken);
    showToast(`เข้าสู่ระบบในโหมดเจ้าพนักงานสาธารณสุขเรียบร้อย`);
  };

  // Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('ออกจากระบบเรียบร้อย', 'info');
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

  // License Renewal Handler (Auto updates Google Sheets!)
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
              officerName: user?.displayName || 'เจ้าพนักงานสาธารณสุข',
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

    setSelectedLicenseForPayment(null);
    showToast(`รับชำระเงินผ่าน PromptPay เลขที่ ${transactionRef} สำเร็จ!`);

    // Auto sync to sheet if connected
    if (token && spreadsheetId && updatedTarget) {
      try {
        await updateLicenseRenewalInGoogleSheet(token, spreadsheetId, updatedTarget);
      } catch (e) {
        console.error('Sheet update failed', e);
      }
    }
  };

  // Add new license handler
  const handleSaveNewLicense = async (newLicense: LicenseRecord) => {
    updateLicensesState((prev) => [newLicense, ...prev]);
    showToast(`ลงทะเบียนและออกใบอนุญาต ${newLicense.licenseNo} สำเร็จ`);

    // Auto sync to sheet
    if (token && spreadsheetId && newLicense.syncedToSheet) {
      try {
        await updateLicenseRenewalInGoogleSheet(token, spreadsheetId, newLicense);
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
            showToast('ล็อคการแสดงข้อมูลส่วนบุคคล (PDPA Protected)', 'info');
          } else {
            setIsPinModalOpen(true);
          }
        }}
        expiringCount={expiringCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
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

        {/* License Table with Search, 4 Category Filter, Actions */}
        <LicenseTable
          licenses={licenses}
          activeStatusFilter={statusFilter}
          onStatusFilterChange={(st) => setStatusFilter(st)}
          isSecurityUnlocked={isSecurityUnlocked}
          onSelectLicense={(lic) => setSelectedLicenseForDetail(lic)}
          onOpenRenewal={(lic) => setSelectedLicenseForRenewal(lic)}
          onOpenPromptPay={(lic) => setSelectedLicenseForPayment(lic)}
          onOpenNotification={(lic) => {
            setSelectedLicenseForNotification(lic);
            setIsNotificationModalOpen(true);
          }}
          onOpenDocPreview={(doc, lic) => setPreviewDocState({ doc, license: lic })}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          ระบบตรวจเช็คใบอนุญาตประกอบกิจการออนไลน์และแจ้งเตือนวันหมดอายุอัตโนมัติ ©{' '}
          {new Date().getFullYear()} กองสาธารณสุขและสิ่งแวดล้อม
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          เชื่อมโยงข้อมูลแบบเรียลไทม์กับ Google Sheets, Google Drive, PromptPay, และ LINE OA
        </p>
      </footer>

      {/* Modals */}
      <AddEditLicenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveLicense={handleSaveNewLicense}
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
        onOpenRenewal={(lic) => setSelectedLicenseForRenewal(lic)}
        onOpenPromptPay={(lic) => setSelectedLicenseForPayment(lic)}
        onOpenNotification={(lic) => {
          setSelectedLicenseForNotification(lic);
          setIsNotificationModalOpen(true);
        }}
        onOpenDocPreview={(doc, lic) => setPreviewDocState({ doc, license: lic })}
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
          showToast('ยืนยันรหัส PIN สำเร็จ: ปลดล็อคการแสดงผลข้อมูลส่วนบุคคล');
        }}
      />

      <DocumentPreviewModal
        document={previewDocState?.doc || null}
        license={previewDocState?.license || null}
        onClose={() => setPreviewDocState(null)}
      />
    </div>
  );
}
