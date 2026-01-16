'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Calendar,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import HistoryCalendarModal from './HistoryCalendarModal';
import ClearHistoryModal from './ClearHistoryModal';

interface HistoryManagementSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  onClearHistory: () => void;
  isHistoryPaused: boolean;
  onPauseHistory: (paused: boolean) => void;
}

export default function HistoryManagementSidebar({
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  onClearHistory,
  isHistoryPaused,
  onPauseHistory,
}: HistoryManagementSidebarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  return (
    <div className="space-y-4">
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

      {/* Date Filter */}
      <div>
        <Button
          variant="outline"
          onClick={() => setIsCalendarOpen(true)}
          className="w-full justify-start bg-surface border-surface/50 text-text-primary hover:bg-background"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Find history date
        </Button>
        {selectedDate && (
          <div className="mt-2 text-sm text-text-secondary">
            Selected: {selectedDate.toLocaleDateString()}
            <button
              onClick={() => onDateChange(null)}
              className="ml-2 text-accent hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Clear History */}
      <div>
        <Button
          variant="outline"
          onClick={() => setIsClearModalOpen(true)}
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
          onClick={() => onPauseHistory(!isHistoryPaused)}
          className={`w-full justify-start ${
            isHistoryPaused
              ? 'bg-surface border-surface/50 text-text-primary hover:bg-background'
              : 'bg-surface border-surface/50 text-text-primary hover:bg-background'
          }`}
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

      {/* Calendar Modal */}
      <HistoryCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={onDateChange}
      />

      {/* Clear History Modal */}
      <ClearHistoryModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={onClearHistory}
      />
    </div>
  );
}
