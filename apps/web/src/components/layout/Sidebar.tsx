import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Receipt,
  CheckCircle2,
  BarChart3,
  Scale,
  Clock,
  Megaphone,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Layers,
  Home,
  Bell,
  CreditCard,
  Users2,
  X,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '@sitera/shared';
import { useAuth } from '../../features/auth';

interface SidebarProps {
  userCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userCount = 0,
  isOpen = false,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = !isSuperAdmin && !isAdmin;

  const tenantSlug =
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

  const getTenantPath = (path: string) => `/${tenantSlug}${path}`;

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const superAdminNavGroups = [
    {
      label: 'Genel',
      items: [
        { path: '/admin/overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { path: '/admin/users', label: 'Yöneticiler & Kullanıcılar', icon: Users2, badge: userCount > 0 ? userCount.toString() : null },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { path: '/admin/architecture', label: 'Veri İzolasyonu', icon: ShieldCheck, badge: 'RLS' },
        { path: '/admin/audit-logs', label: 'Audit Log', icon: ShieldCheck, badge: null },
        { path: '/admin/profile', label: 'Profil', icon: UserIcon, badge: null },
      ],
    },
  ];

  const adminNavGroups = [
    {
      label: 'Genel',
      items: [
        { path: '/admin/overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { path: '/admin/users', label: 'Daireler & Sakinler', icon: Building2, badge: userCount > 0 ? userCount.toString() : null },
        { path: '/admin/periods', label: 'Aidat Dönemleri', icon: Calendar, badge: null },
      ],
    },
    {
      label: 'Tahsilat',
      items: [
        { path: '/admin/debts', label: 'Borçlar', icon: Receipt, badge: null },
        { path: '/admin/payment-approvals', label: 'Ödeme Onayları', icon: CheckCircle2, badge: '3' },
        { path: '/admin/reminders', label: 'Hatırlatmalar', icon: Clock, badge: null },
        { path: '/admin/legal', label: 'İcra Takip', icon: Scale, badge: null },
      ],
    },
    {
      label: 'Raporlar & İletişim',
      items: [
        { path: '/admin/reports', label: 'Raporlar', icon: BarChart3, badge: null },
        { path: '/admin/announcements', label: 'Duyurular', icon: Megaphone, badge: '2' },
      ],
    },
    {
      label: 'Hesap',
      items: [
        { path: '/admin/audit-logs', label: 'Audit Log', icon: ShieldCheck, badge: null },
        { path: '/admin/profile', label: 'Profil', icon: UserIcon, badge: null },
      ],
    },
  ];

  const portalNavGroups = [
    {
      label: 'Sakin Portalı',
      items: [
        { path: '/portal/home', label: 'Ana Sayfa', icon: Home, badge: null },
        { path: '/portal/announcements', label: 'Duyurular', icon: Bell, badge: '2' },
        { path: '/portal/payments', label: 'Ödemelerim', icon: CreditCard, badge: '1' },
        { path: '/portal/profile', label: 'Profilim', icon: UserIcon, badge: null },
      ],
    },
  ];

  const currentNavGroups = isSuperAdmin
    ? superAdminNavGroups
    : isAdmin
      ? adminNavGroups
      : portalNavGroups;

  return (
    <aside
      className={`fixed lg:static top-0 left-0 h-full w-64 bg-[#0f1117] flex flex-col justify-between z-40 select-none shrink-0 transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-5 h-16 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shadow-sm">
              <Layers size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-white tracking-tight">{APP_NAME}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-white/40 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Site badge */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <div className="text-xs text-white/45 font-medium truncate">
            {user?.group?.name || 'Site Yönetimi'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5">
          {currentNavGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2.5 mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/35">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const targetPath = getTenantPath(item.path);
                  const isActive =
                    location.pathname === targetPath || location.pathname === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(targetPath)}
                      className={`group w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          size={17}
                          className={`shrink-0 ${
                            isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                          }`}
                        />
                        <span className="truncate leading-none">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-white/15 text-white'
                              : 'bg-white/[0.08] text-white/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="px-4 py-3.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.05] group transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/[0.12] text-white/80 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-sm font-semibold text-white/90 truncate leading-tight">
              {user?.name}
            </span>
            <span className="text-xs text-white/40 truncate mt-0.5">
              {user?.email}
            </span>
          </div>
          <button
            onClick={() => logout()}
            title="Çıkış Yap"
            className="p-1.5 text-white/30 hover:text-rose-400 transition-colors shrink-0 rounded-lg hover:bg-white/[0.05]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
