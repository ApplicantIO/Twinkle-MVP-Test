'use client';

import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/button';
import { X, CreditCard, Shield, Check, Crown, Lock } from 'lucide-react';
import { useState } from 'react';

export function PurchaseFlowModal() {
  const { isModalOpen, modalType, currentVideoId, currentVideoTitle, currentVideoPrice, currentVideoCurrency, currentVideoType, closeModal } = useModal();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'saved' | null>(null);
  const [useSavedCard, setUseSavedCard] = useState(false);

  if (!isModalOpen || modalType !== 'PURCHASE' || !currentVideoId) {
    return null;
  }

  const isSubscription = currentVideoType === 'subscription';
  const isPaid = currentVideoType === 'paid';

  // Format price in UZS
  const formattedPrice = currentVideoPrice?.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) || '50 000';

  const handlePayment = () => {
    // TODO: Implement actual payment processing
    console.log('Processing payment...', {
      videoId: currentVideoId,
      videoTitle: currentVideoTitle,
      price: currentVideoPrice,
      currency: currentVideoCurrency,
      type: currentVideoType,
      paymentMethod: selectedPaymentMethod,
      useSavedCard,
    });
    
    // For now, just close the modal
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/80"
        style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div
        className="relative bg-surface border border-surface rounded-xl shadow-xl z-[60] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors z-10"
          aria-label="Close purchase modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {isSubscription ? 'Subscribe to Channel' : 'Complete Purchase'}
          </h2>
          <p className="text-sm text-text-secondary">
            {isSubscription 
              ? 'Join this channel to access exclusive content'
              : 'Review your order and complete the payment'}
          </p>
        </div>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-background rounded-lg border border-surface/50">
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Order Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary whitespace-normal break-words h-auto">
                  {currentVideoTitle}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {isSubscription ? 'Channel Membership' : 'Video Purchase'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-accent">
                  {isPaid ? `${formattedPrice} ${currentVideoCurrency || 'UZS'}` : 'Membership'}
                </p>
                {isSubscription && (
                  <p className="text-xs text-text-secondary">per month</p>
                )}
              </div>
            </div>
            {isPaid && (
              <div className="pt-3 border-t border-surface/50 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Total</span>
                <span className="text-lg font-bold text-text-primary">
                  {formattedPrice} {currentVideoCurrency || 'UZS'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Payment Method
          </h3>
          
          {/* Saved Card Option */}
          <div className="mb-3">
            <button
              onClick={() => {
                setUseSavedCard(true);
                setSelectedPaymentMethod('saved');
              }}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                useSavedCard && selectedPaymentMethod === 'saved'
                  ? 'border-accent bg-accent/10'
                  : 'border-surface hover:border-surface/70 bg-background'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Saved Card</p>
                    <p className="text-xs text-text-secondary">•••• •••• •••• 4242</p>
                  </div>
                </div>
                {useSavedCard && selectedPaymentMethod === 'saved' && (
                  <Check className="h-5 w-5 text-accent" />
                )}
              </div>
            </button>
          </div>

          {/* New Card Option */}
          <button
            onClick={() => {
              setUseSavedCard(false);
              setSelectedPaymentMethod('card');
            }}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              !useSavedCard && selectedPaymentMethod === 'card'
                ? 'border-accent bg-accent/10'
                : 'border-surface hover:border-surface/70 bg-background'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Credit or Debit Card</p>
                  <p className="text-xs text-text-secondary">Visa, Mastercard, etc.</p>
                </div>
              </div>
              {!useSavedCard && selectedPaymentMethod === 'card' && (
                <Check className="h-5 w-5 text-accent" />
              )}
            </div>
          </button>

          {/* PayPal Option (Optional) */}
          <button
            onClick={() => setSelectedPaymentMethod(null)}
            className="w-full p-4 rounded-lg border-2 border-surface hover:border-surface/70 bg-background transition-all text-left mt-3 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">PayPal</p>
                <p className="text-xs text-text-secondary">Coming soon</p>
              </div>
            </div>
          </button>
        </div>

        {/* Security Notice */}
        <div className="mb-6 p-3 bg-background/50 rounded-lg border border-surface/30 flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-text-secondary">
              Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
            </p>
          </div>
        </div>

        {/* Pay Now Button */}
        <Button
          onClick={handlePayment}
          disabled={!selectedPaymentMethod}
          className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg py-6 text-base font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubscription ? (
            <>
              <Crown className="h-5 w-5 mr-2 inline" />
              Subscribe Now
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2 inline" />
              Pay Now
            </>
          )}
        </Button>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
