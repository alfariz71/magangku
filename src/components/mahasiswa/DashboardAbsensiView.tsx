import React, { useState } from 'react';
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
  Filter,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
    isLocationInRange,
    isGpsActive,
    isQrScannedToday,
    qrConfig
  } = useData();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [capturedSelfiePhoto, setCapturedSelfiePhoto] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Trigger Check-In
  const handleCheckInClick = () => {
    if (!isLocationInRange) {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal: Lokasi perangkat Anda berada di luar jangkauan area magang! Dekati area kantor untuk absen.'
      });
      return;
    }
    if (!isQrScannedToday) {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal: Silakan pindai QR Code resmi di lokasi magang terlebih dahulu.'
      });
      setIsScannerOpen(true);
      return;
    }

    const res = performCheckIn(capturedSelfiePhoto || undefined);
    if (res.success) {
      setFeedbackToast({ type: 'success', message: res.message });
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        console.error(e);
      }
    } else {
      setFeedbackToast({ type: 'error', message: res.message });
    }
  };

  // Trigger Check-Out
  const handleCheckOutClick = () => {
    if (!isLocationInRange) {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal: Anda harus berada di area kantor untuk melakukan absen pulang.'
      });
      return;
    }

    const res = performCheckOut(capturedSelfiePhoto || undefined);
    if (res.success) {
      setFeedbackToast({ type: 'success', message: res.message });
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        console.error(e);
      }
    } else {
      setFeedbackToast({ type: 'error', message: res.message });
    }
  };

  // Filter attendance records for current user
  const userRecords = attendances.filter(a => a.userId === (currentUser?.id || 'user-andi-01'));
  const filteredRecords = userRecords.filter(r => {
    const matchQuery = 
      r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'Semua' || r.status.toLowerCase() === filterStatus.toLowerCase();
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Dashboard Absensi</h2>
      </div>

      {/* Floating Notification Toast */}
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
          <button
            onClick={() => setFeedbackToast(null)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top 3 Stat Cards - Exact matching screenshot */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card 1: Daftar Hadir */}
        <div className="flex items-center gap-4 rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EBF3FE] text-[#2F80ED]">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Daftar Hadir</p>
            <p className="text-2xl font-bold text-[#2F80ED] leading-none mt-1">
              {attendanceStats.hadir}
            </p>
          </div>
        </div>

        {/* Card 2: Terlambat */}
        <div className="flex items-center gap-4 rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FEF0EE] text-[#EB5757]">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Terlambat</p>
            <p className="text-2xl font-bold text-[#EB5757] leading-none mt-1">
              {attendanceStats.terlambat}
            </p>
          </div>
        </div>

        {/* Card 3: Izin */}
        <div className="flex items-center gap-4 rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FEF8E8] text-[#F2C94C]">
            <Calendar className="h-6 w-6 text-[#F2994A]" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Izin</p>
            <p className="text-2xl font-bold text-[#F2994A] leading-none mt-1">
              {attendanceStats.izin}
            </p>
          </div>
        </div>
      </div>

      {/* Main Card: Absensi Hari Ini */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#183B66] mb-5">
          Absensi Hari Ini
        </h3>

        {/* 3 Metrics Top Banner */}
        <div className="grid grid-cols-1 divide-y divide-slate-100 rounded-2xl bg-slate-50/70 p-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 text-center">
          <div className="py-2 sm:py-0">
            <span className="text-xs text-slate-500">Absen Masuk</span>
            <p className="text-xl sm:text-2xl font-bold text-[#2F80ED] mt-1">
              {todayAttendance.checkIn || '--:-- WIB'}
            </p>
          </div>

          <div className="py-2 sm:py-0">
            <span className="text-xs text-slate-500">Absen Pulang</span>
            <p className="text-xl sm:text-2xl font-bold text-[#2F80ED] mt-1">
              {todayAttendance.checkOut || '--:-- WIB'}
            </p>
          </div>

          <div className="py-2 sm:py-0">
            <span className="text-xs text-slate-500">Total Jam Kerja</span>
            <p className="text-xl sm:text-2xl font-bold text-[#2F80ED] mt-1">
              {todayAttendance.totalHours || '0 jam 0 menit'}
            </p>
          </div>
        </div>

        {/* Two Columns: QR Code Frame (Left) & Location Status (Right) */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Scan QR Code Frame */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 p-6 bg-white shadow-inner/50 text-center">
            <h4 className="text-xs font-bold text-[#183B66] uppercase tracking-wider mb-3">
              Scan QR Code untuk Absensi
            </h4>

            {/* QR Code with Corner Brackets */}
            <div className="relative p-3">
              <div className="relative h-44 w-44 rounded-2xl border border-slate-100 bg-white p-3 shadow-md flex items-center justify-center">
                <QRCodeSVG
                  value={qrConfig.currentToken}
                  size={140}
                  level="H"
                  fgColor="#183B66"
                />
              </div>

              {/* Blue Corner Accents matching screenshot */}
              <div className="absolute top-1 left-1 h-6 w-6 border-t-3 border-l-3 border-[#2F80ED] rounded-tl-lg" />
              <div className="absolute top-1 right-1 h-6 w-6 border-t-3 border-r-3 border-[#2F80ED] rounded-tr-lg" />
              <div className="absolute bottom-1 left-1 h-6 w-6 border-b-3 border-l-3 border-[#2F80ED] rounded-bl-lg" />
              <div className="absolute bottom-1 right-1 h-6 w-6 border-b-3 border-r-3 border-[#2F80ED] rounded-br-lg" />
            </div>

            {/* Instructions */}
            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center justify-center gap-1.5 text-slate-600">
                <Camera className="h-3.5 w-3.5 text-slate-400" />
                <span>Arahkan kamera ke QR Code di lokasi magang</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-slate-600">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span>QR Code akan mengenali username peserta magang</span>
              </div>
            </div>

            {/* Open Camera Button & Live Status */}
            <div className="mt-4 w-full max-w-xs space-y-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2F80ED] bg-white py-2.5 text-xs font-semibold text-[#2F80ED] shadow-sm transition-all hover:bg-blue-50/60 active:scale-[0.98]"
              >
                <Camera className="h-4 w-4" />
                {isQrScannedToday ? 'Pindai Ulang QR Code' : 'Buka Kamera'}
              </button>

              {isQrScannedToday ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-[#27AE60] border border-emerald-200 w-full justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>QR Code Terverifikasi (Kantor Pusat)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-[#F2994A] border border-amber-200 w-full justify-center">
                  <Info className="h-3.5 w-3.5" />
                  <span>QR Code Belum Dipindai</span>
                </div>
              )}
            </div>

            {/* Username Display */}
            <div className="mt-2 text-xs text-slate-500 font-medium">
              Username: <span className="text-[#2F80ED] font-semibold">{currentUser?.username || 'andi.pratama'}</span>
            </div>
          </div>

          {/* Right: Location Status Cards */}
          <div className="flex flex-col justify-center space-y-4">
            {/* Condition 1: Dalam Jangkauan (Green) */}
            <div
              className={`rounded-2xl border p-5 transition-all ${
                isLocationInRange && isGpsActive
                  ? 'border-emerald-200 bg-[#E8F8EE]/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#27AE60] text-white shadow-sm ring-4 ring-emerald-100">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Status Lokasi
                    </h4>
                    <p className="text-xs font-semibold text-[#27AE60] mt-0.5">
                      Lokasi dalam jangkauan
                    </p>
                  </div>
                </div>

                <Badge variant="success">
                  Dapat Absen
                </Badge>
              </div>

              <p className="mt-2.5 text-xs text-slate-500 pl-8">
                Lokasi Anda sesuai dengan area magang
              </p>
            </div>

            {/* Condition 2: Di Luar Jangkauan (Red) */}
            <div
              className={`rounded-2xl border p-5 transition-all ${
                !isLocationInRange && isGpsActive
                  ? 'border-rose-200 bg-[#FDEEEE]/50 ring-2 ring-rose-500/20'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EB5757] text-white shadow-sm ring-4 ring-rose-100">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Status Lokasi di Luar Jangkauan
                    </h4>
                    <p className="text-xs font-semibold text-[#EB5757] mt-0.5">
                      Lokasi berada di luar jangkauan
                    </p>
                  </div>
                </div>

                <Badge variant="danger">
                  Tidak Dapat Absen
                </Badge>
              </div>

              <p className="mt-2.5 text-xs text-slate-500 pl-8">
                Dekati area magang untuk melakukan absensi
              </p>
            </div>

            {/* GPS Not Active Notice if disabled */}
            {!isGpsActive && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center justify-between">
                <span>⚠️ Lokasi GPS tidak aktif pada perangkat Anda.</span>
                <span className="font-semibold underline">Aktifkan Lokasi</span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Action Buttons Row - Exact matching screenshot */}
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {/* Absen Masuk */}
          <button
            type="button"
            onClick={handleCheckInClick}
            disabled={todayAttendance.isCheckedIn && !todayAttendance.isCheckedOut}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-md transition-all ${
              todayAttendance.isCheckedIn
                ? 'bg-slate-100 text-slate-500 border border-slate-200 shadow-none cursor-default'
                : isLocationInRange && isGpsActive && isQrScannedToday
                ? 'bg-[#2F80ED] text-white shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98]'
                : 'bg-blue-300 text-white hover:bg-[#2F80ED]'
            }`}
          >
            <LogIn className="h-4 w-4" />
            {todayAttendance.isCheckedIn ? 'Sudah Absen Masuk' : 'Absen Masuk'}
          </button>

          {/* Absen Pulang */}
          <button
            type="button"
            onClick={handleCheckOutClick}
            disabled={todayAttendance.isCheckedOut}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
              todayAttendance.isCheckedOut
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-default'
                : 'border-[#EB5757] bg-white text-[#EB5757] hover:bg-rose-50 active:scale-[0.98]'
            }`}
          >
            <LogOut className="h-4 w-4" />
            {todayAttendance.isCheckedOut ? 'Sudah Absen Pulang' : 'Absen Pulang'}
          </button>

          {/* Input Izin */}
          <button
            type="button"
            onClick={onNavigateToIzin}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#2F80ED] bg-white py-3 text-sm font-semibold text-[#2F80ED] transition-all hover:bg-blue-50 active:scale-[0.98]"
          >
            <FileEdit className="h-4 w-4" />
            Input Izin
          </button>
        </div>
      </div>


      {/* Riwayat Absensi Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#183B66]">
            Riwayat Absensi
          </h3>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tanggal..."
                className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Izin">Izin / Sakit</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3 px-4">Hari</th>
                <th className="pb-3 px-4">Absen Masuk</th>
                <th className="pb-3 px-4">Absen Pulang</th>
                <th className="pb-3 px-4">Total Jam</th>
                <th className="pb-3 pl-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data riwayat absensi yang cocok
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 text-slate-900 font-semibold">
                      {item.dayName}, {item.date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.dayName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {item.checkInTime || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {item.checkOutTime || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {item.totalHours || '—'}
                    </td>
                    <td className="py-3.5 pl-4">
                      {item.status === 'Hadir' && (
                        <span className="text-[#27AE60] font-semibold">Hadir</span>
                      )}
                      {item.status === 'Terlambat' && (
                        <span className="text-[#EB5757] font-semibold">Terlambat</span>
                      )}
                      {item.status === 'Izin' && (
                        <span className="text-[#F2994A] font-semibold">Izin</span>
                      )}
                      {item.status === 'Sakit' && (
                        <span className="text-[#F2994A] font-semibold">Izin sakit</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera Scanner Modal Component */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccessScan={(photo) => {
          if (photo) setCapturedSelfiePhoto(photo);
          setFeedbackToast({
            type: 'success',
            message: `QR Code & Foto Wajah berhasil dipindai! Username ${currentUser?.username || 'andi.pratama'} terverifikasi (Siap diunggah ke Cloudflare R2).`
          });
        }}
      />
    </div>
  );
};
