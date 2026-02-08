'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/contexts/ModalContext';

const socialNetworks = [
  { name: 'Telegram', icon: 'TG', color: 'bg-[#0088cc]', url: (videoUrl: string) => `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}` },
  { name: 'Instagram', icon: 'IG', color: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]', url: () => `https://www.instagram.com/` },
  { name: 'X', icon: 'X', color: 'bg-black', url: (videoUrl: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}` },
  { name: 'Facebook', icon: 'FB', color: 'bg-[#1877f2]', url: (videoUrl: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}` },
  { name: 'LinkedIn', icon: 'LI', color: 'bg-[#0077b5]', url: (videoUrl: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}` },
  { name: 'Email', icon: '✉', color: 'bg-[#ea4335]', url: (videoUrl: string) => `mailto:?subject=Check out this video&body=${encodeURIComponent(videoUrl)}` },
  { name: 'VK', icon: 'VK', color: 'bg-[#0077ff]', url: (videoUrl: string) => `https://vk.com/share.php?url=${encodeURIComponent(videoUrl)}` },
];

export function ShareModal() {
  const { isModalOpen, modalType, currentVideoId, closeModal } = useModal();
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const shareModalRef = useRef<HTMLDivElement>(null);

  const getVideoUrl = () => {
    if (typeof window !== 'undefined' && currentVideoId) {
      return `${window.location.origin}/watch/${currentVideoId}`;
    }
    return '';
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

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (isModalOpen && modalType === 'SHARE') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, modalType, closeModal]);

  if (!isModalOpen || modalType !== 'SHARE') {
    return null;
  }

  const videoUrl = getVideoUrl();

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div
        ref={shareModalRef}
        className="relative bg-surface border border-surface rounded-lg shadow-xl z-[901] p-5 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeModal}
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
              value={videoUrl}
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
                href={network.url(videoUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeModal}
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
  );
}

