/**
 * Viewer-side formatting and validation helpers.
 * Used by monetization (card/phone inputs) and other viewer UI.
 */

/** Format card number with 4-digit spacing (numeric only). Max 16 digits + spaces = 19 chars. */
export function formatCardNumber(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  const formatted = numericValue.match(/.{1,4}/g)?.join(' ') || numericValue;
  return formatted.slice(0, 19);
}

/** Format expiry as MM/YY. Handles backspace and slash correctly. */
export function formatExpiry(value: string, previousValue?: string): string {
  const cleaned = value.replace(/\D/g, '');
  const previousCleaned = previousValue ? previousValue.replace(/\D/g, '') : '';
  if (previousValue && cleaned.length < previousCleaned.length && value.endsWith('/')) {
    return cleaned;
  }
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
  }
  return cleaned;
}

const PHONE_PREFIX = '+998';

/** Format Uzbek phone: +998 XX YYY YY YY. Prevents deletion of +998. */
export function formatPhoneNumber(value: string, previousValue?: string): string {
  const cleaned = value.replace(/[^\d\s+]/g, '');
  const allDigits = cleaned.replace(/[^\d]/g, '');
  const previousDigits = previousValue ? previousValue.replace(/[^\d]/g, '') : '998';
  if (previousDigits.startsWith('998') && allDigits.length < 3) {
    return PHONE_PREFIX + ' ';
  }
  let digitsAfter998 = '';
  if (allDigits.startsWith('998')) {
    digitsAfter998 = allDigits.slice(3);
  } else if (allDigits.length > 0) {
    digitsAfter998 = allDigits;
  }
  if (digitsAfter998.length > 9) {
    digitsAfter998 = digitsAfter998.slice(0, 9);
  }
  if (digitsAfter998.length === 0) return PHONE_PREFIX + ' ';
  if (digitsAfter998.length <= 2) return `${PHONE_PREFIX} ${digitsAfter998}`;
  if (digitsAfter998.length <= 5) return `${PHONE_PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2)}`;
  if (digitsAfter998.length <= 7) return `${PHONE_PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2, 5)} ${digitsAfter998.slice(5)}`;
  return `${PHONE_PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2, 5)} ${digitsAfter998.slice(5, 7)} ${digitsAfter998.slice(7, 9)}`;
}

/** Detect card type from BIN: local (UzCard/HUMO) vs international (Visa/Mastercard). */
export function detectCardType(cardNumber: string): 'local' | 'international' | null {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return null;
  if (cleaned.startsWith('8600') || cleaned.startsWith('9860') || cleaned.startsWith('5614')) {
    return 'local';
  }
  if (cleaned.startsWith('4')) return 'international';
  if (cleaned.startsWith('5')) return 'international';
  return null;
}

/** Get display name for card type from number and detected type. */
export function getCardTypeName(cardNumber: string, cardType: 'local' | 'international' | null): string {
  if (!cardType) return 'Card';
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cardType === 'local') {
    return cleaned.startsWith('8600') ? 'UzCard' : 'HUMO';
  }
  return cleaned.startsWith('4') ? 'Visa' : 'Mastercard';
}
