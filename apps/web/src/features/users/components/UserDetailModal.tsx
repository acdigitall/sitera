import React, { useMemo } from 'react';
import { User, formatRoleBadge, Debt } from '@sitera/shared';
import { Modal } from '../../../components/common/Modal';
import { Home, UserCheck, AlertTriangle, Phone, Mail, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface UserDetailModalProps {
  user: User | null;
  allUsers?: User[];
  debts?: Debt[];
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  allUsers = [],
  debts = [],
  onClose,
}) => {
  if (!user) return null;

  const userUnits = user.units && user.units.length > 0 ? user.units : [user.name];

  // Find linked residents (e.g., if this user is Owner, find Tenant; if Tenant, find Owner)
  const linkedResidents = useMemo(() => {
    if (!userUnits || userUnits.length === 0) return [];
    return allUsers.filter((u) => {
      if (u.id === user.id) return false;
      return u.units?.some((unit) => userUnits.includes(unit));
    });
  }, [allUsers, user, userUnits]);

  // Unit financial status
  const unitDebts = useMemo(() => {
    return debts.filter((d) => userUnits.includes(d.unit) || d.userId === user.id);
  }, [debts, userUnits, user.id]);

  const unpaidDebts = useMemo(() => unitDebts.filter((d) => d.status !== 'paid'), [unitDebts]);
  const totalUnpaid = useMemo(
    () => unpaidDebts.reduce((sum, d) => sum + (Number(d.amount) - Number(d.paidAmount)), 0),
    [unpaidDebts]
  );
  const overdueDebts = useMemo(
    () => unpaidDebts.filter((d) => d.dueDate && new Date(d.dueDate) < new Date()),
    [unpaidDebts]
  );
  const isEnforcementRisk = overdueDebts.length >= 3;

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title="Daire & Kullanıcı Detay Kartı"
    >
      <div className="space-y-4 text-xs">
        {/* 1. Primary User Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{user.name}</h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  {user.residentType === 'tenant'
                    ? 'Kiracı Sakin'
                    : user.residentType === 'both'
                    ? 'Ev Sahibi (İkamet Eden)'
                    : 'Kat Maliki (Ev Sahibi)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {formatRoleBadge(user.role).label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 font-mono">
              <Mail size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-mono">
              <Phone size={12} className="text-slate-400 shrink-0" />
              <span>{user.phone || 'Telefon Kaydı Yok'}</span>
            </div>
          </div>
        </div>

        {/* 2. Linked Resident (Kiracı veya Ev Sahibi Eşleşmesi) */}
        {linkedResidents.length > 0 ? (
          <div className="space-y-1.5">
            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <UserCheck size={13} className="text-teal-600" />
              <span>
                {user.residentType === 'owner'
                  ? 'Dairede İkamet Eden Kiracı Bilgileri'
                  : 'Dairenin Kat Maliki (Ev Sahibi) Bilgileri'}
              </span>
            </h5>
            {linkedResidents.map((lr) => (
              <div
                key={lr.id}
                className="p-3 bg-teal-50/50 border border-teal-200/80 rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{lr.name}</span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                    {lr.residentType === 'tenant' ? 'Kiracı' : 'Ev Sahibi (Malik)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-teal-600/70 shrink-0" />
                    <span className="truncate">{lr.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-teal-600/70 shrink-0" />
                    <span>{lr.phone || 'Telefon Kaydı Yok'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded text-slate-500 text-center text-[11px]">
            {user.residentType === 'owner'
              ? 'Dairede kayıtlı aktif bir kiracı bulunmuyor (Malik ikamet ediyor veya boş).'
              : 'Daireye atanmış ek bir ev sahibi kaydı bulunmuyor.'}
          </div>
        )}

        {/* 3. Daire Finansal & Borç Durumu */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Home size={13} className="text-indigo-600" />
              <span>Daire: {userUnits.join(', ')}</span>
            </span>
            {isEnforcementRisk ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold animate-pulse">
                <ShieldAlert size={11} />
                <span>İcralık / Yasal Takip Uyarısı</span>
              </span>
            ) : totalUnpaid > 0 ? (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                {unpaidDebts.length} Dönem Borçlu
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                <CheckCircle2 size={11} />
                <span>Borçsuz (Düzenli Ödüyor)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
            <div>
              <span className="text-slate-500 block">Toplam Açık Bakiye:</span>
              <span
                className={`font-bold font-mono text-sm ${
                  totalUnpaid > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {totalUnpaid.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Vadesi Geçmiş Aidat:</span>
              <span
                className={`font-bold font-mono text-sm ${
                  overdueDebts.length > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                {overdueDebts.length} Dönem
              </span>
            </div>
          </div>

          {isEnforcementRisk && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-700 font-medium">
              ⚠️ KMK Md. 20 ve 22 gereği: Kiracının ödemediği aidatlardan kat maliki de müteselsilen sorumludur. Yasal ihtar ve icra dairesi takibi açılmıştır.
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </Modal>
  );
};
