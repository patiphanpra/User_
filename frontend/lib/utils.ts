import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...classes: Array<string | false | null | undefined>) => {
  return twMerge(clsx(...classes));
};

// Files uploaded via the backend (death certificates, receipts, etc.) are
// stored with relative URLs like "/uploads/{id}/{file}". The backend serves
// these itself, on a different origin/port than the Next.js frontend, so a
// plain <a href="/uploads/..."> resolves against the frontend's own origin
// and 404s. This resolves the path against the backend's origin instead.
export const resolveUploadUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  return `${backendOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const thaiIdChecksum = (id: string): boolean => {
  if (id.length !== 13) return false;
  if (!/^\d{13}$/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id[i], 10) * (13 - i);
  }

  const checksum = (11 - (sum % 11)) % 10;
  return checksum === parseInt(id[12], 10);
};

export const formatThaiDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear() + 543;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

// Buddhist Era is 543 years ahead of the Gregorian (ค.ศ.) calendar.
export const BE_OFFSET = 543;

// Number of days in a given month/Buddhist-Era-year combination, correctly
// accounting for leap years (computed via the underlying Gregorian year,
// since JS Date's leap-year rules are Gregorian).
export const daysInMonthBE = (month: string, yearBE: string): number => {
  if (!month || !yearBE) return 31;
  const gYear = parseInt(yearBE, 10) - BE_OFFSET;
  return new Date(gYear, parseInt(month, 10), 0).getDate();
};

// Converts day/month/yearBE (as entered via the dropdown date picker) into
// the "YYYY-MM-DD" Gregorian string the backend expects, or null if the
// selection is incomplete or the day doesn't exist in that month (e.g. 31
// in a 30-day month). Extracted as a pure function — no React state, no
// browser locale — specifically because the previous <input type="date">
// implementation was ambiguous about day/month order depending on the
// user's OS locale, which caused real submission failures.
export const toIsoDateBE = (day: string, month: string, yearBE: string): string | null => {
  if (!day || !month || !yearBE) return null;
  const gYear = parseInt(yearBE, 10) - BE_OFFSET;
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (d < 1 || d > daysInMonthBE(month, yearBE)) return null;
  return `${gYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
};

export const getMemberStatusBadgeColor = (
  status: 'active' | 'inactive' | 'suspended' | 'resigned' | 'deceased'
): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'suspended':
      return 'bg-yellow-100 text-yellow-800';
    case 'resigned':
      return 'bg-orange-100 text-orange-800';
    case 'deceased':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getMemberStatusLabel = (
  status: 'active' | 'inactive' | 'suspended' | 'resigned' | 'deceased'
): string => {
  switch (status) {
    case 'active':
      return 'สมาชิกทั่วไป';
    case 'inactive':
      return 'ไม่ทำงาน';
    case 'suspended':
      return 'ระงับสมาชิก';
    case 'resigned':
      return 'ลาออก';
    case 'deceased':
      return 'เสียชีวิต';
    default:
      return 'ไม่ทราบ';
  }
};

export const getReceiptStatusBadgeColor = (
  status: 'pending' | 'approved' | 'rejected' | 'void'
): string => {
  switch (status) {
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'void':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getReceiptStatusLabel = (
  status: 'pending' | 'approved' | 'rejected' | 'void'
): string => {
  switch (status) {
    case 'pending':
      return 'รอการอนุมัติ';
    case 'approved':
      return 'อนุมัติแล้ว';
    case 'rejected':
      return 'ปฏิเสธ';
    case 'void':
      return 'ยกเลิก';
    default:
      return 'ไม่ทราบ';
  }
};