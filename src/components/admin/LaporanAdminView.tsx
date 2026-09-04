import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter, Calendar, Users, BarChart3, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useData } from '../../context/DataContext';

export const LaporanAdminView: React.FC = () => {
  const { attendances, leaveRequests, activities, students } = useData();

  const userStudents = students.filter(s => s.role === 'user');

  const [reportType, setReportType] = useState<'harian' | 'mingguan' | 'bulanan' | 'izin' | 'aktivitas'>('harian');
  const [selectedStudent, setSelectedStudent] = useState('Semua');
  const [selectedMonth, setSelectedMonth] = useState('Semua');

  // Dynamic month list (6 bulan terakhir)
  const monthOptions = React.useMemo(() => {
    const options = ['Semua'];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
    }
    return options;
  }, []);

  // Filter helper untuk bulan
  const matchesMonth = (dateStr?: string) => {
    if (selectedMonth === 'Semua' || !dateStr) return true;
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      const mStr = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return mStr.toLowerCase() === selectedMonth.toLowerCase();
    } catch {
      return true;
    }
  };

  // Filtered Data
  const filteredAttendances = attendances.filter(a => {
    if (selectedStudent !== 'Semua') {
      if (a.userId !== selectedStudent && a.studentName !== selectedStudent) return false;
    }
    if (!matchesMonth(a.date)) return false;
    return true;
  });

  const filteredLeaveRequests = leaveRequests.filter(r => {
    if (selectedStudent !== 'Semua') {
      if (r.userId !== selectedStudent && r.studentName !== selectedStudent) return false;
    }
    if (!matchesMonth(r.startDate || r.requestDate)) return false;
    return true;
  });

  const filteredActivities = activities.filter(a => {
    if (selectedStudent !== 'Semua') {
      if (a.userId !== selectedStudent && a.studentName !== selectedStudent) return false;
    }
    if (!matchesMonth(a.activityDate || a.date)) return false;
    return true;
  });

  const studentNameDisplay = selectedStudent === 'Semua' 
    ? 'Semua Peserta' 
    : (userStudents.find(s => s.id === selectedStudent)?.name || selectedStudent);

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(24, 59, 102);
    doc.text(`Laporan ${reportType.toUpperCase()} - MagangKu`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Periode: ${selectedMonth === 'Semua' ? 'Semua Periode' : selectedMonth} | Filter Peserta: ${studentNameDisplay}`, 14, 26);
    doc.text(`Dicetak oleh Administrator pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);

    let head: string[][] = [];
    let rows: string[][] = [];

    if (reportType === 'izin') {
      head = [['Nama Mahasiswa', 'NIM', 'Tgl Pengajuan', 'Periode Izin', 'Jenis Izin', 'Status']];
      rows = filteredLeaveRequests.map(r => [r.studentName, r.studentNim, r.requestDate, `${r.startDate} - ${r.endDate}`, r.leaveType, r.status]);
    } else if (reportType === 'aktivitas') {
      head = [['Mahasiswa', 'Hari', 'Tanggal', 'Judul Aktivitas', 'Waktu']];
      rows = filteredActivities.map(a => [a.studentName || '-', a.day || '-', a.date || a.activityDate || '-', a.title || '-', a.time || '-']);
    } else {
      head = [['Nama Mahasiswa', 'NIM', 'Tanggal', 'Hari', 'Masuk', 'Pulang', 'Total Jam', 'Status']];
      rows = filteredAttendances.map(a => [
        a.studentName,
        a.studentNim,
        a.date,
        a.dayName,
        a.checkInTime || '-',
        a.checkOutTime || '-',
        a.totalHours || '-',
        a.status
      ]);
    }

    autoTable(doc, {
      startY: 38,
      head: head,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [47, 128, 237] },
      styles: { fontSize: 8 }
    });

    doc.save(`Laporan_MagangKu_${reportType}_${Date.now()}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    let dataToExport: any[] = [];

    if (reportType === 'izin') {
      dataToExport = filteredLeaveRequests.map(r => ({
        'Nama Mahasiswa': r.studentName,
        'NIM': r.studentNim,
        'Universitas': r.university,
        'Tgl Pengajuan': r.requestDate,
        'Periode': `${r.startDate} - ${r.endDate}`,
        'Jenis Izin': r.leaveType,
        'Alasan': r.reason,
        'Status': r.status
      }));
    } else if (reportType === 'aktivitas') {
      dataToExport = filteredActivities.map(a => ({
        'Nama Mahasiswa': a.studentName || '-',
        'Hari': a.day || '-',
        'Tanggal': a.date || a.activityDate || '-',
        'Judul Aktivitas': a.title,
        'Waktu': a.time || '-'
      }));
    } else {
      dataToExport = filteredAttendances.map(a => ({
        'Nama Mahasiswa': a.studentName,
        'NIM': a.studentNim,
        'Universitas': a.university,
        'Tanggal': a.date,
        'Hari': a.dayName,
        'Absen Masuk': a.checkInTime || '-',
        'Absen Pulang': a.checkOutTime || '-',
        'Total Jam': a.totalHours || '-',
        'Status': a.status
      }));
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${reportType}`);
    XLSX.writeFile(wb, `Laporan_MagangKu_${reportType}_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Laporan & Rekapitulasi Sistem</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ekspor rekapitulasi absensi harian, mingguan, bulanan, izin, dan log aktivitas ke format PDF atau Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Excel (.xlsx)
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="h-4 w-4" />
            Unduh PDF
          </button>
        </div>
      </div>

      {/* Tabs for Report Types */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'harian', label: 'Rekap Absensi Harian' },
          { id: 'mingguan', label: 'Rekap Absensi Mingguan' },
          { id: 'bulanan', label: 'Rekap Absensi Bulanan' },
          { id: 'izin', label: 'Rekap Pengajuan Izin' },
          { id: 'aktivitas', label: 'Rekap Aktivitas / Logbook' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              reportType === tab.id
                ? 'bg-[#183B66] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Peserta Magang</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-[#2F80ED] focus:bg-white transition"
            >
              <option value="Semua">Semua Peserta ({userStudents.length} Mahasiswa)</option>
              {userStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.nim ? `(${s.nim})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-60">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan & Tahun</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-[#2F80ED] focus:bg-white transition"
            >
              <option value="Semua">Semua Periode</option>
              {monthOptions.filter(m => m !== 'Semua').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preview Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#183B66]">
            Pratinjau Data Laporan ({reportType.toUpperCase()})
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {reportType === 'izin' 
              ? `${filteredLeaveRequests.length} data` 
              : reportType === 'aktivitas'
              ? `${filteredActivities.length} data`
              : `${filteredAttendances.length} data`
            }
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'izin' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 font-bold">
                  <th className="pb-3 pr-3">Mahasiswa</th>
                  <th className="pb-3 px-3">Tgl Pengajuan</th>
                  <th className="pb-3 px-3">Periode</th>
                  <th className="pb-3 px-3">Jenis Izin</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada data izin sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredLeaveRequests.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-semibold">{l.studentName}</td>
                      <td className="py-3 px-3">{l.requestDate}</td>
                      <td className="py-3 px-3">{l.startDate} - {l.endDate}</td>
                      <td className="py-3 px-3 font-medium">{l.leaveType}</td>
                      <td className="py-3 px-3 font-semibold">{l.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : reportType === 'aktivitas' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 font-bold">
                  <th className="pb-3 pr-3">Mahasiswa</th>
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Judul Aktivitas</th>
                  <th className="pb-3 px-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Tidak ada data aktivitas sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-semibold">{a.studentName || '-'}</td>
                      <td className="py-3 px-3">{a.date || a.activityDate}</td>
                      <td className="py-3 px-3">{a.title}</td>
                      <td className="py-3 px-3">{a.time || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 font-bold">
                  <th className="pb-3 pr-3">Mahasiswa</th>
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Absen Masuk</th>
                  <th className="pb-3 px-3">Absen Pulang</th>
                  <th className="pb-3 px-3">Total Jam</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada data absensi sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-semibold">{a.studentName} ({a.studentNim})</td>
                      <td className="py-3 px-3">{a.dayName}, {a.date}</td>
                      <td className="py-3 px-3">{a.checkInTime || '-'}</td>
                      <td className="py-3 px-3">{a.checkOutTime || '-'}</td>
                      <td className="py-3 px-3">{a.totalHours || '-'}</td>
                      <td className="py-3 px-3 font-semibold">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' :
                          a.status === 'Izin' ? 'bg-amber-100 text-amber-700' :
                          a.status === 'Sakit' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {a.status}
                        </span>
                        {a.correctedByAdmin && (
                          <span className="block text-[9px] text-[#2F80ED] font-semibold mt-0.5">Dikoreksi Admin</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
