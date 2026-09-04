import React, { useState } from 'react';
import { Search, Clock, Calendar, Image as ImageIcon, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface PhotoModalState {
  url: string;
  title: string;
  student: string;
  date: string;
}

export const AktivitasAdminView: React.FC = () => {
  const { activities } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoModalState | null>(null);

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

  const filteredActivities = activities.filter(a => {
    const dayStr = a.day || a.activityDate || '-';
    const dateStr = a.date || a.activityDate || '-';
    const studentStr = (a.studentName || '') + ' ' + (a.studentNim || '');
    return a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dayStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group activities by date
  const groupedByDate: { date: string; dateActivities: typeof activities }[] = [];
  filteredActivities.forEach(act => {
    const actDate = act.activityDate || todayStr;
    const existing = groupedByDate.find(g => g.date === actDate);
    if (existing) {
      existing.dateActivities.push(act);
    } else {
      groupedByDate.push({ date: actDate, dateActivities: [act] });
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Pemeriksaan Aktivitas & Logbook Magang</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tinjau laporan log kegiatan harian peserta magang untuk evaluasi berkala
        </p>
      </div>

      {/* Search Filter */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mahasiswa, NIM, aktivitas, atau tanggal..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Activities Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="py-3 px-4 w-52">Mahasiswa</th>
                <th className="py-3 px-4 w-60">Judul Aktivitas</th>
                <th className="py-3 px-4">Deskripsi Kegiatan</th>
                <th className="py-3 px-4 w-44">Waktu Pengerjaan</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 font-medium">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p>Tidak ada aktivitas yang sesuai dengan pencarian</p>
                  </td>
                </tr>
              ) : (
                groupedByDate.map(({ date, dateActivities }) => {
                  const label = getDateLabel(date);
                  const isToday = date === todayStr;

                  return (
                    <React.Fragment key={date}>
                      {/* Date Separator Row */}
                      <tr>
                        <td colSpan={4} className="px-0 py-0">
                          <div className={`flex items-center gap-3 px-4 py-2.5 ${
                            isToday
                              ? 'bg-blue-50/80 border-y border-blue-100'
                              : 'bg-slate-50/70 border-y border-slate-100'
                          }`}>
                            <div className={`flex items-center gap-2 text-xs font-bold ${
                              isToday ? 'text-[#2F80ED]' : 'text-slate-500'
                            }`}>
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDateHeader(date)}</span>
                            </div>
                            {label && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isToday
                                  ? 'bg-[#2F80ED] text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {label}
                              </span>
                            )}
                            <div className="flex-1 h-px bg-current opacity-10" />
                            <span className={`text-[10px] font-semibold ${
                              isToday ? 'text-blue-400' : 'text-slate-400'
                            }`}>
                              {dateActivities.length} aktivitas
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Records for this date */}
                      {dateActivities.map((act, idx) => (
                        <tr
                          key={act.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            idx < dateActivities.length - 1 ? 'border-b border-slate-100/60' : ''
                          }`}
                        >
                          {/* Mahasiswa */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-bold text-slate-900">{act.studentName || 'Peserta'}</p>
                            <p className="text-[11px] text-slate-400">{act.studentNim || '-'}</p>
                          </td>

                          {/* Judul Aktivitas */}
                          <td className="py-3.5 px-4 text-slate-800 font-medium">
                            <p className="font-semibold text-slate-900">{act.title}</p>
                            {act.attachmentUrl && (
                              <button
                                onClick={() => setSelectedPhoto({
                                  url: act.attachmentUrl!,
                                  title: act.title,
                                  student: act.studentName || 'Peserta',
                                  date: formatDateHeader(act.activityDate || date)
                                })}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-[#2F80ED] hover:bg-blue-100 transition shadow-2xs"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                <span>Lihat Foto Kegiatan</span>
                              </button>
                            )}
                          </td>

                          {/* Deskripsi Kegiatan */}
                          <td className="py-3.5 px-4 text-slate-600 max-w-md">
                            {act.description && !act.description.startsWith('Waktu: ') ? (
                              <p className="text-xs leading-relaxed whitespace-pre-line text-slate-600">
                                {act.description}
                              </p>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Waktu Pengerjaan */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{act.time || '08:00 - 17:00 WIB'}</span>
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

      {/* Modal Preview Foto Kegiatan */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedPhoto.title}</h3>
                <p className="text-[11px] text-slate-400">{selectedPhoto.student} • {selectedPhoto.date}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
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
