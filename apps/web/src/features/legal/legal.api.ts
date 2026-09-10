import { apiClient } from '../../services/api-client';
import { LegalDocument, UpdateLegalDocumentDto } from '@sitera/shared';

export const legalApi = {
  /**
   * Belirli bir yasal belgeyi getirir (Halka açık).
   */
  async getDocument(type: 'terms' | 'kvkk'): Promise<LegalDocument> {
    return apiClient<LegalDocument>(`/legal/${type}`, { method: 'GET' });
  },

  /**
   * Tüm yasal belgeleri getirir (Süper Admin).
   */
  async getAllDocuments(): Promise<LegalDocument[]> {
    return apiClient<LegalDocument[]>('/legal/admin/all', { method: 'GET' });
  },

  /**
   * Yasal belgeyi günceller (Süper Admin).
   */
  async updateDocument(type: 'terms' | 'kvkk', dto: UpdateLegalDocumentDto): Promise<LegalDocument> {
    return apiClient<LegalDocument>(`/legal/${type}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Yasal belgeyi orijinal varsayılan şablona sıfırlar (Süper Admin).
   */
  async resetToDefault(type: 'terms' | 'kvkk'): Promise<LegalDocument> {
    return apiClient<LegalDocument>(`/legal/admin/reset/${type}`, {
      method: 'POST',
    });
  },
};
