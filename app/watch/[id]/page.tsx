'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, ThumbsUp, ThumbsDown, Share2, Bookmark, MoreVertical, Send, DollarSign, Copy, Check, X, Flag, ArrowLeft, CheckCircle2, Bell, BellOff, Reply, LayoutList, LayoutGrid, Minimize2, MessageSquare } from 'lucide-react';
import { MonetizationCTASection } from '@/components/MonetizationCTASection';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMiniplayer } from '@/contexts/MiniplayerContext';

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
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { setIsCollapsed } = useSidebar();
  const { setCurrentWatchVideo, setIsMiniplayerActive, isMiniplayerActive } = useMiniplayer();
  const [video, setVideo] = useState<Video | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoPlayerProgressRef = useRef<number>(0);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'donated'>('public');
  const [recommendedTab, setRecommendedTab] = useState<'recommendations' | 'playlist' | 'creator' | 'topic'>('recommendations');
  const [isCardViewActive, setIsCardViewActive] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReactions, setCommentReactions] = useState<Record<string, 'NONE' | 'LIKE' | 'DISLIKE'>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [isDonationViewActive, setIsDonationViewActive] = useState(false);
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
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const cardMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // Mock access state functions (matching VideoPlayer logic)
  const hasPurchasedVideo = useCallback((videoId: string): boolean => {
    // TODO: Replace with actual purchase check from API
    return false;
  }, []);

  const isChannelSubscriber = useCallback((channelId: string): boolean => {
    // TODO: Replace with actual subscription check from API
    return false;
  }, []);

  // Determine if user has full access to the video
  const hasFullAccess = useMemo(() => {
    if (!video) return true; // No video data, allow access
    
    const videoType = video.type || 'free';
    
    // Free videos always have access
    if (videoType === 'free') {
      return true;
    }
    
    // Paid content: check if user has purchased
    if (videoType === 'paid') {
      return hasPurchasedVideo(video.id);
    }
    
    // Subscription content: check if user is subscribed to channel
    if (videoType === 'subscription') {
      return isChannelSubscriber(video.userId);
    }
    
    // Default: allow access
    return true;
  }, [video, hasPurchasedVideo, isChannelSubscriber]);

  // Automatically collapse sidebar when entering watch page
  useEffect(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

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
          // Store video in context for centralized player
          setCurrentWatchVideo(data.video);
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
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

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingToId(commentId);
    setCommentText(`${username} `);
    // Focus the textarea field
    setTimeout(() => {
      commentInputRef.current?.focus();
      // Auto-resize after setting text
      if (commentInputRef.current) {
        commentInputRef.current.style.height = 'auto';
        commentInputRef.current.style.height = `${Math.min(commentInputRef.current.scrollHeight, 120)}px`;
      }
    }, 0);
  };

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const maxHeight = 120; // Maximum height in pixels (approximately 5-6 lines)
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  // Format card number with spaces (UzCard/HUMO format: XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date (MM/YY)
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
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

  // Format new card number
  const formatNewCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
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

  // Process donation payment
  const handleProcessDonation = () => {
    if (donationAmount && selectedPaymentMethod) {
      // Validate minimum donation amount
      const amount = parseInt(donationAmount);
      if (amount < MIN_DONATION_AMOUNT) {
        // Could show error message here
        return;
      }
      
      // Check if it's a manual card entry or e-wallet
      const isCard = paymentCategory === 'card';
      const isEwallet = ['click', 'payme', 'apelsin', 'paynet', 'uzum'].includes(selectedPaymentMethod);
      
      if (isEwallet) {
        // For e-wallet, generate invoice first
        handleGenerateInvoice();
        return;
      }
      // For saved cards, proceed directly
      handleSendComment();
      // Close donation view after successful donation
      setIsDonationViewActive(false);
      setDonationAmount('');
      setSelectedPaymentMethod(null);
    } else {
      // No donation, just send regular comment
      handleSendComment();
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
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: (donationAmount && selectedPaymentMethod && isAnonymousDonation) ? 'Anonymous' : 'You',
      username: (donationAmount && selectedPaymentMethod && isAnonymousDonation) ? '@anonymous' : '@you',
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

  // Helper function to render comment text with highlighted @mentions
  const renderCommentText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-400 hover:text-blue-300 cursor-pointer">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
    
    return (
      <div key={comment.id} className={isReply && !isLiveMode ? 'ml-10' : ''}>
        <div className="px-3 py-1.5 rounded-lg bg-transparent">
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
              {/* Username - Clickable in Live Mode */}
              {isLiveMode ? (
                <button
                  onClick={() => handleMentionClick(comment.username)}
                  className="text-sm font-medium text-text-primary truncate hover:text-accent transition-colors cursor-pointer text-left"
                >
                  {comment.username}
                </button>
              ) : (
                <span className="text-sm font-medium text-text-primary truncate">
                  {comment.username}
              </span>
              )}
              {/* Donation Badge (if applicable) */}
              {comment.isDonated && comment.donationAmount && (
                <span className="text-xs font-semibold text-accent flex-shrink-0">
                  {comment.donationAmount.toLocaleString()} UZS
                </span>
              )}
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
                {/* Report Menu */}
                {reportingCommentId === comment.id && reportCommentState === 'NONE' && (
                  <div className="comment-report-menu absolute right-0 top-8 w-32 bg-surface border border-surface rounded-lg shadow-lg z-20 overflow-hidden">
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
                            : 'bg-accent hover:bg-accent/90'
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
                          className="flex-1 rounded-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              ? 'bg-background border border-accent'
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
                            <Check className="h-5 w-5 text-accent" />
                          )}
                        </button>
                        <button
                          onClick={() => setNotificationState('NONE')}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                            notificationState === 'NONE'
                              ? 'bg-background border border-accent'
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
                            <Check className="h-5 w-5 text-accent" />
                          )}
                        </button>
                        <button
                          onClick={() => setNotificationState('PERSONALIZED')}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                            notificationState === 'PERSONALIZED'
                              ? 'bg-background border border-accent'
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
                            <Check className="h-5 w-5 text-accent" />
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
                  <h3 className="font-medium text-text-primary hover:text-accent whitespace-nowrap">
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
                  className="rounded-full h-10 px-4 bg-accent hover:bg-accent/90 transition-all duration-300 flex-shrink-0 whitespace-nowrap"
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
                            <Check className="h-4 w-4 text-accent" />
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

          {/* Video Stats */}
          <div className="text-sm text-text-secondary">
            {video.views.toLocaleString()} views • {new Date(video.createdAt).toLocaleDateString()}
          </div>

          {/* Description */}
            <div className="p-4 bg-surface rounded-lg">
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {video.description || 'No description provided.'}
            </p>
            </div>

          {/* Monetization CTA Section - Replace comments area when access restricted */}
          {!hasFullAccess && (
            <div className="lg:hidden">
              <MonetizationCTASection 
                video={video}
                onPurchase={() => {
                  // TODO: Implement purchase flow
                  console.log('Purchase clicked for video:', video.id);
                }}
                onSubscribe={() => {
                  // TODO: Implement subscription flow
                  console.log('Subscribe clicked for channel:', video.userId);
                }}
              />
          </div>
          )}

          {/* Recommended Videos Section */}
          <div className="mt-6 w-full max-w-full">
            {/* Tab Navigation - Sticky */}
            <div className="sticky top-0 z-30 bg-[#0A0A0A] pt-2 pb-4 mb-4 -mt-2">
              <div className="flex items-center justify-between gap-4 border-b border-surface/50 w-full">
                <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
                  <button
                    onClick={() => setRecommendedTab('recommendations')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      recommendedTab === 'recommendations'
                        ? 'border-accent text-text-primary font-semibold'
                        : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                    }`}
                  >
                    Recommended
                  </button>
                  <button
                    onClick={() => setRecommendedTab('playlist')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      recommendedTab === 'playlist'
                        ? 'border-accent text-text-primary font-semibold'
                        : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                    }`}
                  >
                    From Playlist
                  </button>
                  <button
                    onClick={() => setRecommendedTab('creator')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      recommendedTab === 'creator'
                        ? 'border-accent text-text-primary font-semibold'
                        : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                    }`}
                  >
                    {video.user?.name || 'Creator'}
                  </button>
                  <button
                    onClick={() => setRecommendedTab('topic')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      recommendedTab === 'topic'
                        ? 'border-accent text-text-primary font-semibold'
                        : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                    }`}
                  >
                    Topic Related
                  </button>
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
              
              if (recommendedTab === 'recommendations') {
                // Show general recommendations (exclude current video)
                filteredVideos = relatedVideos.filter(v => v.id !== video?.id).slice(0, 10);
              } else if (recommendedTab === 'playlist') {
                // Mock playlist videos (same category or similar)
                filteredVideos = relatedVideos
                  .filter(v => v.id !== video?.id && v.category === video?.category)
                  .slice(0, 8);
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
                // Grid/Card View
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideos.map((relatedVideo) => (
                      <Link
                        key={relatedVideo.id}
                        href={`/watch/${relatedVideo.id}`}
                        className="flex flex-col hover:bg-surface/30 rounded-lg overflow-hidden transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface">
                          {relatedVideo.thumbnailUrl ? (
                            <img
                              src={relatedVideo.thumbnailUrl}
                              alt={relatedVideo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface">
                              <span className="text-text-secondary text-xs">No thumbnail</span>
                            </div>
                          )}
                          {relatedVideo.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                              {Math.floor(relatedVideo.duration / 60)}:{(relatedVideo.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex flex-col gap-1 p-2">
                          <h4 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <p className="text-xs text-text-secondary">
                            {relatedVideo.user?.name || 'Unknown Creator'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {relatedVideo.views.toLocaleString()} views
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              } else {
                // List View (Vertical)
                return (
                  <div className="space-y-3">
                    {filteredVideos.map((relatedVideo) => (
                      <Link
                        key={relatedVideo.id}
                        href={`/watch/${relatedVideo.id}`}
                        className="flex gap-3 hover:bg-surface/30 rounded-lg p-2 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 relative w-[168px] h-[94px] rounded-lg overflow-hidden bg-surface">
                          {relatedVideo.thumbnailUrl ? (
                            <img
                              src={relatedVideo.thumbnailUrl}
                              alt={relatedVideo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface">
                              <span className="text-text-secondary text-xs">No thumbnail</span>
                            </div>
                          )}
                          {relatedVideo.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                              {Math.floor(relatedVideo.duration / 60)}:{(relatedVideo.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <h4 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <p className="text-xs text-text-secondary">
                            {relatedVideo.user?.name || 'Unknown Creator'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {relatedVideo.views.toLocaleString()} views
                          </p>
                        </div>
                      </Link>
                    ))}
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
        <div className="hidden lg:flex w-[400px] flex-shrink-0 flex-col h-full">
          <MonetizationCTASection 
            video={video}
            onPurchase={() => {
              // TODO: Implement purchase flow
              console.log('Purchase clicked for video:', video.id);
            }}
            onSubscribe={() => {
              // TODO: Implement subscription flow
              console.log('Subscribe clicked for channel:', video.userId);
            }}
          />
        </div>
      )}
      
      {/* Comments Section - Only show if user has access */}
      {hasFullAccess && (
        <div className="hidden lg:flex w-[400px] flex-shrink-0 flex-col h-full overflow-hidden bg-[#1A1A1A] rounded-xl">
          {/* Sticky Header with Tab Navigation or Report Header or Donation Header */}
          <div className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-surface/50">
            {isDonationViewActive ? (
              <div className="flex items-center gap-3 px-3 py-3">
                <button
                  onClick={() => {
                    if (isAddingCard) {
                      setIsAddingCard(false);
                      setIsVerificationVerified(false);
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
                  {isAddingCard ? 'Add Card' : 'Donation / Superchat'}
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
          {isDonationViewActive && isAddingCard ? (
              /* Add Card View - Full View within Sidebar */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex flex-col h-full p-4">
                  {/* Add Card Form - All Fields on One Screen */}
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* 1. Name for Card */}
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

                    {/* 2. Card Number */}
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
                          // Auto-detect card type
                          if (formatted.replace(/\s/g, '').length >= 6) {
                            const detectedType = detectCardType(formatted);
                            setCardType(detectedType);
                            // Reset SMS sent state when card type changes
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

                    {/* 3. Expiration Date */}
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

                    {/* 4. Verification (Combined/Dynamic) */}
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
                              // Two-step SMS flow for local cards
                              if (!smsSent) {
                                // Step 1: Send SMS
                                setPaymentProcessing(true);
                                setTimeout(() => {
                                  setSmsSent(true);
                                  setPaymentProcessing(false);
                                }, 1000);
                              } else {
                                // Step 2: Verify SMS code
                                if (smsCode.length === 6) {
                                  setIsVerificationVerified(true);
                                  setPaymentProcessing(true);
                                  setTimeout(() => {
                                    setPaymentProcessing(false);
                                  }, 500);
                                }
                              }
                            } else {
                              // Single-step CVV/CVC verification for international cards
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
                          className="h-10 py-0 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
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

                  {/* Save and Verify Button - Fixed Bottom */}
                  <div className="flex-shrink-0 border-t border-surface/30 pt-4 mt-4">
                    <Button
                      onClick={handleCardVerification}
                      disabled={
                        !cardName.trim() ||
                        newCardNumber.replace(/\s/g, '').length !== 16 ||
                        newCardExpiry.length !== 5 ||
                        !isVerificationVerified ||
                        paymentProcessing
                      }
                      className="w-full h-10 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Kartani Saqlash
                    </Button>
                  </div>
                </div>
              </div>
          ) : isDonationViewActive ? (
              /* Full Donation Form View */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex flex-col h-full p-4">
                  {/* 1. Amount and Message Block (Top Priority) */}
                  {/* 1.1 Donation Amount & Anonymity (Top Fixed) */}
                  <div className="flex-shrink-0 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder={`Minimal miqdor: ${MIN_DONATION_AMOUNT.toLocaleString()} UZS`}
                        value={donationAmount}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/\D/g, '');
                          setDonationAmount(numericValue);
                        }}
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
                        className="w-full bg-surface border-surface text-text-primary h-10"
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

                {/* 1.2 Message Input (Flexible/Stretch Element - Fills Remaining Space) */}
                <div className="flex-1 flex flex-col min-h-0 mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2 flex-shrink-0">
                    Message (Optional)
                  </label>
                  <div className="flex-1 flex flex-col min-h-0">
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
                      className="w-full h-full border border-surface text-text-primary text-sm resize-none bg-surface flex-1"
                    />
                    {commentText.length > MAX_COMMENT_LENGTH && (
                      <span className="text-xs text-red-400 font-medium mt-1 block flex-shrink-0">
                        -{commentText.length - MAX_COMMENT_LENGTH}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Payment Methods Block (Middle/Bottom) */}
                <div className="flex-shrink-0 space-y-3 mb-4">
                  {/* 2.1 Saved/Add Card List */}
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
                            setPaymentCategory('card');
                            setWaitingForPayment(false);
                            setInvoiceGenerated(false);
                            setOpenCardMenuId(null);
                          }}
                          className={`relative w-full px-3 py-3 rounded-md border transition-colors h-14 cursor-pointer ${
                            selectedPaymentMethod === card.id && paymentCategory === 'card'
                              ? 'border-accent bg-accent/10'
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
                                  // Clear selection if deleted card was selected
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
                          setIsAddingCard(true);
                          setAddCardStep('name');
                          setCardName('');
                          setNewCardNumber('');
                          setNewCardExpiry('');
                          setNewCardCVC('');
                          setSmsCode('');
                          setCardType(null);
                          setIsVerificationVerified(false);
                          setSmsSent(false);
                        }}
                        className="w-full px-2 py-2 rounded-md border border-dashed border-accent/50 bg-transparent hover:bg-accent/10 transition-colors text-xs text-accent hover:text-accent/80 font-medium flex items-center justify-center gap-1 h-10"
                      >
                        <span>+</span>
                        <span>Add card</span>
                      </button>
                    </div>
                  </div>

                  {/* 2.2 Invoices */}
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Invoices</h3>
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
                              setSelectedPaymentMethod(wallet.id);
                              setPaymentCategory('ewallet');
                              setWaitingForPayment(false);
                              setInvoiceGenerated(false);
                            }}
                            className={`flex-shrink-0 w-24 px-3 py-3 rounded-md border transition-colors h-14 flex flex-col items-center justify-center gap-1 ${
                              selectedPaymentMethod === wallet.id && paymentCategory === 'ewallet'
                                ? 'border-accent bg-accent/10'
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

                {/* 3. Submission (Fixed Bottom) */}
                <div className="flex-shrink-0 border-t border-surface/30 pt-4">
                  {/* 3.1 Send Donation Button */}
                  <Button
                    onClick={handleProcessDonation}
                    disabled={
                      !donationAmount ||
                      parseInt(donationAmount) < MIN_DONATION_AMOUNT ||
                      !selectedPaymentMethod ||
                      waitingForPayment
                    }
                    className="w-full h-10 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {waitingForPayment 
                      ? `Waiting for payment on ${getInvoiceSystemName()}`
                      : paymentCategory === 'ewallet' && selectedPaymentMethod && ['click', 'payme', 'apelsin', 'paynet', 'uzum'].includes(selectedPaymentMethod)
                        ? `Pay with ${getInvoiceSystemName()}`
                        : 'Send Donation'
                    }
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1 px-3 py-1 sidebar-scrollbar-hide">
            {reportCommentState === 'NONE' ? (
              /* Standard Comments/Donations View */
              filteredComments.length === 0 ? (
              <div className="text-center text-text-secondary text-sm py-8">
                No {activeTab === 'donated' ? 'donated ' : ''}comments yet.
              </div>
            ) : (
              filteredComments.map((comment) => renderComment(comment))
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
              <div className="sticky bottom-0 border-t border-surface/50 pt-3 pb-3 px-3 bg-[#1A1A1A]">
                <div className="flex items-end gap-2">
                  <div className="flex-1 min-w-0">
                    <Textarea
                  ref={commentInputRef}
                  placeholder={replyingToId ? "Reply to comment..." : "Comment"}
                  value={commentText}
                      maxLength={MAX_COMMENT_LENGTH}
                  onChange={(e) => {
                        const newValue = e.target.value;
                        setCommentText(newValue);
                        // Auto-resize
                        autoResizeTextarea(e.target);
                    // Clear replyingToId if user deletes the @ mention
                        if (replyingToId && !newValue.startsWith('@')) {
                      setReplyingToId(null);
                    }
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
                      className={`w-full border text-text-primary text-sm transition-colors resize-none overflow-hidden ${
                        commentText.length > MAX_COMMENT_LENGTH
                          ? 'border-red-500'
                          : 'border-surface'
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
                        className="rounded-full bg-accent hover:bg-accent/90 h-10 w-10"
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
                  className="flex-1 rounded-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/80 z-50 lg:hidden">
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
