import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '../services/support.api';

export interface SupportSession {
  ticketId: string;
  targetGroupId: string;
  targetGroupSlug: string;
  targetGroupName: string;
  reason: string;
}

interface SupportContextType {
  supportSession: SupportSession | null;
  isInSupportMode: boolean;
  enterSupportMode: (session: SupportSession) => void;
  exitSupportMode: () => void;
  isTenantModalOpen: boolean;
  openTenantModal: () => void;
  closeTenantModal: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

const STORAGE_KEY = 'sitera_support_session';

export const SupportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [supportSession, setSupportSession] = useState<SupportSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);

  const enterSupportMode = (session: SupportSession) => {
    setSupportSession(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
  };

  const exitSupportMode = () => {
    if (supportSession?.ticketId) {
      supportApi.exitImpersonation(supportSession.ticketId).catch(() => {});
    }
    setSupportSession(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const openTenantModal = () => setIsTenantModalOpen(true);
  const closeTenantModal = () => setIsTenantModalOpen(false);

  return (
    <SupportContext.Provider
      value={{
        supportSession,
        isInSupportMode: !!supportSession,
        enterSupportMode,
        exitSupportMode,
        isTenantModalOpen,
        openTenantModal,
        closeTenantModal,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = (): SupportContextType => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};
