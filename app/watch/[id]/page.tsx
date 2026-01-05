'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Video, Playlist } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, ThumbsUp, ThumbsDown, Share2, Bookmark, MoreVertical, Send, DollarSign, Copy, Check, X, Flag, ArrowLeft, CheckCircle2, Bell, BellOff, Reply, LayoutList, LayoutGrid, Minimize2, MessageSquare, Play, Trash2 } from 'lucide-react';
import { MonetizationCTASection } from '@/components/MonetizationCTASection';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMiniplayer } from '@/contexts/MiniplayerContext';
import { useModal } from '@/contexts/ModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime, formatExactDate } from '@/lib/utils';
import VideoDescription from '@/components/VideoDescription';
import { getAllPlaylists } from '@/data/mockData';
import { updateWatchHistory, savePlaylistProgress } from '@/lib/watchHistory';

interface Comment {
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
  replies?: Comment[];
  deleted?: boolean; // For soft delete (donations)
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { setIsCollapsed } = useSidebar();
  const { setCurrentWatchVideo, setIsMiniplayerActive, isMiniplayerActive } = useMiniplayer();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoPlayerProgressRef = useRef<number>(0);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'donated'>('public');
  const [recommendedTab, setRecommendedTab] = useState<'recommendations' | 'playlist' | 'creator' | 'topic' | string>('recommendations');
  const [isCardViewActive, setIsCardViewActive] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [playlistActiveTab, setPlaylistActiveTab] = useState<string>('all');
  const [columns, setColumns] = useState(1);
  
  // Context detection from URL
  const searchParams = useSearchParams();
  const listContext = searchParams.get('listContext') === 'true';
  const urlPlaylistId = searchParams.get('playlistId');
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [openMenuVideoId, setOpenMenuVideoId] = useState<string | null>(null);
  const imageRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const playlistScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activePlaylistVideoRef = useRef<HTMLDivElement | null>(null);
  const lastPlaylistScrollTimeRef = useRef<number>(0);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReactions, setCommentReactions] = useState<Record<string, 'NONE' | 'LIKE' | 'DISLIKE'>>({});
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; commentId: string; isDonation: boolean }>({ isOpen: false, commentId: '', isDonation: false });
  const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [isDonationViewActive, setIsDonationViewActive] = useState(false);
  const [donationStep, setDonationStep] = useState<'DONATION' | 'SMS_VERIFICATION' | 'WALLET_INVOICE_REQUEST' | 'WALLET_WAITING'>('DONATION');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [invoicePhoneNumber, setInvoicePhoneNumber] = useState('+998 ');
  const [invoiceCardNumber, setInvoiceCardNumber] = useState('');
  const [invoiceCardExpiry, setInvoiceCardExpiry] = useState('');
  const [activeInvoiceIdentifier, setActiveInvoiceIdentifier] = useState<'phone' | 'card' | null>(null);
  const [invoicePollingInterval, setInvoicePollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<'pending' | 'paid' | 'failed' | null>(null);
  const prevInvoiceCardExpiryRef = useRef<string>('');
  const prevNewCardExpiryRef = useRef<string>('');
  const [isSending, setIsSending] = useState(false);
  const [countdownTime, setCountdownTime] = useState(0);
  const MIN_DONATION_AMOUNT = 5000;
  const recommendedAmounts = [5000, 10000, 20000, 50000];
  const [isAnonymousDonation, setIsAnonymousDonation] = useState(false);
  const [paymentCategory, setPaymentCategory] = useState<'card' | 'ewallet'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isCardFormActive, setIsCardFormActive] = useState(false);
  const [saveCardEnabled, setSaveCardEnabled] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState([
    { id: '1', type: 'UzCard', last4: '1234', cardName: 'Uy Karta', maskedNumber: '**** 4321' },
    { id: '2', type: 'HUMO', last4: '5678', cardName: 'Ish Karta', maskedNumber: '**** 8765' },
  ]);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [addCardStep, setAddCardStep] = useState<'name' | 'details' | 'verification'>('name');
  const [cardName, setCardName] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVC, setNewCardCVC] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [cardType, setCardType] = useState<'local' | 'international' | null>(null);
  const [isVerificationVerified, setIsVerificationVerified] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [timestampUpdateKey, setTimestampUpdateKey] = useState(0); // For real-time timestamp updates
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const cardMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openCardMenuId]);
  const MAX_COMMENT_LENGTH = 200;
  const [reportCommentState, setReportCommentState] = useState<'NONE' | 'REASON_SELECT' | 'WRITE_DETAILS' | 'CONFIRMATION'>('NONE');
  const [commentReportReason, setCommentReportReason] = useState<string>('');
  const [commentReportDetails, setCommentReportDetails] = useState('');
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationState, setNotificationState] = useState<'NONE' | 'ALL' | 'PERSONALIZED'>('ALL');
  const [isAnimating, setIsAnimating] = useState(false);
  // Generate subscriber count once on mount (not on every render)
  const [subscribersCount] = useState(() => Math.floor(Math.random() * 100000));
  const [isSaved, setIsSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const [reportStep, setReportStep] = useState<'CLOSED' | 'SELECT_REASON' | 'WRITE_DETAILS' | 'SUBMITTED_CONFIRMATION'>('CLOSED');
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState('');
  const reportModalRef = useRef<HTMLDivElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const notificationsModalRef = useRef<HTMLDivElement>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false); // Mobile comments overlay state
  // Load purchase state from localStorage on mount
  const [hasPurchasedVideoLocal, setHasPurchasedVideoLocal] = useState(() => {
    if (typeof window !== 'undefined' && params.id) {
      const purchasedVideos = JSON.parse(localStorage.getItem('purchasedVideos') || '[]');
      return purchasedVideos.includes(params.id);
    }
    return false;
  });

  // Check if playlist is purchased
  const hasPurchasedPlaylist = useCallback((playlistId: string): boolean => {
    if (typeof window !== 'undefined') {
      const purchasedPlaylists = JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]');
      return purchasedPlaylists.includes(playlistId);
    }
    return false;
  }, []);
  const commentsSectionRef = useRef<HTMLDivElement>(null); // Ref for desktop comments section
  const mobileCommentsSectionRef = useRef<HTMLDivElement>(null); // Ref for mobile comments section

  // Mock access state functions (matching VideoPlayer logic)
  const hasPurchasedVideo = useCallback((videoId: string): boolean => {
    // Use local purchase state if available, otherwise check API (TODO)
    return hasPurchasedVideoLocal;
  }, [hasPurchasedVideoLocal]);

  const isChannelSubscriber = useCallback((channelId: string): boolean => {
    // TODO: Replace with actual subscription check from API
    return false;
  }, []);

  // Determine if user has full access to the video
  const hasFullAccess = useMemo(() => {
    if (!video) return true; // No video data, allow access
    
    // Check if video belongs to a paid playlist
    if (currentPlaylist && currentPlaylist.price) {
      // Video belongs to a paid playlist - check playlist purchase status
      return hasPurchasedPlaylist(currentPlaylist.id);
    }
    
    const videoType = video.type || 'free';
    
    // Free videos always have access
    if (videoType === 'free') {
      return true;
    }
    
    // Paid content: check if user has purchased individual video
    if (videoType === 'paid') {
      return hasPurchasedVideo(video.id);
    }
    
    // Subscription content: check if user is subscribed to channel
    if (videoType === 'subscription') {
      return isChannelSubscriber(video.userId);
    }
    
    // Default: allow access
    return true;
  }, [video, hasPurchasedVideo, isChannelSubscriber, currentPlaylist, hasPurchasedPlaylist]);

  // Check if we're in playlist session mode
  const isPlaylistSession = useMemo(() => {
    return urlPlaylistId && listContext && currentPlaylist;
  }, [urlPlaylistId, listContext, currentPlaylist]);

  // Handle video switch within playlist session (without page reload)
  const handleVideoSwitch = useCallback(async (newVideoId: string) => {
    if (!isPlaylistSession || !currentPlaylist) {
      // Not in playlist session - use normal navigation
      router.push(`/watch/${newVideoId}${urlPlaylistId ? `?playlistId=${urlPlaylistId}&listContext=true` : ''}`);
      return;
    }

    // Prevent switching to the same video
    if (video?.id === newVideoId) {
      return;
    }

    try {
      // Fetch new video data
      const response = await fetch(`/api/videos/${newVideoId}`);
      if (!response.ok) {
        console.error('Failed to fetch video:', response.status);
        return;
      }

      const data = await response.json();
      if (!data.video) {
        console.error('Video not found in response');
        return;
      }

      const newVideo = data.video;

      // Determine correct video URL based on access
      const videoType = newVideo.type || 'free';
      let videoUrlToUse = newVideo.videoUrl;

      // Check if video belongs to a paid playlist
      let hasPlaylistAccess = true;
      if (currentPlaylist.price) {
        const purchasedPlaylists = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]')
          : [];
        hasPlaylistAccess = purchasedPlaylists.includes(currentPlaylist.id);

        if (!hasPlaylistAccess) {
          videoUrlToUse = newVideo.teaserVideoUrl || newVideo.videoUrl;
        } else {
          videoUrlToUse = newVideo.fullVideoUrl || newVideo.videoUrl;
        }
      } else {
        // Individual video purchase logic
        const purchasedVideos = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('purchasedVideos') || '[]')
          : [];
        const hasPurchased = purchasedVideos.includes(newVideo.id);

        if (videoType === 'paid' || videoType === 'subscription') {
          if (hasPurchased || (videoType === 'subscription' && isChannelSubscriber(newVideo.userId))) {
            videoUrlToUse = newVideo.fullVideoUrl || newVideo.videoUrl;
          } else {
            videoUrlToUse = newVideo.teaserVideoUrl || newVideo.videoUrl;
          }
        }
      }

      // Update video state (player will update via context)
      setVideo({
        ...newVideo,
        videoUrl: videoUrlToUse
      });

      // Update miniplayer context (this updates the centralized player)
      setCurrentWatchVideo({
        ...newVideo,
        videoUrl: videoUrlToUse
      });

      // Reset progress
      setVideoProgress(0);
      videoPlayerProgressRef.current = 0;

      // Save playlist progress
      if (urlPlaylistId) {
        savePlaylistProgress(urlPlaylistId, newVideo.id, 0);
      }

      // Update URL without page reload using router.replace (preserves browser history)
      const newUrl = `/watch/${newVideoId}?playlistId=${urlPlaylistId}&listContext=true`;
      router.replace(newUrl, { scroll: false });

      // Keep playlist tab active (state is preserved)
      setRecommendedTab('playlist');
    } catch (error) {
      console.error('Error switching video:', error);
    }
  }, [isPlaylistSession, currentPlaylist, urlPlaylistId, router, setCurrentWatchVideo, isChannelSubscriber, video?.id, savePlaylistProgress]);

  // Automatically collapse sidebar when entering watch page
  useEffect(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  // Auto-scroll playlist container to show active video at the top (playlist session mode only)
  useEffect(() => {
    // Only scroll in playlist session mode when playlist tab is active
    // CRITICAL: This logic ONLY applies to playlist sessions, not standalone videos
    if (!isPlaylistSession || recommendedTab !== 'playlist' || !video?.id || typeof window === 'undefined') {
      return;
    }

    // Ensure the playlist scroll container exists and is mounted
    if (!playlistScrollContainerRef.current) {
      return;
    }

    // Check if user recently scrolled manually (within last 500ms)
    const timeSinceUserScroll = Date.now() - lastPlaylistScrollTimeRef.current;
    if (timeSinceUserScroll < 500) {
      return; // Skip auto-scroll if user recently scrolled
    }

    // Wait for DOM to be ready using requestAnimationFrame (double RAF for layout stability)
    let animationFrameId: number | null = null;
    
    const firstFrame = requestAnimationFrame(() => {
      animationFrameId = requestAnimationFrame(() => {
        // Double-check container and active item refs exist
        if (!activePlaylistVideoRef.current || !playlistScrollContainerRef.current) {
          return;
        }

        const scrollContainer = playlistScrollContainerRef.current;
        if (!scrollContainer) {
          return;
        }

        // CRITICAL: Only scroll the playlist container, NEVER the page/window
        // Get bounding rectangles relative to the scroll container
        const activeItemRect = activePlaylistVideoRef.current.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();

        // Check if item is already at or near the top of the container (within 5px tolerance)
        const distanceFromTop = activeItemRect.top - containerRect.top;
        if (Math.abs(distanceFromTop) < 5) {
          return; // Already positioned correctly
        }

        // Calculate scroll offset needed to bring item to top of the container
        const currentScrollTop = scrollContainer.scrollTop;
        const scrollOffset = currentScrollTop + distanceFromTop;

        // Handle edge cases: ensure we don't scroll beyond bounds
        const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const clampedScrollTop = Math.max(0, Math.min(scrollOffset, maxScrollTop));

        // Perform smooth scroll ONLY on the playlist container (not window/page)
        scrollContainer.scrollTo({
          top: clampedScrollTop,
          behavior: 'smooth'
        });
      });
    });

    return () => {
      if (firstFrame) {
        cancelAnimationFrame(firstFrame);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [video?.id, isPlaylistSession, recommendedTab]);

  // Track user manual scrolling in playlist container to prevent auto-scroll interference
  // ONLY active in playlist session mode
  useEffect(() => {
    if (!isPlaylistSession || recommendedTab !== 'playlist' || typeof window === 'undefined') {
      return;
    }

    const handleUserScroll = () => {
      lastPlaylistScrollTimeRef.current = Date.now();
    };

    // Use requestAnimationFrame to ensure DOM is ready
    let scrollContainer: HTMLDivElement | null = null;
    const frameId = requestAnimationFrame(() => {
      scrollContainer = playlistScrollContainerRef.current;
      
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleUserScroll, { passive: true });
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleUserScroll);
      }
    };
  }, [isPlaylistSession, recommendedTab]);

  // Update video URL when purchase state changes
  useEffect(() => {
    if (video && hasPurchasedVideoLocal) {
      const videoType = video.type || 'free';
      if (videoType === 'paid' || videoType === 'subscription') {
        const fullVideoUrl = video.fullVideoUrl || video.videoUrl;
        setCurrentWatchVideo({
          ...video,
          videoUrl: fullVideoUrl
        });
      }
    }
  }, [hasPurchasedVideoLocal, video]);

  // Save playlist progress when video starts playing in playlist context
  useEffect(() => {
    if (!video || !urlPlaylistId) return;
    
    // Save playlist progress when video is loaded/started
    // This ensures we track the last accessed video in the playlist
    savePlaylistProgress(urlPlaylistId, video.id, videoPlayerProgressRef.current || videoProgress || 0);
  }, [video?.id, urlPlaylistId]);

  // Track watch history when video or progress changes
  useEffect(() => {
    if (!video || !hasFullAccess) return;
    
    // Update watch history periodically (every 5 seconds)
    const interval = setInterval(() => {
      const progress = videoPlayerProgressRef.current || videoProgress;
      if (progress > 0 && video) {
        updateWatchHistory(
          video.id,
          progress,
          urlPlaylistId || undefined,
          video.duration
        );
        // Also update playlist progress with current timestamp
        if (urlPlaylistId) {
          savePlaylistProgress(urlPlaylistId, video.id, progress);
        }
      }
    }, 5000);
    
    // Also update on unmount
    return () => {
      const progress = videoPlayerProgressRef.current || videoProgress;
      if (progress > 0 && video) {
        updateWatchHistory(
          video.id,
          progress,
          urlPlaylistId || undefined,
          video.duration
        );
        // Save playlist progress on unmount as well
        if (urlPlaylistId) {
          savePlaylistProgress(urlPlaylistId, video.id, progress);
        }
      }
      clearInterval(interval);
    };
  }, [video?.id, videoProgress, hasFullAccess, urlPlaylistId, video?.duration]);

  // Sample comments for demonstration
  useEffect(() => {
    setComments([
      // 4 Public Comments
      {
        id: '1',
        userId: 'user1',
        userName: 'John Doe',
        username: '@john_doe',
        text: 'This video is absolutely incredible! I\'ve been waiting for content like this for months. The way you explained everything step by step made it so easy to understand. I especially loved the part where you demonstrated the practical applications. This has completely changed my perspective on the topic. Thank you so much for sharing your knowledge with us!',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        likes: 247,
        dislikes: 3,
        isDonated: false,
        isHighlyRated: true,
        replies: [
          {
            id: '1-1',
            userId: 'user2',
            userName: 'Sarah Martinez',
            username: '@sarah_martinez',
            text: 'I completely agree! The practical examples were so helpful.',
            timestamp: new Date(Date.now() - 1500000),
            likes: 12,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '1-1-1',
                userId: 'user3',
                userName: 'Michael Chen',
                username: '@michael_chen',
                text: '@sarah_martinez Exactly! Those examples made everything click for me too.',
                timestamp: new Date(Date.now() - 1400000),
                likes: 5,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
          {
            id: '1-2',
            userId: 'user4',
            userName: 'Emily Rodriguez',
            username: '@emily_rodriguez',
            text: 'Same here! This channel is amazing.',
            timestamp: new Date(Date.now() - 1200000),
            likes: 8,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '1-3',
            userId: 'user5',
            userName: 'David Kim',
            username: '@david_kim',
            text: 'Couldn\'t agree more. The step-by-step approach is perfect.',
            timestamp: new Date(Date.now() - 1000000),
            likes: 6,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
        ],
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Sarah Martinez',
        username: '@sarah_martinez',
        text: 'Wow, this is exactly what I needed! I\'ve been struggling with this concept for weeks and your explanation finally made it click. The examples you provided were perfect and really helped me visualize everything. I appreciate how you took the time to break down each part in detail.',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        likes: 189,
        dislikes: 1,
        isDonated: false,
        isHighlyRated: false,
        replies: [
          {
            id: '2-1',
            userId: 'user6',
            userName: 'Jessica Thompson',
            username: '@jessica_thompson',
            text: 'The visualization examples were game-changing for me!',
            timestamp: new Date(Date.now() - 3300000),
            likes: 9,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '2-1-1',
                userId: 'user2',
                userName: 'Sarah Martinez',
                username: '@sarah_martinez',
                text: '@jessica_thompson Right? I\'ve been trying to explain this to my team using those same examples.',
                timestamp: new Date(Date.now() - 3200000),
                likes: 4,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
          {
            id: '2-2',
            userId: 'user7',
            userName: 'Robert Wilson',
            username: '@robert_wilson',
            text: 'The breakdown was incredibly thorough. Great video!',
            timestamp: new Date(Date.now() - 3000000),
            likes: 7,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
        ],
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Michael Chen',
        username: '@michael_chen',
        text: 'Honestly, I wasn\'t expecting much when I clicked on this video, but I was completely blown away! The production quality is top-notch and the information is presented in such an engaging way. You have a real talent for making complex topics accessible.',
        timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
        likes: 156,
        dislikes: 2,
        isDonated: false,
        isHighlyRated: true,
        replies: [
          {
            id: '3-1',
            userId: 'user8',
            userName: 'Amanda Lee',
            username: '@amanda_lee',
            text: 'The production quality really stands out. So professional!',
            timestamp: new Date(Date.now() - 5100000),
            likes: 11,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '3-2',
            userId: 'user9',
            userName: 'James Anderson',
            username: '@james_anderson',
            text: '@michael_chen I had the same reaction! Subscribed immediately.',
            timestamp: new Date(Date.now() - 4800000),
            likes: 8,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '3-2-1',
                userId: 'user3',
                userName: 'Michael Chen',
                username: '@michael_chen',
                text: '@james_anderson Welcome to the community! Glad you enjoyed it.',
                timestamp: new Date(Date.now() - 4700000),
                likes: 3,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
          {
            id: '3-3',
            userId: 'user10',
            userName: 'Lisa Park',
            username: '@lisa_park',
            text: 'Complex topics made simple - that\'s the mark of great teaching.',
            timestamp: new Date(Date.now() - 4500000),
            likes: 6,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
        ],
      },
      {
        id: '4',
        userId: 'user4',
        userName: 'Emily Rodriguez',
        username: '@emily_rodriguez',
        text: 'I\'ve watched this three times already and I\'m still learning something new each time. The way you structure your content is brilliant - it flows so naturally from one point to the next. Your passion for the subject really shines through and makes the video so much more enjoyable to watch.',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        likes: 312,
        dislikes: 4,
        isDonated: false,
        isHighlyRated: true,
        replies: [
          {
            id: '4-1',
            userId: 'user5',
            userName: 'David Kim',
            username: '@david_kim',
            text: 'The structure really is perfect. I love how each section builds on the previous one.',
            timestamp: new Date(Date.now() - 6800000),
            likes: 15,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '4-1-1',
                userId: 'user4',
                userName: 'Emily Rodriguez',
                username: '@emily_rodriguez',
                text: '@david_kim That\'s exactly what makes it so effective!',
                timestamp: new Date(Date.now() - 6700000),
                likes: 3,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
          {
            id: '4-2',
            userId: 'user1',
            userName: 'John Doe',
            username: '@john_doe',
            text: 'Three times? I\'m on my second watch and already planning a third!',
            timestamp: new Date(Date.now() - 6500000),
            likes: 10,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
        ],
      },
      // 4 Donated Comments
      {
        id: '11',
        userId: 'user11',
        userName: 'Alexandra Brown',
        username: '@alexandra_brown',
        text: 'This video has been incredibly helpful for my project! I wanted to show my appreciation for all the hard work you put into creating such valuable content. Your explanations are always so clear and well-structured. I\'ve learned so much from your channel and I wanted to give back a little. Keep creating amazing content - you\'re making a real difference in people\'s lives. Thank you for everything you do!',
        timestamp: new Date(Date.now() - 19800000), // 5.5 hours ago
        likes: 89,
        dislikes: 0,
        isDonated: true,
        donationAmount: 10000,
        isHighlyRated: false,
        replies: [
          {
            id: '11-1',
            userId: 'user12',
            userName: 'Christopher Taylor',
            username: '@christopher_taylor',
            text: 'Your generosity is inspiring! This content truly deserves support.',
            timestamp: new Date(Date.now() - 19500000),
            likes: 7,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '11-2',
            userId: 'user13',
            userName: 'Maria Garcia',
            username: '@maria_garcia',
            text: '@alexandra_brown I completely agree. This channel has been a game-changer for me too!',
            timestamp: new Date(Date.now() - 19200000),
            likes: 5,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '11-2-1',
                userId: 'user11',
                userName: 'Alexandra Brown',
                username: '@alexandra_brown',
                text: '@maria_garcia So glad to hear that! The community here is amazing.',
                timestamp: new Date(Date.now() - 19000000),
                likes: 2,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
        ],
      },
      {
        id: '12',
        userId: 'user12',
        userName: 'Christopher Taylor',
        username: '@christopher_taylor',
        text: 'I\'ve been following your channel for months and this is by far one of your best videos yet! The quality of your content keeps getting better and better. I wanted to send a small donation to support your work because creators like you deserve recognition. Your videos have helped me so much in my career, and I wanted to express my gratitude. Please keep doing what you\'re doing - you\'re amazing!',
        timestamp: new Date(Date.now() - 21600000), // 6 hours ago
        likes: 145,
        dislikes: 1,
        isDonated: true,
        donationAmount: 25000,
        isHighlyRated: true,
        replies: [
          {
            id: '12-1',
            userId: 'user14',
            userName: 'Daniel White',
            username: '@daniel_white',
            text: 'Well said! The quality improvement is noticeable in every video.',
            timestamp: new Date(Date.now() - 21300000),
            likes: 9,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '12-2',
            userId: 'user15',
            userName: 'Sophie Martin',
            username: '@sophie_martin',
            text: 'The career impact is real. Thank you for supporting great content!',
            timestamp: new Date(Date.now() - 21000000),
            likes: 6,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '12-3',
            userId: 'user16',
            userName: 'Ryan Johnson',
            username: '@ryan_johnson',
            text: '@christopher_taylor Couldn\'t agree more. This channel is a gem!',
            timestamp: new Date(Date.now() - 20700000),
            likes: 4,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '12-3-1',
                userId: 'user12',
                userName: 'Christopher Taylor',
                username: '@christopher_taylor',
                text: '@ryan_johnson Absolutely! The value is unmatched.',
                timestamp: new Date(Date.now() - 20500000),
                likes: 2,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
        ],
      },
      {
        id: '13',
        userId: 'user13',
        userName: 'Maria Garcia',
        username: '@maria_garcia',
        text: 'Thank you so much for this incredible video! It\'s exactly what I needed and more. Your dedication to creating quality educational content doesn\'t go unnoticed. I wanted to contribute a small amount to support your channel because I believe in what you\'re doing. Your videos have been a game-changer for me, and I hope this small donation helps you continue creating amazing content. Much love and appreciation!',
        timestamp: new Date(Date.now() - 23400000), // 6.5 hours ago
        likes: 67,
        dislikes: 0,
        isDonated: true,
        donationAmount: 15000,
        isHighlyRated: false,
        replies: [
          {
            id: '13-1',
            userId: 'user17',
            userName: 'Olivia Davis',
            username: '@olivia_davis',
            text: 'Your support means so much to creators. Thank you for giving back!',
            timestamp: new Date(Date.now() - 23100000),
            likes: 8,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '13-2',
            userId: 'user18',
            userName: 'Nathan Clark',
            username: '@nathan_clark',
            text: '@maria_garcia The educational value is incredible. Well deserved support!',
            timestamp: new Date(Date.now() - 22800000),
            likes: 5,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
        ],
      },
      {
        id: '14',
        userId: 'user14',
        userName: 'Daniel White',
        username: '@daniel_white',
        text: 'This video is absolutely phenomenal! I\'ve watched it multiple times and I\'m still finding new insights. Your ability to explain complex topics in such an accessible way is truly remarkable. I wanted to send a donation to show my appreciation for all the value you\'ve provided. Your content has helped me tremendously, and I wanted to give back. Keep up the excellent work - you\'re an inspiration!',
        timestamp: new Date(Date.now() - 25200000), // 7 hours ago
        likes: 203,
        dislikes: 2,
        isDonated: true,
        donationAmount: 50000,
        isHighlyRated: true,
        replies: [
          {
            id: '14-1',
            userId: 'user19',
            userName: 'Emma Wilson',
            username: '@emma_wilson',
            text: 'Your donation shows true appreciation. This content deserves all the support!',
            timestamp: new Date(Date.now() - 24900000),
            likes: 10,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
          },
          {
            id: '14-2',
            userId: 'user20',
            userName: 'Kevin Moore',
            username: '@kevin_moore',
            text: '@daniel_white The insights keep coming with each rewatch. Amazing content!',
            timestamp: new Date(Date.now() - 24600000),
            likes: 7,
            dislikes: 0,
            isDonated: false,
            isHighlyRated: false,
            replies: [
              {
                id: '14-2-1',
                userId: 'user14',
                userName: 'Daniel White',
                username: '@daniel_white',
                text: '@kevin_moore Exactly! Every watch reveals something new. That\'s quality content.',
                timestamp: new Date(Date.now() - 24400000),
                likes: 3,
                dislikes: 0,
                isDonated: false,
                isHighlyRated: false,
              },
            ],
          },
        ],
      },
    ]);
    setLikes(Math.floor(Math.random() * 10000));
    setDislikes(Math.floor(Math.random() * 500));
  }, []);

  useEffect(() => {
    async function loadVideo() {
      if (!params.id || typeof params.id !== 'string') {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/videos/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.video) {
          setVideo(data.video);
          
          // Check if video belongs to a playlist
          const allPlaylists = getAllPlaylists();
          
          // Priority 1: Use playlistId from URL if provided
          let playlistContainingVideo: Playlist | undefined;
          if (urlPlaylistId) {
            playlistContainingVideo = allPlaylists.find(p => p.id === urlPlaylistId);
          }
          
          // Priority 2: Auto-detect if not in URL
          if (!playlistContainingVideo) {
            playlistContainingVideo = allPlaylists.find(p => 
              p.allVideoIds.includes(data.video.id)
            );
          }
          
          if (playlistContainingVideo) {
            setCurrentPlaylist(playlistContainingVideo);
            
            // Scenario A: urlPlaylistId exists - Show only playlist tabs, no standard recommendations
            if (urlPlaylistId) {
              setRecommendedTab('playlist');
              setPlaylistActiveTab('all');
            } else {
              // Scenario B: Standalone mode - Keep standard tabs, add "From Playlist" tab
              setRecommendedTab('recommendations');
            }
          }
          
          // Determine correct video URL based on access
          const videoType = data.video.type || 'free';
          let videoUrlToUse = data.video.videoUrl;
          
          // Check if video belongs to a paid playlist
          let hasPlaylistAccess = true;
          if (playlistContainingVideo && playlistContainingVideo.price) {
            // Video belongs to paid playlist - check playlist purchase
            const purchasedPlaylists = typeof window !== 'undefined' 
              ? JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]')
              : [];
            hasPlaylistAccess = purchasedPlaylists.includes(playlistContainingVideo.id);
            
            if (!hasPlaylistAccess) {
              // No playlist access - use teaser
              videoUrlToUse = data.video.teaserVideoUrl || data.video.videoUrl;
            } else {
              // Has playlist access - use full video
              videoUrlToUse = data.video.fullVideoUrl || data.video.videoUrl;
            }
          } else {
            // Video doesn't belong to paid playlist - use individual video purchase logic
            const purchasedVideos = typeof window !== 'undefined' 
              ? JSON.parse(localStorage.getItem('purchasedVideos') || '[]')
              : [];
            const hasPurchased = purchasedVideos.includes(data.video.id);
            
            // For paid/subscription content, use teaser if no access, full video if access granted
            if (videoType === 'paid' || videoType === 'subscription') {
              if (hasPurchased || hasPurchasedVideoLocal || (videoType === 'subscription' && isChannelSubscriber(data.video.userId))) {
                // User has access - use full video
                videoUrlToUse = data.video.fullVideoUrl || data.video.videoUrl;
                // Update local state if not already set
                if (!hasPurchasedVideoLocal && hasPurchased) {
                  setHasPurchasedVideoLocal(true);
                }
              } else {
                // No access - use teaser
                videoUrlToUse = data.video.teaserVideoUrl || data.video.videoUrl;
              }
            }
          }
          
          // Store video in context for centralized player with correct URL
          setCurrentWatchVideo({
            ...data.video,
            videoUrl: videoUrlToUse
          });
          // Clear miniplayer state when loading a new video on watch page
          setIsMiniplayerActive(false);
          
            // Load related videos
          const relatedResponse = await fetch('/api/videos?limit=20');
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedVideos(relatedData.videos.filter((v: Video) => v.id !== params.id));
          }
        } else {
            console.error('Video not found in response');
          }
        } else {
          // Don't redirect immediately - show error or try sample videos
          console.error('Failed to fetch video:', response.status);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
    
    // Cleanup: Clear video from context when component unmounts
    return () => {
      setCurrentWatchVideo(null);
    };
  }, [params.id, setCurrentWatchVideo, setIsMiniplayerActive]);

  // Calculate optimal number of columns based on viewport width (for grid layout)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) return 1;
      if (width < 768) return 2;
      if (width < 1024) return 2;
      if (width < 1920) return 3; // Laptops: 3 columns (smaller cards)
      return 4; // Large monitors and above: Maximum 4 columns
    };

    const updateColumns = () => {
      setColumns(calculateColumns());
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    window.addEventListener('orientationchange', updateColumns);

    return () => {
      window.removeEventListener('resize', updateColumns);
      window.removeEventListener('orientationchange', updateColumns);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuVideoId) {
        const menuElement = menuRefs.current[openMenuVideoId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          // Also check if click is on the button itself
          const buttonElement = (event.target as HTMLElement).closest('button[aria-label="More options"]');
          if (!buttonElement) {
            setOpenMenuVideoId(null);
          }
        }
      }
    };

    if (openMenuVideoId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuVideoId]);


  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
      if (isDisliked) {
        setDislikes(dislikes - 1);
        setIsDisliked(false);
      }
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setDislikes(dislikes - 1);
      setIsDisliked(false);
    } else {
      setDislikes(dislikes + 1);
      setIsDisliked(true);
      if (isLiked) {
        setLikes(likes - 1);
        setIsLiked(false);
      }
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleCommentLike = (commentId: string) => {
    const currentReaction = commentReactions[commentId] || 'NONE';
    let newReaction: 'NONE' | 'LIKE' | 'DISLIKE' = 'NONE';
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (currentReaction === 'NONE') {
      newReaction = 'LIKE';
      likeDelta = 1;
    } else if (currentReaction === 'LIKE') {
      newReaction = 'NONE';
      likeDelta = -1;
    } else if (currentReaction === 'DISLIKE') {
      newReaction = 'LIKE';
      likeDelta = 1;
      dislikeDelta = -1;
    }

    // Update reaction state
    setCommentReactions(prev => ({ ...prev, [commentId]: newReaction }));

    // Update comment counts (recursively search in replies)
    const updateCommentLikes = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: Math.max(0, comment.likes + likeDelta),
            dislikes: Math.max(0, (comment.dislikes || 0) + dislikeDelta),
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateCommentLikes(comment.replies),
          };
        }
        return comment;
      });
    };

    setComments(prevComments => updateCommentLikes(prevComments));
  };

  const handleCommentDislike = (commentId: string) => {
    const currentReaction = commentReactions[commentId] || 'NONE';
    let newReaction: 'NONE' | 'LIKE' | 'DISLIKE' = 'NONE';
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (currentReaction === 'NONE') {
      newReaction = 'DISLIKE';
      dislikeDelta = 1;
    } else if (currentReaction === 'DISLIKE') {
      newReaction = 'NONE';
      dislikeDelta = -1;
    } else if (currentReaction === 'LIKE') {
      newReaction = 'DISLIKE';
      likeDelta = -1;
      dislikeDelta = 1;
    }

    // Update reaction state
    setCommentReactions(prev => ({ ...prev, [commentId]: newReaction }));

    // Update comment counts (recursively search in replies)
    const updateCommentDislikes = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: Math.max(0, comment.likes + likeDelta),
            dislikes: Math.max(0, (comment.dislikes || 0) + dislikeDelta),
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateCommentDislikes(comment.replies),
          };
        }
        return comment;
      });
    };

    setComments(prevComments => updateCommentDislikes(prevComments));
  };

  // Helper function to find comment by ID (recursive)
  const findCommentById = (comments: Comment[], id: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === id) {
        return comment;
      }
      if (comment.replies) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleReplyClick = (commentId: string, username: string) => {
    // Find the comment object
    const comment = findCommentById(comments, commentId);
    if (comment) {
    setReplyingToId(commentId);
      setReplyingToComment(comment);
      // Automatically insert @username into the input field
      setCommentText(`${username} `);
      // Focus the textarea field
    setTimeout(() => {
      commentInputRef.current?.focus();
        // Auto-resize after focusing
        if (commentInputRef.current) {
          commentInputRef.current.style.height = 'auto';
          commentInputRef.current.style.height = `${Math.min(commentInputRef.current.scrollHeight, 120)}px`;
        }
    }, 0);
    }
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    // Preserve input focus if user was typing
    const wasFocused = document.activeElement === commentInputRef.current;
    
    setReplyingToId(null);
    setReplyingToComment(null);
    setCommentText('');
    // Reset textarea height
    if (commentInputRef.current) {
      commentInputRef.current.style.height = 'auto';
      // Restore focus if it was previously focused
      if (wasFocused) {
        setTimeout(() => {
          commentInputRef.current?.focus();
        }, 0);
      }
    }
  };

  // Handle delete request
  const handleDeleteRequest = (commentId: string, isDonation: boolean) => {
    const comment = findCommentById(comments, commentId);
    if (!comment) {
      console.error('Comment not found for deletion');
      return;
    }

    // Get current user ID (authenticated or guest)
    const currentUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('twinkle_guest_id') : null);
    
    if (!currentUserId || currentUserId !== comment.userId) {
      console.error('Unauthorized: User cannot delete this comment', { 
        currentUserId, 
        commentUserId: comment.userId,
        userAuthenticated: !!user?.id 
      });
      return;
    }

    // If it's a donation, show confirmation modal
    if (isDonation) {
      setDeleteConfirmModal({ isOpen: true, commentId, isDonation: true });
      setReportingCommentId(null); // Close the menu
    } else {
      // Standard comment - delete immediately
      handleDeleteComment(commentId, false);
    }
  };

  // Handle actual deletion
  const handleDeleteComment = async (commentId: string, isDonation: boolean) => {
    const comment = findCommentById(comments, commentId);
    if (!comment) {
      console.error('Comment not found for deletion');
      return;
    }

    // Get current user ID (authenticated or guest)
    const currentUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('twinkle_guest_id') : null);

    if (!currentUserId || currentUserId !== comment.userId) {
      console.error('Unauthorized: User cannot delete this comment', { 
        currentUserId, 
        commentUserId: comment.userId,
        userAuthenticated: !!user?.id 
      });
      return;
    }

    setDeletingCommentId(commentId);

    // Optimistic update: Mark as deleted with fade-out
    setDeletedCommentIds(prev => new Set(prev).add(commentId));

    // After fade animation completes, remove from UI
    setTimeout(() => {
      if (isDonation) {
        // Soft delete for donations: mark as deleted but keep in database
        setComments(prev => updateCommentInTree(prev, commentId, { deleted: true }));
        // TODO: API call to soft-delete donation (status: deleted_by_user)
        // await fetch(`/api/comments/${commentId}`, {
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ status: 'deleted_by_user' })
        // });
      } else {
        // Hard delete for standard comments
        setComments(prev => removeCommentFromTree(prev, commentId));
        // TODO: API call to delete comment
        // await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      }
      setDeletedCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
      setDeletingCommentId(null);
    }, 300); // Match CSS transition duration
  };

  // Update comment in tree (for soft delete)
  const updateCommentInTree = (comments: Comment[], commentId: string, updates: Partial<Comment>): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updates)
        };
      }
      return comment;
    });
  };

  // Remove comment from tree (for hard delete)
  const removeCommentFromTree = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: removeCommentFromTree(comment.replies, commentId)
          };
        }
        return comment;
      });
  };

  // Handle scroll to parent comment with highlight effect
  const handleScrollToParent = () => {
    if (replyingToId && commentRefs.current[replyingToId]) {
      // Scroll to comment
      commentRefs.current[replyingToId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Apply highlight effect
      setHighlightedCommentId(replyingToId);
      
      // Remove highlight after 1.5 seconds
      setTimeout(() => {
        setHighlightedCommentId(null);
      }, 1500);
    }
  };

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const maxHeight = 120; // Maximum height in pixels (approximately 5-6 lines)
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  // Format number with thousand separators using Intl.NumberFormat
  const formatNumberWithCommas = (value: string): string => {
    // Strip non-digits and leading zeros (but allow single '0')
    const rawValue = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (!rawValue) return '';
    // Use Intl.NumberFormat for proper formatting (handles large numbers correctly)
    const num = parseInt(rawValue, 10);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Handle donation amount change with thousand separator formatting
  const handleDonationAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const inputValue = input.value;
    
    // Count digits before cursor in current formatted value
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, '').length;
    
    // Strip all non-digits
    let cleaned = inputValue.replace(/\D/g, '');
    // Remove leading zeros, but allow single zero
    if (cleaned.length > 1) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    
    // Update state with cleaned numeric value (for API)
    setDonationAmount(cleaned);
    
    // Format for display using Intl.NumberFormat
    const formatted = cleaned ? formatNumberWithCommas(cleaned) : '';
    
    // Calculate new cursor position based on digit count
    let newCursorPosition = formatted.length;
    if (digitsBeforeCursor > 0 && formatted.length > 0) {
      // Find the position in the formatted string that corresponds to the same number of digits
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ',') {
          digitCount++;
          if (digitCount === digitsBeforeCursor) {
            newCursorPosition = i + 1;
            break;
          }
        }
      }
    }
    
    // Update input value and restore cursor position
    setTimeout(() => {
      input.value = formatted;
      const finalPosition = Math.min(Math.max(newCursorPosition, 0), formatted.length);
      input.setSelectionRange(finalPosition, finalPosition);
    }, 0);
  };

  // Format card number with spaces (UzCard/HUMO format: XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date (MM/YY) with backspace handling
  const formatExpiry = (value: string, previousValue?: string) => {
    const cleaned = value.replace(/\D/g, '');
    // Handle backspace over slash
    if (previousValue && previousValue.endsWith('/') && value.endsWith('/') && cleaned.length === 2) {
      return cleaned.slice(0, 2);
    }
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Format new card number (numeric only, with spaces)
  const formatNewCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Detect card type (local UzCard/HUMO vs international Visa/Mastercard) - BIN Lookup
  const detectCardType = (cardNumber: string): 'local' | 'international' | null => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 4) return null;
    
    // Local Uzbek cards: 8600 (UzCard), 9860 (HUMO), 5614 (Local)
    if (cleaned.startsWith('8600') || cleaned.startsWith('9860') || cleaned.startsWith('5614')) {
      return 'local';
    }
    // International cards: 4 (Visa), 5 (Mastercard)
    if (cleaned.startsWith('4')) {
      return 'international'; // Visa
    }
    if (cleaned.startsWith('5')) {
      return 'international'; // Mastercard
    }
    return null;
  };

  // Validate card payment
  const validateCardPayment = (): boolean => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      return false;
    }
    if (!cardExpiry || cardExpiry.length !== 5) {
      return false;
    }
    if (!cardCVC || cardCVC.length < 3) {
      return false;
    }
    return true;
  };



  // Handle card name step next
  const handleCardNameNext = () => {
    if (cardName.trim()) {
      setAddCardStep('details');
    }
  };

  // Handle card details step next
  const handleCardDetailsNext = () => {
    const cleanedNumber = newCardNumber.replace(/\s/g, '');
    if (cleanedNumber.length === 16 && newCardExpiry.length === 5) {
      const detectedType = detectCardType(newCardNumber);
      setCardType(detectedType);
      setAddCardStep('verification');
    }
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
      setIsAddingCard(false);
      setAddCardStep('name');
      setCardName('');
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCVC('');
      setSmsCode('');
      setCardType(null);
      setPaymentProcessing(false);
      setIsVerificationVerified(false);
      setSmsSent(false);
    }, 1000);
  };


  // Handle e-wallet invoice generation
  const handleGenerateInvoice = () => {
    if (!donationAmount || !selectedPaymentMethod) {
      return;
    }
    const amount = parseInt(donationAmount);
    if (amount < MIN_DONATION_AMOUNT) {
      return; // Don't generate invoice if below minimum
    }
    const isEwallet = ['click', 'payme', 'apelsin', 'paynet', 'uzum'].includes(selectedPaymentMethod);
    if (!isEwallet) {
      return;
    }
    setPaymentProcessing(true);
    setWaitingForPayment(true);
    // Simulate invoice generation and wait for payment
    setTimeout(() => {
      setInvoiceGenerated(true);
      setPaymentProcessing(false);
      // Simulate successful payment after 3 seconds
      setTimeout(() => {
        setWaitingForPayment(false);
        handleSendComment();
        setIsDonationViewActive(false);
        setDonationAmount('');
        setSelectedPaymentMethod(null);
        setInvoiceGenerated(false);
      }, 3000);
    }, 1000);
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

  // Handle Donation "Send Donation" button - Routes to appropriate flow
  const handleProcessDonation = () => {
    if (!donationAmount) {
      return;
    }

    const amount = parseInt(donationAmount);
    if (amount < MIN_DONATION_AMOUNT) {
      return;
    }

    // Check if using saved card, new card, or wallet
    const isUsingSavedCard = selectedPaymentMethod && savedCards.find((c: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => c.id === selectedPaymentMethod);
    const walletSystems = ['paynet', 'click', 'payme', 'uzum'];
    const isUsingWallet = selectedPaymentMethod && walletSystems.includes(selectedPaymentMethod);
    const isUsingNewCard = !isUsingSavedCard && !isUsingWallet && isNewCardValid();
    
    // Validate payment method
    if (!isUsingSavedCard && !isUsingNewCard && !isUsingWallet) {
      return;
    }

    // Case C: Wallet payments - Navigate to Invoice Request Screen
    if (isUsingWallet) {
      setSelectedWallet(selectedPaymentMethod);
      setDonationStep('WALLET_INVOICE_REQUEST');
      return;
    }

    // Determine card type for routing logic
    let detectedCardType: 'local' | 'international' | null = null;
    
    if (isUsingSavedCard) {
      const savedCard = savedCards.find((c: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => c.id === selectedPaymentMethod);
      if (savedCard) {
        detectedCardType = (savedCard.type === 'UzCard' || savedCard.type === 'HUMO') ? 'local' : 'international';
      }
    } else if (isUsingNewCard) {
      detectedCardType = cardType;
      // Validate CVV for international cards
      if (detectedCardType === 'international' && newCardCVC.length !== 3) {
        return; // Don't proceed if CVV is missing for international cards
      }
    }

    // Process payment
    setPaymentProcessing(true);

    // Case A: Local Cards (Humo/Uzcard) - Initiate payment → SMS Verification
    if (detectedCardType === 'local') {
      // TODO: API call to initiate payment request
      // const response = await fetch('/api/payments/initiate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     cardNumber: isUsingSavedCard 
      //       ? savedCards.find((c: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => c.id === selectedPaymentMethod)?.maskedNumber
      //       : newCardNumber.replace(/\s/g, ''),
      //     expiry: isUsingSavedCard ? '' : newCardExpiry,
      //     amount: amount,
      //     currency: 'UZS',
      //   }),
      // });

      // Simulate API call - initiate payment and receive SMS
      setTimeout(() => {
        setPaymentProcessing(false);
        setSmsSent(true);
        setCountdownTime(60);
        setDonationStep('SMS_VERIFICATION');
      }, 1500);
    }
    // Case B: International Cards (Visa/Mastercard) - Process immediately → Receipt
    else if (detectedCardType === 'international') {
      // Validate CVV is present
      if (isUsingNewCard && newCardCVC.length !== 3) {
        setPaymentProcessing(false);
        return;
      }

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
        if (typeof window !== 'undefined') {
          localStorage.setItem('savedCards', JSON.stringify(updatedCards));
        }
      }

      // TODO: API call to process payment
      // const response = await fetch('/api/payments/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     cardNumber: isUsingSavedCard 
      //       ? savedCards.find((c: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => c.id === selectedPaymentMethod)?.maskedNumber
      //       : newCardNumber.replace(/\s/g, ''),
      //     expiry: isUsingSavedCard ? '' : newCardExpiry,
      //     cvv: isUsingSavedCard ? '' : newCardCVC,
      //     amount: amount,
      //     currency: 'UZS',
      //   }),
      // });

      // Simulate payment processing
      setTimeout(() => {
        setPaymentProcessing(false);
        // Process donation success
        handleSendComment();
        setIsDonationViewActive(false);
        setDonationAmount('');
        setSelectedPaymentMethod(null);
        setDonationStep('DONATION');
        // Reset form
        setNewCardNumber('');
        setNewCardExpiry('');
        setNewCardCVC('');
        setCardName('');
        setSmsCode('');
        setCardType(null);
        setIsVerificationVerified(false);
        setSmsSent(false);
        setSaveCardEnabled(false);
      }, 2000);
    }
  };

  // Get invoice system name for display
  const getInvoiceSystemName = () => {
    const invoiceNames: { [key: string]: string } = {
      'paynet': 'Paynet',
      'click': 'Click',
      'payme': 'Payme',
      'uzum': 'Uzum',
    };
    return invoiceNames[selectedPaymentMethod || ''] || '';
  };

  // Get wallet name for display
  const getWalletName = (walletId: string | null): string => {
    if (!walletId) return 'Wallet';
    const wallets: Record<string, string> = {
      'paynet': 'Paynet',
      'click': 'Click',
      'payme': 'Payme',
      'uzum': 'Uzum'
    };
    return wallets[walletId] || 'Wallet';
  };

  // Check if wallet system is selected
  const isWalletSystemSelected = (): boolean => {
    if (!selectedPaymentMethod) return false;
    const walletSystems = ['paynet', 'click', 'payme', 'uzum'];
    return walletSystems.includes(selectedPaymentMethod);
  };

  // Validate invoice phone number
  const isInvoicePhoneValid = () => {
    if (!isWalletSystemSelected()) return true;
    if (!invoicePhoneNumber.trim()) return false;
    if (!invoicePhoneNumber.startsWith('+')) return false;
    const digits = invoicePhoneNumber.slice(1).replace(/\D/g, '');
    return digits.length >= 9;
  };

  // Validate invoice card details
  const isInvoiceCardValid = () => {
    if (!isWalletSystemSelected()) return true;
    const cleanedCard = invoiceCardNumber.replace(/\s/g, '');
    const cleanedExpiry = invoiceCardExpiry.replace(/\D/g, '');
    return cleanedCard.length >= 16 && cleanedExpiry.length === 4;
  };

  // Format phone number for invoice - always starts with +998
  const formatPhoneNumber = (value: string, previousValue?: string) => {
    const cleaned = value.replace(/[^\d\s+]/g, '');
    const PREFIX = '+998';
    const allDigits = cleaned.replace(/[^\d]/g, '');
    const previousDigits = previousValue ? previousValue.replace(/[^\d]/g, '') : '998';
    if (previousDigits.startsWith('998') && allDigits.length < 3) {
      return PREFIX + ' ';
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
    if (digitsAfter998.length === 0) return PREFIX + ' ';
    if (digitsAfter998.length <= 2) return `${PREFIX} ${digitsAfter998}`;
    if (digitsAfter998.length <= 5) return `${PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2)}`;
    if (digitsAfter998.length <= 7) return `${PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2, 5)} ${digitsAfter998.slice(5)}`;
    return `${PREFIX} ${digitsAfter998.slice(0, 2)} ${digitsAfter998.slice(2, 5)} ${digitsAfter998.slice(5, 7)} ${digitsAfter998.slice(7, 9)}`;
  };

  // Handle Send Invoice (Wallet payments)
  const handleSendInvoice = async () => {
    if (!activeInvoiceIdentifier) return;
    if (activeInvoiceIdentifier === 'phone' && !isInvoicePhoneValid()) return;
    if (activeInvoiceIdentifier === 'card' && !isInvoiceCardValid()) return;

    setPaymentProcessing(true);

    // TODO: API call to send invoice
    // const response = await fetch('/api/payments/invoice', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     walletId: selectedWallet,
    //     phoneNumber: activeInvoiceIdentifier === 'phone' ? invoicePhoneNumber : null,
    //     cardNumber: activeInvoiceIdentifier === 'card' ? invoiceCardNumber.replace(/\s/g, '') : null,
    //     cardExpiry: activeInvoiceIdentifier === 'card' ? invoiceCardExpiry : null,
    //     amount: parseInt(donationAmount),
    //     currency: 'UZS',
    //   }),
    // });

    // Simulate API call
    setTimeout(() => {
      setPaymentProcessing(false);
      setInvoiceStatus('pending');
      setDonationStep('WALLET_WAITING');
      startInvoicePolling();
    }, 1000);
  };

  // Start polling for invoice status
  const startInvoicePolling = () => {
    // Clear any existing interval
    if (invoicePollingInterval) {
      clearInterval(invoicePollingInterval);
    }
    
    // Poll every 5 seconds
    const interval = setInterval(async () => {
      // TODO: API call to check invoice status
      // const response = await fetch(`/api/payments/invoice-status?transactionId=${transactionId}`, {
      //   method: 'GET',
      // });
      // const data = await response.json();
      // const status = data.status; // 'pending' | 'paid' | 'failed'
      
      // Simulate status check
      const randomValue = Math.random();
      const status: 'pending' | 'paid' | 'failed' = randomValue > 0.85 ? 'paid' : 'pending';
      
      if (status === 'paid') {
        clearInterval(interval);
        setInvoicePollingInterval(null);
        setInvoiceStatus('paid');
        // Process donation success
        handleSendComment();
        setIsDonationViewActive(false);
        setDonationAmount('');
        setSelectedPaymentMethod(null);
        setDonationStep('DONATION');
        // Reset invoice state
        setInvoicePhoneNumber('+998 ');
        setInvoiceCardNumber('');
        setInvoiceCardExpiry('');
        setActiveInvoiceIdentifier(null);
      }
    }, 5000);
    
    setInvoicePollingInterval(interval);
    
    // Timeout after 5 minutes
    setTimeout(() => {
      if (invoicePollingInterval === interval) {
        clearInterval(interval);
        setInvoicePollingInterval(null);
        setInvoiceStatus('failed');
      }
    }, 300000);
  };

  // Handle Cancel Invoice
  const handleCancelInvoice = () => {
    if (invoicePollingInterval) {
      clearInterval(invoicePollingInterval);
      setInvoicePollingInterval(null);
    }
    setInvoiceStatus(null);
    setDonationStep('DONATION');
    setInvoicePhoneNumber('+998 ');
    setInvoiceCardNumber('');
    setInvoiceCardExpiry('');
    setActiveInvoiceIdentifier(null);
  };

  // Handle Cancel Payment (SMS Verification)
  const handleCancelDonationPayment = async () => {
    setPaymentProcessing(true);

    // TODO: API call to void/cancel the pending transaction
    // const response = await fetch('/api/payments/void', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     transactionId: transactionId, // Store transaction ID when initiating SMS
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
      
      // Return to main donation screen
      setDonationStep('DONATION');
    }, 500);
  };

  // Handle Confirm Payment (SMS Verification for donations)
  const handleConfirmDonationPayment = async () => {
    if (smsCode.length !== 6) return;
    
    setPaymentProcessing(true);

    // TODO: API call to confirm payment with SMS code
    // const response = await fetch('/api/payments/confirm', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     smsCode: smsCode,
    //     transactionId: transactionId, // Store transaction ID when initiating SMS
    //   }),
    // });

    // Simulate API call
    setTimeout(() => {
      setPaymentProcessing(false);
      setIsVerificationVerified(true);
      
      // If save card is enabled, save the card
      if (saveCardEnabled && newCardNumber) {
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('savedCards', JSON.stringify(updatedCards));
        }
      }

      // Process donation success
      handleSendComment();
      setIsDonationViewActive(false);
      setDonationAmount('');
      setSelectedPaymentMethod(null);
      setDonationStep('DONATION');
      // Reset form
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCVC('');
      setCardName('');
      setSmsCode('');
      setCardType(null);
      setIsVerificationVerified(false);
      setSmsSent(false);
      setSaveCardEnabled(false);
    }, 1500);
  };

  // Get SMS Label
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (invoicePollingInterval) {
        clearInterval(invoicePollingInterval);
      }
    };
  }, [invoicePollingInterval]);

  // Real-time timestamp updates (updates every 10 seconds for recent comments)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampUpdateKey(prev => prev + 1);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Render Donation View (Main Form)
  const renderDonationView = () => (
    <div className="flex flex-col h-full relative">
      {/* Zone A: Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-4">
        {/* 1. Donation Amount & Anonymity */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                inputMode="numeric"
                placeholder={`Minimal miqdor: ${MIN_DONATION_AMOUNT.toLocaleString()} UZS`}
                value={formatNumberWithCommas(donationAmount)}
                onChange={handleDonationAmountChange}
                onKeyDown={(e) => {
                  if (
                    [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode >= 35 && e.keyCode <= 40)
                  ) {
                    return;
                  }
                  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                  }
                }}
                className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-text-secondary whitespace-nowrap">Anonim</span>
              <button
                type="button"
                onClick={() => setIsAnonymousDonation(!isAnonymousDonation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnonymousDonation ? 'bg-accent' : 'bg-surface/50'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnonymousDonation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Message Input */}
        <div className="flex-shrink-0 mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Message (Optional)
          </label>
          <Textarea
            ref={commentInputRef}
            placeholder="Add a message with your donation..."
            value={commentText}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(e) => {
              const newValue = e.target.value;
              setCommentText(newValue);
              autoResizeTextarea(e.target);
            }}
            className="w-full min-h-[100px] border border-zinc-800 text-text-primary text-sm resize-none bg-surface outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 placeholder:text-zinc-500"
          />
          {commentText.length > MAX_COMMENT_LENGTH && (
            <span className="text-xs text-red-400 font-medium mt-1 block">
              -{commentText.length - MAX_COMMENT_LENGTH}
            </span>
          )}
        </div>

        {/* 3. Payment Methods Block */}
        <div className="flex-shrink-0 space-y-3 mb-4">
          {/* 3.1 Payment Method: "Pay with Card(s)" */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Pay with Card(s)</h3>
            <div className="space-y-1.5">
              {savedCards.map((card: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => (
                <div
                  key={card.id}
                  ref={(el) => {
                    if (el) {
                      cardMenuRefs.current[card.id] = el;
                    }
                  }}
                  onClick={() => {
                    if (selectedPaymentMethod === card.id) {
                      setSelectedPaymentMethod(null);
                      setIsCardFormActive(false);
                      setSelectedWallet(null);
                    } else {
                      setSelectedPaymentMethod(card.id);
                      setIsCardFormActive(false);
                      setSelectedWallet(null);
                      setNewCardNumber('');
                      setNewCardExpiry('');
                      setNewCardCVC('');
                      setCardName('');
                      setSmsCode('');
                      setCardType(null);
                      setIsVerificationVerified(false);
                      setSmsSent(false);
                    }
                    setPaymentCategory('card');
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
                          const updatedCards = savedCards.filter((c: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => c.id !== card.id);
                          setSavedCards(updatedCards);
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
                  setSelectedPaymentMethod(null);
                  setSelectedWallet(null);
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
                      setIsCardFormActive(true);
                      setSelectedPaymentMethod(null);
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
                    className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none"
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
                        setSelectedPaymentMethod(null);
                        setSelectedWallet(null);
                      }}
                      onChange={(e) => {
                        const formatted = formatExpiry(e.target.value, prevNewCardExpiryRef.current);
                        prevNewCardExpiryRef.current = formatted;
                        setNewCardExpiry(formatted);
                        setIsCardFormActive(true);
                        setSelectedPaymentMethod(null);
                        setSelectedWallet(null);
                      }}
                      maxLength={5}
                      className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none"
                    />
                  </div>
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
                          setSelectedPaymentMethod(null);
                          setSelectedWallet(null);
                        }}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          setNewCardCVC(cleaned.slice(0, 3));
                          setIsCardFormActive(true);
                          setSelectedPaymentMethod(null);
                          setSelectedWallet(null);
                        }}
                        maxLength={3}
                        className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none"
                      />
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
                
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
                        setSelectedPaymentMethod(null);
                        setSelectedWallet(null);
                      }}
                      onChange={(e) => {
                        setCardName(e.target.value);
                        setIsCardFormActive(true);
                        setSelectedPaymentMethod(null);
                        setSelectedWallet(null);
                      }}
                      className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3.2 Payment Method: "Wallets" */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Wallets</h3>
            <div className="overflow-x-auto sidebar-scrollbar-hide">
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
                      if (selectedPaymentMethod === wallet.id) {
                        setSelectedPaymentMethod(null);
                        setSelectedWallet(null);
                        setIsCardFormActive(false);
                      } else {
                        setSelectedWallet(wallet.id);
                        setSelectedPaymentMethod(wallet.id);
                        setIsCardFormActive(false);
                        setNewCardNumber('');
                        setNewCardExpiry('');
                        setNewCardCVC('');
                        setCardName('');
                        setSmsCode('');
                        setCardType(null);
                        setIsVerificationVerified(false);
                        setSmsSent(false);
                      }
                      setPaymentCategory('ewallet');
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

      {/* Zone B: Fixed Bottom Action */}
      <div className="mt-auto bg-[#1A1A1A] border-t border-zinc-800 p-4">
        <Button
          onClick={handleProcessDonation}
          disabled={
            paymentProcessing ||
            !donationAmount ||
            parseInt(donationAmount) < MIN_DONATION_AMOUNT ||
            (!selectedPaymentMethod && !isNewCardValid())
          }
          className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentProcessing ? 'Processing...' : 'Send Donation'}
        </Button>
      </div>
    </div>
  );

  // Render SMS Verification View (Local Cards)
  const renderDonationSMSVerificationView = () => {
    const savedCard = savedCards.find((c: { id: string; type: string; last4: string; cardName: string; maskedNumber: string }) => c.id === selectedPaymentMethod);
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
                className="w-full bg-surface border-zinc-800 text-text-primary h-10 outline-none hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsSending(true);
                  setTimeout(() => {
                    setSmsSent(true);
                    setIsSending(false);
                    setCountdownTime(60);
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

        <div className="mt-auto bg-[#1A1A1A] border-t border-zinc-800 p-4 space-y-3">
          <Button
            onClick={handleCancelDonationPayment}
            disabled={paymentProcessing}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleConfirmDonationPayment}
            disabled={
              paymentProcessing ||
              smsCode.length !== 6
            }
            className="w-full h-10 bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentProcessing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </div>
    );
  };

  // Render Wallet Invoice Request View
  const renderDonationWalletInvoiceRequestView = () => {
    const walletName = getWalletName(selectedWallet);

    return (
      <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-400">
              Enter the credentials linked to your {walletName} account
            </p>
          </div>

          <div className="space-y-6">
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
                  const digitsAfterPrefix = formatted.replace(/[^\d]/g, '').slice(3);
                  if (digitsAfterPrefix.length > 0 && activeInvoiceIdentifier === null) {
                    setActiveInvoiceIdentifier('phone');
                    setInvoiceCardNumber('');
                    setInvoiceCardExpiry('');
                  }
                  if (digitsAfterPrefix.length === 0 && activeInvoiceIdentifier === 'phone') {
                    setActiveInvoiceIdentifier(null);
                  }
                }}
                className={`w-full h-10 outline-none ${
                  activeInvoiceIdentifier === 'card'
                    ? 'bg-surface/20 border-surface/30 text-text-secondary/50 cursor-not-allowed'
                    : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none'
                }`}
              />
            </div>

            <div className="w-full h-px bg-zinc-800 my-6"></div>

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
                      if (formatted.replace(/\s/g, '').length > 0 && activeInvoiceIdentifier === null) {
                        setActiveInvoiceIdentifier('card');
                        setInvoicePhoneNumber('+998 ');
                      }
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
                        : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none'
                    }`}
                  />
                </div>
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
                      if (formatted.trim().length > 0 && activeInvoiceIdentifier === null) {
                        setActiveInvoiceIdentifier('card');
                        setInvoicePhoneNumber('+998 ');
                      }
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
                        : 'bg-surface border-zinc-800 text-text-primary hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0 outline-none'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto bg-[#1A1A1A] border-t border-zinc-800 p-4 space-y-3">
          <Button
            onClick={handleCancelInvoice}
            disabled={paymentProcessing}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          
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
  const renderDonationWalletWaitingView = () => {
    const walletName = getWalletName(selectedWallet);
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

        <div className="mt-auto bg-[#1A1A1A] border-t border-zinc-800 p-4">
          <Button
            onClick={handleCancelInvoice}
            className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
          >
            Cancel Invoice
          </Button>
        </div>
      </div>
    );
  };

  // Helper function to get card type name
  const getCardTypeName = (): string => {
    if (!cardType) return 'Card';
    const cleaned = newCardNumber.replace(/\s/g, '');
    if (cardType === 'local') {
      return cleaned.startsWith('8600') ? 'UzCard' : 'HUMO';
    } else {
      return cleaned.startsWith('4') ? 'Visa' : 'Mastercard';
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim() || commentText.length > MAX_COMMENT_LENGTH) return;
    
    // If donation is enabled, validate payment method and minimum amount
    if (donationAmount && selectedPaymentMethod) {
      const amount = parseInt(donationAmount);
      if (amount < MIN_DONATION_AMOUNT) {
        return; // Don't submit if below minimum
      }
      const isEwallet = ['click', 'payme', 'apelsin', 'paynet', 'uzum'].includes(selectedPaymentMethod);
      if (isEwallet && !invoiceGenerated && !waitingForPayment) {
        return; // Don't submit if e-wallet invoice not generated
      }
    }
    
    // Generate a unique user ID for guest users or use authenticated user ID
    // For guest users, use a session-persistent ID stored in localStorage
    let currentUserId = user?.id;
    if (!currentUserId) {
      if (typeof window !== 'undefined') {
        let guestId = localStorage.getItem('twinkle_guest_id');
        if (!guestId) {
          guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem('twinkle_guest_id', guestId);
        }
        currentUserId = guestId;
      } else {
        // Fallback for SSR - should not happen in practice
        currentUserId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
    }
    const isAnonymous = (donationAmount && selectedPaymentMethod && isAnonymousDonation) || !user?.id;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUserId, // Use authenticated user ID or generate guest ID
      userName: isAnonymous ? 'Anonymous' : (user.name || user.email?.split('@')[0] || 'You'),
      username: isAnonymous ? '@anonymous' : `@${user.email?.split('@')[0] || 'you'}`,
      text: commentText,
      timestamp: new Date(),
      likes: 0,
      dislikes: 0,
      isDonated: donationAmount && selectedPaymentMethod ? true : false,
      donationAmount: donationAmount && selectedPaymentMethod ? parseInt(donationAmount) : undefined,
      isHighlyRated: false,
    };
    
    if (replyingToId) {
      // Add as reply to the parent comment
      setComments(prevComments => {
        const addReply = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === replyingToId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment],
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: addReply(comment.replies),
              };
            }
            return comment;
          });
        };
        return addReply(prevComments);
      });
      setReplyingToId(null);
      setReplyingToComment(null);
    } else {
      // Add as top-level comment
      setComments([newComment, ...comments]);
    }
    
    // Reset all form states
    setCommentText('');
    setDonationAmount('');
    setIsAnonymousDonation(false);
    setSelectedPaymentMethod(null);
    setCardNumber('');
    setCardExpiry('');
    setInvoiceGenerated(false);
    // Close donation view if it was active
    setIsDonationViewActive(false);
    setCardCVC('');
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setInvoiceGenerated(false);
    // Reset textarea height
    if (commentInputRef.current) {
      commentInputRef.current.style.height = 'auto';
    }
  };

  const getVideoUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://twinkle.com/watch/${params.id}`;
  };

  const handleCopyLink = async () => {
    const videoUrl = getVideoUrl();
    try {
      await navigator.clipboard.writeText(videoUrl);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const socialNetworks = [
    { name: 'Telegram', icon: 'TG', color: 'bg-[#0088cc]', url: `https://t.me/share/url?url=${encodeURIComponent(getVideoUrl())}` },
    { name: 'Instagram', icon: 'IG', color: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]', url: `https://www.instagram.com/` },
    { name: 'X', icon: 'X', color: 'bg-black', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(getVideoUrl())}` },
    { name: 'Facebook', icon: 'FB', color: 'bg-[#1877f2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getVideoUrl())}` },
    { name: 'LinkedIn', icon: 'LI', color: 'bg-[#0077b5]', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getVideoUrl())}` },
    { name: 'Email', icon: '✉', color: 'bg-[#ea4335]', url: `mailto:?subject=Check out this video&body=${encodeURIComponent(getVideoUrl())}` },
    { name: 'VK', icon: 'VK', color: 'bg-[#0077ff]', url: `https://vk.com/share.php?url=${encodeURIComponent(getVideoUrl())}` },
  ];

  // Report handlers
  const handleReportReasonSelect = (reason: string) => {
    setReportReason(reason);
    setReportStep('WRITE_DETAILS');
  };

  const handleReportSubmit = () => {
    if (!reportDetails.trim()) {
      return; // Don't submit if details are empty
    }
    // TODO: Implement actual report submission
    console.log('Report submitted:', { reason: reportReason, details: reportDetails });
    // Transition to confirmation view (Step 4)
    setReportStep('SUBMITTED_CONFIRMATION');
  };

  const handleCloseReport = () => {
    setReportStep('CLOSED');
    setReportReason('');
    setReportDetails('');
  };

  const handleBackReport = () => {
    if (reportStep === 'WRITE_DETAILS') {
      setReportStep('SELECT_REASON');
      setReportDetails('');
    } else if (reportStep === 'SELECT_REASON') {
      setReportStep('CLOSED');
      setReportReason('');
    }
  };

  // Comment report handlers
  const handleCommentReportReasonSelect = (reason: string) => {
    setCommentReportReason(reason);
    setReportCommentState('WRITE_DETAILS');
  };

  const handleCommentReportSubmit = () => {
    if (!commentReportDetails.trim()) {
      return; // Don't submit if details are empty
    }
    // TODO: Implement actual comment report submission
    console.log('Comment report submitted:', { commentId: reportingCommentId, reason: commentReportReason, details: commentReportDetails });
    // Transition to confirmation view
    setReportCommentState('CONFIRMATION');
  };

  const handleCommentBackReport = () => {
    if (reportCommentState === 'WRITE_DETAILS') {
      setReportCommentState('REASON_SELECT');
      setCommentReportDetails('');
    } else if (reportCommentState === 'REASON_SELECT') {
      setReportCommentState('NONE');
      setCommentReportReason('');
      setReportingCommentId(null);
    }
  };

  const handleMoreMenuClick = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
  };

  const handleReportClick = () => {
    setIsMoreMenuOpen(false);
    setReportStep('SELECT_REASON');
  };

  // Get modal functions from context
  const { openShareModal, openReportModal } = useModal();

  const handleRecommendedSaveToPlaylist = (videoId: string, videoTitle: string) => {
    // For MVP: Show alert, in production this would open playlist selection modal
    alert(`Save to playlist:\n\n"${videoTitle}"\n\nThis feature will allow you to save videos to your playlists.`);
    console.log('Save to playlist:', { videoId, videoTitle });
  };

  const handleNotificationsClick = () => {
    setIsMoreMenuOpen(false);
    setIsNotificationsModalOpen(true);
  };

  const handleCloseNotifications = () => {
    setIsNotificationsModalOpen(false);
  };

  // Comment report confirmation timeout
  useEffect(() => {
    if (reportCommentState === 'CONFIRMATION') {
      const timer = setTimeout(() => {
        setReportCommentState('REASON_SELECT');
        setCommentReportDetails('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reportCommentState]);

  // Subscription handlers
  const handleSubscribe = () => {
    if (!isSubscribed) {
      setIsSubscribed(true);
      setIsAnimating(true);
      
      // Show animation for 1 second
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    }
  };


  const reportReasons = [
    'Misinformation',
    'Violence or hate',
    'Promoting restricts',
    'Nudity or sexual',
    'Scam',
    "I don't like it",
    'Write',
  ];

  // Handle confirmation view timer (3 seconds, then return to Step 2)
  useEffect(() => {
    if (reportStep === 'SUBMITTED_CONFIRMATION') {
      const timer = setTimeout(() => {
        setReportStep('SELECT_REASON');
        setReportReason('');
        setReportDetails('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [reportStep]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        setIsShareModalOpen(false);
      }
      if (reportModalRef.current && !reportModalRef.current.contains(event.target as Node)) {
        setReportStep('CLOSED');
        setReportReason('');
        setReportDetails('');
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node) && 
          moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (notificationsModalRef.current && !notificationsModalRef.current.contains(event.target as Node)) {
        setIsNotificationsModalOpen(false);
      }
      // Close comment report menu when clicking outside (only if not in report flow)
      if (reportingCommentId !== null && reportCommentState === 'NONE') {
        const target = event.target as HTMLElement;
        // Don't close if clicking inside the report menu
        if (!target.closest('.comment-report-menu')) {
          setReportingCommentId(null);
        }
      }
    };

    if (isShareModalOpen || reportStep !== 'CLOSED' || isMoreMenuOpen || isNotificationsModalOpen || (reportingCommentId !== null && reportCommentState === 'NONE')) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareModalOpen, reportStep, isMoreMenuOpen, isNotificationsModalOpen, reportingCommentId, reportCommentState]);

  // Filter comments based on active tab and mode
  const isLiveMode = video?.isLive === true;
  const filteredComments = (() => {
    if (isLiveMode) {
      // In Live Mode: Filtering based on active tab
      if (activeTab === 'donated') {
        // Superchat tab: Only show messages with donationAmount > 0 (strict filtering)
        return comments.filter(c => c.donationAmount && c.donationAmount > 0);
      } else {
        // Chat tab: Show ALL messages (universal feed - no filtering)
        return comments;
      }
    } else {
      // Standard Mode: Use existing isDonated filter
      return activeTab === 'donated' 
    ? comments.filter(c => c.isDonated)
    : comments;
    }
  })();

  // Helper function to render comment text with highlighted @mentions and clickable timecodes
  const renderCommentText = (text: string) => {
    if (!text) return null;

    const result: React.ReactNode[] = [];
    let keyIndex = 0;
    let currentIndex = 0;

    // Patterns: @mentions, timecodes (HH:MM:SS, MM:SS, or M:SS), and URLs
    const mentionPattern = /@\w+/g;
    const timecodePattern = /\d{1,2}:\d{2}(:\d{2})?/g;
    const urlPattern = /https?:\/\/[^\s]+/g;

    // Find all matches with their positions
    const matches: Array<{ start: number; end: number; type: 'mention' | 'timecode' | 'url'; text: string }> = [];
    
    let match;
    mentionPattern.lastIndex = 0;
    while ((match = mentionPattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'mention',
        text: match[0],
      });
    }

    timecodePattern.lastIndex = 0;
    while ((match = timecodePattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'timecode',
        text: match[0],
      });
    }

    urlPattern.lastIndex = 0;
    while ((match = urlPattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'url',
        text: match[0],
      });
    }

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (prioritize mentions, then timecodes, then URLs)
    const filteredMatches: typeof matches = [];
    for (const match of matches) {
      const overlaps = filteredMatches.some(
        (m) => !(match.end <= m.start || match.start >= m.end)
      );
      if (!overlaps) {
        filteredMatches.push(match);
      }
    }

    // Build result
    filteredMatches.forEach((match) => {
      // Add text before match
      if (match.start > currentIndex) {
        result.push(<span key={`text-${keyIndex++}`}>{text.substring(currentIndex, match.start)}</span>);
      }

      // Add the match
      if (match.type === 'mention') {
        const isLiveMode = video?.isLive === true;
        result.push(
          <span
            key={`mention-${keyIndex++}`}
            className="text-blue-400 hover:text-blue-300 cursor-pointer"
            onClick={() => handleMentionClick(match.text)}
          >
            {match.text}
          </span>
        );
      } else if (match.type === 'timecode') {
        result.push(
          <span
            key={`timecode-${keyIndex++}`}
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => {
              // Parse timecode format: HH:MM:SS, MM:SS, or M:SS
              const parts = match.text.split(':').map(Number);
              let totalSeconds = 0;
              
              if (parts.length === 3) {
                // HH:MM:SS format
                totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
              } else if (parts.length === 2) {
                // MM:SS or M:SS format
                totalSeconds = parts[0] * 60 + parts[1];
              }
              
              // Dispatch custom event for video player
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('videoSeek', { detail: { time: totalSeconds } }));
              }
            }}
          >
            {match.text}
          </span>
        );
      } else if (match.type === 'url') {
        result.push(
          <a
            key={`url-${keyIndex++}`}
            href={match.text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {match.text}
          </a>
        );
      }

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      result.push(<span key={`text-${keyIndex++}`}>{text.substring(currentIndex)}</span>);
    }

    return result.length > 0 ? result : <span key={0}>{text}</span>;
  };

  // Helper function to count total replies recursively (including nested)
  const countTotalReplies = (replies: Comment[] | undefined): number => {
    if (!replies || replies.length === 0) return 0;
    let count = replies.length;
    replies.forEach(reply => {
      if (reply.replies && reply.replies.length > 0) {
        count += countTotalReplies(reply.replies);
      }
    });
    return count;
  };

  // Helper function to flatten all nested replies into a single array (recursive)
  const flattenReplies = (replies: Comment[]): Comment[] => {
    const flattened: Comment[] = [];
    replies.forEach(reply => {
      // Add the reply itself (without nested replies to prevent further nesting)
      const flatReply: Comment = {
        ...reply,
        replies: undefined, // Remove nested replies property
      };
      flattened.push(flatReply);
      // Recursively flatten nested replies and add them to the same level
      if (reply.replies && reply.replies.length > 0) {
        flattened.push(...flattenReplies(reply.replies));
      }
    });
    return flattened;
  };

  // Toggle function for expanding/collapsing replies
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Handle mention click (for Live Chat Mode)
  const handleMentionClick = (username: string) => {
    const isLiveMode = video?.isLive === true;
    if (isLiveMode) {
      setCommentText(prev => {
        // If input is empty, just add the mention
        if (!prev.trim()) {
          return `${username} `;
        }
        // If input already has content, add mention at the end
        return `${prev} ${username} `;
      });
      // Focus the textarea
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 0);
    }
  };

  // Function to render a single comment item (no nested replies rendering)
  const renderCommentItem = (comment: Comment, isReply: boolean = false) => {
    const isLiveMode = video?.isLive === true;
    const isHighlighted = highlightedCommentId === comment.id;
    const isDeleted = deletedCommentIds.has(comment.id) || comment.deleted;
    
    // Don't render deleted comments (after fade-out animation)
    if (comment.deleted && !deletedCommentIds.has(comment.id)) {
      return null;
    }
    
    return (
      <div 
        key={comment.id} 
        ref={(el) => {
          if (el) {
            commentRefs.current[comment.id] = el;
          }
        }}
        className={`${isReply && !isLiveMode ? 'ml-10' : ''} ${isDeleted ? 'opacity-0 h-0 overflow-hidden transition-all duration-300' : ''}`}
      >
        <div className={`px-3 py-1.5 rounded-lg transition-colors duration-1000 ${
          isHighlighted ? 'bg-white/10' : 'bg-transparent'
        }`}>
          {/* Top Row: Avatar, Username (Left) | More Button (Right) */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Avatar - Clickable in Live Mode */}
              {isLiveMode ? (
                <button
                  onClick={() => handleMentionClick(comment.username)}
                  className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
              {comment.userName === 'Anonymous' ? (
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                      <User className="h-4 w-4 text-text-secondary" />
                </div>
              ) : comment.userAvatar ? (
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                      <User className="h-4 w-4 text-text-secondary" />
                </div>
              )}
                </button>
              ) : (
                <>
                  {comment.userName === 'Anonymous' ? (
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-text-secondary" />
                    </div>
                  ) : comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-text-secondary" />
                    </div>
                  )}
                </>
              )}
              {/* Header Elements Group: Username, Donation Amount, Timestamp */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Username - Clickable in Live Mode (can truncate) */}
                {isLiveMode ? (
                  <button
                    onClick={() => handleMentionClick(comment.username)}
                    className="text-sm font-medium text-text-primary truncate hover:text-white transition-colors cursor-pointer text-left min-w-0"
                  >
                    {comment.username}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-text-primary truncate min-w-0">
                    {comment.username}
              </span>
                )}
                {/* Donation Amount (if applicable) - Always visible */}
              {comment.isDonated && comment.donationAmount && (
                  <span className="text-xs font-bold text-accent flex-shrink-0">
                  {comment.donationAmount.toLocaleString()} UZS
                </span>
              )}
                {/* Timestamp - Only visible for VOD (non-live) videos */}
                {!isLiveMode && (
                  <span className="text-xs font-medium text-zinc-500 flex-shrink-0 ml-2">
                    {formatRelativeTime(comment.timestamp)}
                </span>
              )}
            </div>
            </div>
            {/* More Button - Available for all comments and replies */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reportCommentState === 'NONE') {
                      setReportingCommentId(reportingCommentId === comment.id ? null : comment.id);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {/* Comment Menu */}
                {reportingCommentId === comment.id && reportCommentState === 'NONE' && (
                  <div className="comment-report-menu absolute right-0 top-8 w-32 bg-surface border border-surface rounded-lg shadow-lg z-20 overflow-hidden">
                    {/* Report Option - Available for all comments */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setReportingCommentId(comment.id);
                        setReportCommentState('REASON_SELECT');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-background flex items-center gap-2"
                    >
                      <Flag className="h-4 w-4" />
                      Report
                    </button>
                    {/* Delete Option - Show if user owns the comment (authenticated or guest) */}
                    {(() => {
                      const currentUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('twinkle_guest_id') : null);
                      return currentUserId && currentUserId === comment.userId;
                    })() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteRequest(comment.id, comment.isDonated);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-error hover:bg-background flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
          </div>

          {/* Middle Section: Comment Text */}
          <p className="text-sm text-text-primary mb-1 whitespace-pre-wrap break-words">
            {renderCommentText(comment.text)}
          </p>

          {/* Bottom Row: Like/Dislike, Reply Buttons - Hidden in Live Mode */}
          {!isLiveMode && (
            <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCommentLike(comment.id);
              }}
                className={`flex items-center gap-1 text-sm transition-colors cursor-pointer ${
                commentReactions[comment.id] === 'LIKE'
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ThumbsUp 
                  className={`h-4 w-4 ${
                  commentReactions[comment.id] === 'LIKE' ? 'fill-current' : ''
                }`}
              />
                <span>{comment.likes}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCommentDislike(comment.id);
              }}
                className={`flex items-center gap-1 text-sm transition-colors cursor-pointer ${
                commentReactions[comment.id] === 'DISLIKE'
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ThumbsDown 
                  className={`h-4 w-4 ${
                  commentReactions[comment.id] === 'DISLIKE' ? 'fill-current' : ''
                }`}
              />
                <span>{comment.dislikes || 0}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                  handleReplyClick(comment.id, comment.username);
              }}
                className="flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
                <Reply className="h-4 w-4" />
            </button>
          </div>
          )}
        </div>
      </div>
    );
  };

  // Main function to render a comment with all its flattened replies
  const renderComment = (comment: Comment) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const totalRepliesCount = hasReplies ? countTotalReplies(comment.replies) : 0;
    const isExpanded = expandedReplies.has(comment.id);
    const isLiveMode = video?.isLive === true;
    
    // In Live Mode, always show replies flattened. In Standard Mode, only show if expanded.
    const shouldShowReplies = isLiveMode || isExpanded;
    let allReplies: Comment[] = [];
    
    if (hasReplies && shouldShowReplies && comment.replies) {
      const flattened = flattenReplies(comment.replies);
      
      // In Live Mode, filter replies based on active tab
      if (isLiveMode) {
        if (activeTab === 'donated') {
          // Superchat tab: Only show replies with donationAmount > 0 (strict filtering)
          allReplies = flattened.filter(r => r.donationAmount && r.donationAmount > 0);
        } else {
          // Chat tab: Show ALL replies (universal feed - no filtering)
          allReplies = flattened;
        }
      } else {
        // Standard Mode: Show all replies
        allReplies = flattened;
      }
    }
    
    return (
      <div key={comment.id}>
        {/* Render the main comment */}
        {renderCommentItem(comment, false)}
        
        {/* View/Hide replies button - only show in Standard Mode (not Live Mode) */}
        {hasReplies && !isLiveMode && (
          <div className="ml-10 px-3 py-0.5">
            <button
              onClick={() => toggleReplies(comment.id)}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              {isExpanded ? `Hide replies` : `View ${totalRepliesCount} ${totalRepliesCount === 1 ? 'reply' : 'replies'}`}
            </button>
          </div>
        )}
        
        {/* Render all replies at the same indentation level - only if expanded (or in Live Mode) */}
        {/* In Live Mode, replies are rendered flat (no indentation) */}
        {hasReplies && shouldShowReplies && allReplies.length > 0 && (
          <div className={isLiveMode ? "mt-0 space-y-0.5" : "mt-0 space-y-0.5"}>
            {allReplies.map((reply) => renderCommentItem(reply, !isLiveMode))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex gap-4 p-3 overflow-hidden max-w-full">
      {/* Left Column - Video Player and Info */}
      <div className="flex-grow space-y-4 min-w-0 max-w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
          {/* Video Player Placeholder - CRITICAL: Always render on watch page to provide portal target */}
          {/* CentralizedVideoPlayer always renders full-size on watch page, ignoring miniplayer state */}
          <div className="relative w-full aspect-video">
            <div 
              id="video-player-placeholder" 
              className="absolute inset-0"
            >
              {/* Placeholder maintains space for the centralized VideoPlayer */}
              {/* The actual VideoPlayer is rendered here via React Portal from MainLayout */}
            </div>
            
            {/* Share Modal - Centered in Video Player Area */}
            {isShareModalOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg">
                {/* Backdrop Overlay */}
                <div 
                  className="absolute inset-0 bg-black/70 rounded-lg"
                  onClick={() => setIsShareModalOpen(false)}
                />
                
                {/* Modal */}
                <div
                  ref={shareModalRef}
                  className="relative bg-surface border border-surface rounded-lg shadow-xl z-[60] p-5 max-w-lg w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Close share modal"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Copy Link Section */}
                  <div className="mb-5 pr-8">
                    <label className="text-xs font-medium text-text-secondary mb-2 block">
                      Share link
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={getVideoUrl()}
                        readOnly
                        className="flex-1 bg-background border-surface text-text-primary text-sm"
                      />
                      <Button
                        onClick={handleCopyLink}
                        size="sm"
                        className={`rounded-full gap-2 ${
                          isLinkCopied
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-accent hover:bg-accent/90 text-white'
                        }`}
                      >
                        {isLinkCopied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span className="text-sm">Copy</span>
                          </>
                        )}
                      </Button>
              </div>
            </div>
            
                  {/* Social Networks Section */}
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-3 block">
                      Share to
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {socialNetworks.map((network) => (
                        <a
                          key={network.name}
                          href={network.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsShareModalOpen(false)}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background hover:scale-105 border border-surface transition-all duration-200 group cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-full ${network.color} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow`}>
                            {network.icon}
                          </div>
                          <span className="text-xs text-text-secondary group-hover:text-text-primary text-center leading-tight font-medium">
                            {network.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Modal - Centered in Video Player Area */}
            {reportStep !== 'CLOSED' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg">
                {/* Backdrop Overlay - No blur, clean solid overlay */}
                <div 
                  className="absolute inset-0 bg-black/80 rounded-lg"
                  style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                  onClick={handleCloseReport}
                />
                
                {/* Modal */}
                <div
                  ref={reportModalRef}
                  className="relative bg-surface border border-surface rounded-lg shadow-xl z-[60] p-5 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={handleCloseReport}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors z-10"
                    aria-label="Close report modal"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Step 1: Select Reason */}
                  {reportStep === 'SELECT_REASON' && (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={handleBackReport}
                          className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                          aria-label="Back"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-text-primary">Report video</h2>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2">
                        <p className="text-sm text-text-secondary mb-4">
                          Tell us why you're reporting this video
                        </p>
                        <div className="flex flex-col gap-1">
                          {reportReasons.map((reason) => (
                            <button
                              key={reason}
                              onClick={() => handleReportReasonSelect(reason)}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-background text-text-primary transition-colors text-left"
                            >
                              <span className="font-medium">{reason}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Write Details */}
                  {reportStep === 'WRITE_DETAILS' && (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={handleBackReport}
                          className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                          aria-label="Back"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-text-primary">{reportReason}</h2>
                      </div>
                      <div className="flex-1 flex flex-col mb-4">
                        <label className="text-sm font-medium text-text-secondary mb-2 block">
                          Additional details <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder="Provide more information about why you're reporting this video..."
                          className="flex-1 min-h-[120px] bg-background border-surface text-text-primary placeholder:text-text-secondary resize-none"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleBackReport}
                          variant="outline"
                          className="flex-1 rounded-full border-surface bg-background hover:bg-surface hover:border-surface"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleReportSubmit}
                          disabled={!reportDetails.trim()}
                          className="flex-1 rounded-full bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Submission Confirmation */}
                  {reportStep === 'SUBMITTED_CONFIRMATION' && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                      <div className="flex flex-col items-center gap-4 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
                        <div className="relative">
                          <CheckCircle2 className="h-20 w-20 text-green-500" />
                        </div>
                        <div className="text-center">
                          <h2 className="text-xl font-semibold text-text-primary mb-2">
                            Report Submitted
                          </h2>
                          <p className="text-sm text-text-secondary">
                            Thank you for your feedback.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* Notifications Modal - Only show when player placeholder is visible */}
          {!isMiniplayerActive && isNotificationsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop Overlay - No blur, clean solid overlay */}
                <div 
                className="absolute inset-0 bg-black/80"
                  style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                  onClick={handleCloseNotifications}
                />
                
                {/* Modal */}
                <div
                  ref={notificationsModalRef}
                  className="relative bg-surface border border-surface rounded-lg shadow-xl z-[60] p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={handleCloseNotifications}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors z-10"
                    aria-label="Close notifications modal"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Notifications Settings */}
                  <div className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 pr-8">Notifications</h2>
                    <div className="flex-1 flex flex-col">
                      <p className="text-sm text-text-secondary mb-4">
                        Choose how you want to be notified about new content from this channel
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setNotificationState('ALL')}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                            notificationState === 'ALL'
                              ? 'bg-background border border-white/20'
                              : 'hover:bg-background border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-text-secondary fill-current" />
                            <div className="flex flex-col">
                              <span className="font-medium text-text-primary">All notifications</span>
                              <span className="text-xs text-text-secondary">Get notified about all new videos and posts</span>
                            </div>
                          </div>
                          {notificationState === 'ALL' && (
                            <Check className="h-5 w-5 text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => setNotificationState('NONE')}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                            notificationState === 'NONE'
                              ? 'bg-background border border-white/20'
                              : 'hover:bg-background border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <BellOff className="h-5 w-5 text-text-secondary" />
                            <div className="flex flex-col">
                              <span className="font-medium text-text-primary">No notifications</span>
                              <span className="text-xs text-text-secondary">Don't send me any notifications</span>
                            </div>
                          </div>
                          {notificationState === 'NONE' && (
                            <Check className="h-5 w-5 text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => setNotificationState('PERSONALIZED')}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                            notificationState === 'PERSONALIZED'
                              ? 'bg-background border border-white/20'
                              : 'hover:bg-background border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-text-secondary" />
                            <div className="flex flex-col">
                              <span className="font-medium text-text-primary">Personalized</span>
                              <span className="text-xs text-text-secondary">Only notify me about content I might like</span>
                            </div>
                          </div>
                          {notificationState === 'PERSONALIZED' && (
                            <Check className="h-5 w-5 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          {/* Video Title */}
          <h1 className="text-xl font-semibold text-text-primary">{video.title}</h1>
          
          {/* Action Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left Group: Creator Profile & Subscribe */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Avatar */}
              <Link href={`/creator/${video.userId}`}>
                  {video.user?.profileImageUrl ? (
                    <img
                      src={video.user.profileImageUrl}
                      alt={video.user.name || 'Creator'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-text-secondary" />
                  </div>
                )}
              </Link>
              
              {/* Channel Name / Subscriber Count */}
              <div className="flex-shrink-0">
                <Link href={`/creator/${video.userId}`}>
                  <h3 className="font-medium text-text-primary hover:text-white whitespace-nowrap">
                    {video.user?.name || 'Unknown Creator'}
                  </h3>
                </Link>
                <p className="text-xs text-text-secondary whitespace-nowrap">
                  {subscribersCount.toLocaleString()} subscribers
                </p>
              </div>
              
              {/* Subscription Button - Multi-state */}
              {!isSubscribed && (
                <Button
                  onClick={handleSubscribe}
                  className="rounded-full h-10 px-4 bg-accent hover:bg-accent/90 text-white transition-all duration-300 flex-shrink-0 whitespace-nowrap"
                >
                Subscribe
              </Button>
              )}
              {isSubscribed && isAnimating && (
                <Button
                  disabled
                  className="rounded-full h-10 px-4 bg-green-600 text-white transition-all duration-300 flex-shrink-0 whitespace-nowrap"
                >
                  Subscribed 🎉
                </Button>
              )}
            </div>
            
            {/* Right Group: Action Buttons (Like, Share, Save, More) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Like/Dislike */}
              <div className="flex items-center gap-1 bg-surface rounded-full p-1 h-10">
                <Button
                  variant="ghost"
                  onClick={handleLike}
                  className={`rounded-full gap-2 h-10 px-4 ${
                    isLiked 
                      ? 'text-text-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className={`text-sm font-medium ${isLiked ? 'text-text-primary' : ''}`}>
                    {likes.toLocaleString()}
                  </span>
                </Button>
                <div className="w-px h-6 bg-background" />
                <Button
                  variant="ghost"
                  onClick={handleDislike}
                  className={`rounded-full h-10 px-3 ${
                    isDisliked 
                      ? 'text-text-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ThumbsDown className={`h-5 w-5 ${isDisliked ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Share */}
              <Button
                variant="ghost"
                onClick={() => setIsShareModalOpen(!isShareModalOpen)}
                className="rounded-full h-10 w-10 p-0 text-text-secondary hover:text-text-primary hover:bg-surface"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              {/* Save/Playlist */}
              <Button
                variant="ghost"
                onClick={handleSave}
                className={`rounded-full h-10 w-10 p-0 hover:bg-surface ${
                  isSaved 
                    ? 'text-text-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </Button>

              {/* Comment Icon Button (Mobile only) - Disabled if no access */}
              <Button
                variant="ghost"
                onClick={() => setIsCommentsOpen(true)}
                disabled={!hasFullAccess}
                className={`lg:hidden rounded-full h-10 w-10 p-0 hover:bg-surface ${
                  !hasFullAccess
                    ? 'opacity-50 cursor-not-allowed'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title={!hasFullAccess ? 'Comments unavailable for restricted content' : 'Open comments'}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>

              {/* More */}
              <div className="relative">
                <Button
                  ref={moreButtonRef}
                  variant="ghost"
                  onClick={handleMoreMenuClick}
                  className="rounded-full h-10 w-10 p-0 text-text-secondary hover:text-text-primary hover:bg-surface"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                
                {/* More Menu Popup */}
                {isMoreMenuOpen && (
                  <div
                    ref={moreMenuRef}
                    className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-surface rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex flex-col py-1">
                      {isSubscribed && (
                        <button
                          onClick={handleNotificationsClick}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background text-text-primary transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Bell className={`h-5 w-5 text-text-secondary ${notificationState === 'ALL' ? 'fill-current' : ''}`} />
                            <span className="font-medium text-sm">Notifications</span>
                          </div>
                          {notificationState === 'ALL' && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={handleReportClick}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-background text-text-primary transition-colors text-left"
                      >
                        <Flag className="h-5 w-5 text-text-secondary" />
                        <span className="font-medium text-sm">Report</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description with Views, Date, and Merch */}
          <VideoDescription
            views={video.views}
            createdAt={video.createdAt}
            description={video.description}
          />

          {/* Monetization CTA Section - Replace comments area when access restricted */}
          {!hasFullAccess && (
            <div className="lg:hidden">
              <MonetizationCTASection 
                video={currentPlaylist && currentPlaylist.price ? {
                  // If video belongs to paid playlist, show playlist info
                  id: currentPlaylist.id,
                  userId: currentPlaylist.creatorId || 'playlist-creator',
                  title: currentPlaylist.title,
                  description: currentPlaylist.description,
                  videoUrl: '',
                  views: 0,
                  createdAt: new Date(currentPlaylist.lastUpdated),
                  updatedAt: new Date(currentPlaylist.lastUpdated),
                  type: currentPlaylist.isSubscription ? 'subscription' : 'paid',
                  price: parseInt(currentPlaylist.price.replace(/[^\d]/g, '')) || 50000,
                  currency: 'UZS',
                  user: {
                    id: currentPlaylist.creatorId || 'playlist-creator',
                    name: currentPlaylist.creatorName,
                    profileImageUrl: currentPlaylist.creatorAvatar,
                  },
                } : video!}
                isPlaylist={currentPlaylist && currentPlaylist.price ? true : false}
                onPurchase={() => {
                  // TODO: Implement purchase flow
                  if (currentPlaylist && currentPlaylist.price) {
                    console.log('Purchase clicked for playlist:', currentPlaylist.id);
                  } else {
                    console.log('Purchase clicked for video:', video?.id);
                  }
                }}
                onSubscribe={() => {
                  // TODO: Implement subscription flow
                  console.log('Subscribe clicked for channel:', video?.userId);
                }}
                onPurchaseComplete={() => {
                  if (currentPlaylist && currentPlaylist.price) {
                    // Purchase playlist - unlock all videos in playlist
                    if (typeof window !== 'undefined') {
                      const purchasedPlaylists = JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]');
                      if (!purchasedPlaylists.includes(currentPlaylist.id)) {
                        purchasedPlaylists.push(currentPlaylist.id);
                        localStorage.setItem('purchasedPlaylists', JSON.stringify(purchasedPlaylists));
                        // Dispatch custom event for global sync
                        window.dispatchEvent(new CustomEvent('playlistPurchased', { detail: { playlistId: currentPlaylist.id } }));
                      }
                    }
                    // Reload page to update video access
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  } else {
                    // Purchase individual video
                    setHasPurchasedVideoLocal(true);
                    
                    // Persist purchase to localStorage
                    if (typeof window !== 'undefined' && video) {
                      const purchasedVideos = JSON.parse(localStorage.getItem('purchasedVideos') || '[]');
                      if (!purchasedVideos.includes(video.id)) {
                        purchasedVideos.push(video.id);
                        localStorage.setItem('purchasedVideos', JSON.stringify(purchasedVideos));
                        // Dispatch custom event for global sync
                        window.dispatchEvent(new CustomEvent('videoPurchased', { detail: { videoId: video.id } }));
                      }
                    }
                    
                    // Update video URL to full video if available
                    if (video) {
                      const fullVideoUrl = video.fullVideoUrl || video.videoUrl;
                      setCurrentWatchVideo({
                        ...video,
                        videoUrl: fullVideoUrl
                      });
                    }
                    
                    // Open comments section
                    // On mobile, open the comments overlay
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setIsCommentsOpen(true);
                    } else {
                      // On desktop, scroll to comments section after a brief delay
                      setTimeout(() => {
                        if (commentsSectionRef.current) {
                          commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 300);
                    }
                  }
                }}
              />
          </div>
          )}

          {/* Recommended Videos Section */}
          <div className="mt-6 w-full max-w-full">
            {/* Playlist Link - Show if video belongs to playlist */}
            {currentPlaylist && (
              <div className="mb-4">
                <Link
                  href={`/playlist/${currentPlaylist.id}`}
                  className="text-sm text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
                >
                  <span>From: {currentPlaylist.title}</span>
                </Link>
              </div>
            )}
            
            {/* Tab Navigation - Sticky */}
            <div className="sticky top-0 z-30 bg-[#0A0A0A] pt-2 pb-1 -mt-2">
              <div className="flex items-center justify-between gap-4 border-b border-surface/50 w-full">
                <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
                  {/* Scenario A: urlPlaylistId exists - Show ONLY playlist tabs (no standard recommendations) */}
                  {urlPlaylistId && currentPlaylist ? (
                    <>
                      <button
                        onClick={() => {
                          setRecommendedTab('playlist');
                          setPlaylistActiveTab('all');
                        }}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                          recommendedTab === 'playlist' && playlistActiveTab === 'all'
                            ? 'border-white text-text-primary font-semibold'
                            : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                        }`}
                      >
                        All
                      </button>
                      {currentPlaylist.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => {
                            setRecommendedTab('playlist');
                            setPlaylistActiveTab(section.id);
                          }}
                          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                            recommendedTab === 'playlist' && playlistActiveTab === section.id
                              ? 'border-white text-text-primary font-semibold'
                              : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                          }`}
                        >
                          {section.title}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {/* Scenario B: Standalone mode - Standard tabs + optional "From Playlist" tab */}
                      <button
                        onClick={() => setRecommendedTab('recommendations')}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                          recommendedTab === 'recommendations'
                            ? 'border-white text-text-primary font-semibold'
                            : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                        }`}
                      >
                        Recommended
                      </button>
                      
                      {/* "From Playlist" tab - Only show if video belongs to playlist but NOT in listContext mode */}
                      {currentPlaylist && !listContext && (
                        <button
                          onClick={() => {
                            setRecommendedTab('playlist');
                            setPlaylistActiveTab('all');
                          }}
                          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                            recommendedTab === 'playlist'
                              ? 'border-white text-text-primary font-semibold'
                              : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                          }`}
                          title={currentPlaylist.title}
                        >
                          From Playlist
                        </button>
                      )}
                      
                      <button
                        onClick={() => setRecommendedTab('creator')}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                          recommendedTab === 'creator'
                            ? 'border-white text-text-primary font-semibold'
                            : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                        }`}
                      >
                        {video.user?.name || 'Creator'}
                      </button>
                      <button
                        onClick={() => setRecommendedTab('topic')}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                          recommendedTab === 'topic'
                            ? 'border-white text-text-primary font-semibold'
                            : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                        }`}
                      >
                        Topic Related
                      </button>
                    </>
                  )}
                </div>
                
                {/* View Layout Switcher */}
                <button
                  onClick={() => setIsCardViewActive(!isCardViewActive)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-surface/50 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={isCardViewActive ? 'Switch to list view' : 'Switch to grid view'}
                >
                  {isCardViewActive ? (
                    <LayoutList className="h-5 w-5" />
                  ) : (
                    <LayoutGrid className="h-5 w-5" />
                  )}
                </button>
            </div>
          </div>
        
            {/* Video List/Grid */}
            <div className="w-full max-w-full">
            {(() => {
              // Filter videos based on active tab
              let filteredVideos: Video[] = [];
              
              if (currentPlaylist && recommendedTab === 'playlist') {
                // Filter by playlist sections (maintaining creator-defined order)
                const videoMap = new Map(relatedVideos.map(v => [v.id, v]));
                
                // Include current video in playlist session mode (to show "Now Playing" indicator)
                if (isPlaylistSession && video) {
                  videoMap.set(video.id, video);
                }
                
                if (playlistActiveTab === 'all') {
                  // Show all videos from playlist in creator-defined order
                  filteredVideos = currentPlaylist.allVideoIds
                    .map(id => videoMap.get(id))
                    .filter((v): v is Video => v !== undefined);
                } else {
                  // Show videos from specific section in creator-defined order
                  const section = currentPlaylist.sections.find(s => s.id === playlistActiveTab);
                  if (section) {
                    filteredVideos = section.videoIds
                      .map(id => videoMap.get(id))
                      .filter((v): v is Video => v !== undefined);
                  }
                }
              } else if (recommendedTab === 'recommendations') {
                // Show general recommendations (exclude current video)
                // In listContext mode, this should never be reached, but add safety check
                if (listContext && currentPlaylist) {
                  // Fallback: show playlist videos if somehow in recommendations tab
                  const videoMap = new Map(relatedVideos.map(v => [v.id, v]));
                  filteredVideos = currentPlaylist.allVideoIds
                    .map(id => videoMap.get(id))
                    .filter((v): v is Video => v !== undefined && v.id !== video?.id);
                } else {
                  filteredVideos = relatedVideos.filter(v => v.id !== video?.id).slice(0, 10);
                }
              } else if (recommendedTab === 'playlist' && !listContext) {
                // Scenario B: "From Playlist" tab - Show playlist videos
                if (currentPlaylist) {
                  const videoMap = new Map(relatedVideos.map(v => [v.id, v]));
                  filteredVideos = currentPlaylist.allVideoIds
                    .map(id => videoMap.get(id))
                    .filter((v): v is Video => v !== undefined && v.id !== video?.id);
                } else {
                  // Fallback: show similar category videos
                  filteredVideos = relatedVideos
                    .filter(v => v.id !== video?.id && v.category === video?.category)
                    .slice(0, 8);
                }
              } else if (recommendedTab === 'creator') {
                // Show creator's other videos
                filteredVideos = relatedVideos
                  .filter(v => v.id !== video?.id && v.userId === video?.userId)
                  .slice(0, 8);
              } else if (recommendedTab === 'topic') {
                // Show topic-related videos (same category)
                filteredVideos = relatedVideos
                  .filter(v => v.id !== video?.id && v.category === video?.category)
                  .slice(0, 8);
              }

              // If no filtered videos, show general recommendations
              if (filteredVideos.length === 0) {
                filteredVideos = relatedVideos.filter(v => v.id !== video?.id).slice(0, 10);
              }

              // Render based on view mode
              if (isCardViewActive) {
                // Grid/Card View - Match Homepage styling with dynamic columns
                return (
                  <div 
                    ref={isPlaylistSession && recommendedTab === 'playlist' ? playlistScrollContainerRef : null}
                    className={isPlaylistSession && recommendedTab === 'playlist'
                      ? "grid gap-x-0 gap-y-0 overflow-y-auto"
                      : "grid gap-x-0 gap-y-0"
                    }
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {filteredVideos.map((relatedVideo) => {
                      const isHovered = hoveredVideo === relatedVideo.id;
                      const isMenuOpen = openMenuVideoId === relatedVideo.id;
                      const isCurrentlyPlaying = video?.id === relatedVideo.id;
                      const isPlaylistSessionVideo = isPlaylistSession && recommendedTab === 'playlist';
                      
                      const videoItemContent = (
                        <>
                          {/* Card Container - flat design with uniform neutral hover effect */}
                          <div 
                            className={`rounded-xl transition-all duration-200 p-3 relative ${isMenuOpen ? 'z-[90]' : ''} ${
                              isCurrentlyPlaying 
                                ? 'bg-white/10' 
                                : isHovered 
                                  ? 'bg-white/10' 
                                  : 'bg-transparent'
                            }`}
                          >
                            {/* Thumbnail Container */}
                            <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden mb-3">
                              {relatedVideo.thumbnailUrl ? (
                                <img
                                  src={relatedVideo.thumbnailUrl}
                                  alt={relatedVideo.title}
                                  className="w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                  onLoad={() => {
                                    // Image loaded - color extraction will happen automatically via effect
                                  }}
                                  onError={() => {
                                    // Image failed to load - skip color extraction
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface">
                                  <span className="text-text-secondary text-xs">No thumbnail</span>
                                </div>
                              )}
                              
                              {/* Duration Badge */}
                              {!relatedVideo.isLive && relatedVideo.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold z-20">
                                  {formatDuration(relatedVideo.duration)}
                                </div>
                              )}
                            </div>

                            {/* Video Info - 3-Column Layout like Homepage */}
                            <div className="flex items-start gap-3 mt-3">
                              {/* Column 1: Avatar */}
                              <div className="flex-shrink-0 relative">
                                {relatedVideo.user?.profileImageUrl ? (
                                  <img
                                    src={relatedVideo.user.profileImageUrl}
                                    alt={relatedVideo.user.name || 'Creator'}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center"></div>
                                )}
                              </div>
                              
                              {/* Column 2: Details Block (Flex-Grow) */}
                              <div className="flex-1 min-w-0 relative">
                                <h3 className="font-medium text-sm text-text-primary line-clamp-3 mb-1 leading-5">
                                  {relatedVideo.title}
                                </h3>
                                
                                {/* Channel Name, Views, Date */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
                                  <span className="line-clamp-1">{relatedVideo.user?.name || 'Unknown Creator'}</span>
                                  <span>•</span>
                                  {relatedVideo.isLive ? (
                                    <span className="text-white font-semibold">
                                      {relatedVideo.liveViewers ? `${formatViews(relatedVideo.liveViewers)} watching` : 'Live'}
                                    </span>
                                  ) : (
                                    <>
                                      <span>{formatViews(relatedVideo.views)} views</span>
                                      <span>•</span>
                                      <span 
                                        className="cursor-help"
                                        title={formatExactDate(relatedVideo.createdAt)}
                                      >
                                        {formatTimeAgo(relatedVideo.createdAt)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {/* Column 3: More Icon (3 dots) */}
                              <div className={`flex-shrink-0 relative ${isMenuOpen ? 'z-[100]' : ''}`}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenMenuVideoId(isMenuOpen ? null : relatedVideo.id);
                                  }}
                                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                  aria-label="More options"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                  <div
                                    ref={(el) => {
                                      menuRefs.current[relatedVideo.id] = el;
                                    }}
                                    className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-[100]"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ zIndex: 9999 }}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRecommendedSaveToPlaylist(relatedVideo.id, relatedVideo.title);
                                        setOpenMenuVideoId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                                    >
                                      Save to playlist
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openShareModal(relatedVideo.id, relatedVideo.title);
                                        setOpenMenuVideoId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                                    >
                                      Share
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openReportModal(relatedVideo.id, relatedVideo.title);
                                        setOpenMenuVideoId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                                    >
                                      Report
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                      
                      return isPlaylistSessionVideo ? (
                        <div
                          key={relatedVideo.id}
                          ref={isCurrentlyPlaying ? activePlaylistVideoRef : null}
                          onClick={() => handleVideoSwitch(relatedVideo.id)}
                          className={`group cursor-pointer flex flex-col relative w-full ${isMenuOpen ? 'z-[90]' : ''}`}
                          onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                          onMouseLeave={() => setHoveredVideo(null)}
                        >
                          {videoItemContent}
                        </div>
                      ) : (
                        <Link
                          key={relatedVideo.id}
                          href={`/watch/${relatedVideo.id}${listContext && currentPlaylist ? `?playlistId=${currentPlaylist.id}&listContext=true` : ''}`}
                          className={`group cursor-pointer flex flex-col relative ${isMenuOpen ? 'z-[90]' : ''}`}
                          onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                          onMouseLeave={() => setHoveredVideo(null)}
                        >
                          {videoItemContent}
                        </Link>
                      );
                    })}
                  </div>
                );
              } else {
                // List View (Vertical) - Larger thumbnails and More button
                return (
                  <div 
                    ref={isPlaylistSession && recommendedTab === 'playlist' ? playlistScrollContainerRef : null}
                    className={isPlaylistSession && recommendedTab === 'playlist' 
                      ? "space-y-0 overflow-y-auto"
                      : "space-y-0"
                    }
                  >
                    {filteredVideos.map((relatedVideo) => {
                      const isMenuOpen = openMenuVideoId === relatedVideo.id;
                      const isCurrentlyPlaying = video?.id === relatedVideo.id;
                      const isPlaylistSessionVideo = isPlaylistSession && recommendedTab === 'playlist';
                      
                      const videoItemContent = (
                        <>
                          {/* Thumbnail - Larger on desktop */}
                          <div className="flex-shrink-0 relative w-40 md:w-64 lg:w-72 aspect-video rounded-lg overflow-hidden bg-surface">
                            {relatedVideo.thumbnailUrl ? (
                              <img
                                ref={(el) => {
                                  imageRefs.current[relatedVideo.id] = el;
                                }}
                                src={relatedVideo.thumbnailUrl}
                                alt={relatedVideo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                crossOrigin="anonymous"
                                onLoad={() => {
                                  // Image loaded - color extraction will happen automatically via effect
                                }}
                                onError={() => {
                                  // Image failed to load - skip color extraction
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-surface">
                                <span className="text-text-secondary text-xs">No thumbnail</span>
                              </div>
                            )}
                            {!relatedVideo.isLive && relatedVideo.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                                {formatDuration(relatedVideo.duration)}
                              </div>
                            )}
                          </div>

                          {/* Video Info - Flex grow with More button */}
                          <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                              <h4 className="text-base font-medium text-text-primary line-clamp-3 group-hover:text-white transition-colors leading-snug">
                                {relatedVideo.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                                <span>{relatedVideo.user?.name || 'Unknown Creator'}</span>
                                {relatedVideo.isLive ? (
                                  <span className="text-white font-semibold">
                                    {relatedVideo.liveViewers ? `${formatViews(relatedVideo.liveViewers)} watching` : 'Live'}
                                  </span>
                                ) : (
                                  <>
                                    <span>•</span>
                                    <span>{formatViews(relatedVideo.views)} views</span>
                                    <span>•</span>
                                    <span 
                                      className="underline decoration-dotted underline-offset-2 cursor-help"
                                      title={formatExactDate(relatedVideo.createdAt)}
                                    >
                                      {formatTimeAgo(relatedVideo.createdAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              {/* Video Description - Only in List Layout */}
                              {!isCardViewActive && relatedVideo.description && (
                                <p className="text-zinc-400 text-xs line-clamp-2 mt-1">
                                  {relatedVideo.description}
                                </p>
                              )}
            </div>
                            
                            {/* More Button - Right side */}
                            <div className={`flex-shrink-0 relative ${isMenuOpen ? 'z-[100]' : ''}`}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuVideoId(isMenuOpen ? null : relatedVideo.id);
                                }}
                                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                                aria-label="More options"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <div
                                  ref={(el) => {
                                    menuRefs.current[relatedVideo.id] = el;
                                  }}
                                  className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-[100]"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ zIndex: 9999 }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRecommendedSaveToPlaylist(relatedVideo.id, relatedVideo.title);
                                      setOpenMenuVideoId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                                  >
                                    Save to playlist
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openShareModal(relatedVideo.id, relatedVideo.title);
                                      setOpenMenuVideoId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                                  >
                                    Share
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openReportModal(relatedVideo.id, relatedVideo.title);
                                      setOpenMenuVideoId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                                  >
                                    Report
                                  </button>
          </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                      
                      return isPlaylistSessionVideo ? (
                        <div
                          key={relatedVideo.id}
                          ref={isCurrentlyPlaying ? activePlaylistVideoRef : null}
                          onClick={() => handleVideoSwitch(relatedVideo.id)}
                          className={`flex gap-4 rounded-lg p-3 transition-all duration-200 group relative w-full cursor-pointer ${
                            isCurrentlyPlaying 
                              ? 'bg-white/10' 
                              : hoveredVideo === relatedVideo.id 
                                ? 'bg-white/10' 
                                : 'bg-transparent'
                          }`}
                          onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                          onMouseLeave={() => setHoveredVideo(null)}
                        >
                          {videoItemContent}
                        </div>
                      ) : (
                        <Link
                          key={relatedVideo.id}
                          href={`/watch/${relatedVideo.id}${listContext && currentPlaylist ? `?playlistId=${currentPlaylist.id}&listContext=true` : ''}`}
                          className={`flex gap-4 rounded-lg p-3 transition-colors duration-200 group relative ${
                            hoveredVideo === relatedVideo.id ? 'bg-white/10' : 'bg-transparent'
                          }`}
                          onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                          onMouseLeave={() => setHoveredVideo(null)}
                        >
                          {videoItemContent}
                        </Link>
                      );
                    })}
                  </div>
                );
              }
            })()}
            </div>
            </div>
          </div>
        
      {/* Right Column - Comments Section or Monetization CTA */}
      {/* Desktop: Always show right column */}
      {/* Mobile: Hide by default, show via overlay */}
      {!hasFullAccess && (
        /* Monetization CTA Section - Replace comments when access restricted */
        <div className="hidden lg:flex w-[400px] flex-shrink-0 flex-col h-full min-h-0 purchase-window-container">
          <MonetizationCTASection 
            video={currentPlaylist && currentPlaylist.price ? {
              // If video belongs to paid playlist, show playlist info
              id: currentPlaylist.id,
              userId: currentPlaylist.creatorId || 'playlist-creator',
              title: currentPlaylist.title,
              description: currentPlaylist.description,
              videoUrl: '',
              views: 0,
              createdAt: new Date(currentPlaylist.lastUpdated),
              updatedAt: new Date(currentPlaylist.lastUpdated),
              type: currentPlaylist.isSubscription ? 'subscription' : 'paid',
              price: parseInt(currentPlaylist.price.replace(/[^\d]/g, '')) || 50000,
              currency: 'UZS',
              user: {
                id: currentPlaylist.creatorId || 'playlist-creator',
                name: currentPlaylist.creatorName,
                profileImageUrl: currentPlaylist.creatorAvatar,
              },
            } : video!}
            isPlaylist={currentPlaylist && currentPlaylist.price ? true : false}
            onPurchase={() => {
              // TODO: Implement purchase flow
              if (currentPlaylist && currentPlaylist.price) {
                console.log('Purchase clicked for playlist:', currentPlaylist.id);
              } else {
                console.log('Purchase clicked for video:', video?.id);
              }
            }}
            onSubscribe={() => {
              // TODO: Implement subscription flow
              console.log('Subscribe clicked for channel:', video?.userId);
            }}
            onPurchaseComplete={() => {
              if (currentPlaylist && currentPlaylist.price) {
                // Purchase playlist - unlock all videos in playlist
                if (typeof window !== 'undefined') {
                  const purchasedPlaylists = JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]');
                  if (!purchasedPlaylists.includes(currentPlaylist.id)) {
                    purchasedPlaylists.push(currentPlaylist.id);
                    localStorage.setItem('purchasedPlaylists', JSON.stringify(purchasedPlaylists));
                    // Dispatch custom event for global sync
                    window.dispatchEvent(new CustomEvent('playlistPurchased', { detail: { playlistId: currentPlaylist.id } }));
                  }
                }
              } else {
                // Purchase individual video
                if (typeof window !== 'undefined' && video) {
                  const purchasedVideos = JSON.parse(localStorage.getItem('purchasedVideos') || '[]');
                  if (!purchasedVideos.includes(video.id)) {
                    purchasedVideos.push(video.id);
                    localStorage.setItem('purchasedVideos', JSON.stringify(purchasedVideos));
                    // Dispatch custom event for global sync
                    window.dispatchEvent(new CustomEvent('videoPurchased', { detail: { videoId: video.id } }));
                  }
                }
              }
              // Refresh page or update state to show comments
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          />
        </div>
      )}
      
      {/* Delete Confirmation Modal for Donations */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-surface rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Delete Donation Message
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Note: Deleting this message will remove it from the public feed, but your donation will not be refunded. Do you wish to proceed?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, commentId: '', isDonation: false })}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteComment(deleteConfirmModal.commentId, true);
                  setDeleteConfirmModal({ isOpen: false, commentId: '', isDonation: false });
                }}
                className="px-4 py-2 text-sm font-medium bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section - Only show if user has access */}
      {hasFullAccess && (
        <div ref={commentsSectionRef} className="hidden lg:flex w-[400px] flex-shrink-0 flex-col h-full overflow-hidden bg-[#1A1A1A] rounded-xl">
          {/* Sticky Header with Tab Navigation or Report Header or Donation Header */}
          <div className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-surface/50">
            {isDonationViewActive ? (
              <div className="flex items-center gap-3 px-3 py-3">
                <button
                  onClick={() => {
                    if (donationStep === 'WALLET_INVOICE_REQUEST' || donationStep === 'WALLET_WAITING' || donationStep === 'SMS_VERIFICATION') {
                      setDonationStep('DONATION');
                    } else {
                      setIsDonationViewActive(false);
                    }
                  }}
                  className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-text-primary">
                  {(donationStep === 'WALLET_INVOICE_REQUEST' || donationStep === 'WALLET_WAITING') && selectedWallet
                    ? `${video?.isLive ? 'Superchat' : 'Donate'} with ${getWalletName(selectedWallet)}`
                    : video?.isLive ? 'Superchat' : 'Donate'}
                </h2>
              </div>
            ) : reportCommentState === 'NONE' ? (
              <div className="flex">
                <button
                  onClick={() => setActiveTab('public')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'public'
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {video?.isLive ? 'Chat' : 'Comments'}
                  {activeTab === 'public' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-secondary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('donated')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'donated'
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {video?.isLive ? 'Superchat' : 'Donations'}
                  {activeTab === 'donated' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-secondary" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-3">
                <button
                  onClick={handleCommentBackReport}
                  className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-text-primary">
                  {reportCommentState === 'WRITE_DETAILS' ? commentReportReason : 'Report'}
                </h2>
              </div>
            )}
        </div>
        
          {/* Comments List or Report Flow or Donation Form - Scrollable */}
          {isDonationViewActive ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {(() => {
                // Step-based conditional rendering for donation flow
                if (donationStep === 'SMS_VERIFICATION') {
                  return renderDonationSMSVerificationView();
                }
                if (donationStep === 'WALLET_INVOICE_REQUEST') {
                  return renderDonationWalletInvoiceRequestView();
                }
                if (donationStep === 'WALLET_WAITING') {
                  return renderDonationWalletWaitingView();
                }
                // Default: Main donation form
                return renderDonationView();
              })()}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1 px-3 py-1 sidebar-scrollbar-hide">
            {reportCommentState === 'NONE' ? (
              /* Standard Comments/Donations View */
              filteredComments.filter(c => !c.deleted || deletedCommentIds.has(c.id)).length === 0 ? (
              <div className="text-center text-text-secondary text-sm py-8">
                No {activeTab === 'donated' ? 'donated ' : ''}comments yet.
              </div>
            ) : (
              filteredComments
                .filter(c => !c.deleted || deletedCommentIds.has(c.id))
                .map((comment) => renderComment(comment))
            )
            ) : (
              /* Comment Report Flow */
              <div className="flex flex-col h-full">
                {/* Step 1: Select Reason */}
                {reportCommentState === 'REASON_SELECT' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto pr-2">
                      <p className="text-sm text-text-secondary mb-4">
                        Tell us why you're reporting this comment
                      </p>
                      <div className="flex flex-col gap-1">
                        {reportReasons.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => handleCommentReportReasonSelect(reason)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-background text-text-primary transition-colors text-left"
                          >
                            <span className="font-medium">{reason}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Write Details */}
                {reportCommentState === 'WRITE_DETAILS' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 flex flex-col">
                      <label className="text-sm font-medium text-text-secondary mb-2 block">
                        Additional details <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        value={commentReportDetails}
                        onChange={(e) => setCommentReportDetails(e.target.value)}
                        placeholder="Provide more information about why you're reporting this comment..."
                        className="flex-1 min-h-[120px] bg-background border-surface text-text-primary placeholder:text-text-secondary resize-none"
                        required
                      />
                    </div>
                    </div>
                  )}

                {/* Step 3: Submission Confirmation */}
                {reportCommentState === 'CONFIRMATION' && (
                  <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                    <div className="flex flex-col items-center gap-4 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
                      <div className="relative">
                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                </div>
                      <div className="text-center">
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                          Report Submitted
                        </h2>
                        <p className="text-sm text-text-secondary">
                          Thank you for your feedback.
                  </p>
                </div>
          </div>
        </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Bottom Footer - Conditional Rendering */}
          {reportCommentState === 'NONE' && !isDonationViewActive ? (
            <>
              {/* Standard Comment Input Bar */}
              <div className="sticky bottom-0 border-t border-surface/50 bg-[#1A1A1A]">
                {/* Reply Preview Bar */}
                {replyingToComment && replyingToId && (
                  <div className="px-3 pt-3 pb-2">
                    <div 
                      onClick={handleScrollToParent}
                      className="flex items-start justify-between gap-3 px-3 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg shadow-lg cursor-pointer hover:bg-zinc-800/90 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        {/* Line 1: Username */}
                        <div className="flex items-center gap-1.5">
                          <Reply className="h-3 w-3 text-text-secondary flex-shrink-0" />
                          <span className="text-xs font-bold text-text-primary truncate">
                            {replyingToComment.username}
                          </span>
                        </div>
                        {/* Line 2: Comment snippet */}
                        <p className="text-xs text-text-secondary line-clamp-1">
                          {replyingToComment.text}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelReply();
                        }}
                        className="p-1 rounded-full hover:bg-zinc-700 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                        aria-label="Cancel reply"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                  </div>
                </div>
              )}
                <div className="pt-3 pb-3 px-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                      <Textarea
                  ref={commentInputRef}
                        placeholder={replyingToId && replyingToComment ? `Reply to ${replyingToComment.username}...` : "Comment"}
                  value={commentText}
                        maxLength={MAX_COMMENT_LENGTH}
                  onChange={(e) => {
                          const newValue = e.target.value;
                          setCommentText(newValue);
                          // Auto-resize
                          autoResizeTextarea(e.target);
                          // Note: replyingToId is now persistent - only cleared by Cancel button
                        }}
                      onKeyDown={(e) => {
                        // Allow Shift+Enter for new line, Enter alone submits
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                          if (commentText.trim() && commentText.length <= MAX_COMMENT_LENGTH) {
                      handleSendComment();
                          }
                        }
                      }}
                      rows={1}
                      className={`w-full border text-text-primary text-sm transition-colors resize-none overflow-hidden outline-none ${
                        commentText.length > MAX_COMMENT_LENGTH
                          ? 'border-red-500'
                          : 'border-zinc-800 hover:border-zinc-600 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:ring-0'
                      } bg-surface`}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {commentText.length > MAX_COMMENT_LENGTH && (
                        <span className="text-xs text-red-400 font-medium">
                          -{commentText.length - MAX_COMMENT_LENGTH}
                        </span>
                      )}
                <Button
                        onClick={() => setIsDonationViewActive(true)}
                  variant="ghost"
                  size="icon"
                        className="rounded-full h-10 w-10 text-text-secondary hover:text-text-primary"
                  title="Add donation"
                >
                        <DollarSign className="h-4 w-4" />
                </Button>
                <Button
                        onClick={handleProcessDonation}
                  size="icon"
                        className="rounded-full bg-accent hover:bg-accent/90 text-white h-10 w-10"
                        disabled={
                          !commentText.trim() || 
                          commentText.length > MAX_COMMENT_LENGTH ||
                          (!!donationAmount && !selectedPaymentMethod) ||
                          (!!donationAmount && parseInt(donationAmount) < MIN_DONATION_AMOUNT) ||
                          (!!donationAmount && selectedPaymentMethod !== null && ['click', 'payme', 'apelsin', 'paynet', 'uzum'].includes(selectedPaymentMethod) && waitingForPayment)
                        }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
                  </div>
                </div>
              </div>
            </>
          ) : reportCommentState === 'WRITE_DETAILS' ? (
            /* Report Action Buttons Footer */
            <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-surface/50 p-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleCommentBackReport}
                  variant="outline"
                  className="flex-1 rounded-full border-surface bg-background hover:bg-surface hover:border-surface"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCommentReportSubmit}
                  disabled={!commentReportDetails.trim()}
                  className="flex-1 rounded-full bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </Button>
              </div>
            </div>
          ) : null}
      </div>
      )}

      {/* Mobile Comments Overlay */}
      {hasFullAccess && isCommentsOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 lg:hidden" ref={mobileCommentsSectionRef}>
          <div className="absolute right-0 top-0 bottom-0 w-[90vw] max-w-[400px] bg-[#1A1A1A] flex flex-col overflow-hidden">
            {/* Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-surface/50">
              <h2 className="text-lg font-semibold text-text-primary">Comments</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCommentsOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Comments Content - Same as desktop but scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Render comments here - same structure as desktop */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
