export type UserRole = 'mahasiswa' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  username: string; // e.g. andi.pratama
  phone?: string;
  nim?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  university?: string;
  major?: string;
  concentration?: string;
  startDate?: string;
  endDate?: string;
  signature?: string; // Base64 data URL
  status?: 'Aktif' | 'Nonaktif' | 'Selesai';
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha';

export interface AttendanceRecord {
  id: string;
  userId: string;
  studentName: string;
  studentNim: string;
  university: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Senin, Selasa, etc.
  checkInTime: string | null; // e.g. "08:15 WIB"
  checkOutTime: string | null; // e.g. "17:05 WIB"
  totalHours: string | null; // e.g. "8 jam 50 menit"
  status: AttendanceStatus;
  notes?: string;
  qrTokenUsed?: string;
  photoUrl?: string; // Link CDN Cloudflare R2 untuk foto presensi masuk
  checkOutPhotoUrl?: string; // Link CDN Cloudflare R2 untuk foto presensi pulang
  isQrValid: boolean;
  isLocationValid: boolean;
  distanceMeters?: number;
  correctedByAdmin?: boolean;
  correctionReason?: string;
  updatedAt?: string;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  day: string; // e.g. "Senin"
  date: string; // e.g. "20 Mei 2025" or YYYY-MM-DD
  title: string; // Judul Aktivitas
  time: string; // e.g. "08:00 - 17:00 WIB"
  createdAt: string;
}

export type LeaveType = 'Izin Sakit' | 'Izin Pribadi' | 'Keperluan Akademik' | 'Dispensasi Kampus' | 'Lainnya';
export type LeaveStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface LeaveRequest {
  id: string;
  userId: string;
  studentName: string;
  studentNim: string;
  university: string;
  requestDate: string; // e.g. "21 Mei 2025 08:45"
  startDate: string; // e.g. "22 Mei 2025"
  endDate: string; // e.g. "22 Mei 2025"
  leaveType: LeaveType;
  reason: string;
  documentName?: string;
  documentUrl?: string; // Mock or base64
  status: LeaveStatus;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface QRCodeConfig {
  officeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 100, 200, 500
  currentToken: string;
  isActive: boolean;
  lastGenerated: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'Absensi' | 'Pengajuan Izin' | 'Data Peserta' | 'Pengaturan QR' | 'Autentikasi';
  performedBy: string;
  details: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'reminder';
  linkTab?: string;
}
