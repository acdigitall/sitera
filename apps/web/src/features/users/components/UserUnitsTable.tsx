import React, { useState, useMemo, useEffect } from 'react';
import { User, formatRoleBadge, Debt } from '@sitera/shared';
import {
  Home,
  Mail,
  Phone,
  Crown,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Send,
  Check,
  KeyRound,
  UserMinus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface UserUnitsTableProps {
  loading: boolean;
  filteredUsers: User[];
  searchQuery: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  debts: Debt[];
  remindedIds: string[];
  onSelectUserDetail: (u: User) => void;
  onSendReminder: (id: string, e: React.MouseEvent) => void;
  onAssignResident?: (u: User) => void;
  onOpenPasswordReset: (u: User) => void;
  onOpenDischarge: (u: User) => void;
  onDelete: (id: string) => void;
}

export const UserUnitsTable: React.FC<UserUnitsTableProps> = ({
  loading,
  filteredUsers,
  searchQuery,
  isSuperAdmin,
  isAdmin,
  currentUserId,
  debts,
  remindedIds,
  onSelectUserDetail,
  onSendReminder,
  onAssignResident,
  onOpenPasswordReset,
  onOpenDischarge,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50); // Varsayılan 50 kayıt

  // Arama filtresi veya toplam kayıt sayısı değiştiğinde otomatik ilk sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filteredUsers.length]);

  const totalItems = filteredUsers.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedUsers = useMemo(() => {
    if (pageSize === -1) return filteredUsers;
    const start = (validPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, validPage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (validPage - 1) * (pageSize === -1 ? totalItems : pageSize) + 1;
  const endItem = pageSize === -1 ? totalItems : Math.min(validPage * pageSize, totalItems);

  const getUserDebtInfo = (u: User) => {
    const userDebts =
      debts.filter((d) => {
        if (d.userId && d.userId === u.id) return true;
        if (u.units && u.units.length > 0 && u.units.includes(d.unit)) return true;
        if (d.unit === u.name) return true;
        return false;
      }) || [];
    const unpaid = userDebts.filter((d) => d.status !== 'paid');
    const totalDebt = unpaid.reduce(
      (sum, d) => sum + (Number(d.amount) - Number(d.paidAmount)),
      0
    );
    return {
      hasDebt: totalDebt > 0,
      totalDebt,
      unpaidCount: unpaid.length,
      unpaidPeriods: unpaid.map((d) => d.title).join(', '),
    };
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs">
        Kayıtlar yükleniyor...
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-10 h-10 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
          <Home size={20} />
        </div>
        <h4 className="text-xs font-bold text-slate-900 mb-0.5">Kayıt Bulunamadı</h4>
        <p className="text-[11px] text-slate-500">
          {searchQuery
            ? 'Arama kriterlerinize uygun daire bulunamadı.'
            : 'Henüz bu kategoride daire kaydı yok.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs">
              <th className="py-3 px-4">Daire &amp; Blok</th>
              <th className="py-3 px-4">Malik / Sakin</th>
              <th className="py-3 px-4">İletişim</th>
              {isSuperAdmin && <th className="py-3 px-4">Sorumlu Yönetici</th>}
              {isAdmin && <th className="py-3 px-4">Aidat &amp; Bakiye</th>}
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedUsers.map((u) => {
              const isThisSuperAdmin = u.role === 'superadmin';
              const isSelf = u.id === currentUserId;
              const debtInfo = getUserDebtInfo(u);
              const hasDebt = debtInfo.hasDebt;
              const isReminded = remindedIds.includes(u.id);

              const isVacant = Boolean(
                !u.phone &&
                  (u.name.toLowerCase().startsWith('daire') ||
                    u.name.toLowerCase().includes('blok') ||
                    u.name === u.units?.[0] ||
                    u.name === u.group?.name ||
                    u.email.endsWith('@sitera.dev'))
              );

              return (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectUserDetail(u)}
                >
                  {/* 1. Daire(ler) & Kapı No */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <Home size={15} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.units && u.units.length > 0 ? (
                            u.units.map((unitName) => (
                              <span
                                key={unitName}
                                className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200"
                              >
                                {unitName}
                              </span>
                            ))
                          ) : (
                            <span className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                              {u.name}
                            </span>
                          )}
                          {u.units && u.units.length > 1 && (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                              {u.units.length} Daire Sahibi
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded border">
                              Siz
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {u.group?.name || 'Sitera Rezidans'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Sakin Adı & Mülkiyet Durumu */}
                  <td className="py-3 px-4">
                    {isVacant ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-400 text-xs italic font-medium">
                          Sakin Atanmadı
                        </span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded self-start">
                          Boş Daire
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">{u.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {u.role === 'member' ? (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                              {u.residentType === 'tenant'
                                ? 'Kiracı'
                                : u.residentType === 'both'
                                ? 'Malik & İkamet'
                                : 'Ev Sahibi (Malik)'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              {u.role === 'superadmin' ? 'Süper Admin' : 'Yönetici Hesabı'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* 3. İletişim */}
                  <td className="py-3 px-4">
                    {isVacant ? (
                      <span className="text-slate-400 text-xs font-mono">-</span>
                    ) : (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-mono text-slate-600 flex items-center gap-1">
                          <Mail size={11} className="text-slate-400" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Phone size={11} className="text-slate-400" />
                            {u.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Sorumlu Yönetici (Super Admin only) */}
                  {isSuperAdmin && (
                    <td className="py-3 px-4">
                      {u.admin ? (
                        <div className="text-xs text-slate-700">
                          <span className="font-semibold text-slate-900 flex items-center gap-1">
                            <Crown size={12} className="text-indigo-600" />
                            {u.admin.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {u.admin.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  )}

                  {/* 4. Aidat & Bakiye Durumu (Admin only) */}
                  {isAdmin && (
                    <td className="py-3 px-4">
                      {hasDebt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold text-xs">
                            <AlertCircle size={12} /> {debtInfo.totalDebt.toLocaleString('tr-TR')} ₺ Borç
                          </span>
                          <span
                            className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]"
                            title={debtInfo.unpaidPeriods}
                          >
                            {debtInfo.unpaidCount} Dönem Bekliyor
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-xs">
                            <CheckCircle2 size={12} /> Borcu Yok
                          </span>
                          <span className="text-[10px] text-slate-400">Tüm aidatlar ödendi</span>
                        </div>
                      )}
                    </td>
                  )}

                  {/* 5. Durum */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        u.isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>

                  {/* 6. Aksiyonlar */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {/* If vacant, show Sakin Ata button */}
                      {isVacant && isAdmin && onAssignResident && (
                        <button
                          onClick={() => onAssignResident(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs cursor-pointer"
                          title="Bu daireye malik/sakin ata"
                        >
                          <UserCheck size={12} />
                          <span>Sakin Ata</span>
                        </button>
                      )}

                      {/* SMS Hatırlat butonu (Borçlu daireler için) */}
                      {isAdmin && hasDebt && !isVacant && (
                        <button
                          onClick={(e) => onSendReminder(u.id, e)}
                          disabled={isReminded}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
                            isReminded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer'
                          }`}
                          title="SMS Hatırlatma Gönder"
                        >
                          {isReminded ? <Check size={12} /> : <Send size={12} />}
                          <span>{isReminded ? 'İletildi' : 'Hatırlat'}</span>
                        </button>
                      )}

                      {/* Şifre Belirle / Sıfırla Butonu */}
                      {!isVacant && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPasswordReset(u);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          title="Portal Giriş Şifresini Belirle / Sıfırla"
                        >
                          <KeyRound size={13} />
                        </button>
                      )}

                      {/* İlişik Kes / Tahliye Butonu */}
                      {!isVacant && onOpenDischarge && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDischarge(u);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                          title="Sakin İlişiğini Kes / Daireyi Tahliye Et"
                        >
                          <UserMinus size={13} />
                        </button>
                      )}

                      {/* Silme Butonu */}
                      {!isThisSuperAdmin && !isSelf && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(u.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Daireyi Sil"
                        >
                          <Trash2 size={13} />
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

      {/* Pagination & Summary Footer */}
      <div className="py-3 px-4 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/75">
        {/* Left: Record summary & Page size */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-slate-700">
            Toplam <strong className="text-slate-900 font-bold">{totalItems}</strong> daire arasından{' '}
            <span className="font-bold text-slate-900">{startItem} - {endItem}</span> arası gösteriliyor
          </span>

          {/* Page size selector */}
          <div className="flex items-center gap-1 sm:ml-2 text-[11px] text-slate-500">
            <span>Sayfa başı:</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded font-mono font-semibold transition-colors cursor-pointer ${
                  pageSize === size
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {size}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPageSize(-1);
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                pageSize === -1
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tümü
            </button>
          </div>
        </div>

        {/* Right: Pagination controls */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={13} />
              <span>Önceki</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - validPage) <= 1) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400 font-mono">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center justify-center ${
                          validPage === p
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Sonraki</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
