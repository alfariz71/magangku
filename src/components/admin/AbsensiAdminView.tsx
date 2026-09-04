import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  QrCode, 
  Calendar,
  X,
  AlertCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AttendanceRecord, AttendanceStatus } from '../../types';

export const AbsensiAdminView: React.FC = () => {
  const { attendances, adminCorrectAttendance, deleteAttendance, qrConfig } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterUniversity, setFilterUniversity] = useState('Semua');
  
  // Correction Modal States
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [corrCheckIn, setCorrCheckIn] = useState('');
  const [corrCheckOut, setCorrCheckOut] = useState('');
  const [corrStatus, setCorrStatus] = useState<AttendanceStatus>('Hadir');
  const [corrReason, setCorrReason] = useState('');
  const [corrError, setCorrError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Delete Modal States
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteToast, setDeleteToast] = useState(false);

  const [isSavingCorr, setIsSavingCorr] = useState(false);

  const openCorrectionModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setCorrCheckIn(record.checkInTime || '08:00 WIB');
    setCorrCheckOut(record.checkOutTime || '17:00 WIB');
    setCorrStatus(record.status);
    setCorrReason('');
    setCorrError(null);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!corrReason.trim()) {
      setCorrError('Alasan perubahan koreksi absensi wajib diisi untuk pencatatan audit log.');
      return;
    }

    setIsSavingCorr(true);
    setCorrError(null);
    try {
      await adminCorrectAttendance(
        editingRecord.id,
        corrCheckIn,
        corrCheckOut,
        corrStatus,
        corrReason
      );

      setEditingRecord(null);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3500);
    } catch (err: any) {
      setCorrError(err?.message || 'Gagal menyimpan koreksi absensi.');
    } finally {
      setIsSavingCorr(false);
    }
  };

  // Filter attendance records
  const filteredRecords = attendances.filter(a => {
    const matchQuery = 
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentNim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.university.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === 'Semua' || a.status.toLowerCase() === filterStatus.toLowerCase();
    const matchUniv = filterUniversity === 'Semua' || a.university === filterUniversity;

    return matchQuery && matchStatus && matchUniv;
  });

  // Get today's date string in 'sv-SE' format (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

  // Helper to calculate numeric timestamp score for sorting attendances (newest check-in first)
  const getRecordTimeScore = (record: AttendanceRecord): number => {
    if (record.rawCheckInTime) {
      const t = new Date(record.rawCheckInTime).getTime();
      if (!isNaN(t)) return t;
    }
    if (record.checkInTime) {
      const match = record.checkInTime.match(/(\d{1,2})[:.](\d{2})/);
      if (match) {
        const hh = match[1].padStart(2, '0');
        const mm = match[2];
        const d = new Date(`${record.date}T${hh}:${mm}:00+07:00`);
        const t = d.getTime();
        if (!isNaN(t)) return t;
      }
    }
    return 0;
  };

  // Group records by date
  const groupedByDate: { date: string; records: AttendanceRecord[] }[] = [];
  filteredRecords.forEach(record => {
    const existing = groupedByDate.find(g => g.date === record.date);
    if (existing) {
      existing.records.push(record);
    } else {
      groupedByDate.push({ date: record.date, records: [record] });
    }
  });

  // Urutkan tanggal terbaru paling atas
  groupedByDate.sort((a, b) => b.date.localeCompare(a.date));

  // Di dalam setiap tanggal, urutkan jam absen masuk terbaru paling atas (yang baru absen paling atas)
  groupedByDate.forEach(g => {
    g.records.sort((a, b) => getRecordTimeScore(b) - getRecordTimeScore(a));
  });

  const getDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hari Ini';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    if (dateStr === yesterdayStr) return 'Kemarin';
    return null;
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const uniqueUniversities = [...new Set(attendances.map(a => a.university).filter(Boolean))];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Manajemen Absensi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pantau kehadiran, validasi QR Code &amp; GPS seluruh peserta magang
        </p>
      </div>

      {successToast && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Koreksi absensi berhasil disimpan dan dicatat ke dalam audit log sistem!</span>
        </div>
      )}

      {deleteToast && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-600 border border-rose-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Data absensi berhasil dihapus dari sistem!</span>
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mahasiswa, NIM, universitas, atau tanggal..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
            </select>

            <select
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            >
              <option value="Semua">Semua Universitas</option>
              {uniqueUniversities.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-600 font-bold">
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Absen Masuk</th>
                <th className="py-3 px-4">Absen Pulang</th>
                <th className="py-3 px-4">Total Jam</th>
                <th className="py-3 px-4">Validasi QR &amp; GPS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p>Tidak ditemukan data absensi peserta</p>
                  </td>
                </tr>
              ) : (
                groupedByDate.map(({ date, records }) => {
                  const label = getDateLabel(date);
                  const isToday = date === todayStr;

                  return (
                    <React.Fragment key={date}>
                      {/* Date Separator Row */}
                      <tr>
                        <td colSpan={7} className="px-0 py-0">
                          <div className={`flex items-center gap-3 px-4 py-2.5 ${
                            isToday
                              ? 'bg-blue-50/80 border-y border-blue-100'
                              : 'bg-slate-50/70 border-y border-slate-100'
                          }`}>
                            <div className={`flex items-center gap-2 text-xs font-bold ${
                              isToday ? 'text-[#2F80ED]' : 'text-slate-500'
                            }`}>
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDateHeader(date)}</span>
                            </div>
                            {label && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isToday
                                  ? 'bg-[#2F80ED] text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {label}
                              </span>
                            )}
                            <div className="flex-1 h-px bg-current opacity-10" />
                            <span className={`text-[10px] font-semibold ${
                              isToday ? 'text-blue-400' : 'text-slate-400'
                            }`}>
                              {records.length} peserta
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Records for this date */}
                      {records.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            idx < records.length - 1 ? 'border-b border-slate-100/60' : ''
                          }`}
                        >
                          {/* Mahasiswa */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900">{item.studentName}</p>
                            <p className="text-[11px] text-slate-400">{item.studentNim} • {item.university}</p>
                          </td>

                          {/* Masuk */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800">{item.checkInTime || '—'}</span>
                          </td>

                          {/* Pulang */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800">{item.checkOutTime || '—'}</span>
                          </td>

                          {/* Total Jam */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800">{item.totalHours || '—'}</span>
                          </td>

                          {/* Validasi QR & Lokasi */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                item.isQrValid ? 'bg-blue-50 text-[#2F80ED]' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <QrCode className="h-3 w-3" />
                                {item.isQrValid ? 'QR Valid' : 'No QR'}
                              </span>

                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                item.isLocationValid ? 'bg-emerald-50 text-[#27AE60]' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <MapPin className="h-3 w-3" />
                                {item.isLocationValid ? 'Area Kantor' : 'Luar Area'}
                              </span>

                              {item.locationName && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 border border-blue-100">
                                  📍 {item.locationName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.status === 'Hadir' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#27AE60]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60]" />
                                Hadir
                              </span>
                            )}
                            {item.status === 'Terlambat' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-[#EB5757]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#EB5757]" />
                                Terlambat
                              </span>
                            )}
                            {(item.status === 'Izin' || item.status === 'Sakit') && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-[#F2994A]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#F2994A]" />
                                {item.status}
                              </span>
                            )}
                            {item.correctedByAdmin && (
                              <span className="block text-[10px] text-blue-500 mt-0.5">Dikoreksi Admin</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openCorrectionModal(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-[#2F80ED] transition"
                                title="Koreksi Absensi Manual"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-[#2F80ED]" />
                                <span>Koreksi</span>
                              </button>
                              <button
                                onClick={() => setDeletingRecord(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100/70 hover:border-rose-300 transition"
                                title="Hapus Data Absensi"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Modal with Audit Log */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditingRecord(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#183B66]">Koreksi Absensi Mahasiswa</h3>
              <button onClick={() => setEditingRecord(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-bold text-slate-800">{editingRecord.studentName} ({editingRecord.studentNim})</p>
              <p className="text-[11px] text-slate-400">Tanggal: {editingRecord.dayName}, {editingRecord.date}</p>
            </div>

            {corrError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-[#EB5757]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{corrError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCorrection} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Absen Masuk</label>
                  <input
                    type="text"
                    value={corrCheckIn}
                    onChange={e => setCorrCheckIn(e.target.value)}
                    placeholder="08:00 WIB"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Absen Pulang</label>
                  <input
                    type="text"
                    value={corrCheckOut}
                    onChange={e => setCorrCheckOut(e.target.value)}
                    placeholder="17:00 WIB"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kehadiran</label>
                <select
                  value={corrStatus}
                  onChange={e => setCorrStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Perubahan / Koreksi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={corrReason}
                  onChange={e => setCorrReason(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Mahasiswa mengalami kendala sinyal GPS saat absensi masuk di lokasi kantor."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alasan ini wajib diisi dan akan dicatat secara otomatis dalam audit log sistem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCorr}
                  className="rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSavingCorr ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => !isDeleting && setDeletingRecord(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Data Absensi?</h3>
                <p className="text-xs text-slate-500">Tindakan ini permanen dan tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 my-4 text-xs text-slate-600 space-y-1.5">
              <p><span className="text-slate-400">Mahasiswa:</span> <strong className="text-slate-900">{deletingRecord.studentName}</strong> ({deletingRecord.studentNim})</p>
              <p><span className="text-slate-400">Tanggal:</span> <strong>{deletingRecord.dayName}, {deletingRecord.date}</strong></p>
              <p><span className="text-slate-400">Status:</span> <strong>{deletingRecord.status}</strong> ({deletingRecord.checkInTime || '-'} s/d {deletingRecord.checkOutTime || '-'})</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingRecord(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  const success = await deleteAttendance(deletingRecord.id);
                  setIsDeleting(false);
                  if (success) {
                    setDeletingRecord(null);
                    setDeleteToast(true);
                    setTimeout(() => setDeleteToast(false), 3000);
                  } else {
                    alert('Gagal menghapus data absensi. Silakan coba lagi.');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-60 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Absen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
