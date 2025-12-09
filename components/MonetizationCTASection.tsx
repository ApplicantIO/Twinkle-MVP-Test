'use client';

import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Crown, Shield, CreditCard, Check, ArrowLeft, CheckCircle2, MoreVertical, X, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface MonetizationCTASectionProps {
  video: Video;
  onPurchase?: () => void;
  onSubscribe?: () => void;
}

type PurchaseStep = 'PRODUCT_INFO' | 'PAYMENT_SELECTION' | 'PAYMENT_CONFIRMATION' | 'PAYMENT_SUCCESS' | 'ADD_CARD' | 'INVOICE_PAYMENT';

export function MonetizationCTASection({ video, onPurchase, onSubscribe }: MonetizationCTASectionProps) {
  const videoType = video.type || 'free';
  const isPaid = videoType === 'paid';
  const isSubscription = videoType === 'subscription';
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('PRODUCT_INFO');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [invoicePhoneNumber, setInvoicePhoneNumber] = useState('');
  const [invoiceCardNumber, setInvoiceCardNumber] = useState('');
  const [invoiceCardExpiry, setInvoiceCardExpiry] = useState('');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<'phone' | 'card'>('phone');
  const cardMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previewVideoRef = useRef<HTMLVideoElement>(null);

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

  // Handle verification and save card
  const handleCardVerification = () => {
    // Validate all required fields
    if (!cardName.trim() || newCardNumber.replace(/\s/g, '').length !== 16 || newCardExpiry.length !== 5) {
      return;
    }

    // Ensure verification was completed
    if (!isVerificationVerified) {
      return;
    }

    const cleanedNumber = newCardNumber.replace(/\s/g, '');
    const last4 = cleanedNumber.slice(-4);
    let cardTypeName = 'Card';
    
    // Determine card type and validate verification codes
    if (cardType === 'local') {
      if (smsCode.length !== 6) {
        return; // SMS code required for local cards
      }
      // Mock SMS verification
      cardTypeName = cleanedNumber.startsWith('8600') ? 'UzCard' : 'HUMO';
    } else if (cardType === 'international') {
      if (newCardCVC.length !== 3) {
        return; // CVV/CVC required for international cards
      }
      // Mock CVV/CVC verification
      cardTypeName = cleanedNumber.startsWith('4') ? 'Visa' : 'Mastercard';
    } else {
      // If card type not detected, assume international and use CVV
      if (newCardCVC.length !== 3) {
        return; // CVV/CVC required
      }
      cardTypeName = cleanedNumber.startsWith('4') ? 'Visa' : 'Mastercard';
    }

    // Create new card
    const newCard = {
      id: Date.now().toString(),
      type: cardTypeName,
      last4: last4,
      cardName: cardName.trim(),
      maskedNumber: `**** ${last4}`,
    };

    // Mock saving process
    setPaymentProcessing(true);
    setTimeout(() => {
      // Add card to saved cards list
      setSavedCards([...savedCards, newCard]);
      
      // Reset all form states
      setCardName('');
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCVC('');
      setSmsCode('');
      setCardType(null);
      setPaymentProcessing(false);
      setIsVerificationVerified(false);
      setSmsSent(false);
      
      // Auto-select the new card and go back to product info
      setSelectedPaymentMethod(newCard.id);
      setCurrentStep('PRODUCT_INFO');
    }, 1000);
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
    // Check if invoice payment method is selected
    const isInvoicePayment = selectedPaymentMethod && ['click', 'payme', 'uzum', 'paynet'].includes(selectedPaymentMethod);
    
    if (isInvoicePayment) {
      // Open invoice payment window
      setCurrentStep('INVOICE_PAYMENT');
      setInvoicePhoneNumber('');
      setInvoiceCardNumber('');
      setInvoiceCardExpiry('');
      setInvoicePaymentMethod('phone');
    } else {
      // Direct payment with saved card
      setCurrentStep('PAYMENT_CONFIRMATION');
      setPaymentProcessing(true);
      
      // Then move to success after processing
      setTimeout(() => {
        setPaymentProcessing(false);
        setCurrentStep('PAYMENT_SUCCESS');
        // Call purchase callbacks
        if (isPaid && onPurchase) {
          onPurchase();
        } else if (isSubscription && onSubscribe) {
          onSubscribe();
        }
      }, 2000);
    }
  };

  const handleInvoicePaymentSubmit = () => {
    // Validate invoice payment info
    if (invoicePaymentMethod === 'phone') {
      if (!invoicePhoneNumber.trim() || invoicePhoneNumber.length < 9) {
        return;
      }
    } else {
      if (!invoiceCardNumber.trim() || invoiceCardNumber.replace(/\s/g, '').length !== 16 || !invoiceCardExpiry.trim()) {
        return;
      }
    }

    // Process invoice payment
    setCurrentStep('PAYMENT_CONFIRMATION');
    setPaymentProcessing(true);
    
    setTimeout(() => {
      setPaymentProcessing(false);
      setCurrentStep('PAYMENT_SUCCESS');
      // Call purchase callbacks
      if (isPaid && onPurchase) {
        onPurchase();
      } else if (isSubscription && onSubscribe) {
        onSubscribe();
      }
    }, 2000);
  };

  const handleDownloadPDF = () => {
    // Mock PDF download
    console.log('Downloading receipt as PDF...');
    alert('Downloading Receipt...');
    // In a real app, use html2canvas or jspdf here
  };

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


  // Auto-advance from confirmation to success
  useEffect(() => {
    if (currentStep === 'PAYMENT_CONFIRMATION') {
      const timer = setTimeout(() => {
        // This is handled by handlePayNow now
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

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
  }, [previewVideoUrl, currentStep]);

  // Step: ADD_CARD (Separate Window)
  const renderAddCard = () => {
    return (
      <>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-hide min-h-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <button
                onClick={() => setCurrentStep('PRODUCT_INFO')}
                className="p-1.5 rounded-full hover:bg-surface/50 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-text-primary">Add Card</h2>
            </div>

            {/* Card Form */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Name for Card
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Mening Kartam"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-surface border-surface text-text-primary h-10"
                />
              </div>
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
                  }}
                  maxLength={5}
                  className="w-full bg-surface border-surface text-text-primary h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {cardType === 'local' ? 'SMS Code' : 'CVV/CVC'}
                </label>
                <div className="flex flex-row items-center gap-2">
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
                    }}
                    maxLength={cardType === 'local' ? 6 : 3}
                    disabled={cardType === 'local' && !smsSent}
                    className="flex-1 bg-surface border-surface text-text-primary h-10 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (cardType === 'local') {
                        if (!smsSent) {
                          setPaymentProcessing(true);
                          setTimeout(() => {
                            setSmsSent(true);
                            setPaymentProcessing(false);
                          }, 1000);
                        } else {
                          if (smsCode.length === 6) {
                            setIsVerificationVerified(true);
                            setPaymentProcessing(true);
                            setTimeout(() => {
                              setPaymentProcessing(false);
                            }, 500);
                          }
                        }
                      } else {
                        const isValid = (cardType === 'international' || cardType === null) && newCardCVC.length === 3;
                        if (isValid) {
                          setIsVerificationVerified(true);
                          setPaymentProcessing(true);
                          setTimeout(() => {
                            setPaymentProcessing(false);
                          }, 500);
                        }
                      }
                    }}
                    disabled={
                      paymentProcessing ||
                      isVerificationVerified ||
                      (cardType === 'local' && smsSent && smsCode.length !== 6) ||
                      ((cardType === 'international' || cardType === null) && newCardCVC.length !== 3)
                    }
                    className="h-10 py-0 px-4 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                  >
                    {cardType === 'local' 
                      ? (!smsSent ? 'SMS Yuborish' : (isVerificationVerified ? 'Tasdiqlandi' : 'Tasdiqlash'))
                      : (isVerificationVerified ? 'Tasdiqlandi' : 'Tasdiqlash')
                    }
                  </Button>
                </div>
                {cardType === 'local' && smsSent && (
                  <p className="text-xs text-text-secondary mt-2">
                    We've sent a verification code to your phone.
                  </p>
                )}
              </div>
            </div>

            {/* Save Button - Sticky Bottom */}
            <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-surface/50 p-4 mt-auto">
              <Button
                onClick={handleCardVerification}
                disabled={
                  !cardName.trim() ||
                  newCardNumber.replace(/\s/g, '').length !== 16 ||
                  newCardExpiry.length !== 5 ||
                  !isVerificationVerified ||
                  paymentProcessing
                }
                className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kartani Saqlash
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Step: INVOICE_PAYMENT (Separate Window)
  const renderInvoicePayment = () => {
    const getInvoiceSystemName = () => {
      const names: { [key: string]: string } = {
        'click': 'Click',
        'payme': 'Payme',
        'uzum': 'Uzum',
        'paynet': 'Paynet',
      };
      return names[selectedPaymentMethod || ''] || 'Payment System';
    };

    return (
      <>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-hide min-h-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <button
                onClick={() => setCurrentStep('PRODUCT_INFO')}
                className="p-1.5 rounded-full hover:bg-surface/50 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-text-primary">
                Pay with {getInvoiceSystemName()}
              </h2>
            </div>

            {/* Payment Options */}
            <div className="flex-1 space-y-4">
              {/* Option 1: Payment via Invoice (Phone Number) */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-1">
                    Payment via Invoice
                  </h3>
                  <p className="text-xs text-text-secondary mb-3">
                    Phone number from which payment will be made.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+998 XX XXX XX XX"
                    value={invoicePhoneNumber}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setInvoicePhoneNumber(cleaned);
                    }}
                    className="w-full bg-surface border-surface text-text-primary h-10"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (invoicePhoneNumber.trim().length >= 9) {
                      handleInvoicePaymentSubmit();
                    }
                  }}
                  disabled={!invoicePhoneNumber.trim() || invoicePhoneNumber.length < 9}
                  className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-surface/30"></div>
                <span className="text-xs text-text-secondary">or</span>
                <div className="flex-1 border-t border-surface/30"></div>
              </div>

              {/* Option 2: Payment without Registration (Card) */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-1">
                    Payment without Registration
                  </h3>
                  <p className="text-xs text-text-secondary mb-3">
                    Your card number and expiration date
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Card Number
                  </label>
                  <Input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={invoiceCardNumber}
                    onChange={(e) => {
                      const formatted = formatNewCardNumber(e.target.value);
                      setInvoiceCardNumber(formatted);
                    }}
                    maxLength={19}
                    className="w-full bg-surface border-surface text-text-primary h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Expiration Date
                  </label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={invoiceCardExpiry}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      setInvoiceCardExpiry(formatted);
                    }}
                    maxLength={5}
                    className="w-full bg-surface border-surface text-text-primary h-10"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (invoiceCardNumber.replace(/\s/g, '').length === 16 && invoiceCardExpiry.length === 5) {
                      handleInvoicePaymentSubmit();
                    }
                  }}
                  disabled={invoiceCardNumber.replace(/\s/g, '').length !== 16 || invoiceCardExpiry.length !== 5}
                  className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Step 3: PAYMENT_CONFIRMATION (Brief loading state)
  const renderPaymentConfirmation = () => {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center px-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Processing Payment...
              </h2>
              <p className="text-sm text-gray-400">
                Please wait while we process your transaction
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Step 4: PAYMENT_SUCCESS (Receipt View)
  const renderPaymentSuccess = () => {
    const transactionId = `#TRX-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const currentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <>
        <div 
          className="flex-1 flex flex-col justify-start min-h-0 overflow-y-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Receipt Container */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-2xl">
              {/* Receipt Header */}
              <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                <div className="text-2xl font-bold text-black mb-2">TWINKLE</div>
                <div className="text-sm text-gray-600">Purchase Receipt</div>
              </div>

              {/* Receipt Details - Monospaced Font */}
              <div className="space-y-2 text-sm font-mono text-black mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-semibold">{currentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-semibold">{transactionId}</span>
                </div>
                
                <div className="border-t border-dashed border-gray-300 my-3"></div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">User:</span>
                  <span className="font-semibold">User Account</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-semibold">#12345</span>
                </div>
                
                <div className="border-t border-dashed border-gray-300 my-3"></div>
                
                <div className="mb-2">
                  <div className="text-gray-600 mb-1">Item:</div>
                  <div className="font-semibold text-base">{video.title}</div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold">{getPaymentMethodName()}</span>
                </div>
                
                <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-base">Total:</span>
                  <span className="font-bold text-2xl text-black">
                    {formattedPrice} {video.currency || 'UZS'}
                  </span>
                </div>
                
                <div className="border-t border-dashed border-gray-300 my-3"></div>
                
                <div className="text-center py-2">
                  <div className="inline-block px-4 py-1 bg-green-100 border-2 border-green-500 rounded">
                    <span className="text-green-700 font-bold text-base">PAID</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-xs text-gray-500 border-t-2 border-dashed border-gray-300 pt-4">
                <p>Retain this check for your records.</p>
                <p className="mt-1">Thank you for your purchase!</p>
              </div>
            </div>
          </div>

          {/* Download PDF Button */}
          <div className="px-6 pb-4 flex-shrink-0">
            <Button
              onClick={handleDownloadPDF}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-3 text-sm font-medium transition-all duration-200 border border-gray-700"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Download PDF Receipt
            </Button>
          </div>

          {/* Back to Video Button */}
          <div className="px-6 pb-4 flex-shrink-0">
            <Button
              onClick={() => {
                setCurrentStep('PRODUCT_INFO');
                setSelectedPaymentMethod(null);
              }}
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg py-3 text-sm font-medium transition-all duration-200"
            >
              Continue Watching
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 mt-auto border-t border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>Secured by Twinkle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Single Stack View (Combined Preview, Info, and Payment)
  const renderSingleStack = () => (
    <>
      <div 
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-hide min-h-0">
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
            {/* Title */}
            <h2 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
              {video.title}
            </h2>

            {/* Price */}
            {isPaid && (
              <div className="mb-2">
                <div className="text-2xl font-bold text-text-primary">
                  {formattedPrice} {video.currency || 'UZS'}
                </div>
              </div>
            )}

            {isSubscription && (
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-text-secondary" />
                <div className="text-2xl font-bold text-text-primary">
                  Channel Membership
                </div>
              </div>
            )}

            {/* Description/Benefits */}
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-text-secondary flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{benefit}</span>
                </div>
              ))}
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
                          setSelectedPaymentMethod(card.id);
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
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep('ADD_CARD');
                        setCardName('');
                        setNewCardNumber('');
                        setNewCardExpiry('');
                        setNewCardCVC('');
                        setSmsCode('');
                        setCardType(null);
                        setIsVerificationVerified(false);
                        setSmsSent(false);
                      }}
                      className="w-full px-2 py-2 rounded-md border border-dashed border-white/20 bg-transparent hover:bg-white/10 transition-colors text-xs text-white hover:text-white/80 font-medium flex items-center justify-center gap-1 h-10"
                    >
                      <span>+</span>
                      <span>Add card</span>
                    </button>
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

          {/* 4. Submission (Sticky Bottom) */}
          <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-surface/50 p-4 mt-auto">
            <Button
              onClick={handlePayNow}
              disabled={!selectedPaymentMethod || paymentProcessing}
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
      </div>
    </>
  );

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#1A1A1A] rounded-xl overflow-hidden purchase-window-container"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {currentStep === 'PRODUCT_INFO' && renderSingleStack()}
      {currentStep === 'ADD_CARD' && renderAddCard()}
      {currentStep === 'INVOICE_PAYMENT' && renderInvoicePayment()}
      {currentStep === 'PAYMENT_CONFIRMATION' && renderPaymentConfirmation()}
      {currentStep === 'PAYMENT_SUCCESS' && renderPaymentSuccess()}
    </div>
  );
}