import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { HelpAdminModal } from './components/common/HelpAdminModal';

// Mahasiswa Views
import { LoginView } from './components/mahasiswa/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { DataDiriView } from './components/mahasiswa/DataDiriView';
import { DashboardAbsensiView } from './components/mahasiswa/DashboardAbsensiView';
import { AktivitasMagangView } from './components/mahasiswa/AktivitasMagangView';
import { PengajuanIzinView } from './components/mahasiswa/PengajuanIzinView';
import { LaporanMahasiswaView } from './components/mahasiswa/LaporanMahasiswaView';
import { KoreksiAbsenView } from './components/mahasiswa/KoreksiAbsenView';

// Admin Views
import { DashboardAdminView } from './components/admin/DashboardAdminView';
import { DataPesertaAdminView } from './components/admin/DataPesertaAdminView';
import { AbsensiAdminView } from './components/admin/AbsensiAdminView';
import { PengajuanIzinAdminView } from './components/admin/PengajuanIzinAdminView';
import { AktivitasAdminView } from './components/admin/AktivitasAdminView';
import { LaporanAdminView } from './components/admin/LaporanAdminView';
import { PengaturanAdminView } from './components/admin/PengaturanAdminView';
import LokasiAdminView from './components/admin/LokasiAdminView';
import KoreksiAdminView from './components/admin/KoreksiAdminView';

const MainLayout: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);

  // If role changes, reset default tab if needed
  useEffect(() => {
    setActiveTab('dashboard');
  }, [role]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#2F80ED] border-t-transparent"></div>
          <p className="text-sm text-slate-500">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <RegisterView onGoToLogin={() => setShowRegister(false)} />;
    }
    return <LoginView onGoToRegister={() => setShowRegister(true)} />;
  }

  // Render content based on role and activeTab
  const renderContent = () => {
    if (role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardAdminView onNavigateTab={(tab) => setActiveTab(tab)} />;
        case 'datapeserta':
          return <DataPesertaAdminView />;
        case 'lokasi':
          return <LokasiAdminView />;
        case 'absensi':
          return <AbsensiAdminView />;
        case 'aktivitas':
          return <AktivitasAdminView />;
        case 'izin':
          return <PengajuanIzinAdminView />;
        case 'koreksi':
          return <KoreksiAdminView />;
        case 'laporan':
          return <LaporanAdminView />;
        case 'pengaturan':
          return <PengaturanAdminView />;
        default:
          return <DashboardAdminView onNavigateTab={(tab) => setActiveTab(tab)} />;
      }
    } else {
      // User role
      switch (activeTab) {
        case 'dashboard':
          return <DashboardAbsensiView onNavigateToIzin={() => setActiveTab('izin')} />;
        case 'aktivitas':
          return <AktivitasMagangView />;
        case 'izin':
          return <PengajuanIzinView />;
        case 'laporan':
          return <LaporanMahasiswaView />;
        case 'koreksi':
          return <KoreksiAbsenView />;
        case 'pengaturan':
          return <DataDiriView />;
        default:
          return <DashboardAbsensiView onNavigateToIzin={() => setActiveTab('izin')} />;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-[#1E293B] antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <Header
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Helpdesk Support Modal */}
      <HelpAdminModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
