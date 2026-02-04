/**
 * Comment type used on the watch page (comments section and donation messages).
 */
export interface WatchComment {
  id: string;
  userId: string;
  userName: string;
  username: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
  likes: number;
  dislikes: number;
  isDonated: boolean;
  donationAmount?: number;
  isHighlyRated: boolean;
  replies?: WatchComment[];
  deleted?: boolean;
}
