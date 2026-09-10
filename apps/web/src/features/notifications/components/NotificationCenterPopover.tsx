import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Wrench,
  CheckCircle2,
  Megaphone,
  Receipt,
  Info,
  Clock,
  ExternalLink,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, NotificationType } from '@sitera/shared';
import { useNotifications } from '../useNotifications';
import { useAuth } from '../../auth';

interface NotificationCenterPopoverProps {
  tenantSlug?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Az önce';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return 'Yakın zamanda';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'ticket_update':
      return {
        icon: <Wrench size={15} className="text-teal-700" />,
        bg: 'bg-teal-50 border-teal-200/80',
        label: 'Talep & Çözüm',
      };
    case 'payment_approval':
      return {
        icon: <CheckCircle2 size={15} className="text-emerald-700" />,
        bg: 'bg-emerald-50 border-emerald-200/80',
        label: 'Ödeme Onayı',
      };
    case 'announcement':
      return {
        icon: <Megaphone size={15} className="text-amber-700" />,
        bg: 'bg-amber-50 border-amber-200/80',
        label: 'Bina Duyurusu',
      };
    case 'debt_issued':
      return {
        icon: <Receipt size={15} className="text-purple-700" />,
        bg: 'bg-purple-50 border-purple-200/80',
        label: 'Aidat & Tahakkuk',
      };
    case 'system':
    default:
      return {
        icon: <Info size={15} className="text-slate-700" />,
        bg: 'bg-slate-50 border-slate-200',
        label: 'Sistem',
      };
  }
}

export const NotificationCenterPopover: React.FC<NotificationCenterPopoverProps> = ({
  tenantSlug,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  const effectiveTenantSlug =
    tenantSlug ||
    user?.group?.slug ||
    (user?.group?.name
      ? user.group.name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : 'site');

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    groupId: user?.groupId,
    userId: user?.id,
  });

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.linkUrl) {
      const targetUrl = notif.linkUrl.startsWith('/')
        ? `/${effectiveTenantSlug}${notif.linkUrl}`
        : notif.linkUrl;
      navigate(targetUrl);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Çan Butonu Tetikleyici */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all border cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-slate-100 text-teal-800 border-teal-300 ring-2 ring-teal-500/20'
            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200/90'
        }`}
        title="Bildirim Merkezi"
        aria-label="Bildirimler"
        aria-expanded={isOpen}
      >
        <Bell size={19} className={unreadCount > 0 ? 'text-slate-800' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Penceresi */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2.5 w-[380px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Üst Başlık & Eylemler */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center font-bold">
                <Bell size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-none">
                    Bildirimler
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200/80">
                      {unreadCount} Yeni
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                      Güncel
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Tüm site ve daire hareketleri
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-100/70 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Tümünü Okundu Olarak İşaretle"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Tümünü Okundu Yap</span>
                <span className="sm:hidden">Okundu</span>
              </button>
            )}
          </div>

          {/* Filtre Sekmeleri (Tümü vs Okunmamış) */}
          <div className="flex items-center px-4 pt-2.5 border-b border-slate-100 bg-white gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tümü</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'all'
                    ? 'bg-teal-50 text-teal-800 font-extrabold'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'unread'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Okunmamış</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 bg-white">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-2xs">
                  {activeTab === 'unread' ? (
                    <Sparkles size={22} className="text-teal-600" />
                  ) : (
                    <Bell size={22} />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">
                    {activeTab === 'unread'
                      ? 'Harika! Okunmamış bildiriminiz yok.'
                      : 'Henüz bir bildirim bulunmuyor.'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeTab === 'unread'
                      ? 'Site yönetimi veya talepleriniz güncellendiğinde burada görünecektir.'
                      : 'Önemli duyuru ve güncellemeler anında iletilecektir.'}
                  </p>
                </div>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const meta = getNotificationIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                      notif.isRead
                        ? 'hover:bg-slate-50/80 opacity-80 hover:opacity-100'
                        : 'bg-teal-50/25 hover:bg-teal-50/50'
                    }`}
                  >
                    {/* Kategori İkonu */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${meta.bg}`}
                    >
                      {meta.icon}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                          {notif.title}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                        </span>

                        <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />

                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                          {meta.label}
                        </span>

                        {notif.linkUrl && (
                          <span className="ml-auto text-teal-700 group-hover:underline inline-flex items-center gap-0.5 font-bold text-[10px]">
                            <span>Görüntüle</span>
                            <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sağ Taraf: Okunmamış Noktası & Silme */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {!notif.isRead && (
                        <div
                          className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-100 shadow-xs"
                          title="Okunmadı"
                        />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                        title="Bildirimi Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Alt Bilgi */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/60 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(
                  user?.role === 'admin' || user?.role === 'superadmin'
                    ? `/${effectiveTenantSlug}/admin/announcements`
                    : `/${effectiveTenantSlug}/portal/announcements`,
                );
              }}
              className="text-xs font-semibold text-slate-600 hover:text-teal-800 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>Tüm Bina Duyurularını Gör</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
