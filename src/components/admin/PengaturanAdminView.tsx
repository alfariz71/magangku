import React, { useState, useEffect } from 'react';
import { Settings, Shield, Clock, Bell, Save, CheckCircle2, History, Search } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const PengaturanAdminView: React.FC = () => {
  const { auditLogs, systemSettings, updateSystemSettings } = useData();

  const [workStartTime, setWorkStartTime] = useState(systemSettings.workStartTime || '08:00');
  const [workEndTime, setWorkEndTime] = useState(systemSettings.workEndTime || '17:00');
  const [lateToleranceMins, setLateToleranceMins] = useState(systemSettings.lateToleranceMins ?? 15);
  const [allowOvertime, setAllowOvertime] = useState(systemSettings.allowOvertime ?? true);
  const [requireSignatureOnReport, setRequireSignatureOnReport] = useState(systemSettings.requireSignatureOnReport ?? true);
  const [searchLog, setSearchLog] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setWorkStartTime(systemSettings.workStartTime);
    setWorkEndTime(systemSettings.workEndTime);
    setLateToleranceMins(systemSettings.lateToleranceMins);
    setAllowOvertime(systemSettings.allowOvertime);
    setRequireSignatureOnReport(systemSettings.requireSignatureOnReport);
  }, [systemSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      workStartTime,
      workEndTime,
      lateToleranceMins: Number(lateToleranceMins) || 0,
      allowOvertime,
      requireSignatureOnReport,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const filteredLogs = auditLogs.filter(l =>
    l.action.toLowerCase().includes(searchLog.toLowerCase()) ||
    l.performedBy.toLowerCase().includes(searchLog.toLowerCase()) ||
    l.details.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Pengaturan Sistem & Audit Log</h2>
        <p className="mt-1 text-sm text-slate-500">
          Konfigurasi jam kerja operasional, toleransi keterlambatan, dan riwayat audit trail keamanan
        </p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Pengaturan kebijakan sistem berhasil disimpan!</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: General Settings */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3 mb-4">
              Kebijakan Waktu Presensi
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Masuk Standar</label>
                  <input
                    type="time"
                    value={workStartTime}
                    onChange={e => setWorkStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Pulang Standar</label>
                  <input
                    type="time"
                    value={workEndTime}
                    onChange={e => setWorkEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  value={lateToleranceMins}
                  onChange={e => setLateToleranceMins(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                />
                {(() => {
                  const [h, m] = (workStartTime || '08:00').split(':').map(Number);
                  const total = (h * 60 + (m || 0)) + (Number(lateToleranceMins) || 0);
                  const cutoffH = String(Math.floor(total / 60) % 24).padStart(2, '0');
                  const cutoffM = String(total % 60).padStart(2, '0');
                  return (
                    <p className="text-[11px] text-[#2F80ED] font-semibold mt-1">
                      💡 Batas akhir kehadiran tepat waktu: <strong>{cutoffH}:{cutoffM} WIB</strong> (absen lewat dari jam ini otomatis berstatus 'Terlambat').
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOvertime}
                    onChange={e => setAllowOvertime(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2F80ED]"
                  />
                  <span className="text-xs text-slate-700 font-medium">Izinkan pencatatan jam kerja lembur</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireSignatureOnReport}
                    onChange={e => setRequireSignatureOnReport(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2F80ED]"
                  />
                  <span className="text-xs text-slate-700 font-medium">Wajibkan tanda tangan digital pada ekspor laporan</span>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600"
                >
                  <Save className="h-4 w-4" />
                  Simpan Kebijakan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Security & Role Policies */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3">
              Keamanan & RBAC (Role-Based Access)
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                <Shield className="h-4 w-4 text-[#2F80ED] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-800">Enkripsi Token QR Dinamis</h5>
                  <p className="text-[11px] text-slate-500">Token QR divalidasi dengan masa berlaku berkala dan dicocokkan dengan koordinat geofencing.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                <Shield className="h-4 w-4 text-[#27AE60] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-800">Validasi Geolocation Tanpa Paparan Koordinat</h5>
                  <p className="text-[11px] text-slate-500">Koordinat GPS aktual dilindungi dan hanya menampilkan status indikator hijau/merah di sisi peserta.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                <Shield className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-800">Proteksi Absensi Ganda</h5>
                  <p className="text-[11px] text-slate-500">Sistem mencegah absen masuk ganda pada hari yang sama dan mencegah absen pulang sebelum masuk.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Trail Table */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#2F80ED]" />
            <h3 className="text-base font-bold text-[#183B66]">Audit Log Sistem & Jejak Keamanan</h3>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchLog}
              onChange={e => setSearchLog(e.target.value)}
              placeholder="Cari jejak audit..."
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 sm:py-1.5 pl-8 pr-3 text-xs focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-3">Waktu</th>
                <th className="pb-3 px-3">Kategori</th>
                <th className="pb-3 px-3">Tindakan</th>
                <th className="pb-3 px-3">Rincian Aktivitas</th>
                <th className="pb-3 pl-3">Dilakukan Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-3 px-3 text-slate-700">{log.details}</td>
                  <td className="py-3 pl-3 font-medium text-slate-600">{log.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden mt-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Tidak ada log audit sesuai pencarian</p>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {log.category}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{log.action}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{log.details}</p>
                <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span>Oleh: <strong className="text-slate-800 font-semibold">{log.performedBy}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
