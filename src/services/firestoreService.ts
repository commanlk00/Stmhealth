import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LicenseRecord, StaffAccount, AuditLogEntry } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore with dedicated databaseId if configured
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const FIRESTORE_DATABASE_INFO = {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  authDomain: firebaseConfig.authDomain,
  isOnline: true,
};

// Helper: Ensure no undefined fields are passed to Firestore
function sanitizePayload<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

// ==========================================
// 1. LICENSES ONLINE FIRESTORE
// ==========================================

const LICENSES_COLLECTION = 'licenses';

/**
 * Subscribe to real-time updates for all licenses from Cloud Firestore.
 * Automatically synchronizes changes across all connected devices and users.
 */
export function subscribeToOnlineLicenses(
  onUpdate: (licenses: LicenseRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, LICENSES_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: LicenseRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LicenseRecord;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        // Sort by issue date descending
        list.sort(
          (a, b) =>
            new Date(b.issueDate || 0).getTime() -
            new Date(a.issueDate || 0).getTime()
        );
        onUpdate(list);
      },
      (err) => {
        console.warn('Firestore licenses onSnapshot listener notice:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to online licenses:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save or update a license in Cloud Firestore.
 */
export async function saveLicenseOnline(license: LicenseRecord): Promise<void> {
  const docId = license.id || `lic-${Date.now()}`;
  const docRef = doc(db, LICENSES_COLLECTION, docId);
  const cleanData = sanitizePayload({
    ...license,
    id: docId,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Delete a license from Cloud Firestore.
 */
export async function deleteLicenseOnline(licenseId: string): Promise<void> {
  const docRef = doc(db, LICENSES_COLLECTION, licenseId);
  await deleteDoc(docRef);
}

/**
 * Batch upload / sync all licenses to Cloud Firestore.
 */
export async function syncLicensesToOnline(
  licenses: LicenseRecord[]
): Promise<{ count: number }> {
  if (licenses.length === 0) return { count: 0 };

  const batch = writeBatch(db);
  for (const lic of licenses) {
    const docRef = doc(db, LICENSES_COLLECTION, lic.id);
    const cleanData = sanitizePayload({
      ...lic,
      syncedAt: new Date().toISOString(),
    });
    batch.set(docRef, cleanData, { merge: true });
  }
  await batch.commit();
  return { count: licenses.length };
}

// ==========================================
// 2. STAFF ACCOUNTS ONLINE FIRESTORE
// ==========================================

const STAFF_COLLECTION = 'staff_accounts';

/**
 * Subscribe to real-time updates for staff accounts from Cloud Firestore.
 */
export function subscribeToOnlineStaffAccounts(
  onUpdate: (accounts: StaffAccount[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, STAFF_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: StaffAccount[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as StaffAccount;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('Firestore staff onSnapshot listener notice:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn('Failed to subscribe to online staff accounts:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save or update staff account in Cloud Firestore.
 */
export async function saveStaffAccountOnline(account: StaffAccount): Promise<void> {
  const docId = account.id || `staff-${Date.now()}`;
  const docRef = doc(db, STAFF_COLLECTION, docId);
  const cleanData = sanitizePayload({
    ...account,
    id: docId,
    syncedAt: new Date().toISOString(),
  });
  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Delete a staff account from Cloud Firestore.
 */
export async function deleteStaffAccountOnline(accountId: string): Promise<void> {
  const docRef = doc(db, STAFF_COLLECTION, accountId);
  await deleteDoc(docRef);
}

/**
 * Sync initial staff accounts to online if collection is empty.
 */
export async function syncInitialStaffAccountsOnline(
  accounts: StaffAccount[]
): Promise<void> {
  try {
    const snap = await getDocs(collection(db, STAFF_COLLECTION));
    if (snap.empty && accounts.length > 0) {
      const batch = writeBatch(db);
      for (const acc of accounts) {
        const docRef = doc(db, STAFF_COLLECTION, acc.id);
        batch.set(docRef, sanitizePayload(acc), { merge: true });
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Notice checking online staff collection:', err);
  }
}

// ==========================================
// 3. AUDIT LOGS ONLINE FIRESTORE
// ==========================================

const AUDIT_COLLECTION = 'audit_logs';

/**
 * Record an audit log entry in Cloud Firestore.
 */
export async function recordAuditLogOnline(log: AuditLogEntry): Promise<void> {
  try {
    const docId = log.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, AUDIT_COLLECTION, docId);
    await setDoc(docRef, sanitizePayload({ ...log, id: docId }), { merge: true });
  } catch (err) {
    console.warn('Failed to write audit log online to Firestore:', err);
  }
}

// ==========================================
// 4. CONNECTION TEST & HEALTH
// ==========================================

export async function testOnlineDatabaseConnection(): Promise<{
  connected: boolean;
  databaseId: string;
  projectId: string;
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    // Quick test read from licenses collection
    const colRef = collection(db, LICENSES_COLLECTION);
    await getDocs(colRef);
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: true,
      databaseId: FIRESTORE_DATABASE_INFO.databaseId,
      projectId: FIRESTORE_DATABASE_INFO.projectId,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: false,
      databaseId: FIRESTORE_DATABASE_INFO.databaseId,
      projectId: FIRESTORE_DATABASE_INFO.projectId,
      latencyMs,
      error: err?.message || 'Connection test failed',
    };
  }
}
