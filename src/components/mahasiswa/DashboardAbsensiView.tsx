import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Camera,
  Info,
  LogIn,
  LogOut,
  FileEdit,
  CheckCircle2,
  XCircle,
  Search,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Navigation,
  Headphones,
  Briefcase,
  Circle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessSound } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Badge } from '../common/Badge';
import { CameraScannerModal } from '../common/CameraScannerModal';

interface DashboardAbsensiViewProps {
  onNavigateToIzin?: () => void;
}

export const DashboardAbsensiView: React.FC<DashboardAbsensiViewProps> = ({ onNavigateToIzin }) => {
  const { currentUser } = useAuth();
  const {
    attendances,
    todayAttendance,
    attendanceStats,
    performCheckIn,
    performCheckOut,
    gpsState,
    startGpsWatch,
    stopGpsWatch,
    retryGps,
    isQrScannedToday,
    qrConfig,
    systemSettings
  } = useData();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeLoadingProcess, setActiveLoadingProcess] = useState<'check_in' | 'check_out' | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check apakah mahasiswa terdaftar dengan konsentrasi CS
  const isCsStudent = Boolean(
    currentUser?.concentration &&
    (currentUser.concentration.toLowerCase().includes('cs') ||
     currentUser.concentration.toLowerCase().includes('customer service'))
  );

  // Shift option: 'reguler' | 'cs_shift_1' | 'cs_shift_2'
  type ShiftOption = 'reguler' | 'cs_shift_1' | 'cs_shift_2';
  const [selectedShift, setSelectedShift] = useState<ShiftOption>('reguler');

  // Auto-sync selected shift: jika sudah absen ikuti catatan, jika belum dan CS auto-detect jam, jika bukan CS selalu reguler
  useEffect(() => {
    if (todayAttendance.isCheckedIn && todayAttendance.notes) {
      if (todayAttendance.notes.includes('CS')) {
        if (todayAttendance.notes.includes('Shift 2')) {
          setSelectedShift('cs_shift_2');
        } else {
          setSelectedShift('cs_shift_1');
        }
      } else {
        setSelectedShift('reguler');
      }
    } else if (isCsStudent) {
      try {
        const jktHourStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false });
        const currentH = parseInt(jktHourStr, 10);
        if (currentH >= 13) {
          setSelectedShift('cs_shift_2');
        } else {
          setSelectedShift('cs_shift_1');
        }
      } catch {
        setSelectedShift('cs_shift_1');
      }
    } else {
      setSelectedShift('reguler');
    }
  }, [todayAttendance.isCheckedIn, todayAttendance.notes, isCsStudent]);

  // Start GPS watch when dashboard mounts, stop when unmounts
  useEffect(() => {
    startGpsWatch();
    return () => {
      stopGpsWatch();
    };
  }, [startGpsWatch, stopGpsWatch]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (feedbackToast) {
      const t = setTimeout(() => setFeedbackToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedbackToast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message });
  };

  // Check-In (Buka Scanner QR)
  const handleCheckInClick = () => {
    if (todayAttendance.isCheckedIn) return;
    setIsScannerOpen(true);
  };

  // Check-Out (Cukup klik & validasi GPS tanpa scan QR)
  const handleCheckOutClick = async () => {
    if (!todayAttendance.isCheckedIn) {
      showToast('error', 'Anda belum melakukan absen masuk hari ini.');
      return;
    }
    if (todayAttendance.isCheckedOut) {
      showToast('error', 'Anda sudah melakukan absen pulang hari ini.');
      return;
    }
    if (gpsState.status !== 'in_range') {
      showToast('error', `Anda harus berada di lokasi kantor untuk absen pulang. Posisi saat ini di luar radius kantor (${gpsState.distanceMeters ?? '?'}m).`);
      return;
    }
    setActiveLoadingProcess('check_out');
    try {
      const res = await performCheckOut();
      if (res.success) {
        playSuccessSound();
        showToast('success', res.message);
        try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); } catch { /* ignore */ }
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan saat memproses absen pulang.');
    } finally {
      setActiveLoadingProcess(null);
    }
  };

  // Derived values
  const isInRange = gpsState.status === 'in_range';
  const canCheckIn = !todayAttendance.isCheckedIn;
  const canCheckOut = todayAttendance.isCheckedIn && !todayAttendance.isCheckedOut && isInRange;

  // Filter attendance records for current user
  const userId = currentUser?.id || '';
  const userRecords = attendances.filter(a => a.userId === userId);
  const filteredRecords = userRecords.filter(r => {
    const matchQuery =
      r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchStatus = filterStatus === 'Semua' ||
      r.status.toLowerCase().includes(filterStatus.toLowerCase());
    return matchQuery && matchStatus;
  });

  // Urutkan riwayat absensi terbaru paling atas
  filteredRecords.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const timeA = a.rawCheckInTime || a.checkInTime || '';
    const timeB = b.rawCheckInTime || b.checkInTime || '';
    return timeB.localeCompare(timeA);
  });

  // Today date string
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const timeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta'
  });

  const currentOfficeName = gpsState.nearestLocationName || qrConfig.officeName || 'Lokasi Magang';
  const currentRadius = gpsState.targetRadiusMeters || qrConfig.radiusMeters || 50;

  // GPS Status display config
  const gpsStatusConfig = {
    idle: { label: 'Menginisialisasi GPS...', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: <Navigation className="h-4 w-4 text-slate-400 animate-pulse" /> },
    loading: { label: 'Mengambil koordinat lokasi...', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" /> },
    in_range: { label: `Dalam jangkauan — ${gpsState.distanceMeters}m dari ${currentOfficeName} (radius ${currentRadius}m)`, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <ShieldCheck className="h-4 w-4 text-emerald-500" /> },
    out_of_range: { label: `Di luar jangkauan — ${gpsState.distanceMeters}m dari ${currentOfficeName} (radius ${currentRadius}m)`, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: <XCircle className="h-4 w-4 text-rose-500" /> },
    low_accuracy: { label: `Akurasi GPS rendah (${gpsState.accuracy?.toFixed(0)}m). Pindah ke area terbuka dekat ${currentOfficeName}.`, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
    permission_denied: { label: 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: <WifiOff className="h-4 w-4 text-rose-500" /> },
    unavailable: { label: 'Lokasi GPS tidak tersedia. Periksa pengaturan perangkat Anda.', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: <WifiOff className="h-4 w-4 text-slate-400" /> },
  };
  const gpsDisplay = gpsStatusConfig[gpsState.status];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-[#183B66]">
            Selamat datang, {currentUser?.name?.split(' ')[0] || 'Peserta'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">{todayStr}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg sm:text-2xl font-bold text-[#2F80ED] tabular-nums leading-tight">{timeStr}</p>
          <p className="text-[10px] sm:text-xs text-slate-400">WIB (Jakarta)</p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl p-4 text-xs font-semibold shadow-lg border animate-in slide-in-from-top duration-200 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-[#27AE60] shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-[#EB5757] shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Stat Cards - 1 Baris Kompak di Layar HP */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-4 shadow-xs sm:shadow-sm text-center sm:text-left">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF3FE] text-[#2F80ED] mb-1 sm:mb-0">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Hadir</p>
            <p className="text-base sm:text-xl font-bold text-[#2F80ED] leading-none mt-0.5">{attendanceStats.hadir}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-4 shadow-xs sm:shadow-sm text-center sm:text-left">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF0EE] text-[#EB5757] mb-1 sm:mb-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Telat</p>
            <p className="text-base sm:text-xl font-bold text-[#EB5757] leading-none mt-0.5">{attendanceStats.terlambat}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-4 shadow-xs sm:shadow-sm text-center sm:text-left">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF8E8] text-[#F2994A] mb-1 sm:mb-0">
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Izin</p>
            <p className="text-base sm:text-xl font-bold text-[#F2994A] leading-none mt-0.5">{attendanceStats.izin}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-4 shadow-xs sm:shadow-sm text-center sm:text-left">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-1 sm:mb-0">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">Alpha</p>
            <p className="text-base sm:text-xl font-bold text-slate-600 leading-none mt-0.5">{attendanceStats.alpha}</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KARTU PRESENSI MINIMALIS (REGULER, CS SHIFT 1, CS SHIFT 2) */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm transition-all">
        {/* Header & Segmented Shift Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h3 className="text-base font-bold text-[#183B66]">Presensi Kehadiran</h3>
            {isCsStudent && todayAttendance.isCheckedIn && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                🔒 Shift Terkunci
              </span>
            )}
          </div>

          {/* Segmented Control / Pill Switcher (HANYA MUNCUL JIKA KONSENTRASI CS) */}
          {isCsStudent && (
            <div className="grid grid-cols-2 w-full sm:w-auto p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800">
              {/* Opsi 1: CS Shift 1 */}
              <button
                type="button"
                disabled={todayAttendance.isCheckedIn}
                onClick={() => setSelectedShift('cs_shift_1')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedShift === 'cs_shift_1'
                    ? 'bg-[#2F80ED] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-800/60'
                } ${todayAttendance.isCheckedIn ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
              >
                <Headphones className="h-3.5 w-3.5 shrink-0" />
                <span>CS Shift 1</span>
              </button>

              {/* Opsi 2: CS Shift 2 */}
              <button
                type="button"
                disabled={todayAttendance.isCheckedIn}
                onClick={() => setSelectedShift('cs_shift_2')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedShift === 'cs_shift_2'
                    ? 'bg-[#2F80ED] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-800/60'
                } ${todayAttendance.isCheckedIn ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
              >
                <Headphones className="h-3.5 w-3.5 shrink-0" />
                <span>CS Shift 2</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-label Jadwal Aktif */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-4 px-3 py-2 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-100/80 dark:border-blue-500/20">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#2F80ED] dark:text-blue-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              Jadwal Kerja: <strong className="text-[#2F80ED] dark:text-blue-400 font-bold">
                {!isCsStudent
                  ? `Magang Reguler (${systemSettings?.workStartTime || '08:00'} – ${systemSettings?.workEndTime || '17:00'} WIB)`
                  : selectedShift === 'cs_shift_1'
                  ? `CS – Shift 1 (${systemSettings?.csShift1StartTime || '08:00'} – ${systemSettings?.csShift1EndTime || '15:00'} WIB)`
                  : `CS – Shift 2 (${systemSettings?.csShift2StartTime || '15:00'} – ${systemSettings?.csShift2EndTime || '21:00'} WIB)`}
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#2F80ED] dark:text-blue-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-500/30">
            {isCsStudent && selectedShift === 'cs_shift_2'
              ? `Batas Masuk: ${systemSettings?.csShift2StartTime || '15:00'} WIB`
              : isCsStudent
              ? `Batas Masuk: ${systemSettings?.csShift1StartTime || '08:00'} WIB`
              : `Batas Masuk: ${systemSettings?.workStartTime || '08:00'} WIB`}
          </span>
        </div>

        {/* Ringkasan Hari Ini (Absen Masuk, Absen Pulang, Total Jam) */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50/70 p-3 sm:p-3.5 text-center mb-4">
          <div className="px-1 sm:px-2">
            <span className="text-[11px] text-slate-500">Absen Masuk</span>
            <p className="text-base sm:text-lg font-bold text-[#2F80ED] mt-0.5">
              {todayAttendance.checkIn || '—'}
            </p>
          </div>
          <div className="px-1 sm:px-2">
            <span className="text-[11px] text-slate-500">Absen Pulang</span>
            <p className="text-base sm:text-lg font-bold text-[#2F80ED] mt-0.5">
              {todayAttendance.checkOut || '—'}
            </p>
          </div>
          <div className="px-1 sm:px-2">
            <span className="text-[11px] text-slate-500">Total Jam</span>
            <p className="text-base sm:text-lg font-bold text-[#2F80ED] mt-0.5">
              {todayAttendance.totalHours || '—'}
            </p>
          </div>
        </div>

        {/* Status Hari Ini Banner (Hanya muncul jika sudah ada status) */}
        {todayAttendance.status && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold ${
            todayAttendance.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            todayAttendance.status === 'Terlambat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Status Hari Ini: <strong>{todayAttendance.status}</strong> {todayAttendance.notes ? `(${todayAttendance.notes})` : ''}
            </span>
          </div>
        )}

        {/* GPS Status Live (Kompak & Elegan) */}
        <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 ${gpsDisplay.bg} ${gpsDisplay.border}`}>
          <div className="flex items-center gap-2">
            {gpsDisplay.icon}
            <div>
              <p className={`text-xs font-semibold ${gpsDisplay.color}`}>{gpsDisplay.label}</p>
              {gpsState.lastUpdated && (
                <p className="text-[10px] text-slate-400 mt-0.5">Diperbarui: {gpsState.lastUpdated}</p>
              )}
            </div>
          </div>
          {(gpsState.status === 'permission_denied' || gpsState.status === 'unavailable' || gpsState.status === 'low_accuracy') && (
            <button
              onClick={retryGps}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-3 w-3" /> Coba Lagi
            </button>
          )}
        </div>

        {/* Action Buttons (3 Kolom Responsif) */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Absen Masuk */}
          <button
            type="button"
            onClick={handleCheckInClick}
            disabled={todayAttendance.isCheckedIn || !!activeLoadingProcess}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-md transition-all ${
              todayAttendance.isCheckedIn
                ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                : activeLoadingProcess === 'check_in'
                ? 'bg-blue-400 text-white shadow-none cursor-wait'
                : 'bg-[#2F80ED] text-white shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98]'
            }`}
          >
            {activeLoadingProcess === 'check_in' ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : todayAttendance.isCheckedIn ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sudah Masuk ✓</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Absen Masuk (Scan QR)</span>
              </>
            )}
          </button>

          {/* Absen Pulang */}
          <button
            type="button"
            onClick={handleCheckOutClick}
            disabled={!todayAttendance.isCheckedIn || todayAttendance.isCheckedOut || !!activeLoadingProcess}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
              todayAttendance.isCheckedOut
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : !todayAttendance.isCheckedIn
                ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                : activeLoadingProcess === 'check_out'
                ? 'border-rose-300 bg-rose-50 text-rose-400 cursor-wait'
                : 'border-[#EB5757] bg-white text-[#EB5757] hover:bg-rose-50 shadow-sm active:scale-[0.98]'
            }`}
          >
            {activeLoadingProcess === 'check_out' ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                {todayAttendance.isCheckedOut ? 'Sudah Pulang ✓' : 'Absen Pulang'}
              </>
            )}
          </button>

          {/* Input Izin */}
          <button
            type="button"
            onClick={onNavigateToIzin}
            disabled={!!activeLoadingProcess}
            className={`flex items-center justify-center gap-2 rounded-xl border border-[#2F80ED] bg-white py-3 text-sm font-semibold text-[#2F80ED] transition-all ${
              activeLoadingProcess ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 active:scale-[0.98]'
            }`}
          >
            <FileEdit className="h-4 w-4" />
            Ajukan Izin
          </button>
        </div>

        {/* Hint pesan mini 1 baris */}
        {!isQrScannedToday && !todayAttendance.isCheckedIn && (
          <p className="mt-2 text-center text-[11px] text-amber-600">
            ⚠️ Pindai QR Code di kantor untuk absen masuk.
          </p>
        )}
      </div>

      {/* Riwayat Absensi */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#183B66]">Riwayat Absensi</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tanggal..."
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            >
              <option value="Semua">Semua</option>
              <option value="Hadir">Hadir</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Izin">Izin/Sakit</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3 px-4">Hari</th>
                <th className="pb-3 px-4">Tipe / Shift</th>
                <th className="pb-3 px-4">Absen Masuk</th>
                <th className="pb-3 px-4">Absen Pulang</th>
                <th className="pb-3 px-4">Total Jam</th>
                <th className="pb-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-slate-400 text-sm">Belum ada data riwayat absensi</p>
                    <p className="text-slate-300 text-xs mt-1">Riwayat akan muncul setelah Anda melakukan absensi</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 text-slate-900 font-semibold">{item.date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.dayName}</td>
                    <td className="py-3.5 px-4">
                      {item.notes?.includes('CS') ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Headphones className="h-3 w-3" />
                          {item.notes}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Briefcase className="h-3 w-3" />
                          {item.notes || 'Reguler'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">{item.checkInTime || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-800">{item.checkOutTime || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-800">{item.totalHours || '—'}</td>
                    <td className="py-3.5 pl-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        item.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' :
                        item.status === 'Izin' || item.status === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                      {item.correctedByAdmin && (
                        <span className="block text-[9px] text-[#2F80ED] font-semibold mt-0.5">Dikoreksi Admin</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3 mt-4">
          {filteredRecords.length === 0 ? (
            <div className="py-10 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-slate-400 text-sm">Belum ada data riwayat absensi</p>
              <p className="text-slate-300 text-xs mt-1">Riwayat akan muncul setelah Anda melakukan absensi</p>
            </div>
          ) : (
            filteredRecords.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.date}</span>
                    <span className="text-[11px] text-slate-500 font-medium">({item.dayName})</span>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      item.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' :
                      item.status === 'Izin' || item.status === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                    {item.correctedByAdmin && (
                      <span className="block text-[9px] text-[#2F80ED] font-semibold mt-0.5 text-right">Dikoreksi Admin</span>
                    )}
                  </div>
                </div>

                {/* Mobile Shift Tag */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Shift:</span>
                  {item.notes?.includes('CS') ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <Headphones className="h-3 w-3" />
                      {item.notes}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <Briefcase className="h-3 w-3" />
                      {item.notes || 'Reguler'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-lg p-2.5 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Masuk</span>
                    <span className="font-semibold text-xs text-slate-800">{item.checkInTime || '—'}</span>
                  </div>
                  <div className="border-x border-slate-200/60">
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Pulang</span>
                    <span className="font-semibold text-xs text-slate-800">{item.checkOutTime || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Total</span>
                    <span className="font-semibold text-xs text-slate-800">{item.totalHours || '—'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccessScan={async (_photo, scannedToken) => {
          setIsScannerOpen(false);
          // Langsung otomatis catat Absen Masuk saat scan QR berhasil (1x scan langsung masuk)
          if (!todayAttendance.isCheckedIn) {
            setActiveLoadingProcess('check_in');
            try {
              const mode = isCsStudent ? 'cs' : 'reguler';
              const csShift = selectedShift === 'cs_shift_2' ? 'shift_2' : 'shift_1';
              const res = await performCheckIn(
                scannedToken,
                mode,
                csShift
              );
              if (res.success) {
                playSuccessSound();
                showToast('success', res.message);
                try { confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } }); } catch { /* ignore */ }
              } else {
                showToast('error', res.message);
              }
            } catch (err: any) {
              showToast('error', err?.message || 'Terjadi kesalahan saat menyimpan absensi.');
            } finally {
              setActiveLoadingProcess(null);
            }
          } else {
            showToast('success', 'Anda sudah melakukan absen masuk hari ini.');
          }
        }}
      />

      {/* Full-screen Blurred Loading Overlay (Frameless & Minimalis) */}
      {activeLoadingProcess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none p-6">
          {/* Muter2 Sedikit Besar di Tengah */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
            <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full border-4 sm:border-[5px] border-white/20 border-t-[#2F80ED] animate-spin" />
            <div className="absolute flex items-center justify-center">
              {activeLoadingProcess === 'check_in' ? (
                <LogIn className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow" />
              ) : (
                <LogOut className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow" />
              )}
            </div>
          </div>

          {/* Teks Minimalis Tanpa Box/Kolom */}
          {activeLoadingProcess === 'check_in' ? (
            <h3 className="text-lg sm:text-2xl font-bold text-white tracking-wide text-center drop-shadow-sm">
              Memproses Absen Masuk...
            </h3>
          ) : (
            <div className="text-center max-w-xs sm:max-w-md">
              <h3 className="text-lg sm:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                Memproses Absen Pulang...
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                Menghitung total jam kerja dan menyimpan presensi Anda...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
