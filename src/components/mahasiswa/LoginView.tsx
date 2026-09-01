import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Monitor, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login, loginAsDemo } = useAuth();

  const [email, setEmail] = useState('andi.pratama@email.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Silakan masukkan email mahasiswa.');
      return;
    }

    const res = login(email, password, rememberMe);
    if (!res.success) {
      setErrorMsg(res.message || 'Email atau kata sandi tidak valid.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#F4F8FD] p-4 overflow-hidden">
      {/* Decorative Background Elements */}
      {/* Left Dots Pattern */}
      <div className="absolute left-8 sm:left-24 top-1/2 -translate-y-1/2 hidden md:grid grid-cols-6 gap-3 opacity-30 pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]" />
        ))}
      </div>

      {/* Right 3D Isometric Art Decoration (SVG Representation matching screenshot) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[480px] h-[580px] hidden lg:block pointer-events-none opacity-85">
        <svg viewBox="0 0 500 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Soft background glow */}
          <circle cx="350" cy="300" r="220" fill="url(#bg_glow)" opacity="0.4" />
          
          {/* Isometric Base Pedestal */}
          <g transform="translate(180, 260)">
            {/* Top platform */}
            <path d="M 120 0 L 240 70 L 120 140 L 0 70 Z" fill="#D6E6FE" />
            <path d="M 0 70 L 120 140 L 120 170 L 0 100 Z" fill="#ADC8F7" />
            <path d="M 120 140 L 240 70 L 240 100 L 120 170 Z" fill="#8BB2F1" />

            {/* Profile ID Card float */}
            <g transform="translate(40, -160)">
              <rect x="0" y="0" width="130" height="180" rx="16" fill="white" opacity="0.8" />
              <rect x="0" y="0" width="130" height="180" rx="16" stroke="#2F80ED" strokeWidth="1.5" opacity="0.3" />
              {/* Avatar circle */}
              <circle cx="65" cy="45" r="22" fill="#ADC8F7" />
              <circle cx="65" cy="40" r="10" fill="#2F80ED" opacity="0.6" />
              <path d="M 47 62 C 47 53 83 53 83 62 Z" fill="#2F80ED" opacity="0.6" />
              {/* Lines */}
              <rect x="25" y="85" width="80" height="6" rx="3" fill="#D6E6FE" />
              <rect x="25" y="100" width="60" height="6" rx="3" fill="#EBF3FE" />
              <rect x="25" y="115" width="70" height="6" rx="3" fill="#EBF3FE" />
            </g>

            {/* Checkmark badge float */}
            <g transform="translate(-10, -20)">
              <circle cx="30" cy="30" r="28" fill="white" opacity="0.9" />
              <circle cx="30" cy="30" r="24" fill="#56CCF2" opacity="0.8" />
              <path d="M 20 30 L 27 37 L 40 22" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Bar charts isometric */}
            <g transform="translate(100, 30)">
              {/* Bar 1 */}
              <path d="M 10 20 L 20 14 L 20 60 L 10 66 Z" fill="#2F80ED" />
              <path d="M 20 14 L 30 20 L 30 66 L 20 60 Z" fill="#183B66" />
              <path d="M 10 20 L 20 14 L 30 20 L 20 26 Z" fill="#56CCF2" />
              {/* Bar 2 */}
              <path d="M 35 5 L 45 -1 L 45 60 L 35 66 Z" fill="#2F80ED" />
              <path d="M 45 -1 L 55 5 L 55 66 L 45 60 Z" fill="#183B66" />
              <path d="M 35 5 L 45 -1 L 55 5 L 45 11 Z" fill="#56CCF2" />
              {/* Bar 3 */}
              <path d="M 60 -10 L 70 -16 L 70 60 L 60 66 Z" fill="#2F80ED" />
              <path d="M 70 -16 L 80 -10 L 80 66 L 70 60 Z" fill="#183B66" />
              <path d="M 60 -10 L 70 -16 L 80 -10 L 70 -4 Z" fill="#56CCF2" />
            </g>
          </g>

          <defs>
            <radialGradient id="bg_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(350 300) rotate(90) scale(220)">
              <stop stopColor="#2F80ED" stopOpacity="0.25" />
              <stop offset="1" stopColor="#2F80ED" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Main Login Card - Pixel Perfect to Reference */}
      <div className="relative z-10 w-full max-w-[460px] rounded-[24px] bg-white p-8 sm:p-10 shadow-[0_10px_40px_-5px_rgba(24,59,102,0.08)] border border-slate-100/80">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-bold text-[#183B66]">
            Selamat Datang Kembali
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Masuk untuk melanjutkan aktivitas magang Anda
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-[#EB5757] border border-rose-100 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Mahasiswa
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email mahasiswa"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#2F80ED] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#2F80ED] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                aria-label="Tampilkan kata sandi"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#2F80ED] focus:ring-[#2F80ED]"
              />
              <span className="text-xs text-slate-600">Ingat saya</span>
            </label>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-medium text-[#2F80ED] hover:underline"
            >
              Lupa kata sandi?
            </button>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2F80ED] py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-600 active:scale-[0.99]"
          >
            Masuk
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs text-slate-400">
            atau
          </span>
        </div>

        {/* Demo Login Button */}
        <button
          type="button"
          onClick={() => setShowDemoModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2F80ED] bg-white py-3 text-sm font-semibold text-[#2F80ED] transition-all hover:bg-blue-50/50 active:scale-[0.99]"
        >
          <Monitor className="h-4 w-4" />
          Masuk sebagai Demo
        </button>

        {/* Footer Help */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Belum memiliki akun?{' '}
          <button
            onClick={() => alert('Silakan hubungi Administrator Kampus atau Person In Charge (PIC) magang Anda untuk pendaftaran email resmi.')}
            className="font-medium text-[#2F80ED] hover:underline"
          >
            Hubungi administrator
          </button>
        </div>
      </div>

      {/* Demo Selection Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowDemoModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#183B66]">Pilih Akun Demo</h3>
            <p className="mt-1 text-xs text-slate-500">
              Pilih peran yang ingin Anda jelajahi untuk menguji seluruh fitur MagangKu:
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => {
                  loginAsDemo('mahasiswa');
                  setShowDemoModal(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition-all hover:border-[#2F80ED] hover:bg-blue-50/40"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-100">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                    alt="Andi Pratama"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Andi Pratama (Mahasiswa)</h4>
                  <p className="text-[11px] text-slate-500">andi.pratama@email.com</p>
                  <span className="inline-block mt-0.5 text-[10px] font-medium text-[#2F80ED]">Universitas Indonesia</span>
                </div>
              </button>

              <button
                onClick={() => {
                  loginAsDemo('admin');
                  setShowDemoModal(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition-all hover:border-[#2F80ED] hover:bg-blue-50/40"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-100">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                    alt="Admin"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Admin Pusat (Administrator)</h4>
                  <p className="text-[11px] text-slate-500">admin@magangku.id</p>
                  <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-600">Hak Akses Penuh Sistem</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowDemoModal(false)}
              className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowForgotModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-[#183B66]">Pemulihan Kata Sandi</h3>
            
            {forgotSubmitted ? (
              <div className="mt-4 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-[#27AE60]" />
                <h4 className="mt-2 text-sm font-bold text-slate-800">Tautan Terkirim!</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Instruksi pemulihan kata sandi telah dikirim ke email mahasiswa Anda.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="mt-4 w-full rounded-xl bg-[#2F80ED] py-2.5 text-xs font-semibold text-white"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-500">
                  Masukkan email mahasiswa Anda untuk menerima tautan pengaturan ulang kata sandi:
                </p>
                <input
                  type="email"
                  defaultValue={email}
                  placeholder="andi.pratama@email.com"
                  className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => setForgotSubmitted(true)}
                    className="flex-1 rounded-xl bg-[#2F80ED] py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    Kirim Tautan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
