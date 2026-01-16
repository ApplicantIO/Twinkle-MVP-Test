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

// Format exact date for tooltips (e.g., "Oct 26, 2009")
export function formatExactDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

// Format date for history grouping: "Today", "Yesterday", day names, "19th March", "19th March, 2025"
export function formatHistoryDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const now = new Date();
  
  // Reset time for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateToCompare = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const diffTime = today.getTime() - dateToCompare.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Today
  if (diffDays === 0) {
    return 'Today';
  }
  
  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  // This week (day names)
  if (diffDays < 7 && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[d.getDay()];
  }
  
  // Same year: "19th March"
  if (d.getFullYear() === now.getFullYear()) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const suffix = getOrdinalSuffix(day);
    return `${day}${suffix} ${month}`;
  }
  
  // Different year: "19th March, 2025"
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const suffix = getOrdinalSuffix(day);
  return `${day}${suffix} ${month}, ${year}`;
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Format duration in seconds to "MM:SS" or "HH:MM:SS"
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
