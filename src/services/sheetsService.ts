import { LicenseRecord } from '../types';

const SHEET_NAME = 'Licenses_Master_Data';

export const SHEETS_HEADER = [
  'หมายเลขใบอนุญาต',
  'ประเภทกิจการ',
  'ประเภทย่อย/ขนาดพื้นที่',
  'ชื่อสถานประกอบการ',
  'ชื่อ-นามสกุล ผู้ถือใบอนุญาต',
  'เลขประจำตัวประชาชน',
  'ที่อยู่ตามบัตรประชาชน',
  'ที่อยู่สถานประกอบการ',
  'เบอร์ติดต่อ',
  'อีเมล',
  'วันที่ออกใบอนุญาต',
  'วันหมดอายุ',
  'สถานะปัจจุบัน',
  'ค่าธรรมเนียม (บาท)',
  'สถานะชำระเงิน',
  'วันต่ออายุล่าสุด',
  'เวลาที่อัปเดตล่าสุด',
];

export async function createLicenseSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'ฐานข้อมูลใบอนุญาตประกอบกิจการ_MasterDatabase',
      },
      sheets: [
        {
          properties: {
            title: SHEET_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Write header row with formatting
  await appendOrSetHeader(accessToken, spreadsheetId);

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

async function appendOrSetHeader(accessToken: string, spreadsheetId: string) {
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A1:Q1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${SHEET_NAME}!A1:Q1`,
        majorDimension: 'ROWS',
        values: [SHEETS_HEADER],
      }),
    }
  );
}

function licenseToSheetRow(license: LicenseRecord): (string | number)[] {
  const lastRenewal = license.renewalHistory && license.renewalHistory.length > 0
    ? license.renewalHistory[license.renewalHistory.length - 1].renewalDate
    : '-';

  return [
    license.licenseNo,
    license.categoryLabel,
    license.foodSubtype === 'OVER_200_SQM'
      ? `พื้นที่ ${license.areaSquareMeters || '>200'} ตร.ม. (ขอใบอนุญาต)`
      : license.foodSubtype === 'UNDER_200_SQM'
      ? `พื้นที่ ${license.areaSquareMeters || '<=200'} ตร.ม. (หนังสือรับรองการแจ้ง)`
      : '-',
    license.businessName,
    license.ownerFullName,
    license.ownerNationalId,
    license.idCardAddress,
    license.businessAddress,
    license.contactPhone || '-',
    license.contactEmail || '-',
    license.issueDate,
    license.expiryDate,
    license.status === 'active'
      ? 'ปกติ (Active)'
      : license.status === 'expiring_soon'
      ? 'ใกล้หมดอายุ (ภายใน 30 วัน)'
      : license.status === 'expired'
      ? 'หมดอายุ (Expired)'
      : license.status === 'renewing'
      ? 'อยู่ระหว่างต่ออายุ'
      : 'รออนุมัติ',
    license.feeAmount,
    license.paymentStatus === 'paid' ? 'ชำระแล้ว (PromptPay)' : 'รอชำระ',
    lastRenewal,
    new Date().toLocaleString('th-TH'),
  ];
}

export async function syncAllLicensesToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  licenses: LicenseRecord[]
): Promise<boolean> {
  // Ensure header
  await appendOrSetHeader(accessToken, spreadsheetId);

  const rows = licenses.map(licenseToSheetRow);

  // Clear existing data rows first, then rewrite
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A2:Q1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!clearRes.ok) {
    console.warn('Could not clear old rows, will overwrite');
  }

  // Write new rows
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A2:Q${rows.length + 1}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${SHEET_NAME}!A2:Q${rows.length + 1}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  return writeRes.ok;
}

export async function updateLicenseRenewalInGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  renewedLicense: LicenseRecord
): Promise<boolean> {
  // 1. Fetch current data to find matching row by licenseNo
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:Q`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!getRes.ok) {
    throw new Error('ไม่สามารถอ่านข้อมูล Google Sheet หลักได้');
  }

  const data = await getRes.json();
  const rows: string[][] = data.values || [];

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === renewedLicense.licenseNo) {
      targetRowIndex = i + 1; // 1-based index in Sheet
      break;
    }
  }

  const updatedRow = licenseToSheetRow(renewedLicense);

  if (targetRowIndex > 0) {
    // Update specific row
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A${targetRowIndex}:Q${targetRowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET_NAME}!A${targetRowIndex}:Q${targetRowIndex}`,
          majorDimension: 'ROWS',
          values: [updatedRow],
        }),
      }
    );
    return updateRes.ok;
  } else {
    // Append as new row
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A:Q:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET_NAME}!A:Q`,
          majorDimension: 'ROWS',
          values: [updatedRow],
        }),
      }
    );
    return appendRes.ok;
  }
}
