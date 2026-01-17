'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';

export function ClearHistoryModal() {
  const { isModalOpen, modalType, historyModalData, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!historyModalData?.onConfirm) return;
    
    setIsLoading(true);
    try {
      await historyModalData.onConfirm();
      closeModal();
    } catch (error) {
      // Reset loading state on error so user can retry
      setIsLoading(false);
      throw error;
    }
  };

  // Reset loading state when modal closes
  const handleClose = () => {
    setIsLoading(false);
    closeModal();
  };

  if (!isModalOpen || modalType !== 'CLEAR_HISTORY') {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-surface border border-surface rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Clear watch history?</DialogTitle>
          <DialogDescription className="text-text-secondary">
            This will permanently delete all videos from your watch history. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 rounded-full border-surface bg-background hover:bg-surface hover:border-surface disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Clearing...' : 'Clear History'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
