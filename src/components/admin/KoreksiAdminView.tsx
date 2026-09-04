import React, { useState } from 'react';
import { ClipboardCheck, Search, Filter, Check, X, Eye, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AttendanceCorrectionRequest } from '../../types';

export default function KoreksiAdminView() {
  const { correctionRequests, reviewCorrectionRequest, refreshCorrectionRequests } = useData();

  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<AttendanceCorrectionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const total = correctionRequests.length;
  const waiting = correctionRequests.filter(r => r.status === 'Menunggu').length;
  const approved = correctionRequests.filter(r => r.status === 'Disetujui').length;
  const rejected = correctionRequests.filter(r => r.status === 'Ditolak').length;

  const filteredRequests = correctionRequests.filter(r => {
    if (filter !== 'Semua' && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.studentName?.toLowerCase().includes(q) && !r.studentNim?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleProcess = async (status: 'Disetujui' | 'Ditolak') => {
    if (!selectedReq) return;
    if (status === 'Ditolak' && !adminNotes.trim()) {
      showToast('error', 'Alasan penolakan wajib diisi');
      return;
    }
    setIsProcessing(true);
    try {
      await reviewCorrectionRequest(selectedReq.id, status, adminNotes);
      showToast('success', `Koreksi berhasil ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}.`);
      setSelectedReq(null);
      setAdminNotes('');
    } catch {
      showToast('error', 'Gagal memproses permintaan. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCorrectionRequests();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={12}/> Menunggu</span>;
      case 'Disetujui': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Check size={12}/> Disetujui</span>;
      case 'Ditolak': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><X size={12}/> Ditolak</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const formatDate = (s: string) => s ? new Date(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const formatDateShort = (s: string) => s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#183B66]">Koreksi Absensi</h1>
          <p className="text-gray-500">Proses permintaan koreksi absensi peserta</p>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2F80ED] transition disabled:opacity-50 border border-gray-200 px-3 py-2 rounded-xl">
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {toast && (
        <div className={`rounded-xl p-4 flex items-start border ${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {toast.type === 'success'
            ? <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            : <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />}
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.message}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Permintaan</p>
          <p className="text-3xl font-bold text-[#183B66]">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
          <p className="text-sm text-amber-600 font-medium mb-1">Menunggu</p>
          <p className="text-3xl font-bold text-amber-600">{waiting}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100">
          <p className="text-sm text-green-600 font-medium mb-1">Disetujui</p>
          <p className="text-3xl font-bold text-green-600">{approved}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
          <p className="text-sm text-red-600 font-medium mb-1">Ditolak</p>
          <p className="text-3xl font-bold text-red-600">{rejected}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-gray-50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari nama atau NIM peserta..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400 hidden sm:block" />
            <select className="w-full sm:w-auto border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition bg-white"
              value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Hanya Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRequests.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Peserta</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Tanggal & Jenis</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Alasan Koreksi</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4">
                      <p className="font-bold text-[#183B66]">{req.studentName || 'Peserta'}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{req.studentNim || '-'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-800">{formatDateShort(req.attendanceDate)}</p>
                      <p className="text-xs font-semibold text-[#2F80ED] mt-1">{req.correctionType}</p>
                    </td>
                    <td className="p-4 max-w-xs" title={req.reason}>
                      <p className="text-sm text-gray-600 truncate">{req.reason}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Diajukan: {formatDateShort(req.createdAt)}</p>
                    </td>
                    <td className="p-4">{getStatusBadge(req.status)}</td>
                    <td className="p-4">
                      {req.status === 'Menunggu' ? (
                        <button onClick={() => { setSelectedReq(req); setAdminNotes(''); }}
                          className="flex items-center gap-1.5 bg-[#2F80ED] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition shadow-sm active:scale-95">
                          <Eye size={16} /> Proses
                        </button>
                      ) : (
                        <button onClick={() => { setSelectedReq(req); setAdminNotes(''); }}
                          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition active:scale-95">
                          <Eye size={16} /> Detail
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <ClipboardCheck size={64} className="mb-4 text-gray-200" />
              <p className="text-lg font-bold text-gray-600 mb-1">Tidak ada permintaan koreksi</p>
              <p className="text-sm">Belum ada data atau filter pencarian terlalu spesifik.</p>
            </div>
          )}
        </div>
      </div>

      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-[#183B66] text-lg flex items-center gap-2">
                <ClipboardCheck size={20} className="text-[#2F80ED]" />Detail Koreksi Absensi
              </h3>
              <button onClick={() => { setSelectedReq(null); setAdminNotes(''); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Peserta</p>
                    <p className="font-bold text-[#183B66]">{selectedReq.studentName || 'Peserta'}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedReq.studentNim || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Tanggal Absensi</p>
                    <p className="font-bold text-gray-800">{formatDate(selectedReq.attendanceDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Jenis Koreksi</p>
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#2F80ED] text-xs font-bold rounded-lg border border-blue-100">
                      {selectedReq.correctionType}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Status</p>
                    <div>{getStatusBadge(selectedReq.status)}</div>
                  </div>
                  {selectedReq.requestedCheckIn && (
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Jam Masuk Diminta</p>
                      <p className="font-semibold text-gray-800">{selectedReq.requestedCheckIn}</p>
                    </div>
                  )}
                  {selectedReq.requestedCheckOut && (
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Jam Pulang Diminta</p>
                      <p className="font-semibold text-gray-800">{selectedReq.requestedCheckOut}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-gray-700 font-semibold mb-2 text-sm">Alasan / Keterangan Peserta</p>
                <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-200 text-gray-700 leading-relaxed">
                  {selectedReq.reason}
                </div>
              </div>

              {selectedReq.status === 'Menunggu' ? (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Catatan Keputusan <span className="text-red-500 font-normal text-xs">(Wajib diisi jika menolak)</span>
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent transition resize-none text-sm"
                    rows={3}
                    placeholder="Tambahkan catatan untuk peserta..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  />
                </div>
              ) : (
                selectedReq.adminNotes && (
                  <div>
                    <p className="text-gray-700 font-semibold mb-2 text-sm">Catatan Admin</p>
                    <div className={`p-4 rounded-xl text-sm border leading-relaxed ${selectedReq.status === 'Disetujui' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                      {selectedReq.adminNotes}
                    </div>
                  </div>
                )
              )}

              {selectedReq.status === 'Menunggu' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleProcess('Ditolak')}
                    disabled={isProcessing}
                    className="flex-1 bg-white text-red-600 border-2 border-red-100 py-3 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">
                    <X size={18} /> Tolak
                  </button>
                  <button
                    onClick={() => handleProcess('Disetujui')}
                    disabled={isProcessing}
                    className="flex-1 bg-[#2F80ED] text-white py-3 rounded-xl font-bold hover:bg-blue-600 shadow-sm transition active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">
                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                    {isProcessing ? 'Memproses...' : 'Setujui'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
