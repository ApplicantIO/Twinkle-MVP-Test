'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface MerchItem {
  id: string;
  name: string;
  creator: string;
  price: string;
  image: string;
  images?: string[]; // Multiple images for gallery
  link: string;
  description?: string;
}

interface MerchModalProps {
  item: MerchItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MerchModal({ item, isOpen, onClose }: MerchModalProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset image index when item changes
  useEffect(() => {
    if (item) {
      setSelectedImageIndex(0);
      setIsDescriptionExpanded(false);
      // Reset scroll position when item changes
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }
  }, [item]);

  // Handle scroll event to sync with dot indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const currentIndex = Math.round(scrollLeft / containerWidth);
      setSelectedImageIndex(currentIndex);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [item]);

  if (!isOpen || !item) return null;

  // Get all images (use images array if available, otherwise use single image)
  const allImages = item.images && item.images.length > 0 ? item.images : [item.image];
  const hasMultipleImages = allImages.length > 1;

  // Use provided description or default
  const fullDescription = item.description || `This is an official product from ${item.creator}. Made from high-quality materials and designed for long-lasting use. Delivery available throughout Uzbekistan.`;

  // Smart truncation logic: Show toggle if >100 words OR >1 paragraph
  const wordCount = fullDescription.split(/\s+/).filter(word => word.length > 0).length;
  const paragraphCount = fullDescription.split(/\n\n/).filter(p => p.trim().length > 0).length;
  const shouldShowToggle = wordCount > 100 || paragraphCount > 1;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with blur - Full screen coverage */}
      <div className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md" />

      {/* Modal Content - Two-column layout on desktop, stacked on mobile */}
      <div
        className="relative w-full h-full md:h-auto md:max-h-[85vh] md:max-w-4xl md:rounded-2xl bg-zinc-900 overflow-hidden shadow-2xl flex flex-col md:flex-row md:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - High contrast, easy to hit */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white hover:text-white transition-colors shadow-lg"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Column: Product Image Gallery with Native Horizontal Scroll */}
        <div className="w-full md:w-1/2 bg-zinc-800 relative flex-shrink-0 flex flex-col">
          {/* Scrollable Image Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 relative flex items-center bg-zinc-900 min-h-[300px] md:min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
            }}
          >
            {allImages.map((image, index) => (
              <div
                key={index}
                className="w-full h-full flex-shrink-0 flex items-center justify-center"
                style={{
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                }}
              >
                <img
                  src={image}
                  alt={`${item.name} - View ${index + 1}`}
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Dot Indicators (pagination) - Enhanced with container frame */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 flex gap-2">
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex
                        ? 'bg-accent'
                        : 'bg-zinc-400'
                    }`}
                    aria-label={`Image ${index + 1} of ${allImages.length}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Product Details */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto max-h-[60vh] md:max-h-none">
          <div className="space-y-4 flex-1">
            {/* Creator Tag - First, muted */}
            <div className="text-sm text-zinc-400">
              By {item.creator}
            </div>

            {/* Product Title - Large, Bold */}
            <h2 className="text-2xl font-bold text-text-primary pr-8">
              {item.name}
            </h2>

            {/* Price - Prominent display */}
            <p className="text-xl font-semibold text-text-primary">
              {item.price}
            </p>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Description
              </h3>
              <div className="text-sm text-text-primary font-normal leading-relaxed">
                <div className={!isDescriptionExpanded && shouldShowToggle ? 'line-clamp-3' : ''}>
                  {fullDescription}
                </div>
                {shouldShowToggle && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Final CTA Button - Sticky at bottom */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-lg transition-colors"
            >
              <span>Buy on Tirikchilik</span>
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
