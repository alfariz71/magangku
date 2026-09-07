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
    qrConfig
  } = useData();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Shift option: 'reguler' | 'cs_shift_1' | 'cs_shift_2'
  type ShiftOption = 'reguler' | 'cs_shift_1' | 'cs_shift_2';
  const [selectedShift, setSelectedShift] = useState<ShiftOption>('reguler');

  // Auto-sync selected shift if today's attendance is already recorded
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
    }
  }, [todayAttendance.isCheckedIn, todayAttendance.notes]);

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
    const res = await performCheckOut();
    if (res.success) {
      showToast('success', res.message);
      try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); } catch { /* ignore */ }
    } else {
      showToast('error', res.message);
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">
            Selamat datang, {currentUser?.name?.split(' ')[0] || 'Peserta'} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500">{todayStr}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#2F80ED] tabular-nums">{timeStr} WIB</p>
          <p className="text-xs text-slate-400 mt-0.5">Waktu Jakarta</p>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF3FE] text-[#2F80ED]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Hadir</p>
            <p className="text-xl font-bold text-[#2F80ED] leading-none mt-0.5">{attendanceStats.hadir}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF0EE] text-[#EB5757]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Terlambat</p>
            <p className="text-xl font-bold text-[#EB5757] leading-none mt-0.5">{attendanceStats.terlambat}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF8E8] text-[#F2994A]">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Izin/Sakit</p>
            <p className="text-xl font-bold text-[#F2994A] leading-none mt-0.5">{attendanceStats.izin}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Alpha</p>
            <p className="text-xl font-bold text-slate-600 leading-none mt-0.5">{attendanceStats.alpha}</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KARTU PRESENSI UTAMA (PILIHAN: REGULER, CS SHIFT 1, CS SHIFT 2) */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm transition-all">
        {/* Header Kartu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2F80ED] text-white shadow-md shadow-blue-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#183B66]">Absensi Kehadiran Magang</h3>
                {selectedShift === 'reguler' && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    Reguler (08:00 – 17:00)
                  </span>
                )}
                {selectedShift === 'cs_shift_1' && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    CS Shift 1 (08:00 – 15:00)
                  </span>
                )}
                {selectedShift === 'cs_shift_2' && (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
                    CS Shift 2 (15:00 – 21:00)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih jenis shift kerja Anda sebelum melakukan absensi masuk
              </p>
            </div>
          </div>
        </div>

        {/* Pilihan Shift (3 Opsi: Reguler, CS Shift 1, CS Shift 2) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Pilih Jadwal / Shift Hari Ini:</span>
            </label>
            {todayAttendance.isCheckedIn && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                🔒 Shift terkunci untuk hari ini
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opsi 1: Reguler */}
            <button
              type="button"
              disabled={todayAttendance.isCheckedIn}
              onClick={() => setSelectedShift('reguler')}
              className={`group relative flex flex-col justify-between rounded-xl p-4 text-left transition-all duration-200 ${
                selectedShift === 'reguler'
                  ? 'border-2 border-[#2F80ED] bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                  : 'border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              } ${todayAttendance.isCheckedIn ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  selectedShift === 'reguler' ? 'bg-[#2F80ED] text-white shadow-xs' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                  selectedShift === 'reguler'
                    ? 'border-[#2F80ED] bg-[#2F80ED] text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedShift === 'reguler' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
              <div>
                <p className={`text-xs font-bold ${selectedShift === 'reguler' ? 'text-blue-950' : 'text-slate-800'}`}>
                  Magang Reguler
                </p>
                <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                  08:00 – 17:00 WIB
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Non-Shift (Kantor Standar)
                </p>
              </div>
            </button>

            {/* Opsi 2: CS Shift 1 */}
            <button
              type="button"
              disabled={todayAttendance.isCheckedIn}
              onClick={() => setSelectedShift('cs_shift_1')}
              className={`group relative flex flex-col justify-between rounded-xl p-4 text-left transition-all duration-200 ${
                selectedShift === 'cs_shift_1'
                  ? 'border-2 border-indigo-600 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              } ${todayAttendance.isCheckedIn ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  selectedShift === 'cs_shift_1' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  <Headphones className="h-4 w-4" />
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                  selectedShift === 'cs_shift_1'
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedShift === 'cs_shift_1' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
              <div>
                <p className={`text-xs font-bold ${selectedShift === 'cs_shift_1' ? 'text-indigo-950' : 'text-slate-800'}`}>
                  CS – Shift 1 (Pagi)
                </p>
                <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                  08:00 – 15:00 WIB
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Customer Service Pagi
                </p>
              </div>
            </button>

            {/* Opsi 3: CS Shift 2 */}
            <button
              type="button"
              disabled={todayAttendance.isCheckedIn}
              onClick={() => setSelectedShift('cs_shift_2')}
              className={`group relative flex flex-col justify-between rounded-xl p-4 text-left transition-all duration-200 ${
                selectedShift === 'cs_shift_2'
                  ? 'border-2 border-purple-600 bg-purple-50/60 shadow-sm ring-2 ring-purple-500/20'
                  : 'border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              } ${todayAttendance.isCheckedIn ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  selectedShift === 'cs_shift_2' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  <Headphones className="h-4 w-4" />
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                  selectedShift === 'cs_shift_2'
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedShift === 'cs_shift_2' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
              <div>
                <p className={`text-xs font-bold ${selectedShift === 'cs_shift_2' ? 'text-purple-950' : 'text-slate-800'}`}>
                  CS – Shift 2 (Sore)
                </p>
                <p className="text-[11px] font-semibold text-purple-600 mt-0.5">
                  15:00 – 21:00 WIB
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Customer Service Sore/Malam
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Info Petunjuk Shift Terpilih */}
        <div className={`mb-6 rounded-xl p-3.5 text-xs flex items-center gap-2.5 border ${
          selectedShift === 'reguler'
            ? 'bg-blue-50/70 border-blue-200 text-blue-900'
            : selectedShift === 'cs_shift_1'
            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
            : 'bg-purple-50/70 border-purple-200 text-purple-900'
        }`}>
          <Info className="h-4 w-4 shrink-0" />
          <span>
            {selectedShift === 'reguler' && (
              <>Jadwal <strong>Reguler</strong>: Jam masuk patokan <strong>08:00 WIB</strong> (toleransi keterlambatan aktif), absen pulang mulai <strong>17:00 WIB</strong>.</>
            )}
            {selectedShift === 'cs_shift_1' && (
              <>Jadwal <strong>CS Shift 1</strong>: Jam masuk patokan <strong>08:00 WIB</strong> (toleransi keterlambatan aktif), absen pulang mulai <strong>15:00 WIB</strong>.</>
            )}
            {selectedShift === 'cs_shift_2' && (
              <>Jadwal <strong>CS Shift 2</strong>: Jam masuk patokan <strong>15:00 WIB</strong> (toleransi keterlambatan aktif), absen pulang mulai <strong>21:00 WIB</strong>.</>
            )}
          </span>
        </div>

        {/* Today Summary */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50/70 p-4 text-center mb-6">
          <div className="px-2">
            <span className="text-xs text-slate-500">Absen Masuk</span>
            <p className="text-lg font-bold text-[#2F80ED] mt-1">
              {todayAttendance.checkIn || '—'}
            </p>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500">Absen Pulang</span>
            <p className="text-lg font-bold text-[#2F80ED] mt-1">
              {todayAttendance.checkOut || '—'}
            </p>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500">Total Jam Kerja</span>
            <p className="text-lg font-bold text-[#2F80ED] mt-1">
              {todayAttendance.totalHours || '—'}
            </p>
          </div>
        </div>

        {/* Status Hari Ini Banner */}
        {todayAttendance.status && (
          <div className={`mb-5 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
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

        {/* GPS Status Live */}
        <div className={`mb-6 flex items-center justify-between gap-3 rounded-xl border p-3.5 ${gpsDisplay.bg} ${gpsDisplay.border}`}>
          <div className="flex items-center gap-2.5">
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
              className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-3 w-3" /> Coba Lagi
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Absen Masuk */}
          <button
            type="button"
            onClick={handleCheckInClick}
            disabled={todayAttendance.isCheckedIn || isProcessingCheckIn}
            className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-md transition-all ${
              todayAttendance.isCheckedIn
                ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                : isProcessingCheckIn
                ? 'bg-blue-400 text-white shadow-none cursor-wait'
                : 'bg-[#2F80ED] text-white shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98]'
            }`}
          >
            {isProcessingCheckIn ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menyimpan Absensi...</span>
              </>
            ) : todayAttendance.isCheckedIn ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sudah Absen Masuk ✓</span>
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
            disabled={!todayAttendance.isCheckedIn || todayAttendance.isCheckedOut}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all ${
              todayAttendance.isCheckedOut
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : !todayAttendance.isCheckedIn
                ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-[#EB5757] bg-white text-[#EB5757] hover:bg-rose-50 shadow-sm active:scale-[0.98]'
            }`}
          >
            <LogOut className="h-4 w-4" />
            {todayAttendance.isCheckedOut ? 'Sudah Absen Pulang ✓' : 'Absen Pulang'}
          </button>

          {/* Input Izin */}
          <button
            type="button"
            onClick={onNavigateToIzin}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#2F80ED] bg-white py-3.5 text-sm font-semibold text-[#2F80ED] transition-all hover:bg-blue-50 active:scale-[0.98]"
          >
            <FileEdit className="h-4 w-4" />
            Ajukan Izin
          </button>
        </div>

        {/* Hint messages */}
        {!isQrScannedToday && !todayAttendance.isCheckedIn && (
          <p className="mt-3 text-center text-[11px] text-amber-600">
            ⚠️ Pindai QR Code dan pastikan berada dalam radius lokasi sebelum absen masuk.
          </p>
        )}
        {todayAttendance.isCheckedIn && !todayAttendance.isCheckedOut && (
          <p className="mt-3 text-center text-[11px] text-blue-600">
            ℹ️ Jangan lupa untuk melakukan absen pulang sebelum meninggalkan lokasi.
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
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
            setIsProcessingCheckIn(true);
            try {
              const mode = selectedShift === 'reguler' ? 'reguler' : 'cs';
              const csShift = selectedShift === 'cs_shift_2' ? 'shift_2' : 'shift_1';
              const res = await performCheckIn(
                scannedToken,
                mode,
                csShift
              );
              if (res.success) {
                showToast('success', res.message);
                try { confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } }); } catch { /* ignore */ }
              } else {
                showToast('error', res.message);
              }
            } catch (err: any) {
              showToast('error', err?.message || 'Terjadi kesalahan saat menyimpan absensi.');
            } finally {
              setIsProcessingCheckIn(false);
            }
          } else {
            showToast('success', 'Anda sudah melakukan absen masuk hari ini.');
          }
        }}
      />
    </div>
  );
};
