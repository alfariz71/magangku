import React, { useState, useEffect } from 'react';
import { MessageSquare, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HelpMessage {
  id: string;
  student_name: string;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const AdminInboxPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>([]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('help_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel('help_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('help_messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const deleteMessage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Hapus pesan ini?')) return;
    setMessages(prev => prev.filter(m => m.id !== id));
    const { error } = await supabase.from('help_messages').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete message:', error);
      fetchMessages();
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {/* Panel */}
      {isOpen && (
        <div className="w-72 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <span className="text-xs font-semibold text-slate-700">Pesan Bantuan</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-slate-400">Belum ada pesan masuk</p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`group relative px-3 py-2.5 text-[11px] cursor-pointer hover:bg-slate-50 transition-colors ${
                    !msg.is_read ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => !msg.is_read && markAsRead(msg.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold truncate ${!msg.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {msg.student_name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                      <button
                        onClick={(e) => deleteMessage(e, msg.id)}
                        title="Hapus pesan"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{msg.topic}</span>
                  <p className={`mt-0.5 line-clamp-2 ${!msg.is_read ? 'text-slate-700' : 'text-slate-500'}`}>
                    {msg.message}
                  </p>
                  {!msg.is_read && (
                    <span className="mt-1 inline-block text-[10px] text-blue-500 font-medium">
                      Klik untuk tandai dibaca
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
        <span>Pesan</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
