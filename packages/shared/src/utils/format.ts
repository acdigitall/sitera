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
      return { label: 'Yönetici', color: '#6366f1' };
    default:
      return { label: 'Kullanıcı', color: '#10b981' };
  }
}
