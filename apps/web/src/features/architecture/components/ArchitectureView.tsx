import React from 'react';
import { Group } from '@sitera/shared';
import {
  Database,
  Server,
  RefreshCw,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { ExtendedHealthStatus } from '../services/health.api';
import { Badge } from '../../../components/common/Badge';

interface ArchitectureViewProps {
  health: ExtendedHealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  activeGroup?: Group;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  health,
  loading,
  onRefresh,
  activeGroup,
}) => {
  const isDbHealthy = !!health?.database?.includes('PostgreSQL');
  const isRedisHealthy = health?.redis === 'connected';

  return (
    <div className="flex flex-col gap-6">
      {/* 1. System Health Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PostgreSQL RLS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Database size={18} />
            </div>
            <Badge variant={isDbHealthy ? 'success' : 'danger'} size="sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDbHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {isDbHealthy ? 'RLS Aktif' : 'Bağlantı Yok'}
            </Badge>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">PostgreSQL 16</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Row-Level Security motoru ile tablo düzeyinde veri izolasyonu.
          </p>
          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
            <span>Port: 5432</span>
            <span>Database: sitera_db</span>
          </div>
        </div>

        {/* Redis Cache */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Zap size={18} />
            </div>
            <Badge variant={isRedisHealthy ? 'success' : 'warning'} size="sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRedisHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {isRedisHealthy ? 'Önbellek Hazır' : 'Bypass'}
            </Badge>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">Redis 7</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Session yönetimi, oturum token doğrulama ve L2 hızlı önbellek.
          </p>
          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
            <span>Port: 6379</span>
            <span>TTL: 24 Saat</span>
          </div>
        </div>

        {/* NestJS Core API */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Server size={18} />
            </div>
            <Badge variant="primary" size="sm">
              <span>v1.0 REST</span>
            </Badge>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">NestJS 10 API</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            AsyncLocalStorage ile thread-safe tenant context middleware.
          </p>
          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
            <span>Port: 4000</span>
            <span>Prefix: /api</span>
          </div>
        </div>

        {/* Isolation Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <ShieldCheck size={18} />
            </div>
            <Badge variant={activeGroup ? 'primary' : 'success'} size="sm">
              {activeGroup ? activeGroup.name : 'Global'}
            </Badge>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">İzolasyon Durumu</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            {activeGroup
              ? `Yalnızca "${activeGroup.name}" tenant verileri izole edilmiştir.`
              : 'Süper Yönetici yetkisi ile tüm tenant verileri izlenmektedir.'}
          </p>
          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
            <span>Policy: tenant_isolation</span>
            <span>Motor: PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive RLS Architecture Blueprint */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fade-in">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-0.5">
              Multi-Tenancy & RLS İzolasyon Mimarisi
            </h3>
            <p className="text-xs text-slate-500">
              Her gelen HTTP isteğinde uygulanan uçtan uca veri güvenliği akışı.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-secondary text-xs py-1.5 px-3"
          >
            <RefreshCw
              size={13}
              className={loading ? 'animate-spin text-indigo-600' : ''}
            />
            <span>Durumu Yenile</span>
          </button>
        </div>

        {/* Blueprint Flow Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-5">
          {/* Step 1 */}
          <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold">
              <span>1. İstemci & Token</span>
            </div>
            <div className="text-xs text-slate-600 leading-normal">
              React Web veya React Native mobil istek gönderir.
            </div>
            <div className="font-mono text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-100 p-1.5 rounded truncate">
              Authorization: Bearer sitera_tok_...
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-sky-700 text-xs font-bold">
              <span>2. Tenant Middleware</span>
            </div>
            <div className="text-xs text-slate-600 leading-normal">
              NestJS oturumu doğrular ve tenant context'e yazar.
            </div>
            <div className="font-mono text-[11px] text-sky-800 bg-sky-50 border border-sky-100 p-1.5 rounded truncate">
              x-group-id: {activeGroup?.id || 'global_view'}
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-purple-700 text-xs font-bold">
              <span>3. Redis Session</span>
            </div>
            <div className="text-xs text-slate-600 leading-normal">
              Kullanıcı oturumu Redis RAM önbelleğinden doğrulanır.
            </div>
            <div className="font-mono text-[11px] text-purple-800 bg-purple-50 border border-purple-100 p-1.5 rounded truncate">
              session:sitera_tok_... (TTL 24h)
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
              <span>4. PostgreSQL RLS</span>
            </div>
            <div className="text-xs text-slate-600 leading-normal">
              Veritabanı motoru satır bazlı izolasyon uygular.
            </div>
            <div className="font-mono text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-1.5 rounded truncate">
              SET LOCAL app.current_group_id
            </div>
          </div>
        </div>

        {/* Live SQL Query Runner Snapshot */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1 font-bold">
            PostgreSQL Canlı RLS Oturum Değişkeni:
          </div>
          <div>
            <span className="text-indigo-400 font-bold">SET LOCAL</span> app.current_group_id ={' '}
            <span className="text-emerald-400 font-bold">
              '{activeGroup?.id || 'bypass_rls'}'
            </span>
            ;
          </div>
          <div className="text-slate-500 text-[11px] mt-1">
            -- PostgreSQL POLICY "tenant_isolation_policy" bu değişkene göre yalnızca ilgili gruba ait kayıtları döner.
          </div>
        </div>
      </div>
    </div>
  );
};
