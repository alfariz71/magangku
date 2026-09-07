import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter, Calendar, Users, BarChart3, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useData } from '../../context/DataContext';
import { isIndonesianHoliday, getIndonesianHolidayName } from '../../lib/holidays';

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

  // Helper format hari dan tanggal Indonesia
  const getDayName = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch {
      return '-';
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Tanggal dimulainya skema Customer Service (CS 6 Hari Kerja).
  // Sebelum tanggal ini (1 - 5 September 2026), seluruh peserta masih berstatus Magang Reguler (5 Hari Kerja, Sabtu libur).
  const CS_START_DATE = '2026-09-07';

  // Helper cek apakah mahasiswa merupakan divisi Customer Service (CS 6 Hari Kerja)
  const isCsStudent = (userId?: string, studentName?: string, notes?: string, dateStr?: string) => {
    if (notes && /cs/i.test(notes)) return true;
    if (dateStr && dateStr < CS_START_DATE) return false;
    const s = students.find(st => st.id === userId || st.name === studentName);
    return Boolean(s?.concentration && /cs|customer\s*service/i.test(s.concentration));
  };

  // Grouping Aktivitas: Tanggal (Terbaru -> Terlama) -> Mahasiswa (A -> Z) -> Aktivitas
  const groupedActivitiesByDay = React.useMemo(() => {
    const dateMap = new Map<string, {
      date: string;
      dayName: string;
      formattedDate: string;
      fullDateLabel: string;
      studentMap: Map<string, {
        userId: string;
        studentName: string;
        studentNim: string;
        items: { id: string; title: string; time: string }[];
      }>;
    }>();

    filteredActivities.forEach(a => {
      const dateKey = a.activityDate || a.date || '';
      const userKey = a.userId || a.studentName || 'unknown';

      if (!dateMap.has(dateKey)) {
        const day = getDayName(dateKey);
        const fDate = formatDateIndo(dateKey);
        dateMap.set(dateKey, {
          date: dateKey,
          dayName: day,
          formattedDate: fDate,
          fullDateLabel: `${day}, ${fDate}`,
          studentMap: new Map()
        });
      }

      const dayGroup = dateMap.get(dateKey)!;
      if (!dayGroup.studentMap.has(userKey)) {
        dayGroup.studentMap.set(userKey, {
          userId: a.userId,
          studentName: a.studentName || 'Peserta',
          studentNim: a.studentNim || '-',
          items: []
        });
      }

      dayGroup.studentMap.get(userKey)!.items.push({
        id: a.id,
        title: a.title,
        time: a.time || '-'
      });
    });

    // Urutkan tanggal dari terbaru ke terlama
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => {
      return b.date.localeCompare(a.date);
    });

    // Di dalam setiap tanggal, urutkan mahasiswa berdasarkan nama A - Z
    return sortedDates.map(day => ({
      date: day.date,
      dayName: day.dayName,
      formattedDate: day.formattedDate,
      fullDateLabel: day.fullDateLabel,
      students: Array.from(day.studentMap.values()).sort((a, b) => 
        a.studentName.localeCompare(b.studentName, 'id')
      )
    }));
  }, [filteredActivities]);

  // Helper: parse hours safely (handles "9 jam 36 menit" properly, checks checkout)
  const parseHours = (th?: string | null, checkOutTime?: string | null): number => {
    if (!th || !checkOutTime || checkOutTime === '-') return 0;
    
    // Format "9 jam 36 menit" atau "9 jam" atau "30 menit"
    const jamMatch = th.match(/(\d+(?:\.\d+)?)\s*jam/i);
    const menitMatch = th.match(/(\d+)\s*menit/i);

    if (jamMatch || menitMatch) {
      const jam = jamMatch ? parseFloat(jamMatch[1]) : 0;
      const menit = menitMatch ? parseFloat(menitMatch[1]) : 0;
      const total = jam + (menit / 60);
      return total > 16 ? 0 : total; // Sanity check max 16 jam kerja/hari
    }

    // Format angka biasa misal "8.5"
    const clean = th.replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num > 16 ? 0 : num;
  };

  const formatHours = (hours: number): string => {
    if (!hours || hours <= 0) return '-';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h} jam`;
    return `${h} jam ${m} mnt`;
  };

  // Grouping Harian: Tanggal (Terbaru -> Terlama) -> Mahasiswa (A -> Z)
  const groupedDailyAttendances = React.useMemo(() => {
    const dateMap = new Map<string, {
      date: string;
      dayName: string;
      formattedDate: string;
      fullDateLabel: string;
      isHoliday?: boolean;
      holidayName?: string | null;
      records: {
        id: string;
        userId: string;
        studentName: string;
        studentNim: string;
        checkInTime: string;
        checkOutTime: string;
        totalHours: string;
        status: string;
        correctedByAdmin?: boolean;
        shift: string;
        isCs: boolean;
      }[];
    }>();

    filteredAttendances.forEach(a => {
      const dateKey = a.date || '';
      if (!dateKey) return;

      if (!dateMap.has(dateKey)) {
        const day = getDayName(dateKey);
        const fDate = formatDateIndo(dateKey);
        const holiday = getIndonesianHolidayName(dateKey);
        dateMap.set(dateKey, {
          date: dateKey,
          dayName: day,
          formattedDate: fDate,
          fullDateLabel: holiday ? `${day}, ${fDate} (🔴 ${holiday})` : `${day}, ${fDate}`,
          isHoliday: !!holiday,
          holidayName: holiday,
          records: []
        });
      }

      // Validasi jam kerja: jika belum absen pulang, total jam adalah '-'
      const isCheckedOut = !!a.checkOutTime && a.checkOutTime !== '-';
      let displayTotalHours = '-';
      if (isCheckedOut && a.totalHours) {
        const hNum = parseHours(a.totalHours, a.checkOutTime);
        displayTotalHours = hNum > 0 ? formatHours(hNum) : (a.totalHours.includes('jam') ? a.totalHours : `${a.totalHours} jam`);
      }

      const isCs = isCsStudent(a.userId, a.studentName, a.notes, dateKey);
      let shiftLabel = 'Reguler (08:00 - 17:00)';
      if (a.notes) {
        shiftLabel = a.notes;
      } else if (isCs) {
        shiftLabel = 'Customer Service';
      }

      dateMap.get(dateKey)!.records.push({
        id: a.id,
        userId: a.userId,
        studentName: a.studentName || 'Peserta',
        studentNim: a.studentNim || '-',
        checkInTime: a.checkInTime ? (a.checkInTime.includes('WIB') ? a.checkInTime : `${a.checkInTime} WIB`) : '-',
        checkOutTime: a.checkOutTime ? (a.checkOutTime.includes('WIB') ? a.checkOutTime : `${a.checkOutTime} WIB`) : '-',
        totalHours: displayTotalHours,
        status: a.status,
        correctedByAdmin: a.correctedByAdmin,
        shift: shiftLabel,
        isCs
      });
    });

    const sortedDates = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    return sortedDates.map(day => ({
      ...day,
      records: day.records.sort((a, b) => a.studentName.localeCompare(b.studentName, 'id'))
    }));
  }, [filteredAttendances, students]);

  // Grouping Mingguan: Blok Minggu (Terbaru -> Terlama) -> Mahasiswa (A -> Z) -> Matriks Sen-Sab (Reguler 5 Hari vs CS 6 Hari)
  const groupedWeeklyAttendances = React.useMemo(() => {
    const todayJakarta = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

    const getWeekRange = (dateStr: string) => {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);

      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);

      const pad = (n: number) => String(n).padStart(2, '0');
      const toKey = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

      const mondayKey = toKey(monday);
      const fMon = monday.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const fSat = saturday.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      const daysKeys: { [dayIdx: number]: string } = {};
      let weekHolidayCount = 0;
      for (let i = 0; i < 6; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        const k = toKey(dt);
        daysKeys[i] = k;
        if (isIndonesianHoliday(k)) weekHolidayCount++;
      }

      const weekLabel = weekHolidayCount > 0
        ? `Minggu (${fMon} – ${fSat} — ${weekHolidayCount} Libur Nasional)`
        : `Minggu (${fMon} – ${fSat})`;

      return {
        weekKey: mondayKey,
        label: weekLabel,
        daysKeys
      };
    };

    const weekMap = new Map<string, {
      weekKey: string;
      label: string;
      daysKeys: { [dayIdx: number]: string };
      records: typeof filteredAttendances;
    }>();

    filteredAttendances.forEach(a => {
      if (!a.date) return;
      const { weekKey, label, daysKeys } = getWeekRange(a.date);

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekKey,
          label,
          daysKeys,
          records: []
        });
      }
      weekMap.get(weekKey)!.records.push(a);
    });

    const sortedWeeks = Array.from(weekMap.values()).sort((a, b) => b.weekKey.localeCompare(a.weekKey));

    return sortedWeeks.map(week => {
      const studentMap = new Map<string, {
        userId: string;
        studentName: string;
        studentNim: string;
        dayRecords: { [dateKey: string]: (typeof filteredAttendances)[0] };
        totalHoursNum: number;
      }>();

      week.records.forEach(r => {
        const sKey = r.userId || r.studentName;
        if (!studentMap.has(sKey)) {
          studentMap.set(sKey, {
            userId: r.userId,
            studentName: r.studentName,
            studentNim: r.studentNim,
            dayRecords: {},
            totalHoursNum: 0
          });
        }
        const sData = studentMap.get(sKey)!;
        sData.dayRecords[r.date] = r;
        sData.totalHoursNum += parseHours(r.totalHours, r.checkOutTime);
      });

      const students = Array.from(studentMap.values()).map(s => {
        // Sebelum CS_START_DATE (misal minggu 1 - 5 September), semua peserta masih skema Reguler 5 hari kerja (Sabtu libur)
        const isCsActiveThisWeek = week.weekKey >= CS_START_DATE
          ? (isCsStudent(s.userId, s.studentName) || Object.values(s.dayRecords).some(r => r.notes && /cs/i.test(r.notes)))
          : Object.values(s.dayRecords).some(r => r.notes && /cs/i.test(r.notes));
        const skema = isCsActiveThisWeek ? 'CS (6 Hari)' : 'Reguler (5 Hari)';
        const isCs = isCsActiveThisWeek;

        const getStatusCode = (dateKey: string, rec?: (typeof filteredAttendances)[0]) => {
          if (rec) {
            switch (rec.status) {
              case 'Hadir': return { code: 'H', color: 'text-emerald-700 font-bold', full: 'Hadir' };
              case 'Terlambat': return { code: 'T', color: 'text-rose-700 font-bold', full: 'Terlambat' };
              case 'Izin': return { code: 'I', color: 'text-amber-700 font-bold', full: 'Izin' };
              case 'Sakit': return { code: 'S', color: 'text-orange-700 font-bold', full: 'Sakit' };
              case 'Alpha': return { code: 'A', color: 'text-red-700 font-bold', full: 'Alpha' };
              default: return { code: '-', color: 'text-slate-400 font-normal', full: '-' };
            }
          }

          // 1. Cek apakah tanggal ini merupakan Hari Libur Nasional / Tanggal Merah
          const holidayName = getIndonesianHolidayName(dateKey);
          if (holidayName) {
            return {
              code: 'L',
              color: 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 rounded px-1',
              full: `Libur: ${holidayName}`
            };
          }

          // 2. Jika bukan hari libur dan tanggal hari kerja sudah berlalu / hari ini:
          if (dateKey <= todayJakarta) {
            // Cek apakah ada pengajuan izin/sakit yang disetujui
            const leave = leaveRequests.find(l => 
              l.userId === s.userId && 
              l.status === 'Disetujui' &&
              l.startDate <= dateKey && dateKey <= l.endDate
            );
            if (leave) {
              if (leave.leaveType?.toLowerCase().includes('sakit')) {
                return { code: 'S', color: 'text-orange-700 font-bold', full: 'Sakit' };
              }
              return { code: 'I', color: 'text-amber-700 font-bold', full: 'Izin' };
            }
            return { code: 'A', color: 'text-red-700 font-bold', full: 'Alpha' };
          }

          return { code: '-', color: 'text-slate-400 font-normal', full: 'Belum berlangsung' };
        };

        const sen = getStatusCode(week.daysKeys[0], s.dayRecords[week.daysKeys[0]]);
        const sel = getStatusCode(week.daysKeys[1], s.dayRecords[week.daysKeys[1]]);
        const rab = getStatusCode(week.daysKeys[2], s.dayRecords[week.daysKeys[2]]);
        const kam = getStatusCode(week.daysKeys[3], s.dayRecords[week.daysKeys[3]]);
        const jum = getStatusCode(week.daysKeys[4], s.dayRecords[week.daysKeys[4]]);
        
        let sab;
        if (!isCs) {
          sab = {
            code: 'OFF',
            color: 'text-slate-400 dark:text-slate-500 font-normal bg-slate-100 dark:bg-slate-800 rounded px-1',
            full: 'Libur Rutin Reguler (5 Hari Kerja)'
          };
        } else {
          sab = getStatusCode(week.daysKeys[5], s.dayRecords[week.daysKeys[5]]);
        }

        const daysList = isCs ? [sen, sel, rab, kam, jum, sab] : [sen, sel, rab, kam, jum];
        const daysPresent = daysList.filter(d => d.code === 'H' || d.code === 'T').length;
        const workingDaysCount = daysList.filter(d => d.code !== 'L' && d.code !== 'OFF').length;

        return {
          userId: s.userId,
          studentName: s.studentName,
          studentNim: s.studentNim,
          skema,
          isCs,
          sen,
          sel,
          rab,
          kam,
          jum,
          sab,
          totalHoursFormatted: formatHours(s.totalHoursNum),
          kehadiran: `${daysPresent} / ${workingDaysCount} Hari`
        };
      }).sort((a, b) => a.studentName.localeCompare(b.studentName, 'id'));

      return {
        weekKey: week.weekKey,
        label: week.label,
        students
      };
    });
  }, [filteredAttendances, leaveRequests, students]);

  // Grouping Bulanan: Bulan (Terbaru -> Terlama) -> Mahasiswa (A -> Z) -> Akumulasi Hari Kerja (Reguler 5 Hari vs CS 6 Hari)
  const groupedMonthlyAttendances = React.useMemo(() => {
    const now = new Date();

    const monthMap = new Map<string, {
      monthKey: string;
      label: string;
      regulerWorkingDays: string[];
      csWorkingDays: string[];
      totalRegulerDaysInMonth: number;
      totalCsDaysInMonth: number;
      isCurrentMonth: boolean;
      records: typeof filteredAttendances;
    }>();

    filteredAttendances.forEach(a => {
      if (!a.date) return;
      const d = new Date(a.date.includes('T') ? a.date : a.date + 'T00:00:00');
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const mKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      if (!monthMap.has(mKey)) {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthIndex;
        const maxDay = isCurrentMonth ? Math.min(daysInMonth, now.getDate()) : daysInMonth;

        const regulerWorkingDays: string[] = [];
        const csWorkingDays: string[] = [];
        for (let day = 1; day <= maxDay; day++) {
          const dt = new Date(year, monthIndex, day);
          const dayOfWeek = dt.getDay(); // 0 is Sun, 6 is Sat
          const pad = (n: number) => String(n).padStart(2, '0');
          const dateKey = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

          if (dayOfWeek === 0 || isIndonesianHoliday(dateKey)) continue;

          // Hari kerja reguler: Senin - Jumat (Sabtu libur)
          if (dayOfWeek !== 6) {
            regulerWorkingDays.push(dateKey);
          }

          // Hari kerja CS:
          // Sebelum CS_START_DATE (1 - 6 September 2026), seluruh peserta masih skema Reguler (Sabtu libur).
          // Mulai CS_START_DATE (7 September 2026), peserta CS bekerja 6 hari (Senin - Sabtu).
          if (dateKey < CS_START_DATE) {
            if (dayOfWeek !== 6) {
              csWorkingDays.push(dateKey);
            }
          } else {
            csWorkingDays.push(dateKey);
          }
        }

        let totalRegulerDaysInMonth = 0;
        let totalCsDaysInMonth = 0;
        let totalHolidaysInMonth = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const dt = new Date(year, monthIndex, day);
          const pad = (n: number) => String(n).padStart(2, '0');
          const dateKey = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
          const dayOfWeek = dt.getDay();

          if (dayOfWeek === 0) continue;

          if (isIndonesianHoliday(dateKey)) {
            totalHolidaysInMonth++;
          } else {
            if (dayOfWeek !== 6) {
              totalRegulerDaysInMonth++;
            }
            if (dateKey < CS_START_DATE) {
              if (dayOfWeek !== 6) {
                totalCsDaysInMonth++;
              }
            } else {
              totalCsDaysInMonth++;
            }
          }
        }

        const holidayNote = totalHolidaysInMonth > 0 ? ` & ${totalHolidaysInMonth} Libur Nasional` : '';
        const mLabel = isCurrentMonth
          ? `Bulan: ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} (Reguler: ${regulerWorkingDays.length} Hari, CS: ${csWorkingDays.length} Hari Berjalan${holidayNote})`
          : `Bulan: ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} (Reguler: ${totalRegulerDaysInMonth} Hari, CS: ${totalCsDaysInMonth} Hari${holidayNote})`;

        monthMap.set(mKey, {
          monthKey: mKey,
          label: mLabel,
          regulerWorkingDays,
          csWorkingDays,
          totalRegulerDaysInMonth,
          totalCsDaysInMonth,
          isCurrentMonth,
          records: []
        });
      }
      monthMap.get(mKey)!.records.push(a);
    });

    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    return sortedMonths.map(m => {
      const studentMap = new Map<string, {
        userId: string;
        studentName: string;
        studentNim: string;
        dayRecords: { [dateKey: string]: (typeof filteredAttendances)[0] };
        totalHoursNum: number;
      }>();

      m.records.forEach(r => {
        const sKey = r.userId || r.studentName;
        if (!studentMap.has(sKey)) {
          studentMap.set(sKey, {
            userId: r.userId,
            studentName: r.studentName,
            studentNim: r.studentNim,
            dayRecords: {},
            totalHoursNum: 0
          });
        }
        const s = studentMap.get(sKey)!;
        s.dayRecords[r.date] = r;
        s.totalHoursNum += parseHours(r.totalHours, r.checkOutTime);
      });

      const students = Array.from(studentMap.values()).map(s => {
        const isCs = isCsStudent(s.userId, s.studentName) || Object.values(s.dayRecords).some(r => r.notes && /cs/i.test(r.notes));
        const skema = isCs ? 'CS (6 Hari)' : 'Reguler (5 Hari)';
        const studentWorkingDays = isCs ? m.csWorkingDays : m.regulerWorkingDays;

        let hadir = 0;
        let terlambat = 0;
        let izin = 0;
        let sakit = 0;
        let alpha = 0;

        // Evaluasi kehadiran berdasarkan Hari Kerja masing-masing skema
        studentWorkingDays.forEach(wDate => {
          const rec = s.dayRecords[wDate];
          if (rec) {
            if (rec.status === 'Hadir') hadir++;
            else if (rec.status === 'Terlambat') terlambat++;
            else if (rec.status === 'Izin') izin++;
            else if (rec.status === 'Sakit') sakit++;
            else if (rec.status === 'Alpha') alpha++;
          } else {
            // Cek apakah ada pengajuan izin/sakit yang disetujui di tanggal ini
            const leave = leaveRequests.find(l => 
              l.userId === s.userId && 
              l.status === 'Disetujui' &&
              l.startDate <= wDate && wDate <= l.endDate
            );
            if (leave) {
              if (leave.leaveType?.toLowerCase().includes('sakit')) {
                sakit++;
              } else {
                izin++;
              }
            } else {
              // Tidak hadir di hari kerja tanpa keterangan = Alpha!
              alpha++;
            }
          }
        });

        // Hitung juga jika ada kehadiran di luar hari kerja standar
        Object.entries(s.dayRecords).forEach(([dateStr, rec]) => {
          if (!studentWorkingDays.includes(dateStr)) {
            if (rec.status === 'Hadir') hadir++;
            else if (rec.status === 'Terlambat') terlambat++;
          }
        });

        // Persentase kehadiran dihitung dari total Hari Kerja yang telah dievaluasi
        const totalEvaluated = Math.max(studentWorkingDays.length, hadir + terlambat + izin + sakit + alpha);
        const presence = hadir + terlambat;
        const percentage = totalEvaluated > 0 ? Math.min(100, Math.round((presence / totalEvaluated) * 100)) : 0;

        return {
          userId: s.userId,
          studentName: s.studentName,
          studentNim: s.studentNim,
          skema,
          isCs,
          hadir,
          terlambat,
          izin,
          sakit,
          alpha,
          totalHoursFormatted: formatHours(s.totalHoursNum),
          percentage
        };
      }).sort((a, b) => a.studentName.localeCompare(b.studentName, 'id'));

      return {
        monthKey: m.monthKey,
        label: m.label,
        students
      };
    });
  }, [filteredAttendances, leaveRequests, students]);

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
    let rows: any[] = [];
    let columnStyles: any = {};

    if (reportType === 'izin') {
      head = [['Nama Mahasiswa', 'NIM', 'Tgl Pengajuan', 'Periode Izin', 'Jenis Izin', 'Status']];
      rows = filteredLeaveRequests.map(r => [r.studentName, r.studentNim, r.requestDate, `${r.startDate} - ${r.endDate}`, r.leaveType, r.status]);
    } else if (reportType === 'aktivitas') {
      head = [['No', 'Mahasiswa', 'Judul Aktivitas', 'Waktu Pelaksanaan']];
      groupedActivitiesByDay.forEach(day => {
        // Baris pembatas tanggal full-width
        rows.push([
          { 
            content: day.fullDateLabel, 
            colSpan: 4, 
            styles: { 
              fillColor: [241, 245, 249], 
              textColor: [51, 65, 85], 
              fontStyle: 'bold', 
              halign: 'center',
              fontSize: 9
            } 
          }
        ]);

        day.students.forEach((student, sIdx) => {
          student.items.forEach((item, iIdx) => {
            if (iIdx === 0) {
              rows.push([
                { 
                  content: String(sIdx + 1), 
                  rowSpan: student.items.length, 
                  styles: { halign: 'center', valign: 'middle' } 
                },
                { 
                  content: `${student.studentName}\n(${student.studentNim})`, 
                  rowSpan: student.items.length, 
                  styles: { valign: 'middle', fontStyle: 'bold' } 
                },
                { content: item.title, styles: { valign: 'middle' } },
                { content: item.time || '-', styles: { halign: 'center', valign: 'middle' } }
              ]);
            } else {
              rows.push([
                { content: item.title, styles: { valign: 'middle' } },
                { content: item.time || '-', styles: { halign: 'center', valign: 'middle' } }
              ]);
            }
          });
        });
      });
      columnStyles = {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 42, halign: 'center' }
      };
    } else if (reportType === 'harian') {
      head = [['No', 'Mahasiswa', 'Tipe / Shift', 'Absen Masuk', 'Absen Pulang', 'Total Jam', 'Status']];
      groupedDailyAttendances.forEach(day => {
        rows.push([
          {
            content: day.fullDateLabel,
            colSpan: 7,
            styles: {
              fillColor: [241, 245, 249],
              textColor: [51, 65, 85],
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 9
            }
          }
        ]);
        day.records.forEach((rec, rIdx) => {
          rows.push([
            { content: String(rIdx + 1), styles: { halign: 'center', valign: 'middle' } },
            { content: `${rec.studentName}\n(${rec.studentNim})`, styles: { valign: 'middle', fontStyle: 'bold' } },
            { content: rec.shift, styles: { halign: 'center', valign: 'middle' } },
            { content: rec.checkInTime, styles: { halign: 'center', valign: 'middle' } },
            { content: rec.checkOutTime, styles: { halign: 'center', valign: 'middle' } },
            { content: rec.totalHours, styles: { halign: 'center', valign: 'middle' } },
            { content: rec.status, styles: { halign: 'center', valign: 'middle' } }
          ]);
        });
      });
      columnStyles = {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 46 },
        2: { cellWidth: 32, halign: 'center' },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: 26, halign: 'center' },
        5: { cellWidth: 24, halign: 'center' },
        6: { cellWidth: 26, halign: 'center' }
      };
    } else if (reportType === 'mingguan') {
      head = [['No', 'Mahasiswa', 'Skema', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Total Jam', 'Kehadiran']];
      groupedWeeklyAttendances.forEach(week => {
        rows.push([
          {
            content: week.label,
            colSpan: 11,
            styles: {
              fillColor: [241, 245, 249],
              textColor: [51, 65, 85],
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 9
            }
          }
        ]);
        week.students.forEach((s, sIdx) => {
          rows.push([
            { content: String(sIdx + 1), styles: { halign: 'center', valign: 'middle' } },
            { content: `${s.studentName}\n(${s.studentNim})`, styles: { valign: 'middle', fontStyle: 'bold' } },
            { content: s.skema, styles: { halign: 'center', valign: 'middle' } },
            { content: s.sen.code, styles: { halign: 'center', valign: 'middle' } },
            { content: s.sel.code, styles: { halign: 'center', valign: 'middle' } },
            { content: s.rab.code, styles: { halign: 'center', valign: 'middle' } },
            { content: s.kam.code, styles: { halign: 'center', valign: 'middle' } },
            { content: s.jum.code, styles: { halign: 'center', valign: 'middle' } },
            { content: s.sab.code, styles: { halign: 'center', valign: 'middle' } },
            { content: s.totalHoursFormatted, styles: { halign: 'center', valign: 'middle' } },
            { content: s.kehadiran, styles: { halign: 'center', valign: 'middle' } }
          ]);
        });
      });
      columnStyles = {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 38 },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 11, halign: 'center' },
        4: { cellWidth: 11, halign: 'center' },
        5: { cellWidth: 11, halign: 'center' },
        6: { cellWidth: 11, halign: 'center' },
        7: { cellWidth: 11, halign: 'center' },
        8: { cellWidth: 11, halign: 'center' },
        9: { cellWidth: 24, halign: 'center' },
        10: { cellWidth: 26, halign: 'center' }
      };
    } else {
      // reportType === 'bulanan'
      head = [['No', 'Mahasiswa', 'Skema', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha', 'Total Jam', '% Kehadiran']];
      groupedMonthlyAttendances.forEach(month => {
        rows.push([
          {
            content: month.label,
            colSpan: 10,
            styles: {
              fillColor: [241, 245, 249],
              textColor: [51, 65, 85],
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 9
            }
          }
        ]);
        month.students.forEach((s, sIdx) => {
          rows.push([
            { content: String(sIdx + 1), styles: { halign: 'center', valign: 'middle' } },
            { content: `${s.studentName}\n(${s.studentNim})`, styles: { valign: 'middle', fontStyle: 'bold' } },
            { content: s.skema, styles: { halign: 'center', valign: 'middle' } },
            { content: String(s.hadir), styles: { halign: 'center', valign: 'middle' } },
            { content: String(s.terlambat), styles: { halign: 'center', valign: 'middle' } },
            { content: String(s.izin), styles: { halign: 'center', valign: 'middle' } },
            { content: String(s.sakit), styles: { halign: 'center', valign: 'middle' } },
            { content: String(s.alpha), styles: { halign: 'center', valign: 'middle' } },
            { content: s.totalHoursFormatted, styles: { halign: 'center', valign: 'middle' } },
            { content: `${s.percentage}%`, styles: { halign: 'center', valign: 'middle' } }
          ]);
        });
      });
      columnStyles = {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 13, halign: 'center' },
        6: { cellWidth: 13, halign: 'center' },
        7: { cellWidth: 13, halign: 'center' },
        8: { cellWidth: 23, halign: 'center' },
        9: { cellWidth: 24, halign: 'center' }
      };
    }

    autoTable(doc, {
      startY: 38,
      head: head,
      body: rows,
      theme: 'grid',
      headStyles: { 
        fillColor: [24, 59, 102],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [220, 226, 235],
        lineWidth: 0.1
      },
      columnStyles: columnStyles
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
      dataToExport = [];
      groupedActivitiesByDay.forEach(day => {
        // Baris pembatas tanggal
        dataToExport.push({
          'No': '',
          'Nama Mahasiswa': `--- ${day.fullDateLabel} ---`,
          'Judul Aktivitas': '',
          'Waktu Pelaksanaan': ''
        });

        day.students.forEach((student, sIdx) => {
          student.items.forEach((item, iIdx) => {
            dataToExport.push({
              'No': iIdx === 0 ? sIdx + 1 : '',
              'Nama Mahasiswa': iIdx === 0 ? `${student.studentName} (${student.studentNim})` : '',
              'Judul Aktivitas': item.title,
              'Waktu Pelaksanaan': item.time || '-'
            });
          });
        });
      });
    } else if (reportType === 'harian') {
      dataToExport = [];
      groupedDailyAttendances.forEach(day => {
        dataToExport.push({
          'No': '',
          'Nama Mahasiswa': `--- ${day.fullDateLabel} ---`,
          'Tipe / Shift': '',
          'Absen Masuk': '',
          'Absen Pulang': '',
          'Total Jam': '',
          'Status': ''
        });
        day.records.forEach((rec, rIdx) => {
          dataToExport.push({
            'No': rIdx + 1,
            'Nama Mahasiswa': `${rec.studentName} (${rec.studentNim})`,
            'Tipe / Shift': rec.shift,
            'Absen Masuk': rec.checkInTime,
            'Absen Pulang': rec.checkOutTime,
            'Total Jam': rec.totalHours,
            'Status': rec.status
          });
        });
      });
    } else if (reportType === 'mingguan') {
      dataToExport = [];
      groupedWeeklyAttendances.forEach(week => {
        dataToExport.push({
          'No': '',
          'Nama Mahasiswa': `--- ${week.label} ---`,
          'Skema / Divisi': '',
          'Senin': '',
          'Selasa': '',
          'Rabu': '',
          'Kamis': '',
          'Jumat': '',
          'Sabtu': '',
          'Total Jam': '',
          'Kehadiran': ''
        });
        week.students.forEach((s, sIdx) => {
          dataToExport.push({
            'No': sIdx + 1,
            'Nama Mahasiswa': `${s.studentName} (${s.studentNim})`,
            'Skema / Divisi': s.skema,
            'Senin': s.sen.code,
            'Selasa': s.sel.code,
            'Rabu': s.rab.code,
            'Kamis': s.kam.code,
            'Jumat': s.jum.code,
            'Sabtu': s.sab.code,
            'Total Jam': s.totalHoursFormatted,
            'Kehadiran': s.kehadiran
          });
        });
      });
    } else {
      // reportType === 'bulanan'
      dataToExport = [];
      groupedMonthlyAttendances.forEach(month => {
        dataToExport.push({
          'No': '',
          'Nama Mahasiswa': `--- ${month.label} ---`,
          'Skema / Divisi': '',
          'Hadir': '',
          'Terlambat': '',
          'Izin': '',
          'Sakit': '',
          'Alpha': '',
          'Total Jam': '',
          '% Kehadiran': ''
        });
        month.students.forEach((s, sIdx) => {
          dataToExport.push({
            'No': sIdx + 1,
            'Nama Mahasiswa': `${s.studentName} (${s.studentNim})`,
            'Skema / Divisi': s.skema,
            'Hadir': s.hadir,
            'Terlambat': s.terlambat,
            'Izin': s.izin,
            'Sakit': s.sakit,
            'Alpha': s.alpha,
            'Total Jam': s.totalHoursFormatted,
            '% Kehadiran': `${s.percentage}%`
          });
        });
      });
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

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all whitespace-nowrap"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#183B66] text-white font-bold uppercase text-[11px] tracking-wide">
                    <th className="py-3 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                    <th className="py-3 px-4 w-60 border-r border-slate-700/60">Mahasiswa</th>
                    <th className="py-3 px-4 border-r border-slate-700/60">Judul Aktivitas</th>
                    <th className="py-3 px-4 w-44 text-center">Waktu Pelaksanaan</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300 font-medium">
                  {groupedActivitiesByDay.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Tidak ada data aktivitas sesuai filter
                      </td>
                    </tr>
                  ) : (
                    groupedActivitiesByDay.map(day => (
                      <React.Fragment key={day.date}>
                        {/* Baris Pembatas Tanggal (Full Width) */}
                        <tr className="bg-slate-100 border-y border-slate-300 dark:bg-slate-800/80 dark:border-slate-700">
                          <td colSpan={4} className="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200 text-xs tracking-wide">
                            {day.fullDateLabel}
                          </td>
                        </tr>

                        {/* Mahasiswa dalam hari ini */}
                        {day.students.map((student, sIdx) => (
                          <React.Fragment key={`${day.date}-${student.userId || sIdx}`}>
                            {student.items.map((item, iIdx) => (
                              <tr 
                                key={item.id || `${student.userId}-${iIdx}`}
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                {iIdx === 0 && (
                                  <>
                                    <td 
                                      rowSpan={student.items.length} 
                                      className="py-3 px-3 text-center align-middle font-bold text-slate-500 dark:text-slate-300 border-r border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40"
                                    >
                                      {sIdx + 1}
                                    </td>
                                    <td 
                                      rowSpan={student.items.length} 
                                      className="py-3 px-4 align-middle border-r border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40"
                                    >
                                      <p className="font-bold text-slate-900 dark:text-slate-100">{student.studentName}</p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">({student.studentNim})</p>
                                    </td>
                                  </>
                                )}
                                <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 border-r border-b border-slate-200 dark:border-slate-700">
                                  {item.title}
                                </td>
                                <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap border-b border-slate-200 dark:border-slate-700">
                                  {item.time || '-'}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : reportType === 'harian' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#183B66] text-white font-bold uppercase text-[11px] tracking-wide">
                    <th className="py-3 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                    <th className="py-3 px-4 w-56 border-r border-slate-700/60">Mahasiswa</th>
                    <th className="py-3 px-3 w-36 text-center border-r border-slate-700/60">Tipe / Shift</th>
                    <th className="py-3 px-4 w-28 text-center border-r border-slate-700/60">Absen Masuk</th>
                    <th className="py-3 px-4 w-28 text-center border-r border-slate-700/60">Absen Pulang</th>
                    <th className="py-3 px-4 w-24 text-center border-r border-slate-700/60">Total Jam</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300 font-medium">
                  {groupedDailyAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data absensi harian sesuai filter
                      </td>
                    </tr>
                  ) : (
                    groupedDailyAttendances.map(day => (
                      <React.Fragment key={day.date}>
                        {/* Baris Pembatas Tanggal */}
                        <tr className={`border-y ${
                          day.isHoliday
                            ? 'bg-rose-50/90 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60'
                            : 'bg-slate-100 border-slate-300 dark:bg-slate-800/80 dark:border-slate-700'
                        }`}>
                          <td colSpan={7} className="py-2.5 px-4 text-center font-bold text-xs tracking-wide">
                            <span className="text-slate-700 dark:text-slate-200">{day.fullDateLabel}</span>
                          </td>
                        </tr>

                        {day.records.map((rec, rIdx) => (
                          <tr 
                            key={rec.id || `${day.date}-${rIdx}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-200 dark:border-slate-700"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-300 font-bold border-r border-slate-200 dark:border-slate-700">
                              {rIdx + 1}
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{rec.studentName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">({rec.studentNim})</p>
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                rec.shift.includes('Shift 1')
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                                  : rec.shift.includes('Shift 2')
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                  : rec.shift.includes('CS')
                                  ? 'bg-blue-50 text-[#2F80ED] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {rec.shift}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono border-r border-slate-200 dark:border-slate-700">
                              {rec.checkInTime}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono border-r border-slate-200 dark:border-slate-700">
                              {rec.checkOutTime}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono border-r border-slate-200 dark:border-slate-700">
                              {rec.totalHours}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`font-semibold ${
                                rec.status === 'Hadir' ? 'text-emerald-700 dark:text-emerald-400' :
                                rec.status === 'Terlambat' ? 'text-rose-700 dark:text-rose-400' :
                                rec.status === 'Izin' ? 'text-amber-700 dark:text-amber-400' :
                                rec.status === 'Sakit' ? 'text-orange-700 dark:text-orange-400' :
                                rec.status === 'Alpha' ? 'text-red-700 dark:text-red-400' :
                                'text-slate-700 dark:text-slate-300'
                              }`}>
                                {rec.status}
                              </span>
                              {rec.correctedByAdmin && (
                                <span className="block text-[9px] text-[#2F80ED] font-semibold mt-0.5">Dikoreksi Admin</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : reportType === 'mingguan' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#183B66] text-white font-bold uppercase text-[11px] tracking-wide">
                    <th className="py-3 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                    <th className="py-3 px-4 w-52 border-r border-slate-700/60">Mahasiswa</th>
                    <th className="py-3 px-3 w-28 text-center border-r border-slate-700/60">Skema</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60">Sen</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60">Sel</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60">Rab</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60">Kam</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60">Jum</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60">Sab</th>
                    <th className="py-3 px-3 w-24 text-center border-r border-slate-700/60">Total Jam</th>
                    <th className="py-3 px-3 w-28 text-center">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300 font-medium">
                  {groupedWeeklyAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Tidak ada data absensi mingguan sesuai filter
                      </td>
                    </tr>
                  ) : (
                    groupedWeeklyAttendances.map(week => (
                      <React.Fragment key={week.weekKey}>
                        {/* Baris Pembatas Minggu */}
                        <tr className="bg-slate-100 border-y border-slate-300 dark:bg-slate-800/80 dark:border-slate-700">
                          <td colSpan={11} className="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200 text-xs tracking-wide">
                            {week.label}
                          </td>
                        </tr>

                        {week.students.map((student, sIdx) => (
                          <tr 
                            key={`${week.weekKey}-${student.userId || sIdx}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-200 dark:border-slate-700"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-300 font-bold border-r border-slate-200 dark:border-slate-700">
                              {sIdx + 1}
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{student.studentName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">({student.studentNim})</p>
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                student.isCs
                                  ? 'bg-blue-50 text-[#2F80ED] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {student.skema}
                              </span>
                            </td>
                            <td className={`py-2.5 px-2 text-center ${student.sen.color} border-r border-slate-200 dark:border-slate-700`} title={`Senin: ${student.sen.full}`}>
                              {student.sen.code}
                            </td>
                            <td className={`py-2.5 px-2 text-center ${student.sel.color} border-r border-slate-200 dark:border-slate-700`} title={`Selasa: ${student.sel.full}`}>
                              {student.sel.code}
                            </td>
                            <td className={`py-2.5 px-2 text-center ${student.rab.color} border-r border-slate-200 dark:border-slate-700`} title={`Rabu: ${student.rab.full}`}>
                              {student.rab.code}
                            </td>
                            <td className={`py-2.5 px-2 text-center ${student.kam.color} border-r border-slate-200 dark:border-slate-700`} title={`Kamis: ${student.kam.full}`}>
                              {student.kam.code}
                            </td>
                            <td className={`py-2.5 px-2 text-center ${student.jum.color} border-r border-slate-200 dark:border-slate-700`} title={`Jumat: ${student.jum.full}`}>
                              {student.jum.code}
                            </td>
                            <td className={`py-2.5 px-2 text-center ${student.sab.color} border-r border-slate-200 dark:border-slate-700`} title={`Sabtu: ${student.sab.full}`}>
                              {student.sab.code}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                              {student.totalHoursFormatted}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                              {student.kehadiran}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-4 items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Keterangan:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">H = Hadir</span>
                <span className="text-rose-700 dark:text-rose-400 font-semibold">T = Terlambat</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">I = Izin</span>
                <span className="text-orange-700 dark:text-orange-400 font-semibold">S = Sakit</span>
                <span className="text-red-700 dark:text-red-400 font-semibold">A = Alpha</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">L = Libur Nasional / Tanggal Merah</span>
                <span className="text-slate-400 dark:text-slate-500 font-semibold">OFF = Libur Reguler (5 Hari)</span>
              </div>
            </div>
          ) : (
            /* reportType === 'bulanan' */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#183B66] text-white font-bold uppercase text-[11px] tracking-wide">
                    <th className="py-3 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                    <th className="py-3 px-4 w-56 border-r border-slate-700/60">Mahasiswa</th>
                    <th className="py-3 px-3 w-28 text-center border-r border-slate-700/60">Skema</th>
                    <th className="py-3 px-3 w-16 text-center border-r border-slate-700/60">Hadir</th>
                    <th className="py-3 px-3 w-16 text-center border-r border-slate-700/60">Terlambat</th>
                    <th className="py-3 px-3 w-16 text-center border-r border-slate-700/60">Izin</th>
                    <th className="py-3 px-3 w-16 text-center border-r border-slate-700/60">Sakit</th>
                    <th className="py-3 px-3 w-16 text-center border-r border-slate-700/60">Alpha</th>
                    <th className="py-3 px-3 w-24 text-center border-r border-slate-700/60">Total Jam</th>
                    <th className="py-3 px-3 w-28 text-center">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300 font-medium">
                  {groupedMonthlyAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Tidak ada data absensi bulanan sesuai filter
                      </td>
                    </tr>
                  ) : (
                    groupedMonthlyAttendances.map(month => (
                      <React.Fragment key={month.monthKey}>
                        {/* Baris Pembatas Bulan */}
                        <tr className="bg-slate-100 border-y border-slate-300 dark:bg-slate-800/80 dark:border-slate-700">
                          <td colSpan={10} className="py-2.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200 text-xs tracking-wide">
                            {month.label}
                          </td>
                        </tr>

                        {month.students.map((student, sIdx) => (
                          <tr 
                            key={`${month.monthKey}-${student.userId || sIdx}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-200 dark:border-slate-700"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-300 font-bold border-r border-slate-200 dark:border-slate-700">
                              {sIdx + 1}
                            </td>
                            <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{student.studentName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">({student.studentNim})</p>
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                student.isCs
                                  ? 'bg-blue-50 text-[#2F80ED] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {student.skema}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 dark:text-emerald-400 font-bold border-r border-slate-200 dark:border-slate-700">
                              {student.hadir}
                            </td>
                            <td className={`py-2.5 px-3 text-center font-bold border-r border-slate-200 dark:border-slate-700 ${student.terlambat > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400 font-normal font-mono'}`}>
                              {student.terlambat}
                            </td>
                            <td className={`py-2.5 px-3 text-center font-bold border-r border-slate-200 dark:border-slate-700 ${student.izin > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400 font-normal font-mono'}`}>
                              {student.izin}
                            </td>
                            <td className={`py-2.5 px-3 text-center font-bold border-r border-slate-200 dark:border-slate-700 ${student.sakit > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-400 font-normal font-mono'}`}>
                              {student.sakit}
                            </td>
                            <td className={`py-2.5 px-3 text-center font-bold border-r border-slate-200 dark:border-slate-700 ${student.alpha > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-400 font-normal font-mono'}`}>
                              {student.alpha}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                              {student.totalHoursFormatted}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                              {student.percentage}%
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
