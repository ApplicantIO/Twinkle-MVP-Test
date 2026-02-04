/**
 * Centralized demo/config constants for the viewer side.
 * Use these instead of hard-coding values in pages and components.
 */

/** Video IDs to show first on the home feed (demo priority order). */
export const PRIORITY_VIDEO_IDS_DEMO: string[] = [
  'twinkle_live_video_test',
  'twinkle_paid_content',
  'twinkle_membership_content',
];

/** Minimum donation amount in UZS. */
export const DONATION_MIN_UZS = 5000;

/** Recommended donation amounts in UZS for quick-select buttons. */
export const DONATION_RECOMMENDED_UZS: number[] = [5000, 10000, 20000, 50000];

/** Default saved cards for demo (used when localStorage has none). */
export const DEFAULT_SAVED_CARDS_DEMO: {
  id: string;
  type: string;
  last4: string;
  cardName: string;
  maskedNumber: string;
}[] = [
  { id: '1', type: 'UzCard', last4: '1234', cardName: 'Uy Karta', maskedNumber: '**** 4321' },
  { id: '2', type: 'HUMO', last4: '5678', cardName: 'Ish Karta', maskedNumber: '**** 8765' },
];

/** Mock secondary account for "Switch account" UI in Header (demo only). */
export const MOCK_SECONDARY_ACCOUNT = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
};
