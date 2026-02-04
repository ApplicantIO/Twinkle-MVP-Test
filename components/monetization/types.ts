/**
 * Types used by monetization components (card form, wallet, receipt).
 */

export interface SavedCard {
  id: string;
  type: string;
  last4: string;
  cardName: string;
  maskedNumber: string;
}
