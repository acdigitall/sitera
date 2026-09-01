import React, { useState } from 'react';
import {
  Bell,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

export const PortalAnnouncementsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const announcements = [
    {
      id: '1',
      title: 'Aylık Bina & Tesis Bakımı Hakkında',
      date: '30 Ağustos 2026',
      author: 'Bina Yönetimi',
      category: 'Bakım',
      badgeVariant: 'warning',
      isImportant: true,
      content:
        'Değerli bina sakinlerimiz, perşembe günü saat 10:00 - 13:00 arasında sitemizin ortak hidrofor ve asansör sistemlerinin rutin yıllık bakımı gerçekleştirilecektir. Bakım süresince kısa süreli su ve asansör kesintileri yaşanabilir. Anlayışınız için teşekkür ederiz.',
    },
    {
      id: '2',
      title: 'Eylül 2026 Aidat ve Ortak Gider Bildirimi',
      date: '28 Ağustos 2026',
      author: 'Finans Yönetimi',
      category: 'Aidat',
      badgeVariant: 'primary',
      isImportant: false,
      content:
        'Eylül ayı bina ortak gider aidat tutarları belirlenmiştir. Dairelerinize ait ödeme dökümlerini Ödemelerim sekmesinden görüntüleyebilir ve son ödeme tarihi olan 15 Eylül tarihine kadar ödemelerinizi tamamlayabilirsiniz.',
    },
    {
      id: '3',
      title: 'Kapalı Otopark Temizlik ve Düzenleme Çalışması',
      date: '22 Ağustos 2026',
      author: 'Teknik Servis',
      category: 'Genel',
      badgeVariant: 'secondary',
      isImportant: false,
      content:
        'Cumartesi günü -1 ve -2 kapalı otopark katlarında zemin yıkama ve çizgi yenileme çalışması yapılacaktır. Lütfen araçlarınızı belirtilen saatlerde tahsis edilen açık otopark alanlarına park ediniz.',
    },
    {
      id: '4',
      title: 'Yıllık Olağan Kat Malikleri Toplantı Çağrısı',
      date: '15 Ağustos 2026',
      author: 'Yönetim Kurulu',
      category: 'Toplantı',
      badgeVariant: 'pink',
      isImportant: true,
      content:
        'Sitemizin 2026-2027 dönemi tahmini bütçesinin görüşüleceği ve yönetim kurulu seçiminin yapılacağı Yıllık Olağan Genel Kurul Toplantısı 10 Eylül Pazar günü saat 14:00’te sosyal tesis toplantı salonunda yapılacaktır.',
    },
  ];

  const filtered = announcements.filter((ann) => {
    const matchesSearch =
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ann.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Search & Filter Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Duyurularda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-sm focus:border-indigo-500"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="Bakım">Bakım</option>
              <option value="Aidat">Aidat</option>
              <option value="Toplantı">Toplantı</option>
              <option value="Genel">Genel</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Toplam <span className="font-bold text-slate-900">{filtered.length}</span> duyuru listeleniyor
        </div>
      </div>

      {/* Announcements List */}
      <div className="flex flex-col gap-4">
        {filtered.map((ann) => (
          <div
            key={ann.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge variant={ann.badgeVariant as any} size="sm">
                  {ann.category}
                </Badge>
                {ann.isImportant && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1">
                    <AlertTriangle size={11} /> Önemli Bildirim
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-slate-600">
                  <Building2 size={13} className="text-indigo-600" />
                  {ann.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {ann.date}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {ann.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
