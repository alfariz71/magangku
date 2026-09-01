import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter, Calendar, Users, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useData } from '../../context/DataContext';

export const LaporanAdminView: React.FC = () => {
  const { attendances, leaveRequests, activities, students } = useData();

  const [reportType, setReportType] = useState<'harian' | 'mingguan' | 'bulanan' | 'izin' | 'aktivitas'>('harian');
  const [selectedStudent, setSelectedStudent] = useState('Semua');
  const [selectedMonth, setSelectedMonth] = useState('Mei 2025');

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(24, 59, 102);
    doc.text(`Laporan ${reportType.toUpperCase()} - MagangKu`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Periode: ${selectedMonth} | Filter Peserta: ${selectedStudent}`, 14, 26);
    doc.text(`Dicetak oleh Administrator pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);

    let head: string[][] = [];
    let rows: string[][] = [];

    if (reportType === 'izin') {
      head = [['Nama Mahasiswa', 'NIM', 'Tgl Pengajuan', 'Periode Izin', 'Jenis Izin', 'Status']];
      rows = leaveRequests.map(r => [r.studentName, r.studentNim, r.requestDate, `${r.startDate} - ${r.endDate}`, r.leaveType, r.status]);
    } else if (reportType === 'aktivitas') {
      head = [['Hari', 'Tanggal', 'Judul Aktivitas', 'Waktu']];
      rows = activities.map(a => [a.day, a.date, a.title, a.time]);
    } else {
      head = [['Nama Mahasiswa', 'NIM', 'Tanggal', 'Hari', 'Masuk', 'Pulang', 'Total Jam', 'Status']];
      rows = attendances.map(a => [
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
      dataToExport = leaveRequests.map(r => ({
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
      dataToExport = activities.map(a => ({
        'Hari': a.day,
        'Tanggal': a.date,
        'Judul Aktivitas': a.title,
        'Waktu': a.time
      }));
    } else {
      dataToExport = attendances.map(a => ({
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs"
            >
              <option value="Semua">Semua Peserta (128 Mahasiswa)</option>
              {students.filter(s => s.role === 'mahasiswa').map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.nim})</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-60">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan & Tahun</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs"
            >
              <option value="Mei 2025">Mei 2025</option>
              <option value="Juni 2025">Juni 2025</option>
              <option value="Juli 2025">Juli 2025</option>
              <option value="Agustus 2025">Agustus 2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview Table Card */}
      <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#183B66] border-b border-slate-100 pb-3 mb-4">
          Pratinjau Data Laporan ({reportType.toUpperCase()})
        </h3>

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
                {leaveRequests.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-semibold">{l.studentName}</td>
                    <td className="py-3 px-3">{l.requestDate}</td>
                    <td className="py-3 px-3">{l.startDate} - {l.endDate}</td>
                    <td className="py-3 px-3 font-medium">{l.leaveType}</td>
                    <td className="py-3 px-3 font-semibold">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : reportType === 'aktivitas' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 font-bold">
                  <th className="pb-3 pr-3">Hari</th>
                  <th className="pb-3 px-3">Tanggal</th>
                  <th className="pb-3 px-3">Judul Aktivitas</th>
                  <th className="pb-3 px-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activities.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-semibold">{a.day}</td>
                    <td className="py-3 px-3">{a.date}</td>
                    <td className="py-3 px-3">{a.title}</td>
                    <td className="py-3 px-3">{a.time}</td>
                  </tr>
                ))}
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
                {attendances.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-semibold">{a.studentName} ({a.studentNim})</td>
                    <td className="py-3 px-3">{a.dayName}, {a.date}</td>
                    <td className="py-3 px-3">{a.checkInTime || '-'}</td>
                    <td className="py-3 px-3">{a.checkOutTime || '-'}</td>
                    <td className="py-3 px-3">{a.totalHours || '-'}</td>
                    <td className="py-3 px-3 font-semibold">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
