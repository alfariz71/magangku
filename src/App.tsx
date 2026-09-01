import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GpsSimulatorWidget } from './components/common/GpsSimulatorWidget';
import { HelpAdminModal } from './components/common/HelpAdminModal';

// Mahasiswa Views
import { LoginView } from './components/mahasiswa/LoginView';
import { DataDiriView } from './components/mahasiswa/DataDiriView';
import { DashboardAbsensiView } from './components/mahasiswa/DashboardAbsensiView';
import { AktivitasMagangView } from './components/mahasiswa/AktivitasMagangView';
import { PengajuanIzinView } from './components/mahasiswa/PengajuanIzinView';
import { TandaTanganView } from './components/mahasiswa/TandaTanganView';
import { LaporanMahasiswaView } from './components/mahasiswa/LaporanMahasiswaView';

// Admin Views
import { DashboardAdminView } from './components/admin/DashboardAdminView';
import { DataPesertaAdminView } from './components/admin/DataPesertaAdminView';
import { PengaturanQRAdminView } from './components/admin/PengaturanQRAdminView';
import { AbsensiAdminView } from './components/admin/AbsensiAdminView';
import { PengajuanIzinAdminView } from './components/admin/PengajuanIzinAdminView';
import { AktivitasAdminView } from './components/admin/AktivitasAdminView';
import { LaporanAdminView } from './components/admin/LaporanAdminView';
import { PembimbingPerusahaanView } from './components/admin/PembimbingPerusahaanView';
import { PengaturanAdminView } from './components/admin/PengaturanAdminView';

const MainLayout: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // If role changes, reset default tab if needed
  useEffect(() => {
    setActiveTab('dashboard');
  }, [role]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Render content based on role and activeTab
  const renderContent = () => {
    if (role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardAdminView onNavigateTab={(tab) => setActiveTab(tab)} />;
        case 'datapeserta':
          return <DataPesertaAdminView />;
        case 'pembimbing':
          return <PembimbingPerusahaanView />;
        case 'perusahaan':
          return <PengaturanQRAdminView />;
        case 'absensi':
          return <AbsensiAdminView />;
        case 'aktivitas':
          return <AktivitasAdminView />;
        case 'izin':
          return <PengajuanIzinAdminView />;
        case 'laporan':
          return <LaporanAdminView />;
        case 'pengaturan':
          return <PengaturanAdminView />;
        default:
          return <DashboardAdminView onNavigateTab={(tab) => setActiveTab(tab)} />;
      }
    } else {
      // Mahasiswa role
      switch (activeTab) {
        case 'dashboard':
          return <DashboardAbsensiView onNavigateToIzin={() => setActiveTab('izin')} />;
        case 'datadiri':
          return <DataDiriView />;
        case 'absensi':
          return <DashboardAbsensiView onNavigateToIzin={() => setActiveTab('izin')} />;
        case 'aktivitas':
          return <AktivitasMagangView />;
        case 'izin':
          return <PengajuanIzinView />;
        case 'tandatangan':
          return <TandaTanganView />;
        case 'laporan':
          return <LaporanMahasiswaView />;
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

      {/* Floating GPS Simulator Widget (Available for instant testing) */}
      <GpsSimulatorWidget />

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
