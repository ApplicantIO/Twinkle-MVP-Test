'use client';

import { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MoreVertical, X } from 'lucide-react';
import {
  formatCardNumber,
  formatExpiry,
  detectCardType,
  getCardTypeName,
} from '@/lib/viewerUtils';
import type { SavedCard } from './types';

export interface PaymentFormCardProps {
  savedCards: SavedCard[];
  selectedPaymentMethod: string | null;
  isCardFormActive: boolean;
  cardName: string;
  newCardNumber: string;
  newCardExpiry: string;
  newCardCVC: string;
  cardType: 'local' | 'international' | null;
  saveCardEnabled: boolean;
  openCardMenuId: string | null;
  onSelectCard: (cardId: string | null) => void;
  onCardFormActivate: () => void;
  onCardNumberChange: (value: string) => void;
  onCardExpiryChange: (value: string) => void;
  onCardCVCChange: (value: string) => void;
  onCardNameChange: (value: string) => void;
  onSaveCardToggle: () => void;
  onDeleteCard: (cardId: string) => void;
  setOpenCardMenuId: (id: string | null) => void;
}

export function PaymentFormCard({
  savedCards,
  selectedPaymentMethod,
  isCardFormActive,
  cardName,
  newCardNumber,
  newCardExpiry,
  newCardCVC,
  cardType,
  saveCardEnabled,
  openCardMenuId,
  onSelectCard,
  onCardFormActivate,
  onCardNumberChange,
  onCardExpiryChange,
  onCardCVCChange,
  onCardNameChange,
  onSaveCardToggle,
  onDeleteCard,
  setOpenCardMenuId,
}: PaymentFormCardProps) {
  const prevExpiryRef = useRef('');
  const cardMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openCardMenuId, setOpenCardMenuId]);

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    onCardNumberChange(formatted);
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value, prevExpiryRef.current);
    prevExpiryRef.current = formatted;
    onCardExpiryChange(formatted);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-text-secondary mb-2">Pay with Card(s)</h3>
      <div className="space-y-1.5">
        {savedCards.map((card) => (
          <div
            key={card.id}
            ref={(el) => {
              if (el) cardMenuRefs.current[card.id] = el;
            }}
            onClick={() => {
              if (selectedPaymentMethod === card.id) {
                onSelectCard(null);
              } else {
                onSelectCard(card.id);
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
                  <span className="text-xs font-medium text-text-primary leading-tight truncate">
                    {card.cardName}
                  </span>
                  <span className="text-xs text-text-secondary leading-tight truncate">
                    {card.maskedNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-6 rounded bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-sm">
                        <span className="text-[7px] font-bold text-white">CARD</span>
                      </div>
                    )}
                  </div>
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
            {openCardMenuId === card.id && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-[#1A1A1A] border border-surface rounded-lg shadow-lg overflow-hidden min-w-[120px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCard(card.id);
                    setOpenCardMenuId(null);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface/50 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  <span>O&apos;chirish</span>
                </button>
              </div>
            )}
          </div>
        ))}

        <div
          onClick={onCardFormActivate}
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
              onChange={(e) => handleCardNumberChange(e.target.value)}
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
                onFocus={onCardFormActivate}
                onChange={(e) => handleExpiryChange(e.target.value)}
                maxLength={5}
                className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
              />
            </div>
            {cardType === 'international' ? (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">CVV</label>
                <Input
                  type="text"
                  placeholder="000"
                  value={newCardCVC}
                  onFocus={onCardFormActivate}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    onCardCVCChange(cleaned.slice(0, 3));
                  }}
                  maxLength={3}
                  className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
                />
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-2 border-t border-surface/30">
            <span className="text-sm text-gray-300">Save card</span>
            <button
              type="button"
              onClick={() => onSaveCardToggle()}
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

          {saveCardEnabled && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Card Name (Optional)
              </label>
              <Input
                type="text"
                placeholder={getCardTypeName(newCardNumber, cardType)}
                value={cardName}
                onFocus={onCardFormActivate}
                onChange={(e) => onCardNameChange(e.target.value)}
                className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-white focus:ring-0 focus-visible:border-white focus-visible:ring-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
