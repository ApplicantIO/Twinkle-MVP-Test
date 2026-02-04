'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface PaymentSMSVerificationProps {
  cardLast4: string;
  smsCode: string;
  onSmsCodeChange: (value: string) => void;
  smsSent: boolean;
  isSending: boolean;
  countdownTime: number;
  onResendCode: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  paymentProcessing: boolean;
}

function getSmsLabel(isSending: boolean, smsSent: boolean): React.ReactNode {
  if (isSending) return 'SMS Code (Sending...)';
  if (smsSent) {
    return (
      <span className="flex items-center text-sm font-medium">
        <span className="text-text-secondary mr-1">SMS Code</span>
        <span className="text-green-400">(Sent)</span>
      </span>
    );
  }
  return 'SMS Code';
}

export function PaymentSMSVerification({
  cardLast4,
  smsCode,
  onSmsCodeChange,
  smsSent,
  isSending,
  countdownTime,
  onResendCode,
  onCancel,
  onConfirm,
  paymentProcessing,
}: PaymentSMSVerificationProps) {
  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Confirm Payment</h2>
          <p className="text-sm text-gray-400">
            We sent a code to the number linked with **** {cardLast4}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {getSmsLabel(isSending, smsSent)}
            </label>
            <Input
              type="text"
              placeholder="000000"
              value={smsCode}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                onSmsCodeChange(cleaned.slice(0, 6));
              }}
              maxLength={6}
              className="w-full bg-surface border-surface text-text-primary h-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onResendCode}
              disabled={isSending || countdownTime > 0}
              className="text-xs text-gray-400 hover:text-gray-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
            {countdownTime > 0 && (
              <span className="text-xs text-gray-500">Resend in {countdownTime}s</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4 space-y-3">
        <Button
          onClick={onCancel}
          disabled={paymentProcessing}
          className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={paymentProcessing || smsCode.length !== 6}
          className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentProcessing ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </div>
    </div>
  );
}
