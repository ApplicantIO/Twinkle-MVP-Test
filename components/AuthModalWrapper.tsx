'use client';

import { useModal } from '@/contexts/ModalContext';
import AuthModal from '@/components/AuthModal';

/**
 * Renders the global AuthModal driven by ModalContext.
 * Used in the root layout so AuthModal is rendered once and opened via openAuthModal/closeAuthModal.
 */
export function AuthModalWrapper() {
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useModal();
  return (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      initialMode={authModalMode}
    />
  );
}
