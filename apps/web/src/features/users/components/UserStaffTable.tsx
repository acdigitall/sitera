import React from 'react';
import { User, formatRoleBadge } from '@sitera/shared';
import { ShieldCheck, Plus, CheckCircle2, KeyRound, Trash2 } from 'lucide-react';

export interface UserStaffTableProps {
  loading: boolean;
  staffUsers: User[];
  searchQuery: string;
  roleFilter: string;
  currentUserId?: string;
  onOpenCreate: (isStaff: boolean) => void;
  onOpenPasswordReset: (user: User) => void;
  onDelete: (id: string) => void;
}

export const UserStaffTable: React.FC<UserStaffTableProps> = ({
  loading,
  staffUsers,
  searchQuery,
  roleFilter,
  currentUserId,
  onOpenCreate,
  onOpenPasswordReset,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs font-mono">
        Personel kayıtları yükleniyor...
      </div>
    );
  }

  if (staffUsers.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white">
        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          {searchQuery || roleFilter !== 'all'
            ? 'Aramaya Uygun Personel Bulunamadı'
            : 'Henüz Tanımlı Personel Yok'}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          {searchQuery || roleFilter !== 'all'
            ? 'Farklı bir arama terimi veya görev filtresi deneyebilirsiniz.'
            : 'Sitenize hizmet veren Mali Müşavir, Denetçi, Güvenlik Görevlisi veya Teknik Ekip hesabını buradan tanımlayabilirsiniz.'}
        </p>
        {!searchQuery && roleFilter === 'all' && (
          <button
            onClick={() => onOpenCreate(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Yeni Personel / Yetkili Ekle</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs">
              <th className="py-3 px-4">Personel / Görevli</th>
              <th className="py-3 px-4">Rol &amp; Unvan</th>
              <th className="py-3 px-4">Yetki Kapsamı</th>
              <th className="py-3 px-4">İletişim</th>
              <th className="py-3 px-4">Sistem Girişi</th>
              <th className="py-3 px-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {staffUsers.map((staff) => {
              const badge = formatRoleBadge(staff.role);
              const isSelf = staff.id === currentUserId;
              return (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* 1. Personel Adı */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{staff.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              Siz
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{staff.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Rol Rozeti */}
                  <td className="py-3 px-4">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${badge.color}15`,
                        color: badge.color,
                        border: `1px solid ${badge.color}30`,
                      }}
                    >
                      {staff.role === 'accountant' && '💼'}
                      {staff.role === 'auditor' && '⚖️'}
                      {staff.role === 'security' && '🛡️'}
                      {staff.role === 'staff' && '🔧'}
                      {staff.role === 'admin' && '🏢'}
                      <span>{badge.label}</span>
                    </span>
                  </td>

                  {/* 3. Yetki Kapsamı */}
                  <td className="py-3 px-4">
                    {staff.role === 'accountant' && (
                      <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Finans, Aidat &amp; Ödeme Onaylama
                      </span>
                    )}
                    {staff.role === 'auditor' && (
                      <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Mizan &amp; Bilanço İnceleme (Salt-Okunur)
                      </span>
                    )}
                    {staff.role === 'security' && (
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Sakin &amp; Danışma Teyidi (Finans Erişimi Yok)
                      </span>
                    )}
                    {staff.role === 'staff' && (
                      <span className="text-[11px] text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Arıza &amp; Teknik İş Emirleri
                      </span>
                    )}
                    {staff.role === 'admin' && (
                      <span className="text-[11px] text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Site Genel Yöneticisi
                      </span>
                    )}
                  </td>

                  {/* 4. İletişim */}
                  <td className="py-3 px-4 font-mono text-slate-600">{staff.phone || '—'}</td>

                  {/* 5. Durum */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 size={11} />
                      <span>Aktif</span>
                    </span>
                  </td>

                  {/* 6. İşlemler */}
                  <td className="py-3 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onOpenPasswordReset(staff)}
                        title="Şifre Sıfırla & Bilgileri Gönder"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      >
                        <KeyRound size={14} />
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => onDelete(staff.id)}
                          title="Personeli Kaldır"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Staff Footer */}
      <div className="py-2.5 px-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
        <span className="font-mono">Toplam {staffUsers.length} yetkili personel listeleniyor</span>
        <span className="text-[11px] text-teal-700 font-semibold">Sitera Yetki ve Rol Yönetimi</span>
      </div>
    </>
  );
};
