'use client';

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export function CreatorAboutModal() {
  const { isModalOpen, modalType, creatorAboutTitle, creatorAboutDescription, closeModal } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (isModalOpen && modalType === 'CREATOR_ABOUT') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, modalType, closeModal]);

  if (!isModalOpen || modalType !== 'CREATOR_ABOUT') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 z-70"
        onClick={closeModal}
        aria-hidden
      />
      <div
        ref={modalRef}
        className="relative z-80 bg-surface border border-[#1A1A1A] rounded-[14px] shadow-xl p-5 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary pr-8 mb-2">
          {creatorAboutTitle ?? 'About'}
        </h2>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {creatorAboutDescription ?? ''}
        </p>
      </div>
    </div>
  );
}
