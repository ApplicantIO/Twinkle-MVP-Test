import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format relative time (e.g., "1sec", "5m", "2h", "3d", "2w", "6mo", "1y")
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Handle future dates (shouldn't happen, but safety check)
  if (diffInSeconds < 0) {
    return 'now';
  }

  // Seconds (sec): If diff < 60 seconds
  if (diffInSeconds < 60) {
    return `${diffInSeconds}sec`;
  }

  // Minutes (m): If 60 seconds <= diff < 60 minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  // Hours (h): If 1 hour <= diff < 24 hours
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  // Days (d): If 24 hours <= diff < 7 days
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  // Weeks (w): If 7 days <= diff < 30 days
  const diffInWeeks = Math.floor(diffInSeconds / 604800);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  // Months (mo): If 30 days <= diff < 12 months (approximate)
  const diffInMonths = Math.floor(diffInSeconds / 2592000);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  // Years (y): If diff >= 12 months
  const diffInYears = Math.floor(diffInSeconds / 31536000);
  return `${diffInYears}y`;
}

