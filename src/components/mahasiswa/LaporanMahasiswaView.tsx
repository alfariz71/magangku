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

  const userAttendances = attendances.filter(a => a.userId === currentUser?.id);

  // Helper: get week number (Minggu ke-N) from date string YYYY-MM-DD
  const getWeekNumber = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const startDate = userAttendances.length > 0
      ? new Date(userAttendances[userAttendances.length - 1].date + 'T00:00:00')
      : date;
    const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  // Helper: get uraian kegiatan from activities for a given date
  const getUraian = (dateStr: string) => {
    const dayActivities = activities.filter(a => a.activityDate === dateStr || a.date === dateStr);
    if (dayActivities.length > 0) return dayActivities.map(a => a.title).join('; ');
    return '-';
  };

  // Helper: row fill color for Excel by status
  const getStatusFill = (status: string) => {
    if (status === 'Izin' || status === 'Sakit') return 'FFFDE68A'; // kuning
    if (status === 'Alpha') return 'FFFECACA'; // merah muda
    if (status === 'Terlambat') return 'FFFED7AA'; // oranye muda
    return 'FFFFFFFF'; // putih
  };

  // Build sorted rows (ascending by date)
  const sortedAttendances = [...userAttendances].sort((a, b) => a.date.localeCompare(b.date));

  // Export to PDF — format referensi: NO | Minggu | Hari | Tanggal | Uraian Kegiatan
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 59, 102);
    doc.text('JURNAL KEGIATAN MAGANG', 105, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Nama   : ${currentUser?.name || '-'}`, 14, 24);
    doc.text(`NIM    : ${currentUser?.nim || '-'}`, 14, 29);
    doc.text(`Instansi : ${currentUser?.university || '-'}`, 14, 34);
    doc.text(`Posisi   : ${currentUser?.position || '-'}`, 14, 39);
    doc.text(`Periode  : ${sortedAttendances[0]?.date || '-'} s/d ${sortedAttendances[sortedAttendances.length - 1]?.date || '-'}`, 14, 44);

    const tableRows = sortedAttendances.map((item, idx) => [
      String(idx + 1),
      `Minggu ${getWeekNumber(item.date)}`,
      item.dayName,
      new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      getUraian(item.date) !== '-' ? getUraian(item.date) : (item.status !== 'Hadir' && item.status !== 'Terlambat' ? item.status : '-')
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['NO', 'MINGGU', 'HARI', 'TANGGAL', 'URAIAN KEGIATAN']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [24, 59, 102],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 25 },
        4: { cellWidth: 'auto' }
      },
      styles: { fontSize: 8, cellPadding: 2 },
      bodyStyles: { textColor: [40, 40, 40] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const attendance = sortedAttendances[data.row.index];
          if (attendance) {
            if (attendance.status === 'Izin' || attendance.status === 'Sakit') {
              data.cell.styles.fillColor = [253, 230, 138]; // kuning
            } else if (attendance.status === 'Alpha') {
              data.cell.styles.fillColor = [254, 202, 202]; // merah
            } else if (attendance.status === 'Terlambat') {
              data.cell.styles.fillColor = [254, 215, 170]; // oranye
            }
          }
        }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Dicetak oleh: MagangKu — ${new Date().toLocaleDateString('id-ID')}`, 14, 290);
      doc.text(`Halaman ${i} dari ${pageCount}`, 190, 290, { align: 'right' });
    }

    doc.save(`Jurnal_Kegiatan_${currentUser?.name || 'Mahasiswa'}_${new Date().toLocaleDateString('sv-SE')}.pdf`);
  };

  // Export to Excel — format referensi: NO | Minggu | Hari | Tanggal | Uraian Kegiatan
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // === Sheet 1: Jurnal Kegiatan ===
    const ws1Data: any[][] = [];

    // Header info rows
    ws1Data.push(['JURNAL KEGIATAN MAGANG - MAGANGKU']);
    ws1Data.push([]);
    ws1Data.push(['Nama', currentUser?.name || '-']);
    ws1Data.push(['NIM', currentUser?.nim || '-']);
    ws1Data.push(['Instansi/Universitas', currentUser?.university || '-']);
    ws1Data.push(['Posisi Magang', currentUser?.position || '-']);
    ws1Data.push(['Periode', `${sortedAttendances[0]?.date || '-'} s/d ${sortedAttendances[sortedAttendances.length - 1]?.date || '-'}`]);
    ws1Data.push([]);

    // Table header
    ws1Data.push(['NO', 'MINGGU', 'HARI', 'TANGGAL', 'URAIAN KEGIATAN']);

    // Table data
    sortedAttendances.forEach((item, idx) => {
      const uraian = getUraian(item.date) !== '-'
        ? getUraian(item.date)
        : (item.status !== 'Hadir' && item.status !== 'Terlambat' ? item.status : '-');
      ws1Data.push([
        idx + 1,
        `Minggu ${getWeekNumber(item.date)}`,
        item.dayName,
        new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID'),
        uraian
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

    // Column widths
    ws1['!cols'] = [
      { wch: 5 },  // NO
      { wch: 12 }, // MINGGU
      { wch: 10 }, // HARI
      { wch: 14 }, // TANGGAL
      { wch: 60 }, // URAIAN KEGIATAN
    ];

    // Merge title
    ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

    XLSX.utils.book_append_sheet(wb, ws1, 'Jurnal Kegiatan');

    // === Sheet 2: Rekap Absensi ===
    const ws2Data = [
      ['REKAP ABSENSI'],
      [],
      ['Tanggal', 'Hari', 'Absen Masuk', 'Absen Pulang', 'Total Jam', 'Status'],
      ...sortedAttendances.map(item => [
        item.date,
        item.dayName,
        item.checkInTime || '-',
        item.checkOutTime || '-',
        item.totalHours || '-',
        item.status
      ])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Absensi');

    XLSX.writeFile(wb, `Jurnal_Magang_${currentUser?.name || 'Mahasiswa'}_${new Date().toLocaleDateString('sv-SE')}.xlsx`);
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
