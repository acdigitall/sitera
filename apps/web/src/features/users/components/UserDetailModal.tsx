import React from 'react';
import { User, formatRoleBadge } from '@sitera/shared';
import { Modal } from '../../../components/common/Modal';

export interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title="Daire & Kullanıcı Bilgileri"
    >
      <div className="space-y-4 text-xs">
        <div className="space-y-2">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Ad Soyad:</span>
            <span className="font-semibold text-slate-900">{user.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">E-Posta:</span>
            <span className="font-mono text-slate-900">{user.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 items-center">
            <span className="text-slate-500">Bağlı Daire(ler):</span>
            <div className="flex gap-1 flex-wrap justify-end">
              {user.units && user.units.length > 0 ? (
                user.units.map((uName) => (
                  <span
                    key={uName}
                    className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded text-[11px]"
                  >
                    {uName}
                  </span>
                ))
              ) : (
                <span className="font-mono font-bold text-slate-900">{user.name}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Kullanıcı Rolü:</span>
            <span className="font-semibold">{formatRoleBadge(user.role).label}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Organizasyon:</span>
            <span className="font-semibold">{user.group?.name || 'Sitera Rezidans'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">İletişim Telefonu:</span>
            <span className="font-mono text-slate-900">{user.phone || '+90 555 123 4567'}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </Modal>
  );
};
