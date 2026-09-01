import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  UserX, 
  UserCheck, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { User } from '../../types';

export const DataPesertaAdminView: React.FC = () => {
  const { students, addStudent, updateStudent, toggleStudentStatus } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [viewDetailStudent, setViewDetailStudent] = useState<User | null>(null);

  // New Student Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nim: '',
    phone: '',
    university: 'Universitas Indonesia',
    major: 'Sistem Informasi',
    concentration: 'Pengembangan Sistem Informasi',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    birthPlace: 'Jakarta',
    birthDate: '2003-05-15',
    startDate: '2025-05-20',
    endDate: '2025-08-20',
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      nim: '',
      phone: '',
      university: 'Universitas Indonesia',
      major: 'Sistem Informasi',
      concentration: 'Pengembangan Sistem Informasi',
      gender: 'Laki-laki',
      birthPlace: 'Jakarta',
      birthDate: '2003-05-15',
      startDate: '2025-05-20',
      endDate: '2025-08-20',
      status: 'Aktif'
    });
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.nim) {
      alert('Nama, Email, dan NIM wajib diisi!');
      return;
    }

    const username = formData.name.toLowerCase().replace(/\s+/g, '.');
    addStudent({
      name: formData.name,
      email: formData.email,
      role: 'mahasiswa',
      username: username,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      nim: formData.nim,
      phone: formData.phone,
      university: formData.university,
      major: formData.major,
      concentration: formData.concentration,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status
    });

    setIsAddModalOpen(false);
    resetForm();
    setToastMessage('Peserta magang baru berhasil didaftarkan ke sistem!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      name: editingStudent.name,
      email: editingStudent.email,
      nim: editingStudent.nim,
      phone: editingStudent.phone,
      university: editingStudent.university,
      major: editingStudent.major,
      concentration: editingStudent.concentration,
      startDate: editingStudent.startDate,
      endDate: editingStudent.endDate,
      status: editingStudent.status
    });

    setEditingStudent(null);
    setToastMessage('Data peserta magang berhasil diperbarui!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    if (s.role === 'admin') return false;
    const matchQuery = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nim && s.nim.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.university && s.university.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchUniv = filterUniversity === 'Semua' || s.university === filterUniversity;
    const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;

    return matchQuery && matchUniv && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Data Peserta Magang</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data registrasi, status, penempatan, dan masa aktif seluruh mahasiswa magang
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Peserta
        </button>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, NIM, email, atau universitas..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* University Filter */}
            <select
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            >
              <option value="Semua">Semua Universitas</option>
              <option value="Universitas Indonesia">Universitas Indonesia</option>
              <option value="Institut Teknologi Bandung">ITB</option>
              <option value="Universitas Gadjah Mada">UGM</option>
              <option value="Institut Teknologi Sepuluh Nopember">ITS</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-3">Mahasiswa</th>
                <th className="pb-3 px-3">NIM & Kontak</th>
                <th className="pb-3 px-3">Asal Universitas</th>
                <th className="pb-3 px-3">Konsentrasi Magang</th>
                <th className="pb-3 px-3">Periode</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 pl-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data peserta magang yang sesuai
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mahasiswa Name & Avatar */}
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100 shadow-sm">
                          <img
                            src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                            alt={student.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[11px] text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* NIM & Phone */}
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-800">{student.nim || '-'}</p>
                      <p className="text-[11px] text-slate-400">{student.phone || '-'}</p>
                    </td>

                    {/* University & Major */}
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-slate-800">{student.university || '-'}</p>
                      <p className="text-[11px] text-slate-500">{student.major || '-'}</p>
                    </td>

                    {/* Concentration */}
                    <td className="py-3.5 px-3 text-slate-700">
                      {student.concentration || '-'}
                    </td>

                    {/* Periode */}
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="text-[11px]">
                        <span>{student.startDate || '20 Mei 2025'}</span>
                        <div className="text-slate-400">s/d {student.endDate || '20 Agu 2025'}</div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {student.status === 'Aktif' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#27AE60] border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewDetailStudent(student)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[#2F80ED]"
                          title="Lihat Detail Profil"
                        >
                          <GraduationCap className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setEditingStudent(student)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit Data Peserta"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => toggleStudentStatus(student.id)}
                          className={`rounded-lg p-1.5 ${
                            student.status === 'Aktif'
                              ? 'text-slate-400 hover:bg-rose-50 hover:text-[#EB5757]'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-[#27AE60]'
                          }`}
                          title={student.status === 'Aktif' ? 'Nonaktifkan Peserta' : 'Aktifkan Peserta'}
                        >
                          {student.status === 'Aktif' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Peserta Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#183B66]">Tambah Peserta Magang Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Rian Anggara"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Mahasiswa *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rian.anggara@email.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIM *</label>
                  <input
                    type="text"
                    value={formData.nim}
                    onChange={e => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="2201998877"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-9876-5432"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asal Universitas</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={e => setFormData({ ...formData, university: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={e => setFormData({ ...formData, major: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Konsentrasi Magang</label>
                  <input
                    type="text"
                    value={formData.concentration}
                    onChange={e => setFormData({ ...formData, concentration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai Magang</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Selesai Magang</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Peserta */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditingStudent(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#183B66]">Edit Data Peserta Magang</h3>
              <button onClick={() => setEditingStudent(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIM</label>
                  <input
                    type="text"
                    value={editingStudent.nim || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, nim: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={editingStudent.phone || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Universitas</label>
                  <input
                    type="text"
                    value={editingStudent.university || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, university: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
                  <input
                    type="text"
                    value={editingStudent.major || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, major: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Profil Peserta */}
      {viewDetailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setViewDetailStudent(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#183B66]">Detail Profil Mahasiswa</h3>
              <button onClick={() => setViewDetailStudent(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full overflow-hidden ring-4 ring-slate-100 shadow-md">
                <img
                  src={viewDetailStudent.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                  alt={viewDetailStudent.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#183B66]">{viewDetailStudent.name}</h4>
              <p className="text-xs text-slate-500">{viewDetailStudent.email}</p>
              <span className="mt-1 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-700">
                Status: {viewDetailStudent.status}
              </span>
            </div>

            <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-400">NIM:</span> <span className="font-semibold">{viewDetailStudent.nim || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Universitas:</span> <span className="font-semibold">{viewDetailStudent.university || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Jurusan:</span> <span className="font-semibold">{viewDetailStudent.major || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Konsentrasi:</span> <span className="font-semibold">{viewDetailStudent.concentration || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Telepon:</span> <span className="font-semibold">{viewDetailStudent.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Periode Magang:</span> <span className="font-semibold">{viewDetailStudent.startDate} s/d {viewDetailStudent.endDate}</span></div>
            </div>

            <button
              onClick={() => setViewDetailStudent(null)}
              className="mt-5 w-full rounded-xl bg-[#2F80ED] py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
