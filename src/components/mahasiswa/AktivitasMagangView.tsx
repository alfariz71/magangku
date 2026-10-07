import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, Calendar, Clock, AlertCircle, Camera, Image as ImageIcon, Video, Upload, ExternalLink, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary, isVideoUrl, parseAttachmentUrls, formatAttachmentUrls } from '../../lib/cloudinary';
import { ActivityRecord } from '../../types';

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

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

  // States untuk modal dokumentasi foto & video (Multi-file)
  const [showDocModal, setShowDocModal] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const [docDate, setDocDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  const [docMediaList, setDocMediaList] = useState<MediaItem[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // State untuk modal preview foto & video (lightbox slider)
  const [selectedPhoto, setSelectedPhoto] = useState<{
    urls: string[];
    currentIndex: number;
    title: string;
    date: string;
  } | null>(null);

  // Keyboard navigation untuk Lightbox Slider
  useEffect(() => {
    if (!selectedPhoto || selectedPhoto.urls.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedPhoto(prev => prev ? {
          ...prev,
          currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length
        } : null);
      } else if (e.key === 'ArrowRight') {
        setSelectedPhoto(prev => prev ? {
          ...prev,
          currentIndex: (prev.currentIndex + 1) % prev.urls.length
        } : null);
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  // States untuk Edit Aktivitas (Multi-file)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editExistingUrls, setEditExistingUrls] = useState<string[]>([]);
  const [editNewMediaList, setEditNewMediaList] = useState<MediaItem[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editUploadProgressText, setEditUploadProgressText] = useState('');

  const handleOpenEdit = (act: ActivityRecord) => {
    setEditingActivity(act);
    setEditTitle(act.title);
    setEditDate(act.activityDate);
    setEditTime(act.time || '08:00 - 17:00 WIB');
    setEditDesc(act.description && !act.description.startsWith('Waktu: ') ? act.description : '');
    setEditExistingUrls(parseAttachmentUrls(act.attachmentUrl));
    setEditNewMediaList([]);
    setEditUploadProgressText('');
    setEditModalOpen(true);
  };

  const handleRemoveExistingEditUrl = (index: number) => {
    setEditExistingUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewEditMedia = (index: number) => {
    setEditNewMediaList(prev => {
      const target = prev[index];
      if (target?.previewUrl) {
        try { URL.revokeObjectURL(target.previewUrl); } catch (_) {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editTitle.trim()) return;
    setIsSubmittingEdit(true);
    try {
      const newUploadedUrls: string[] = [];
      if (editNewMediaList.length > 0) {
        for (let i = 0; i < editNewMediaList.length; i++) {
          const item = editNewMediaList[i];
          setEditUploadProgressText(`Mengunggah foto baru (${i + 1}/${editNewMediaList.length})...`);
          if (item.type === 'image') {
            const compressed = await compressImage(item.file);
            const url = await uploadToCloudinary(compressed, 'magangku/aktivitas');
            newUploadedUrls.push(url);
          } else {
            const url = await uploadToCloudinary(item.file, 'magangku/aktivitas');
            newUploadedUrls.push(url);
          }
        }
      }

      const finalUrls = [...editExistingUrls, ...newUploadedUrls];

      await updateActivity(editingActivity.id, {
        title: editTitle,
        activityDate: editDate,
        time: editTime,
        description: editDesc,
        attachmentUrl: formatAttachmentUrls(finalUrls),
      });

      editNewMediaList.forEach(m => { try { URL.revokeObjectURL(m.previewUrl); } catch (_) {} });
      setEditNewMediaList([]);
      setEditUploadProgressText('');
      setEditModalOpen(false);
      setEditingActivity(null);
    } catch (err) {
      console.error('Error updating activity:', err);
      alert('Gagal memperbarui aktivitas: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    } finally {
      setIsSubmittingEdit(false);
      setEditUploadProgressText('');
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validNewItems: MediaItem[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(file.name);

      if (!isVideo && !isImage) {
        alert(`Format file "${file.name}" tidak didukung. Harap pilih foto (JPG, PNG, WebP) atau video (MP4, WebM)!`);
        continue;
      }

      if (isVideo && file.size > 30 * 1024 * 1024) {
        alert(`Ukuran video "${file.name}" melebihi batas maksimal 30 MB!`);
        continue;
      }

      validNewItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
      });
    }

    setDocMediaList(prev => [...prev, ...validNewItems]);
    e.target.value = '';
  };

  const handleRemoveDocMedia = (index: number) => {
    setDocMediaList(prev => {
      const target = prev[index];
      if (target?.previewUrl) {
        try { URL.revokeObjectURL(target.previewUrl); } catch (_) {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleEditMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validNewItems: MediaItem[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(file.name);

      if (!isVideo && !isImage) {
        alert(`Format file "${file.name}" tidak didukung. Harap pilih foto (JPG, PNG, WebP) atau video (MP4, WebM)!`);
        continue;
      }

      if (isVideo && file.size > 30 * 1024 * 1024) {
        alert(`Ukuran video "${file.name}" melebihi batas maksimal 30 MB!`);
        continue;
      }

      validNewItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
      });
    }

    setEditNewMediaList(prev => [...prev, ...validNewItems]);
    e.target.value = '';
  };

  const handleSaveDoc = async () => {
    if (!docTitle.trim()) { alert('Judul kegiatan wajib diisi'); return; }
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      if (docMediaList.length > 0 && currentUser?.id) {
        for (let i = 0; i < docMediaList.length; i++) {
          const item = docMediaList[i];
          setUploadProgressText(`Mengunggah media (${i + 1}/${docMediaList.length})...`);
          if (item.type === 'image') {
            const compressed = await compressImage(item.file);
            const url = await uploadToCloudinary(compressed, 'magangku/aktivitas');
            uploadedUrls.push(url);
          } else {
            // Video diunggah langsung ke Cloudinary tanpa kompresi canvas
            const url = await uploadToCloudinary(item.file, 'magangku/aktivitas');
            uploadedUrls.push(url);
          }
        }
      }
      await addActivity({
        title: docTitle,
        description: docDesc,
        activityDate: docDate || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }),
        attachmentUrl: formatAttachmentUrls(uploadedUrls),
        time: getDefaultShiftTime(),
        createdAt: new Date().toISOString()
      });
      setShowDocModal(false);
      docMediaList.forEach(m => { try { URL.revokeObjectURL(m.previewUrl); } catch (_) {} });
      setDocMediaList([]);
      setDocTitle('');
      setDocDesc('');
      setUploadProgressText('');
    } catch (err) {
      console.error('Save doc error:', err);
      alert('Gagal menyimpan dokumentasi: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
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
                            {(() => {
                              const urls = parseAttachmentUrls(act.attachmentUrl);
                              if (urls.length === 0) return <span className="text-slate-300 text-xs">—</span>;

                              const hasMultiple = urls.length > 1;
                              const isVideo = !hasMultiple && isVideoUrl(urls[0]);

                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhoto({
                                    urls,
                                    currentIndex: 0,
                                    title: act.title,
                                    date: formatDateHeader(act.activityDate || date)
                                  })}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition shadow-2xs cursor-pointer ${
                                    isVideo
                                      ? 'border-purple-200 bg-purple-50/80 text-purple-600 hover:bg-purple-100'
                                      : 'border-blue-200 bg-blue-50/80 text-[#2F80ED] hover:bg-blue-100'
                                  }`}
                                >
                                  {isVideo ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                                  <span>
                                    {isVideo
                                      ? 'Lihat Video'
                                      : hasMultiple
                                      ? `Lihat Foto (${urls.length})`
                                      : 'Lihat Foto'}
                                  </span>
                                </button>
                              );
                            })()}
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
                      {(() => {
                        const urls = parseAttachmentUrls(act.attachmentUrl);
                        if (urls.length === 0) return null;

                        const hasMultiple = urls.length > 1;
                        const isVideo = !hasMultiple && isVideoUrl(urls[0]);

                        return (
                          <div className="pt-1">
                            {isVideo ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto({
                                  urls,
                                  currentIndex: 0,
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
                                  urls,
                                  currentIndex: 0,
                                  title: act.title,
                                  date: formatDateHeader(act.activityDate || date)
                                })}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 py-2 px-3 text-xs font-semibold text-[#2F80ED] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                              >
                                <ImageIcon className="h-4 w-4 text-[#2F80ED]" />
                                <span>{hasMultiple ? `Lihat Foto Kegiatan (${urls.length} Foto)` : 'Lihat Foto Kegiatan'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
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

      {/* Modal Dokumentasi Kegiatan (Multi-file) */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#183B66]">Tambah Dokumentasi Kegiatan</h3>
                <p className="text-[11px] text-slate-400">Unggah bukti foto kegiatan harian Anda</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isUploading) return;
                  setShowDocModal(false);
                  docMediaList.forEach(m => { try { URL.revokeObjectURL(m.previewUrl); } catch (_) {} });
                  setDocMediaList([]);
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photo / Video Upload Area */}
            <div className="mb-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Lampiran Foto / Video {docMediaList.length > 0 && <span className="text-[#2F80ED] font-bold">({docMediaList.length} dipilih)</span>}
              </label>

              {docMediaList.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  {/* Grid Thumbnails */}
                  <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {docMediaList.map((media, idx) => (
                      <div key={media.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black aspect-square flex items-center justify-center">
                        {media.type === 'video' ? (
                          <video src={media.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={media.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        {/* Badge Index */}
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        {/* Tombol Hapus Thumbnail */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveDocMedia(idx); }}
                          className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-md hover:bg-red-700 transition cursor-pointer"
                          title="Hapus foto ini"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Tombol Tambah Foto Tambahan */}
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-slate-300 hover:border-[#2F80ED] bg-white hover:bg-blue-50/40 aspect-square flex flex-col items-center justify-center text-slate-500 hover:text-[#2F80ED] transition cursor-pointer"
                    >
                      <Plus className="h-5 w-5 mb-0.5" />
                      <span className="text-[10px] font-bold">+ Tambah</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Total {docMediaList.length} berkas dipilih</span>
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="text-xs font-semibold text-[#2F80ED] hover:underline cursor-pointer"
                    >
                      + Tambah berkas lagi
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 cursor-pointer hover:border-[#2F80ED] hover:bg-blue-50/30 transition text-center"
                  onClick={() => docFileInputRef.current?.click()}
                >
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF3FE] text-[#2F80ED]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Klik untuk upload foto kegiatan</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Format JPG, PNG, WebP, atau Video</p>
                </div>
              )}

              <input
                ref={docFileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
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
              className="mt-5 w-full rounded-2xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50 transition cursor-pointer"
            >
              {isUploading ? (uploadProgressText || 'Mengunggah Media...') : 'Simpan Dokumentasi'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview Foto Kegiatan (Lightbox dengan Tombol Slide) */}
      {selectedPhoto && selectedPhoto.urls.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{selectedPhoto.title}</h3>
                  {selectedPhoto.urls.length > 1 && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#2F80ED] shrink-0">
                      {selectedPhoto.currentIndex + 1} / {selectedPhoto.urls.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedPhoto.date}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={selectedPhoto.urls[selectedPhoto.currentIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-[#2F80ED] hover:bg-blue-50 transition"
                  title="Buka File di Tab Baru"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Media Container dengan Tombol Slide */}
            <div className="relative mt-4 overflow-hidden rounded-xl bg-slate-950 border border-slate-200 flex items-center justify-center min-h-[220px] max-h-[65vh]">
              {isVideoUrl(selectedPhoto.urls[selectedPhoto.currentIndex]) ? (
                <video
                  key={selectedPhoto.urls[selectedPhoto.currentIndex]}
                  src={selectedPhoto.urls[selectedPhoto.currentIndex]}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[62vh] object-contain rounded-lg"
                />
              ) : (
                <img
                  key={selectedPhoto.urls[selectedPhoto.currentIndex]}
                  src={selectedPhoto.urls[selectedPhoto.currentIndex]}
                  alt={`${selectedPhoto.title} - ${selectedPhoto.currentIndex + 1}`}
                  className="w-full h-auto max-h-[62vh] object-contain"
                />
              )}

              {/* Tombol Slide Kiri & Kanan (Muncul jika ada lebih dari 1 foto) */}
              {selectedPhoto.urls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(prev => prev ? {
                        ...prev,
                        currentIndex: (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length
                      } : null);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white shadow-lg backdrop-blur-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                    title="Foto Sebelumnya"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(prev => prev ? {
                        ...prev,
                        currentIndex: (prev.currentIndex + 1) % prev.urls.length
                      } : null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white shadow-lg backdrop-blur-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                    title="Foto Berikutnya"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail dots / navigation slider */}
            {selectedPhoto.urls.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto py-1">
                {selectedPhoto.urls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhoto(prev => prev ? { ...prev, currentIndex: idx } : null)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      selectedPhoto.currentIndex === idx
                        ? 'border-[#2F80ED] ring-2 ring-blue-400/30 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    {isVideoUrl(url) ? (
                      <div className="w-10 h-10 bg-slate-800 flex items-center justify-center text-white">
                        <Video className="h-4 w-4" />
                      </div>
                    ) : (
                      <img src={url} alt={`Slide ${idx + 1}`} className="w-10 h-10 object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {selectedPhoto.urls.length > 1
                  ? `${selectedPhoto.urls.length} lampiran foto/video`
                  : '1 lampiran'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="rounded-xl bg-[#2F80ED] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-md cursor-pointer transition"
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

              {/* Lampiran Media (Foto / Video - Multi-file) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Lampiran Media (Foto / Video)
                    {(editExistingUrls.length + editNewMediaList.length) > 0 && (
                      <span className="text-[#2F80ED] font-bold ml-1">
                        ({editExistingUrls.length + editNewMediaList.length} berkas)
                      </span>
                    )}
                  </label>
                  {(editExistingUrls.length + editNewMediaList.length) > 0 && (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-[#2F80ED] hover:underline cursor-pointer"
                    >
                      + Tambah Foto
                    </button>
                  )}
                </div>

                {(editExistingUrls.length + editNewMediaList.length) > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {/* Media Lama yang Tersimpan */}
                      {editExistingUrls.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black aspect-square flex items-center justify-center">
                          {isVideoUrl(url) ? (
                            <video src={url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={url} alt={`Lampiran ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            Tersimpan
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingEditUrl(idx)}
                            className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-md hover:bg-red-700 transition cursor-pointer"
                            title="Hapus foto ini"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* Media Baru yang Baru Dipilih */}
                      {editNewMediaList.map((media, idx) => (
                        <div key={media.id} className="relative group rounded-xl overflow-hidden border-2 border-emerald-400 bg-black aspect-square flex items-center justify-center">
                          {media.type === 'video' ? (
                            <video src={media.previewUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={media.previewUrl} alt={`Baru ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            Baru
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewEditMedia(idx)}
                            className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-md hover:bg-red-700 transition cursor-pointer"
                            title="Hapus foto baru ini"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* Tombol Tambah di dalam Grid */}
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-slate-300 hover:border-[#2F80ED] bg-white hover:bg-blue-50/40 aspect-square flex flex-col items-center justify-center text-slate-500 hover:text-[#2F80ED] transition cursor-pointer"
                      >
                        <Plus className="h-5 w-5 mb-0.5" />
                        <span className="text-[10px] font-bold">+ Tambah</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>{editExistingUrls.length} tersimpan, {editNewMediaList.length} berkas baru</span>
                      <button
                        type="button"
                        onClick={() => { setEditExistingUrls([]); setEditNewMediaList([]); }}
                        className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 cursor-pointer hover:border-[#2F80ED] hover:bg-blue-50/30 transition text-center"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-[#2F80ED] mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">Unggah foto atau video baru</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Format JPG, PNG, WebP, atau Video</p>
                  </div>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleEditMediaSelect}
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || !editTitle.trim()}
                  className="rounded-xl bg-[#2F80ED] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 cursor-pointer transition"
                >
                  {isSubmittingEdit ? (editUploadProgressText || 'Menyimpan Perubahan...') : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
