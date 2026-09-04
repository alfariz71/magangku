import React, { useState } from 'react';
import { ClipboardEdit, Clock, AlertCircle, Check, X, FileUp, Calendar, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AttendanceCorrectionRequest } from '../../types';

export const KoreksiAbsenView: React.FC = () => {
  const { currentUser } = useAuth();
  const { correctionRequests, submitCorrectionRequest, refreshCorrectionRequests } = useData();

  const myRequests = correctionRequests.filter(r => r.userId === currentUser?.id);

  const [formData, setFormData] = useState({
    attendanceDate: '',
    correctionType: '',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Ukuran file maksimal 2MB');
        return;
      }
      setEvidenceFile(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.attendanceDate) newErrors.attendanceDate = 'Tanggal wajib diisi';
    if (!formData.correctionType) newErrors.correctionType = 'Jenis koreksi wajib dipilih';
    if (!formData.reason || formData.reason.length < 20) {
      newErrors.reason = 'Alasan wajib diisi, min 20 karakter';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await submitCorrectionRequest({
        attendanceDate: formData.attendanceDate,
        correctionType: formData.correctionType,
        requestedCheckIn: formData.requestedCheckIn || undefined,
        requestedCheckOut: formData.requestedCheckOut || undefined,
        reason: formData.reason,
      });
      if (result.success) {
        setFormData({ attendanceDate: '', correctionType: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });
        setEvidenceFile(null);
        showToast('success', result.message);
      } else {
        showToast('error', result.message);
      }
    } catch {
      showToast('error', 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCorrectionRequests();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: AttendanceCorrectionRequest['status']) => {
    switch (status) {
      case 'Disetujui':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"><Check size={11}/> Disetujui</span>;
      case 'Ditolak':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"><X size={11}/> Ditolak</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><Clock size={11}/> Menunggu</span>;
    }
  };

  const formatDate = (s: string) => s ? new Date(s).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
  const formatDateTime = (s: string) => s ? new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#183B66]">Koreksi Absensi</h1>
        <p className="mt-1 text-sm text-gray-500">Ajukan koreksi jika ada masalah dengan absensi Anda (misal: lupa absen, GPS error).</p>
      </div>

      {toast && (
        <div className={`rounded-xl p-4 flex items-start border ${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {toast.type === 'success'
            ? <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            : <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />}
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-[#183B66] flex items-center">
            <ClipboardEdit className="w-5 h-5 mr-2" />Form Pengajuan
          </h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Absensi *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-gray-400" /></div>
                  <input type="date" name="attendanceDate" value={formData.attendanceDate} onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`block w-full pl-10 pr-3 py-2 text-sm rounded-lg border ${errors.attendanceDate ? 'border-red-300' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'} focus:outline-none focus:ring-1`} />
                </div>
                {errors.attendanceDate && <p className="mt-1 text-xs text-red-600">{errors.attendanceDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jenis Koreksi *</label>
                <select name="correctionType" value={formData.correctionType} onChange={handleChange}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-sm rounded-lg border bg-white ${errors.correctionType ? 'border-red-300' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'} focus:outline-none focus:ring-1`}>
                  <option value="">Pilih jenis koreksi</option>
                  <option value="Lupa Absen Masuk">Lupa Absen Masuk</option>
                  <option value="Lupa Absen Pulang">Lupa Absen Pulang</option>
                  <option value="GPS Gagal">GPS Gagal</option>
                  <option value="QR Bermasalah">QR Bermasalah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                {errors.correctionType && <p className="mt-1 text-xs text-red-600">{errors.correctionType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jam Masuk Diminta <span className="text-gray-400 font-normal">(Opsional)</span></label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock className="h-5 w-5 text-gray-400" /></div>
                  <input type="time" name="requestedCheckIn" value={formData.requestedCheckIn} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED] focus:outline-none focus:ring-1" />
                </div>
                <p className="mt-1 text-xs text-gray-400">Isi jika koreksi terkait absen masuk</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jam Pulang Diminta <span className="text-gray-400 font-normal">(Opsional)</span></label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock className="h-5 w-5 text-gray-400" /></div>
                  <input type="time" name="requestedCheckOut" value={formData.requestedCheckOut} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED] focus:outline-none focus:ring-1" />
                </div>
                <p className="mt-1 text-xs text-gray-400">Isi jika koreksi terkait absen pulang</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alasan Lengkap *</label>
              <textarea name="reason" rows={3} value={formData.reason} onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 text-sm rounded-lg border ${errors.reason ? 'border-red-300' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'} focus:outline-none focus:ring-1`}
                placeholder="Jelaskan alasan secara rinci..." />
              {errors.reason
                ? <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
                : <p className="mt-1 text-xs text-gray-400">{formData.reason.length} karakter{formData.reason.length < 20 ? ` (kurang ${20 - formData.reason.length})` : ' ✓'}</p>
              }
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Bukti <span className="text-gray-400 font-normal">(Opsional, maks. 2MB)</span></label>
              <div className="mt-1 flex items-center gap-3">
                <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <span className="flex items-center"><FileUp className="w-4 h-4 mr-2" />Pilih File</span>
                  <input type="file" className="sr-only" accept="image/*,.pdf" onChange={handleFileChange} />
                </label>
                <span className="text-sm text-gray-500">{evidenceFile ? evidenceFile.name : 'Tidak ada file dipilih'}</span>
                {evidenceFile && <button type="button" onClick={() => setEvidenceFile(null)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isSubmitting}
                className="inline-flex items-center gap-2 py-2.5 px-6 text-sm font-medium rounded-xl text-white bg-[#2F80ED] hover:bg-blue-600 disabled:opacity-50 transition">
                {isSubmitting ? <><RefreshCw className="animate-spin" size={16} />Mengirim...</> : <><ClipboardEdit size={16} />Ajukan Koreksi</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-medium text-[#183B66]">Riwayat Pengajuan</h2>
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2F80ED] transition disabled:opacity-50">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />Refresh
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pengajuan</h3>
            <p className="mt-1 text-sm text-gray-500">Anda belum pernah mengajukan koreksi absensi.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myRequests.map(req => (
              <div key={req.id} className="px-6 py-4">
                <div className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)}>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{formatDate(req.attendanceDate)}</p>
                    <p className="text-xs text-[#2F80ED] font-medium mt-0.5">{req.correctionType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(req.status)}
                    {expandedReqId === req.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expandedReqId === req.id && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
                      {req.requestedCheckIn && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Jam Masuk Diminta</p>
                          <p className="font-medium text-gray-800">{req.requestedCheckIn}</p>
                        </div>
                      )}
                      {req.requestedCheckOut && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Jam Pulang Diminta</p>
                          <p className="font-medium text-gray-800">{req.requestedCheckOut}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Alasan</p>
                        <p className="text-gray-700 leading-relaxed">{req.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Diajukan</p>
                        <p className="text-gray-700">{formatDateTime(req.createdAt)}</p>
                      </div>
                      {req.reviewedAt && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Diproses</p>
                          <p className="text-gray-700">{formatDateTime(req.reviewedAt)}</p>
                        </div>
                      )}
                    </div>
                    {req.adminNotes && (
                      <div className={`p-4 rounded-xl border text-sm ${req.status === 'Disetujui' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        <p className="font-semibold mb-1">Catatan Admin:</p>
                        <p>{req.adminNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
