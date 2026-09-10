export type LegalDocumentType = 'terms' | 'kvkk';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLegalDocumentDto {
  title?: string;
  content?: string;
  version?: string;
  isActive?: boolean;
}
