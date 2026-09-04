import React, { useState } from 'react';
import { Plus, X, Check, Calendar, Clock, AlertCircle, Camera, Image as ImageIcon, Upload, ExternalLink } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const AktivitasMagangView: React.FC = () => {
  const { activities, addActivity } = useData();
  const { currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('08:00 - 17:00 WIB');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // States untuk modal dokumentasi foto
  const [showDocModal, setShowDocModal] = useState(false);
  const [docPhoto, setDocPhoto] = useState<File | null>(null);
  const [docPhotoPreview, setDocPhotoPreview] = useState<string>('');
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // State untuk modal preview foto (lightbox)
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; date: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date.trim() || !title.trim() || !time.trim()) {
      setErrorMessage('Seluruh field wajib (Tanggal, Judul Aktivitas, dan Waktu) harus diisi.');
      return;
    }

    addActivity({
      activityDate: date,
      title: title,
      description: description.trim() || undefined,
      time: time,
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
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
        time: '08:00 - 17:00 WIB',
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
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
                <th className="pb-3 px-4">Judul & Deskripsi</th>
                <th className="pb-3 px-4 w-36">Foto Dokumentasi</th>
                <th className="pb-3 pl-4 w-44">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada aktivitas yang dicatat. Klik '+ Tambah Aktivitas' di atas.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Hari */}
                    <td className="py-4 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      {new Date(act.activityDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' })}
                    </td>

                    {/* Tanggal */}
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(act.activityDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>

                    {/* Judul & Deskripsi */}
                    <td className="py-4 px-4 text-slate-800 font-medium max-w-md">
                      <p className="font-semibold text-slate-900">{act.title}</p>
                      {act.description && !act.description.startsWith('Waktu: ') && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed whitespace-pre-line">
                          {act.description}
                        </p>
                      )}
                    </td>

                    {/* Kolom Khusus Foto Dokumentasi (Tombol) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {act.attachmentUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto({
                            url: act.attachmentUrl!,
                            title: act.title,
                            date: new Date(act.activityDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-[#2F80ED] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Lihat Foto</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Waktu */}
                    <td className="py-4 pl-4 text-slate-600 font-medium whitespace-nowrap">
                      {act.time || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : '08:00 - 17:00 WIB')}
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
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Menyusun laporan analisis sistem"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              {/* Deskripsi Kegiatan (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deskripsi Kegiatan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan rincian atau catatan tugas yang dikerjakan..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none resize-none"
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
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDocPhoto(null); setDocPhotoPreview(''); }}
                    className="absolute top-2 right-2 rounded-full bg-slate-900/70 p-1.5 text-white hover:bg-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF3FE] text-[#2F80ED]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Klik untuk upload foto</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP (maks. 2MB)</p>
                </div>
              )}
              <input
                id="doc-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Kegiatan *</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Contoh: Mengikuti Rapat Koordinasi Tim"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                <textarea
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="Jelaskan detail kegiatan yang dilakukan..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSaveDoc}
              disabled={isUploading || !docTitle.trim()}
              className="mt-5 w-full rounded-2xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50 transition"
            >
              {isUploading ? 'Mengunggah Foto...' : 'Simpan Dokumentasi'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview Foto Kegiatan (Lightbox) */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedPhoto.title}</h3>
                <p className="text-[11px] text-slate-400">{selectedPhoto.date}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-[#2F80ED] hover:bg-blue-50 transition"
                  title="Buka Tab Baru"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-auto max-h-[65vh] object-contain"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="rounded-xl bg-[#2F80ED] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
