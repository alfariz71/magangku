export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  username: string;
  phone?: string;
  nim?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  university?: string;
  faculty?: string;
  major?: string;
  concentration?: string;
  position?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  internshipDocumentUrl?: string;
  status?: 'Aktif' | 'Nonaktif' | 'Selesai';
  // signature field REMOVED intentionally
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha';

export interface AttendanceRecord {
  id: string;
  userId: string;
  studentName: string;
  studentNim: string;
  university: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: string | null;
  status: AttendanceStatus;
  notes?: string;
  qrSessionId?: string;
  checkInLat?: number;
  checkInLon?: number;
  checkInAccuracy?: number;
  checkInDistanceMeters?: number;
  checkOutLat?: number;
  checkOutLon?: number;
  checkOutAccuracy?: number;
  photoUrl?: string; // dokumentasi foto (opsional, disimpan ke Supabase Storage)
  isQrValid: boolean;
  isLocationValid: boolean;
  correctedByAdmin?: boolean;
  correctionReason?: string;
  updatedAt?: string;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  activityDate: string; // YYYY-MM-DD
  day?: string;
  date?: string; // kept for compatibility
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  time?: string; // kept for compatibility
  category?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeaveType = 'Izin Sakit' | 'Izin Pribadi' | 'Keperluan Akademik' | 'Dispensasi Kampus' | 'Lainnya';
export type LeaveStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface LeaveRequest {
  id: string;
  userId: string;
  studentName: string;
  studentNim: string;
  university: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  documentName?: string;
  documentUrl?: string;
  status: LeaveStatus;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  minGpsAccuracy: number; // max acceptable accuracy in meters
  isActive: boolean;
  createdAt?: string;
  updatedBy?: string;
}

export interface Shift {
  id: string;
  name: string;
  checkInStart: string; // '07:00'
  checkInEnd: string;   // '08:00' - masuk harus sebelum jam ini agar tepat waktu
  checkOutTime: string; // '17:00'
  lateTolerationMinutes: number; // 0 = tidak ada toleransi
  workDays: number[]; // [1,2,3,4,5] = Senin-Jumat
  isActive: boolean;
}

export interface QRCodeConfig {
  officeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  currentToken: string;
  isActive: boolean;
  lastGenerated: string;
  expiresAt?: string; // ISO string - QR expiry time
}

export interface AttendanceCorrectionRequest {
  id: string;
  userId: string;
  studentName: string;
  attendanceDate: string;
  correctionType: string; // 'Lupa Absen Masuk' | 'Lupa Absen Pulang' | 'GPS Gagal' | 'QR Bermasalah' | 'Lainnya'
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  evidenceUrl?: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'Absensi' | 'Pengajuan Izin' | 'Data Peserta' | 'Pengaturan QR' | 'Autentikasi' | 'Aktivitas' | 'Koreksi';
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

export interface DocumentasiItem {
  id: string;
  userId: string;
  uploaderName: string;
  title: string;
  caption?: string;
  photoUrl: string;
  takenAt: string; // YYYY-MM-DD
  createdAt: string;
}
