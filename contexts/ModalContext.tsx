'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'SHARE' | 'REPORT' | 'PURCHASE' | 'CLEAR_HISTORY' | 'PAUSE_HISTORY' | 'CREATOR_ABOUT' | null;

interface HistoryModalData {
  onConfirm?: () => void | Promise<void>;
}

export type AuthModalMode = 'signin' | 'signup';

interface ModalContextType {
  isModalOpen: boolean;
  modalType: ModalType;
  currentVideoId: string | null;
  currentVideoTitle: string | null;
  currentVideoPrice: number | null;
  currentVideoCurrency: string | null;
  currentVideoType: 'paid' | 'subscription' | null;
  historyModalData: HistoryModalData | null;
  creatorAboutTitle: string | null;
  creatorAboutDescription: string | null;
  openCreatorAboutModal: (title: string, description: string) => void;
  openShareModal: (videoId: string, videoTitle: string) => void;
  openReportModal: (videoId: string, videoTitle: string) => void;
  openPurchaseModal: (videoId: string, videoTitle: string, price: number, currency: string, type: 'paid' | 'subscription') => void;
  openClearHistoryModal: (onConfirm: () => void | Promise<void>) => void;
  openPauseHistoryModal: (onConfirm: () => void) => void;
  closeModal: () => void;
  // Auth modal (global, rendered in root layout)
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode: AuthModalMode) => void;
  closeAuthModal: () => void;
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
  const [historyModalData, setHistoryModalData] = useState<HistoryModalData | null>(null);
  const [creatorAboutTitle, setCreatorAboutTitle] = useState<string | null>(null);
  const [creatorAboutDescription, setCreatorAboutDescription] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: AuthModalMode) => {
    setAuthModalMode(mode === 'signin' ? 'login' : 'signup');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

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

  const openClearHistoryModal = (onConfirm: () => void | Promise<void>) => {
    setHistoryModalData({ onConfirm });
    setModalType('CLEAR_HISTORY');
    setIsModalOpen(true);
  };

  const openPauseHistoryModal = (onConfirm: () => void) => {
    setHistoryModalData({ onConfirm });
    setModalType('PAUSE_HISTORY');
    setIsModalOpen(true);
  };

  const openCreatorAboutModal = (title: string, description: string) => {
    setCreatorAboutTitle(title);
    setCreatorAboutDescription(description);
    setModalType('CREATOR_ABOUT');
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
    setHistoryModalData(null);
    setCreatorAboutTitle(null);
    setCreatorAboutDescription(null);
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
        historyModalData,
        creatorAboutTitle,
        creatorAboutDescription,
        openCreatorAboutModal,
        openShareModal,
        openReportModal,
        openPurchaseModal,
        openClearHistoryModal: openClearHistoryModal,
        openPauseHistoryModal: openPauseHistoryModal,
        closeModal,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
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

