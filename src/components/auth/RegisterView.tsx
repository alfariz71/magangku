import React, { useState } from 'react';
import { Eye, EyeOff, Check, AlertCircle, User as UserIcon, Mail, Lock, Phone, GraduationCap, MapPin, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface RegisterViewProps {
  onGoToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onGoToLogin }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nim: '',
    birthPlace: '',
    birthDate: '',
    gender: '' as 'Laki-laki' | 'Perempuan' | '',
    university: '',
    faculty: '',
    major: '',
    concentration: '',
    position: '',
    startDate: '',
    endDate: '',
    agreePolicy: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name || formData.name.length < 3) newErrors.name = 'Nama lengkap minimal 3 karakter';
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email tidak valid';
      if (!formData.password || formData.password.length < 8) newErrors.password = 'Password minimal 8 karakter';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Password tidak cocok';
      if (!formData.phone || !/^[\d\s-]{9,}$/.test(formData.phone)) newErrors.phone = 'Nomor telepon tidak valid';
    } else if (currentStep === 2) {
      if (!formData.birthPlace) newErrors.birthPlace = 'Tempat lahir wajib diisi';
      if (!formData.birthDate) {
        newErrors.birthDate = 'Tanggal lahir wajib diisi';
      } else {
        const today = new Date();
        const birthDate = new Date(formData.birthDate);
        if (birthDate > today) newErrors.birthDate = 'Tanggal lahir tidak valid';
      }
      if (!formData.gender) newErrors.gender = 'Pilih jenis kelamin';
      if (!formData.nim) newErrors.nim = 'NIM/NIS wajib diisi';
    } else if (currentStep === 3) {
      if (!formData.university) newErrors.university = 'Universitas/Sekolah wajib diisi';
      if (!formData.major) newErrors.major = 'Program studi/Jurusan wajib diisi';
      if (!formData.position) newErrors.position = 'Posisi magang wajib diisi';
      if (!formData.startDate) newErrors.startDate = 'Tanggal mulai wajib diisi';
      if (!formData.endDate) {
        newErrors.endDate = 'Tanggal selesai wajib diisi';
      } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai';
      }
      if (!formData.agreePolicy) newErrors.agreePolicy = 'Anda harus menyetujui kebijakan privasi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);
    setServerError('');
    try {
      const submitData = {
        ...formData,
        gender: formData.gender as 'Laki-laki' | 'Perempuan'
      };
      await register(submitData);
      alert('Pendaftaran berhasil! Silakan login.');
      onGoToLogin();
    } catch (error: any) {
      setServerError(error.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-[#183B66]">Daftar Akun Baru</h2>
          <p className="mt-2 text-sm text-gray-600">
            Lengkapi data di bawah ini untuk bergabung dengan MagangKu
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow sm:rounded-2xl sm:px-10">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded">
                <div 
                  className="h-full bg-[#2F80ED] transition-all duration-300 rounded" 
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>
              </div>
              {[1, 2, 3].map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step > s ? 'bg-green-500 text-white' : step === s ? 'bg-[#2F80ED] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  <span className={`absolute -bottom-6 text-xs whitespace-nowrap font-medium ${
                    step >= s ? 'text-[#183B66]' : 'text-gray-400'
                  }`}>
                    {s === 1 ? 'Akun' : s === 2 ? 'Pribadi' : 'Magang'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {serverError && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Lengkap *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:text-sm rounded-md h-10 border ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:text-sm rounded-md h-10 border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="contoh@email.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Telepon *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:text-sm rounded-md h-10 border ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="0812xxxxxx"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 sm:text-sm rounded-md h-10 border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="Minimal 8 karakter"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Konfirmasi Password *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 sm:text-sm rounded-md h-10 border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="Ketik ulang password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIM/NIS *</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nim"
                      value={formData.nim}
                      onChange={handleChange}
                      className={`block w-full pl-10 sm:text-sm rounded-md h-10 border ${errors.nim ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="Nomor Induk Mahasiswa/Siswa"
                    />
                  </div>
                  {errors.nim && <p className="mt-1 text-xs text-red-600">{errors.nim}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tempat Lahir *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="birthPlace"
                        value={formData.birthPlace}
                        onChange={handleChange}
                        className={`block w-full pl-10 sm:text-sm rounded-md h-10 border ${errors.birthPlace ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                        placeholder="Kota kelahiran"
                      />
                    </div>
                    {errors.birthPlace && <p className="mt-1 text-xs text-red-600">{errors.birthPlace}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Lahir *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        className={`block w-full px-3 sm:text-sm rounded-md h-10 border ${errors.birthDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      />
                    </div>
                    {errors.birthDate && <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Jenis Kelamin *</label>
                  <div className="mt-1">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`block w-full pl-3 pr-10 py-2 sm:text-sm rounded-md h-10 border bg-white ${errors.gender ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Universitas / Sekolah *</label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 sm:text-sm rounded-md h-10 border ${errors.university ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                    placeholder="Nama institusi pendidikan"
                  />
                  {errors.university && <p className="mt-1 text-xs text-red-600">{errors.university}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fakultas (Opsional)</label>
                    <input
                      type="text"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 sm:text-sm rounded-md h-10 border border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]"
                      placeholder="Fakultas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jurusan / Program Studi *</label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 sm:text-sm rounded-md h-10 border ${errors.major ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="Jurusan"
                    />
                    {errors.major && <p className="mt-1 text-xs text-red-600">{errors.major}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Konsentrasi (Opsional)</label>
                    <input
                      type="text"
                      name="concentration"
                      value={formData.concentration}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 sm:text-sm rounded-md h-10 border border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]"
                      placeholder="Konsentrasi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Posisi Magang *</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 sm:text-sm rounded-md h-10 border ${errors.position ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      placeholder="Posisi magang yang dilamar"
                    />
                    {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Mulai *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`block w-full pl-10 px-3 sm:text-sm rounded-md h-10 border ${errors.startDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      />
                    </div>
                    {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Selesai *</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`block w-full pl-10 px-3 sm:text-sm rounded-md h-10 border ${errors.endDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#2F80ED] focus:border-[#2F80ED]'}`}
                      />
                    </div>
                    {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="agreePolicy"
                        name="agreePolicy"
                        type="checkbox"
                        checked={formData.agreePolicy}
                        onChange={handleChange}
                        className="focus:ring-[#2F80ED] h-4 w-4 text-[#2F80ED] border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="agreePolicy" className="font-medium text-gray-700">
                        Saya menyatakan data yang saya isi adalah benar dan saya menyetujui kebijakan privasi aplikasi ini.
                      </label>
                      {errors.agreePolicy && <p className="mt-1 text-xs text-red-600">{errors.agreePolicy}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-1/3 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Kembali
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`${step === 1 ? 'w-full' : 'w-2/3'} flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#2F80ED] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED]`}
                >
                  Selanjutnya
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#2F80ED] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED] disabled:opacity-50"
                >
                  {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={onGoToLogin}
              className="text-sm font-medium text-[#2F80ED] hover:text-blue-600"
            >
              Sudah punya akun? Masuk di sini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
