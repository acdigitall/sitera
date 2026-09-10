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
  Calculator,
  LifeBuoy,
  CalendarClock,
  MessageSquare,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME, Permission, hasPermission, getRoleLabel } from '@sitera/shared';
import { useAuth } from '../../features/auth';
import { useFinance } from '../../features/finance';
import { useAnnouncements } from '../../features/announcements';
import { useTickets } from '../../features/tickets';
import { useSupport } from '../../features/support';

interface SidebarProps {
  userCount?: number;
  groupsCount?: number;
  upcomingRenewalsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userCount = 0,
  groupsCount = 0,
  upcomingRenewalsCount = 0,
  isOpen = false,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = !isSuperAdmin && !isAdmin;
  const { openTenantModal } = useSupport();

  const { debts, pendingPayments } = useFinance(user?.groupId, isRegularUser ? user?.id : undefined);
  const { announcements, unreadCount } = useAnnouncements(user?.groupId, user?.id);
  const { openTicketsCount } = useTickets({ groupId: user?.groupId, isStaff: !isRegularUser });

  const pendingDebtsCount = debts.filter((d) => d.status !== 'paid').length;
  const pendingApprovalsCount = pendingPayments.length;

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

  interface NavItem {
    path: string;
    label: string;
    icon: any;
    badge: string | null;
    badgeColor?: string;
    permission?: Permission;
  }

  interface NavGroup {
    label: string;
    items: NavItem[];
  }

  const superAdminNavGroups: NavGroup[] = [
    {
      label: 'Genel',
      items: [
        { path: '/admin/overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        {
          path: '/admin/sites',
          label: 'Siteler & Apartmanlar',
          icon: Building2,
          badge: groupsCount > 0 ? groupsCount.toString() : null,
        },
        {
          path: '/admin/licenses',
          label: 'Lisans & Ödeme Takvimi',
          icon: CalendarClock,
          badge: upcomingRenewalsCount > 0 ? upcomingRenewalsCount.toString() : null,
          badgeColor: 'amber',
        },
        {
          path: '/admin/messages',
          label: 'SMS & WhatsApp Paketleri',
          icon: MessageSquare,
          badge: 'Demo',
          badgeColor: 'amber',
        },
        {
          path: '/admin/modules',
          label: 'Modül & Eklentiler',
          icon: Layers,
          badge: '5 Modül',
        },
        {
          path: '/admin/users',
          label: 'Yöneticiler & Kullanıcılar',
          icon: Users2,
          badge: userCount > 0 ? userCount.toString() : null,
        },
      ],
    },
    {
      label: 'Sistem & Destek',
      items: [
        { path: '/admin/support', label: 'Destek Talepleri', icon: Headphones, badge: null },
        { path: '/admin/architecture', label: 'Veri İzolasyonu', icon: ShieldCheck, badge: 'RLS' },
        { path: '/admin/audit-logs', label: 'Audit Log', icon: ShieldCheck, badge: null },
        { path: '/admin/profile', label: 'Profil', icon: UserIcon, badge: null },
      ],
    },
  ];

  const adminNavGroups: NavGroup[] = [
    {
      label: 'Genel',
      items: [
        { path: '/admin/overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { path: '/admin/users', label: 'Daireler & Sakinler', icon: Building2, badge: userCount > 0 ? userCount.toString() : null, permission: 'users:view' },
        { path: '/admin/marketplace', label: 'Modül Pazarı', icon: Sparkles, badge: 'Yeni', badgeColor: 'indigo' },
        { path: '/admin/periods', label: 'Gider & Masraf Dağıtımı', icon: Calculator, badge: null, permission: 'finance:view' },
      ],
    },
    {
      label: 'Tahsilat & Finans',
      items: [
        { path: '/admin/debts', label: 'Borçlar & Aidatlar', icon: Receipt, badge: null, permission: 'finance:view' },
        {
          path: '/admin/payment-approvals',
          label: 'Ödeme Onayları',
          icon: CheckCircle2,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount.toString() : null,
          permission: 'finance:approve',
        },
        { path: '/admin/reminders', label: 'Hatırlatmalar', icon: Clock, badge: null, permission: 'finance:view' },
        { path: '/admin/legal', label: 'İcra Takip', icon: Scale, badge: null, permission: 'finance:view' },
      ],
    },
    {
      label: 'Raporlar & İletişim',
      items: [
        { path: '/admin/reports', label: 'Raporlar & Bilanço', icon: BarChart3, badge: null, permission: 'reports:view' },
        {
          path: '/admin/announcements',
          label: 'Duyurular',
          icon: Megaphone,
          badge: announcements.length > 0 ? announcements.length.toString() : null,
          permission: 'announcements:view',
        },
        {
          path: '/admin/tickets',
          label: 'Talep & Arıza',
          icon: LifeBuoy,
          badge: openTicketsCount > 0 ? openTicketsCount.toString() : null,
          permission: 'tickets:view',
        },
      ],
    },
    {
      label: 'Hesap & Güvenlik',
      items: [
        { path: '/admin/audit-logs', label: 'Audit Log', icon: ShieldCheck, badge: null, permission: 'audit:view' },
        { path: '/admin/profile', label: 'Profil', icon: UserIcon, badge: null },
      ],
    },
  ];

  const portalNavGroups: NavGroup[] = [
    {
      label: 'Sakin Portalı',
      items: [
        { path: '/portal/home', label: 'Ana Sayfa', icon: Home, badge: null },
        {
          path: '/portal/announcements',
          label: 'Duyurular',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount.toString() : null,
        },
        {
          path: '/portal/payments',
          label: 'Ödemelerim',
          icon: CreditCard,
          badge: pendingDebtsCount > 0 ? pendingDebtsCount.toString() : null,
        },
        { path: '/portal/tickets', label: 'Talep & Arıza', icon: LifeBuoy, badge: null },
        { path: '/portal/profile', label: 'Profilim', icon: UserIcon, badge: null },
      ],
    },
  ];

  const filteredAdminNavGroups = adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const currentNavGroups = isSuperAdmin
    ? superAdminNavGroups
    : user?.role === 'member'
      ? portalNavGroups
      : filteredAdminNavGroups;

  return (
    <aside
      className={`fixed lg:static top-0 left-0 h-full w-64 bg-[#0f1117] flex flex-col justify-between z-40 select-none shrink-0 transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
    >
      {/* Brand */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-5 h-16 flex items-center justify-between border-b border-white/[0.06]">
          <div
            onClick={() => handleNavClick(getTenantPath(isRegularUser ? '/portal/home' : '/admin/overview'))}
            className="flex items-center gap-3 cursor-pointer group"
            title={`${APP_NAME} Ana Sayfa`}
          >
            <img
              src="/logo.png"
              alt={APP_NAME}
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 ring-2 ring-white/10 shadow-sm transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[16px] text-white tracking-tight leading-none group-hover:text-teal-300 transition-colors">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-white/40 font-mono tracking-wider uppercase mt-1">
                Site ERP
              </span>
            </div>
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
                    location.pathname === targetPath ||
                    location.pathname === item.path ||
                    (item.path === '/admin/sites' && location.pathname.includes('/admin/sites') && !location.pathname.includes('/admin/licenses')) ||
                    (item.path === '/admin/licenses' && location.pathname.includes('/admin/licenses'));

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(targetPath)}
                      className={`group w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between relative ${isActive
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                        }`}
                    >
                      {/* Active left-border indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-teal-400 rounded-full" />
                      )}
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          size={17}
                          className={`shrink-0 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                            }`}
                        />
                        <span className="truncate leading-none">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            item.badgeColor === 'amber'
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold font-mono'
                              : isActive
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

      {/* Site Yöneticisi için Süper Admin Platform Destek Butonu */}
      {isAdmin && (
        <div className="px-4 py-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              openTenantModal();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:bg-teal-500/20 text-xs font-semibold transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Headphones size={15} className="text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Platform Desteği</span>
            </div>
            <ChevronRight size={13} className="text-teal-400/60" />
          </button>
        </div>
      )}

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
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-semibold text-teal-400/90 truncate">
                {getRoleLabel(user?.role)}
              </span>
            </div>
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
