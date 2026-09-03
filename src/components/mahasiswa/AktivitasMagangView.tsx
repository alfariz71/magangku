import React, { useState } from 'react';
import { Plus, X, Check, Calendar, Clock, AlertCircle, Camera, Image, Upload } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const AktivitasMagangView: React.FC = () => {
  const { activities, addActivity } = useData();
  const { currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00 - 17:00 WIB');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // States untuk modal dokumentasi
  const [showDocModal, setShowDocModal] = useState(false);
  const [docPhoto, setDocPhoto] = useState<File | null>(null);
  const [docPhotoPreview, setDocPhotoPreview] = useState<string>('');
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date.trim() || !title.trim() || !time.trim()) {
      setErrorMessage('Seluruh field (Tanggal, Judul Aktivitas, dan Waktu) wajib diisi.');
      return;
    }

    addActivity({
      activityDate: date,
      title: title,
      time: time
    });
    setIsModalOpen(false);
    setTitle('');
    setErrorMessage(null);
    setSuccessToast(true);

    setTimeout(() => {
      setSuccessToast(false);
    }, 3500);
  };

  const compressImage = (file: File, maxSizeMB = 2): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
            else { width = Math.round((width / height) * maxDim); height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          let quality = 0.9;
          const maxBytes = maxSizeMB * 1024 * 1024;
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (blob && (blob.size <= maxBytes || quality <= 0.1)) {
                resolve(blob!);
              } else {
                quality = Math.max(0.1, quality - 0.1);
                tryCompress();
              }
            }, 'image/jpeg', quality);
          };
          tryCompress();
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocPhoto(file);
    const url = URL.createObjectURL(file);
    setDocPhotoPreview(url);
  };

  const handleSaveDoc = async () => {
    if (!docTitle.trim()) { alert('Judul kegiatan wajib diisi'); return; }
    setIsUploading(true);
    try {
      let photoUrl = '';
      if (docPhoto && currentUser?.id) {
        const compressed = await compressImage(docPhoto);
        const fileName = `doc-${currentUser.id}-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage.from('activity-photos').upload(fileName, compressed, {
          upsert: true, contentType: 'image/jpeg'
        });
        if (!error && data) {
          const { data: urlData } = supabase.storage.from('activity-photos').getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }
      await addActivity({
        title: docTitle,
        description: docDesc,
        activityDate: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }),
        attachmentUrl: photoUrl,
        createdAt: new Date().toISOString()
      });
      setShowDocModal(false);
      setDocPhoto(null);
      setDocPhotoPreview('');
      setDocTitle('');
      setDocDesc('');
    } catch (err) {
      console.error('Save doc error:', err);
      alert('Gagal menyimpan dokumentasi');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Aktivitas Magang</h2>
          <p className="mt-1 text-sm text-slate-500">
            Catat dan dokumentasikan kegiatan operasional harian magang Anda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tambah Aktivitas
          </button>
          <button
            onClick={() => setShowDocModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
          >
            <Camera className="h-4 w-4" />
            Tambah Dokumentasi
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>Aktivitas harian baru berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-4 w-28">Hari</th>
                <th className="pb-3 px-4 w-36">Tanggal</th>
                <th className="pb-3 px-4">Judul Aktivitas</th>
                <th className="pb-3 pl-4 w-44">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Belum ada aktivitas yang dicatat. Klik '+ Tambah Aktivitas' di atas.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pr-4 font-semibold text-slate-900">
                      {new Date(act.activityDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' })}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(act.activityDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-slate-800 font-medium">
                      {act.title}
                      {act.attachmentUrl && (
                        <img
                          src={act.attachmentUrl}
                          alt={act.title}
                          className="w-full h-32 object-cover rounded-xl mt-3 cursor-pointer"
                          onClick={() => window.open(act.attachmentUrl, '_blank')}
                        />
                      )}
                    </td>
                    <td className="py-4 pl-4 text-slate-600">
                      {act.createdAt ? new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal Tambah Aktivitas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-base font-bold text-[#183B66]">Tambah Aktivitas Magang</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-[#EB5757]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Tanggal Kegiatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Kegiatan <span className="text-rose-500">*</span></label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none" required />
              </div>

              {/* Judul Aktivitas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Judul Aktivitas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan ringkasan tugas atau aktivitas yang Anda kerjakan..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              {/* Waktu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Waktu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Contoh: 08:00 - 17:00 WIB"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              {/* Buttons: Batal & Simpan Aktivitas */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2F80ED] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
                >
                  Simpan Aktivitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dokumentasi Kegiatan */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[#183B66]">Tambah Dokumentasi Kegiatan</h3>
              <button onClick={() => setShowDocModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo Upload */}
            <div
              className="mb-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 cursor-pointer hover:border-[#2F80ED] hover:bg-blue-50/30 transition"
              onClick={() => document.getElementById('doc-photo-input')?.click()}
            >
              {docPhotoPreview ? (
                <div className="relative w-full">
                  <img src={docPhotoPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDocPhoto(null); setDocPhotoPreview(''); }}
                    className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">Ketuk untuk ambil / pilih foto</p>
                  <p className="text-xs text-slate-400 mt-0.5">Otomatis dikompresi hingga 2 MB</p>
                </>
              )}
              <input
                id="doc-photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Title */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Judul Kegiatan <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="Contoh: Rapat dengan klien, Presentasi project..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20 transition"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi <span className="text-slate-400">(opsional)</span></label>
              <textarea
                value={docDesc}
                onChange={e => setDocDesc(e.target.value)}
                rows={3}
                placeholder="Ceritakan lebih detail kegiatan ini..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20 transition resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDocModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                disabled={isUploading}
              >
                Batal
              </button>
              <button
                onClick={handleSaveDoc}
                disabled={isUploading}
                className="flex-1 rounded-2xl bg-[#2F80ED] py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60 transition"
              >
                {isUploading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
