'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

interface HistoryManagementSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearHistory: () => void;
  isHistoryPaused: boolean;
  onPauseHistory: (paused: boolean) => void;
}

export default function HistoryManagementSidebar({
  searchQuery,
  onSearchChange,
  onClearHistory,
  isHistoryPaused,
  onPauseHistory,
}: HistoryManagementSidebarProps) {
  const { openClearHistoryModal, openPauseHistoryModal } = useModal();

  return (
    <div className="space-y-5">
      {/* Search History */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Search History
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-surface border-surface/50 text-text-primary rounded-md"
          />
        </div>
      </div>

      {/* Clear History */}
      <div>
        <Button
          variant="outline"
          onClick={() => openClearHistoryModal(onClearHistory)}
          className="w-full justify-start bg-surface border-surface/50 text-text-primary hover:bg-destructive hover:text-white hover:border-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      {/* Pause History */}
      <div>
        <Button
          variant="outline"
          onClick={() => {
            if (isHistoryPaused) {
              // Resume immediately (no confirmation needed)
              onPauseHistory(false);
            } else {
              // Show confirmation modal for pausing
              openPauseHistoryModal(() => {
                onPauseHistory(true);
              });
            }
          }}
          className="w-full justify-start bg-surface border-surface/50 text-text-primary hover:bg-background"
        >
          {isHistoryPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume History
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause History
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
