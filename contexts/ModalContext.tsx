'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'SHARE' | 'REPORT' | null;

interface ModalContextType {
  isModalOpen: boolean;
  modalType: ModalType;
  currentVideoId: string | null;
  currentVideoTitle: string | null;
  openShareModal: (videoId: string, videoTitle: string) => void;
  openReportModal: (videoId: string, videoTitle: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);

  const openShareModal = (videoId: string, videoTitle: string) => {
    setCurrentVideoId(videoId);
    setCurrentVideoTitle(videoTitle);
    setModalType('SHARE');
    setIsModalOpen(true);
  };

  const openReportModal = (videoId: string, videoTitle: string) => {
    setCurrentVideoId(videoId);
    setCurrentVideoTitle(videoTitle);
    setModalType('REPORT');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setCurrentVideoId(null);
    setCurrentVideoTitle(null);
  };

  return (
    <ModalContext.Provider
      value={{
        isModalOpen,
        modalType,
        currentVideoId,
        currentVideoTitle,
        openShareModal,
        openReportModal,
        closeModal,
      }}
    >
      {children}
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

