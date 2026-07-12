import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <Bell size={20} className="text-slate-300 hover:text-emerald-400 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-hidden flex flex-col origin-top-right rounded-xl glassmorphism border border-slate-700/50 shadow-2xl z-50">
          <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <Check size={12} /> Read All
                </button>
                <button 
                  onClick={clearAll}
                  className="text-[10px] text-slate-400 hover:text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-1 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                <Bell size={24} className="text-slate-600" />
                <span className="text-xs text-slate-500">You're all caught up!</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`p-3 rounded-lg border flex flex-col gap-1 transition-all cursor-pointer ${
                    notif.read 
                      ? 'bg-transparent border-transparent opacity-60' 
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-xs font-bold ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>
                      {notif.title}
                    </span>
                    <span className="text-[9px] text-slate-500 shrink-0 mt-0.5">
                      {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-snug ${notif.read ? 'text-slate-500' : 'text-slate-300'}`}>
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
