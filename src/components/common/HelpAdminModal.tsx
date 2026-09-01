import React, { useState } from 'react';
import { Headphones, Mail, Phone, MessageSquare, X, CheckCircle2, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HelpAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpAdminModal: React.FC<HelpAdminModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [topic, setTopic] = useState('Kendala Absensi & GPS');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2F80ED]">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#183B66]">Pusat Bantuan & Admin</h3>
              <p className="text-[11px] text-slate-400">Hubungi Helpdesk MagangKu</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#27AE60] animate-bounce" />
            <h4 className="mt-3 text-sm font-bold text-slate-900">Pesan Bantuan Terkirim!</h4>
            <p className="mt-1 text-xs text-slate-500">
              Tim Administrator akan segera menghubungi Anda via email atau WhatsApp.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Direct Contacts */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400 font-semibold">EMAIL HELPDESK</p>
                <p className="font-bold text-[#2F80ED] truncate mt-0.5">admin@magangku.id</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400 font-semibold">WHATSAPP PIC</p>
                <p className="font-bold text-emerald-600 mt-0.5">0811-9876-5432</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topik Bantuan</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                >
                  <option value="Kendala Absensi & GPS">Kendala Absensi & GPS</option>
                  <option value="Perubahan Data Diri / Email">Perubahan Data Diri / Email</option>
                  <option value="Pengajuan Izin Magang">Pengajuan Izin Magang</option>
                  <option value="Kendala Teknis Sistem">Kendala Teknis Sistem</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan / Pertanyaan</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Deskripsikan kendala atau pertanyaan Anda secara rinci..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#2F80ED] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-md"
                >
                  Kirim Pesan Bantuan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
