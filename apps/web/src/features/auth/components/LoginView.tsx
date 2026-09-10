import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../../../components/common/Spinner';

export const LoginView: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Lütfen e-posta adresinizi giriniz.');
      return;
    }
    if (!password) {
      setLocalError('Lütfen şifrenizi giriniz.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setLocalError(err.message || 'Giriş yapılamadı. E-posta veya şifrenizi kontrol ediniz.');
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 font-sans text-slate-900 p-4 sm:p-8 select-none">
      {/* Top Brand Bar */}
      <header className="h-16 flex items-center justify-center sm:justify-start max-w-md sm:max-w-none mx-auto sm:mx-0 w-full sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Sitera Logo"
            className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs"
          />
          <span className="font-extrabold tracking-tight text-slate-900 text-lg">Sitera</span>
        </div>
      </header>

      {/* Centered Auth Card - Enlarged & Comfortable */}
      <main className="w-full max-w-[440px] mx-auto my-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-9 shadow-sm">
          {/* Header with Centered Emblem */}
          <div className="mb-6 text-center">
            <div className="inline-flex p-2 bg-white rounded-2xl shadow-md border border-slate-100 mb-3">
              <img
                src="/logo.png"
                alt="Sitera Logo"
                className="w-16 h-16 rounded-xl object-contain"
              />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sitera Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Site Yönetimi ve Sakin Paneline Giriş Yapın
            </p>
          </div>

          {/* Error Message */}
          {activeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 mb-5 flex items-center gap-2.5 text-xs sm:text-sm">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-700" htmlFor="email">
                E-Posta Adresi
              </label>
              <div className="relative flex items-center">
                <Mail size={15} className="text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors shadow-2xs"
                  placeholder="ornek@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-700" htmlFor="password">
                  Şifre
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Şifrenizi sıfırlamak için lütfen bina yöneticiniz ile iletişime geçiniz.');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Şifremi Unuttum
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock size={15} className="text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors shadow-2xs"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Beni hatırla</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-2xs cursor-pointer"
            >
              {isLoading ? (
                <Spinner size={16} className="text-white" text="Oturum Açılıyor..." />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Sakin Bilgilendirme Notu */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-0.5">Daire Sakinleri İçin Bilgilendirme:</span>
            Site yönetiminiz tarafından tanımlanan e-posta adresiniz ve şifrenizle giriş yapabilirsiniz (İlk tanımlamalarda varsayılan şifre: <code className="font-mono text-indigo-600 font-bold">User123!</code>). Şifrenizi unuttuysanız yöneticiniz tek tıkla şifrenizi sıfırlayabilir.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-center text-xs text-slate-400">
        © {new Date().getFullYear()} Sitera Bilişim Sistemleri. Tüm hakları saklıdır.
      </footer>
    </div>
  );
};
