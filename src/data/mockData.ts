import { User, AttendanceRecord, ActivityRecord, LeaveRequest, QRCodeConfig, AuditLog, NotificationItem } from '../types';

export const INITIAL_MAHASISWA: User = {
  id: 'user-andi-01',
  name: 'Andi Pratama',
  email: 'andi.pratama@email.com',
  role: 'mahasiswa',
  username: 'andi.pratama',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
  birthPlace: 'Jakarta',
  birthDate: '2003-08-15',
  gender: 'Laki-laki',
  phone: '0812-3456-7890',
  nim: '2201234567',
  university: 'Universitas Indonesia',
  major: 'Sistem Informasi',
  concentration: 'Pengembangan Sistem Informasi',
  startDate: '2025-05-20',
  endDate: '2025-08-20',
  status: 'Aktif',
  signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M 40 70 Q 70 20 100 65 T 160 50 T 210 75 T 260 40" stroke="%23183B66" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M 90 90 Q 150 100 230 85" stroke="%23183B66" stroke-width="2" fill="none"/></svg>'
};

export const INITIAL_ADMIN: User = {
  id: 'user-admin-01',
  name: 'Admin',
  email: 'admin@magangku.id',
  role: 'admin',
  username: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  phone: '0811-9876-5432',
  status: 'Aktif'
};

export const INITIAL_STUDENTS_LIST: User[] = [
  INITIAL_MAHASISWA,
  {
    id: 'user-siti-02',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@ui.ac.id',
    role: 'mahasiswa',
    username: 'siti.nurhaliza',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    birthPlace: 'Bandung',
    birthDate: '2003-04-12',
    gender: 'Perempuan',
    phone: '0813-8877-6655',
    nim: '2201234588',
    university: 'Universitas Indonesia',
    major: 'Ilmu Komputer',
    concentration: 'Software Engineering',
    startDate: '2025-05-20',
    endDate: '2025-08-20',
    status: 'Aktif'
  },
  {
    id: 'user-budi-03',
    name: 'Budi Santoso',
    email: 'budi.santoso@itb.ac.id',
    role: 'mahasiswa',
    username: 'budi.santoso',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250',
    birthPlace: 'Surabaya',
    birthDate: '2002-11-23',
    gender: 'Laki-laki',
    phone: '0812-9988-1122',
    nim: '13522045',
    university: 'Institut Teknologi Bandung',
    major: 'Teknik Informatika',
    concentration: 'Artificial Intelligence',
    startDate: '2025-05-20',
    endDate: '2025-08-20',
    status: 'Aktif'
  },
  {
    id: 'user-rara-04',
    name: 'Rara Sekar Kinanti',
    email: 'rara.sekar@ugm.ac.id',
    role: 'mahasiswa',
    username: 'rara.sekar',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    birthPlace: 'Yogyakarta',
    birthDate: '2003-01-19',
    gender: 'Perempuan',
    phone: '0857-1234-9876',
    nim: '22/492100/TK/54120',
    university: 'Universitas Gadjah Mada',
    major: 'Teknologi Informasi',
    concentration: 'UI/UX & Product Design',
    startDate: '2025-05-20',
    endDate: '2025-08-20',
    status: 'Aktif'
  },
  {
    id: 'user-reza-05',
    name: 'Reza Rahadian Fahmi',
    email: 'reza.rahadian@its.ac.id',
    role: 'mahasiswa',
    username: 'reza.fahmi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    birthPlace: 'Malang',
    birthDate: '2002-09-08',
    gender: 'Laki-laki',
    phone: '0821-4455-6677',
    nim: '5025201099',
    university: 'Institut Teknologi Sepuluh Nopember',
    major: 'Sistem Informasi',
    concentration: 'Cloud & DevOps Architecture',
    startDate: '2025-05-20',
    endDate: '2025-08-20',
    status: 'Aktif'
  }
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-01',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    date: '2025-05-20',
    dayName: 'Selasa',
    checkInTime: '08:05 WIB',
    checkOutTime: '17:06 WIB',
    totalHours: '9 jam 1 menit',
    status: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350',
    checkOutPhotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350',
    isQrValid: true,
    isLocationValid: true,
    notes: 'Tepat waktu di kantor pusat'
  },
  {
    id: 'att-02',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    date: '2025-05-19',
    dayName: 'Senin',
    checkInTime: '08:12 WIB',
    checkOutTime: '17:06 WIB',
    totalHours: '8 jam 54 menit',
    status: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350',
    isQrValid: true,
    isLocationValid: true
  },
  {
    id: 'att-03',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    date: '2025-05-16',
    dayName: 'Jumat',
    checkInTime: '08:00 WIB',
    checkOutTime: '17:00 WIB',
    totalHours: '9 jam 0 menit',
    status: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350',
    isQrValid: true,
    isLocationValid: true
  },
  {
    id: 'att-04',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    date: '2025-05-15',
    dayName: 'Kamis',
    checkInTime: '08:10 WIB',
    checkOutTime: '17:02 WIB',
    totalHours: '8 jam 52 menit',
    status: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350',
    isQrValid: true,
    isLocationValid: true
  },
  {
    id: 'att-05',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    date: '2025-05-14',
    dayName: 'Rabu',
    checkInTime: null,
    checkOutTime: null,
    totalHours: null,
    status: 'Izin',
    notes: 'Izin sakit terverifikasi surat dokter',
    isQrValid: false,
    isLocationValid: false
  },
  {
    id: 'att-06',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    date: '2025-05-13',
    dayName: 'Selasa',
    checkInTime: '08:20 WIB',
    checkOutTime: '17:10 WIB',
    totalHours: '8 jam 50 menit',
    status: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350',
    isQrValid: true,
    isLocationValid: true
  },
  {
    id: 'att-07',
    userId: 'user-siti-02',
    studentName: 'Siti Nurhaliza',
    studentNim: '2201234588',
    university: 'Universitas Indonesia',
    date: '2025-05-20',
    dayName: 'Selasa',
    checkInTime: '08:02 WIB',
    checkOutTime: '17:00 WIB',
    totalHours: '8 jam 58 menit',
    status: 'Hadir',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=350',
    isQrValid: true,
    isLocationValid: true
  },
  {
    id: 'att-08',
    userId: 'user-budi-03',
    studentName: 'Budi Santoso',
    studentNim: '13522045',
    university: 'Institut Teknologi Bandung',
    date: '2025-05-20',
    dayName: 'Selasa',
    checkInTime: '08:45 WIB',
    checkOutTime: '17:15 WIB',
    totalHours: '8 jam 30 menit',
    status: 'Terlambat',
    photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=350',
    notes: 'Terlambat 45 menit karena macet jalan tol',
    isQrValid: true,
    isLocationValid: true
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-01',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    requestDate: '21 Mei 2025 08:45',
    startDate: '22 Mei 2025',
    endDate: '22 Mei 2025',
    leaveType: 'Izin Sakit',
    reason: 'Demam tinggi dan diperlukan istirahat serta pemeriksaan dokter.',
    documentName: 'Surat_Keterangan_Dokter_Klinik_Medika.pdf',
    status: 'Menunggu'
  },
  {
    id: 'leave-02',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    requestDate: '15 Mei 2025 10:30',
    startDate: '16 Mei 2025',
    endDate: '16 Mei 2025',
    leaveType: 'Izin Pribadi',
    reason: 'Keperluan keluarga mendadak.',
    documentName: 'Surat_Permohonan_Keluarga.pdf',
    status: 'Disetujui',
    adminNotes: 'Izin disetujui oleh Administrator.',
    reviewedAt: '15 Mei 2025 14:00',
    reviewedBy: 'Admin Pusat'
  },
  {
    id: 'leave-03',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    requestDate: '05 Mei 2025 14:15',
    startDate: '05 Mei 2025',
    endDate: '05 Mei 2025',
    leaveType: 'Izin Sakit',
    reason: 'Sakit dan perlu pemeriksaan dokter.',
    documentName: 'Resep_dan_Surat_Istirahat.pdf',
    status: 'Disetujui',
    adminNotes: 'Lekas sembuh.',
    reviewedAt: '05 Mei 2025 15:30',
    reviewedBy: 'Admin Pusat'
  },
  {
    id: 'leave-04',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    requestDate: '28 Apr 2025 09:20',
    startDate: '29 Apr 2025',
    endDate: '29 Apr 2025',
    leaveType: 'Izin Pribadi',
    reason: 'Mengurus keperluan administrasi pribadi.',
    documentName: 'Lampiran_KTP_KK.pdf',
    status: 'Ditolak',
    adminNotes: 'Pengajuan mendadak dan kegiatan tim sedang sprint release penting.',
    reviewedAt: '28 Apr 2025 11:15',
    reviewedBy: 'Admin Pusat'
  },
  {
    id: 'leave-05',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    requestDate: '18 Apr 2025 16:05',
    startDate: '21 Apr 2025',
    endDate: '21 Apr 2025',
    leaveType: 'Izin Sakit',
    reason: 'Sakit flu dan batuk.',
    documentName: 'Surat_Klinik_Pratama.jpg',
    status: 'Disetujui',
    adminNotes: 'Disetujui',
    reviewedAt: '18 Apr 2025 17:00',
    reviewedBy: 'Admin Pusat'
  },
  {
    id: 'leave-06',
    userId: 'user-andi-01',
    studentName: 'Andi Pratama',
    studentNim: '2201234567',
    university: 'Universitas Indonesia',
    requestDate: '10 Apr 2025 11:40',
    startDate: '11 Apr 2025',
    endDate: '11 Apr 2025',
    leaveType: 'Izin Pribadi',
    reason: 'Menghadiri acara keluarga.',
    documentName: 'Undangan_Keluarga.pdf',
    status: 'Disetujui',
    adminNotes: 'Disetujui',
    reviewedAt: '10 Apr 2025 13:20',
    reviewedBy: 'Admin Pusat'
  }
];

export const INITIAL_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act-01',
    userId: 'user-andi-01',
    day: 'Selasa',
    date: '20 Mei 2025',
    title: 'Pengembangan Modul Autentikasi dan Dashboard Absensi Frontend MagangKu',
    time: '08:00 - 17:00 WIB',
    createdAt: '2025-05-20T17:05:00Z'
  },
  {
    id: 'act-02',
    userId: 'user-andi-01',
    day: 'Senin',
    date: '19 Mei 2025',
    title: 'Analisis Kebutuhan Sistem & Wireframing Komponen UI/UX',
    time: '08:15 - 17:00 WIB',
    createdAt: '2025-05-19T17:00:00Z'
  },
  {
    id: 'act-03',
    userId: 'user-andi-01',
    day: 'Jumat',
    date: '16 Mei 2025',
    title: 'Integrasi Geolocation Geofence Radius dan Testing Scanner QR Code',
    time: '08:00 - 16:30 WIB',
    createdAt: '2025-05-16T16:30:00Z'
  },
  {
    id: 'act-04',
    userId: 'user-andi-01',
    day: 'Kamis',
    date: '15 Mei 2025',
    title: 'Review Standarisasi Kode, Design Tokens, dan Responsive Mobile UI',
    time: '08:10 - 17:00 WIB',
    createdAt: '2025-05-15T17:00:00Z'
  },
  {
    id: 'act-05',
    userId: 'user-andi-01',
    day: 'Selasa',
    date: '13 Mei 2025',
    title: 'Setup Environment Proyek, Arsitektur Folder, dan Dokumentasi API',
    time: '08:20 - 17:10 WIB',
    createdAt: '2025-05-13T17:10:00Z'
  }
];

export const INITIAL_QR_CONFIG: QRCodeConfig = {
  officeName: 'Kantor Pusat MagangKu Jakarta',
  latitude: -6.2088,
  longitude: 106.8456,
  radiusMeters: 200,
  currentToken: 'MGK-HQ-2025-SECURE-TOKEN-99',
  isActive: true,
  lastGenerated: '2025-05-21 07:00:00'
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '21 Mei 2025 10:30',
    action: 'Pengajuan Izin',
    category: 'Pengajuan Izin',
    performedBy: 'Andi Pratama',
    details: 'Andi Pratama mengajukan izin pada 23 Mei 2025'
  },
  {
    id: 'log-02',
    timestamp: '21 Mei 2025 09:15',
    action: 'Jurnal Diperbarui',
    category: 'Absensi',
    performedBy: 'Siti Nurhaliza',
    details: 'Siti Nurhaliza memperbarui jurnal Minggu ke-4'
  },
  {
    id: 'log-03',
    timestamp: '20 Mei 2025 16:45',
    action: 'Peserta Baru',
    category: 'Data Peserta',
    performedBy: 'Admin',
    details: 'Budi Santoso ditambahkan sebagai peserta magang'
  },
  {
    id: 'log-04',
    timestamp: '20 Mei 2025 13:30',
    action: 'Perusahaan Diperbarui',
    category: 'Pengaturan QR',
    performedBy: 'Admin',
    details: 'Data perusahaan PT Inovasi Digital diperbarui'
  },
  {
    id: 'log-05',
    timestamp: '19 Mei 2025 11:00',
    action: 'Absensi Diperbarui',
    category: 'Absensi',
    performedBy: 'Admin',
    details: 'Absensi peserta pada 19 Mei 2025 telah diperbarui'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    title: 'Pengingat Absensi Hari Ini',
    message: 'Jangan lupa untuk melakukan Absen Pulang sebelum pukul 18:00 WIB.',
    time: '15 menit yang lalu',
    read: false,
    type: 'reminder',
    linkTab: 'absensi'
  },
  {
    id: 'notif-02',
    title: 'Pengajuan Izin Diproses',
    message: 'Pengajuan izin tanggal 16 Mei 2025 telah disetujui oleh Administrator.',
    time: '2 jam yang lalu',
    read: false,
    type: 'success',
    linkTab: 'izin'
  },
  {
    id: 'notif-03',
    title: 'Pemberitahuan Sistem',
    message: 'QR Code lokasi magang telah diperbarui untuk masa berlaku minggu ini.',
    time: '1 hari yang lalu',
    read: false,
    type: 'info',
    linkTab: 'absensi'
  }
];
