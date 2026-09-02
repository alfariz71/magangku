import React, { useState } from 'react';
import { Plus, X, Check, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AktivitasMagangView: React.FC = () => {
  const { activities, addActivity } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [day, setDay] = useState('Rabu');
  const [date, setDate] = useState('21 Mei 2025');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00 - 17:00 WIB');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!day.trim() || !date.trim() || !title.trim() || !time.trim()) {
      setErrorMessage('Seluruh field (Hari, Tanggal, Judul Aktivitas, dan Waktu) wajib diisi.');
      return;
    }

    addActivity({
      activityDate: date,
      day: day,
      date: date,
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Aktivitas
        </button>
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
          {/* Strictly Only Columns: Hari, Tanggal, Judul Aktivitas, Waktu */}
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
                      {act.day}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {act.date}
                    </td>
                    <td className="py-4 px-4 text-slate-800 font-medium">
                      {act.title}
                    </td>
                    <td className="py-4 pl-4 text-slate-600">
                      {act.time}
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

            {/* Form Fields: Only Hari, Tanggal, Judul Aktivitas, Waktu */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Hari */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hari <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Contoh: 21 Mei 2025"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                </div>
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
    </div>
  );
};
