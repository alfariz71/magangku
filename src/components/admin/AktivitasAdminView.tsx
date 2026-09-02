import React, { useState } from 'react';
import { ClipboardList, Search, CheckCircle2, Calendar, Clock, User, Check, MessageSquare } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AktivitasAdminView: React.FC = () => {
  const { activities, students } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [verifiedIds, setVerifiedIds] = useState<string[]>(['act-01', 'act-02']);

  const handleVerify = (id: string) => {
    if (verifiedIds.includes(id)) {
      setVerifiedIds(prev => prev.filter(item => item !== id));
      setToastMessage('Status verifikasi jurnal dibatalkan.');
    } else {
      setVerifiedIds(prev => [...prev, id]);
      setToastMessage('Jurnal aktivitas berhasil diverifikasi oleh Administrator.');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredActivities = activities.filter(a => {
    const dayStr = a.day || a.activityDate || '-';
    const dateStr = a.date || a.activityDate || '-';
    return a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dayStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dateStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Pemeriksaan Aktivitas & Logbook Magang</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tinjau laporan log kegiatan harian peserta magang untuk evaluasi berkala
        </p>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas, hari, atau tanggal..."
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
                <th className="pb-3 pr-4">Hari & Tanggal</th>
                <th className="pb-3 px-4">Judul & Rincian Aktivitas</th>
                <th className="pb-3 px-4">Waktu Pengerjaan</th>
                <th className="pb-3 px-4">Status Verifikasi</th>
                <th className="pb-3 pl-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredActivities.map((act) => {
                const isVerified = verifiedIds.includes(act.id);
                return (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{act.day || act.activityDate || '-'}</p>
                      <p className="text-[11px] text-slate-400">{act.date || act.activityDate || '-'}</p>
                    </td>

                    <td className="py-4 px-4 text-slate-800 font-medium max-w-md">
                      {act.title}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                      {act.time}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#27AE60]">
                          <Check className="h-3 w-3" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-[#F2994A]">
                          Menunggu Review
                        </span>
                      )}
                    </td>

                    <td className="py-4 pl-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleVerify(act.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          isVerified
                            ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            : 'bg-[#2F80ED] text-white hover:bg-blue-600 shadow-xs'
                        }`}
                      >
                        {isVerified ? 'Batalkan' : 'Verifikasi Jurnal'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
