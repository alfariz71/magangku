import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Calendar, 
  ChevronDown, 
  UploadCloud, 
  Info, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  AlertCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { LeaveType } from '../../types';

export const PengajuanIzinView: React.FC = () => {
  const { leaveRequests, submitLeaveRequest } = useData();

  // Form states
  const [startDate, setStartDate] = useState('2025-05-22');
  const [endDate, setEndDate] = useState('2025-05-22');
  const [leaveType, setLeaveType] = useState<LeaveType>('Izin Sakit');
  const [reason, setReason] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file melebihi batas maksimal 5MB.');
      return;
    }

    // Check format
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setFileError('Format file tidak didukung. Harap unggah format PDF, JPG, atau PNG.');
      return;
    }

    setFileName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setErrorMessage('Tanggal mulai dan selesai izin wajib diisi.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Alasan pengajuan izin wajib diisi.');
      return;
    }

    submitLeaveRequest(
      startDate,
      endDate,
      leaveType,
      reason,
      fileName || (leaveType.includes('Sakit') ? 'Surat_Keterangan_Dokter.pdf' : 'Surat_Permohonan.pdf')
    );

    // Reset Form
    setReason('');
    setFileName(null);
    setErrorMessage(null);
    setSuccessToast(true);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setSuccessToast(false);
    }, 4000);
  };

  const handleResetForm = () => {
    setReason('');
    setFileName(null);
    setErrorMessage(null);
    setFileError(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(leaveRequests.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeaveRequests = leaveRequests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Pengajuan Izin</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ajukan izin apabila Anda tidak dapat mengikuti kegiatan magang
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('form-pengajuan');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Ajukan Izin
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>Pengajuan izin berhasil dikirim! Menunggu tinjauan dari Administrator.</span>
        </div>
      )}

      {/* Main 2-Column Layout matching screenshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols on desktop): Riwayat Pengajuan Izin */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-4">
              Riwayat Pengajuan Izin
            </h3>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-600 font-bold">
                    <th className="pb-3 pr-3">Tanggal Pengajuan</th>
                    <th className="pb-3 px-3">Tanggal Izin</th>
                    <th className="pb-3 px-3">Jenis Izin</th>
                    <th className="pb-3 px-3">Alasan</th>
                    <th className="pb-3 pl-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {currentLeaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada riwayat pengajuan izin
                      </td>
                    </tr>
                  ) : (
                    currentLeaveRequests.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-3 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{item.requestDate}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-800 whitespace-nowrap">
                          <div>
                            <span>{item.startDate}</span>
                            <div className="text-[10px] text-slate-400">– {item.endDate}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-800 whitespace-nowrap">
                          {item.leaveType}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 max-w-[180px] truncate" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="py-3.5 pl-3 whitespace-nowrap">
                          {item.status === 'Menunggu' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF8E8] px-2.5 py-1 text-xs font-semibold text-[#F2994A] border border-[#F2994A]/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F2994A]" />
                              Menunggu
                            </span>
                          )}
                          {item.status === 'Disetujui' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EE] px-2.5 py-1 text-xs font-semibold text-[#27AE60] border border-[#27AE60]/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60]" />
                              Disetujui
                            </span>
                          )}
                          {item.status === 'Ditolak' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDEEEE] px-2.5 py-1 text-xs font-semibold text-[#EB5757] border border-[#EB5757]/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#EB5757]" />
                              Ditolak
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>
                Menampilkan {startIndex + 1} – {Math.min(startIndex + itemsPerPage, leaveRequests.length)} dari {leaveRequests.length} data
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#2F80ED] px-2 text-xs font-semibold text-white">
                  {currentPage}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Blue Info Notice Banner matching screenshot */}
          <div className="flex items-center gap-3 rounded-[16px] border border-blue-100 bg-[#EBF3FE]/70 p-4 text-xs text-[#183B66]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2F80ED] text-white">
              <Info className="h-4 w-4" />
            </div>
            <p className="font-medium leading-relaxed">
              Pengajuan izin yang disetujui akan tercatat otomatis pada absensi.
            </p>
          </div>
        </div>

        {/* Right Column (5 cols on desktop): Form Pengajuan Izin */}
        <div id="form-pengajuan" className="lg:col-span-5">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3">
              Form Pengajuan Izin
            </h3>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-[#EB5757]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date pickers row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Tanggal Mulai */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                </div>

                {/* Tanggal Selesai */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Jenis Izin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jenis Izin
                </label>
                <div className="relative">
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  >
                    <option value="Izin Sakit">Izin Sakit</option>
                    <option value="Izin Pribadi">Izin Pribadi</option>
                    <option value="Keperluan Akademik">Keperluan Akademik</option>
                    <option value="Dispensasi Kampus">Dispensasi Kampus</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Alasan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Alasan
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Jelaskan alasan Anda mengajukan izin..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                  <div className="text-right text-[10px] text-slate-400 mt-1">
                    {reason.length} / 500
                  </div>
                </div>
              </div>

              {/* Upload Surat atau Dokumen Pendukung */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Upload Surat atau Dokumen Pendukung
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-all hover:border-[#2F80ED] hover:bg-blue-50/20 cursor-pointer"
                >
                  <UploadCloud className="h-8 w-8 text-[#2F80ED] mb-2" />
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-[#2F80ED]">Klik untuk mengunggah</span> atau seret file ke sini
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Format: PDF, JPG, PNG (Maks. 5MB)
                  </p>

                  {fileName && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-[#2F80ED]">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{fileName}</span>
                    </div>
                  )}
                </div>

                {fileError && (
                  <p className="mt-1.5 text-[11px] text-[#EB5757]">{fileError}</p>
                )}
              </div>

              {/* Action Buttons: Batal & Kirim Pengajuan */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2F80ED] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98]"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
