import React, { useState } from 'react';
import { Building2, UserCheck, Plus, Mail, Phone, MapPin, X } from 'lucide-react';

export const PembimbingPerusahaanView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pembimbing' | 'perusahaan'>('pembimbing');

  const mentors = [
    { id: '1', name: 'Dr. Ir. Hendra Kusuma, M.Kom', role: 'Pembimbing Akademik', university: 'Universitas Indonesia', email: 'hendra.kusuma@ui.ac.id', studentsCount: 14, phone: '0811-2233-4455' },
    { id: '2', name: 'Bambang Triyono, S.T., M.T.', role: 'Pembimbing Industri (PIC)', company: 'PT Inovasi Digital Nusantara', email: 'bambang@inovasidigital.co.id', studentsCount: 22, phone: '0812-3344-5566' },
    { id: '3', name: 'Dewi Lestari, M.Sc.', role: 'Pembimbing Akademik', university: 'Institut Teknologi Bandung', email: 'dewi.lestari@itb.ac.id', studentsCount: 18, phone: '0813-4455-6677' },
  ];

  const companies = [
    { id: '1', name: 'PT Inovasi Digital Nusantara', address: 'Jl. Sudirman Kav 52-53, Jakarta Selatan', internsCount: 45, mentorsCount: 8, status: 'Aktif Mitra' },
    { id: '2', name: 'Bank Central Mandiri Digital Lab', address: 'Gedung Wisma 46 Lt. 18, Jakarta Pusat', internsCount: 38, mentorsCount: 6, status: 'Aktif Mitra' },
    { id: '3', name: 'Tech Nusantara Solutions', address: 'Kawasan Digital Valley, BSD City, Tangerang', internsCount: 45, mentorsCount: 7, status: 'Aktif Mitra' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Pembimbing & Mitra Perusahaan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data pembimbing lapangan/akademik dan instansi mitra penempatan magang
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('pembimbing')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeSubTab === 'pembimbing' ? 'bg-[#2F80ED] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Data Pembimbing
          </button>
          <button
            onClick={() => setActiveSubTab('perusahaan')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeSubTab === 'perusahaan' ? 'bg-[#2F80ED] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mitra Perusahaan
          </button>
        </div>
      </div>

      {activeSubTab === 'pembimbing' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {mentors.map(m => (
            <div key={m.id} className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2F80ED]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#2F80ED]">
                  {m.studentsCount} Mahasiswa
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                <p className="text-xs text-slate-500">{m.role}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{m.university || m.company}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> <span>{m.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> <span>{m.phone}</span></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {companies.map(c => (
            <div key={c.id} className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {c.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <span>{c.address}</span>
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-xs text-slate-600 font-medium">
                <span>Peserta: <strong>{c.internsCount}</strong></span>
                <span>Mentor: <strong>{c.mentorsCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
