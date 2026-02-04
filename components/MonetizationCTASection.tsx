'use client';

import { Video, Transaction } from '@/types';
import { DEFAULT_SAVED_CARDS_DEMO } from '@/config/viewerConstants';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { detectCardType, getCardTypeName } from '@/lib/viewerUtils';
import {
  PaymentFormCard,
  PaymentFormWallet,
  PaymentSuccessReceipt,
  PaymentSMSVerification,
  type SavedCard,
} from '@/components/monetization';

interface MonetizationCTASectionProps {
  video: Video;
  onPurchase?: () => void;
  onSubscribe?: () => void;
  onPurchaseComplete?: () => void;
  isPlaylist?: boolean;
}

export function MonetizationCTASection({
  video,
  onPurchase,
  onSubscribe,
  onPurchaseComplete,
  isPlaylist = false,
}: MonetizationCTASectionProps) {
  const videoType = video.type || 'free';
  const isPaid = videoType === 'paid';
  const isSubscription = videoType === 'subscription';

  const [saveCardEnabled, setSaveCardEnabled] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isCardFormActive, setIsCardFormActive] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<
    'PAYMENT' | 'SMS_VERIFICATION' | 'WALLET_INVOICE_REQUEST' | 'WALLET_WAITING' | 'PAYMENT_SUCCESS'
  >('PAYMENT');
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  const [savedCards, setSavedCards] = useState<SavedCard[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('savedCards');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing saved cards:', e);
        }
      }
    }
    return DEFAULT_SAVED_CARDS_DEMO;
  });

  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVC, setNewCardCVC] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [cardType, setCardType] = useState<'local' | 'international' | null>(null);
  const [isVerificationVerified, setIsVerificationVerified] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdownTime, setCountdownTime] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);

  const [invoicePhoneNumber, setInvoicePhoneNumber] = useState('+998 ');
  const [invoiceCardNumber, setInvoiceCardNumber] = useState('');
  const [invoiceCardExpiry, setInvoiceCardExpiry] = useState('');
  const [activeInvoiceIdentifier, setActiveInvoiceIdentifier] = useState<'phone' | 'card' | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [invoicePollingInterval, setInvoicePollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<'pending' | 'paid' | 'failed' | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const transactionId = useRef(`TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`).current;

  const isWalletSystemSelected = (): boolean => {
    if (!selectedPaymentMethod) return false;
    return ['click', 'payme', 'uzum'].includes(selectedPaymentMethod);
  };
  const isInvoiceSystemSelected = isWalletSystemSelected;

  const isInvoicePhoneValid = (): boolean => {
    if (!isInvoiceSystemSelected()) return true;
    if (!invoicePhoneNumber.trim()) return false;
    if (!invoicePhoneNumber.startsWith('+')) return false;
    const digits = invoicePhoneNumber.slice(1).replace(/\D/g, '');
    return digits.length >= 9;
  };

  const isInvoiceCardValid = (): boolean => {
    if (!isInvoiceSystemSelected()) return true;
    const cleanedCard = invoiceCardNumber.replace(/\s/g, '');
    const cleanedExpiry = invoiceCardExpiry.replace(/\D/g, '');
    return cleanedCard.length >= 16 && cleanedExpiry.length === 4;
  };

  const isNewCardValid = (): boolean => {
    const cleaned = newCardNumber.replace(/\s/g, '');
    if (!cleaned.length || cleaned.length !== 16) return false;
    if (!newCardExpiry.length || newCardExpiry.length !== 5) return false;
    if (cardType === 'international') return newCardCVC.length === 3;
    return true;
  };

  const getPaymentMethodName = (): string => {
    if (!selectedPaymentMethod) return 'Unknown';
    const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
    if (savedCard) return savedCard.type;
    const names: Record<string, string> = {
      click: 'Click',
      payme: 'Payme',
      uzum: 'Uzum Bank',
    };
    return names[selectedPaymentMethod] || 'Card';
  };

  const processPaymentSuccess = (isUsingSavedCard: boolean, cardLast4: string) => {
    const price = video.price || 50000;
    const subtotal = price;
    const taxRate = 0.05;
    const taxAmount = Math.round(subtotal * taxRate);
    const total = subtotal + taxAmount;
    const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
    let paymentMethodDisplay = '';
    if (isUsingSavedCard && savedCard) {
      paymentMethodDisplay = `${savedCard.type} ending in ${savedCard.last4}`;
    } else if (cardLast4) {
      const cleanedNumber = newCardNumber.replace(/\s/g, '');
      const cardTypeName = getCardTypeName(cleanedNumber, cardType);
      paymentMethodDisplay = `${cardTypeName} ending in ${cardLast4}`;
    } else {
      paymentMethodDisplay = getPaymentMethodName();
    }
    const transactionData: Transaction = {
      transactionId,
      userId: 'current-user-id',
      productId: video.id,
      productTitle: video.title,
      productType: isSubscription ? 'subscription' : 'paid',
      creatorId: video.userId,
      creatorName: video.user?.name,
      subtotal,
      taxAmount,
      totalAmount: total,
      currency: video.currency || 'UZS',
      paymentMethodUsed: paymentMethodDisplay,
      securityProvider: 'Multibank',
      purchaseDate: new Date(),
      billingAddress: 'Tashkent, Uzbekistan',
      userName: 'User Name',
    };
    setCurrentTransaction(transactionData);
    setPurchaseStep('PAYMENT_SUCCESS');
    if (isPaid && onPurchase) onPurchase();
    else if (isSubscription && onSubscribe) onSubscribe();
    setCardName('');
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCVC('');
    setSmsCode('');
    setCardType(null);
    setIsVerificationVerified(false);
    setSmsSent(false);
    setSaveCardEnabled(false);
    setSelectedPaymentMethod(null);
  };

  const handlePayNow = () => {
    const isUsingSavedCard =
      selectedPaymentMethod && savedCards.some((c) => c.id === selectedPaymentMethod);
    const walletSystems = ['click', 'payme', 'uzum'];
    const isUsingWallet =
      selectedPaymentMethod && walletSystems.includes(selectedPaymentMethod);
    const isUsingNewCard = !isUsingSavedCard && !isUsingWallet && isNewCardValid();

    if (!isUsingSavedCard && !isUsingNewCard && !isUsingWallet) return;

    if (isUsingWallet) {
      setSelectedWallet(selectedPaymentMethod);
      setPurchaseStep('WALLET_INVOICE_REQUEST');
      return;
    }

    let detectedCardType: 'local' | 'international' | null = null;
    let cardLast4 = '';
    if (isUsingSavedCard) {
      const saved = savedCards.find((c) => c.id === selectedPaymentMethod);
      if (saved) {
        detectedCardType =
          saved.type === 'UzCard' || saved.type === 'HUMO' ? 'local' : 'international';
        cardLast4 = saved.last4;
      }
    } else if (isUsingNewCard) {
      detectedCardType = cardType;
      cardLast4 = newCardNumber.replace(/\s/g, '').slice(-4);
    }

    setPaymentProcessing(true);

    if (detectedCardType === 'international') {
      if (isUsingNewCard && saveCardEnabled) {
        const cleanedNumber = newCardNumber.replace(/\s/g, '');
        const last4 = cleanedNumber.slice(-4);
        const cardTypeName = cleanedNumber.startsWith('4') ? 'Visa' : 'Mastercard';
        const newCard: SavedCard = {
          id: Date.now().toString(),
          type: cardTypeName,
          last4,
          cardName: cardName.trim() || cardTypeName,
          maskedNumber: `**** ${last4}`,
        };
        const updated = [...savedCards, newCard];
        setSavedCards(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('savedCards', JSON.stringify(updated));
        }
      }
      setTimeout(() => {
        setPaymentProcessing(false);
        processPaymentSuccess(!!isUsingSavedCard, cardLast4);
      }, 2000);
    } else if (detectedCardType === 'local') {
      setTimeout(() => {
        setPaymentProcessing(false);
        setSmsSent(true);
        setCountdownTime(60);
        setPurchaseStep('SMS_VERIFICATION');
      }, 1500);
    }
  };

  const handleCancelPayment = async () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setSmsCode('');
      setSmsSent(false);
      setIsVerificationVerified(false);
      setCountdownTime(0);
      setPurchaseStep('PAYMENT');
    }, 500);
  };

  const handleConfirmPayment = async () => {
    if (smsCode.length !== 6) return;
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setIsVerificationVerified(true);
      if (saveCardEnabled) {
        const cleanedNumber = newCardNumber.replace(/\s/g, '');
        const last4 = cleanedNumber.slice(-4);
        const cardTypeName = cleanedNumber.startsWith('8600') ? 'UzCard' : 'HUMO';
        const newCard: SavedCard = {
          id: Date.now().toString(),
          type: cardTypeName,
          last4,
          cardName: cardName.trim() || cardTypeName,
          maskedNumber: `**** ${last4}`,
        };
        const updated = [...savedCards, newCard];
        setSavedCards(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('savedCards', JSON.stringify(updated));
        }
      }
      const cardLast4 = newCardNumber.replace(/\s/g, '').slice(-4);
      processPaymentSuccess(false, cardLast4);
    }, 1500);
  };

  const handleSendInvoice = () => {
    if (!selectedWallet) return;
    if (activeInvoiceIdentifier === 'phone' && !isInvoicePhoneValid()) return;
    if (activeInvoiceIdentifier === 'card' && !isInvoiceCardValid()) return;
    if (!activeInvoiceIdentifier) return;
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setInvoiceStatus('pending');
      setPurchaseStep('WALLET_WAITING');
      startInvoicePolling();
    }, 1500);
  };

  const startInvoicePolling = () => {
    if (invoicePollingInterval) clearInterval(invoicePollingInterval);
    const interval = setInterval(() => {
      const mockStatus = Math.random() > 0.85 ? 'paid' : 'pending';
      if (mockStatus === 'paid') {
        clearInterval(interval);
        setInvoicePollingInterval(null);
        setInvoiceStatus('paid');
        processPaymentSuccess(false, '');
      }
    }, 5000);
    setInvoicePollingInterval(interval);
    setTimeout(() => {
      clearInterval(interval);
      setInvoicePollingInterval(null);
      if (invoiceStatus === 'pending') setInvoiceStatus('failed');
    }, 300000);
  };

  const handleCancelInvoice = () => {
    if (invoicePollingInterval) {
      clearInterval(invoicePollingInterval);
      setInvoicePollingInterval(null);
    }
    setInvoiceStatus(null);
    setPurchaseStep('PAYMENT');
    setSelectedWallet(null);
    setInvoicePhoneNumber('+998 ');
    setInvoiceCardNumber('');
    setInvoiceCardExpiry('');
    setActiveInvoiceIdentifier(null);
  };

  const handleContinueWatching = () => {
    if (onPurchaseComplete) onPurchaseComplete();
  };

  const handleSelectCard = (cardId: string | null) => {
    setSelectedPaymentMethod(cardId);
    setIsCardFormActive(false);
    setSelectedWallet(null);
    setInvoicePhoneNumber('+998 ');
    setInvoiceCardNumber('');
    setInvoiceCardExpiry('');
    setActiveInvoiceIdentifier(null);
    if (cardId) {
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCVC('');
      setCardName('');
      setSmsCode('');
      setCardType(null);
      setIsVerificationVerified(false);
      setSmsSent(false);
    }
    setOpenCardMenuId(null);
  };

  const handleCardFormActivate = () => {
    setIsCardFormActive(true);
    setSelectedPaymentMethod(null);
    setSelectedWallet(null);
    setInvoicePhoneNumber('+998 ');
    setInvoiceCardNumber('');
    setInvoiceCardExpiry('');
    setActiveInvoiceIdentifier(null);
  };

  const handleCardNumberChange = (value: string) => {
    setNewCardNumber(value);
    const detected = detectCardType(value);
    if (detected !== cardType) {
      setSmsSent(false);
      setIsVerificationVerified(false);
    }
    setCardType(detected);
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = savedCards.filter((c) => c.id !== cardId);
    setSavedCards(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedCards', JSON.stringify(updated));
    }
    if (selectedPaymentMethod === cardId) setSelectedPaymentMethod(null);
  };

  const handleSelectWallet = (walletId: string | null) => {
    if (selectedPaymentMethod === walletId) {
      setSelectedPaymentMethod(null);
      setSelectedWallet(null);
      setInvoicePhoneNumber('+998 ');
      setInvoiceCardNumber('');
      setInvoiceCardExpiry('');
      setActiveInvoiceIdentifier(null);
      setIsCardFormActive(false);
    } else {
      setSelectedWallet(walletId);
      setSelectedPaymentMethod(walletId ?? null);
      setIsCardFormActive(false);
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCVC('');
      setCardName('');
      setSmsCode('');
      setCardType(null);
      setIsVerificationVerified(false);
      setSmsSent(false);
      setInvoicePhoneNumber('+998 ');
      setInvoiceCardNumber('');
      setInvoiceCardExpiry('');
      setActiveInvoiceIdentifier(null);
    }
  };

  const handleResendSms = () => {
    setIsSending(true);
    setTimeout(() => {
      setSmsSent(true);
      setIsSending(false);
      setCountdownTime(60);
    }, 1000);
  };

  useEffect(() => {
    if (countdownTime > 0) {
      const t = setTimeout(() => setCountdownTime(countdownTime - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdownTime]);

  useEffect(() => {
    return () => {
      if (invoicePollingInterval) clearInterval(invoicePollingInterval);
    };
  }, [invoicePollingInterval]);

  const formattedPrice =
    video.price?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ||
    '50 000';
  const previewVideoUrl = video.teaserVideoUrl || video.videoUrl;
  const previewImageUrl = video.purchaseCoverUrl;

  useEffect(() => {
    if (previewVideoRef.current && previewVideoUrl) {
      const v = previewVideoRef.current;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.play().catch(() => {});
    }
  }, [previewVideoUrl]);

  const renderUnifiedView = () => (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-4">
        <div className="flex-shrink-0 mb-4 lg:hidden">
          {previewVideoUrl ? (
            <div className="w-full rounded-2xl overflow-hidden preview-video-no-controls">
              <video
                ref={previewVideoRef}
                src={previewVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
                className="w-full h-auto max-h-64 object-cover preview-video-no-controls"
                style={{
                  pointerEvents: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  outline: 'none',
                  border: 'none',
                }}
                onLoadedData={(e) => {
                  const v = e.target as HTMLVideoElement;
                  v.muted = true;
                  v.loop = true;
                  v.play().catch(() => {});
                }}
                onCanPlay={(e) => {
                  const v = e.target as HTMLVideoElement;
                  if (v.paused) v.play().catch(() => {});
                }}
              />
            </div>
          ) : previewImageUrl ? (
            <div className="w-full rounded-2xl overflow-hidden">
              <img
                src={previewImageUrl}
                alt={video.title}
                className="w-full h-auto max-h-64 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-zinc-800/50 via-zinc-800/30 to-zinc-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                {isPaid ? (
                  <Lock className="h-16 w-16 text-gray-400" />
                ) : isSubscription ? (
                  <Crown className="h-16 w-16 text-gray-400" />
                ) : (
                  <Lock className="h-16 w-16 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 mb-4">
          <h1 className="text-2xl font-bold text-white mb-2 whitespace-normal break-words h-auto">
            {video.title}
          </h1>
          <div className="mb-4">
            <div className="text-3xl font-bold text-white">
              {formattedPrice} {video.currency || 'UZS'}
              {isSubscription && (
                <span className="text-lg font-normal text-gray-400">/month</span>
              )}
              {!isSubscription && isPlaylist && (
                <span className="text-lg font-normal text-gray-400 opacity-60"> / Playlist</span>
              )}
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
              {video.saleDescription ||
                'By purchasing this content, you gain lifetime access to the video in maximum available quality (up to 4K). Your support directly empowers the creator to continue producing high-quality work and maintain their valuable artistic endeavors.'}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 space-y-3 mb-4">
          <PaymentFormCard
            savedCards={savedCards}
            selectedPaymentMethod={selectedPaymentMethod}
            isCardFormActive={isCardFormActive}
            cardName={cardName}
            newCardNumber={newCardNumber}
            newCardExpiry={newCardExpiry}
            newCardCVC={newCardCVC}
            cardType={cardType}
            saveCardEnabled={saveCardEnabled}
            openCardMenuId={openCardMenuId}
            onSelectCard={handleSelectCard}
            onCardFormActivate={handleCardFormActivate}
            onCardNumberChange={handleCardNumberChange}
            onCardExpiryChange={setNewCardExpiry}
            onCardCVCChange={setNewCardCVC}
            onCardNameChange={setCardName}
            onSaveCardToggle={() => setSaveCardEnabled((v) => !v)}
            onDeleteCard={handleDeleteCard}
            setOpenCardMenuId={setOpenCardMenuId}
          />
          <PaymentFormWallet
            mode="grid"
            selectedWallet={selectedWallet}
            selectedPaymentMethod={selectedPaymentMethod}
            invoicePhoneNumber={invoicePhoneNumber}
            invoiceCardNumber={invoiceCardNumber}
            invoiceCardExpiry={invoiceCardExpiry}
            activeInvoiceIdentifier={activeInvoiceIdentifier}
            invoiceStatus={invoiceStatus}
            paymentProcessing={paymentProcessing}
            isInvoicePhoneValid={isInvoicePhoneValid()}
            isInvoiceCardValid={isInvoiceCardValid()}
            onSelectWallet={handleSelectWallet}
            onInvoicePhoneChange={setInvoicePhoneNumber}
            onInvoiceCardNumberChange={setInvoiceCardNumber}
            onInvoiceCardExpiryChange={setInvoiceCardExpiry}
            onActiveInvoiceIdentifierChange={setActiveInvoiceIdentifier}
            onSendInvoice={handleSendInvoice}
            onCancelInvoice={handleCancelInvoice}
          />
        </div>
      </div>

      <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
        <Button
          onClick={handlePayNow}
          disabled={
            paymentProcessing ||
            (!selectedPaymentMethod && !isNewCardValid())
          }
          className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentProcessing
            ? 'Processing...'
            : isSubscription
              ? `Subscribe ${formattedPrice} ${video.currency || 'UZS'}/month`
              : `Pay ${formattedPrice} ${video.currency || 'UZS'}`}
        </Button>
      </div>
    </div>
  );

  const containerClass =
    'w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container';
  const containerStyle = { scrollbarWidth: 'none' as const, msOverflowStyle: 'none' as const };

  if (purchaseStep === 'SMS_VERIFICATION') {
    const savedCard = savedCards.find((c) => c.id === selectedPaymentMethod);
    const cardLast4 = savedCard
      ? savedCard.last4
      : newCardNumber.replace(/\s/g, '').slice(-4);
    return (
      <div className={containerClass} style={containerStyle}>
        <PaymentSMSVerification
          cardLast4={cardLast4}
          smsCode={smsCode}
          onSmsCodeChange={setSmsCode}
          smsSent={smsSent}
          isSending={isSending}
          countdownTime={countdownTime}
          onResendCode={handleResendSms}
          onCancel={handleCancelPayment}
          onConfirm={handleConfirmPayment}
          paymentProcessing={paymentProcessing}
        />
      </div>
    );
  }

  if (purchaseStep === 'WALLET_INVOICE_REQUEST') {
    return (
      <div className={containerClass} style={containerStyle}>
        <PaymentFormWallet
          mode="invoice"
          selectedWallet={selectedWallet}
          selectedPaymentMethod={selectedPaymentMethod}
          invoicePhoneNumber={invoicePhoneNumber}
          invoiceCardNumber={invoiceCardNumber}
          invoiceCardExpiry={invoiceCardExpiry}
          activeInvoiceIdentifier={activeInvoiceIdentifier}
          invoiceStatus={invoiceStatus}
          paymentProcessing={paymentProcessing}
          isInvoicePhoneValid={isInvoicePhoneValid()}
          isInvoiceCardValid={isInvoiceCardValid()}
          onSelectWallet={handleSelectWallet}
          onInvoicePhoneChange={setInvoicePhoneNumber}
          onInvoiceCardNumberChange={setInvoiceCardNumber}
          onInvoiceCardExpiryChange={setInvoiceCardExpiry}
          onActiveInvoiceIdentifierChange={setActiveInvoiceIdentifier}
          onSendInvoice={handleSendInvoice}
          onCancelInvoice={handleCancelInvoice}
        />
      </div>
    );
  }

  if (purchaseStep === 'WALLET_WAITING') {
    return (
      <div className={containerClass} style={containerStyle}>
        <PaymentFormWallet
          mode="waiting"
          selectedWallet={selectedWallet}
          selectedPaymentMethod={selectedPaymentMethod}
          invoicePhoneNumber={invoicePhoneNumber}
          invoiceCardNumber={invoiceCardNumber}
          invoiceCardExpiry={invoiceCardExpiry}
          activeInvoiceIdentifier={activeInvoiceIdentifier}
          invoiceStatus={invoiceStatus}
          paymentProcessing={paymentProcessing}
          isInvoicePhoneValid={isInvoicePhoneValid()}
          isInvoiceCardValid={isInvoiceCardValid()}
          onSelectWallet={handleSelectWallet}
          onInvoicePhoneChange={setInvoicePhoneNumber}
          onInvoiceCardNumberChange={setInvoiceCardNumber}
          onInvoiceCardExpiryChange={setInvoiceCardExpiry}
          onActiveInvoiceIdentifierChange={setActiveInvoiceIdentifier}
          onSendInvoice={handleSendInvoice}
          onCancelInvoice={handleCancelInvoice}
        />
      </div>
    );
  }

  if (purchaseStep === 'PAYMENT_SUCCESS' && currentTransaction) {
    return (
      <div className={containerClass} style={containerStyle}>
        <PaymentSuccessReceipt
          transaction={currentTransaction}
          transactionId={transactionId}
          onContinueWatching={handleContinueWatching}
        />
      </div>
    );
  }

  return (
    <div className={containerClass} style={containerStyle}>
      {renderUnifiedView()}
    </div>
  );
}
