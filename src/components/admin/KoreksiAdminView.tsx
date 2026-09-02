import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Filter, Check, X, Eye, AlertCircle, Clock } from 'lucide-react';
import { AttendanceCorrectionRequest, User, AuditLog } from '../../types';

export default function KoreksiAdminView() {
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>(() => {
    const saved = localStorage.getItem('magangku_correction_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [students, setStudents] = useState<User[]>(() => {
    const users = localStorage.getItem('magangku_users');
    return users ? JSON.parse(users) : [];
  });

  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  
  const [selectedReq, setSelectedReq] = useState<AttendanceCorrectionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Stats
  const total = requests.length;
  const waiting = requests.filter(r => r.status === 'Menunggu').length;
  const approved = requests.filter(r => r.status === 'Disetujui').length;
  const rejected = requests.filter(r => r.status === 'Ditolak').length;

  const filteredRequests = requests.filter(r => {
    if (filter !== 'Semua' && r.status !== filter) return false;
    const student = students.find(s => s.id === r.userId);
    if (search && !student?.name.toLowerCase().includes(search.toLowerCase()) && !r.userId.includes(search)) return false;
    return true;
  });

  const handleProcess = (status: 'Disetujui' | 'Ditolak') => {
    if (!selectedReq) return;
    if (status === 'Ditolak' && !adminNotes.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }

    // Update Request
    const updatedRequests = requests.map(r => 
      r.id === selectedReq.id ? { ...r, status, adminNotes, resolvedAt: new Date().toISOString() } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem('magangku_correction_requests', JSON.stringify(updatedRequests));

    if (status === 'Disetujui') {
      // Logic for modifying attendance
      // const attendances = JSON.parse(localStorage.getItem('magangku_attendances') || '[]');
      // ... modify attendances based on request ...
      // localStorage.setItem('magangku_attendances', JSON.stringify(attendances));
    }

    // Audit log
    const auditLogs = JSON.parse(localStorage.getItem('magangku_audit_logs') || '[]');
    auditLogs.push({
      id: `log-${Date.now()}`,
      action: `Koreksi Absensi ${status}`,
      details: `Koreksi untuk user ${selectedReq.userId} pada tanggal ${selectedReq.attendanceDate} berstatus ${status}`,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('magangku_audit_logs', JSON.stringify(auditLogs));

    alert(`Permintaan koreksi telah ${status}`);
    setSelectedReq(null);
    setAdminNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={12}/> Menunggu</span>;
      case 'Disetujui': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Check size={12}/> Disetujui</span>;
      case 'Ditolak': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><X size={12}/> Ditolak</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#183B66]">Koreksi Absensi</h1>
          <p className="text-gray-500">Proses permintaan koreksi absensi peserta</p>
        </div>
      </div>

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
            <input 
              type="text" 
              placeholder="Cari nama atau NIM peserta..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400 hidden sm:block" />
            <select 
              className="w-full sm:w-auto border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition bg-white"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
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
                {filteredRequests.map(req => {
                  const student = students.find(s => s.id === req.userId);
                  return (
                    <tr key={req.id} className="hover:bg-blue-50/30 transition">
                      <td className="p-4">
                        <p className="font-bold text-[#183B66]">{student?.name || 'Peserta Tidak Ditemukan'}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{student?.nim || req.userId}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-800">{new Date(req.attendanceDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                        <p className="text-xs font-semibold text-[#2F80ED] mt-1">{req.correctionType}</p>
                      </td>
                      <td className="p-4 max-w-xs" title={req.reason}>
                        <p className="text-sm text-gray-600 truncate">{req.reason}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID')}</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4">
                        {req.status === 'Menunggu' ? (
                          <button 
                            onClick={() => setSelectedReq(req)}
                            className="flex items-center gap-1.5 bg-[#2F80ED] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition shadow-sm active:scale-95"
                          >
                            <Eye size={16} /> Proses
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedReq(req)}
                            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition active:scale-95"
                          >
                            <Eye size={16} /> Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modal Proses / Detail */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-[#183B66] text-lg flex items-center gap-2">
                <ClipboardCheck size={20} className="text-[#2F80ED]" />
                Detail Koreksi Absensi
              </h3>
              <button onClick={() => { setSelectedReq(null); setAdminNotes(''); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Peserta</p>
                    <p className="font-bold text-[#183B66]">{students.find(s => s.id === selectedReq.userId)?.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedReq.userId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Tanggal Absensi</p>
                    <p className="font-bold text-gray-800">{new Date(selectedReq.attendanceDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Jenis Koreksi</p>
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#2F80ED] text-xs font-bold rounded-lg border border-blue-100">
                      {selectedReq.correctionType}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Status Saat Ini</p>
                    <div>{getStatusBadge(selectedReq.status)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-gray-700 font-semibold mb-2 text-sm">Alasan / Keterangan Peserta</p>
                <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-200 text-gray-700 leading-relaxed min-h-[80px]">
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
                    placeholder="Tambahkan catatan untuk peserta mengenai keputusan ini..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  />
                </div>
              ) : (
                selectedReq.adminNotes && (
                  <div>
                    <p className="text-gray-700 font-semibold mb-2 text-sm">Catatan Admin</p>
                    <div className="bg-blue-50 p-4 rounded-xl text-sm border border-blue-100 text-[#183B66] leading-relaxed">
                      {selectedReq.adminNotes}
                    </div>
                  </div>
                )
              )}

              {selectedReq.status === 'Menunggu' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button 
                    onClick={() => handleProcess('Ditolak')}
                    className="flex-1 bg-white text-red-600 border-2 border-red-100 py-3 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition active:scale-95 flex justify-center items-center gap-2"
                  >
                    <X size={18} /> Tolak Permintaan
                  </button>
                  <button 
                    onClick={() => handleProcess('Disetujui')}
                    className="flex-1 bg-[#2F80ED] text-white py-3 rounded-xl font-bold hover:bg-blue-600 shadow-sm transition active:scale-95 flex justify-center items-center gap-2"
                  >
                    <Check size={18} /> Setujui Permintaan
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
