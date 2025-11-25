'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video } from '@/types';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, ThumbsUp, ThumbsDown, Share2, Bookmark, MoreVertical, Send, DollarSign, Copy, Check, X, Flag, ArrowLeft, CheckCircle2, Bell, BellOff, Reply } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

interface Comment {
  id: string;
  userId: string;
  userName: string;
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
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'donated'>('public');
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReactions, setCommentReactions] = useState<Record<string, 'NONE' | 'LIKE' | 'DISLIKE'>>({});
  const [commentText, setCommentText] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [showDonationInput, setShowDonationInput] = useState(false);
  const [isAnonymousDonation, setIsAnonymousDonation] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
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
                text: '@Sarah Martinez Exactly! Those examples made everything click for me too.',
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
                text: '@Jessica Thompson Right? I\'ve been trying to explain this to my team using those same examples.',
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
            text: '@Michael Chen I had the same reaction! Subscribed immediately.',
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
                text: '@James Anderson Welcome to the community! Glad you enjoyed it.',
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
                text: '@David Kim That\'s exactly what makes it so effective!',
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
            text: '@Alexandra Brown I completely agree. This channel has been a game-changer for me too!',
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
                text: '@Maria Garcia So glad to hear that! The community here is amazing.',
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
            text: '@Christopher Taylor Couldn\'t agree more. This channel is a gem!',
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
                text: '@Ryan Johnson Absolutely! The value is unmatched.',
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
            text: '@Maria Garcia The educational value is incredible. Well deserved support!',
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
            text: '@Daniel White The insights keep coming with each rewatch. Amazing content!',
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
                text: '@Kevin Moore Exactly! Every watch reveals something new. That\'s quality content.',
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
          
            // Load related videos
          const relatedResponse = await fetch('/api/videos?limit=10');
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedVideos(relatedData.videos.filter((v: Video) => v.id !== params.id).slice(0, 5));
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
  }, [params.id]);

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

  const handleReplyClick = (commentId: string, userName: string) => {
    setReplyingToId(commentId);
    setCommentText(`@${userName} `);
    // Focus the input field
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 0);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: (showDonationInput && donationAmount && isAnonymousDonation) ? 'Anonymous' : 'You',
      text: commentText,
      timestamp: new Date(),
      likes: 0,
      dislikes: 0,
      isDonated: showDonationInput && donationAmount ? true : false,
      donationAmount: showDonationInput && donationAmount ? parseInt(donationAmount) : undefined,
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
    
    setCommentText('');
    setDonationAmount('');
    setShowDonationInput(false);
    setIsAnonymousDonation(false); // Reset to default OFF state
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

  const filteredComments = activeTab === 'donated' 
    ? comments.filter(c => c.isDonated)
    : comments;

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

  // Function to render a single comment item (no nested replies rendering)
  const renderCommentItem = (comment: Comment, isReply: boolean = false) => {
    const avatarSize = isReply ? 'w-6 h-6' : 'w-8 h-8';
    const iconSize = isReply ? 'h-3 w-3' : 'h-4 w-4';
    const textSize = isReply ? 'text-xs' : 'text-sm';
    
    return (
      <div key={comment.id} className={isReply ? 'ml-10 pl-4 border-l border-surface/30 bg-white/5 rounded-r-lg' : ''}>
        <div className={`p-3 rounded-lg bg-transparent ${isReply ? 'py-1.5' : ''}`}>
          {/* Top Row: Avatar, Username (Left) | More Button (Right) */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Avatar */}
              {comment.userName === 'Anonymous' ? (
                <div className={`${avatarSize} rounded-full bg-surface flex items-center justify-center flex-shrink-0`}>
                  <User className={`${iconSize} text-text-secondary`} />
                </div>
              ) : comment.userAvatar ? (
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  className={`${avatarSize} rounded-full object-cover flex-shrink-0`}
                />
              ) : (
                <div className={`${avatarSize} rounded-full bg-surface flex items-center justify-center flex-shrink-0`}>
                  <User className={`${iconSize} text-text-secondary`} />
                </div>
              )}
              {/* Username */}
              <span className={`${textSize} font-medium text-text-primary truncate`}>
                {comment.userName}
              </span>
              {/* Donation Badge (if applicable) */}
              {comment.isDonated && comment.donationAmount && (
                <span className="text-xs font-semibold text-accent flex-shrink-0">
                  {comment.donationAmount.toLocaleString()} UZS
                </span>
              )}
            </div>
            {/* More Button - Only show for top-level comments */}
            {!isReply && (
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
            )}
          </div>

          {/* Middle Section: Comment Text */}
          <p className={`${textSize} text-text-primary ${isReply ? 'mb-1' : 'mb-2'} whitespace-pre-wrap break-words`}>
            {renderCommentText(comment.text)}
          </p>

          {/* Bottom Row: Like/Dislike, Reply Buttons */}
          <div className={`flex items-center ${isReply ? 'gap-2' : 'gap-3'}`}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCommentLike(comment.id);
              }}
              className={`flex items-center gap-1 ${textSize} transition-colors cursor-pointer ${
                commentReactions[comment.id] === 'LIKE'
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ThumbsUp 
                className={`${iconSize} ${
                  commentReactions[comment.id] === 'LIKE' ? 'fill-current' : ''
                }`}
              />
              {!isReply && <span>{comment.likes}</span>}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCommentDislike(comment.id);
              }}
              className={`flex items-center gap-1 ${textSize} transition-colors cursor-pointer ${
                commentReactions[comment.id] === 'DISLIKE'
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ThumbsDown 
                className={`${iconSize} ${
                  commentReactions[comment.id] === 'DISLIKE' ? 'fill-current' : ''
                }`}
              />
              {!isReply && <span>{comment.dislikes || 0}</span>}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleReplyClick(comment.id, comment.userName);
              }}
              className={`flex items-center ${textSize} text-text-secondary hover:text-text-primary transition-colors cursor-pointer`}
            >
              <Reply className={iconSize} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main function to render a comment with all its flattened replies
  const renderComment = (comment: Comment) => {
    const allReplies = comment.replies && comment.replies.length > 0 
      ? flattenReplies(comment.replies) 
      : [];
    
    return (
      <div key={comment.id}>
        {/* Render the main comment */}
        {renderCommentItem(comment, false)}
        
        {/* Render all replies at the same indentation level */}
        {allReplies.length > 0 && (
          <div className="mt-0.5 space-y-1">
            {allReplies.map((reply) => renderCommentItem(reply, true))}
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
    <div className="w-full h-[calc(100vh-4rem)] flex gap-4 p-3 overflow-hidden">
      {/* Left Column - Video Player and Info */}
      <div className="flex-grow space-y-4 min-w-0 overflow-y-auto">
          {/* Video Player Container with Share Modal */}
          <div className="relative">
            <VideoPlayer videoUrl={video.videoUrl} autoPlay thumbnailUrl={video.thumbnailUrl || undefined} />
            
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
                {/* Backdrop Overlay */}
                <div 
                  className="absolute inset-0 bg-black/70 rounded-lg"
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

            {/* Notifications Modal - Centered in Video Player Area */}
            {isNotificationsModalOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg">
                {/* Backdrop Overlay */}
                <div 
                  className="absolute inset-0 bg-black/70 rounded-lg"
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
            </div>
            
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
                  {Math.floor(Math.random() * 100000).toLocaleString()} subscribers
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
          </div>
        
      {/* Right Column - Comments Section */}
      <div className="w-[400px] flex-shrink-0 flex flex-col h-full overflow-hidden bg-[#1A1A1A] rounded-t-xl">
          {/* Sticky Header with Tab Navigation or Report Header */}
          <div className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-surface/50">
            {reportCommentState === 'NONE' ? (
              <div className="flex">
                <button
                  onClick={() => setActiveTab('public')}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'public'
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Comments
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
                  Donations
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
        
          {/* Comments List or Report Flow - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 px-3 py-2 sidebar-scrollbar-hide">
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

          {/* Bottom Footer - Conditional Rendering */}
          {reportCommentState === 'NONE' ? (
            /* Standard Comment Input Bar */
            <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-surface/50 pt-3 pb-3 px-3">
              {showDonationInput && (
                <div className="mb-2 space-y-2">
                  <Input
                    type="number"
                    placeholder="Donation amount (UZS)"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="bg-surface border-surface text-text-primary"
                  />
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-text-secondary flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymousDonation}
                        onChange={(e) => setIsAnonymousDonation(e.target.checked)}
                        className="w-4 h-4 rounded border-surface bg-surface text-accent focus:ring-accent focus:ring-offset-0 focus:ring-2"
                      />
                      <span>Send Anonymously</span>
                    </label>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  ref={commentInputRef}
                  type="text"
                  placeholder={replyingToId ? "Reply to comment..." : "Comment"}
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    // Clear replyingToId if user deletes the @ mention
                    if (replyingToId && !e.target.value.startsWith('@')) {
                      setReplyingToId(null);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  className="flex-1 bg-surface border-surface text-text-primary"
                />
                <Button
                  onClick={() => setShowDonationInput(!showDonationInput)}
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${
                    showDonationInput
                      ? 'bg-accent/20 text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title="Add donation"
                >
                  <DollarSign className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleSendComment}
                  size="icon"
                  className="rounded-full bg-accent hover:bg-accent/90"
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
    </div>
  );
}
