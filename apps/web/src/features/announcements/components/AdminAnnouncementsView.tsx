import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Group, AnnouncementReadStats } from '@sitera/shared';
import { useAuth } from '../../auth';
import { useAnnouncements } from '../useAnnouncements';
import { StatCard } from '../../../components/common/StatCard';
import { AnnouncementFilterBar } from './AnnouncementFilterBar';
import { AnnouncementCard } from './AnnouncementCard';
import { AnnouncementStatsModal } from './AnnouncementStatsModal';
import { CreateAnnouncementDrawer } from './CreateAnnouncementDrawer';

interface AdminAnnouncementsViewProps {
  groupId?: string;
  activeGroup?: Group;
}

export const AdminAnnouncementsView: React.FC<AdminAnnouncementsViewProps> = ({
  groupId,
  activeGroup,
}) => {
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId;
  const {
    announcements,
    loading,
    createAnnouncement,
    deleteAnnouncement,
    getReadStats,
  } = useAnnouncements(effectiveGroupId, user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Read stats modal state
  const [selectedStatsAnnId, setSelectedStatsAnnId] = useState<string | null>(null);
  const [readStatsData, setReadStatsData] = useState<AnnouncementReadStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleOpenStats = async (annId: string) => {
    setSelectedStatsAnnId(annId);
    setStatsLoading(true);
    try {
      const stats = await getReadStats(annId);
      setReadStatsData(stats);
    } catch (err: any) {
      alert('Okuma istatistikleri alınamadı: ' + err.message);
      setSelectedStatsAnnId(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" başlıklı duyuruyu silmek istediğinize emin misiniz?`)) {
      try {
        await deleteAnnouncement(id);
      } catch (err: any) {
        alert('Silme hatası: ' + err.message);
      }
    }
  };

  const handleCreateAnnouncement = async (
    data: Parameters<typeof createAnnouncement>[0],
    authorName: string
  ) => {
    await createAnnouncement(data, authorName, user?.id);
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ann.authorName && ann.authorName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'important'
          ? ann.isImportant
          : ann.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [announcements, searchQuery, selectedCategory]);

  const importantCount = announcements.filter((a) => a.isImportant).length;

  return (
    <div className="space-y-6 max-w-full animate-fade-in font-sans">
      {/* 1. Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Duyuru &amp; Tebligat Yönetimi
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              Sakin İletişimi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || 'Gencosman Apartmanı'} · Blok/daire hedeflemeli, zamanlanmış ve okundu takipli resmi tebligat paneli
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Yeni Duyuru Yayınla</span>
          </button>
        </div>
      </div>

      {/* 2. 3'lü KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Yayındaki Duyurular"
          value={`${announcements.length} Adet`}
          subtitle="Portalda görünen toplam bülten"
          variant="teal"
          badge={{ text: 'Aktif Yayın', variant: 'teal' }}
          footer={
            <>
              <span>Okundu Takibi: Aktif</span>
              <span className="text-teal-700 font-bold">PostgreSQL Senkron</span>
            </>
          }
        />

        <StatCard
          title="Acil / Önemli Bildirimler"
          value={`${importantCount} Adet`}
          subtitle="Üst bantta kırmızı uyarıyla sabitlenenler"
          variant={importantCount > 0 ? 'danger' : 'default'}
          badge={{ text: 'Kritik', variant: importantCount > 0 ? 'danger' : 'neutral' }}
          footer={
            <>
              <span>Bildirim Önceliği: Yüksek</span>
              <span className={importantCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                {importantCount > 0 ? 'Dikkat Gerektirir' : 'Normal Seyir'}
              </span>
            </>
          }
        />

        <StatCard
          title="Hedefleme & Kapsam"
          value="Seçici Yayın"
          subtitle="Kat mülkiyeti rol ve lokasyon ayrımı"
          badge={{ text: 'Blok & Daire', variant: 'neutral' }}
          footer={
            <>
              <span>KMK m. 34 Yönetim Tebligatları</span>
              <span className="text-teal-700 font-semibold">Resmi Belge</span>
            </>
          }
        />
      </div>

      {/* 3. Filtreleme & Arama Çubuğu */}
      <AnnouncementFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalCount={announcements.length}
        importantCount={importantCount}
      />

      {/* 4. Duyuru Kartları Listesi */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
            Bildirimler yükleniyor...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
            Kriterlere uygun bildirim veya duyuru bulunamadı.
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              copiedId={copiedId}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onOpenStats={handleOpenStats}
            />
          ))
        )}
      </div>

      {/* 5. Okuma İstatistikleri Modalı */}
      <AnnouncementStatsModal
        isOpen={Boolean(selectedStatsAnnId)}
        statsLoading={statsLoading}
        readStatsData={readStatsData}
        onClose={() => {
          setSelectedStatsAnnId(null);
          setReadStatsData(null);
        }}
      />

      {/* 6. Yeni Duyuru Yayınlama Drawer / Modal */}
      <CreateAnnouncementDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        authorDefault={user?.name ? `${user.name} (Yönetim)` : 'Site Yönetimi'}
        onCreate={handleCreateAnnouncement}
      />
    </div>
  );
};
