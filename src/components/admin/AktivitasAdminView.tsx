import React, { useState, useMemo } from 'react';
import {
  Search,
  Clock,
  Calendar,
  Image as ImageIcon,
  Video,
  ExternalLink,
  X,
  ChevronDown,
  User as UserIcon,
  BookOpen,
  ChevronsUpDown,
  Filter
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { isVideoUrl } from '../../lib/cloudinary';
import { ActivityRecord } from '../../types';

interface PhotoModalState {
  url: string;
  title: string;
  student: string;
  date: string;
}

interface StudentGroup {
  id: string;
  name: string;
  nim: string;
  university?: string;
  avatar?: string;
  activities: ActivityRecord[];
  latestActivity?: ActivityRecord;
}

export const AktivitasAdminView: React.FC = () => {
  const { activities, students } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('ALL');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoModalState | null>(null);

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

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

  const getDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hari Ini';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    if (dateStr === yesterdayStr) return 'Kemarin';
    return null;
  };

  // 1. Kelompokkan aktivitas berdasarkan Mahasiswa
  const studentGroups = useMemo(() => {
    const map = new Map<string, StudentGroup>();

    activities.forEach(act => {
      // Prioritaskan userId, fallback ke NIM atau Nama
      const key = act.userId || act.studentNim || act.studentName || 'unknown-user';
      const studentInfo = students.find(
        s => s.id === act.userId || (act.studentNim && s.nim === act.studentNim)
      );

      const existing = map.get(key);
      if (existing) {
        existing.activities.push(act);
      } else {
        map.set(key, {
          id: key,
          name: act.studentName || studentInfo?.name || 'Peserta',
          nim: act.studentNim || studentInfo?.nim || '-',
          university: studentInfo?.university,
          avatar: studentInfo?.avatar,
          activities: [act],
        });
      }
    });

    // Urutkan aktivitas tiap mahasiswa dari tanggal terbaru ke terlama
    const groups = Array.from(map.values()).map(group => {
      const sortedActs = [...group.activities].sort((a, b) => {
        const dateA = a.activityDate || a.date || a.createdAt || '';
        const dateB = b.activityDate || b.date || b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
      return {
        ...group,
        activities: sortedActs,
        latestActivity: sortedActs[0],
      };
    });

    // Urutkan mahasiswa secara alfabetis nama
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [activities, students]);

  // 2. Filter berdasarkan pencarian kata kunci dan filter dropdown mahasiswa
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return studentGroups
      .filter(group => {
        if (selectedStudentFilter !== 'ALL' && group.id !== selectedStudentFilter) {
          return false;
        }
        if (!q) return true;

        // Cocokkan nama atau NIM mahasiswa
        const matchStudent =
          group.name.toLowerCase().includes(q) ||
          group.nim.toLowerCase().includes(q) ||
          (group.university && group.university.toLowerCase().includes(q));
        if (matchStudent) return true;

        // Cocokkan judul, deskripsi, atau tanggal aktivitas
        return group.activities.some(
          a =>
            a.title.toLowerCase().includes(q) ||
            (a.description && a.description.toLowerCase().includes(q)) ||
            (a.activityDate && a.activityDate.toLowerCase().includes(q)) ||
            (a.day && a.day.toLowerCase().includes(q)) ||
            (a.date && a.date.toLowerCase().includes(q))
        );
      })
      .map(group => {
        if (!q) return group;
        // Jika sedang melakukan pencarian dan bukan nama siswa yang match persis, saring aktivitasnya
        const matchStudent =
          group.name.toLowerCase().includes(q) ||
          group.nim.toLowerCase().includes(q);

        if (matchStudent) return group;

        const matchingActs = group.activities.filter(
          a =>
            a.title.toLowerCase().includes(q) ||
            (a.description && a.description.toLowerCase().includes(q)) ||
            (a.activityDate && a.activityDate.toLowerCase().includes(q)) ||
            (a.day && a.day.toLowerCase().includes(q)) ||
            (a.date && a.date.toLowerCase().includes(q))
        );
        return {
          ...group,
          activities: matchingActs,
        };
      });
  }, [studentGroups, searchQuery, selectedStudentFilter]);

  // Status expand: otomatis terbuka jika sedang mencari atau filter spesifik aktif
  const isExpanded = (id: string) => {
    if (searchQuery.trim().length > 0) return true;
    if (selectedStudentFilter !== 'ALL') return true;
    return expandedStudents.has(id);
  };

  const toggleStudentAccordion = (id: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllAccordions = () => {
    const allIds = filteredGroups.map(g => g.id);
    const areAllOpen = allIds.every(id => expandedStudents.has(id));

    if (areAllOpen) {
      setExpandedStudents(new Set());
    } else {
      setExpandedStudents(new Set(allIds));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66] dark:text-white">Pemeriksaan Aktivitas & Logbook Magang</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tinjau laporan log kegiatan harian peserta magang secara terstruktur per individu
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
            Total Peserta: <span className="font-bold text-[#2F80ED] dark:text-blue-400">{studentGroups.length}</span> ({activities.length} Aktivitas)
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-[16px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          
          {/* Kolom Pencarian */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mahasiswa, NIM, judul aktivitas, atau tanggal..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#2F80ED] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition"
            />
          </div>

          {/* Filter Dropdown Nama Mahasiswa & Tombol Buka/Tutup Semua */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-60">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-[#2F80ED] focus:outline-none cursor-pointer"
              >
                <option value="ALL">👥 Semua Mahasiswa ({studentGroups.length})</option>
                {studentGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.activities.length} aktivitas)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Tombol Buka/Tutup Semua Dropdown */}
            <button
              onClick={toggleAllAccordions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shrink-0 cursor-pointer shadow-2xs"
              title="Buka atau tutup seluruh logbook mahasiswa sekaligus"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Buka/Tutup Semua</span>
            </button>
          </div>

        </div>
      </div>

      {/* DAFTAR MAHASISWA & ACCORDION AKTIVITAS */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="rounded-[16px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-400 dark:text-slate-500 shadow-sm">
            <Calendar className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-semibold">Tidak ada aktivitas yang sesuai dengan pencarian</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain atau pilih Semua Mahasiswa</p>
          </div>
        ) : (
          filteredGroups.map(group => {
            const open = isExpanded(group.id);

            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Header Baris Mahasiswa (Bisa diklik untuk Expand / Collapse) */}
                <div
                  onClick={() => toggleStudentAccordion(group.id)}
                  className={`cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none transition-colors ${
                    open ? 'border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar Profil Mahasiswa */}
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
                        {getInitials(group.name)}
                      </div>
                    )}

                    {/* Info Nama, NIM, dan Logbook Terakhir */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{group.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700">
                          NIM: {group.nim}
                        </span>
                        {group.university && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800">
                            {group.university}
                          </span>
                        )}
                      </div>

                      {group.latestActivity && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          Logbook Terakhir:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatDateHeader(group.latestActivity.activityDate || group.latestActivity.date || '')}
                          </span>
                          {' • '}
                          <span className="italic">{group.latestActivity.title}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sisi Kanan: Badge Total Aktivitas & Tombol Dropdown */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-[#2F80ED] dark:text-blue-400 font-bold text-xs">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{group.activities.length} Aktivitas Terdata</span>
                    </span>

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        open
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-[#2F80ED] dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{open ? 'Tutup Logbook' : 'Buka Logbook'}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                          open ? 'rotate-180 text-[#2F80ED] dark:text-blue-300' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* ISI DROPDOWN: TABEL AKTIVITAS MAHASISWA INI */}
                {open && (
                  <div className="p-4 sm:p-5 bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            <th className="py-2.5 px-4 w-44">Tanggal & Waktu</th>
                            <th className="py-2.5 px-4 w-64">Judul Aktivitas</th>
                            <th className="py-2.5 px-4">Deskripsi Kegiatan</th>
                            <th className="py-2.5 px-4 w-40 text-center">Dokumentasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
                          {group.activities.map(act => {
                            const actDate = act.activityDate || act.date || '';
                            const label = getDateLabel(actDate);
                            const isToday = actDate === todayStr;

                            return (
                              <tr
                                key={act.id}
                                className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                {/* Tanggal & Waktu */}
                                <td className="py-3 px-4 whitespace-nowrap align-top">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {formatDateHeader(actDate)}
                                    </span>
                                    {label && (
                                      <span
                                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                                          isToday
                                            ? 'bg-[#2F80ED] text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{act.time || '08:00 - 17:00 WIB'}</span>
                                  </div>
                                </td>

                                {/* Judul Aktivitas */}
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white align-top">
                                  <p>{act.title}</p>
                                </td>

                                {/* Deskripsi Kegiatan */}
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs leading-relaxed align-top">
                                  {act.description && !act.description.startsWith('Waktu: ') ? (
                                    <p className="whitespace-pre-line">{act.description}</p>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                  )}
                                </td>

                                {/* Dokumentasi */}
                                <td className="py-3 px-4 text-center align-top whitespace-nowrap">
                                  {act.attachmentUrl ? (
                                    isVideoUrl(act.attachmentUrl) ? (
                                      <button
                                        onClick={() =>
                                          setSelectedPhoto({
                                            url: act.attachmentUrl!,
                                            title: act.title,
                                            student: group.name,
                                            date: formatDateHeader(actDate),
                                          })
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/50 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition cursor-pointer shadow-2xs"
                                      >
                                        <Video className="h-3.5 w-3.5" />
                                        <span>Lihat Video</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setSelectedPhoto({
                                            url: act.attachmentUrl!,
                                            title: act.title,
                                            student: group.name,
                                            date: formatDateHeader(actDate),
                                          })
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 px-2.5 py-1 text-[11px] font-semibold text-[#2F80ED] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer shadow-2xs"
                                      >
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        <span>Lihat Foto</span>
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="block md:hidden space-y-2.5">
                      {group.activities.map(act => {
                        const actDate = act.activityDate || act.date || '';
                        const label = getDateLabel(actDate);

                        return (
                          <div
                            key={act.id}
                            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {formatDateHeader(actDate)}
                                </span>
                                {label && (
                                  <span className="rounded-full px-1.5 py-0.2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {label}
                                  </span>
                                )}
                              </div>
                              <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>{act.time || '08:00 - 17:00'}</span>
                              </div>
                            </div>

                            <p className="font-semibold text-slate-900 dark:text-slate-100">{act.title}</p>

                            {act.description && !act.description.startsWith('Waktu: ') && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                                {act.description}
                              </p>
                            )}

                            {act.attachmentUrl && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                {isVideoUrl(act.attachmentUrl) ? (
                                  <button
                                    onClick={() =>
                                      setSelectedPhoto({
                                        url: act.attachmentUrl!,
                                        title: act.title,
                                        student: group.name,
                                        date: formatDateHeader(actDate),
                                      })
                                    }
                                    className="w-full justify-center inline-flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/50 px-2.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition shadow-2xs cursor-pointer"
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                    <span>Lihat Video Kegiatan</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setSelectedPhoto({
                                        url: act.attachmentUrl!,
                                        title: act.title,
                                        student: group.name,
                                        date: formatDateHeader(actDate),
                                      })
                                    }
                                    className="w-full justify-center inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 px-2.5 py-1.5 text-xs font-semibold text-[#2F80ED] dark:text-blue-400 hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                                  >
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    <span>Lihat Foto Kegiatan</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Preview Foto / Video Kegiatan */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedPhoto.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedPhoto.student} • {selectedPhoto.date}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-[#2F80ED] hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                  title="Buka di Tab Baru"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center max-h-[70vh]">
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
                className="rounded-xl bg-[#2F80ED] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-md cursor-pointer transition"
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

