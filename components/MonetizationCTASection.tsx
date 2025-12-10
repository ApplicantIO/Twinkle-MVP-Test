'use client';

import { Video, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Crown, Shield, CreditCard, Check, ArrowLeft, CheckCircle2, MoreVertical, X, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MonetizationCTASectionProps {
  video: Video;
  onPurchase?: () => void;
  onSubscribe?: () => void;
  onPurchaseComplete?: () => void;
}

export function MonetizationCTASection({ video, onPurchase, onSubscribe, onPurchaseComplete }: MonetizationCTASectionProps) {
  const videoType = video.type || 'free';
  const isPaid = videoType === 'paid';
  const isSubscription = videoType === 'subscription';
  const [saveCardEnabled, setSaveCardEnabled] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'PAYMENT' | 'PAYMENT_SUCCESS'>('PAYMENT');
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [savedCards, setSavedCards] = useState([
    { id: '1', type: 'UzCard', last4: '1234', cardName: 'Uy Karta', maskedNumber: '**** 4321' },
    { id: '2', type: 'HUMO', last4: '5678', cardName: 'Ish Karta', maskedNumber: '**** 8765' },
  ]);
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
  const [invoicePhoneNumber, setInvoicePhoneNumber] = useState('');
  const [invoiceCardNumber, setInvoiceCardNumber] = useState('');
  const [invoiceCardExpiry, setInvoiceCardExpiry] = useState('');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<'phone' | 'card'>('phone');
  const cardMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Format new card number
  const formatNewCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  // Format expiry date (MM/YY)
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Detect card type (local UzCard/HUMO vs international Visa/Mastercard)
  const detectCardType = (cardNumber: string): 'local' | 'international' | null => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 6) return null;
    
    // UzCard typically starts with 8600, HUMO with 9860
    if (cleaned.startsWith('8600') || cleaned.startsWith('9860')) {
      return 'local';
    }
    // Visa starts with 4, Mastercard with 5
    if (cleaned.startsWith('4') || cleaned.startsWith('5')) {
      return 'international';
    }
    return null;
  };

  // Get card type name for placeholder/default
  const getCardTypeName = (): string => {
    if (!cardType) return 'Card';
    const cleaned = newCardNumber.replace(/\s/g, '');
    if (cardType === 'local') {
      return cleaned.startsWith('8600') ? 'UzCard' : 'HUMO';
    } else {
      return cleaned.startsWith('4') ? 'Visa' : 'Mastercard';
    }
  };

  // Validate new card details
  const isNewCardValid = () => {
    if (!newCardNumber.replace(/\s/g, '').length || newCardNumber.replace(/\s/g, '').length !== 16) {
      return false;
    }
    if (!newCardExpiry.length || newCardExpiry.length !== 5) {
      return false;
    }
    if (cardType === 'local') {
      return smsCode.length === 6 && isVerificationVerified;
    } else {
      return newCardCVC.length === 3;
    }
  };


  // Close card menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openCardMenuId) {
        const menuElement = cardMenuRefs.current[openCardMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenCardMenuId(null);
        }
      }
    };

    if (openCardMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openCardMenuId]);

  // Format price in UZS
  const formattedPrice = video.price?.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) || '50 000';

  // Determine benefits list
  const benefits = isPaid
    ? [
        'Full HD Quality',
        'Support the Creator',
        'Lifetime Access'
      ]
    : isSubscription
    ? [
        'Full HD Quality',
        'Support the Creator',
        'Exclusive Content',
        'Cancel Anytime'
      ]
    : [
        'Full HD Quality',
        'Support the Creator'
      ];

  // Determine video preview URL (prefer teaser, then videoUrl, then purchaseCoverUrl)
  const previewVideoUrl = video.teaserVideoUrl || video.videoUrl;
  const previewImageUrl = video.purchaseCoverUrl;


  const handlePayNow = () => {
    // Check if using saved card or new card
    const isUsingSavedCard = selectedPaymentMethod && savedCards.find(c => c.id === selectedPaymentMethod);
    const isUsingNewCard = !isUsingSavedCard && isNewCardValid();
    
    // Validate payment method
    if (!isUsingSavedCard && !isUsingNewCard) {
      return; // Don't proceed if no valid payment method
    }

    // Process payment
    setPaymentProcessing(true);
    
    // If using new card and save is enabled, save the card
    if (isUsingNewCard && saveCardEnabled) {
      const cleanedNumber = newCardNumber.replace(/\s/g, '');
      const last4 = cleanedNumber.slice(-4);
      let cardTypeName = 'Card';
      
      if (cardType === 'local') {
        cardTypeName = cleanedNumber.startsWith('8600') ? 'UzCard' : 'HUMO';
      } else {
        cardTypeName = cleanedNumber.startsWith('4') ? 'Visa' : 'Mastercard';
      }

      const newCard = {
        id: Date.now().toString(),
        type: cardTypeName,
        last4: last4,
        cardName: cardName.trim() || cardTypeName,
        maskedNumber: `**** ${last4}`,
      };

      // Save card to list
      setSavedCards([...savedCards, newCard]);
      
      // Note: In a real app, this would call the backend API with saveCard: true
      // processPayment(..., { saveCard: true, cardToken: ... });
    }

    setTimeout(() => {
      setPaymentProcessing(false);
      
      // Prepare transaction data for backend storage
      const price = video.price || 50000;
      const subtotal = price;
      const taxRate = 0.05; // 5% VAT
      const taxAmount = Math.round(subtotal * taxRate);
      const total = subtotal + taxAmount;
      
      const savedCard = savedCards.find(c => c.id === selectedPaymentMethod);
      const paymentMethodDisplay = savedCard 
        ? `${savedCard.type} ending in ${savedCard.last4}`
        : getPaymentMethodName();
      
      const transactionData: Transaction = {
        transactionId: transactionId,
        userId: 'current-user-id', // TODO: Get from auth context
        productId: video.id,
        productTitle: video.title,
        productType: isSubscription ? 'subscription' : 'paid',
        creatorId: video.userId,
        creatorName: video.user?.name,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: total,
        currency: video.currency || 'UZS',
        paymentMethodUsed: paymentMethodDisplay,
        securityProvider: 'Multibank',
        purchaseDate: new Date(),
        billingAddress: 'Tashkent, Uzbekistan', // TODO: Get from user profile
        userName: 'User Name', // TODO: Get from auth context
      };
      
      // Store transaction data in state for receipt view
      setCurrentTransaction(transactionData);
      
      // TODO: Backend API Call - Store transaction in database
      // This should be implemented in the backend API endpoint
      // Example:
      // try {
      //   await fetch('/api/transactions', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(transactionData),
      //   });
      // } catch (error) {
      //   console.error('Failed to save transaction:', error);
      //   // Handle error (show notification, retry, etc.)
      // }
      
      // Set payment success state to show receipt
      setPurchaseStep('PAYMENT_SUCCESS');
      
      // Call purchase/subscribe callbacks
      if (isPaid && onPurchase) {
        onPurchase();
      } else if (isSubscription && onSubscribe) {
        onSubscribe();
      }
      
      // Reset form after successful payment
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
    }, 2000);
  };

  const handleInvoicePaymentSubmit = () => {
    // Process invoice payment directly
    setPaymentProcessing(true);
    
    setTimeout(() => {
      setPaymentProcessing(false);
      
      // Prepare transaction data for backend storage
      const price = video.price || 50000;
      const subtotal = price;
      const taxRate = 0.05; // 5% VAT
      const taxAmount = Math.round(subtotal * taxRate);
      const total = subtotal + taxAmount;
      
      const transactionData: Transaction = {
        transactionId: transactionId,
        userId: 'current-user-id', // TODO: Get from auth context
        productId: video.id,
        productTitle: video.title,
        productType: isSubscription ? 'subscription' : 'paid',
        creatorId: video.userId,
        creatorName: video.user?.name,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: total,
        currency: video.currency || 'UZS',
        paymentMethodUsed: getPaymentMethodName(),
        securityProvider: 'Multibank',
        purchaseDate: new Date(),
        billingAddress: 'Tashkent, Uzbekistan', // TODO: Get from user profile
        userName: 'User Name', // TODO: Get from auth context
      };
      
      // Store transaction data in state for receipt view
      setCurrentTransaction(transactionData);
      
      // TODO: Backend API Call - Store transaction in database
      // See handlePayNow() for implementation example
      
      // Set payment success state to show receipt
      setPurchaseStep('PAYMENT_SUCCESS');
      
      // Call purchase callbacks
      if (isPaid && onPurchase) {
        onPurchase();
      } else if (isSubscription && onSubscribe) {
        onSubscribe();
      }
    }, 2000);
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) {
      console.error('Receipt element not found');
      return;
    }

    try {
      // Convert receipt HTML to canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      pdf.save(`receipt-twinkle-${transactionId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleContinueWatching = () => {
    // Return to comments section
    if (onPurchaseComplete) {
      onPurchaseComplete();
    }
  };

  // Generate transaction ID
  const generateTransactionId = () => {
    return `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  };

  const transactionId = useRef(generateTransactionId()).current;

  const getPaymentMethodName = () => {
    if (!selectedPaymentMethod) return 'Unknown';
    
    // Check if it's a saved card
    const savedCard = savedCards.find(c => c.id === selectedPaymentMethod);
    if (savedCard) {
      return savedCard.type;
    }
    
    // Check if it's a payment gateway
    const gatewayNames: { [key: string]: string } = {
      'click': 'Click',
      'payme': 'Payme',
      'uzum': 'Uzum Bank',
      'paynet': 'Paynet',
    };
    return gatewayNames[selectedPaymentMethod] || 'Card';
  };

  // Get SMS Code label based on state
  const getSmsLabel = () => {
    if (isSending) {
      return "SMS Code (Sending...)";
    }
    if (smsSent) {
      return (
        <span className="flex items-center text-sm font-medium">
          <span className="text-text-secondary mr-1">SMS Code</span>
          <span className="text-green-400">(Sent)</span>
        </span>
      );
    }
    return "SMS Code";
  };

  // Countdown timer for SMS resend
  useEffect(() => {
    if (countdownTime > 0) {
      const timer = setTimeout(() => {
        setCountdownTime(countdownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownTime]);

  // Ensure preview video plays automatically
  useEffect(() => {
    if (previewVideoRef.current && previewVideoUrl) {
      const video = previewVideoRef.current;
      // Set video properties
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      
      // Force play
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented, try again after user interaction
          // This is handled by the onLoadedData handler
        });
      }
    }
  }, [previewVideoUrl]);

  // Unified Single View (All content in one scrollable list)
  const renderUnifiedView = () => (
    <div className="flex flex-col h-full relative">
      {/* Zone A: Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-4">
          {/* 1. Preview Video (Top) - Mobile Only */}
          <div className="flex-shrink-0 mb-4 lg:hidden">
          {previewVideoUrl ? (
            <div className="w-full rounded-2xl overflow-hidden preview-video-no-controls">
              <video
                ref={previewVideoRef}
                src={previewVideoUrl}
                autoPlay={true}
                muted={true}
                loop={true}
                playsInline={true}
                controls={false}
                preload="auto"
                disablePictureInPicture={true}
                disableRemotePlayback={true}
                className="w-full h-auto max-h-64 object-cover preview-video-no-controls"
                style={{ 
                  pointerEvents: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  outline: 'none',
                  border: 'none',
                }}
                onLoadedData={(e) => {
                  // Force play when video is loaded
                  const video = e.target as HTMLVideoElement;
                  video.muted = true;
                  video.loop = true;
                  video.play().catch(() => {
                    // Ignore autoplay errors - browser may block autoplay
                  });
                }}
                onCanPlay={(e) => {
                  // Also try to play when video can start playing
                  const video = e.target as HTMLVideoElement;
                  if (video.paused) {
                    video.play().catch(() => {
                      // Ignore autoplay errors
                    });
                  }
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

          {/* 2. Header Info */}
          <div className="flex-shrink-0 mb-4">
            {/* 1. Video Title (Large, Bold) */}
            <h1 className="text-2xl font-bold text-white mb-2 line-clamp-2">
              {video.title}
            </h1>

            {/* 2. Price (Prominent UZS) */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-white">
                {formattedPrice} {video.currency || 'UZS'}
                {isSubscription && <span className="text-lg font-normal text-gray-400">/month</span>}
              </div>
            </div>

            {/* 4. Description Text Block (Plain Text) */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 leading-relaxed">
                {isPaid 
                  ? 'Purchase this video to get lifetime access with full HD quality. Your purchase directly supports the creator and allows you to download and watch this content anytime, anywhere.'
                  : isSubscription
                  ? 'Subscribe to this channel to access exclusive content, full HD quality videos, and support the creator. You can cancel your subscription at any time.'
                  : 'Get full access to this content with high-quality streaming and download options.'
                }
              </p>
            </div>

          </div>

          {/* 3. Payment Methods Block */}
          <div className="flex-shrink-0 space-y-3 mb-4">
            {/* 3.1 Payment Method: "Pay with Cards" */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Pay with Cards</h3>
              <div className="space-y-1.5">
                {savedCards.map((card) => (
                      <div
                        key={card.id}
                        ref={(el) => {
                          if (el) {
                            cardMenuRefs.current[card.id] = el;
                          }
                        }}
                        onClick={() => {
                          // Toggle selection: if already selected, deselect it
                          if (selectedPaymentMethod === card.id) {
                            setSelectedPaymentMethod(null);
                          } else {
                            setSelectedPaymentMethod(card.id);
                            // Clear new card inputs when selecting saved card
                            setNewCardNumber('');
                            setNewCardExpiry('');
                            setNewCardCVC('');
                            setSmsCode('');
                            setCardType(null);
                            setIsVerificationVerified(false);
                            setSmsSent(false);
                          }
                          setOpenCardMenuId(null);
                        }}
                        className={`relative w-full px-3 py-3 rounded-md border transition-colors h-14 cursor-pointer ${
                          selectedPaymentMethod === card.id
                            ? 'border-white/20 bg-white/10'
                            : 'border-surface/50 bg-surface/30 hover:bg-surface/50'
                        }`}
                      >
                        <div className="w-full h-full flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex flex-col justify-center gap-0.5 flex-1 min-w-0">
                              <span className="text-xs font-medium text-text-primary leading-tight truncate">{card.cardName}</span>
                              <span className="text-xs text-text-secondary leading-tight truncate">{card.maskedNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Card Logo */}
                              <div className="flex-shrink-0">
                                {card.type === 'UzCard' ? (
                                  <div className="w-10 h-6 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
                                    <span className="text-[7px] font-bold text-white tracking-tight">UZCARD</span>
                                  </div>
                                ) : card.type === 'HUMO' ? (
                                  <div className="w-10 h-6 rounded bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-sm">
                                    <span className="text-[7px] font-bold text-white tracking-tight">HUMO</span>
                                  </div>
                                ) : card.type === 'Visa' ? (
                                  <div className="w-10 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
                                    <span className="text-[9px] font-bold text-white tracking-wider">VISA</span>
                                  </div>
                                ) : card.type === 'Mastercard' ? (
                                  <div className="w-10 h-6 rounded bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 flex items-center justify-center shadow-sm">
                                    <div className="flex items-center gap-0.5">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-10 h-6 rounded bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-sm">
                                    <span className="text-[7px] font-bold text-white">CARD</span>
                                  </div>
                                )}
                              </div>
                              {/* More Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenCardMenuId(openCardMenuId === card.id ? null : card.id);
                                }}
                                className="p-1.5 rounded-full hover:bg-surface/50 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                                aria-label="More options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Delete Dropdown Menu */}
                        {openCardMenuId === card.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-[#1A1A1A] border border-surface rounded-lg shadow-lg overflow-hidden min-w-[120px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSavedCards(savedCards.filter(c => c.id !== card.id));
                                setOpenCardMenuId(null);
                                if (selectedPaymentMethod === card.id) {
                                  setSelectedPaymentMethod(null);
                                }
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface/50 transition-colors flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              <span>O'chirish</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Card Input Form (Always Visible) */}
                    <div className="mt-3 p-4 border border-surface/50 rounded-md bg-surface/30 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Card Number
                        </label>
                        <Input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={newCardNumber}
                          onChange={(e) => {
                            const formatted = formatNewCardNumber(e.target.value);
                            setNewCardNumber(formatted);
                            setSelectedPaymentMethod(null); // Clear saved card selection when typing
                            if (formatted.replace(/\s/g, '').length >= 6) {
                              const detectedType = detectCardType(formatted);
                              setCardType(detectedType);
                              if (detectedType !== cardType) {
                                setSmsSent(false);
                                setIsVerificationVerified(false);
                              }
                            } else {
                              setCardType(null);
                              setSmsSent(false);
                              setIsVerificationVerified(false);
                            }
                          }}
                          maxLength={19}
                          className="w-full bg-surface border-surface text-text-primary h-10"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            Expiration Date
                          </label>
                          <Input
                            type="text"
                            placeholder="MM/YY"
                            value={newCardExpiry}
                            onChange={(e) => {
                              const formatted = formatExpiry(e.target.value);
                              setNewCardExpiry(formatted);
                              setSelectedPaymentMethod(null); // Clear saved card selection when typing
                            }}
                            maxLength={5}
                            className="w-full bg-surface border-surface text-text-primary h-10"
                          />
                        </div>
                        <div>
                          <label className={`block mb-2 ${
                            cardType === 'local' && smsSent && !isSending
                              ? '' 
                              : 'text-sm font-medium text-text-secondary'
                          }`}>
                            {cardType === 'local' ? getSmsLabel() : 'CVV/CVC'}
                          </label>
                          <Input
                            type="text"
                            placeholder={cardType === 'local' ? '000000' : '000'}
                            value={cardType === 'local' ? smsCode : newCardCVC}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              if (cardType === 'local') {
                                setSmsCode(cleaned.slice(0, 6));
                              } else {
                                setNewCardCVC(cleaned.slice(0, 3));
                              }
                              setIsVerificationVerified(false);
                              setSelectedPaymentMethod(null); // Clear saved card selection when typing
                            }}
                            maxLength={cardType === 'local' ? 6 : 3}
                            disabled={cardType === 'local' && !smsSent}
                            className="w-full bg-surface border-surface text-text-primary h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      
                      {/* Verification Buttons Section (Below Input Fields) */}
                      {cardType === 'local' && (
                        <div className="space-y-2">
                          {smsSent && !isVerificationVerified && (
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSending(true);
                                  setTimeout(() => {
                                    setSmsSent(true);
                                    setIsSending(false);
                                    setCountdownTime(60); // 60 seconds countdown
                                  }, 1000);
                                }}
                                disabled={isSending || countdownTime > 0}
                                className="text-xs text-gray-400 hover:text-gray-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Resend SMS code
                              </button>
                              {countdownTime > 0 && (
                                <span className="text-xs text-gray-500">
                                  Resend in {countdownTime}s
                                </span>
                              )}
                            </div>
                          )}
                          <Button
                            type="button"
                            onClick={() => {
                              if (!smsSent) {
                                // Send SMS
                                setIsSending(true);
                                setTimeout(() => {
                                  setSmsSent(true);
                                  setIsSending(false);
                                  setCountdownTime(60); // 60 seconds countdown
                                }, 1000);
                              } else {
                                // Verify SMS code
                                if (smsCode.length === 6) {
                                  setIsVerificationVerified(true);
                                  setPaymentProcessing(true);
                                  setTimeout(() => {
                                    setPaymentProcessing(false);
                                  }, 500);
                                }
                              }
                            }}
                            disabled={
                              isSending ||
                              paymentProcessing ||
                              isVerificationVerified ||
                              (smsSent && smsCode.length !== 6)
                            }
                            className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSending ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </span>
                            ) : !smsSent ? (
                              'Send SMS Code'
                            ) : isVerificationVerified ? (
                              'Verified'
                            ) : (
                              'Verify Code'
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {/* Save Card Toggle Switch */}
                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-surface/30">
                        <span className="text-sm text-gray-300">Save card for future payments</span>
                        <button
                          type="button"
                          onClick={() => setSaveCardEnabled(!saveCardEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            saveCardEnabled ? 'bg-accent' : 'bg-surface/50'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              saveCardEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Card Nickname Input (Conditional) */}
                      {saveCardEnabled && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            Card Name (Optional)
                          </label>
                          <Input
                            type="text"
                            placeholder={getCardTypeName()}
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full bg-surface border-surface text-text-primary h-10"
                          />
                        </div>
                      )}
                    </div>
              </div>
            </div>

            {/* 3.2 Payment Method: "Payment Systems" */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Invoices</h3>
              <div className="overflow-x-auto sidebar-scrollbar-hide">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex flex-row gap-2" style={{ width: 'max-content' }}>
                    {[
                      { id: 'paynet', name: 'Paynet', logo: '💸', color: 'bg-purple-600' },
                      { id: 'click', name: 'Click', logo: '💳', color: 'bg-blue-600' },
                      { id: 'payme', name: 'Payme', logo: '💵', color: 'bg-green-600' },
                      { id: 'uzum', name: 'Uzum', logo: '🛒', color: 'bg-orange-600' },
                    ].map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMethod(wallet.id);
                          // Clear new card inputs when selecting invoice payment
                          setNewCardNumber('');
                          setNewCardExpiry('');
                          setNewCardCVC('');
                          setSmsCode('');
                          setCardType(null);
                          setIsVerificationVerified(false);
                          setSmsSent(false);
                        }}
                        className={`flex-shrink-0 w-24 px-3 py-3 rounded-md border transition-colors h-14 flex flex-col items-center justify-center gap-1 ${
                          selectedPaymentMethod === wallet.id
                            ? 'border-white/20 bg-white/10'
                            : 'border-surface/50 bg-surface/30 hover:bg-surface/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${wallet.color} text-white text-sm font-bold`}>
                          {wallet.logo}
                        </div>
                        <span className="text-xs font-medium text-text-primary whitespace-nowrap">{wallet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone B: Fixed Bottom Action */}
        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
          <Button
            onClick={handlePayNow}
            disabled={
              paymentProcessing ||
              (!selectedPaymentMethod && !isNewCardValid())
            }
            className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentProcessing ? (
              'Processing...'
            ) : isSubscription ? (
              `Subscribe ${formattedPrice} ${video.currency || 'UZS'}/month`
            ) : (
              `Pay ${formattedPrice} ${video.currency || 'UZS'}`
            )}
          </Button>
        </div>
      </div>
    );

  // Render Receipt View - Accepts transaction data for reusability in Financial Dashboard
  const renderReceiptView = (transaction?: Transaction) => {
    // Use provided transaction data or current transaction state
    const tx = transaction || currentTransaction;
    
    if (!tx) {
      // Fallback to current video data if no transaction provided (should not happen in normal flow)
      const price = video.price || 50000;
      const subtotal = price;
      const taxRate = 0.05;
      const taxAmount = Math.round(subtotal * taxRate);
      const total = subtotal + taxAmount;
      
      const savedCard = savedCards.find(c => c.id === selectedPaymentMethod);
      const paymentMethodDisplay = savedCard 
        ? `${savedCard.type} ending in ${savedCard.last4}`
        : getPaymentMethodName();
      
      const fallbackTx: Transaction = {
        transactionId: transactionId,
        userId: 'current-user-id',
        productId: video.id,
        productTitle: video.title,
        productType: isSubscription ? 'subscription' : 'paid',
        creatorId: video.userId,
        creatorName: video.user?.name,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: total,
        currency: video.currency || 'UZS',
        paymentMethodUsed: paymentMethodDisplay,
        securityProvider: 'Multibank',
        purchaseDate: new Date(),
        billingAddress: 'Tashkent, Uzbekistan',
        userName: 'User Name',
      };
      
      return renderReceiptViewContent(fallbackTx);
    }
    
    return renderReceiptViewContent(tx);
  };

  // Receipt content renderer - accepts Transaction data (reusable for Financial Dashboard)
  const renderReceiptViewContent = (tx: Transaction) => {
    const formattedSubtotal = tx.subtotal.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const formattedTax = tx.taxAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const formattedTotal = tx.totalAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    const currentDate = tx.purchaseDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Product description based on type
    const productDescription = tx.productType === 'subscription'
      ? 'Subscription includes: Full HD Quality, Exclusive Content, Ad-free viewing, Download permission, Cancel Anytime'
      : 'Purchase includes: Lifetime 4K Access, Ad-free viewing, Download permission, Full HD Quality';

    return (
      <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <div 
            ref={receiptRef}
            className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6 font-mono text-sm"
          >
            {/* A. Transaction Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-300">
              <h2 className="text-2xl font-bold text-black mb-1">TWINKLE</h2>
              <p className="text-sm text-gray-600 mb-2">PURCHASE RECEIPT</p>
              <div className="mt-3">
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded font-bold text-sm">PAID</span>
              </div>
            </div>

            {/* B. Purchase Details */}
            <div className="mb-6 space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Product Title:</div>
                <div className="text-black font-semibold">{tx.productTitle}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Product Description:</div>
                <div className="text-black text-xs leading-relaxed">{productDescription}</div>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3"></div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Creator Information:</div>
                <div className="text-black font-semibold">{tx.creatorName || 'Unknown Creator'}</div>
                <div className="text-black text-xs">Creator ID: {tx.creatorId || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Date & Time:</div>
                <div className="text-black font-semibold">{currentDate}</div>
              </div>
            </div>

            {/* C. User & Billing Details */}
            <div className="mb-6 space-y-3 border-t border-dashed border-gray-300 pt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">User ID/Name:</div>
                <div className="text-black font-semibold">{tx.userName || tx.userId}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Billing Address:</div>
                <div className="text-black text-xs">{tx.billingAddress || 'Tashkent, Uzbekistan'}</div>
              </div>
            </div>

            {/* D. Financial Summary */}
            <div className="mb-6 space-y-2 border-t border-dashed border-gray-300 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-black font-semibold">{formattedSubtotal} {tx.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT (5%):</span>
                <span className="text-black font-semibold">{formattedTax} {tx.currency}</span>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-black">{formattedTotal} {tx.currency}</span>
              </div>
            </div>

            {/* E. Payment Information & Security */}
            <div className="mb-6 space-y-3 border-t border-dashed border-gray-300 pt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Payment Method:</div>
                <div className="text-black font-semibold">{tx.paymentMethodUsed}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Transaction ID:</div>
                <div className="text-black font-semibold">#{tx.transactionId}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                <p className="text-xs text-gray-600 text-center">
                  This payment was secured by {tx.securityProvider}
                </p>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-4 border-t-2 border-dashed border-gray-300">
              <p className="text-xs text-gray-500">Retain this check for your records.</p>
            </div>
          </div>

          {/* Download PDF Button */}
          <div className="max-w-md mx-auto mt-4">
            <Button
              onClick={handleDownloadPDF}
              className="w-full h-10 bg-surface hover:bg-surface/80 text-text-primary border border-surface/50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF Receipt
            </Button>
          </div>
        </div>

        {/* Continue Watching Button */}
        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
          <Button
            onClick={handleContinueWatching}
            className="w-full h-10 bg-accent hover:bg-accent/90 text-white"
          >
            Continue Watching
          </Button>
        </div>
      </div>
    );
  };

  // Show receipt view if payment is successful
  if (purchaseStep === 'PAYMENT_SUCCESS') {
    return renderReceiptView(currentTransaction || undefined);
  }

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {renderUnifiedView()}
    </div>
  );
}