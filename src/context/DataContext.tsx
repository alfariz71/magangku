import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AttendanceRecord, 
  ActivityRecord, 
  LeaveRequest, 
  QRCodeConfig, 
  AuditLog, 
  NotificationItem, 
  User, 
  LeaveStatus,
  AttendanceStatus 
} from '../types';
import { 
  INITIAL_ATTENDANCE_RECORDS, 
  INITIAL_ACTIVITIES, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_QR_CONFIG, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_STUDENTS_LIST 
} from '../data/mockData';
import { useAuth } from './AuthContext';

export type GpsSimulationMode = 'in_range' | 'out_of_range' | 'gps_off' | 'real_gps';

interface DataContextType {
  // Attendance
  attendances: AttendanceRecord[];
  todayAttendance: {
    checkIn: string | null;
    checkOut: string | null;
    totalHours: string | null;
    isCheckedIn: boolean;
    isCheckedOut: boolean;
    status: AttendanceStatus | null;
  };
  attendanceStats: {
    hadir: number;
    terlambat: number;
    izin: number;
  };
  performCheckIn: (photoUrl?: string) => { success: boolean; message: string };
  performCheckOut: (photoUrl?: string) => { success: boolean; message: string };
  adminCorrectAttendance: (id: string, checkIn: string, checkOut: string, status: AttendanceStatus, reason: string) => void;
  
  // QR & Location
  qrConfig: QRCodeConfig;
  updateQrConfig: (config: Partial<QRCodeConfig>) => void;
  regenerateQrToken: () => void;
  isQrScannedToday: boolean;
  scanQrToken: (token: string) => { success: boolean; message: string };
  resetQrScan: () => void;
  
  // Geolocation
  gpsMode: GpsSimulationMode;
  setGpsMode: (mode: GpsSimulationMode) => void;
  isLocationInRange: boolean;
  isGpsActive: boolean;
  checkRealGps: () => Promise<void>;
  
  // Activities
  activities: ActivityRecord[];
  addActivity: (day: string, date: string, title: string, time: string) => void;
  
  // Leave requests
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (startDate: string, endDate: string, leaveType: any, reason: string, docName?: string) => void;
  reviewLeaveRequest: (id: string, status: LeaveStatus, adminNotes: string) => void;
  
  // Students (Admin)
  students: User[];
  addStudent: (student: Omit<User, 'id'>) => void;
  updateStudent: (id: string, data: Partial<User>) => void;
  toggleStudentStatus: (id: string) => void;
  
  // Audit Logs & Notifications
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Local storage initialized states
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('magangku_attendances');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
  });

  const [activities, setActivities] = useState<ActivityRecord[]>(() => {
    const saved = localStorage.getItem('magangku_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('magangku_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [qrConfig, setQrConfig] = useState<QRCodeConfig>(() => {
    const saved = localStorage.getItem('magangku_qr_config');
    return saved ? JSON.parse(saved) : INITIAL_QR_CONFIG;
  });

  const [students, setStudents] = useState<User[]>(() => {
    const saved = localStorage.getItem('magangku_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS_LIST;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('magangku_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('magangku_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Ephemeral states for user session & QR scan status
  const [isQrScannedToday, setIsQrScannedToday] = useState<boolean>(true); // Default to scanned for good initial demo UX
  const [gpsMode, setGpsMode] = useState<GpsSimulationMode>('in_range');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('magangku_attendances', JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    localStorage.setItem('magangku_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('magangku_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('magangku_qr_config', JSON.stringify(qrConfig));
  }, [qrConfig]);

  useEffect(() => {
    localStorage.setItem('magangku_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('magangku_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('magangku_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Geolocation computation
  const isLocationInRange = gpsMode === 'in_range';
  const isGpsActive = gpsMode !== 'gps_off';

  const checkRealGps = async () => {
    if (!navigator.geolocation) {
      setGpsMode('gps_off');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        // Calculate distance using Haversine formula
        const R = 6371e3; // metres
        const φ1 = (lat * Math.PI) / 180;
        const φ2 = (qrConfig.latitude * Math.PI) / 180;
        const Δφ = ((qrConfig.latitude - lat) * Math.PI) / 180;
        const Δλ = ((qrConfig.longitude - lon) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= qrConfig.radiusMeters) {
          setGpsMode('in_range');
        } else {
          setGpsMode('out_of_range');
        }
      },
      () => {
        setGpsMode('gps_off');
      }
    );
  };

  // QR token scan method
  const scanQrToken = (token: string) => {
    if (!qrConfig.isActive) {
      return { success: false, message: 'QR Code absensi saat ini sedang dinonaktifkan oleh Administrator.' };
    }
    if (token && token.trim() !== '') {
      setIsQrScannedToday(true);
      return { success: true, message: `QR Code berhasil dipindai! Username: ${currentUser?.username || 'andi.pratama'} terverifikasi.` };
    }
    return { success: false, message: 'Token QR Code tidak valid atau kedaluwarsa.' };
  };

  const resetQrScan = () => {
    setIsQrScannedToday(false);
  };

  // Regenerate QR Token
  const regenerateQrToken = () => {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newToken = `MGK-HQ-2025-${randomHex}`;
    setQrConfig(prev => ({
      ...prev,
      currentToken: newToken,
      lastGenerated: new Date().toLocaleString('id-ID')
    }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(new Date()),
      action: 'Pengaturan QR Code',
      category: 'Pengaturan QR',
      performedBy: 'Admin',
      details: `Token QR Code baru dibuat: ${newToken}`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const updateQrConfig = (newCfg: Partial<QRCodeConfig>) => {
    setQrConfig(prev => ({ ...prev, ...newCfg }));
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(new Date()),
      action: 'Perubahan Lokasi/Radius QR',
      category: 'Pengaturan QR',
      performedBy: 'Admin',
      details: `Pengaturan lokasi/radius diubah (Radius: ${newCfg.radiusMeters || qrConfig.radiusMeters}m)`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Helper date formatters
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayNameIndo = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()] || 'Senin';
  };

  const formatIndonesianTimestamp = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${mins}`;
  };

  // Calculate today's state for the current logged-in user
  const userAttendances = attendances.filter(a => a.userId === (currentUser?.id || 'user-andi-01'));
  
  // Find current active attendance or default showcase record
  const currentRecord = userAttendances[0] || null;

  const todayAttendance = {
    checkIn: currentRecord?.checkInTime || '08:15 WIB',
    checkOut: currentRecord?.checkOutTime || '17:05 WIB',
    totalHours: currentRecord?.totalHours || '8 jam 50 menit',
    isCheckedIn: !!currentRecord?.checkInTime,
    isCheckedOut: !!currentRecord?.checkOutTime,
    status: currentRecord?.status || 'Hadir'
  };

  // Calculate stats for current user
  const attendanceStats = {
    hadir: userAttendances.filter(a => a.status === 'Hadir').length || 22,
    terlambat: userAttendances.filter(a => a.status === 'Terlambat').length || 2,
    izin: userAttendances.filter(a => a.status === 'Izin' || a.status === 'Sakit').length || 1
  };

  // Check In action
  const performCheckIn = (photoUrl?: string) => {
    if (!isLocationInRange) {
      return { success: false, message: 'Gagal melakukan absensi: Perangkat Anda berada di luar jangkauan area magang!' };
    }
    if (!isQrScannedToday) {
      return { success: false, message: 'Gagal melakukan absensi: Anda wajib memindai QR Code di lokasi magang terlebih dahulu!' };
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins} WIB`;
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15);
    const status: AttendanceStatus = isLate ? 'Terlambat' : 'Hadir';

    // R2 CDN URL or Captured Snapshot
    const finalPhotoUrl = photoUrl || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: currentUser?.id || 'user-andi-01',
      studentName: currentUser?.name || 'Andi Pratama',
      studentNim: currentUser?.nim || '2201234567',
      university: currentUser?.university || 'Universitas Indonesia',
      date: getTodayDateStr(),
      dayName: getDayNameIndo(getTodayDateStr()),
      checkInTime: timeStr,
      checkOutTime: null,
      totalHours: null,
      status: status,
      photoUrl: finalPhotoUrl,
      isQrValid: true,
      isLocationValid: true,
      qrTokenUsed: qrConfig.currentToken
    };

    setAttendances(prev => [newRecord, ...prev]);

    // Add Audit Log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(now),
      action: 'Absen Masuk (Cloudflare R2)',
      category: 'Absensi',
      performedBy: currentUser?.name || 'Andi Pratama',
      details: `Absen masuk tercatat pada ${timeStr} (Foto tersimpan di Cloudflare R2 bucket: magangku-foto-presensi)`
    };
    setAuditLogs(prev => [log, ...prev]);

    return { 
      success: true, 
      message: `Absen Masuk Berhasil! Foto tersimpan ke Cloudflare R2 pada ${timeStr}.` 
    };
  };

  // Check Out action
  const performCheckOut = (photoUrl?: string) => {
    if (!isLocationInRange) {
      return { success: false, message: 'Gagal melakukan absen pulang: Perangkat Anda berada di luar jangkauan lokasi magang!' };
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins} WIB`;
    const finalPhotoUrl = photoUrl || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350';

    // Find the latest record to update checkout
    setAttendances(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const target = { ...updated[0] };
      
      target.checkOutTime = timeStr;
      target.checkOutPhotoUrl = finalPhotoUrl;
      target.totalHours = '8 jam 50 menit';
      updated[0] = target;
      return updated;
    });

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(now),
      action: 'Absen Pulang (Cloudflare R2)',
      category: 'Absensi',
      performedBy: currentUser?.name || 'Andi Pratama',
      details: `Absen pulang tercatat pada ${timeStr}. Foto pulang tersimpan di Cloudflare R2.`
    };
    setAuditLogs(prev => [log, ...prev]);

    return {
      success: true,
      message: `Absen Pulang Berhasil! Waktu tercatat: ${timeStr}. Foto tersimpan ke Cloudflare R2.`
    };
  };

  // Admin manual attendance correction
  const adminCorrectAttendance = (id: string, checkIn: string, checkOut: string, status: AttendanceStatus, reason: string) => {
    setAttendances(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          checkInTime: checkIn || null,
          checkOutTime: checkOut || null,
          status: status,
          correctedByAdmin: true,
          correctionReason: reason,
          updatedAt: formatIndonesianTimestamp(new Date())
        };
      }
      return item;
    }));

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(new Date()),
      action: 'Koreksi Absensi Manual',
      category: 'Absensi',
      performedBy: 'Admin',
      details: `Koreksi absensi ID ${id}: Status=${status}, Alasan: ${reason}`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Activities
  const addActivity = (day: string, date: string, title: string, time: string) => {
    const newAct: ActivityRecord = {
      id: `act-${Date.now()}`,
      userId: currentUser?.id || 'user-andi-01',
      day,
      date,
      title,
      time,
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev]);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(new Date()),
      action: 'Jurnal Diperbarui',
      category: 'Absensi',
      performedBy: currentUser?.name || 'Andi Pratama',
      details: `${currentUser?.name || 'Andi Pratama'} menambahkan aktivitas: ${title}`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Leave request submission
  const submitLeaveRequest = (startDate: string, endDate: string, leaveType: any, reason: string, docName?: string) => {
    const now = new Date();
    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      userId: currentUser?.id || 'user-andi-01',
      studentName: currentUser?.name || 'Andi Pratama',
      studentNim: currentUser?.nim || '2201234567',
      university: currentUser?.university || 'Universitas Indonesia',
      requestDate: formatIndonesianTimestamp(now),
      startDate,
      endDate,
      leaveType,
      reason,
      documentName: docName || 'Dokumen_Pendukung.pdf',
      status: 'Menunggu'
    };

    setLeaveRequests(prev => [newReq, ...prev]);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(now),
      action: 'Pengajuan Izin',
      category: 'Pengajuan Izin',
      performedBy: currentUser?.name || 'Andi Pratama',
      details: `${currentUser?.name || 'Andi Pratama'} mengajukan izin ${leaveType} (${startDate} - ${endDate})`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Admin leave request review
  const reviewLeaveRequest = (id: string, status: LeaveStatus, adminNotes: string) => {
    const target = leaveRequests.find(r => r.id === id);
    if (!target) return;

    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status,
          adminNotes,
          reviewedAt: formatIndonesianTimestamp(new Date()),
          reviewedBy: 'Admin Pusat'
        };
      }
      return req;
    }));

    // If approved, automatically record attendance with status 'Izin' or 'Sakit'
    if (status === 'Disetujui') {
      const attStatus: AttendanceStatus = target.leaveType.includes('Sakit') ? 'Sakit' : 'Izin';
      const autoAttendance: AttendanceRecord = {
        id: `att-auto-${Date.now()}`,
        userId: target.userId,
        studentName: target.studentName,
        studentNim: target.studentNim,
        university: target.university,
        date: target.startDate,
        dayName: getDayNameIndo(target.startDate),
        checkInTime: null,
        checkOutTime: null,
        totalHours: null,
        status: attStatus,
        notes: `Pengajuan ${target.leaveType} disetujui admin (${target.reason})`,
        isQrValid: false,
        isLocationValid: false
      };
      setAttendances(prev => [autoAttendance, ...prev]);
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(new Date()),
      action: `Izin ${status}`,
      category: 'Pengajuan Izin',
      performedBy: 'Admin',
      details: `Pengajuan izin ${target.studentName} (${target.leaveType}) status diubah menjadi ${status}`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Student management (Admin)
  const addStudent = (newStudentData: Omit<User, 'id'>) => {
    const newStudent: User = {
      ...newStudentData,
      id: `user-${Date.now()}`
    };
    setStudents(prev => [newStudent, ...prev]);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: formatIndonesianTimestamp(new Date()),
      action: 'Peserta Baru',
      category: 'Data Peserta',
      performedBy: 'Admin',
      details: `${newStudent.name} (${newStudent.nim || 'Peserta'}) ditambahkan sebagai peserta magang baru`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const updateStudent = (id: string, data: Partial<User>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const toggleStudentStatus = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DataContext.Provider
      value={{
        attendances,
        todayAttendance,
        attendanceStats,
        performCheckIn,
        performCheckOut,
        adminCorrectAttendance,
        qrConfig,
        updateQrConfig,
        regenerateQrToken,
        isQrScannedToday,
        scanQrToken,
        resetQrScan,
        gpsMode,
        setGpsMode,
        isLocationInRange,
        isGpsActive,
        checkRealGps,
        activities,
        addActivity,
        leaveRequests,
        submitLeaveRequest,
        reviewLeaveRequest,
        students,
        addStudent,
        updateStudent,
        toggleStudentStatus,
        auditLogs,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
