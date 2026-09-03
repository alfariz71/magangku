import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';

interface RegisterViewProps {
  onGoToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onGoToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nim, setNim] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (!nim.trim()) {
      setError('NIM/NIS wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await register({ name, email, password, nim } as any);
      if (result.success) {
        setSuccessMessage(result.message || 'Akun kamu sudah dibuat. Silakan login.');
        setSuccess(true);
      } else {
        setError(result.message || 'Gagal mendaftar. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EBF3FE] to-white p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[#183B66] mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-sm text-slate-500 mb-6">{successMessage}</p>
          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-2xl bg-[#2F80ED] py-3 text-sm font-semibold text-white hover:bg-blue-600 transition mb-4"
          >
            Buka Gmail
          </a>
          <button
            onClick={onGoToLogin}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
          >
            Sudah konfirmasi? <span className="text-[#2F80ED] hover:underline">Masuk di sini</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EBF3FE] to-white p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onGoToLogin}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F80ED] shadow-lg shadow-blue-500/30">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#183B66]">Daftar Akun</h1>
            <p className="mt-1 text-sm text-slate-500">Buat akun MagangKu kamu</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#2F80ED] focus:bg-white focus:ring-2 focus:ring-[#2F80ED]/20 transition"
                disabled={isLoading}
              />
            </div>

            {/* NIM */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">NIM / NIS</label>
              <input
                type="text"
                value={nim}
                onChange={e => setNim(e.target.value)}
                placeholder="Masukkan NIM/NIS"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#2F80ED] focus:bg-white focus:ring-2 focus:ring-[#2F80ED]/20 transition"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#2F80ED] focus:bg-white focus:ring-2 focus:ring-[#2F80ED]/20 transition"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#2F80ED] focus:bg-white focus:ring-2 focus:ring-[#2F80ED]/20 transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#2F80ED] focus:bg-white focus:ring-2 focus:ring-[#2F80ED]/20 transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl bg-[#2F80ED] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 disabled:opacity-60 transition"
            >
              {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Sudah punya akun?{' '}
            <button onClick={onGoToLogin} className="font-semibold text-[#2F80ED] hover:underline">
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
