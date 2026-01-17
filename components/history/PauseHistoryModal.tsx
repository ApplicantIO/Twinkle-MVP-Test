'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';

export function PauseHistoryModal() {
  const { isModalOpen, modalType, historyModalData, closeModal } = useModal();

  const handleConfirm = () => {
    if (historyModalData?.onConfirm) {
      historyModalData.onConfirm();
    }
    closeModal();
  };

  if (!isModalOpen || modalType !== 'PAUSE_HISTORY') {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-md bg-surface border border-surface rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Pause watch history?</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Pausing watch history can make it harder to find videos you've watched and may result in seeing fewer recommendations for new videos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={closeModal}
            className="flex-1 rounded-full border-surface bg-background hover:bg-surface hover:border-surface"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-accent hover:bg-accent/90"
          >
            Pause
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
