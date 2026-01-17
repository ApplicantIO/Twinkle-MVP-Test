'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useModal } from '@/contexts/ModalContext';

const reportReasons = [
  'Spam or misleading',
  'Violence or dangerous content',
  'Hateful or abusive content',
  'Harassment or bullying',
  'Harmful or dangerous acts',
  'Child safety',
  'Infringes my rights',
  'Captions issue',
  'Other',
];

type ReportStep = 'SELECT_REASON' | 'WRITE_DETAILS' | 'SUBMITTED_CONFIRMATION';

export function ReportModal() {
  const { isModalOpen, modalType, currentVideoId, currentVideoTitle, closeModal } = useModal();
  const [reportStep, setReportStep] = useState<ReportStep>('SELECT_REASON');
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState('');
  const reportModalRef = useRef<HTMLDivElement>(null);

  const handleReportReasonSelect = (reason: string) => {
    setReportReason(reason);
    setReportStep('WRITE_DETAILS');
  };

  const handleReportSubmit = () => {
    if (!reportDetails.trim()) {
      return;
    }
    console.log('Report submitted:', { videoId: currentVideoId, reason: reportReason, details: reportDetails });
    setReportStep('SUBMITTED_CONFIRMATION');
  };

  const handleCloseReport = () => {
    setReportStep('SELECT_REASON');
    setReportReason('');
    setReportDetails('');
    closeModal();
  };

  const handleBackReport = () => {
    if (reportStep === 'WRITE_DETAILS') {
      setReportStep('SELECT_REASON');
      setReportDetails('');
    } else {
      setReportStep('SELECT_REASON');
      setReportReason('');
      handleCloseReport();
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isModalOpen || modalType !== 'REPORT') {
      setReportStep('SELECT_REASON');
      setReportReason('');
      setReportDetails('');
    }
  }, [isModalOpen, modalType]);

  // Auto-close confirmation after 3 seconds
  useEffect(() => {
    if (reportStep === 'SUBMITTED_CONFIRMATION') {
      const timer = setTimeout(() => {
        handleCloseReport();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reportStep]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportModalRef.current && !reportModalRef.current.contains(event.target as Node)) {
        handleCloseReport();
      }
    };

    if (isModalOpen && modalType === 'REPORT') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, modalType]);

  if (!isModalOpen || modalType !== 'REPORT') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop Overlay - No blur, clean solid overlay */}
      <div 
        className="absolute inset-0 bg-black/80"
        style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        onClick={handleCloseReport}
      />
      
      {/* Modal */}
      <div
        ref={reportModalRef}
        className="relative bg-surface border border-surface rounded-lg shadow-xl z-70 p-5 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseReport}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors z-10"
          aria-label="Close report modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step 1: Select Reason */}
        {reportStep === 'SELECT_REASON' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBackReport}
                className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-text-primary">Report video</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              <p className="text-sm text-text-secondary mb-4">
                Tell us why you're reporting this video
              </p>
              <div className="flex flex-col gap-1">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReportReasonSelect(reason)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-background text-text-primary transition-colors text-left"
                  >
                    <span className="font-medium">{reason}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Write Details */}
        {reportStep === 'WRITE_DETAILS' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBackReport}
                className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-text-primary">{reportReason}</h2>
            </div>
            <div className="flex-1 flex flex-col mb-4">
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Additional details <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more information about why you're reporting this video..."
                className="flex-1 min-h-[120px] bg-background border-surface text-text-primary placeholder:text-text-secondary resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleBackReport}
                variant="outline"
                className="flex-1 rounded-full border-surface bg-background hover:bg-surface hover:border-surface"
              >
                Back
              </Button>
              <Button
                onClick={handleReportSubmit}
                disabled={!reportDetails.trim()}
                className="flex-1 rounded-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Submission Confirmation */}
        {reportStep === 'SUBMITTED_CONFIRMATION' && (
          <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
            <div className="flex flex-col items-center gap-4 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
              <div className="relative">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Report Submitted
                </h2>
                <p className="text-sm text-text-secondary">
                  Thank you for your feedback.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

