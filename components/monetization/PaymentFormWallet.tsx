'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCardNumber, formatExpiry, formatPhoneNumber } from '@/lib/viewerUtils';

const WALLETS = [
  { id: 'click', name: 'Click' },
  { id: 'payme', name: 'Payme' },
  { id: 'uzum', name: 'Uzum' },
];

function getWalletName(walletId: string | null): string {
  if (!walletId) return 'Wallet';
  const names: Record<string, string> = {
    click: 'Click',
    payme: 'Payme',
    uzum: 'Uzum',
  };
  return names[walletId] || 'Wallet';
}

export type PaymentFormWalletMode = 'grid' | 'invoice' | 'waiting';

export interface PaymentFormWalletProps {
  mode: PaymentFormWalletMode;
  selectedWallet: string | null;
  selectedPaymentMethod: string | null;
  invoicePhoneNumber: string;
  invoiceCardNumber: string;
  invoiceCardExpiry: string;
  activeInvoiceIdentifier: 'phone' | 'card' | null;
  invoiceStatus: 'pending' | 'paid' | 'failed' | null;
  paymentProcessing: boolean;
  isInvoicePhoneValid: boolean;
  isInvoiceCardValid: boolean;
  onSelectWallet: (walletId: string | null) => void;
  onInvoicePhoneChange: (value: string) => void;
  onInvoiceCardNumberChange: (value: string) => void;
  onInvoiceCardExpiryChange: (value: string) => void;
  onActiveInvoiceIdentifierChange: (id: 'phone' | 'card' | null) => void;
  onSendInvoice: () => void;
  onCancelInvoice: () => void;
}

export function PaymentFormWallet({
  mode,
  selectedWallet,
  selectedPaymentMethod,
  invoicePhoneNumber,
  invoiceCardNumber,
  invoiceCardExpiry,
  activeInvoiceIdentifier,
  invoiceStatus,
  paymentProcessing,
  isInvoicePhoneValid,
  isInvoiceCardValid,
  onSelectWallet,
  onInvoicePhoneChange,
  onInvoiceCardNumberChange,
  onInvoiceCardExpiryChange,
  onActiveInvoiceIdentifierChange,
  onSendInvoice,
  onCancelInvoice,
}: PaymentFormWalletProps) {
  const prevInvoiceExpiryRef = useRef('');

  if (mode === 'grid') {
    return (
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-2">Wallets</h3>
        <div className="grid grid-cols-3 gap-2 w-full">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => {
                if (selectedPaymentMethod === wallet.id) {
                  onSelectWallet(null);
                } else {
                  onSelectWallet(wallet.id);
                }
              }}
              className={`relative h-14 rounded-lg border-2 transition-all flex items-center justify-center bg-white overflow-hidden ${
                selectedPaymentMethod === wallet.id
                  ? 'border-accent scale-95'
                  : 'border-surface/50 hover:border-surface/70 active:scale-95'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/payments/${wallet.name}-logo-wht.png`}
                alt={wallet.name}
                className="w-full h-full object-contain p-0"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'invoice') {
    const walletName = getWalletName(selectedWallet);
    return (
      <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Pay with {walletName}</h2>
            <p className="text-sm text-gray-400">
              Enter the credentials linked to your {walletName} account
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  activeInvoiceIdentifier === 'card'
                    ? 'text-text-secondary/50'
                    : 'text-text-secondary'
                }`}
              >
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+998 XX YYY YY YY"
                value={invoicePhoneNumber}
                disabled={activeInvoiceIdentifier === 'card'}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value, invoicePhoneNumber);
                  onInvoicePhoneChange(formatted);
                  const digitsAfterPrefix = formatted.replace(/[^\d]/g, '').slice(3);
                  if (digitsAfterPrefix.length > 0 && activeInvoiceIdentifier === null) {
                    onActiveInvoiceIdentifierChange('phone');
                    onInvoiceCardNumberChange('');
                    onInvoiceCardExpiryChange('');
                  }
                  if (digitsAfterPrefix.length === 0 && activeInvoiceIdentifier === 'phone') {
                    onActiveInvoiceIdentifierChange(null);
                  }
                }}
                className={`w-full h-10 outline-none ${
                  activeInvoiceIdentifier === 'card'
                    ? 'bg-surface/20 border-surface/30 text-text-secondary/50 cursor-not-allowed'
                    : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0'
                }`}
              />
            </div>

            <div className="w-full h-px bg-zinc-800 my-6" />

            <div>
              <label
                className={`block text-sm font-medium mb-4 ${
                  activeInvoiceIdentifier === 'phone'
                    ? 'text-text-secondary/50'
                    : 'text-text-secondary'
                }`}
              >
                Card Details
              </label>
              <div
                className={`p-4 border rounded-md space-y-4 ${
                  activeInvoiceIdentifier === 'phone'
                    ? 'border-surface/30 bg-surface/20'
                    : 'border-surface/50 bg-surface/30'
                }`}
              >
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      activeInvoiceIdentifier === 'phone'
                        ? 'text-text-secondary/50'
                        : 'text-text-secondary'
                    }`}
                  >
                    Card Number
                  </label>
                  <Input
                    type="text"
                    placeholder="8600 1234 5678 9012"
                    value={invoiceCardNumber}
                    disabled={activeInvoiceIdentifier === 'phone'}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      onInvoiceCardNumberChange(formatted);
                      if (formatted.replace(/\s/g, '').length > 0 && activeInvoiceIdentifier === null) {
                        onActiveInvoiceIdentifierChange('card');
                        onInvoicePhoneChange('+998 ');
                      }
                      if (formatted.replace(/\s/g, '').length === 0) {
                        const cleanedExpiry = invoiceCardExpiry.replace(/\D/g, '');
                        if (cleanedExpiry.length === 0 && activeInvoiceIdentifier === 'card') {
                          onActiveInvoiceIdentifierChange(null);
                        }
                      }
                    }}
                    maxLength={19}
                    className={`w-full h-10 outline-none ${
                      activeInvoiceIdentifier === 'phone'
                        ? 'bg-surface/20 border-surface/30 text-text-secondary/50 cursor-not-allowed'
                        : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0'
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      activeInvoiceIdentifier === 'phone'
                        ? 'text-text-secondary/50'
                        : 'text-text-secondary'
                    }`}
                  >
                    Expiration Date
                  </label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={invoiceCardExpiry}
                    disabled={activeInvoiceIdentifier === 'phone'}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value, prevInvoiceExpiryRef.current);
                      prevInvoiceExpiryRef.current = formatted;
                      onInvoiceCardExpiryChange(formatted);
                      if (formatted.trim().length > 0 && activeInvoiceIdentifier === null) {
                        onActiveInvoiceIdentifierChange('card');
                        onInvoicePhoneChange('+998 ');
                      }
                      if (formatted.replace(/\D/g, '').length === 0) {
                        const cleanedCard = invoiceCardNumber.replace(/\s/g, '');
                        if (cleanedCard.length === 0 && activeInvoiceIdentifier === 'card') {
                          onActiveInvoiceIdentifierChange(null);
                        }
                      }
                    }}
                    maxLength={5}
                    className={`w-full h-10 outline-none ${
                      activeInvoiceIdentifier === 'phone'
                        ? 'bg-surface/20 border-surface/30 text-text-secondary/50 cursor-not-allowed'
                        : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4 space-y-3">
          <Button
            onClick={onCancelInvoice}
            disabled={paymentProcessing}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            onClick={onSendInvoice}
            disabled={
              paymentProcessing ||
              !activeInvoiceIdentifier ||
              (activeInvoiceIdentifier === 'phone' && !isInvoicePhoneValid) ||
              (activeInvoiceIdentifier === 'card' && !isInvoiceCardValid)
            }
            className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentProcessing ? 'Sending...' : 'Send Invoice'}
          </Button>
        </div>
      </div>
    );
  }

  // mode === 'waiting'
  const walletName = getWalletName(selectedWallet);
  const maskedNumber =
    activeInvoiceIdentifier === 'phone'
      ? invoicePhoneNumber.replace(/\D/g, '').slice(-4)
      : invoiceCardNumber.replace(/\s/g, '').slice(-4);

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Waiting for Payment</h2>
          <p className="text-sm text-gray-400">
            We have sent an invoice to your {walletName} account linked to the number ****{' '}
            {maskedNumber}. Please complete the payment on your mobile app.
          </p>
        </div>

        <div className="flex justify-center items-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        </div>

        {invoiceStatus === 'failed' && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-md">
            <p className="text-sm text-red-400 text-center">
              Payment timed out or was cancelled. Please try again.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
        <Button
          onClick={onCancelInvoice}
          className="w-full h-10 bg-surface hover:bg-surface/80 text-text-primary border border-surface/50"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
