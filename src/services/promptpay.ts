// PromptPay EMVCo QR code generator implementation in pure TypeScript

function padLeft(str: string, len: number): string {
  return str.padStart(len, '0');
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let c = data.charCodeAt(i);
    crc ^= c << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number, ref1?: string): string {
  // target can be phone (10 digits) or citizen/tax ID (13 digits)
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let subtagValue = '';
  let subtagId = '';

  if (cleanTarget.length === 10) {
    // Phone number: convert 08XXXXXXXX to 00668XXXXXXXX
    const nationalPhone = '0066' + cleanTarget.substring(1);
    subtagId = '01';
    subtagValue = nationalPhone;
  } else {
    // 13-digit ID / Tax ID
    subtagId = '02';
    subtagValue = cleanTarget;
  }

  const aid = formatTag('00', 'A000000677010111');
  const recipient = formatTag(subtagId, subtagValue);
  const tag29 = formatTag('29', aid + recipient);

  let payload = '';
  payload += formatTag('00', '01'); // Version
  payload += formatTag('01', amount ? '12' : '11'); // 12 = Dynamic (amount included), 11 = Static
  payload += tag29;
  payload += formatTag('53', '764'); // THB currency

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTag('54', formattedAmount);
  }

  payload += formatTag('58', 'TH'); // Country Thailand
  payload += formatTag('59', 'LOCAL GOV DEPT'); // Merchant name
  payload += formatTag('60', 'BANGKOK'); // Merchant City

  if (ref1) {
    const refData = formatTag('07', ref1.substring(0, 20));
    payload += formatTag('62', refData);
  }

  // Tag 63: CRC placeholder
  payload += '6304';
  const checksum = crc16(payload);
  return payload + checksum;
}
