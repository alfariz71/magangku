import React, { useState } from 'react';
import { 
  FileText, 
  Check, 
  X, 
  Search, 
  Calendar, 
  FileCheck, 
  Eye, 
  Download, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { LeaveRequest } from '../../types';

export const PengajuanIzinAdminView: React.FC = () => {
  const { leaveRequests, reviewLeaveRequest } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'Disetujui' | 'Ditolak'>('Disetujui');
  const [adminNotes, setAdminNotes] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const openReviewModal = (req: LeaveRequest, type: 'Disetujui' | 'Ditolak') => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminNotes(type === 'Disetujui' ? 'Pengajuan izin disetujui oleh Administrator.' : 'Pengajuan ditolak karena alasan operasional.');
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    reviewLeaveRequest(selectedRequest.id, actionType, adminNotes);
    const msg = actionType === 'Disetujui'
      ? `Pengajuan izin ${selectedRequest.studentName} berhasil disetujui dan status absensi otomatis disinkronkan!`
      : `Pengajuan izin ${selectedRequest.studentName} ditolak.`;
    
    setSelectedRequest(null);
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const filteredRequests = leaveRequests.filter(r => {
    const matchQuery = 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentNim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Pemeriksaan Pengajuan Izin</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tinjau, verifikasi surat pendukung, dan berikan persetujuan atau penolakan pengajuan izin mahasiswa
        </p>
      </div>

      {feedbackToast && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mahasiswa, NIM, atau alasan izin..."
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
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
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
                <th className="pb-3 px-3">Tgl Pengajuan</th>
                <th className="pb-3 px-3">Periode Izin</th>
                <th className="pb-3 px-3">Jenis Izin</th>
                <th className="pb-3 px-3">Alasan & Dokumen</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 pl-3 text-right">Aksi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data pengajuan izin
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mahasiswa */}
                    <td className="py-3.5 pr-3">
                      <p className="font-bold text-slate-900">{req.studentName}</p>
                      <p className="text-[11px] text-slate-400">{req.studentNim} • {req.university}</p>
                    </td>

                    {/* Tgl Pengajuan */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                      {req.requestDate}
                    </td>

                    {/* Periode */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{req.startDate}</span>
                      <div className="text-[10px] text-slate-400">s/d {req.endDate}</div>
                    </td>

                    {/* Jenis Izin */}
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {req.leaveType}
                    </td>

                    {/* Reason & Doc */}
                    <td className="py-3.5 px-3 max-w-[220px]">
                      <p className="truncate text-slate-700" title={req.reason}>{req.reason}</p>
                      {req.documentName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2F80ED] mt-0.5">
                          <FileText className="h-3 w-3" />
                          {req.documentName}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {req.status === 'Menunggu' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF8E8] px-2.5 py-0.5 text-xs font-semibold text-[#F2994A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F2994A]" />
                          Menunggu
                        </span>
                      )}
                      {req.status === 'Disetujui' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F8EE] px-2.5 py-0.5 text-xs font-semibold text-[#27AE60]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60]" />
                          Disetujui
                        </span>
                      )}
                      {req.status === 'Ditolak' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FDEEEE] px-2.5 py-0.5 text-xs font-semibold text-[#EB5757]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#EB5757]" />
                          Ditolak
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                      {req.status === 'Menunggu' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openReviewModal(req, 'Disetujui')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#27AE60] hover:bg-emerald-100"
                            title="Setujui Pengajuan Izin"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Setujui
                          </button>
                          <button
                            onClick={() => openReviewModal(req, 'Ditolak')}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#EB5757] hover:bg-rose-100"
                            title="Tolak Pengajuan Izin"
                          >
                            <X className="h-3.5 w-3.5" />
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Telah ditinjau</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Confirmation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedRequest(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#183B66]">
                {actionType === 'Disetujui' ? 'Setujui Pengajuan Izin' : 'Tolak Pengajuan Izin'}
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
              <p><span className="text-slate-400">Pemohon:</span> <span className="font-bold text-slate-900">{selectedRequest.studentName}</span></p>
              <p><span className="text-slate-400">Jenis Izin:</span> <span className="font-semibold text-slate-800">{selectedRequest.leaveType}</span></p>
              <p><span className="text-slate-400">Tanggal:</span> <span className="font-semibold text-slate-800">{selectedRequest.startDate} - {selectedRequest.endDate}</span></p>
              <p><span className="text-slate-400">Alasan:</span> {selectedRequest.reason}</p>
            </div>

            <form onSubmit={handleConfirmReview} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Administrator untuk Mahasiswa
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              {actionType === 'Disetujui' && (
                <div className="rounded-xl bg-blue-50/70 p-3 text-[11px] text-[#2F80ED] border border-blue-100">
                  ℹ️ Persetujuan ini akan secara otomatis memperbarui status absensi mahasiswa menjadi <strong>Izin / Sakit</strong> pada tanggal tersebut.
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-md ${
                    actionType === 'Disetujui' ? 'bg-[#27AE60] hover:bg-emerald-600' : 'bg-[#EB5757] hover:bg-rose-600'
                  }`}
                >
                  Konfirmasi {actionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
