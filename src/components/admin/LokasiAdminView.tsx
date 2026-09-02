import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit3, X, Check, QrCode, RefreshCw, Clock, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Location } from '../../types';
import { useData } from '../../context/DataContext';

export default function LokasiAdminView() {
  const { locations, regenerateQrToken, activeLocation, qrConfig } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radiusMeters: 50,
    minGpsAccuracy: 100,
    isActive: true
  });

  // QR State
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [qrToken, setQrToken] = useState<string>('');

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      const activeLoc = locations.find(l => l.isActive);
      if (activeLoc) setSelectedLocationId(activeLoc.id);
    }
  }, [locations, selectedLocationId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (qrConfig && qrConfig.expiresAt) {
        const left = Math.max(0, Math.floor((new Date(qrConfig.expiresAt).getTime() - Date.now()) / 1000));
        setSecondsLeft(left);
        setQrToken(qrConfig.currentToken || '');
      } else {
        setSecondsLeft(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [qrConfig]);

  const handleSave = () => {
    alert('Simpan lokasi ke Supabase belum sepenuhnya di-hook di halaman ini. Silakan atur radius via SQL Editor untuk sementara.');
    setShowForm(false);
    setEditId(null);
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

  const generateQR = async () => {
    if (!selectedLocationId) return alert('Pilih lokasi terlebih dahulu');
    await regenerateQrToken();
    // After regeneration, it might not be immediately available in local state, 
    // but the next polling loop will catch it or we can just fetch it.
    alert('QR Token berhasil di-generate ke database! Refresh halaman untuk melihatnya (jika tidak otomatis).');
  };

  const toggleActive = (id: string) => {
    alert('Fitur toggle aktif ini belum terhubung ke Supabase. Silakan atur via SQL Editor.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#183B66]">Lokasi & QR Code Absensi</h1>
          <p className="text-gray-500">Kelola lokasi magang dan generate QR code absensi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kelola Lokasi */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#183B66]">Daftar Lokasi</h2>
            <button 
              onClick={() => {
                setFormData({name: '', address: '', latitude: 0, longitude: 0, radiusMeters: 50, minGpsAccuracy: 100, isActive: true});
                setEditId(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-[#2F80ED] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              <Plus size={18} /> Tambah Lokasi
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
              <h3 className="font-semibold mb-4 text-[#183B66]">{editId ? 'Edit Lokasi' : 'Tambah Lokasi'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.latitude} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.longitude} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meter)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.radiusMeters} onChange={e => setFormData({...formData, radiusMeters: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Akurasi GPS</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#2F80ED]" value={formData.minGpsAccuracy} onChange={e => setFormData({...formData, minGpsAccuracy: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status Aktif</label>
                  <button onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`flex items-center ${formData.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100">Batal</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-[#2F80ED] text-white rounded-lg hover:bg-blue-600">Simpan</button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {locations.map(loc => (
              <div key={loc.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-[#2F80ED]" size={20} />
                    <h3 className="font-bold text-[#183B66]">{loc.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(loc.id)} className={`text-xs px-2 py-1 rounded-full border ${loc.isActive ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-400 text-gray-500 bg-gray-50'}`}>
                      {loc.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button onClick={() => handleEdit(loc)} className="p-1 text-gray-500 hover:text-[#2F80ED]"><Edit3 size={18}/></button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{loc.address}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-mono">
                  <span className="bg-gray-50 px-2 py-1 rounded">R: {loc.radiusMeters}m</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Lat: {loc.latitude}</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Lon: {loc.longitude}</span>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
               <div className="text-center p-6 text-gray-400">
                  Belum ada lokasi magang terdaftar.
               </div>
            )}
          </div>
        </div>

        {/* QR Code Generator */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-[#183B66] mb-6 flex items-center gap-2"><QrCode size={24} /> Generator QR Code</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Lokasi Aktif</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#2F80ED] bg-gray-50"
              value={selectedLocationId}
              onChange={e => setSelectedLocationId(e.target.value)}
            >
              <option value="" disabled>Pilih Lokasi...</option>
              {locations.filter(l => l.isActive).map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 min-h-[380px] relative overflow-hidden">
            {qrToken ? (
              <>
                <div className="relative p-4 bg-white rounded-2xl shadow-lg mb-6 border-4 border-[#2F80ED]">
                  <QRCodeSVG value={qrToken} size={220} level="H" />
                  {secondsLeft === 0 && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
                      <AlertCircle size={48} className="text-red-500 mb-2" />
                      <span className="font-bold text-red-600 text-lg">QR Kedaluwarsa</span>
                    </div>
                  )}
                </div>
                
                <div className="w-full max-w-xs mb-4">
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-gray-600 flex items-center gap-1"><Clock size={16}/> Sisa Waktu:</span>
                    <span className={`${secondsLeft > 15 ? 'text-green-600' : secondsLeft > 5 ? 'text-amber-500' : 'text-red-600'}`}>{secondsLeft} detik</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${secondsLeft > 15 ? 'bg-green-500' : secondsLeft > 5 ? 'bg-amber-500' : 'bg-red-500'}`} 
                      style={{ width: `${(secondsLeft / 60) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono tracking-wider font-semibold bg-gray-200 px-3 py-1 rounded">TOKEN: {qrToken}</p>
              </>
            ) : (
              <div className="text-center text-gray-400 flex flex-col items-center gap-4">
                <QrCode size={64} className="opacity-20" />
                <p>Belum ada QR Code aktif.<br/>Pilih lokasi dan klik tombol di bawah untuk membuat.</p>
              </div>
            )}
          </div>

          <button 
            onClick={generateQR}
            className="w-full mt-6 bg-[#2F80ED] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-600 shadow-md transition active:scale-95"
          >
            {secondsLeft > 0 ? <RefreshCw size={20} /> : <QrCode size={20} />}
            {secondsLeft > 0 ? 'Perbarui QR Code' : 'Generate QR Baru'}
          </button>
        </div>
      </div>
    </div>
  );
}
