import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL dan Anon Key wajib dikonfigurasi di .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ============================================================
// Database type helpers
// ============================================================
export type DbUser = {
  id: string;
  role: 'user' | 'admin';
  full_name: string;
  phone: string | null;
  nim: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: 'Laki-laki' | 'Perempuan' | null;
  photo_url: string | null;
  university: string | null;
  faculty: string | null;
  major: string | null;
  concentration: string | null;
  position: string | null;
  location_id: string | null;
  start_date: string | null;
  end_date: string | null;
  internship_document_url: string | null;
  status: 'Aktif' | 'Nonaktif' | 'Selesai';
  created_at: string;
  updated_at: string;
};

export type DbLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  min_gps_accuracy: number;
  is_active: boolean;
  created_at: string;
  updated_by: string | null;
};

export type DbAttendance = {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: string | null;
  status: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha';
  check_in_lat: number | null;
  check_in_lon: number | null;
  check_in_accuracy: number | null;
  check_in_distance_meters: number | null;
  check_out_lat: number | null;
  check_out_lon: number | null;
  check_out_accuracy: number | null;
  photo_url: string | null;
  qr_session_id: string | null;
  is_qr_valid: boolean;
  is_location_valid: boolean;
  notes: string | null;
  corrected_by: string | null;
  correction_reason: string | null;
  corrected_at: string | null;
  created_at: string;
};

export type DbActivity = {
  id: string;
  user_id: string;
  activity_date: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  category: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbLeaveRequest = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  document_url: string | null;
  document_name: string | null;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type DbQrSession = {
  id: string;
  location_id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

export type DbCorrectionRequest = {
  id: string;
  user_id: string;
  attendance_date: string;
  correction_type: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  evidence_url: string | null;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type DbAuditLog = {
  id: string;
  performed_by: string | null;
  action: string;
  category: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
};

export type DbNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  link_tab: string | null;
  is_read: boolean;
  created_at: string;
};
