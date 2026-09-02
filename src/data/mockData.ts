import { User, AttendanceRecord, ActivityRecord, LeaveRequest, QRCodeConfig, AuditLog, NotificationItem } from '../types';

// ============================================================
// ADMIN USER (satu-satunya hardcoded user — akun admin default)
// ============================================================
export const INITIAL_ADMIN: User = {
  id: 'user-admin-01',
  name: 'Administrator',
  email: 'admin@magangku.id',
  role: 'admin',
  username: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  phone: '0811-9876-5432',
  status: 'Aktif'
};

// ============================================================
// QR CONFIG DEFAULT (untuk localStorage initialization)
// ============================================================
export const INITIAL_QR_CONFIG: QRCodeConfig = {
  officeName: 'Kantor Pusat MagangKu Jakarta',
  latitude: -6.2088,
  longitude: 106.8456,
  radiusMeters: 50,
  currentToken: '',
  isActive: true,
  lastGenerated: '',
  expiresAt: undefined
};

// ============================================================
// EMPTY DEFAULTS — data baru dibuat oleh user masing-masing
// ============================================================
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const INITIAL_ACTIVITIES: ActivityRecord[] = [];
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-sys-01',
    timestamp: new Date().toLocaleString('id-ID'),
    action: 'Sistem Diinisialisasi',
    category: 'Autentikasi',
    performedBy: 'System',
    details: 'Aplikasi MagangKu berhasil diinisialisasi.'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-sys-01',
    title: 'Selamat Datang di MagangKu',
    message: 'Silakan lengkapi profil dan lakukan absensi harian Anda.',
    time: 'Baru saja',
    read: false,
    type: 'info',
    linkTab: 'dashboard'
  }
];

// INITIAL_STUDENTS_LIST masih dieksport agar tidak ada import error di file lain
// Tapi isinya kosong — data user asli berasal dari localStorage 'magangku_users'
export const INITIAL_STUDENTS_LIST: User[] = [];
