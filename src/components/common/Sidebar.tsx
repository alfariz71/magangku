import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ClipboardList, 
  FileText, 
  Edit3, 
  BarChart2, 
  Settings, 
  Users, 
  Building2, 
  Headphones, 
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface HelpMessage {
  id: string;
  student_name: string;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenHelpModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
  onOpenHelpModal
}) => {
  const { role } = useAuth();
  const [inboxOpen, setInboxOpen] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>([]);

  // Fetch messages for admin
  useEffect(() => {
    if (role !== 'admin') return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('help_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel('sidebar_help_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'help_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role]);

  const markAsRead = async (id: string) => {
    await supabase.from('help_messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  };

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'aktivitas', label: 'Aktivitas', icon: ClipboardList },
    { id: 'izin', label: 'Pengajuan Izin', icon: FileText },
    { id: 'koreksi', label: 'Koreksi Absensi', icon: Edit3 },
    { id: 'laporan', label: 'Laporan', icon: BarChart2 },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'datapeserta', label: 'Data Peserta', icon: Users },
    { id: 'lokasi', label: 'Lokasi & QR', icon: MapPin },
    { id: 'absensi', label: 'Absensi', icon: Clock },
    { id: 'aktivitas', label: 'Aktivitas', icon: ClipboardList },
    { id: 'izin', label: 'Pengajuan Izin', icon: FileText },
    { id: 'koreksi', label: 'Koreksi Absensi', icon: Edit3 },
    { id: 'laporan', label: 'Laporan', icon: BarChart2 },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  // Bottom card: admin = inbox panel, user = hubungi admin
  const renderBottomCard = () => {
    if (role === 'admin') {
      if (collapsed) {
        return (
          <div className="mb-4 flex justify-center relative">
            <button
              onClick={() => setInboxOpen(prev => !prev)}
              title="Pesan Masuk"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#091A2E] text-slate-400 hover:bg-[#1E3A5F] hover:text-white"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        );
      }

      return (
        <div className="mb-4 rounded-2xl bg-[#091A2E] border border-[#1E3A5F]/40 overflow-hidden">
          {/* Header toggle */}
          <button
            onClick={() => setInboxOpen(prev => !prev)}
            className="flex w-full items-center justify-between px-3.5 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Pesan Masuk</span>
              {unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {inboxOpen
              ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              : <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
            }
          </button>

          {/* Message list */}
          {inboxOpen && (
            <div className="border-t border-[#1E3A5F]/40 max-h-52 overflow-y-auto divide-y divide-[#1E3A5F]/30">
              {messages.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-slate-500">Belum ada pesan</p>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => !msg.is_read && markAsRead(msg.id)}
                    className={`px-3.5 py-2.5 cursor-pointer hover:bg-[#1B3658]/50 transition-colors ${
                      !msg.is_read ? 'bg-[#1E3A5F]/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[11px] font-semibold truncate ${!msg.is_read ? 'text-white' : 'text-slate-400'}`}>
                        {msg.student_name}
                      </span>
                      {!msg.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{msg.topic}</p>
                    <p className={`mt-0.5 text-[11px] line-clamp-2 ${!msg.is_read ? 'text-slate-300' : 'text-slate-500'}`}>
                      {msg.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{formatTime(msg.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    // User role: show help button
    if (collapsed) {
      return (
        <div className="mb-4 flex justify-center">
          <button
            onClick={onOpenHelpModal}
            title="Hubungi Admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#091A2E] text-[#2F80ED] hover:bg-[#1E3A5F]"
          >
            <Headphones className="h-5 w-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="mb-4 rounded-2xl bg-[#091A2E] p-4 border border-[#1E3A5F]/40 shadow-inner">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F80ED] text-white shadow-md shadow-blue-500/30">
            <Headphones className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-white">Butuh bantuan?</h4>
            <p className="mt-1 text-[11px] leading-tight text-slate-300">
              Hubungi admin jika Anda membutuhkan bantuan.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenHelpModal}
          className="mt-3.5 w-full rounded-xl border border-slate-500/40 bg-transparent py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-slate-300 active:scale-[0.98]"
        >
          Hubungi Admin
        </button>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-[#0F2643] text-white p-4 transition-all duration-300">
      {/* Top: Logo & Close button for mobile */}
      <div>
        <div className="flex items-center justify-between pb-6 pt-2 px-2">
          <Logo variant="light" size={collapsed ? 'sm' : 'md'} className={collapsed ? 'justify-center' : ''} />
          {isOpenMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1E3A5F] hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-2 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={`group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-smooth ${
                  isActive
                    ? 'bg-[#2F80ED] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-[#1B3658] hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Inbox (admin) or Help (user) + Collapse Toggle */}
      <div className="pt-4 mt-auto">
        {renderBottomCard()}

        {/* Collapse toggle button (desktop) */}
        {onToggleCollapse && (
          <div className="hidden lg:flex items-center justify-start px-1 pt-1">
            <button
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B3658] text-slate-300 transition-colors hover:bg-[#2F80ED] hover:text-white"
              title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="fixed top-0 bottom-0 z-40 h-full overflow-hidden transition-all duration-300" style={{ width: collapsed ? '5rem' : '16rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 flex w-72 max-w-xs flex-1 flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
