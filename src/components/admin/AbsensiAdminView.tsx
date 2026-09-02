import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  QrCode, 
  Calendar, 
  X,
  AlertCircle,
  Eye,
  Cloud,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AttendanceRecord, AttendanceStatus } from '../../types';

export const AbsensiAdminView: React.FC = () => {
  const { attendances, adminCorrectAttendance, qrConfig } = useData();

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

  // Photo Preview Modal State
  const [viewingPhotoRecord, setViewingPhotoRecord] = useState<AttendanceRecord | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const openCorrectionModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setCorrCheckIn(record.checkInTime || '08:00 WIB');
    setCorrCheckOut(record.checkOutTime || '17:00 WIB');
    setCorrStatus(record.status);
    setCorrReason('');
    setCorrError(null);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!corrReason.trim()) {
      setCorrError('Alasan perubahan koreksi absensi wajib diisi untuk pencatatan audit log.');
      return;
    }

    adminCorrectAttendance(
      editingRecord.id,
      corrCheckIn,
      corrCheckOut,
      corrStatus,
      corrReason
    );

    setEditingRecord(null);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3500);
  };

  const handleCopyCDNUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Manajemen Absensi & Bukti Foto</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pantau kehadiran, foto selfie presensi (Cloudflare R2), validasi QR Code & GPS seluruh mahasiswa
          </p>
        </div>

        {/* Cloudflare R2 Storage Status Pill */}
        <div className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-2 text-xs font-semibold text-orange-800 shadow-xs">
          <Cloud className="h-4 w-4 text-orange-600" />
          <span>Storage: <strong>Cloudflare R2</strong> (Egress: Rp 0)</span>
        </div>
      </div>

      {successToast && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Koreksi absensi berhasil disimpan dan dicatat ke dalam audit log sistem!</span>
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
              <option value="Universitas Indonesia">Universitas Indonesia</option>
              <option value="Institut Teknologi Bandung">ITB</option>
              <option value="Universitas Gadjah Mada">UGM</option>
              <option value="Institut Teknologi Sepuluh Nopember">ITS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-3">Mahasiswa</th>
                <th className="pb-3 px-3">Foto Presensi (R2)</th>
                <th className="pb-3 px-3">Tanggal & Hari</th>
                <th className="pb-3 px-3">Absen Masuk</th>
                <th className="pb-3 px-3">Absen Pulang</th>
                <th className="pb-3 px-3">Total Jam</th>
                <th className="pb-3 px-3">Validasi QR & GPS</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 pl-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data absensi peserta
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mahasiswa */}
                    <td className="py-3.5 pr-3">
                      <p className="font-bold text-slate-900">{item.studentName}</p>
                      <p className="text-[11px] text-slate-400">{item.studentNim} • {item.university}</p>
                    </td>

                    {/* Foto Presensi (Cloudflare R2) */}
                    <td className="py-3.5 px-3">
                      {item.photoUrl ? (
                        <div 
                          onClick={() => setViewingPhotoRecord(item)}
                          className="group relative flex items-center gap-2 cursor-pointer"
                          title="Klik untuk memperbesar foto presensi"
                        >
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl ring-2 ring-blue-100 shadow-sm transition-transform group-hover:scale-105">
                            <img
                              src={item.photoUrl}
                              alt={`Foto ${item.studentName}`}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="h-4 w-4" />
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#2F80ED] group-hover:underline">
                            Lihat Foto
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa Foto</span>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <p className="font-semibold text-slate-800">{item.dayName}, {item.date}</p>
                    </td>

                    {/* Masuk */}
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-800">{item.checkInTime || '—'}</span>
                    </td>

                    {/* Pulang */}
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-800">{item.checkOutTime || '—'}</span>
                    </td>

                    {/* Total Jam */}
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-800">{item.totalHours || '—'}</span>
                    </td>

                    {/* Validasi QR & Lokasi */}
                    <td className="py-3.5 px-3">
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
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
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
                    <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openCorrectionModal(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-[#2F80ED]"
                        title="Koreksi Absensi Manual"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-[#2F80ED]" />
                        <span>Koreksi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pratinjau Foto Presensi Mahasiswa */}
      {viewingPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs" onClick={() => setViewingPhotoRecord(null)} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#183B66]">Bukti Foto Presensi Mahasiswa</h3>
                  <p className="text-[11px] text-slate-400">Tersimpan di Cloudflare R2 Object Storage</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPhotoRecord(null)} 
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo & Snapshot Container */}
            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-64 w-64 overflow-hidden rounded-2xl border-4 border-white shadow-xl ring-2 ring-slate-100 bg-slate-100">
                <img
                  src={viewingPhotoRecord.photoUrl || ''}
                  alt={`Bukti presensi ${viewingPhotoRecord.studentName}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                  {viewingPhotoRecord.checkInTime || 'Presensi'}
                </div>
              </div>

              <h4 className="mt-3 text-base font-bold text-slate-900">{viewingPhotoRecord.studentName}</h4>
              <p className="text-xs text-slate-500">{viewingPhotoRecord.studentNim} • {viewingPhotoRecord.university}</p>
            </div>

            {/* Metadata Badges */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">TANGGAL & HARI</span>
                <p className="font-bold text-slate-800">{viewingPhotoRecord.dayName}, {viewingPhotoRecord.date}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">JAM MASUK / PULANG</span>
                <p className="font-bold text-slate-800">{viewingPhotoRecord.checkInTime || '-'} s/d {viewingPhotoRecord.checkOutTime || '-'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">STATUS LOKASI GEOFENCE</span>
                <p className="font-bold text-[#27AE60] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Dalam Jangkauan (&lt; 200m)
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium">TOKEN QR DIGUNAKAN</span>
                <p className="font-mono text-[11px] font-bold text-blue-600 truncate">{viewingPhotoRecord.qrSessionId || qrConfig.currentToken}</p>
              </div>
            </div>

            {/* Cloudflare CDN URL Box */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-orange-50/70 p-2.5 border border-orange-100 text-xs">
              <div className="flex items-center gap-1.5 truncate mr-2">
                <Cloud className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <code className="text-[11px] text-orange-950 font-mono truncate">
                  {viewingPhotoRecord.photoUrl?.startsWith('data:') 
                    ? `https://cdn.magangku.id/absensi/${viewingPhotoRecord.studentNim}_${viewingPhotoRecord.date}.jpg`
                    : viewingPhotoRecord.photoUrl}
                </code>
              </div>
              <button
                onClick={() => handleCopyCDNUrl(viewingPhotoRecord.photoUrl || '')}
                className="flex items-center gap-1 text-[11px] font-semibold text-orange-700 hover:underline shrink-0"
              >
                {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedUrl ? 'Tersalin' : 'Salin CDN'}</span>
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingPhotoRecord(null)}
                className="w-full rounded-xl bg-[#2F80ED] py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className="rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
