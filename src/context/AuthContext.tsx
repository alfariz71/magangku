import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

// ============================================================
// Register Data Interface
// ============================================================
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  nim: string;
  birthPlace: string;
  birthDate: string;
  gender: 'Laki-laki' | 'Perempuan';
  university: string;
  faculty?: string;
  major: string;
  concentration?: string;
  position: string;
  startDate: string;
  endDate: string;
}

// ============================================================
// Context Types
// ============================================================
interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  updateCurrentUser: (updatedData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  switchRole: (role: UserRole) => void; // dev only
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// Helper: Map Supabase profile to app User type
// ============================================================
function mapProfileToUser(id: string, profile: Record<string, unknown>, email: string): User {
  return {
    id,
    email,
    name: (profile.full_name as string) || email,
    role: (profile.role as UserRole) || 'user',
    username: email.split('@')[0],
    avatar: (profile.photo_url as string) || `https://ui-avatars.com/api/?name=${encodeURIComponent((profile.full_name as string) || 'User')}&background=2F80ED&color=fff&size=200`,
    phone: (profile.phone as string) || undefined,
    nim: (profile.nim as string) || undefined,
    birthPlace: (profile.birth_place as string) || undefined,
    birthDate: (profile.birth_date as string) || undefined,
    gender: (profile.gender as 'Laki-laki' | 'Perempuan') || undefined,
    university: (profile.university as string) || undefined,
    faculty: (profile.faculty as string) || undefined,
    major: (profile.major as string) || undefined,
    concentration: (profile.concentration as string) || undefined,
    position: (profile.position as string) || undefined,
    locationId: (profile.location_id as string) || undefined,
    startDate: (profile.start_date as string) || undefined,
    endDate: (profile.end_date as string) || undefined,
    status: (profile.status as 'Aktif' | 'Nonaktif' | 'Selesai') || 'Aktif',
  };
}

// ============================================================
// Provider
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch and set user profile from Supabase
  const fetchAndSetUser = async (sessionUser: any) => {
    const userId = sessionUser.id;
    const email = sessionUser.email || '';
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Gagal memuat profil user:', error?.message);
      setCurrentUser(null);
      return;
    }

    const user = mapProfileToUser(userId, profile, email);
    
    // Sync missing NIM from auth metadata if available (fix for registration RLS block)
    const metadataNim = sessionUser.user_metadata?.nim;
    if (!user.nim && metadataNim) {
      user.nim = metadataNim;
      // Background sync to DB
      supabase.from('user_profiles').update({ nim: metadataNim }).eq('id', userId).then(({error}) => {
         if (error) console.error('Failed to sync NIM from metadata', error);
      });
    }

    setCurrentUser(user);
  };

  // On mount: check existing session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchAndSetUser(session.user);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndSetUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Optionally re-fetch profile on token refresh
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---- Login ----
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Email atau password salah. Periksa kembali data Anda.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, message: 'Email belum dikonfirmasi. Periksa kotak masuk email Anda.' };
        }
        return { success: false, message: error.message };
      }

      if (data.user) {
        await fetchAndSetUser(data.user);
        return { success: true };
      }

      return { success: false, message: 'Login gagal. Coba lagi.' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Terjadi kesalahan. Periksa koneksi internet Anda.' };
    }
  };

  // ---- Register ----
  const register = async (data: RegisterData): Promise<{ success: boolean; message?: string }> => {
    try {
      // Check NIM uniqueness before signup
      if (data.nim) {
        const { data: existingNim } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('nim', data.nim)
          .maybeSingle();

        if (existingNim) {
          return { success: false, message: 'NIM/NIS sudah terdaftar dalam sistem. Gunakan NIM yang berbeda atau hubungi admin.' };
        }
      }

      // Get first active location for default
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('is_active', true)
        .limit(1);
      const defaultLocationId = locations?.[0]?.id || null;

      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          data: {
            full_name: data.name,
            role: 'user',
            nim: data.nim || null
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          return { success: false, message: 'Email sudah terdaftar. Silakan login atau gunakan email berbeda.' };
        }
        return { success: false, message: signUpError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Pendaftaran gagal. Coba lagi.' };
      }

      // Sync metadata nim to profile if session exists (RLS allows it) or wait for login
      const updatePayload: any = {
        full_name: data.name,
        role: 'user',
        status: 'Aktif'
      };
      
      if (data.nim) updatePayload.nim = data.nim;
      if (data.phone) updatePayload.phone = data.phone;
      if (defaultLocationId) updatePayload.location_id = defaultLocationId;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError.message);
        // Don't fail - user is created, profile will be updated later
      }

      // Note: With email confirmation enabled, user needs to confirm email first
      // Check if session is available (email confirmation might be off in dev)
      if (authData.session) {
        await fetchAndSetUser(authData.user);
      }

      return {
        success: true,
        message: authData.session
          ? 'Pendaftaran berhasil! Selamat datang di MagangKu.'
          : 'Pendaftaran berhasil! Cek email Anda untuk konfirmasi, lalu login.'
      };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, message: 'Terjadi kesalahan saat mendaftar. Periksa koneksi internet Anda.' };
    }
  };

  // ---- Logout ----
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // ---- Update Profile ----
  const updateCurrentUser = async (updatedData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: updatedData.name,
          phone: updatedData.phone || null,
          nim: updatedData.nim || null,
          birth_place: updatedData.birthPlace || null,
          birth_date: updatedData.birthDate || null,
          gender: updatedData.gender || null,
          photo_url: updatedData.avatar || null,
          university: updatedData.university || null,
          faculty: updatedData.faculty || null,
          major: updatedData.major || null,
          concentration: updatedData.concentration || null,
          position: updatedData.position || null,
          start_date: updatedData.startDate || null,
          end_date: updatedData.endDate || null,
        })
        .eq('id', currentUser.id);

      if (!error) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedData } : prev);
        return { success: true };
      } else {
        console.error('Update profile error:', error.message);
        return { success: false, message: error.message };
      }
    } catch (err: any) {
      console.error('updateCurrentUser error:', err);
      return { success: false, message: err.message || 'Terjadi kesalahan saat menyimpan.' };
    }
  };

  // Dev only: switch role for testing
  const switchRole = (role: UserRole) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, role } : prev);
    }
  };

  const role: UserRole = currentUser?.role || 'user';
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        updateCurrentUser,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
