import React, { useState } from 'react';
import { Calendar, ChevronDown, Check, AlertCircle, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DataDiriViewProps {
  onSuccess?: () => void;
}

export const DataDiriView: React.FC<DataDiriViewProps> = ({ onSuccess }) => {
  const { currentUser, updateCurrentUser } = useAuth();

  // Form states initialized with currentUser data
  const [formData, setFormData] = useState({
    name: currentUser?.name || 'Andi Pratama',
    birthPlace: currentUser?.birthPlace || 'Jakarta',
    birthDate: currentUser?.birthDate || '2003-08-15',
    gender: currentUser?.gender || 'Laki-laki',
    email: currentUser?.email || 'andi.pratama@email.com',
    phone: currentUser?.phone || '0812-3456-7890',
    nim: currentUser?.nim || '2201234567',
    university: currentUser?.university || 'Universitas Indonesia',
    major: currentUser?.major || 'Sistem Informasi',
    concentration: currentUser?.concentration || 'Pengembangan Sistem Informasi',
    startDate: currentUser?.startDate || '2025-05-20',
    endDate: currentUser?.endDate || '2025-08-20',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
    setErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!formData.nim.trim()) {
      setErrorMessage('NIM mahasiswa wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Nomor telepon wajib diisi.');
      return;
    }

    updateCurrentUser({
      name: formData.name,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      gender: formData.gender as 'Laki-laki' | 'Perempuan',
      phone: formData.phone,
      nim: formData.nim,
      university: formData.university,
      major: formData.major,
      concentration: formData.concentration,
      startDate: formData.startDate,
      endDate: formData.endDate,
      avatar: formData.avatar
    });

    setSavedSuccess(true);
    if (onSuccess) onSuccess();

    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleReset = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        birthPlace: currentUser.birthPlace || '',
        birthDate: currentUser.birthDate || '',
        gender: currentUser.gender || 'Laki-laki',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        nim: currentUser.nim || '',
        university: currentUser.university || '',
        major: currentUser.major || '',
        concentration: currentUser.concentration || '',
        startDate: currentUser.startDate || '',
        endDate: currentUser.endDate || '',
        avatar: currentUser.avatar || ''
      });
    }
    setErrorMessage(null);
    setSavedSuccess(false);
  };

  // Avatar selector helper
  const handleAvatarChange = () => {
    const urls = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    ];
    const currentIndex = urls.indexOf(formData.avatar);
    const nextUrl = urls[(currentIndex + 1) % urls.length];
    setFormData(prev => ({ ...prev, avatar: nextUrl }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Data Diri</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi pribadi dan data magang Anda
        </p>
      </div>

      {/* Success / Error Notification */}
      {savedSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>Perubahan data diri berhasil disimpan ke dalam sistem MagangKu!</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-[#EB5757] border border-rose-200 shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Profile Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full ring-4 ring-slate-100 shadow-md">
              <img
                src={formData.avatar}
                alt={formData.name}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleAvatarChange}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#2F80ED] text-white shadow-md hover:bg-blue-600 transition-transform active:scale-95"
              title="Ganti Foto Profil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#183B66]">
              {formData.name}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Peserta Magang
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#2F80ED]">
                {formData.university}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[#27AE60]">
                Status: Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Cards Grid */}
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Data Pribadi */}
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3">
              Data Pribadi
            </h3>

            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nama lengkap"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
                required
              />
            </div>

            {/* Tempat Lahir */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.birthPlace}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                placeholder="Tempat lahir"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Lahir
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
                />
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Kelamin
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Email (Read Only for Mahasiswa) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email
                </label>
                <span className="text-[10px] text-slate-400">Hanya dapat diubah admin</span>
              </div>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
              />
            </div>

            {/* NIM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIM
              </label>
              <input
                type="text"
                value={formData.nim}
                onChange={(e) => handleInputChange('nim', e.target.value)}
                placeholder="Nomor Induk Mahasiswa"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
              />
            </div>
          </div>

          {/* Card 2: Data Magang */}
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3">
              Data Magang
            </h3>

            {/* Asal Universitas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Asal Universitas
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => handleInputChange('university', e.target.value)}
                placeholder="Nama Perguruan Tinggi"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
              />
            </div>

            {/* Jurusan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jurusan
              </label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => handleInputChange('major', e.target.value)}
                placeholder="Program Studi / Jurusan"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
              />
            </div>

            {/* Konsentrasi Magang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Konsentrasi Magang
              </label>
              <input
                type="text"
                value={formData.concentration}
                onChange={(e) => handleInputChange('concentration', e.target.value)}
                placeholder="Contoh: Frontend Engineering, Data Science"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
              />
            </div>

            {/* Tanggal Mulai Magang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Mulai Magang
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
                />
              </div>
            </div>

            {/* Tanggal Selesai Magang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Selesai Magang
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-[#2F80ED] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/15"
                />
              </div>
            </div>

            {/* Information Notice */}
            <div className="rounded-xl bg-blue-50/60 p-3.5 text-xs text-[#2F80ED] border border-blue-100">
              <span className="font-semibold">Catatan:</span> Pastikan tanggal mulai dan tanggal selesai sesuai dengan Surat Keputusan (SK) Magang Resmi dari kampus.
            </div>
          </div>
        </div>

        {/* Bottom Actions Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#2F80ED] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98]"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};
