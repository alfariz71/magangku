import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  AttendanceRecord,
  ActivityRecord,
  LeaveRequest,
  QRCodeConfig,
  AuditLog,
  NotificationItem,
  User,
  LeaveStatus,
  AttendanceStatus,
  Location,
  AttendanceCorrectionRequest
} from '../types';
import { useAuth } from './AuthContext';

// ============================================================
// GPS State Types
// ============================================================
export type GpsStatus =
  | 'idle'
  | 'loading'
  | 'in_range'
  | 'out_of_range'
  | 'low_accuracy'
  | 'permission_denied'
  | 'unavailable';

export interface GpsState {
  status: GpsStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distanceMeters: number | null;
  nearestLocationName?: string | null;
  targetRadiusMeters?: number | null;
  lastUpdated: string | null;
}

// ============================================================
// Context Types
// ============================================================
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
  attendanceStats: { hadir: number; terlambat: number; izin: number; alpha: number };
  isAttendanceLoading: boolean;
  performCheckIn: () => Promise<{ success: boolean; message: string }>;
  performCheckOut: () => Promise<{ success: boolean; message: string }>;
  adminCorrectAttendance: (id: string, checkIn: string, checkOut: string, status: AttendanceStatus, reason: string) => Promise<void>;
  refreshAttendances: () => Promise<void>;

  // QR & Location
  qrConfig: QRCodeConfig;
  activeLocation: Location | null;
  locations: Location[];
  locationQrMap: Record<string, string>;
  updateQrConfig: (config: Partial<QRCodeConfig>) => void;
  regenerateQrToken: () => Promise<void>;
  generateQrForLocationId: (locationId: string) => Promise<void>;
  isQrScannedToday: boolean;
  scanQrToken: (token: string) => Promise<{ success: boolean; message: string }>;
  resetQrScan: () => void;
  refreshLocations: () => Promise<void>;
  addLocation: (location: Partial<Location>) => Promise<void>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<void>;
  toggleLocationStatus: (id: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  // GPS
  gpsState: GpsState;
  startGpsWatch: () => void;
  stopGpsWatch: () => void;
  retryGps: () => void;

  // Activities
  activities: ActivityRecord[];
  isActivitiesLoading: boolean;
  addActivity: (data: Partial<ActivityRecord>) => Promise<void>;
  updateActivity: (id: string, data: Partial<ActivityRecord>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  refreshActivities: () => Promise<void>;

  // Leave requests
  leaveRequests: LeaveRequest[];
  isLeaveLoading: boolean;
  submitLeaveRequest: (startDate: string, endDate: string, leaveType: any, reason: string, docName?: string) => Promise<{ success: boolean; message: string }>;
  reviewLeaveRequest: (id: string, status: LeaveStatus, adminNotes: string) => Promise<void>;
  refreshLeaveRequests: () => Promise<void>;

  // Correction requests
  correctionRequests: AttendanceCorrectionRequest[];
  submitCorrectionRequest: (data: Partial<AttendanceCorrectionRequest>) => Promise<{ success: boolean; message: string }>;
  reviewCorrectionRequest: (id: string, status: 'Disetujui' | 'Ditolak', adminNotes: string) => Promise<void>;
  refreshCorrectionRequests: () => Promise<void>;

  // Students (Admin)
  students: User[];
  isStudentsLoading: boolean;
  refreshStudents: () => Promise<void>;
  addStudent: (student: Omit<User, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<User>) => Promise<void>;
  toggleStudentStatus: (id: string) => Promise<void>;

  // Audit Logs & Notifications
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ============================================================
// Haversine Distance
// ============================================================
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// Date/Time Helpers
// ============================================================
function getTodayJakarta(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}
function getTimeJakarta(): string {
  return new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

// ============================================================
// Provider
// ============================================================
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // ---- State ----
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);

  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>([]);

  const [students, setStudents] = useState<User[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  // Map dari location_id → token QR aktif untuk lokasi tersebut
  const [locationQrMap, setLocationQrMap] = useState<Record<string, string>>({});

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [isQrScannedToday, setIsQrScannedToday] = useState(false);
  const [qrConfig, setQrConfig] = useState<QRCodeConfig>({
    officeName: 'Kantor Pusat',
    latitude: -6.208763,
    longitude: 106.845599,
    radiusMeters: 50,
    currentToken: '',
    isActive: true,
    lastGenerated: '',
    expiresAt: undefined
  });

  const [gpsState, setGpsState] = useState<GpsState>({
    status: 'idle', latitude: null, longitude: null, accuracy: null, distanceMeters: null, lastUpdated: null
  });
  const watchIdRef = useRef<number | null>(null);

  // ---- Load data when user changes ----
  useEffect(() => {
    if (currentUser?.id) {
      refreshAttendances();
      refreshActivities();
      refreshLeaveRequests();
      refreshLocations();
      refreshNotifications();
      refreshCorrectionRequests();
      checkQrScanToday();
      if (currentUser.role === 'admin') {
        refreshStudents();
        refreshAuditLogs();
      }
    }
  }, [currentUser?.id]);

  // ---- ATTENDANCES ----
  const refreshAttendances = async () => {
    if (!currentUser?.id) return;
    setIsAttendanceLoading(true);
    try {
      let query = supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: false });

      if (currentUser.role !== 'admin') {
        query = query.eq('user_id', currentUser.id);
      }

      const { data: records, error } = await query;
      if (error) {
        console.error('Error fetching attendances:', error.message);
        return;
      }

      if (!records) {
        setAttendances([]);
        return;
      }

      // Fetch user profiles to enrich student info
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, nim, university, photo_url');

      // Fetch qr_sessions to map location
      const { data: qrSessions } = await supabase
        .from('qr_sessions')
        .select('id, location_id');

      const { data: locsData } = await supabase
        .from('locations')
        .select('id, name');

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const qrLocMap = new Map((qrSessions || []).map((q: any) => [q.id, q.location_id]));
      const locNameMap = new Map((locsData || []).map((l: any) => [l.id, l.name]));

      const mapped = records.map((r: Record<string, unknown>) => {
        const p = profileMap.get(r.user_id as string);
        const locId = r.qr_session_id ? qrLocMap.get(r.qr_session_id as string) : null;
        const locName = locId ? locNameMap.get(locId) : null;
        return mapDbAttendance(r, p, locName);
      });

      setAttendances(mapped);
    } catch (err) {
      console.error('refreshAttendances unexpected error:', err);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  function mapDbAttendance(
    r: Record<string, unknown>,
    p?: { full_name?: string; nim?: string; university?: string; photo_url?: string },
    locName?: string | null
  ): AttendanceRecord {
    const dateStr = r.date as string;
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[new Date(dateStr + 'T00:00:00').getDay()];

    const checkInFormatted = r.check_in_time ? new Date(r.check_in_time as string).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : null;
    const checkOutFormatted = r.check_out_time ? new Date(r.check_out_time as string).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : null;

    let computedTotalHours = r.total_hours as string | null;
    if (r.check_in_time && r.check_out_time) {
      const inTime = new Date(r.check_in_time as string).getTime();
      const outTime = new Date(r.check_out_time as string).getTime();
      if (!isNaN(inTime) && !isNaN(outTime) && outTime >= inTime) {
        const diffMinutes = Math.round((outTime - inTime) / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        computedTotalHours = `${hours} jam ${mins} menit`;
      }
    }

    return {
      id: r.id as string,
      userId: r.user_id as string,
      studentName: p?.full_name || (currentUser?.id === r.user_id ? (currentUser?.name || 'Peserta') : 'Peserta'),
      studentNim: p?.nim || (currentUser?.id === r.user_id ? (currentUser?.nim || '-') : '-'),
      university: p?.university || (currentUser?.id === r.user_id ? (currentUser?.university || '-') : '-'),
      date: dateStr,
      dayName,
      checkInTime: checkInFormatted,
      checkOutTime: checkOutFormatted,
      totalHours: computedTotalHours,
      status: r.status as AttendanceStatus,
      notes: r.notes as string | undefined,
      qrSessionId: r.qr_session_id as string | undefined,
      checkInLat: r.check_in_lat as number | undefined,
      checkInLon: r.check_in_lon as number | undefined,
      checkInAccuracy: r.check_in_accuracy as number | undefined,
      checkInDistanceMeters: r.check_in_distance_meters as number | undefined,
      checkOutLat: r.check_out_lat as number | undefined,
      checkOutLon: r.check_out_lon as number | undefined,
      photoUrl: (r.photo_url as string) || p?.photo_url || undefined,
      isQrValid: r.is_qr_valid as boolean,
      isLocationValid: r.is_location_valid as boolean,
      correctedByAdmin: !!r.corrected_by,
      correctionReason: r.correction_reason as string | undefined,
      updatedAt: r.corrected_at as string | undefined,
      locationName: locName || undefined,
    };
  }

  const todayStr = getTodayJakarta();
  const todayRecord = attendances.find(a => a.userId === currentUser?.id && a.date === todayStr) || null;
  const todayAttendance = {
    checkIn: todayRecord?.checkInTime || null,
    checkOut: todayRecord?.checkOutTime || null,
    totalHours: todayRecord?.totalHours || null,
    isCheckedIn: !!todayRecord?.checkInTime,
    isCheckedOut: !!todayRecord?.checkOutTime,
    status: todayRecord?.status || null
  };

  const attendanceStats = {
    hadir: attendances.filter(a => a.userId === currentUser?.id && a.status === 'Hadir').length,
    terlambat: attendances.filter(a => a.userId === currentUser?.id && a.status === 'Terlambat').length,
    izin: attendances.filter(a => a.userId === currentUser?.id && (a.status === 'Izin' || a.status === 'Sakit')).length,
    alpha: attendances.filter(a => a.userId === currentUser?.id && a.status === 'Alpha').length
  };

  // ---- LOCATIONS ----
  const refreshLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('created_at');
    if (data) {
      const locs: Location[] = data.map((l: Record<string, unknown>) => ({
        id: l.id as string, name: l.name as string, address: l.address as string,
        latitude: l.latitude as number, longitude: l.longitude as number,
        radiusMeters: l.radius_meters as number, minGpsAccuracy: l.min_gps_accuracy as number,
        isActive: l.is_active as boolean
      }));
      setLocations(locs);
      const activeLoc = locs.find(l => l.isActive) || null;
      setActiveLocation(activeLoc);
      if (activeLoc) {
        setQrConfig(prev => ({
          ...prev,
          officeName: activeLoc.name,
          latitude: activeLoc.latitude,
          longitude: activeLoc.longitude,
          radiusMeters: activeLoc.radiusMeters,
        }));
      }
      // Fetch QR token aktif untuk setiap lokasi
      const locIds = locs.map(l => l.id);
      if (locIds.length > 0) {
        const { data: qrData } = await supabase
          .from('qr_sessions')
          .select('location_id, token')
          .in('location_id', locIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (qrData) {
          const qrMap: Record<string, string> = {};
          qrData.forEach((q: any) => {
            if (!qrMap[q.location_id]) qrMap[q.location_id] = q.token;
          });
          setLocationQrMap(qrMap);
          // Set active QR config dari lokasi aktif
          if (activeLoc && qrMap[activeLoc.id]) {
            setQrConfig(prev => ({ ...prev, currentToken: qrMap[activeLoc.id] }));
          }
        }
      }
    }
  };

  const addLocation = async (loc: Partial<Location>) => {
    const { data: insertData, error } = await supabase.from('locations').insert({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius_meters: loc.radiusMeters,
      min_gps_accuracy: loc.minGpsAccuracy,
      is_active: loc.isActive,
      updated_by: currentUser?.id
    }).select().single();

    if (!error && insertData) {
      // Auto-generate permanent QR for new location
      await generateQrForLocation(insertData.id, insertData.name);
      await refreshLocations();
      await addAuditLog('Tambah Lokasi', 'Lokasi', `Lokasi baru ditambahkan: ${loc.name} (QR otomatis dibuat)`);
    }
  };

  const updateLocation = async (id: string, loc: Partial<Location>) => {
    const { error } = await supabase.from('locations').update({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius_meters: loc.radiusMeters,
      min_gps_accuracy: loc.minGpsAccuracy,
      is_active: loc.isActive,
      updated_by: currentUser?.id
    }).eq('id', id);
    if (!error) {
      await refreshLocations();
      await addAuditLog('Update Lokasi', 'Lokasi', `Lokasi diupdate: ${loc.name}`);
    }
  };

  const toggleLocationStatus = async (id: string) => {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    const { error } = await supabase.from('locations').update({
      is_active: !loc.isActive,
      updated_by: currentUser?.id
    }).eq('id', id);
    if (!error) {
      await refreshLocations();
      await addAuditLog('Update Lokasi', 'Lokasi', `Status lokasi ${loc.name} diubah menjadi ${!loc.isActive ? 'Aktif' : 'Nonaktif'}`);
    }
  };

  const deleteLocation = async (id: string) => {
    const loc = locations.find(l => l.id === id);
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (!error) {
      await refreshLocations();
      await addAuditLog('Hapus Lokasi', 'Lokasi', `Lokasi dihapus: ${loc?.name || id}`);
    }
  };

  // ---- QR Token ----
  // Internal helper: generate a permanent QR for a specific location (1 lokasi = 1 QR)
  const generateQrForLocation = async (locationId: string, locationName: string) => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newToken = `MGK-${Date.now()}-${randomPart}`;
    const expiresAt = new Date('2099-12-31T23:59:59Z').toISOString();

    // Deactivate existing QR for this location first
    await supabase
      .from('qr_sessions')
      .update({ is_active: false })
      .eq('location_id', locationId)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('qr_sessions')
      .insert({
        location_id: locationId,
        token: newToken,
        expires_at: expiresAt,
        is_active: true,
        created_by: currentUser?.id,
        used_by: []
      })
      .select()
      .single();

    if (!error && data) {
      setQrConfig(prev => ({
        ...prev,
        currentToken: newToken,
        lastGenerated: new Date().toLocaleString('id-ID'),
        expiresAt
      }));
      setLocationQrMap(prev => ({ ...prev, [locationId]: newToken }));
      await addAuditLog('Generate QR Token', 'Pengaturan QR', `QR permanen dibuat untuk lokasi: ${locationName}`);
      return newToken;
    }
    return null;
  };

  // Public: regenerate token for active location
  const regenerateQrToken = async () => {
    if (!activeLocation) return;
    await generateQrForLocation(activeLocation.id, activeLocation.name);
  };

  // Generate/regenerate QR untuk lokasi tertentu berdasarkan ID
  const generateQrForLocationId = async (locationId: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;
    await generateQrForLocation(locationId, loc.name);
  };

  const updateQrConfig = (newCfg: Partial<QRCodeConfig>) => {
    setQrConfig(prev => ({ ...prev, ...newCfg }));
  };

  // ---- QR Scan Today ----
  const checkQrScanToday = async () => {
    if (!currentUser?.id) return;
    const { data } = await supabase
      .from('attendance_records')
      .select('id, check_in_time')
      .eq('user_id', currentUser.id)
      .eq('date', todayStr)
      .maybeSingle();

    setIsQrScannedToday(!!data?.check_in_time);
  };

  const scanQrToken = async (token: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) return { success: false, message: 'Silakan login terlebih dahulu.' };

    const { data: qrSession, error } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !qrSession) {
      return { success: false, message: 'QR Code tidak valid atau tidak ditemukan.' };
    }

    if (new Date(qrSession.expires_at as string) < new Date()) {
      return { success: false, message: 'QR Code sudah kedaluwarsa. Hubungi admin.' };
    }

    // Check if user already attended today (both in and out)
    const { data: existingAtt } = await supabase
      .from('attendance_records')
      .select('id, check_in_time, check_out_time')
      .eq('user_id', currentUser.id)
      .eq('date', todayStr)
      .maybeSingle();

    if (existingAtt && existingAtt.check_in_time && existingAtt.check_out_time) {
      return { success: false, message: 'Anda sudah menyelesaikan absensi masuk dan pulang hari ini.' };
    }

    // Match scanned QR with the correct location and update GPS target immediately
    if (qrSession.location_id) {
      const scannedLoc = locations.find(l => l.id === qrSession.location_id);
      if (scannedLoc) {
        setActiveLocation(scannedLoc);
        setQrConfig(prev => ({
          ...prev,
          officeName: scannedLoc.name,
          latitude: scannedLoc.latitude,
          longitude: scannedLoc.longitude,
          radiusMeters: scannedLoc.radiusMeters,
          currentToken: token
        }));
      }
    }

    setIsQrScannedToday(true);
    setQrConfig(prev => ({ ...prev, currentToken: token }));
    return { success: true, message: 'QR Code valid dan berhasil diverifikasi!' };
  };

  const resetQrScan = () => setIsQrScannedToday(false);


  // ---- GPS ----
  const handleGpsSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Auto-detect nearest active office location from all locations
    const activeLocs = locations.filter(l => l.isActive);
    let targetLoc: { id?: string; name: string; latitude: number; longitude: number; radiusMeters: number; minGpsAccuracy?: number };
    let distance: number;

    if (activeLocs.length > 0) {
      let nearest = activeLocs[0];
      let shortestDist = haversineDistance(latitude, longitude, nearest.latitude, nearest.longitude);

      for (let i = 1; i < activeLocs.length; i++) {
        const d = haversineDistance(latitude, longitude, activeLocs[i].latitude, activeLocs[i].longitude);
        if (d < shortestDist) {
          shortestDist = d;
          nearest = activeLocs[i];
        }
      }
      targetLoc = nearest;
      distance = shortestDist;
    } else {
      targetLoc = activeLocation || {
        name: qrConfig.officeName || 'Kantor',
        latitude: qrConfig.latitude,
        longitude: qrConfig.longitude,
        radiusMeters: qrConfig.radiusMeters,
        minGpsAccuracy: 100
      };
      distance = haversineDistance(latitude, longitude, targetLoc.latitude, targetLoc.longitude);
    }

    const maxAccuracy = (targetLoc as Location).minGpsAccuracy ?? 300;
    const isWithinRadius = distance <= targetLoc.radiusMeters;

    let status: GpsStatus;
    if (isWithinRadius) {
      status = 'in_range';
      if ('id' in targetLoc && (!activeLocation || activeLocation.id !== targetLoc.id)) {
        setActiveLocation(targetLoc as Location);
      }
    } else if (accuracy > maxAccuracy) {
      status = 'low_accuracy';
    } else {
      status = 'out_of_range';
    }

    setGpsState({
      status,
      latitude,
      longitude,
      accuracy,
      distanceMeters: Math.round(distance),
      nearestLocationName: targetLoc.name,
      targetRadiusMeters: targetLoc.radiusMeters,
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
    });
  }, [locations, activeLocation, qrConfig]);

  const handleGpsError = useCallback((error: GeolocationPositionError) => {
    setGpsState(prev => ({
      ...prev,
      status: error.code === error.PERMISSION_DENIED ? 'permission_denied' : 'unavailable',
      lastUpdated: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
    }));
  }, []);

  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) { setGpsState(prev => ({ ...prev, status: 'unavailable' })); return; }
    setGpsState(prev => ({ ...prev, status: 'loading' }));
    const id = navigator.geolocation.watchPosition(handleGpsSuccess, handleGpsError, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 5000
    });
    watchIdRef.current = id;
  }, [handleGpsSuccess, handleGpsError]);

  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const retryGps = useCallback(() => { stopGpsWatch(); startGpsWatch(); }, [stopGpsWatch, startGpsWatch]);

  // ---- CHECK IN / OUT ----
  const performCheckIn = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) return { success: false, message: 'Silakan login terlebih dahulu.' };
    const officeName = gpsState.nearestLocationName || qrConfig.officeName || 'kantor';
    const radius = gpsState.targetRadiusMeters || qrConfig.radiusMeters || 50;

    if (gpsState.status === 'out_of_range') return { success: false, message: `Di luar jangkauan: ${gpsState.distanceMeters}m dari ${officeName} (radius ${radius}m). Dekati lokasi magang.` };
    if (gpsState.status === 'permission_denied') return { success: false, message: 'Izin lokasi ditolak. Aktifkan di pengaturan browser.' };
    if (gpsState.status === 'loading' || gpsState.status === 'idle') return { success: false, message: 'Tunggu GPS mengambil koordinat Anda...' };
    if (gpsState.status === 'unavailable') return { success: false, message: 'GPS tidak tersedia di perangkat ini.' };
    if (gpsState.status === 'low_accuracy') return { success: false, message: `Akurasi GPS terlalu rendah (${gpsState.accuracy?.toFixed(0)}m). Anda berada di luar radius ${officeName}. Dekati area kantor.` };
    if (!isQrScannedToday) return { success: false, message: 'Pindai QR Code di lokasi magang terlebih dahulu.' };
    if (todayAttendance.isCheckedIn) return { success: false, message: 'Anda sudah melakukan absen masuk hari ini.' };

    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const isLate = jakartaTime.getHours() > 8 || (jakartaTime.getHours() === 8 && jakartaTime.getMinutes() > 0);
    const status: AttendanceStatus = isLate ? 'Terlambat' : 'Hadir';

    // Check for existing QR session
    const { data: qrSession } = await supabase
      .from('qr_sessions')
      .select('id')
      .eq('token', qrConfig.currentToken)
      .maybeSingle();

    const { error } = await supabase.from('attendance_records').insert({
      user_id: currentUser.id,
      date: todayStr,
      check_in_time: now.toISOString(),
      status,
      check_in_lat: gpsState.latitude,
      check_in_lon: gpsState.longitude,
      check_in_accuracy: gpsState.accuracy,
      check_in_distance_meters: gpsState.distanceMeters,
      qr_session_id: qrSession?.id || null,
      is_qr_valid: true,
      is_location_valid: true,
    });

    if (error) {
      if (error.code === '23505') return { success: false, message: 'Anda sudah melakukan absen masuk hari ini.' };
      console.error('Check-in error:', error);
      return { success: false, message: `Gagal menyimpan absensi: ${error.message}` };
    }

    await addAuditLog('Absen Masuk', 'Absensi', `Absen masuk di ${officeName} pukul ${getTimeJakarta()} | Jarak: ${gpsState.distanceMeters}m`);
    await refreshAttendances();
    return { success: true, message: `Absen Masuk Berhasil di ${officeName}! Status: ${status}. Waktu: ${getTimeJakarta()}.` };
  };

  const performCheckOut = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) return { success: false, message: 'Silakan login terlebih dahulu.' };
    const officeName = gpsState.nearestLocationName || qrConfig.officeName || 'kantor';
    if (gpsState.status !== 'in_range') return { success: false, message: `Pastikan berada di ${officeName} untuk absen pulang.` };
    if (!todayRecord) return { success: false, message: 'Belum ada data absen masuk hari ini.' };
    if (todayAttendance.isCheckedOut) return { success: false, message: 'Anda sudah melakukan absen pulang hari ini.' };

    const now = new Date();

    // Fetch actual check_in_time to accurately calculate total hours
    const { data: currentRecord } = await supabase
      .from('attendance_records')
      .select('check_in_time')
      .eq('user_id', currentUser.id)
      .eq('date', todayStr)
      .maybeSingle();

    const checkInIso = currentRecord?.check_in_time;
    let totalHoursStr = '0 jam 0 menit';
    if (checkInIso) {
      const inTime = new Date(checkInIso).getTime();
      const outTime = now.getTime();
      if (!isNaN(inTime) && outTime >= inTime) {
        const totalMinutes = Math.round((outTime - inTime) / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        totalHoursStr = `${hours} jam ${minutes} menit`;
      }
    }

    const { error } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: now.toISOString(),
        total_hours: totalHoursStr,
        check_out_lat: gpsState.latitude,
        check_out_lon: gpsState.longitude,
        check_out_accuracy: gpsState.accuracy,
      })
      .eq('user_id', currentUser.id)
      .eq('date', todayStr);

    if (error) {
      console.error('Check-out error:', error);
      return { success: false, message: 'Gagal menyimpan absen pulang. Coba lagi.' };
    }

    await addAuditLog('Absen Pulang', 'Absensi', `Absen pulang pukul ${getTimeJakarta()} | Total: ${totalHoursStr}`);
    await refreshAttendances();
    return { success: true, message: `Absen Pulang Berhasil! Total Kerja: ${totalHoursStr}.` };
  };

  const adminCorrectAttendance = async (id: string, checkIn: string, checkOut: string, status: AttendanceStatus, reason: string) => {
    let totalHoursStr: string | null = null;
    if (checkIn && checkOut) {
      const inTime = new Date(checkIn).getTime();
      const outTime = new Date(checkOut).getTime();
      if (!isNaN(inTime) && !isNaN(outTime) && outTime >= inTime) {
        const diffMinutes = Math.round((outTime - inTime) / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        totalHoursStr = `${hours} jam ${mins} menit`;
      }
    }

    await supabase.from('attendance_records').update({
      check_in_time: checkIn ? new Date(checkIn).toISOString() : null,
      check_out_time: checkOut ? new Date(checkOut).toISOString() : null,
      total_hours: totalHoursStr,
      status,
      corrected_by: currentUser?.id,
      correction_reason: reason,
      corrected_at: new Date().toISOString()
    }).eq('id', id);
    await addAuditLog('Koreksi Absensi', 'Koreksi', `Koreksi ID ${id}: Status=${status}, Alasan: ${reason}`);
    await refreshAttendances();
  };

  // ---- ACTIVITIES ----
  const refreshActivities = async () => {
    if (!currentUser?.id) return;
    setIsActivitiesLoading(true);
    try {
      let query = supabase.from('activities').select('*').order('activity_date', { ascending: false });
      if (currentUser.role !== 'admin') query = query.eq('user_id', currentUser.id);
      const { data } = await query;
      if (data) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, full_name, nim');
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        setActivities(data.map((a: Record<string, unknown>) => {
          const p = profileMap.get(a.user_id as string);
          return {
            id: a.id as string,
            userId: a.user_id as string,
            studentName: p?.full_name || (currentUser?.id === a.user_id ? (currentUser?.name || 'Peserta') : 'Peserta'),
            studentNim: p?.nim || (currentUser?.id === a.user_id ? (currentUser?.nim || '-') : '-'),
            activityDate: a.activity_date as string,
            day: a.activity_date as string,
            date: a.activity_date as string,
            title: a.title as string,
            description: a.description as string | undefined,
            startTime: a.start_time as string | undefined,
            endTime: a.end_time as string | undefined,
            time: a.start_time ? `${a.start_time} - ${a.end_time}` : undefined,
            category: a.category as string | undefined,
            attachmentUrl: a.attachment_url as string | undefined,
            createdAt: a.created_at as string,
          };
        }));
      }
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  const addActivity = async (data: Partial<ActivityRecord>) => {
    if (!currentUser?.id) return;
    await supabase.from('activities').insert({
      user_id: currentUser.id,
      activity_date: data.activityDate || getTodayJakarta(),
      title: data.title,
      description: data.description || null,
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      category: data.category || null,
      attachment_url: data.attachmentUrl || null,
    });
    await refreshActivities();
  };

  const updateActivity = async (id: string, data: Partial<ActivityRecord>) => {
    await supabase.from('activities').update({
      title: data.title,
      description: data.description,
      start_time: data.startTime,
      end_time: data.endTime,
      category: data.category,
      attachment_url: data.attachmentUrl,
    }).eq('id', id);
    await refreshActivities();
  };

  const deleteActivity = async (id: string) => {
    await supabase.from('activities').delete().eq('id', id);
    await addAuditLog('Hapus Aktivitas', 'Aktivitas', `Aktivitas ID ${id} dihapus`);
    await refreshActivities();
  };

  // ---- LEAVE REQUESTS ----
  const refreshLeaveRequests = async () => {
    if (!currentUser?.id) return;
    setIsLeaveLoading(true);
    try {
      let query = supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
      if (currentUser.role !== 'admin') query = query.eq('user_id', currentUser.id);
      const { data } = await query;
      if (data) {
        const { data: profiles } = await supabase.from('user_profiles').select('id, full_name, nim, university');
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        setLeaveRequests(data.map((r: Record<string, unknown>) => {
          const p = profileMap.get(r.user_id as string);
          return {
            id: r.id as string,
            userId: r.user_id as string,
            studentName: p?.full_name || (currentUser?.id === r.user_id ? (currentUser?.name || 'Peserta') : 'Peserta'),
            studentNim: p?.nim || (currentUser?.id === r.user_id ? (currentUser?.nim || '-') : '-'),
            university: p?.university || (currentUser?.id === r.user_id ? (currentUser?.university || '-') : '-'),
            requestDate: new Date(r.created_at as string).toLocaleDateString('id-ID'),
            startDate: r.start_date as string,
            endDate: r.end_date as string,
            leaveType: r.leave_type as any,
            reason: r.reason as string,
            documentName: r.document_name as string | undefined,
            documentUrl: r.document_url as string | undefined,
            status: r.status as LeaveStatus,
            adminNotes: r.admin_notes as string | undefined,
            reviewedAt: r.reviewed_at as string | undefined,
            reviewedBy: r.reviewed_by as string | undefined,
          };
        }));
      }
    } finally {
      setIsLeaveLoading(false);
    }
  };

  const submitLeaveRequest = async (startDate: string, endDate: string, leaveType: any, reason: string, docName?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) return { success: false, message: 'Silakan login terlebih dahulu.' };
    const { error } = await supabase.from('leave_requests').insert({
      user_id: currentUser.id,
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType,
      reason,
      document_name: docName || null,
      status: 'Menunggu'
    });
    if (error) return { success: false, message: 'Gagal mengajukan izin. Coba lagi.' };
    await addAuditLog('Pengajuan Izin', 'Pengajuan Izin', `${currentUser.name} mengajukan ${leaveType} (${startDate} s/d ${endDate})`);
    await refreshLeaveRequests();
    return { success: true, message: 'Pengajuan izin berhasil dikirim.' };
  };

  const reviewLeaveRequest = async (id: string, status: LeaveStatus, adminNotes: string) => {
    const target = leaveRequests.find(r => r.id === id);
    await supabase.from('leave_requests').update({
      status, admin_notes: adminNotes, reviewed_by: currentUser?.id, reviewed_at: new Date().toISOString()
    }).eq('id', id);

    if (status === 'Disetujui' && target) {
      const attStatus: AttendanceStatus = target.leaveType.includes('Sakit') ? 'Sakit' : 'Izin';
      const start = new Date(target.startDate + 'T00:00:00');
      const end = new Date(target.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString('sv-SE');
        await supabase.from('attendance_records').upsert({
          user_id: target.userId,
          date: dateStr,
          status: attStatus,
          notes: `${target.leaveType} disetujui: ${target.reason}`,
          is_qr_valid: false,
          is_location_valid: false
        }, { onConflict: 'user_id,date', ignoreDuplicates: true });
      }
    }
    await addAuditLog(`Izin ${status}`, 'Pengajuan Izin', `Pengajuan ID ${id} → ${status}`);
    await refreshLeaveRequests();
    await refreshAttendances();
  };

  // ---- CORRECTION REQUESTS ----
  const refreshCorrectionRequests = async () => {
    if (!currentUser?.id) return;
    let query = supabase.from('attendance_correction_requests').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'admin') query = query.eq('user_id', currentUser.id);
    const { data } = await query;
    if (data) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, full_name, nim');
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      setCorrectionRequests(data.map((r: Record<string, unknown>) => {
        const p = profileMap.get(r.user_id as string);
        return {
          id: r.id as string,
          userId: r.user_id as string,
          studentName: p?.full_name || (currentUser?.id === r.user_id ? (currentUser?.name || 'Peserta') : 'Peserta'),
          studentNim: p?.nim || (currentUser?.id === r.user_id ? (currentUser?.nim || '-') : '-'),
          attendanceDate: r.attendance_date as string,
          correctionType: r.correction_type as string,
          requestedCheckIn: r.requested_check_in as string | undefined,
          requestedCheckOut: r.requested_check_out as string | undefined,
          reason: r.reason as string,
          evidenceUrl: r.evidence_url as string | undefined,
          status: r.status as 'Menunggu' | 'Disetujui' | 'Ditolak',
          adminNotes: r.admin_notes as string | undefined,
          reviewedBy: r.reviewed_by as string | undefined,
          reviewedAt: r.reviewed_at as string | undefined,
          createdAt: r.created_at as string,
        };
      }));
    }
  };

  const submitCorrectionRequest = async (data: Partial<AttendanceCorrectionRequest>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) return { success: false, message: 'Silakan login terlebih dahulu.' };
    const { error } = await supabase.from('attendance_correction_requests').insert({
      user_id: currentUser.id,
      attendance_date: data.attendanceDate,
      correction_type: data.correctionType,
      requested_check_in: data.requestedCheckIn || null,
      requested_check_out: data.requestedCheckOut || null,
      reason: data.reason,
      evidence_url: data.evidenceUrl || null,
      status: 'Menunggu'
    });
    if (error) return { success: false, message: 'Gagal mengajukan koreksi. Coba lagi.' };
    await refreshCorrectionRequests();
    return { success: true, message: 'Permintaan koreksi berhasil dikirim.' };
  };

  const reviewCorrectionRequest = async (id: string, status: 'Disetujui' | 'Ditolak', adminNotes: string) => {
    await supabase.from('attendance_correction_requests').update({
      status, admin_notes: adminNotes, reviewed_by: currentUser?.id, reviewed_at: new Date().toISOString()
    }).eq('id', id);
    await addAuditLog('Koreksi Absensi', 'Koreksi', `Koreksi ID ${id} → ${status}`);
    await refreshCorrectionRequests();
  };

  // ---- STUDENTS (ADMIN) ----
  const refreshStudents = async () => {
    setIsStudentsLoading(true);
    try {
      const { data } = await supabase.from('user_profiles').select('*').eq('role', 'user');
      if (data) {
        setStudents(data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          email: '',
          name: (p.full_name as string) || '',
          role: 'user' as const,
          username: ((p.full_name as string) || '').toLowerCase().replace(' ', '.'),
          avatar: (p.photo_url as string) || `https://ui-avatars.com/api/?name=${encodeURIComponent((p.full_name as string) || 'User')}&background=2F80ED&color=fff`,
          phone: p.phone as string | undefined,
          nim: p.nim as string | undefined,
          birthPlace: p.birth_place as string | undefined,
          birthDate: p.birth_date as string | undefined,
          gender: p.gender as 'Laki-laki' | 'Perempuan' | undefined,
          university: p.university as string | undefined,
          faculty: p.faculty as string | undefined,
          major: p.major as string | undefined,
          concentration: p.concentration as string | undefined,
          position: p.position as string | undefined,
          startDate: p.start_date as string | undefined,
          endDate: p.end_date as string | undefined,
          status: (p.status as 'Aktif' | 'Nonaktif' | 'Selesai') || 'Aktif',
        })));
      }
    } finally {
      setIsStudentsLoading(false);
    }
  };

  // addStudent: Admin can update existing profiles but cannot create Supabase Auth users directly.
  // New users must register themselves. This function updates profile data for an existing user ID.
  const addStudent = async (_student: Omit<User, 'id'>) => {
    // Note: Creating Supabase Auth users requires the Admin API (service_role key).
    // Direct user creation is done via the Register page.
    // This stub is kept for UI compatibility.
    console.warn('addStudent: New users must register via the Register page. Admin cannot create auth users from frontend.');
    await refreshStudents();
  };

  const updateStudent = async (id: string, data: Partial<User>) => {
    await supabase.from('user_profiles').update({
      full_name: data.name,
      phone: data.phone,
      nim: data.nim,
      university: data.university,
      major: data.major,
      status: data.status,
    }).eq('id', id);
    await refreshStudents();
  };

  const toggleStudentStatus = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const nextStatus = student.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    await supabase.from('user_profiles').update({ status: nextStatus }).eq('id', id);
    await refreshStudents();
  };

  // ---- AUDIT LOGS ----
  const refreshAuditLogs = async () => {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) {
      setAuditLogs(data.map((l: Record<string, unknown>) => ({
        id: l.id as string,
        timestamp: new Date(l.created_at as string).toLocaleString('id-ID'),
        action: l.action as string,
        category: (l.category as AuditLog['category']) || 'Absensi',
        performedBy: l.performed_by as string || 'System',
        details: l.details as string || '',
      })));
    }
  };

  const addAuditLog = async (action: string, category: AuditLog['category'], details: string) => {
    await supabase.from('audit_logs').insert({
      performed_by: currentUser?.id || null,
      action, category, details
    });
  };

  // ---- NOTIFICATIONS ----
  // Generate notifikasi dari data nyata (absensi, izin, koreksi)
  const refreshNotifications = async () => {
    if (!currentUser?.id) return;
    const isAdmin = currentUser.role === 'admin';
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const notifs: NotificationItem[] = [];

    if (isAdmin) {
      // 1. Pengajuan izin yang pending
      const { data: pendingLeave } = await supabase
        .from('leave_requests')
        .select('id, created_at')
        .eq('status', 'Menunggu')
        .order('created_at', { ascending: false });
      if (pendingLeave && pendingLeave.length > 0) {
        notifs.push({
          id: 'notif-izin-pending',
          title: `${pendingLeave.length} Pengajuan Izin Menunggu`,
          message: `Ada ${pendingLeave.length} pengajuan izin mahasiswa yang belum diproses.`,
          time: 'Hari ini',
          read: false,
          type: 'warning',
          linkTab: 'izin',
        });
      }

      // 2. Koreksi absensi yang pending
      const { data: pendingCorr } = await supabase
        .from('attendance_corrections')
        .select('id, created_at')
        .eq('status', 'Menunggu')
        .order('created_at', { ascending: false });
      if (pendingCorr && pendingCorr.length > 0) {
        notifs.push({
          id: 'notif-koreksi-pending',
          title: `${pendingCorr.length} Koreksi Absensi Diajukan`,
          message: `Ada ${pendingCorr.length} permintaan koreksi absensi yang perlu ditinjau.`,
          time: 'Hari ini',
          read: false,
          type: 'warning',
          linkTab: 'koreksi',
        });
      }

      // 3. Mahasiswa yang absen masuk hari ini tapi belum pulang
      const { data: checkInOnly } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('date', todayStr)
        .not('check_in_time', 'is', null)
        .is('check_out_time', null);
      if (checkInOnly && checkInOnly.length > 0) {
        notifs.push({
          id: 'notif-belum-pulang',
          title: `${checkInOnly.length} Peserta Belum Absen Pulang`,
          message: `${checkInOnly.length} peserta sudah absen masuk hari ini namun belum melakukan absen pulang.`,
          time: 'Hari ini',
          read: false,
          type: 'reminder',
          linkTab: 'absensi',
        });
      }

      // 4. Peserta baru yang terdaftar hari ini
      const { data: newStudents } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'user')
        .gte('created_at', todayStr + 'T00:00:00+07:00');
      if (newStudents && newStudents.length > 0) {
        notifs.push({
          id: 'notif-peserta-baru',
          title: `${newStudents.length} Peserta Baru Terdaftar`,
          message: `${newStudents.length} peserta magang baru mendaftar hari ini.`,
          time: 'Hari ini',
          read: false,
          type: 'info',
          linkTab: 'datapeserta',
        });
      }

    } else {
      // USER notifications
      // 1. Status izin yang baru diupdate
      const { data: updatedLeave } = await supabase
        .from('leave_requests')
        .select('id, status, leave_type, updated_at')
        .eq('user_id', currentUser.id)
        .in('status', ['Disetujui', 'Ditolak'])
        .order('updated_at', { ascending: false })
        .limit(3);
      if (updatedLeave) {
        updatedLeave.forEach((l: any) => {
          notifs.push({
            id: `notif-izin-${l.id}`,
            title: l.status === 'Disetujui' ? '✅ Izin Disetujui' : '❌ Izin Ditolak',
            message: `Pengajuan ${l.leave_type} Anda telah ${l.status.toLowerCase()} oleh admin.`,
            time: new Date(l.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            read: false,
            type: l.status === 'Disetujui' ? 'success' : 'warning',
            linkTab: 'izin',
          });
        });
      }

      // 2. Absensi hari ini
      const { data: todayAbs } = await supabase
        .from('attendance_records')
        .select('id, check_in_time, check_out_time, status')
        .eq('user_id', currentUser.id)
        .eq('date', todayStr)
        .maybeSingle();
      if (todayAbs?.check_in_time && !todayAbs?.check_out_time) {
        notifs.push({
          id: 'notif-belum-pulang-user',
          title: '⏰ Jangan Lupa Absen Pulang',
          message: `Anda sudah absen masuk pukul ${todayAbs.check_in_time}. Jangan lupa absen pulang sebelum meninggalkan kantor.`,
          time: 'Hari ini',
          read: false,
          type: 'reminder',
          linkTab: 'dashboard',
        });
      }
      if (todayAbs?.check_in_time && todayAbs?.check_out_time) {
        notifs.push({
          id: 'notif-absen-selesai',
          title: '✅ Absensi Hari Ini Selesai',
          message: `Absensi hari ini sudah tercatat lengkap. Status: ${todayAbs.status}.`,
          time: 'Hari ini',
          read: true,
          type: 'success',
          linkTab: 'dashboard',
        });
      }
    }

    setNotifications(notifs);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DataContext.Provider
      value={{
        attendances, todayAttendance, attendanceStats, isAttendanceLoading,
        performCheckIn, performCheckOut, adminCorrectAttendance, refreshAttendances,
        qrConfig, activeLocation, locations, locationQrMap, updateQrConfig, regenerateQrToken, generateQrForLocationId, isQrScannedToday, scanQrToken, resetQrScan, refreshLocations, addLocation, updateLocation, toggleLocationStatus, deleteLocation,
        gpsState, startGpsWatch, stopGpsWatch, retryGps,
        activities, isActivitiesLoading, addActivity, updateActivity, deleteActivity, refreshActivities,
        leaveRequests, isLeaveLoading, submitLeaveRequest, reviewLeaveRequest, refreshLeaveRequests,
        correctionRequests, submitCorrectionRequest, reviewCorrectionRequest, refreshCorrectionRequests,
        students, isStudentsLoading, refreshStudents, addStudent, updateStudent, toggleStudentStatus,
        auditLogs, notifications, markNotificationAsRead, markAllNotificationsAsRead, refreshNotifications
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
