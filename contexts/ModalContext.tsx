'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'SHARE' | 'REPORT' | 'PURCHASE' | null;

interface ModalContextType {
  isModalOpen: boolean;
  modalType: ModalType;
  currentVideoId: string | null;
  currentVideoTitle: string | null;
  currentVideoPrice: number | null;
  currentVideoCurrency: string | null;
  currentVideoType: 'paid' | 'subscription' | null;
  openShareModal: (videoId: string, videoTitle: string) => void;
  openReportModal: (videoId: string, videoTitle: string) => void;
  openPurchaseModal: (videoId: string, videoTitle: string, price: number, currency: string, type: 'paid' | 'subscription') => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [currentVideoPrice, setCurrentVideoPrice] = useState<number | null>(null);
  const [currentVideoCurrency, setCurrentVideoCurrency] = useState<string | null>(null);
  const [currentVideoType, setCurrentVideoType] = useState<'paid' | 'subscription' | null>(null);

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

  const openPurchaseModal = (videoId: string, videoTitle: string, price: number, currency: string, type: 'paid' | 'subscription') => {
    setCurrentVideoId(videoId);
    setCurrentVideoTitle(videoTitle);
    setCurrentVideoPrice(price);
    setCurrentVideoCurrency(currency);
    setCurrentVideoType(type);
    setModalType('PURCHASE');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setCurrentVideoId(null);
    setCurrentVideoTitle(null);
    setCurrentVideoPrice(null);
    setCurrentVideoCurrency(null);
    setCurrentVideoType(null);
  };

  return (
    <ModalContext.Provider
      value={{
        isModalOpen,
        modalType,
        currentVideoId,
        currentVideoTitle,
        currentVideoPrice,
        currentVideoCurrency,
        currentVideoType,
        openShareModal,
        openReportModal,
        openPurchaseModal,
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

