'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '@/app/components/modal';

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  resolve?: (value: boolean) => void;
}

interface ModalContextType {
  showModal: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => Promise<boolean>;
  hideModal: () => void;
  confirmModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showModal = (
    title: string, 
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        type,
        resolve,
      });
    });
  };

  const hideModal = () => {
    if (modalConfig.resolve) {
      modalConfig.resolve(false);
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const confirmModal = () => {
    if (modalConfig.resolve) {
      modalConfig.resolve(true);
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, confirmModal }}>
      {children}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={hideModal}
        onConfirm={confirmModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}