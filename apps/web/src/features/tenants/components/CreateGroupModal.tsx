import React, { useState } from 'react';
import { CreateGroupDto, GroupPlan } from '@sitera/shared';
import { Building2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateGroupDto) => Promise<any>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<GroupPlan>('free');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Lütfen grup adını ve slug alanını doldurunuz.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name, slug, plan });
      setName('');
      setSlug('');
      setPlan('free');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Grup oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Organizasyon Oluştur"
      icon={<Building2 size={20} className="text-indigo-600" />}
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-xs font-medium mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Organizasyon (Şirket) Adı
          </label>
          <input
            type="text"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm placeholder-slate-400"
            placeholder="örn. Nexus Holding"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Slug (Benzersiz Tanımlayıcı)
          </label>
          <input
            type="text"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm placeholder-slate-400"
            placeholder="örn. nexus-holding"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">Abonelik Planı</label>
          <select
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
            value={plan}
            onChange={(e) => setPlan(e.target.value as GroupPlan)}
          >
            <option value="free">FREE (Ücretsiz Başlangıç)</option>
            <option value="pro">PRO (Profesyonel)</option>
            <option value="enterprise">ENTERPRISE (Kurumsal & Özel İzolasyon)</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            {submitting ? 'Oluşturuluyor...' : 'Organizasyon Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
