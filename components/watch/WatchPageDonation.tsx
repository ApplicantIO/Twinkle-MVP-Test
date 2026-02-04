'use client';

import { ArrowLeft } from 'lucide-react';

export interface WatchPageDonationProps {
  /** When true, show the donation header (back + title) and children as the form content */
  isActive: boolean;
  donationStep: 'DONATION' | 'SMS_VERIFICATION' | 'WALLET_INVOICE_REQUEST' | 'WALLET_WAITING';
  selectedWallet: string | null;
  getWalletName: (walletId: string | null) => string;
  isLive?: boolean;
  onBack: () => void;
  children: React.ReactNode;
}

/**
 * Wraps the donation/superchat flow: header (back + title) and step content.
 * The page supplies the current step content as children (main form, SMS, wallet request, or waiting).
 */
export function WatchPageDonation({
  isActive,
  donationStep,
  selectedWallet,
  getWalletName,
  isLive,
  onBack,
  children,
}: WatchPageDonationProps) {
  if (!isActive) return null;

  const title =
    (donationStep === 'WALLET_INVOICE_REQUEST' || donationStep === 'WALLET_WAITING') && selectedWallet
      ? `${isLive ? 'Superchat' : 'Donate'} with ${getWalletName(selectedWallet)}`
      : isLive
        ? 'Superchat'
        : 'Donate';

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </>
  );
}
