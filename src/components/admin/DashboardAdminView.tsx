import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Calendar, 
  Info, 
  ChevronRight, 
  FileText, 
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface DashboardAdminViewProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardAdminView: React.FC<DashboardAdminViewProps> = ({ onNavigateTab }) => {
  const { auditLogs, leaveRequests, attendances } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<'Minggu Ini' | 'Minggu Lalu' | 'Bulan Ini'>('Minggu Ini');

  // Chart data matching screenshot
  const weeklyData = [
    { day: 'Senin', date: '19/05', hadir: 92, terlambat: 5, izin: 3 },
    { day: 'Selasa', date: '20/05', hadir: 95, terlambat: 3, izin: 2 },
    { day: 'Rabu', date: '21/05', hadir: 90, terlambat: 6, izin: 4 },
    { day: 'Kamis', date: '22/05', hadir: 88, terlambat: 7, izin: 5 },
    { day: 'Jumat', date: '23/05', hadir: 93, terlambat: 5, izin: 2 },
    { day: 'Sabtu', date: '24/05', hadir: 70, terlambat: 10, izin: 20 },
    { day: 'Minggu', date: '25/05', hadir: 65, terlambat: 12, izin: 23 },
  ];

  const pendingLeaves = leaveRequests.filter(l => l.status === 'Menunggu').length || 7;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Dashboard Admin</h2>
      </div>

      {/* Top 4 Stat Cards - Exact matching screenshot */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Peserta */}
        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EBF3FE] text-[#2F80ED]">
              <Users className="h-5 w-5" />
            </div>
            <button className="text-slate-300 hover:text-slate-500" title="Informasi">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Total Peserta</span>
            <p className="text-2xl font-bold text-[#2F80ED] leading-none mt-1">128</p>
            <p className="text-[11px] text-slate-400 mt-1">Seluruh peserta aktif</p>
          </div>
        </div>

        {/* Card 2: Hadir Hari Ini */}
        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F8EE] text-[#27AE60]">
              <UserCheck className="h-5 w-5" />
            </div>
            <button className="text-slate-300 hover:text-slate-500" title="Informasi">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Hadir Hari Ini</span>
            <p className="text-2xl font-bold text-[#27AE60] leading-none mt-1">112</p>
            <p className="text-[11px] text-slate-400 mt-1">Dari total peserta aktif</p>
          </div>
        </div>

        {/* Card 3: Terlambat */}
        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FDEEEE] text-[#EB5757]">
              <Clock className="h-5 w-5" />
            </div>
            <button className="text-slate-300 hover:text-slate-500" title="Informasi">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Terlambat</span>
            <p className="text-2xl font-bold text-[#EB5757] leading-none mt-1">9</p>
            <p className="text-[11px] text-slate-400 mt-1">Hari ini</p>
          </div>
        </div>

        {/* Card 4: Izin */}
        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF8E8] text-[#F2994A]">
              <Calendar className="h-5 w-5" />
            </div>
            <button className="text-slate-300 hover:text-slate-500" title="Informasi">
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Izin</span>
            <p className="text-2xl font-bold text-[#F2994A] leading-none mt-1">7</p>
            <p className="text-[11px] text-slate-400 mt-1">Hari ini</p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Ringkasan Absensi Mingguan (Left) & Pengingat (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Ringkasan Absensi Mingguan Chart */}
        <div className="lg:col-span-8 rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-[#183B66]">
              Ringkasan Absensi Mingguan
            </h3>

            {/* Filter Period Dropdown */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-[#2F80ED] focus:bg-white focus:outline-none"
              >
                <option value="Minggu Ini">Minggu Ini</option>
                <option value="Minggu Lalu">Minggu Lalu</option>
                <option value="Bulan Ini">Bulan Ini</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-6">
            {/* Grid & Bars Container */}
            <div className="relative h-64 w-full">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="flex items-center w-full">
                    <span className="w-8 text-[10px] text-slate-400">{val}%</span>
                    <div className="h-px w-full border-b border-dashed border-slate-100" />
                  </div>
                ))}
              </div>

              {/* Bars Columns */}
              <div className="absolute inset-0 pl-9 flex items-end justify-between pr-2">
                {weeklyData.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center group relative h-full justify-end w-12">
                    {/* Bar Cluster */}
                    <div className="flex items-end gap-1 mb-2">
                      {/* Hadir Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[#2F80ED] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {item.hadir}%
                        </span>
                        <div
                          style={{ height: `${(item.hadir / 100) * 190}px` }}
                          className="w-3 rounded-t-sm bg-[#2F80ED] shadow-sm transition-all group-hover:brightness-110"
                        />
                      </div>

                      {/* Terlambat Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-[#EB5757] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {item.terlambat}%
                        </span>
                        <div
                          style={{ height: `${(item.terlambat / 100) * 190}px` }}
                          className="w-2.5 rounded-t-sm bg-[#EB5757] shadow-sm transition-all group-hover:brightness-110"
                        />
                      </div>

                      {/* Izin Bar */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-[#F2994A] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {item.izin}%
                        </span>
                        <div
                          style={{ height: `${(item.izin / 100) * 190}px` }}
                          className="w-2.5 rounded-t-sm bg-[#F2C94C] shadow-sm transition-all group-hover:brightness-110"
                        />
                      </div>
                    </div>

                    {/* Day & Date Labels */}
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-slate-700">{item.day}</p>
                      <p className="text-[10px] text-slate-400">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex items-center justify-center gap-6 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#2F80ED]" />
                <span>Hadir</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#EB5757]" />
                <span>Terlambat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#F2C94C]" />
                <span>Izin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Pengingat */}
        <div className="lg:col-span-4 rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-4">
              Pengingat
            </h3>

            <div className="mt-4 space-y-3">
              {/* Item 1: Jurnal menunggu pemeriksaan */}
              <div
                onClick={() => onNavigateTab('aktivitas')}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-[#2F80ED]/40 hover:bg-blue-50/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF3FE] text-[#2F80ED]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#2F80ED]">
                      12 jurnal menunggu pemeriksaan
                    </h4>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#2F80ED] group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Item 2: Pengajuan izin perlu ditinjau */}
              <div
                onClick={() => onNavigateTab('izin')}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-[#F2994A]/40 hover:bg-amber-50/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF8E8] text-[#F2994A]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#F2994A]">
                      {pendingLeaves} pengajuan izin perlu ditinjau
                    </h4>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#F2994A] group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Item 3: Peserta belum absen pulang */}
              <div
                onClick={() => onNavigateTab('absensi')}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-[#27AE60]/40 hover:bg-emerald-50/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F8EE] text-[#27AE60]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#27AE60]">
                      9 peserta belum absen pulang
                    </h4>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#27AE60] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-right">
            <button
              onClick={() => onNavigateTab('absensi')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F80ED] hover:underline"
            >
              <span>Lihat semua pengingat</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Aktivitas Terbaru - Exact matching screenshot */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-[#183B66]">
            Aktivitas Terbaru
          </h3>
          <button
            onClick={() => onNavigateTab('pengaturan')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F80ED] hover:underline"
          >
            <span>Lihat semua aktivitas</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 font-bold">
                <th className="pb-3 pr-4 w-48">Waktu</th>
                <th className="pb-3 px-4 w-44">Aktivitas</th>
                <th className="pb-3 px-4">Detail</th>
                <th className="pb-3 pl-4 w-40">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 pr-4 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {log.action === 'Pengajuan Izin' && (
                      <span className="rounded-full bg-[#FEF8E8] px-3 py-1 text-xs font-semibold text-[#F2994A] border border-[#F2994A]/25">
                        Pengajuan Izin
                      </span>
                    )}
                    {log.action === 'Jurnal Diperbarui' && (
                      <span className="rounded-full bg-[#E8F8EE] px-3 py-1 text-xs font-semibold text-[#27AE60] border border-[#27AE60]/25">
                        Jurnal Diperbarui
                      </span>
                    )}
                    {log.action === 'Peserta Baru' && (
                      <span className="rounded-full bg-[#EBF3FE] px-3 py-1 text-xs font-semibold text-[#2F80ED] border border-[#2F80ED]/25">
                        Peserta Baru
                      </span>
                    )}
                    {log.action === 'Perusahaan Diperbarui' && (
                      <span className="rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-semibold text-[#9333EA] border border-[#9333EA]/25">
                        Perusahaan Diperbarui
                      </span>
                    )}
                    {log.action.includes('Absensi') && (
                      <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#0284C7] border border-[#0284C7]/25">
                        Absensi Diperbarui
                      </span>
                    )}
                    {!['Pengajuan Izin', 'Jurnal Diperbarui', 'Peserta Baru', 'Perusahaan Diperbarui'].some(k => log.action.includes(k)) && !log.action.includes('Absensi') && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {log.action}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">
                    {log.details}
                  </td>
                  <td className="py-3.5 pl-4 text-slate-600 whitespace-nowrap">
                    {log.performedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
