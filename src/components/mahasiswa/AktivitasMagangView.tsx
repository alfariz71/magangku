import React, { useState, useRef } from 'react';
import { Plus, X, Check, Calendar, Clock, AlertCircle, Camera, Image as ImageIcon, Video, Upload, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary, isVideoUrl } from '../../lib/cloudinary';
import { ActivityRecord } from '../../types';

export const AktivitasMagangView: React.FC = () => {
  const { activities, addActivity, updateActivity, deleteActivity, todayAttendance, systemSettings } = useData();
  const { currentUser } = useAuth();

  const isCsStudent = Boolean(
    currentUser?.concentration &&
    (currentUser.concentration.toLowerCase().includes('cs') ||
     currentUser.concentration.toLowerCase().includes('customer service'))
  );

  const getDefaultShiftTime = () => {
    if (todayAttendance?.notes) {
      if (todayAttendance.notes.includes('Shift 2')) {
        return `${systemSettings?.csShift2StartTime || '15:00'} - ${systemSettings?.csShift2EndTime || '21:00'} WIB`;
      }
      if (todayAttendance.notes.includes('Shift 1')) {
        return `${systemSettings?.csShift1StartTime || '08:00'} - ${systemSettings?.csShift1EndTime || '15:00'} WIB`;
      }
      if (todayAttendance.notes.includes('Reguler')) {
        return `${systemSettings?.workStartTime || '08:00'} - ${systemSettings?.workEndTime || '17:00'} WIB`;
      }
    }
    if (isCsStudent) {
      try {
        const jktH = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }), 10);
        if (jktH >= 13) {
          return `${systemSettings?.csShift2StartTime || '15:00'} - ${systemSettings?.csShift2EndTime || '21:00'} WIB`;
        }
        return `${systemSettings?.csShift1StartTime || '08:00'} - ${systemSettings?.csShift1EndTime || '15:00'} WIB`;
      } catch {
        return `${systemSettings?.csShift1StartTime || '08:00'} - ${systemSettings?.csShift1EndTime || '15:00'} WIB`;
      }
    }
    return `${systemSettings?.workStartTime || '08:00'} - ${systemSettings?.workEndTime || '17:00'} WIB`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(getDefaultShiftTime);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // States untuk modal dokumentasi foto & video
  const [showDocModal, setShowDocModal] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const [docDate, setDocDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  const [docMedia, setDocMedia] = useState<File | null>(null);
  const [docMediaPreview, setDocMediaPreview] = useState<string>('');
  const [docMediaType, setDocMediaType] = useState<'image' | 'video'>('image');
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // State untuk modal preview foto & video (lightbox)
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; date: string } | null>(null);

  // States untuk Edit Aktivitas
  const [editModalOpen, setEditModalOpen] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAttachmentUrl, setEditAttachmentUrl] = useState<string | undefined>('');
  const [editNewMedia, setEditNewMedia] = useState<File | null>(null);
  const [editNewMediaPreview, setEditNewMediaPreview] = useState<string>('');
  const [editNewMediaType, setEditNewMediaType] = useState<'image' | 'video'>('image');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const handleOpenEdit = (act: ActivityRecord) => {
    setEditingActivity(act);
    setEditTitle(act.title);
    setEditDate(act.activityDate);
    setEditTime(act.time || '08:00 - 17:00 WIB');
    setEditDesc(act.description && !act.description.startsWith('Waktu: ') ? act.description : '');
    setEditAttachmentUrl(act.attachmentUrl || '');
    setEditNewMedia(null);
    setEditNewMediaPreview('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editTitle.trim()) return;
    setIsSubmittingEdit(true);
    try {
      let finalUrl = editAttachmentUrl;
      if (editNewMedia) {
        if (editNewMediaType === 'image') {
          const compressed = await compressImage(editNewMedia);
          finalUrl = await uploadToCloudinary(compressed, 'magangku/aktivitas');
        } else {
          finalUrl = await uploadToCloudinary(editNewMedia, 'magangku/aktivitas');
        }
      }

      await updateActivity(editingActivity.id, {
        title: editTitle,
        activityDate: editDate,
        time: editTime,
        description: editDesc,
        attachmentUrl: finalUrl || undefined,
      });

      setEditModalOpen(false);
      setEditingActivity(null);
    } catch (err) {
      console.error('Error updating activity:', err);
      alert('Gagal memperbarui aktivitas: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus aktivitas kegiatan ini?')) return;
    try {
      await deleteActivity(id);
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Gagal menghapus aktivitas: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    }
  };

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

  const getDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hari Ini';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    if (dateStr === yesterdayStr) return 'Kemarin';
    return null;
  };

  const formatDateHeader = (dateStr: string) => {
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = dayNames[d.getDay()];
      const dateNum = d.getDate();
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day}, ${dateNum} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Group activities by date
  const groupedByDate: { date: string; dateActivities: typeof activities }[] = [];
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = a.activityDate || '';
    const dateB = b.activityDate || '';
    return dateB.localeCompare(dateA);
  });

  sortedActivities.forEach(act => {
    const actDate = act.activityDate || todayStr;
    const existing = groupedByDate.find(g => g.date === actDate);
    if (existing) {
      existing.dateActivities.push(act);
    } else {
      groupedByDate.push({ date: actDate, dateActivities: [act] });
    }
  });

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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      alert('Format file tidak didukung. Harap pilih foto (JPG, PNG, WebP) atau video (MP4, WebM)!');
      e.target.value = '';
      return;
    }

    if (isVideo) {
      if (file.size > 30 * 1024 * 1024) {
        alert('Ukuran video melebihi batas maksimal 30 MB!');
        e.target.value = '';
        return;
      }
      setDocMediaType('video');
    } else {
      setDocMediaType('image');
    }

    setDocMedia(file);
    const url = URL.createObjectURL(file);
    setDocMediaPreview(url);
    e.target.value = '';
  };

  const handleEditMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      alert('Format file tidak didukung. Harap pilih foto (JPG, PNG, WebP) atau video (MP4, WebM)!');
      e.target.value = '';
      return;
    }

    if (isVideo) {
      if (file.size > 30 * 1024 * 1024) {
        alert('Ukuran video melebihi batas maksimal 30 MB!');
        e.target.value = '';
        return;
      }
      setEditNewMediaType('video');
    } else {
      setEditNewMediaType('image');
    }

    setEditNewMedia(file);
    setEditNewMediaPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSaveDoc = async () => {
    if (!docTitle.trim()) { alert('Judul kegiatan wajib diisi'); return; }
    setIsUploading(true);
    try {
      let mediaUrl = '';
      if (docMedia && currentUser?.id) {
        if (docMediaType === 'image') {
          const compressed = await compressImage(docMedia);
          mediaUrl = await uploadToCloudinary(compressed, 'magangku/aktivitas');
        } else {
          // Video diunggah langsung ke Cloudinary tanpa kompresi canvas
          mediaUrl = await uploadToCloudinary(docMedia, 'magangku/aktivitas');
        }
      }
      await addActivity({
        title: docTitle,
        description: docDesc,
        activityDate: docDate || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }),
        attachmentUrl: mediaUrl,
        time: getDefaultShiftTime(),
        createdAt: new Date().toISOString()
      });
      setShowDocModal(false);
      setDocMedia(null);
      setDocMediaPreview('');
      setDocTitle('');
      setDocDesc('');
    } catch (err) {
      console.error('Save doc error:', err);
      alert('Gagal menyimpan dokumentasi: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
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

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setTime(getDefaultShiftTime());
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 transition shadow-md shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Aktivitas</span>
          </button>
          <button
            onClick={() => setShowDocModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
          >
            <Camera className="h-4 w-4" />
            <span>Tambah Dokumentasi</span>
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

      {/* Main Table Card (Desktop) */}
      <div className="hidden md:block rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="py-3 px-4 w-44">Waktu</th>
                <th className="py-3 px-4">Judul & Deskripsi Kegiatan</th>
                <th className="py-3 px-4 w-36">Dokumentasi</th>
                <th className="py-3 pl-4 pr-3 w-20 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 font-medium">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p>Belum ada aktivitas yang dicatat. Klik '+ Tambah Aktivitas' di atas.</p>
                  </td>
                </tr>
              ) : (
                groupedByDate.map(({ date, dateActivities }) => {
                  const label = getDateLabel(date);
                  const isToday = date === todayStr;

                  return (
                    <React.Fragment key={date}>
                      {/* Date Separator Row (Pembatas Hari) */}
                      <tr>
                        <td colSpan={4} className="px-0 py-0">
                          <div className={`flex items-center gap-3 px-4 py-2.5 ${
                            isToday
                              ? 'bg-blue-50/80 border-y border-blue-100'
                              : 'bg-slate-50/70 border-y border-slate-100'
                          }`}>
                            <div className={`flex items-center gap-2 text-xs font-bold ${
                              isToday ? 'text-[#2F80ED]' : 'text-slate-600'
                            }`}>
                              <Calendar className="h-3.5 w-3.5 text-[#2F80ED]" />
                              <span>{formatDateHeader(date)}</span>
                            </div>
                            {label && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isToday
                                  ? 'bg-[#2F80ED] text-white'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-100'
                              }`}>
                                {label}
                              </span>
                            )}
                            <div className="flex-1 h-px bg-current opacity-10" />
                            <span className={`text-[10px] font-semibold ${
                              isToday ? 'text-blue-500' : 'text-slate-400'
                            }`}>
                              {dateActivities.length} aktivitas
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Activities for this Date */}
                      {dateActivities.map((act, idx) => (
                        <tr
                          key={act.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            idx < dateActivities.length - 1 ? 'border-b border-slate-100/60' : ''
                          }`}
                        >
                          {/* Waktu Pelaksanaan */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{act.time || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : '08:00 - 17:00 WIB')}</span>
                            </div>
                          </td>

                          {/* Judul & Deskripsi */}
                          <td className="py-3.5 px-4 text-slate-800 font-medium max-w-md">
                            <p className="font-semibold text-slate-900">{act.title}</p>
                            {act.description && !act.description.startsWith('Waktu: ') && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed whitespace-pre-line">
                                {act.description}
                              </p>
                            )}
                          </td>

                          {/* Dokumentasi (Foto / Video) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {act.attachmentUrl ? (
                              isVideoUrl(act.attachmentUrl) ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhoto({
                                    url: act.attachmentUrl!,
                                    title: act.title,
                                    date: formatDateHeader(act.activityDate || date)
                                  })}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-2.5 py-1 text-[11px] font-semibold text-purple-600 hover:bg-purple-100 transition shadow-2xs cursor-pointer"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  <span>Lihat Video</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhoto({
                                    url: act.attachmentUrl!,
                                    title: act.title,
                                    date: formatDateHeader(act.activityDate || date)
                                  })}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-[#2F80ED] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                                >
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  <span>Lihat Foto</span>
                                </button>
                              )
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Aksi (Edit & Hapus) */}
                          <td className="py-3.5 pl-4 pr-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(act)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#2F80ED] hover:border-blue-200 hover:bg-blue-50 transition shadow-2xs cursor-pointer"
                                title="Edit Aktivitas"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(act.id)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition shadow-2xs cursor-pointer"
                                title="Hapus Aktivitas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* Mobile Unified Day Cards */}
      <div className="block md:hidden space-y-4">
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-400 shadow-sm">
            <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30 text-[#2F80ED]" />
            <p className="text-xs font-medium">Belum ada aktivitas yang dicatat.</p>
            <p className="text-[11px] text-slate-400 mt-1">Klik '+ Tambah Aktivitas' di atas.</p>
          </div>
        ) : (
          groupedByDate.map(({ date, dateActivities }) => {
            const label = getDateLabel(date);
            const isToday = date === todayStr;

            return (
              <div
                key={date}
                className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${
                  isToday
                    ? 'border-blue-200 bg-white shadow-blue-500/5 ring-1 ring-blue-400/20'
                    : 'border-slate-200/80 bg-white'
                }`}
              >
                {/* Integrated Date Header ("Atap" Kartu) */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${
                    isToday
                      ? 'bg-gradient-to-r from-blue-600 to-[#2F80ED] text-white border-blue-600'
                      : 'bg-slate-50/90 text-slate-700 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Calendar className={`h-4 w-4 ${isToday ? 'text-blue-100' : 'text-[#2F80ED]'}`} />
                    <span className="tracking-tight">{formatDateHeader(date)}</span>
                    {label && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isToday
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-100'
                        }`}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isToday ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {dateActivities.length} aktivitas
                  </span>
                </div>

                {/* List of Activities inside this Day (divided by clean line, not boxes!) */}
                <div className="divide-y divide-slate-100">
                  {dateActivities.map((act) => (
                    <div key={act.id} className="p-4 space-y-2.5 hover:bg-slate-50/40 transition-colors">
                      {/* Top: Waktu & Aksi (Edit/Hapus) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/60 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          <Clock className="h-3 w-3 text-[#2F80ED]" />
                          <span>
                            {act.time || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : '08:00 - 17:00 WIB')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-[#2F80ED] hover:border-blue-200 hover:bg-blue-50 text-[11px] font-medium transition cursor-pointer"
                            title="Edit Aktivitas"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(act.id)}
                            className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                            title="Hapus Aktivitas"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {act.title}
                        </h4>
                        {act.description && !act.description.startsWith('Waktu: ') && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                            {act.description}
                          </p>
                        )}
                      </div>

                      {/* Media Attachment Button */}
                      {act.attachmentUrl && (
                        <div className="pt-1">
                          {isVideoUrl(act.attachmentUrl) ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto({
                                url: act.attachmentUrl!,
                                title: act.title,
                                date: formatDateHeader(act.activityDate || date)
                              })}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 py-2 px-3 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition shadow-2xs cursor-pointer"
                            >
                              <Video className="h-4 w-4 text-purple-600" />
                              <span>Lihat Video Kegiatan</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto({
                                url: act.attachmentUrl!,
                                title: act.title,
                                date: formatDateHeader(act.activityDate || date)
                              })}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 py-2 px-3 text-xs font-semibold text-[#2F80ED] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                            >
                              <ImageIcon className="h-4 w-4 text-[#2F80ED]" />
                              <span>Lihat Foto Kegiatan</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
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

            {/* Photo / Video Upload */}
            <div
              className="mb-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 cursor-pointer hover:border-[#2F80ED] hover:bg-blue-50/30 transition"
              onClick={() => {
                if (!docMediaPreview) {
                  docFileInputRef.current?.click();
                }
              }}
            >
              {docMediaPreview ? (
                <div className="relative w-full">
                  {docMediaType === 'video' ? (
                    <video
                      src={docMediaPreview}
                      controls
                      className="w-full max-h-48 rounded-xl object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={docMediaPreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-xl"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDocMedia(null); setDocMediaPreview(''); }}
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
                  <p className="text-xs font-semibold text-slate-700">Klik untuk upload foto atau video</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Foto (JPG, PNG, WebP) atau Video (MP4, WebM maks. 30MB)</p>
                </div>
              )}
              <input
                ref={docFileInputRef}
                type="file"
                accept="*/*"
                className="hidden"
                onChange={handleMediaSelect}
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kegiatan *</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

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
              {isUploading ? 'Mengunggah Media...' : 'Simpan Dokumentasi'}
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

            <div className="mt-4 overflow-hidden rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center max-h-[70vh]">
              {isVideoUrl(selectedPhoto.url) ? (
                <video
                  src={selectedPhoto.url}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
                />
              ) : (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full h-auto max-h-[65vh] object-contain"
                />
              )}
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

      {/* Modal Edit Aktivitas */}
      {editModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-base font-bold text-[#183B66]">Edit Aktivitas Magang</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="08:00 - 17:00 WIB"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  />
                </div>
              </div>

              {/* Judul Kegiatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Kegiatan *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Judul kegiatan magang..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Jelaskan detail kegiatan yang dilakukan..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                />
              </div>

              {/* Lampiran Media (Foto / Video) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lampiran Media (Foto / Video)</label>

                {/* Kalau ada media baru yang dipilih */}
                {editNewMediaPreview ? (
                  <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                    {editNewMediaType === 'video' ? (
                      <video src={editNewMediaPreview} controls className="w-full max-h-44 rounded-lg object-contain bg-black" />
                    ) : (
                      <img src={editNewMediaPreview} alt="Preview baru" className="w-full max-h-44 object-contain rounded-lg" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setEditNewMedia(null); setEditNewMediaPreview(''); }}
                      className="absolute top-3 right-3 rounded-full bg-slate-900/70 p-1.5 text-white hover:bg-slate-900"
                      title="Batal ganti file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : editAttachmentUrl ? (
                  /* Kalau ada media lama yang tersimpan */
                  <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                    {isVideoUrl(editAttachmentUrl) ? (
                      <video src={editAttachmentUrl} controls className="w-full max-h-44 rounded-lg object-contain bg-black" />
                    ) : (
                      <img src={editAttachmentUrl} alt="Media lampiran" className="w-full max-h-44 object-contain rounded-lg" />
                    )}
                    <div className="mt-2.5 flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#2F80ED] hover:underline cursor-pointer"
                      >
                        Ganti Media
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditAttachmentUrl('')}
                        className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                      >
                        Hapus Lampiran
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Belum ada media sama sekali */
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 cursor-pointer hover:border-[#2F80ED] hover:bg-blue-50/30 transition"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5 text-[#2F80ED] mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Unggah foto atau video baru</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Foto (JPG, PNG, WebP) atau Video (MP4, WebM maks. 30MB)</p>
                  </div>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={handleEditMediaSelect}
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || !editTitle.trim()}
                  className="rounded-xl bg-[#2F80ED] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
