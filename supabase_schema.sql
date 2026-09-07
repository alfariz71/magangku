-- ============================================================
-- MAGANGKU DATABASE SCHEMA (SUPABASE)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL LOKASI KANTOR (GEOFENCING)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION NOT NULL DEFAULT 50,
    min_gps_accuracy DOUBLE PRECISION NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

-- Masukkan 1 lokasi kantor default
INSERT INTO public.locations (id, name, address, latitude, longitude, radius_meters, min_gps_accuracy, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Kantor Pusat MagangKu Jakarta',
    'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
    -6.2088,
    106.8456,
    100,
    150,
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. TABEL PROFIL USER (TERKONEKSI DENGAN AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    nim TEXT UNIQUE,
    birth_place TEXT,
    birth_date TEXT,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    photo_url TEXT,
    university TEXT,
    faculty TEXT,
    major TEXT,
    concentration TEXT,
    position TEXT,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    start_date TEXT,
    end_date TEXT,
    internship_document_url TEXT,
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif', 'Selesai')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL QR SESSION (DYNAMIC QR TOKEN)
CREATE TABLE IF NOT EXISTS public.qr_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL ABSENSI (ATTENDANCE RECORDS)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    total_hours TEXT,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha')),
    check_in_lat DOUBLE PRECISION,
    check_in_lon DOUBLE PRECISION,
    check_in_accuracy DOUBLE PRECISION,
    check_in_distance_meters DOUBLE PRECISION,
    check_out_lat DOUBLE PRECISION,
    check_out_lon DOUBLE PRECISION,
    check_out_accuracy DOUBLE PRECISION,
    photo_url TEXT,
    qr_session_id TEXT,
    is_qr_valid BOOLEAN NOT NULL DEFAULT false,
    is_location_valid BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    corrected_by TEXT,
    correction_reason TEXT,
    corrected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 6. TABEL LOGBOOK / AKTIVITAS HARIAN
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT,
    end_time TEXT,
    category TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL PENGAJUAN IZIN
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    leave_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    document_url TEXT,
    document_name TEXT,
    status TEXT NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Disetujui', 'Ditolak')),
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABEL KOREKSI ABSENSI
CREATE TABLE IF NOT EXISTS public.attendance_correction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attendance_date TEXT NOT NULL,
    correction_type TEXT NOT NULL,
    requested_check_in TEXT,
    requested_check_out TEXT,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status TEXT NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Disetujui', 'Ditolak')),
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABEL AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performed_by TEXT,
    action TEXT NOT NULL,
    category TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABEL NOTIFIKASI
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link_tab TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TRIGGER OTOMATIS: SAAT USER BARU DITAMBAHKAN DI AUTH, LANGSUNG MASUK KE USER_PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, nim, status, location_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'nim',
    'Aktif',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = COALESCE(EXCLUDED.role, public.user_profiles.role),
      nim = COALESCE(EXCLUDED.nim, public.user_profiles.nim);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. SINKRONISASI USER LAMA / YANG SUDAH DIBUAT DULUAN DI AUTH.USERS
INSERT INTO public.user_profiles (id, full_name, role, status, location_id)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'role', 'user'),
    'Aktif',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 13. PERMISSIVE POLICIES UNTUK DEVELOPMENT & TESTING
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all locations" ON public.locations;
CREATE POLICY "Allow all locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all qr_sessions" ON public.qr_sessions;
CREATE POLICY "Allow all qr_sessions" ON public.qr_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all attendance_records" ON public.attendance_records;
CREATE POLICY "Allow all attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all activities" ON public.activities;
CREATE POLICY "Allow all activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all leave_requests" ON public.leave_requests;
CREATE POLICY "Allow all leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all attendance_correction_requests" ON public.attendance_correction_requests;
CREATE POLICY "Allow all attendance_correction_requests" ON public.attendance_correction_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all notifications" ON public.notifications;
CREATE POLICY "Allow all notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
