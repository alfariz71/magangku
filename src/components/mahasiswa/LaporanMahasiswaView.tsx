import React from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle, Calendar, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const LaporanMahasiswaView: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendances, activities, leaveRequests, attendanceStats } = useData();

  const userAttendances = attendances.filter(a => a.userId === (currentUser?.id || 'user-andi-01'));

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.setTextColor(24, 59, 102);
    doc.text('Laporan Rekapitulasi Magang - MagangKu', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Nama Mahasiswa: ${currentUser?.name || 'Andi Pratama'} | NIM: ${currentUser?.nim || '2201234567'}`, 14, 26);
    doc.text(`Universitas: ${currentUser?.university || 'Universitas Indonesia'} | Jurusan: ${currentUser?.major || 'Sistem Informasi'}`, 14, 32);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Total Hadir: ${attendanceStats.hadir} hari`, 14, 38);

    const tableRows = userAttendances.map(item => [
      item.date,
      item.dayName,
      item.checkInTime || '-',
      item.checkOutTime || '-',
      item.totalHours || '-',
      item.status
    ]);

    autoTable(doc, {
      startY: 44,
      head: [['Tanggal', 'Hari', 'Absen Masuk', 'Absen Pulang', 'Total Jam', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [47, 128, 237] },
      styles: { fontSize: 8 }
    });

    doc.save(`Laporan_Magang_${currentUser?.name || 'Mahasiswa'}.pdf`);
  };

  // Export to Excel
  const exportExcel = () => {
    const dataToExport = userAttendances.map(item => ({
      'Tanggal': item.date,
      'Hari': item.dayName,
      'Absen Masuk': item.checkInTime || '-',
      'Absen Pulang': item.checkOutTime || '-',
      'Total Jam Kerja': item.totalHours || '-',
      'Status': item.status,
      'Catatan': item.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Absensi');
    XLSX.writeFile(wb, `Rekap_Absensi_${currentUser?.name || 'Mahasiswa'}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#183B66]">Laporan & Rekapitulasi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Unduh laporan kehadiran dan rekapitulasi aktivitas magang Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="h-4 w-4" />
            Unduh PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Hari Hadir</p>
          <p className="text-3xl font-bold text-[#2F80ED] mt-2">{attendanceStats.hadir} <span className="text-sm font-normal text-slate-500">Hari</span></p>
          <p className="text-xs text-emerald-600 font-medium mt-1">✓ Tingkat kehadiran: 96%</p>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Log Aktivitas</p>
          <p className="text-3xl font-bold text-[#183B66] mt-2">{activities.length} <span className="text-sm font-normal text-slate-500">Entri</span></p>
          <p className="text-xs text-slate-500 font-medium mt-1">Tercatat dalam logbook</p>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pengajuan Izin</p>
          <p className="text-3xl font-bold text-[#F2994A] mt-2">{leaveRequests.length} <span className="text-sm font-normal text-slate-500">Pengajuan</span></p>
          <p className="text-xs text-slate-500 font-medium mt-1">Disetujui: {leaveRequests.filter(l => l.status === 'Disetujui').length}</p>
        </div>
      </div>
    </div>
  );
};
