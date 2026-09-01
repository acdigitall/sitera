import React, { useState } from 'react';
import {
  User,
  Mail,
  Building2,
  Phone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAuth } from '../../auth';

export const PortalProfileView: React.FC = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('0555 123 45 67');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Profil bilgileriniz başarıyla güncellendi!</span>
        </div>
      )}

      {/* 1. Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-md shadow-emerald-500/20 shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-slate-900">{user?.name}</h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold w-fit mx-auto sm:mx-0">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Aktif Sakin</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-3">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 font-medium pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-600" />
              <span>{user?.group?.name || 'Sitera Teknoloji'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <User size={14} className="text-emerald-600" />
              <span>Birim: {user?.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Personal and Contact Information */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User size={16} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Kişisel Bilgiler</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Ad Soyad / Daire Tanımı</label>
            <input
              type="text"
              defaultValue={user?.name}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
              readOnly
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">E-Posta Adresi</label>
            <input
              type="email"
              defaultValue={user?.email}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
              readOnly
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">İletişim Telefonu</label>
            <div className="relative flex items-center">
              <Phone size={14} className="text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Security & Password Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock size={16} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Güvenlik ve Şifre Güncelleme</h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Mevcut Şifre</label>
            <div className="relative flex items-center">
              <KeyRound size={14} className="text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Yeni Şifre</label>
            <div className="relative flex items-center">
              <Lock size={14} className="text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                placeholder="En az 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
