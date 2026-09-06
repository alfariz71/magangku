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
  const { students, updateStudent, toggleStudentStatus } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Modal states
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [viewDetailStudent, setViewDetailStudent] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    const nameLower = s.name.toLowerCase();
    if (nameLower.includes('administrator') || nameLower === 'admin') return false;
    if (s.role === 'admin' && s.email !== 'ikhsanfadil047103@gmail.com' && !nameLower.includes('ikhsan')) return false;
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
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                        <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-slate-100 shrink-0">
                          <img
                            src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                            alt={student.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* NIM & Kontak */}
                    <td className="py-3.5 px-3">
                      <p className="font-mono text-xs text-slate-800">{student.nim || '-'}</p>
                      <p className="text-[11px] text-slate-500">{student.phone || '-'}</p>
                    </td>

                    {/* Universitas & Jurusan */}
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-800">{student.university || '-'}</p>
                      <p className="text-[11px] text-slate-500">{student.major || '-'}</p>
                    </td>

                    {/* Konsentrasi Magang */}
                    <td className="py-3.5 px-3">
                      {student.concentration && student.concentration.trim() && student.concentration.trim().toLowerCase() !== 'peserta magang' ? (
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2F80ED]">
                          {student.concentration}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Periode */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-600">
                      {student.startDate ? `${student.startDate} s/d ${student.endDate || '-'}` : '-'}
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

        {/* Mobile Card-based View */}
        <div className="block md:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ditemukan data peserta magang yang sesuai
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={`m-student-${student.id}`}
                className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs space-y-3"
              >
                {/* Header: Avatar, Name, Status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-100 shrink-0">
                      <img
                        src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                        alt={student.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 text-sm truncate">{student.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{student.nim || '-'}</p>
                    </div>
                  </div>

                  {student.status === 'Aktif' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#27AE60] border border-emerald-200 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60]" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Nonaktif
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-lg p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Universitas</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{student.university || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Jurusan</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{student.major || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">No. HP</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{student.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Konsentrasi</span>
                    {student.concentration && student.concentration.trim() && student.concentration.trim().toLowerCase() !== 'peserta magang' ? (
                      <span className="font-semibold text-[#2F80ED] line-clamp-1">{student.concentration}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setViewDetailStudent(student)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-[#2F80ED]" />
                    <span>Detail</span>
                  </button>

                  <button
                    onClick={() => setEditingStudent(student)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => toggleStudentStatus(student.id)}
                    className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition ${
                      student.status === 'Aktif'
                        ? 'border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100'
                    }`}
                  >
                    {student.status === 'Aktif' ? (
                      <>
                        <UserX className="h-3.5 w-3.5" />
                        <span>Nonaktif</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konsentrasi Magang</label>
                <input
                  type="text"
                  value={editingStudent.concentration || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, concentration: e.target.value })}
                  placeholder="Contoh: Frontend Engineering, Data Science"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
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
              <div className="flex justify-between"><span className="text-slate-400">Konsentrasi:</span> <span className="font-semibold">{viewDetailStudent.concentration && viewDetailStudent.concentration.trim() && viewDetailStudent.concentration.trim().toLowerCase() !== 'peserta magang' ? viewDetailStudent.concentration : '-'}</span></div>
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
