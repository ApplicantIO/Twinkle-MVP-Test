'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface HistoryCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export default function HistoryCalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
}: HistoryCalendarModalProps) {
  const [selected, setSelected] = useState<Date | null>(selectedDate);
  const [view, setView] = useState<'date' | 'before' | 'after'>('date');

  const handleDateSelect = (date: Date | null) => {
    setSelected(date);
    if (view === 'date') {
      onDateSelect(date);
      onClose();
    }
  };

  const handleApply = () => {
    onDateSelect(selected);
    onClose();
  };

  const handleClear = () => {
    setSelected(null);
    onDateSelect(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle>Find history date</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={view === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('date')}
              className="flex-1"
            >
              Specific Date
            </Button>
            <Button
              variant={view === 'before' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('before')}
              className="flex-1"
            >
              Before
            </Button>
            <Button
              variant={view === 'after' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('after')}
              className="flex-1"
            >
              After
            </Button>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {view === 'date' ? 'Select Date' : view === 'before' ? 'Before Date' : 'After Date'}
            </label>
            <input
              type="date"
              value={selected ? selected.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setSelected(date);
              }}
              className="w-full px-3 py-2 bg-surface border border-surface/50 rounded-md text-text-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-accent hover:bg-accent/90"
              disabled={!selected}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
