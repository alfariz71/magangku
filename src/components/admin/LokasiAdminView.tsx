import React, { useState } from 'react';
import { MapPin, Plus, Edit3, QrCode, ToggleLeft, ToggleRight, Trash2, RefreshCw, Download, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Location } from '../../types';
import { useData } from '../../context/DataContext';

export default function LokasiAdminView() {
  const { locations, locationQrMap, generateQrForLocationId, addLocation, updateLocation, toggleLocationStatus, deleteLocation } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radiusMeters: 50,
    minGpsAccuracy: 300,
    isActive: true
  });


  const handleSave = async () => {
    if (!formData.name || !formData.address) return alert('Nama dan alamat wajib diisi');
    const lat = Number(formData.latitude);
    const lon = Number(formData.longitude);
    const radius = Number(formData.radiusMeters);
    const accuracy = Number(formData.minGpsAccuracy);
    if (isNaN(lat) || lat < -90 || lat > 90) return alert('Latitude tidak valid');
    if (isNaN(lon) || lon < -180 || lon > 180) return alert('Longitude tidak valid');
    if (isNaN(radius) || radius < 10) return alert('Radius minimal 10 meter');
    setIsSaving(true);
    try {
      if (editId) {
        await updateLocation(editId, { ...formData, latitude: lat, longitude: lon, radiusMeters: radius, minGpsAccuracy: accuracy });
      } else {
        await addLocation({ ...formData, latitude: lat, longitude: lon, radiusMeters: radius, minGpsAccuracy: accuracy });
      }
      setShowForm(false);
      setEditId(null);
      setFormData({ name: '', address: '', latitude: 0, longitude: 0, radiusMeters: 50, minGpsAccuracy: 300, isActive: true });
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan lokasi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (loc: Location) => {
    setFormData({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      minGpsAccuracy: loc.minGpsAccuracy,
      isActive: loc.isActive
    });
    setEditId(loc.id);
    setShowForm(true);
  };

  const handleGenerateQr = async (locId: string) => {
    const existing = locationQrMap[locId];
    if (existing && !window.confirm('QR Code lama akan diganti. Lanjutkan?')) return;
    try {
      setGeneratingId(locId);
      await generateQrForLocationId(locId);
    } catch (err) {
      console.error('Gagal generate QR:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus lokasi "${name}"?`)) return;
    await deleteLocation(id);
  };

  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleDownloadQr = (loc: Location) => {
    const svg = document.getElementById(`qr-${loc.id}`);
    if (!svg) return;
    let svgData = new XMLSerializer().serializeToString(svg);
    // Tingkatkan resolusi internal SVG ke 1400px agar tidak blur saat ditarik ke canvas resolusi tinggi
    svgData = svgData
      .replace(/width="[^"]*"/, 'width="1400"')
      .replace(/height="[^"]*"/, 'height="1400"');

    const canvas = document.createElement('canvas');
    // Standar rasio kertas A4 portrait (1 : 1.414) kualitas cetak tajam 300 DPI
    canvas.width = 1414;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.onload = () => {
      // 1. Background Bersih Putih
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1414, 2000);

      // 2. Bagian Atas: Judul QR Presensi Kehadiran (28 pt Word = 66 px)
      ctx.textAlign = 'center';
      ctx.font = 'bold 66px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('QR PRESENSI KEHADIRAN', 707, 180);

      // Aksen garis biru minimalis di bawah judul
      ctx.fillStyle = '#2F80ED';
      drawRoundRect(ctx, 707 - 80, 218, 160, 7, 4);
      ctx.fill();

      // 3. Bagian Tengah: QR Code Jumbo (~70% lebar halaman A4)
      const qrBoxSize = 1040;
      const qrBoxX = (1414 - qrBoxSize) / 2; // 187 px
      const qrBoxY = 285;
      const qrPadding = 40;
      const qrInnerSize = qrBoxSize - (qrPadding * 2); // 960 px (~68-70% lebar A4)

      // Kotak pembungkus QR elegan minimalis
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 3;
      drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
      ctx.fill();
      ctx.stroke();

      // Nonaktifkan image smoothing agar modul pixel QR code razor-sharp & tidak blur
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        qrBoxX + qrPadding,
        qrBoxY + qrPadding,
        qrInnerSize,
        qrInnerSize
      );
      ctx.imageSmoothingEnabled = true;

      // Helper untuk multi-line text wrap agar teks rapi di tengah
      const printWrappedText = (
        text: string,
        startY: number,
        fontSize: number,
        fontWeight: string,
        color: string,
        maxWidth: number,
        lineHeight: number
      ) => {
        ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = color;
        const words = text.split(' ');
        let line = '';
        let currentY = startY;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), 707, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), 707, currentY);
        return currentY + lineHeight;
      };

      // 4. Bagian Bawah: Nama Lokasi Kantor (24 pt Word = 57 px)
      let currentY = qrBoxY + qrBoxSize + 95; // ~1420 px
      currentY = printWrappedText(loc.name, currentY, 57, 'bold', '#0F172A', 1150, 74);

      // 5. Teks Kecil: Radius & Alamat Jalan Kantor (15 pt Word = 36 px)
      const radiusAndAddress = `Radius Presensi: ${loc.radiusMeters} Meter • ${loc.address || 'Alamat kantor terdaftar'}`;
      printWrappedText(radiusAndAddress, currentY + 18, 36, 'normal', '#64748B', 1150, 50);

      // Trigger Download Gambar HD
      const a = document.createElement('a');
      a.download = `QR-Presensi-${loc.name.replace(/\s+/g, '-')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-[#183B66]">Lokasi & QR Code Absensi</h1>
          <p className="text-gray-500 text-sm mt-1">Setiap lokasi memiliki QR Code permanen masing-masing</p>
        </div>
        <button
          onClick={() => { setFormData({ name: '', address: '', latitude: 0, longitude: 0, radiusMeters: 50, minGpsAccuracy: 300, isActive: true }); setEditId(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-[#2F80ED] text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition font-semibold text-sm w-full sm:w-auto"
        >
          <Plus size={18} /> Tambah Lokasi
        </button>
      </div>

      {/* Form Tambah/Edit */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-[#183B66] mb-4 text-lg">{editId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lokasi</label>
              <input type="text" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Kantor Pusat" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Alamat</label>
              <textarea className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} placeholder="Alamat lengkap kantor" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Latitude</label>
              <input type="number" step="any" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Longitude</label>
              <input type="number" step="any" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Radius (meter)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.radiusMeters} onChange={e => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Min. Akurasi GPS (meter)</label>
              <input type="number" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.minGpsAccuracy} onChange={e => setFormData({ ...formData, minGpsAccuracy: parseInt(e.target.value) })} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Status Aktif</label>
              <button onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} className={`flex items-center ${formData.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                {formData.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 transition" disabled={isSaving}>Batal</button>
            <button onClick={handleSave} className="bg-[#183B66] text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-[#122b4a] transition" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </div>
      )}

      {/* Location Cards dengan QR */}
      {locations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada lokasi terdaftar.<br />Klik "Tambah Lokasi" untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locations.map(loc => {
            const token = locationQrMap[loc.id];
            const isGenerating = generatingId === loc.id;
            return (
              <div key={loc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Card Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                      <MapPin className="text-[#2F80ED]" size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#183B66] text-base">{loc.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{loc.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleLocationStatus(loc.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                        loc.isActive ? 'border-green-400 text-green-600 bg-green-50' : 'border-slate-300 text-slate-500 bg-slate-50'
                      }`}
                    >
                      {loc.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button onClick={() => handleEdit(loc)} className="p-1.5 text-slate-400 hover:text-[#2F80ED] hover:bg-blue-50 rounded-lg transition">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(loc.id, loc.name)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    {/* QR Display */}
                    <div className="shrink-0 flex flex-col items-center">
                      {token ? (
                        <div
                          key={`qr-${loc.id}-${token}`}
                          className="p-3.5 bg-white admin-qr-frame border-2 border-[#2F80ED] dark:border-[#38BDF8] rounded-2xl shadow-sm transition-all"
                        >
                          <QRCodeSVG id={`qr-${loc.id}`} value={token} size={150} level="H" />
                        </div>
                      ) : (
                        <div key={`no-qr-${loc.id}`} className="w-[178px] h-[178px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-2">
                          <QrCode size={40} />
                          <span className="text-xs">Belum ada QR</span>
                        </div>
                      )}
                    </div>

                    {/* Info & Actions */}
                    <div className="w-full sm:w-auto flex-1 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold w-16">Radius</span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded font-mono">{loc.radiusMeters}m</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold w-16">Lat</span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded font-mono">{loc.latitude}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold w-16">Lon</span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded font-mono">{loc.longitude}</span>
                        </div>
                      </div>

                      {token ? (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                          <Check size={12} /> QR Aktif & Permanen
                        </div>
                      ) : (
                        <div className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5 text-[11px] text-amber-700 font-semibold">
                          ⚠ QR belum dibuat
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateQr(loc.id)}
                          disabled={isGenerating}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#2F80ED] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition disabled:opacity-60"
                        >
                          {isGenerating ? (
                            <span key="loading" className="inline-flex items-center gap-1.5">
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Membuat...</span>
                            </span>
                          ) : (
                            <span key="ready" className="inline-flex items-center gap-1.5">
                              <QrCode size={13} />
                              <span>{token ? 'Generate Ulang QR' : 'Buat QR Code'}</span>
                            </span>
                          )}
                        </button>
                        {token && (
                          <button
                            onClick={() => handleDownloadQr(loc)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                          >
                            <Download size={13} /> Unduh QR Lengkap (PNG)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {token && (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-slate-400 font-mono truncate">
                      TOKEN: {token}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
