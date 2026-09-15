import React, { useState, useMemo, useRef } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Camera,
  UploadCloud,
  FileText,
  MapPin,
  X,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  List
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useTickets } from '../../tickets';
import { TicketStatus, validateBrowserFile, MAX_PHOTO_SIZE_BYTES, PHOTO_ALLOWED_MIME_TYPES } from '@sitera/shared';
import { financeApi } from '../../finance/finance.api';

// (Mock) Routine checklist for staff
const DAILY_TASKS = [
  { id: 't1', label: 'Sabah blok çöplerinin toplanması', completed: false },
  { id: 't2', label: 'Asansör kabin ve ayna temizliği', completed: false },
  { id: 't3', label: 'Kazan dairesi basınç kontrolü', completed: false },
  { id: 't4', label: 'Çevre aydınlatmalarının kontrolü', completed: false },
];

export const StaffDashboardView: React.FC = () => {
  const { user } = useAuth();
  const {
    tickets,
    loading: loadingTickets,
    updateStatus,
    openTicketsCount,
    inProgressCount,
  } = useTickets({
    groupId: user?.groupId,
    isStaff: true,
  });

  const [activeTab, setActiveTab] = useState<'tickets' | 'expense' | 'routine'>('tickets');
  
  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePhoto, setExpensePhoto] = useState<string | null>(null);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tickets Filter & Actions State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open_and_progress' | 'resolved'>('open_and_progress');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [staffNotesText, setStaffNotesText] = useState('');

  // Daily Tasks State
  const [tasks, setTasks] = useState(DAILY_TASKS);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter === 'open_and_progress') {
        return t.status === 'open' || t.status === 'in_progress';
      }
      return t.status === 'resolved' || t.status === 'closed';
    });
  }, [tickets, statusFilter]);

  const handleStatusChange = async (ticketId: string, currentNotes: string | null | undefined, newStatus: TicketStatus) => {
    setActionLoadingId(ticketId);
    try {
      await updateStatus(ticketId, {
        status: newStatus,
        adminNotes: currentNotes ? currentNotes : undefined, // Keep existing notes
      });
    } catch (err: any) {
      alert('Durum güncellenirken hata: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveNotes = async (ticketId: string, currentStatus: TicketStatus) => {
    setActionLoadingId(ticketId);
    try {
      await updateStatus(ticketId, {
        status: currentStatus,
        adminNotes: staffNotesText.trim(),
      });
      setEditingNotesId(null);
    } catch (err: any) {
      alert('Not kaydedilirken hata: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Expense Handlers ---
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExpenseError(null);
    const validation = await validateBrowserFile(file, {
      maxSizeBytes: MAX_PHOTO_SIZE_BYTES,
      allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
      scanMaliciousSignatures: true,
    });

    if (!validation.isValid) {
      setExpenseError(validation.error || `Güvenlik kontrolünden geçemedi.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setExpensePhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || !expensePhoto) {
      setExpenseError('Lütfen tüm alanları (Masraf açıklaması, Tutar ve Fiş/Fatura fotoğrafı) doldurun.');
      return;
    }

    setExpenseSubmitting(true);
    setExpenseError(null);
    try {
      await financeApi.createExpense({
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        status: 'unpaid',
      });
      
      setExpenseSuccess('Masraf başarıyla yönetici onayına iletildi.');
      setExpenseTitle('');
      setExpenseAmount('');
      setExpensePhoto(null);
      setTimeout(() => setExpenseSuccess(null), 5000);
    } catch (err: any) {
      setExpenseError('Masraf iletilirken hata oluştu: ' + err.message);
    } finally {
      setExpenseSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="text-teal-700" size={26} />
            <span>Personel Görev Paneli</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Saha operasyonları, arıza talepleri ve masraf bildirimleri
          </p>
        </div>
        
        {/* TOP TAB NAVIGATION */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap rounded-lg flex items-center gap-2 ${
              activeTab === 'tickets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} className={activeTab === 'tickets' ? 'text-teal-700' : ''} />
            <span>Bekleyen İşler ({openTicketsCount + inProgressCount})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap rounded-lg flex items-center gap-2 ${
              activeTab === 'routine' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List size={14} className={activeTab === 'routine' ? 'text-teal-700' : ''} />
            <span>Rutin Görevler</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap rounded-lg flex items-center gap-2 ${
              activeTab === 'expense' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} className={activeTab === 'expense' ? 'text-teal-700' : ''} />
            <span>Masraf & Fiş Gir</span>
          </button>
        </div>
      </div>

      {/* 1. TICKETS (İŞ EMİRLERİ) TAB */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setStatusFilter('open_and_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                statusFilter === 'open_and_progress' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Yapılacak İşler ({openTicketsCount + inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                statusFilter === 'resolved' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tamamlananlar
            </button>
          </div>

          {loadingTickets && filteredTickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Görevler yükleniyor...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              Bu kategoride bekleyen bir görev yok. Eline sağlık!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTickets.map((t) => {
                const isProcessing = actionLoadingId === t.id;
                const isEditingNotes = editingNotesId === t.id;

                return (
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold font-mono">
                            {t.unit}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{t.category}</span>
                        </div>
                        {t.urgency === 'urgent' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            🔴 ACİL
                          </span>
                        )}
                      </div>
                      
                      <div className="py-3">
                        <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed line-clamp-3">
                          {t.description}
                        </p>
                        
                        {t.location && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-medium">
                            <MapPin size={14} className="text-slate-400" />
                            <span>{t.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 space-y-3">
                      {/* Çözüm Notu Alanı */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-teal-700" />
                            <span>Müdahale Notu:</span>
                          </span>
                          {!isEditingNotes && t.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNotesId(t.id);
                                setStaffNotesText(t.adminNotes || '');
                              }}
                              className="text-[11px] font-bold text-teal-700 hover:underline"
                            >
                              {t.adminNotes ? 'Düzenle' : '+ Not Ekle'}
                            </button>
                          )}
                        </div>

                        {isEditingNotes ? (
                          <div className="space-y-2">
                            <textarea
                              value={staffNotesText}
                              onChange={(e) => setStaffNotesText(e.target.value)}
                              rows={2}
                              placeholder="Ne yapıldı?"
                              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                              >
                                İptal
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleSaveNotes(t.id, t.status)}
                                className="px-3 py-1 bg-teal-700 text-white text-xs font-bold rounded-lg"
                              >
                                Kaydet
                              </button>
                            </div>
                          </div>
                        ) : t.adminNotes ? (
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                            {t.adminNotes}
                          </div>
                        ) : null}
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {t.status === 'open' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(t.id, t.adminNotes, 'in_progress')}
                            className="flex-1 py-2 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            İşleme Al (Başla)
                          </button>
                        )}
                        
                        {(t.status === 'open' || t.status === 'in_progress') && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(t.id, t.adminNotes, 'resolved')}
                            className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={14} />
                            <span>İşi Bitir</span>
                          </button>
                        )}

                        {t.status === 'resolved' && (
                          <div className="w-full text-center py-2 text-emerald-700 font-bold text-xs bg-emerald-50 rounded-lg border border-emerald-200">
                            ✅ Bu Görev Tamamlandı
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. EXPENSE (MASRAF/FİŞ) TAB */}
      {activeTab === 'expense' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs max-w-2xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Masraf & Fiş Bildirimi</h2>
            <p className="text-xs text-slate-500 mt-1">
              Satın aldığınız malzemelerin fişini çekin, tutarı girip yönetici onayına sunun.
            </p>
          </div>

          {expenseSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-700" />
                <span>{expenseSuccess}</span>
              </div>
              <button onClick={() => setExpenseSuccess(null)} className="text-teal-700"><X size={14} /></button>
            </div>
          )}

          {expenseError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600" />
              <span>{expenseError}</span>
            </div>
          )}

          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ne İçin Harcandı? (Açıklama)</label>
              <input
                type="text"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Örn: Kapıcı dairesi ampul değişimi, temizlik bezi vs."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tutar (TL)</label>
              <div className="relative w-48">
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-8 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-bold">₺</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Fiş / Fatura Fotoğrafı</label>
              {!expensePhoto ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-600 bg-slate-50/70 hover:bg-teal-50/20 transition-all rounded-xl p-6 text-center cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Camera size={24} className="mx-auto text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-800">
                    Fotoğraf Çek veya Seç
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 inline-block">
                  <img src={expensePhoto} alt="Fiş" className="h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setExpensePhoto(null)}
                    className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 shadow-md hover:bg-rose-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={expenseSubmitting}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {expenseSubmitting ? 'İletiliyor...' : (
                  <>
                    <UploadCloud size={18} />
                    <span>Fişi Gönder ve Onay İste</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. ROUTINE (GÜNLÜK GÖREVLER) TAB */}
      {activeTab === 'routine' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs max-w-2xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Günlük Rutin Görevler</h2>
            <p className="text-xs text-slate-500 mt-1">
              Bugün yapılması gereken periyodik işleri tamamladıkça işaretleyin.
            </p>
          </div>
          
          <div className="space-y-2">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {task.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
