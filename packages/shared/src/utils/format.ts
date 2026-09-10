export function formatFullName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatRoleBadge(role: string): { label: string; color: string } {
  switch (role) {
    case 'superadmin':
      return { label: 'Süper Admin', color: '#ec4899' };
    case 'admin':
      return { label: 'Site Yöneticisi', color: '#6366f1' };
    case 'accountant':
      return { label: 'Mali Müşavir / Muhasebeci', color: '#2563eb' };
    case 'auditor':
      return { label: 'Denetçi / Denetim Kurulu', color: '#9333ea' };
    case 'security':
      return { label: 'Güvenlik Görevlisi', color: '#d97706' };
    case 'staff':
      return { label: 'Teknik Personel', color: '#475569' };
    case 'editor':
      return { label: 'Site Editörü', color: '#0891b2' };
    case 'member':
      return { label: 'Kat Maliki / Sakin', color: '#0d9488' };
    default:
      return { label: role || 'Kullanıcı', color: '#10b981' };
  }
}
