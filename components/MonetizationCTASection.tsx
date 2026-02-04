'use client';

import { Video, Transaction } from '@/types';
import { DEFAULT_SAVED_CARDS_DEMO } from '@/config/viewerConstants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Crown, Shield, CreditCard, Check, ArrowLeft, CheckCircle2, MoreVertical, X, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SavedCard {
  id: string;
  type: string;
  last4: string;
  cardName: string;
  maskedNumber: string;
}

interface MonetizationCTASectionProps {
  video: Video;
  onPurchase?: () => void;
  onSubscribe?: () => void;
  onPurchaseComplete?: () => void;
  isPlaylist?: boolean; // Indicates if this is a playlist purchase
}

export function MonetizationCTASection({ video, onPurchase, onSubscribe, onPurchaseComplete, isPlaylist = false }: MonetizationCTASectionProps) {
  const videoType = video.type || 'free';
  const isPaid = videoType === 'paid';
  const isSubscription = videoType === 'subscription';
  const [saveCardEnabled, setSaveCardEnabled] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isCardFormActive, setIsCardFormActive] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<'PAYMENT' | 'SMS_VERIFICATION' | 'WALLET_INVOICE_REQUEST' | 'WALLET_WAITING' | 'PAYMENT_SUCCESS'>('PAYMENT');
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  // Load saved cards from localStorage on mount
  const [savedCards, setSavedCards] = useState(() => {
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
  const cardMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const prevNewCardExpiryRef = useRef<string>('');
  const prevInvoiceCardExpiryRef = useRef<string>('');

  // Format new card number - numeric only
  const formatNewCardNumber = (value: string) => {
    // Strip all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    // Format with 4-digit spacing
    const formatted = numericValue.match(/.{1,4}/g)?.join(' ') || numericValue;
    return formatted.slice(0, 19); // Limit to 16 digits + 3 spaces = 19 chars max
  };

  // Format expiry date (MM/YY) - handles backspace properly
  const formatExpiry = (value: string, previousValue?: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    const previousCleaned = previousValue ? previousValue.replace(/\D/g, '') : '';
    
    // If user is deleting (fewer digits) and the input value ends with '/', 
    // they're trying to delete the slash, so return just digits without slash
    if (previousValue && cleaned.length < previousCleaned.length && value.endsWith('/')) {
      return cleaned;
    }
    
    // Normal formatting: add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Format phone number - always starts with +998, prevents deletion of prefix
  const formatPhoneNumber = (value: string, previousValue?: string) => {
    // Allow digits, spaces, and + sign
    const cleaned = value.replace(/[^\d\s+]/g, '');
    
    // Must always start with +998
    const PREFIX = '+998';
    
    // Extract all digits (remove + and spaces)
    const allDigits = cleaned.replace(/[^\d]/g, '');
    
    // Prevent deletion of 998 prefix - if user tries to delete into it, restore prefix
    const previousDigits = previousValue ? previousValue.replace(/[^\d]/g, '') : '998';
    if (previousDigits.startsWith('998') && allDigits.length < 3) {
      // User tried to delete into prefix, restore it
      return PREFIX + ' ';
    }
    
    // Ensure 998 prefix exists (prevent duplication)
    let digitsAfter998 = '';
    if (allDigits.startsWith('998')) {
      // Already has 998, extract what comes after
      digitsAfter998 = allDigits.slice(3);
    } else if (allDigits.length > 0) {
      // Doesn't start with 998, but has digits - use them as user digits
      digitsAfter998 = allDigits;
    }
    
    // Limit user digits to 9 (Uzbek mobile format: 9X XXX XX XX)
    if (digitsAfter998.length > 9) {
      digitsAfter998 = digitsAfter998.slice(0, 9);
    }
    
    // Format: +998 XX YYY YY YY
    if (digitsAfter998.length === 0) return PREFIX + ' ';
    if (digitsAfter998.length <= 2) return `${PREFIX} ${digitsAfter998}`;
    if (digitsAfter998.length <= 5) return `${PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2)}`;
    if (digitsAfter998.length <= 7) return `${PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2, 5)} ${digitsAfter998.slice(5)}`;
    return `${PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2, 5)} ${digitsAfter998.slice(5, 7)} ${digitsAfter998.slice(7, 9)}`;
  };

  // Check if wallet system is selected
  const isWalletSystemSelected = (): boolean => {
    if (!selectedPaymentMethod) return false;
    const walletSystems = ['click', 'payme', 'uzum'];
    return walletSystems.includes(selectedPaymentMethod);
  };

  // Legacy alias for compatibility
  const isInvoiceSystemSelected = isWalletSystemSelected;

  // Validate invoice phone number - simplified validation (just needs digits after +)
  const isInvoicePhoneValid = () => {
    if (!isInvoiceSystemSelected()) return true; // Not required if invoice not selected
    if (!invoicePhoneNumber.trim()) return false; // Must have input
    // Must start with + and have at least 9 digits (reasonable minimum for phone numbers)
    if (!invoicePhoneNumber.startsWith('+')) return false;
    const digits = invoicePhoneNumber.slice(1).replace(/\D/g, ''); // Get digits after +
    return digits.length >= 9; // At least 9 digits
  };

  // Validate invoice card details
  const isInvoiceCardValid = () => {
    if (!isInvoiceSystemSelected()) return true; // Not required if invoice not selected
    const cleanedCard = invoiceCardNumber.replace(/\s/g, '');
    const cleanedExpiry = invoiceCardExpiry.replace(/\D/g, '');
    return cleanedCard.length >= 16 && cleanedExpiry.length === 4; // MMYY format
  };

  // Detect card type (local UzCard/HUMO vs international Visa/Mastercard) - BIN Lookup
  const detectCardType = (cardNumber: string): 'local' | 'international' | null => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 4) return null;
    
    // Local Uzbek cards: 8600 (UzCard), 9860 (HUMO), 5614 (Local)
    if (cleaned.startsWith('8600') || cleaned.startsWith('9860') || cleaned.startsWith('5614')) {
      return 'local';
    }
    // International cards: 4 (Visa), 5 (Mastercard - excluding local ranges)
    if (cleaned.startsWith('4')) {
      return 'international'; // Visa
    }
    if (cleaned.startsWith('5')) {
      // Mastercard - but exclude local ranges (5600-5699 might be local in some regions)
      // For this implementation, 5 is international unless it's 5614 (already handled above)
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
    // For local cards: No CVV required at input stage
    // For international cards: CVV required
    if (cardType === 'international') {
      return newCardCVC.length === 3;
    }
    // Local cards are valid if number and expiry are correct (CVV not needed)
    return true;
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (invoicePollingInterval) {
        clearInterval(invoicePollingInterval);
      }
    };
  }, [invoicePollingInterval]);

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
    // Check if using saved card, new card, or wallet
    const isUsingSavedCard = selectedPaymentMethod && savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
    const walletSystems = ['click', 'payme', 'uzum'];
    const isUsingWallet = selectedPaymentMethod && walletSystems.includes(selectedPaymentMethod);
    const isUsingNewCard = !isUsingSavedCard && !isUsingWallet && isNewCardValid();
    
    // Validate payment method
    if (!isUsingSavedCard && !isUsingNewCard && !isUsingWallet) {
      return; // Don't proceed if no valid payment method
    }

    // Wallet payments: Open invoice request screen
    if (isUsingWallet) {
      setSelectedWallet(selectedPaymentMethod);
      setPurchaseStep('WALLET_INVOICE_REQUEST');
      return;
    }

    // Determine card type for routing logic
    let detectedCardType: 'local' | 'international' | null = null;
    let cardLast4 = '';
    
    if (isUsingSavedCard) {
      const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
      if (savedCard) {
        // Detect type from saved card
        detectedCardType = (savedCard.type === 'UzCard' || savedCard.type === 'HUMO') ? 'local' : 'international';
        cardLast4 = savedCard.last4;
      }
    } else if (isUsingNewCard) {
      detectedCardType = cardType;
      cardLast4 = newCardNumber.replace(/\s/g, '').slice(-4);
    }

    // Process payment
    setPaymentProcessing(true);

    // Flow A: International Cards (CVV Flow) - Direct to Receipt
    if (detectedCardType === 'international') {
      // If using new card and save is enabled, save the card
      if (isUsingNewCard && saveCardEnabled) {
        const cleanedNumber = newCardNumber.replace(/\s/g, '');
        const last4 = cleanedNumber.slice(-4);
        const cardTypeName = cleanedNumber.startsWith('4') ? 'Visa' : 'Mastercard';

        const newCard = {
          id: Date.now().toString(),
          type: cardTypeName,
          last4: last4,
          cardName: cardName.trim() || cardTypeName,
          maskedNumber: `**** ${last4}`,
        };

        const updatedCards = [...savedCards, newCard];
        setSavedCards(updatedCards);
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('savedCards', JSON.stringify(updatedCards));
        }
      }

      // Simulate 3D Secure processing
      setTimeout(() => {
        setPaymentProcessing(false);
        processPaymentSuccess(true, cardLast4);
      }, 2000);
    }
    // Flow B: Local Cards (SMS Flow) - Go to SMS Verification
    else if (detectedCardType === 'local') {
      // Simulate API call to initiate transaction and send SMS
      setTimeout(() => {
        setPaymentProcessing(false);
        setSmsSent(true);
        setCountdownTime(60); // 60 seconds countdown
        setPurchaseStep('SMS_VERIFICATION'); // Switch to SMS verification view
      }, 1500);
    }
  };

  // Handle cancellation of SMS verification (cancel payment)
  const handleCancelPayment = async () => {
    setPaymentProcessing(true);

    // TODO: API call to void/cancel the pending transaction
    // const response = await fetch('/api/payments/void', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     cardNumber: newCardNumber.replace(/\s/g, ''),
    //     expiry: newCardExpiry,
    //     transactionId: transactionId, // TODO: Store transaction ID when initiating SMS
    //   }),
    // });

    // Simulate API call to void transaction
    setTimeout(() => {
      setPaymentProcessing(false);
      
      // Reset SMS verification state
      setSmsCode('');
      setSmsSent(false);
      setIsVerificationVerified(false);
      setCountdownTime(0);
      
      // Clear payment processing state
      setPaymentProcessing(false);
      
      // Return to main payment screen
      setPurchaseStep('PAYMENT');
      
      // Optionally clear selected payment method to allow user to choose again
      // setSelectedPaymentMethod(null); // Uncomment if you want to clear selection
    }, 500);
  };

  // Handle SMS verification confirmation (for local cards)
  const handleConfirmPayment = async () => {
    if (smsCode.length !== 6) {
      return; // Don't proceed if SMS code is invalid
    }

    setPaymentProcessing(true);

    // TODO: API call to confirm payment with SMS code
    // const response = await fetch('/api/payments/confirm', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     cardNumber: newCardNumber.replace(/\s/g, ''),
    //     expiry: newCardExpiry,
    //     smsCode: smsCode,
    //     amount: video.price,
    //     currency: video.currency || 'UZS',
    //   }),
    // });

    // Simulate API call
    setTimeout(() => {
      setPaymentProcessing(false);
      setIsVerificationVerified(true);
      
      // If save card is enabled, save the card
      if (saveCardEnabled) {
        const cleanedNumber = newCardNumber.replace(/\s/g, '');
        const last4 = cleanedNumber.slice(-4);
        const cardTypeName = cleanedNumber.startsWith('8600') ? 'UzCard' : 'HUMO';

        const newCard = {
          id: Date.now().toString(),
          type: cardTypeName,
          last4: last4,
          cardName: cardName.trim() || cardTypeName,
          maskedNumber: `**** ${last4}`,
        };

        const updatedCards = [...savedCards, newCard];
        setSavedCards(updatedCards);
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('savedCards', JSON.stringify(updatedCards));
        }
      }

      // Process payment success
      const cardLast4 = newCardNumber.replace(/\s/g, '').slice(-4);
      processPaymentSuccess(false, cardLast4);
    }, 1500);
  };

  // Helper function to process payment success and show receipt
  const processPaymentSuccess = (isUsingSavedCard: boolean, cardLast4: string) => {
    // Prepare transaction data for backend storage
    const price = video.price || 50000;
    const subtotal = price;
    const taxRate = 0.05; // 5% VAT
    const taxAmount = Math.round(subtotal * taxRate);
    const total = subtotal + taxAmount;
    
    const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
    let paymentMethodDisplay = '';
    
    if (isUsingSavedCard && savedCard) {
      paymentMethodDisplay = `${savedCard.type} ending in ${savedCard.last4}`;
    } else if (cardLast4) {
      const cleanedNumber = newCardNumber.replace(/\s/g, '');
      const cardTypeName = cleanedNumber.startsWith('8600') ? 'UzCard' 
        : cleanedNumber.startsWith('9860') ? 'HUMO'
        : cleanedNumber.startsWith('4') ? 'Visa'
        : 'Mastercard';
      paymentMethodDisplay = `${cardTypeName} ending in ${cardLast4}`;
    } else {
      paymentMethodDisplay = getPaymentMethodName();
    }
    
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
    const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
    if (savedCard) {
      return savedCard.type;
    }
    
    // Check if it's a payment gateway
    const gatewayNames: { [key: string]: string } = {
      'click': 'Click',
      'payme': 'Payme',
      'uzum': 'Uzum Bank',
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
            <h1 className="text-2xl font-bold text-white mb-2 whitespace-normal break-words h-auto">
              {video.title}
            </h1>

            {/* 2. Price (Prominent UZS) */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-white">
                {formattedPrice} {video.currency || 'UZS'}
                {isSubscription && <span className="text-lg font-normal text-gray-400">/month</span>}
                {!isSubscription && isPlaylist && <span className="text-lg font-normal text-gray-400 opacity-60"> / Playlist</span>}
              </div>
            </div>

            {/* 4. Description Text Block (Plain Text) */}
            {/* Display video.saleDescription if available, otherwise use default text */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                {video.saleDescription || "By purchasing this content, you gain lifetime access to the video in maximum available quality (up to 4K). Your support directly empowers the creator to continue producing high-quality work and maintain their valuable artistic endeavors."}
              </p>
            </div>

          </div>

          {/* 3. Payment Methods Block */}
          <div className="flex-shrink-0 space-y-3 mb-4">
            {/* 3.1 Payment Method: "Pay with Card(s)" */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Pay with Card(s)</h3>
              <div className="space-y-1.5">
                {savedCards.map((card: SavedCard) => (
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
                            setIsCardFormActive(false); // Deactivate card form
                            setSelectedWallet(null); // Clear wallet selection
                          } else {
                            setSelectedPaymentMethod(card.id);
                            setIsCardFormActive(false); // Deactivate card form when selecting saved card
                            setSelectedWallet(null); // Clear wallet selection when selecting saved card
                            // Clear invoice input when selecting saved card
                            setInvoicePhoneNumber('+998 ');
                            setInvoiceCardNumber('');
                            setInvoiceCardExpiry('');
                            setActiveInvoiceIdentifier(null);
                            // Clear new card inputs when selecting saved card
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
                                const updatedCards = savedCards.filter((c: SavedCard) => c.id !== card.id);
                                setSavedCards(updatedCards);
                                // Update localStorage
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('savedCards', JSON.stringify(updatedCards));
                                }
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
                    <div 
                      onClick={() => {
                        setIsCardFormActive(true);
                        setSelectedPaymentMethod(null); // Clear saved card selection when clicking form
                        setSelectedWallet(null); // Clear wallet selection when clicking form
                        setInvoicePhoneNumber(''); // Clear invoice inputs
                        setInvoiceCardNumber('');
                        setInvoiceCardExpiry('');
                        setActiveInvoiceIdentifier(null);
                      }}
                      className={`mt-3 p-4 border rounded-md space-y-4 transition-colors cursor-pointer ${
                        isCardFormActive || newCardNumber || newCardExpiry || newCardCVC || cardName
                          ? 'border-white/20 bg-white/10'
                          : 'border-surface/50 bg-surface/30'
                      }`}
                    >
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
                          className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            Valid until
                          </label>
                          <Input
                            type="text"
                            placeholder="MM/YY"
                            value={newCardExpiry}
                            onFocus={() => {
                              setIsCardFormActive(true);
                              setSelectedPaymentMethod(null); // Clear saved card selection when focusing input
                              setSelectedWallet(null); // Clear wallet selection when focusing input
                            }}
                            onChange={(e) => {
                              const formatted = formatExpiry(e.target.value, prevNewCardExpiryRef.current);
                              prevNewCardExpiryRef.current = formatted;
                              setNewCardExpiry(formatted);
                              setIsCardFormActive(true);
                              setSelectedPaymentMethod(null); // Clear saved card selection when typing
                              setSelectedWallet(null); // Clear wallet selection when typing
                            }}
                            maxLength={5}
                            className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
                          />
                        </div>
                        {/* CVV field - only for international cards */}
                        {cardType === 'international' ? (
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                              CVV
                            </label>
                            <Input
                              type="text"
                              placeholder="000"
                              value={newCardCVC}
                              onFocus={() => {
                                setIsCardFormActive(true);
                                setSelectedPaymentMethod(null); // Clear saved card selection when focusing input
                                setSelectedWallet(null); // Clear wallet selection when focusing input
                              }}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                setNewCardCVC(cleaned.slice(0, 3));
                                setIsCardFormActive(true);
                                setSelectedPaymentMethod(null); // Clear saved card selection when typing
                                setSelectedWallet(null); // Clear wallet selection when typing
                              }}
                              maxLength={3}
                              className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
                            />
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                      
                      {/* Save Card Toggle Switch */}
                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-surface/30">
                        <span className="text-sm text-gray-300">Save card</span>
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
                            onFocus={() => {
                              setIsCardFormActive(true);
                              setSelectedPaymentMethod(null); // Clear saved card selection when focusing input
                              setSelectedWallet(null); // Clear wallet selection when focusing input
                            }}
                            onChange={(e) => {
                              setCardName(e.target.value);
                              setIsCardFormActive(true);
                              setSelectedPaymentMethod(null); // Clear saved card selection when typing
                              setSelectedWallet(null); // Clear wallet selection when typing
                            }}
                            className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
                          />
                        </div>
                      )}
                    </div>
              </div>
            </div>

            {/* 3.2 Payment Method: "Wallets" */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Wallets</h3>
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { id: 'click', name: 'Click' },
                  { id: 'payme', name: 'Payme' },
                  { id: 'uzum', name: 'Uzum' },
                ].map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => {
                      // Toggle wallet selection (aligns with card selection behavior)
                      if (selectedPaymentMethod === wallet.id) {
                        setSelectedPaymentMethod(null);
                        setSelectedWallet(null);
                        setInvoicePhoneNumber('+998 ');
                        setInvoiceCardNumber('');
                        setInvoiceCardExpiry('');
                        setActiveInvoiceIdentifier(null);
                        setIsCardFormActive(false); // Deactivate card form
                      } else {
                        setSelectedWallet(wallet.id);
                        setSelectedPaymentMethod(wallet.id);
                        setIsCardFormActive(false); // Deactivate card form when selecting wallet
                        // Clear new card inputs when selecting wallet
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

  // Get wallet name by ID
  const getWalletName = (walletId: string | null): string => {
    if (!walletId) return 'Wallet';
    const wallets: Record<string, string> = {
      'click': 'Click',
      'payme': 'Payme',
      'uzum': 'Uzum'
    };
    return wallets[walletId] || 'Wallet';
  };

  // Handle invoice request - send invoice to wallet
  const handleSendInvoice = () => {
    if (!selectedWallet) return;
    
    // Only proceed if exactly one identifier is active and valid
    if (activeInvoiceIdentifier === 'phone') {
      if (!isInvoicePhoneValid()) return;
    } else if (activeInvoiceIdentifier === 'card') {
      if (!isInvoiceCardValid()) return;
    } else {
      // No identifier is active - don't proceed
      return;
    }

    setPaymentProcessing(true);

    // Prepare credentials based on active identifier
    const credentialType = activeInvoiceIdentifier;
    let credentialToUse = '';
    
    if (activeInvoiceIdentifier === 'phone') {
      credentialToUse = invoicePhoneNumber.replace(/\D/g, '');
    } else if (activeInvoiceIdentifier === 'card') {
      credentialToUse = invoiceCardNumber.replace(/\s/g, '');
    }

    // TODO: API call to send invoice
    // await fetch('/api/wallets/invoice', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     wallet: selectedWallet,
    //     [credentialType]: credentialToUse,
    //     expiry: credentialType === 'card' ? invoiceCardExpiry.replace(/\D/g, '') : undefined,
    //     amount: video.price,
    //     currency: video.currency || 'UZS',
    //   }),
    // });

    // Simulate API call
    setTimeout(() => {
      setPaymentProcessing(false);
      setInvoiceStatus('pending');
      setPurchaseStep('WALLET_WAITING');
      startInvoicePolling();
    }, 1500);
  };

  // Start polling for invoice status
  const startInvoicePolling = () => {
    // Clear any existing polling
    if (invoicePollingInterval) {
      clearInterval(invoicePollingInterval);
    }

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      // TODO: API call to check invoice status
      // const response = await fetch(`/api/wallets/invoice-status?wallet=${selectedWallet}&transactionId=${transactionId}`);
      // const data = await response.json();
      
      // Simulate polling response (in real app, check actual API)
      const mockStatus = Math.random() > 0.85 ? 'paid' : 'pending'; // 15% chance of success for testing
      
      if (mockStatus === 'paid') {
        clearInterval(interval);
        setInvoicePollingInterval(null);
        setInvoiceStatus('paid');
        // Process payment success
        processPaymentSuccess(false, '');
      }
    }, 5000);

    setInvoicePollingInterval(interval);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setInvoicePollingInterval(null);
      if (invoiceStatus === 'pending') {
        setInvoiceStatus('failed');
      }
    }, 300000); // 5 minutes
  };

  // Cancel invoice/polling
  const handleCancelInvoice = () => {
    if (invoicePollingInterval) {
      clearInterval(invoicePollingInterval);
      setInvoicePollingInterval(null);
    }
    setInvoiceStatus(null);
    setPurchaseStep('PAYMENT');
    setSelectedWallet(null);
    setInvoicePhoneNumber('');
    setInvoiceCardNumber('');
    setInvoiceCardExpiry('');
    setActiveInvoiceIdentifier(null);
  };

  // Render Wallet Invoice Request View
  const renderWalletInvoiceRequestView = () => {
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
            {/* Primary Option: Phone Number Input Block */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                activeInvoiceIdentifier === 'card' 
                  ? 'text-text-secondary/50' 
                  : 'text-text-secondary'
              }`}>
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+998 XX YYY YY YY"
                value={invoicePhoneNumber}
                disabled={activeInvoiceIdentifier === 'card'}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value, invoicePhoneNumber);
                  setInvoicePhoneNumber(formatted);
                  
                  // First input wins: If user types beyond the +998 prefix, lock phone as active
                  const digitsAfterPrefix = formatted.replace(/[^\d]/g, '').slice(3); // Get digits after 998
                  if (digitsAfterPrefix.length > 0 && activeInvoiceIdentifier === null) {
                    setActiveInvoiceIdentifier('phone');
                    // Clear card inputs when phone becomes active
                    setInvoiceCardNumber('');
                    setInvoiceCardExpiry('');
                  }
                  
                  // Reset logic: If phone input is back to just +998, return to neutral state
                  if (digitsAfterPrefix.length === 0 && activeInvoiceIdentifier === 'phone') {
                    setActiveInvoiceIdentifier(null);
                  }
                }}
                className={`w-full h-10 outline-none ${
                  activeInvoiceIdentifier === 'card'
                    ? 'bg-surface/20 border-surface/30 text-text-secondary/50 cursor-not-allowed'
                        : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0'
                }`}
              />
            </div>

            {/* Visual Divider - Horizontal Line */}
            <div className="w-full h-px bg-zinc-800 my-6"></div>

            {/* Secondary Option: Card Details Input Block */}
            <div>
              <label className={`block text-sm font-medium mb-4 ${
                activeInvoiceIdentifier === 'phone' 
                  ? 'text-text-secondary/50' 
                  : 'text-text-secondary'
              }`}>
                Card Details
              </label>
              <div className={`p-4 border rounded-md space-y-4 ${
                activeInvoiceIdentifier === 'phone'
                  ? 'border-surface/30 bg-surface/20'
                  : 'border-surface/50 bg-surface/30'
              }`}>
                {/* Card Number */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    activeInvoiceIdentifier === 'phone' 
                      ? 'text-text-secondary/50' 
                      : 'text-text-secondary'
                  }`}>
                    Card Number
                  </label>
                  <Input
                    type="text"
                    placeholder="8600 1234 5678 9012"
                    value={invoiceCardNumber}
                    disabled={activeInvoiceIdentifier === 'phone'}
                    onChange={(e) => {
                      const formatted = formatNewCardNumber(e.target.value);
                      setInvoiceCardNumber(formatted);
                      
                      // First input wins: If this is the first character typed, lock card as active
                      if (formatted.replace(/\s/g, '').length > 0 && activeInvoiceIdentifier === null) {
                        setActiveInvoiceIdentifier('card');
                        // Clear phone input when card becomes active
                        setInvoicePhoneNumber('');
                      }
                      
                      // Reset logic: If card number is fully cleared, check if expiry is also cleared
                      if (formatted.replace(/\s/g, '').length === 0) {
                        const cleanedExpiry = invoiceCardExpiry.replace(/\D/g, '');
                        if (cleanedExpiry.length === 0 && activeInvoiceIdentifier === 'card') {
                          setActiveInvoiceIdentifier(null);
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
                {/* Expiration Date */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    activeInvoiceIdentifier === 'phone' 
                      ? 'text-text-secondary/50' 
                      : 'text-text-secondary'
                  }`}>
                    Expiration Date
                  </label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={invoiceCardExpiry}
                    disabled={activeInvoiceIdentifier === 'phone'}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value, prevInvoiceCardExpiryRef.current);
                      prevInvoiceCardExpiryRef.current = formatted;
                      setInvoiceCardExpiry(formatted);
                      
                      // First input wins: If this is the first character typed, lock card as active
                      if (formatted.trim().length > 0 && activeInvoiceIdentifier === null) {
                        setActiveInvoiceIdentifier('card');
                        // Clear phone input when card becomes active
                        setInvoicePhoneNumber('');
                      }
                      
                      // Reset logic: If expiry is fully cleared, check if card number is also cleared
                      if (formatted.replace(/\D/g, '').length === 0) {
                        const cleanedCard = invoiceCardNumber.replace(/\s/g, '');
                        if (cleanedCard.length === 0 && activeInvoiceIdentifier === 'card') {
                          setActiveInvoiceIdentifier(null);
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

        {/* Fixed Bottom Actions */}
        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4 space-y-3">
          {/* 2nd Priority: Cancel */}
          <Button
            onClick={handleCancelInvoice}
            disabled={paymentProcessing}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          
          {/* 1st Priority: Send Invoice (Should be at the bottom) */}
          <Button
            onClick={handleSendInvoice}
            disabled={
              paymentProcessing ||
              !activeInvoiceIdentifier ||
              (activeInvoiceIdentifier === 'phone' && !isInvoicePhoneValid()) ||
              (activeInvoiceIdentifier === 'card' && !isInvoiceCardValid())
            }
            className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentProcessing ? 'Sending...' : 'Send Invoice'}
          </Button>
        </div>
      </div>
    );
  };

  // Render Wallet Waiting View
  const renderWalletWaitingView = () => {
    const walletName = getWalletName(selectedWallet);
    // Determine which credential was used based on activeInvoiceIdentifier
    const maskedNumber = activeInvoiceIdentifier === 'phone'
      ? invoicePhoneNumber.replace(/\D/g, '').slice(-4)
      : invoiceCardNumber.replace(/\s/g, '').slice(-4);

    return (
      <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Waiting for Payment</h2>
            <p className="text-sm text-gray-400">
              We have sent an invoice to your {walletName} account linked to the number **** {maskedNumber}. Please complete the payment on your mobile app.
            </p>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
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

        {/* Fixed Bottom Action */}
        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
          <Button
            onClick={handleCancelInvoice}
            className="w-full h-10 bg-surface hover:bg-surface/80 text-text-primary border border-surface/50"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // Render SMS Verification View (Local Cards Only)
  const renderSMSVerificationView = () => {
    const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
    const cardDisplay = savedCard 
      ? `${savedCard.type} ending in ${savedCard.last4}`
      : cardType === 'local' 
        ? (newCardNumber.replace(/\s/g, '').startsWith('8600') ? 'UzCard' : 'HUMO')
        : 'Card';
    const cardLast4 = savedCard 
      ? savedCard.last4
      : newCardNumber.replace(/\s/g, '').slice(-4);

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
                {getSmsLabel()}
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={smsCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setSmsCode(cleaned.slice(0, 6));
                }}
                maxLength={6}
                className="w-full bg-surface border-surface text-text-primary h-10"
              />
            </div>

            {/* Resend SMS Code Button */}
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
                Resend Code
              </button>
              {countdownTime > 0 && (
                <span className="text-xs text-gray-500">
                  Resend in {countdownTime}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4 space-y-3">
          {/* 2nd Priority: Cancel */}
          <Button
            onClick={handleCancelPayment}
            disabled={paymentProcessing}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          
          {/* 1st Priority: Confirm Payment (Should be at the bottom) */}
          <Button
            onClick={handleConfirmPayment}
            disabled={
              paymentProcessing ||
              smsCode.length !== 6
            }
            className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentProcessing ? (
              'Processing...'
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </div>
      </div>
    );
  };

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
      
      const savedCard = savedCards.find((c: SavedCard) => c.id === selectedPaymentMethod);
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

    // Product description - use default text (matches purchase description) with signature
    const defaultDescription = "By purchasing this content, you gain lifetime access to the video in maximum available quality (up to 4K). Your support directly empowers the creator to continue producing high-quality work and maintain their valuable artistic endeavors.";
    const productDescription = `${defaultDescription}\n\nTwinkle 🥂`;

    return (
      <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
        {/* Scrollable Content: Header and Receipt Preview */}
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-4">
          {/* 1. Header Title */}
          <h2 className="text-xl font-bold text-white mb-4">Payment Receipt</h2>

          {/* 2. Receipt Preview (The Bill) - Scrollable if needed */}
          <div>
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
                  <p className="text-black text-xs leading-relaxed whitespace-pre-wrap">{productDescription}</p>
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
          </div>
        </div>

        {/* Fixed Footer: Download and Continue Watching Buttons */}
        <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
          {/* 1. Download Button (Secondary Style) */}
          <Button
            onClick={handleDownloadPDF}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 mb-3"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>

          {/* 2. Continue Watching Button (Primary Style) */}
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

  // Show SMS verification view if SMS verification is required (local cards)
  if (purchaseStep === 'SMS_VERIFICATION') {
    return (
      <div 
        className="w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {renderSMSVerificationView()}
      </div>
    );
  }

  // Show wallet invoice request view
  if (purchaseStep === 'WALLET_INVOICE_REQUEST') {
    return (
      <div 
        className="w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {renderWalletInvoiceRequestView()}
      </div>
    );
  }

  // Show wallet waiting view
  if (purchaseStep === 'WALLET_WAITING') {
    return (
      <div 
        className="w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {renderWalletWaitingView()}
      </div>
    );
  }

  // Show receipt view if payment is successful
  // ReceiptView accepts transaction data for reusability in Financial Dashboard
  if (purchaseStep === 'PAYMENT_SUCCESS') {
    return (
      <div 
        className="w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {renderReceiptView(currentTransaction || undefined)}
      </div>
    );
  }

  // Default: Show payment input view
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