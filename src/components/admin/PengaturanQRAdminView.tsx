import React, { useState } from 'react';
import { 
  QrCode, 
  Printer, 
  RefreshCw, 
  MapPin, 
  ShieldCheck, 
  Power, 
  CheckCircle2, 
  Sliders, 
  History, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../../context/DataContext';

export const PengaturanQRAdminView: React.FC = () => {
  const { qrConfig, updateQrConfig, regenerateQrToken, auditLogs } = useData();

  const [officeName, setOfficeName] = useState(qrConfig.officeName);
  const [latitude, setLatitude] = useState(qrConfig.latitude);
  const [longitude, setLongitude] = useState(qrConfig.longitude);
  const [radiusMeters, setRadiusMeters] = useState(qrConfig.radiusMeters);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleSaveGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    updateQrConfig({
      officeName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radiusMeters)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleToggleActive = () => {
    updateQrConfig({ isActive: !qrConfig.isActive });
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(qrConfig.currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const qrScanLogs = auditLogs.filter(l => l.category === 'Pengaturan QR' || l.action.includes('Absen') || l.details.includes('QR'));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Pengaturan QR Code & Geolocation</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola token QR absensi resmi, radius jangkauan presensi, dan log validasi lokasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer className="h-4 w-4 text-[#2F80ED]" />
            Cetak QR Code
          </button>

          <button
            onClick={regenerateQrToken}
            className="flex items-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Generate Token Baru
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Pengaturan lokasi dan radius geofence berhasil disimpan!</span>
        </div>
      )}

      {/* Main Grid: QR Preview & Status (Left) and Geolocation Settings (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Active QR Code Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm flex flex-col items-center text-center">
            <div className="flex w-full items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-bold text-[#183B66]">QR Code Lokasi Aktif</h3>
              
              {/* Active Toggle Switch */}
              <button
                onClick={handleToggleActive}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  qrConfig.isActive
                    ? 'bg-emerald-50 text-[#27AE60] border border-emerald-200'
                    : 'bg-rose-50 text-[#EB5757] border border-rose-200'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{qrConfig.isActive ? 'Status: Aktif' : 'Status: Nonaktif'}</span>
              </button>
            </div>

            {/* QR SVG Frame */}
            <div className="relative p-3">
              <div className="relative h-52 w-52 rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-lg flex items-center justify-center">
                <QRCodeSVG
                  value={qrConfig.currentToken}
                  size={170}
                  level="H"
                  fgColor={qrConfig.isActive ? '#183B66' : '#94A3B8'}
                />
              </div>

              {/* Blue Corner Accents */}
              <div className="absolute top-0 left-0 h-6 w-6 border-t-4 border-l-4 border-[#2F80ED] rounded-tl-lg" />
              <div className="absolute top-0 right-0 h-6 w-6 border-t-4 border-r-4 border-[#2F80ED] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-[#2F80ED] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-[#2F80ED] rounded-br-lg" />
            </div>

            <h4 className="mt-4 text-sm font-bold text-slate-800">{qrConfig.officeName}</h4>
            <p className="text-xs text-slate-400">Dibuat pada: {qrConfig.lastGenerated}</p>

            {/* Token Copy Bar */}
            <div className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs">
              <code className="text-slate-700 font-mono truncate mr-2">{qrConfig.currentToken}</code>
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 text-[#2F80ED] font-semibold hover:underline shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50/60 p-3 text-[11px] text-left text-slate-600 border border-blue-100">
              🔒 <span className="font-semibold text-[#2F80ED]">Keamanan:</span> Token QR dibuat secara terenkripsi di server dan divalidasi bersamaan dengan radius GPS perangkat mahasiswa saat melakukan absensi.
            </div>
          </div>
        </div>

        {/* Right: Geofence Location & Radius Settings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3 mb-4">
              Konfigurasi Geofencing & Jangkauan
            </h3>

            <form onSubmit={handleSaveGeofence} className="space-y-4">
              {/* Office Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Titik Lokasi Magang
                </label>
                <input
                  type="text"
                  value={officeName}
                  onChange={e => setOfficeName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude (Lintang)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={e => setLatitude(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude (Bujur)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={e => setLongitude(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Radius Options */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Radius Jangkauan Absensi Maksimal (Meter)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusMeters(r)}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        radiusMeters === r
                          ? 'border-[#2F80ED] bg-blue-50 text-[#2F80ED] shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r} Meter
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="rounded-xl bg-amber-50/70 p-3.5 text-xs text-amber-800 border border-amber-200">
                <span className="font-semibold">Perhatian Admin:</span> Koordinat latitude, longitude, dan jarak radius hanya dapat dilihat oleh akun Administrator. Sisi mahasiswa hanya akan melihat status indikator hijau atau merah.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#2F80ED] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98]"
                >
                  Simpan Pengaturan Geofence
                </button>
              </div>
            </form>
          </div>

          {/* QR Scan History Logs */}
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-bold text-[#183B66] border-b border-slate-100 pb-3 mb-3">
              Riwayat Audit QR & Lokasi Terkini
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {qrScanLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <p className="text-[11px] text-slate-500">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable QR Code Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs" onClick={() => setShowPrintModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 print:shadow-none print:border-none">
            <div className="no-print flex justify-end mb-2">
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕ Tutup</button>
            </div>

            {/* Poster Layout */}
            <div className="border-4 border-[#183B66] rounded-3xl p-6 bg-white">
              <h2 className="text-2xl font-black text-[#183B66] tracking-tight">Magang<span className="text-[#2F80ED]">Ku</span></h2>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">Titik Absensi Resmi</p>

              <div className="my-6 flex justify-center">
                <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-md">
                  <QRCodeSVG
                    value={qrConfig.currentToken}
                    size={200}
                    level="H"
                    fgColor="#183B66"
                  />
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">{qrConfig.officeName}</h3>
              <p className="text-xs text-slate-500 mt-1">Buka aplikasi MagangKu & scan QR Code di atas menggunakan kamera.</p>
              <div className="mt-4 border-t border-slate-200 pt-3 text-[10px] text-slate-400">
                Sistem Manajemen Magang Digital Terintegrasi
              </div>
            </div>

            <div className="no-print mt-6 flex justify-center gap-3">
              <button
                onClick={handlePrint}
                className="rounded-xl bg-[#2F80ED] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-600"
              >
                🖨️ Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
