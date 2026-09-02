import React, { useState } from 'react';
import { ClipboardEdit, Clock, AlertCircle, Check, X, FileUp, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Assuming this type will be in types.ts
export interface AttendanceCorrectionRequest {
  id: string;
  date: string;
  type: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  fileName?: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  submittedAt: string;
}

export const KoreksiAbsenView: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>(() => {
    const saved = localStorage.getItem('magangku_correction_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({
    date: '',
    type: '',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });

  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = 'Tanggal wajib diisi';
    if (!formData.type) newErrors.type = 'Jenis koreksi wajib dipilih';
    if (!formData.reason || formData.reason.length < 20) {
      newErrors.reason = 'Alasan wajib diisi (minimal 20 karakter)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newRequest: AttendanceCorrectionRequest = {
        id: Math.random().toString(36).substring(2, 9),
        date: formData.date,
        type: formData.type,
        requestedCheckIn: formData.requestedCheckIn,
        requestedCheckOut: formData.requestedCheckOut,
        reason: formData.reason,
        fileName: fileName,
        status: 'Menunggu',
        submittedAt: new Date().toISOString(),
      };

      const updatedRequests = [newRequest, ...requests];
      setRequests(updatedRequests);
      localStorage.setItem('magangku_correction_requests', JSON.stringify(updatedRequests));

      setFormData({
        date: '',
        type: '',
        requestedCheckIn: '',
        requestedCheckOut: '',
        reason: '',
      });
      setFileName('');
      setShowSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-green-100 text-green-800';
      case 'Ditolak':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#183B66]">Koreksi Absensi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ajukan koreksi jika ada masalah dengan absensi Anda (misal: lupa absen, GPS error).
        </p>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">Pengajuan koreksi berhasil dikirim dan sedang menunggu persetujuan.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-[#183B66] flex items-center">
            <ClipboardEdit className="w-5 h-5 mr-2" />
            Form Pengajuan
          </h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Absensi *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`block w-full pl-10 px-3 py-2 sm:text-sm rounded-lg border ${errors.date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                  />
                </div>
                {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Jenis Koreksi *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 sm:text-sm rounded-lg border bg-white ${errors.type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                >
                  <option value="">Pilih jenis koreksi</option>
                  <option value="Lupa Absen Masuk">Lupa Absen Masuk</option>
                  <option value="Lupa Absen Pulang">Lupa Absen Pulang</option>
                  <option value="GPS Gagal">GPS Gagal</option>
                  <option value="QR Bermasalah">QR Bermasalah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Waktu Absen Masuk (Opsional)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    name="requestedCheckIn"
                    value={formData.requestedCheckIn}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 sm:text-sm rounded-lg border border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Isi jika koreksi terkait absen masuk</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Waktu Absen Pulang (Opsional)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    name="requestedCheckOut"
                    value={formData.requestedCheckOut}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 sm:text-sm rounded-lg border border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Isi jika koreksi terkait absen pulang</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alasan Lengkap *</label>
              <textarea
                name="reason"
                rows={3}
                value={formData.reason}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 sm:text-sm rounded-lg border ${errors.reason ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                placeholder="Jelaskan alasan pengajuan koreksi (minimal 20 karakter)..."
              ></textarea>
              {errors.reason ? (
                <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">{formData.reason.length}/20 karakter minimal</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Bukti (Opsional)</label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2F80ED]">
                  <span className="flex items-center">
                    <FileUp className="w-4 h-4 mr-2" />
                    Pilih File
                  </span>
                  <input type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  {fileName || 'Tidak ada file yang dipilih (Maks 2MB)'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-[#2F80ED] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED] disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : 'Ajukan Koreksi'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-medium text-[#183B66]">Riwayat Pengajuan</h2>
        </div>
        
        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pengajuan</h3>
            <p className="mt-1 text-sm text-gray-500">
              Anda belum pernah mengajukan koreksi absensi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Koreksi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diajukan Pada</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(req.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(req.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
