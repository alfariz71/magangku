import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Menu,
  Camera,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  onMenuToggle?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onNavigate }) => {
  const { currentUser, role, logout, updateCurrentUser } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLargeAvatar, setShowLargeAvatar] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Get appropriate greeting based on client time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const compressImage = (file: File, maxSizeMB = 1.5): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
            else { width = Math.round((width / height) * maxDim); height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          let quality = 0.85;
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `avatar-${currentUser.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressed, {
        upsert: true,
        contentType: 'image/jpeg'
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = urlData.publicUrl;

      await supabase.from('user_profiles').update({
        photo_url: newAvatarUrl,
        avatar_url: newAvatarUrl
      }).eq('id', currentUser.id);

      await updateCurrentUser({ avatar: newAvatarUrl });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Gagal mengunggah foto profil. Pastikan koneksi internet Anda stabil.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-[#EAEFF4] bg-white px-4 sm:px-8 transition-smooth">
      {/* Left: Mobile Toggle & Greeting */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Buka Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div>
          <h1 className="text-base sm:text-lg font-normal text-slate-600">
            {getGreeting()},{' '}
            <span className="font-bold text-[#183B66]">
              {currentUser?.name || (role === 'admin' ? 'Admin' : 'Pengguna')}
            </span>
          </h1>
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition-smooth hover:border-slate-300 hover:bg-slate-50"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#EB5757] text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#2F80ED]">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-[#2F80ED] hover:underline font-medium"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Tidak ada notifikasi baru
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkTab && onNavigate) onNavigate(n.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`cursor-pointer rounded-xl p-2.5 transition-colors ${
                        n.read ? 'bg-transparent hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-medium ${n.read ? 'text-slate-800' : 'text-blue-900 font-semibold'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {/* Profile Card & Mini Column Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-50"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-100 shadow-sm">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                alt={currentUser?.name || 'User Avatar'}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-[#183B66] leading-tight">
                {currentUser?.name || 'Pengguna'}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {role === 'admin' ? 'Administrator' : 'Peserta Magang'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform hidden sm:block" />
          </button>

          {/* Profile Mini Card Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Avatar & Info */}
              <div className="flex flex-col items-center text-center pb-3.5 border-b border-slate-100">
                <div className="mb-2.5">
                  {/* Click Avatar to Enlarge */}
                  <div 
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLargeAvatar(true);
                    }}
                    className="h-16 w-16 overflow-hidden rounded-full ring-4 ring-blue-50 shadow-md cursor-pointer hover:ring-[#2F80ED] hover:scale-105 transition-all"
                    title="Klik untuk memperbesar foto"
                  >
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                      alt={currentUser?.name || 'User Avatar'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <p 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowLargeAvatar(true);
                  }}
                  className="text-sm font-bold text-[#183B66] cursor-pointer hover:text-[#2F80ED] transition"
                  title="Klik untuk memperbesar foto"
                >
                  {currentUser?.name || 'Pengguna'}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-[220px]">{currentUser?.email}</p>

                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#2F80ED]">
                    <Shield className="h-3 w-3" />
                    {role === 'admin' ? 'Administrator' : `NIM: ${currentUser?.nim || '-'}`}
                  </span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="pt-2 space-y-1">
                {onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate('pengaturan');
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    <span>Profil & Data Diri Lengkap</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#EB5757] hover:bg-red-50 transition text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Preview Perbesar Foto Profil (Lightbox) */}
      {showLargeAvatar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowLargeAvatar(false)}
        >
          <div 
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900">{currentUser?.name || 'Foto Profil'}</h3>
                <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
              </div>
              <button
                onClick={() => setShowLargeAvatar(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Foto Diperbesar */}
            <div className="relative mx-auto w-64 h-64 overflow-hidden rounded-2xl bg-slate-100 shadow-inner flex items-center justify-center border border-slate-200">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                alt={currentUser?.name || 'User Avatar'}
                className="w-full h-full object-cover"
              />
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium">
                  <RefreshCw className="h-6 w-6 animate-spin mb-2" />
                  <span>Mengunggah foto...</span>
                </div>
              )}
            </div>

            {uploadSuccess && (
              <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center justify-center gap-1">
                <Check className="h-4 w-4" /> Foto profil berhasil diubah!
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:border-[#2F80ED] hover:bg-blue-50 hover:text-[#2F80ED] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span>{isUploadingPhoto ? 'Mengunggah...' : 'Ganti Foto'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLargeAvatar(false)}
                className="rounded-xl bg-[#2F80ED] px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-md transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
