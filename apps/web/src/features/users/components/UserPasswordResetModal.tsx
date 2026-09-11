import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UpdateUserDto } from '@sitera/shared';
import { KeyRound, X, CheckCircle2, Copy, Check, Eye, EyeOff, Shuffle } from 'lucide-react';

export interface UserPasswordResetModalProps {
  user: User | null;
  activeGroupName?: string;
  onClose: () => void;
  onUpdate?: (id: string, dto: UpdateUserDto) => Promise<any>;
}

export const UserPasswordResetModal: React.FC<UserPasswordResetModalProps> = ({
  user,
  activeGroupName,
  onClose,
  onUpdate,
}) => {
  const [newPassword, setNewPassword] = useState('User123!');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setNewPassword('User123!');
      setShowNewPassword(false);
      setPasswordResetSuccess(false);
      setPasswordCopied(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, onClose]);

  if (!user) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !onUpdate) return;
    setIsUpdatingPassword(true);
    try {
      await onUpdate(user.id, { password: newPassword });
      setPasswordResetSuccess(true);
      const shareText = `Sayın ${user.name},\n${activeGroupName || 'Sitera'} Sakin Portalı giriş bilgileriniz güncellenmiştir.\n\n🔗 Giriş: ${window.location.origin}/login\n📧 E-Posta: ${user.email}\n🔑 Yeni Şifreniz: ${newPassword}\n\nGiriş yaptıktan sonra aidat durumunuzu ve duyuruları takip edebilirsiniz.`;
      navigator.clipboard.writeText(shareText);
      setPasswordCopied(true);
    } catch (err: any) {
      alert('Şifre güncellenirken hata oluştu: ' + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <KeyRound size={18} className="text-indigo-600" />
            Sakin Portal Şifresi Belirle
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {passwordResetSuccess ? (
          <div className="py-4 space-y-4 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Şifre Başarıyla Güncellendi!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Sakin için yeni giriş şifresi veritabanına kaydedildi ve sakinle paylaşma metni panoya kopyalandı.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-left space-y-1.5 font-mono">
              <div className="text-slate-500">
                Sakin: <span className="text-slate-900 font-bold">{user.name}</span>
              </div>
              <div className="text-slate-500">
                E-Posta: <span className="text-slate-900 font-bold">{user.email}</span>
              </div>
              <div className="text-slate-500">
                Yeni Şifre:{' '}
                <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {newPassword}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const shareText = `Sayın ${user.name},\n${activeGroupName || 'Sitera'} Sakin Portalı giriş bilgileriniz güncellenmiştir.\n\n🔗 Giriş: ${window.location.origin}/login\n📧 E-Posta: ${user.email}\n🔑 Yeni Şifreniz: ${newPassword}\n\nGiriş yaptıktan sonra aidat durumunuzu ve duyuruları takip edebilirsiniz.`;
                  navigator.clipboard.writeText(shareText);
                  setPasswordCopied(true);
                  setTimeout(() => setPasswordCopied(false), 3000);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {passwordCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{passwordCopied ? 'Bilgiler Panoya Kopyalandı!' : 'Bilgileri Yeniden Kopyala (WhatsApp)'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <div className="font-semibold text-slate-900 text-xs">{user.name}</div>
              <div className="text-slate-500 text-[11px] font-mono">{user.email}</div>
              <div className="text-indigo-600 text-[11px] font-medium">
                {user.units?.join(', ') || 'Daire'}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Yeni Giriş Şifresi</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Shuffle size={11} />
                  <span>Rastgele Üret</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all pr-8"
                  placeholder="Şifre belirleyin"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Hızlı Şablonlar:</span>
                <button
                  type="button"
                  onClick={() => setNewPassword('User123!')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] cursor-pointer"
                >
                  User123!
                </button>
                <button
                  type="button"
                  onClick={() => setNewPassword('123456')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] cursor-pointer"
                >
                  123456
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check size={13} />
                <span>{isUpdatingPassword ? 'Kaydediliyor...' : 'Şifreyi Kaydet & Kopyala'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
