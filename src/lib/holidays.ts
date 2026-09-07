/**
 * Library Kalender Hari Libur Nasional Indonesia (Tanggal Merah & Cuti Bersama SKB 3 Menteri)
 * Digunakan untuk memverifikasi kehadiran kerja dan mencegah penghitungan Alpha otomatis pada hari libur resmi.
 */

export interface HolidayItem {
  date: string; // Format: YYYY-MM-DD
  name: string;
  isCutiBersama?: boolean;
}

// Data Hari Libur Nasional & Cuti Bersama Resmi Indonesia (2024 - 2027)
export const INDONESIA_HOLIDAYS: Record<string, string> = {
  // === TAHUN 2024 ===
  '2024-01-01': 'Tahun Baru 2024 Masehi',
  '2024-02-08': "Isra Mi'raj Nabi Muhammad SAW",
  '2024-02-09': 'Cuti Bersama Tahun Baru Imlek',
  '2024-02-10': 'Tahun Baru Imlek 2575 Kongzili',
  '2024-03-11': 'Hari Suci Nyepi Tahun Baru Saka 1946',
  '2024-03-12': 'Cuti Bersama Hari Suci Nyepi',
  '2024-03-29': 'Wafat Yesus Kristus',
  '2024-03-31': 'Hari Paskah',
  '2024-04-08': 'Cuti Bersama Hari Raya Idul Fitri 1445 H',
  '2024-04-09': 'Cuti Bersama Hari Raya Idul Fitri 1445 H',
  '2024-04-10': 'Hari Raya Idul Fitri 1445 H',
  '2024-04-11': 'Hari Raya Idul Fitri 1445 H',
  '2024-04-12': 'Cuti Bersama Hari Raya Idul Fitri 1445 H',
  '2024-04-15': 'Cuti Bersama Hari Raya Idul Fitri 1445 H',
  '2024-05-01': 'Hari Buruh Internasional',
  '2024-05-09': 'Kenaikan Yesus Kristus',
  '2024-05-10': 'Cuti Bersama Kenaikan Yesus Kristus',
  '2024-05-23': 'Hari Raya Waisak 2568 BE',
  '2024-05-24': 'Cuti Bersama Hari Raya Waisak',
  '2024-06-01': 'Hari Lahir Pancasila',
  '2024-06-17': 'Hari Raya Idul Adha 1445 H',
  '2024-06-18': 'Cuti Bersama Idul Adha',
  '2024-07-07': 'Tahun Baru Islam 1446 H',
  '2024-08-17': 'Hari Kemerdekaan RI',
  '2024-09-16': 'Maulid Nabi Muhammad SAW',
  '2024-12-25': 'Hari Raya Natal',
  '2024-12-26': 'Cuti Bersama Hari Raya Natal',

  // === TAHUN 2025 (SKB 3 Menteri) ===
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': "Isra Mi'raj Nabi Muhammad SAW",
  '2025-01-28': 'Cuti Bersama Tahun Baru Imlek',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-28': 'Cuti Bersama Hari Suci Nyepi',
  '2025-03-29': 'Hari Suci Nyepi Tahun Baru Saka 1947',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-02': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-03': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-04': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-07': 'Cuti Bersama Idul Fitri 1446 H',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-04-20': 'Kebangkitan Yesus Kristus (Paskah)',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-13': 'Cuti Bersama Hari Raya Waisak',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-05-30': 'Cuti Bersama Kenaikan Yesus Kristus',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-06': 'Hari Raya Idul Adha 1446 H',
  '2025-06-09': 'Cuti Bersama Idul Adha',
  '2025-06-27': '1 Muharram Tahun Baru Islam 1447 H',
  '2025-08-17': 'Proklamasi Kemerdekaan RI Ke-80',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Kelahiran Yesus Kristus (Natal)',
  '2025-12-26': 'Cuti Bersama Hari Raya Natal',

  // === TAHUN 2026 ===
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': "Isra Mi'raj Nabi Muhammad SAW",
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-02-18': 'Cuti Bersama Tahun Baru Imlek',
  '2026-03-19': 'Cuti Bersama Hari Suci Nyepi',
  '2026-03-20': 'Hari Suci Nyepi Tahun Baru Saka 1948',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-22': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-23': 'Cuti Bersama Idul Fitri 1447 H',
  '2026-03-24': 'Cuti Bersama Idul Fitri 1447 H',
  '2026-04-03': 'Wafat Yesus Kristus (Jumat Agung)',
  '2026-04-05': 'Hari Paskah',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-15': 'Cuti Bersama Kenaikan Yesus Kristus',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-05-28': 'Cuti Bersama Idul Adha',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-17': 'Hari Kemerdekaan Republik Indonesia Ke-81',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-08-31': 'Hari Libur Nasional / Tanggal Merah',
  '2026-12-24': 'Cuti Bersama Hari Raya Natal',
  '2026-12-25': 'Hari Raya Natal',

  // === TAHUN 2027 ===
  '2027-01-01': 'Tahun Baru 2027 Masehi',
  '2027-01-06': "Isra Mi'raj Nabi Muhammad SAW",
  '2027-02-06': 'Tahun Baru Imlek 2578 Kongzili',
  '2027-03-09': 'Hari Suci Nyepi Tahun Baru Saka 1949',
  '2027-03-10': 'Hari Raya Idul Fitri 1448 H',
  '2027-03-11': 'Hari Raya Idul Fitri 1448 H',
  '2027-03-26': 'Wafat Yesus Kristus',
  '2027-05-01': 'Hari Buruh Internasional',
  '2027-05-06': 'Kenaikan Yesus Kristus',
  '2027-05-16': 'Hari Raya Idul Adha 1448 H',
  '2027-05-20': 'Hari Raya Waisak 2571 BE',
  '2027-06-01': 'Hari Lahir Pancasila',
  '2027-06-06': 'Tahun Baru Islam 1449 H',
  '2027-08-17': 'Hari Kemerdekaan RI Ke-82',
  '2027-08-15': 'Maulid Nabi Muhammad SAW',
  '2027-12-25': 'Hari Raya Natal',
};

/**
 * Normalisasi format tanggal YYYY-MM-DD
 */
export const normalizeDateStr = (dateInput: string): string => {
  if (!dateInput) return '';
  return dateInput.substring(0, 10);
};

/**
 * Cek apakah ada hari libur kustom / instansi yang tersimpan di localStorage
 */
export const getCustomHolidays = (): Record<string, string> => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('magangku_custom_holidays') : null;
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
};

/**
 * Cek apakah suatu tanggal adalah Hari Libur Nasional / Cuti Bersama
 */
export const isIndonesianHoliday = (dateInput: string): boolean => {
  const dateKey = normalizeDateStr(dateInput);
  if (INDONESIA_HOLIDAYS[dateKey]) return true;
  const custom = getCustomHolidays();
  return Boolean(custom[dateKey]);
};

/**
 * Dapatkan nama Hari Libur Nasional untuk tanggal tertentu
 */
export const getIndonesianHolidayName = (dateInput: string): string | null => {
  const dateKey = normalizeDateStr(dateInput);
  if (INDONESIA_HOLIDAYS[dateKey]) return INDONESIA_HOLIDAYS[dateKey];
  const custom = getCustomHolidays();
  return custom[dateKey] || null;
};

/**
 * Cek apakah suatu tanggal adalah akhir pekan (Sabtu / Minggu)
 */
export const isWeekend = (dateInput: string): boolean => {
  const dateKey = normalizeDateStr(dateInput);
  if (!dateKey) return false;
  const d = new Date(dateKey + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
};

/**
 * Cek apakah suatu tanggal merupakan Hari Kerja Resmi (Senin - Jumat dan BUKAN Tanggal Merah)
 */
export const isWorkingDay = (dateInput: string): boolean => {
  const dateKey = normalizeDateStr(dateInput);
  if (!dateKey) return false;
  if (isWeekend(dateKey)) return false;
  if (isIndonesianHoliday(dateKey)) return false;
  return true;
};
