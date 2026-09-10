import React from 'react';
import {
  Flame,
  Wrench,
  Users,
  Info,
  Building2,
  Home,
  ShieldCheck,
  Layers,
  Clock,
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  Trash2,
  Eye,
  CheckCheck,
} from 'lucide-react';

export interface AnnouncementCardProps {
  ann: any;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onDelete: (id: string, title: string) => void;
  onOpenStats: (id: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  ann,
  copiedId,
  onCopy,
  onDelete,
  onOpenStats,
}) => {
  const isScheduled =
    ann.status === 'scheduled' ||
    (ann.publishAt && new Date(ann.publishAt) > new Date());
  const readPercent = ann.readPercentage ?? 0;
  const readCount = ann.readCount ?? ann.readReceipts?.length ?? 0;
  const totalUnits = ann.totalTargetUnits ?? 5;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Acil':
      case 'Kesinti':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame size={12} /> {cat}
          </span>
        );
      case 'Bakım':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Wrench size={12} /> Bakım & Onarım
          </span>
        );
      case 'Toplantı':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <Users size={12} /> Genel Kurul / Toplantı
          </span>
        );
      case 'Aidat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            Aidat & Bütçe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info size={12} /> Genel Bilgilendirme
          </span>
        );
    }
  };

  const getTargetBadge = (targetAnn: any) => {
    if (targetAnn.targetScope === 'block' && targetAnn.targetBlocks?.length) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
          <Building2 size={11} /> {targetAnn.targetBlocks.join(', ')} Özel
        </span>
      );
    }
    if (targetAnn.targetScope === 'unit' && targetAnn.targetUnits?.length) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
          <Home size={11} /> {targetAnn.targetUnits.length} Daireye Özel
        </span>
      );
    }
    if (targetAnn.targetScope === 'role') {
      const roleLabel =
        targetAnn.targetRole === 'owner'
          ? 'Sadece Kat Malikleri'
          : targetAnn.targetRole === 'resident'
          ? 'Sadece Kiracılar'
          : 'Tüm Roller';
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
          <ShieldCheck size={11} /> {roleLabel}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
        <Layers size={11} /> Tüm Site Sakinleri
      </span>
    );
  };

  return (
    <div
      className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
        ann.isImportant
          ? 'border-rose-300 border-l-4 border-l-rose-600 bg-rose-50/15'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          {getCategoryBadge(ann.category)}
          {getTargetBadge(ann)}

          {isScheduled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
              <Clock size={11} /> Zamanlandı
              {ann.publishAt && (
                <span className="font-mono text-[10px]">
                  ({new Date(ann.publishAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} {new Date(ann.publishAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </span>
          )}

          {ann.isImportant && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
              <AlertTriangle size={11} /> Acil / Önemli
            </span>
          )}

          <h3 className="font-bold text-slate-900 text-base">{ann.title}</h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-slate-700">
            <Building2 size={13} className="text-teal-700" />
            {ann.authorName || 'Site Yönetimi'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-500 font-mono">
            <Calendar size={13} />
            {new Date(ann.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => onCopy(ann.id, `${ann.title}\n\n${ann.content}`)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Metni Kopyala"
            >
              {copiedId === ann.id ? <Check size={14} className="text-teal-700" /> : <Copy size={14} />}
            </button>

            <button
              type="button"
              onClick={() => onDelete(ann.id, ann.title)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Duyuruyu Sil"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3.5 text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
        {ann.content}
      </div>

      {/* CANLI OKUNMA İLERLEME ÇUBUĞU */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200/70">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
            <Eye size={14} className="text-teal-700" />
            <span>Okunma Oranı:</span>
          </div>

          <div className="flex-1">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  readPercent >= 80
                    ? 'bg-emerald-600'
                    : readPercent >= 40
                    ? 'bg-teal-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.max(4, readPercent)}%` }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0">
            %{readPercent} ({readCount}/{totalUnits} Daire)
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenStats(ann.id)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 bg-white hover:bg-teal-50 px-3 py-1.5 rounded-md border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
        >
          <CheckCheck size={14} className="text-teal-700" />
          <span>Okuyanları İncele</span>
        </button>
      </div>
    </div>
  );
};
