'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MerchModal from './MerchModal';

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

interface VideoDescriptionProps {
  views: number;
  createdAt: Date;
  description?: string;
  merchItems?: MerchItem[];
}

// Rich description with timecodes and social links (structured content)
const MOCK_DESCRIPTION = `Ushbu videoda biz Twinkle platformasining yangi imkoniyatlarini batafsil ko'rib chiqamiz. Kontent yaratuvchilar uchun qulayliklar, monetizatsiya mexanizmlari va foydalanuvchilar bilan ishlash mantiqi haqida to'xtalamiz. Platformamizning asosiy funksiyalari va kelajakdagi rejalar haqida gap boradi.

Bizning platformamizda siz o'z kontentingizni yuklash, to'lovli kontent yaratish va obunachilar bilan to'g'ridan-to'g'ri aloqa o'rnatishingiz mumkin. Har bir yaratuvchi o'z daromadini nazorat qilish imkoniyatiga ega. 

Quyidagi bo'limlarni ko'rib chiqing:

00:00 - Kirish va platforma tushuntirish
02:45 - Asosiy funksiyalar va imkoniyatlar
05:12 - Monetizatsiya tizimi
08:30 - Foydalanuvchilar bilan ishlash
11:15 - Savollar va javoblar

Ijtimoiy tarmoqlarimiz:
📺 Youtube: https://youtube.com/c/twinkle_official
📸 Instagram: https://instagram.com/twinkle.uz
✉️ Telegram: https://t.me/twinkle_community
🛍 Merchlar: https://tirikchilik.uz/market

Videoni oxirigacha ko'ring va o'z fikringizni izohlarda qoldiring. Har bir donat va obuna loyihaning rivojlanishiga katta hissa qo'shadi!`;

// Function to detect and convert timecodes and URLs to links
const linkifyText = (text: string): ReactNode[] => {
  if (!text) return [];

  const result: ReactNode[] = [];
  let keyIndex = 0;
  let currentIndex = 0;

  // Combined pattern: timecodes (HH:MM or H:MM) and URLs
  const timecodePattern = /\d{1,2}:\d{2}/g;
  const urlPattern = /https?:\/\/[^\s]+/g;

  // Find all matches with their positions
  const matches: Array<{ start: number; end: number; type: 'timecode' | 'url'; text: string }> = [];
  
  let match;
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

  // Remove overlapping matches (prioritize timecodes)
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
    if (match.type === 'timecode') {
      result.push(
        <span
          key={`timecode-${keyIndex++}`}
          className="text-accent font-medium cursor-pointer hover:underline"
          onClick={() => {
            const [minutes, seconds] = match.text.split(':').map(Number);
            const totalSeconds = minutes * 60 + seconds;
            console.log(`Seek to ${totalSeconds} seconds`);
            // TODO: Integrate with video player
          }}
        >
          {match.text}
        </span>
      );
    } else {
      result.push(
        <a
          key={`url-${keyIndex++}`}
          href={match.text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline break-all"
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

  return result.length > 0 ? result : [<span key={0}>{text}</span>];
};

export default function VideoDescription({
  views,
  createdAt,
  description,
  merchItems,
}: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMerch, setSelectedMerch] = useState<MerchItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use mock description if none provided
  const displayDescription = description || MOCK_DESCRIPTION;
  
  // Real merchandise items from Tirikchilik.uz
  const defaultMerchItems: MerchItem[] = [
    {
      id: '1',
      name: 'Yes My Friend',
      creator: 'NmaGap',
      price: '200,000 UZS',
      image: '/assets/merch/NG-YMF-B1.jpg',
      images: [
        '/assets/merch/NG-YMF-B1.jpg',
        '/assets/merch/NG-YMF-B2.png',
        '/assets/merch/NG-YMF-Wh1.jpg',
        '/assets/merch/NG-YMF-Wh2.png',
      ],
      link: 'https://tirikchilik.uz/merch/1929',
      description: 'Matosi: 100% o\'zbek paxtasi Nma Gap stikerlar to\'plami futbolka bilan birga sovg\'a sifatida jo\'natiladi!',
    },
    {
      id: '2',
      name: 'O\'zingni qutqar!',
      creator: 'Konsta',
      price: '150,000 UZS',
      image: '/assets/merch/K-OQ-B-Preview.jpeg',
      images: [
        '/assets/merch/K-OQ-B-Preview.jpeg',
        '/assets/merch/K-OQ-B1.jpeg',
        '/assets/merch/K-OQ-Wh1.jpeg',
      ],
      link: 'https://tirikchilik.uz/merch/67',
      description: 'Matosi: 100% o\'zbek paxtasi Konsta stikerlar to\'plami futbolka bilan birga sovg\'a sifatida jo\'natiladi :)',
    },
    {
      id: '3',
      name: 'Tasodif',
      creator: 'KUNDUZIY',
      price: '150,000 UZS',
      image: '/assets/merch/K-T-B1.jpeg',
      images: [
        '/assets/merch/K-T-B1.jpeg',
        '/assets/merch/K-T-Wh1.jpeg',
      ],
      link: 'https://tirikchilik.uz/merch/155',
      description: 'Bu merchimiz muallifi Kunduziy tomonidan shaxsan o\'ylab topilgan belgilar va ularning barchasi muallifimiz tomondan berilgan ma\'noga ega. Har biringizga tasodifan xilma-xil ma\'noli belgi kombinatsiyasi tushadi.',
    },
    {
      id: '4',
      name: 'Ko\'z Tegmasin',
      creator: 'Akbar Yusupov',
      price: '150,000 UZS',
      image: '/assets/merch/AY-KT-B1.jpeg',
      images: [
        '/assets/merch/AY-KT-B1.jpeg',
        '/assets/merch/AY-KT-Wh1.jpeg',
      ],
      link: 'https://tirikchilik.uz/merch/107',
      description: 'Ткань: 100% узбекская пахта (хлопок) Стикерпак от GoUz🔥 идет в подарок к футболке!',
    },
    {
      id: '5',
      name: 'Surish Kerak',
      creator: 'TROLL.UZ',
      price: '150,000 UZS',
      image: '/assets/merch/TU-SK-Wh-Preview.jpeg',
      images: [
        '/assets/merch/TU-SK-Wh-Preview.jpeg',
        '/assets/merch/TU-SK-Wh1.jpeg',
        '/assets/merch/TU-SK-B1.jpeg',
      ],
      link: 'https://tirikchilik.uz/merch/6',
      description: 'Har qanday o\'zbekni yiliga kamida bir marta qiynidigan tuyg\'u🫠 Matosi: 100% o\'zbek paxtasi Troll.uz stikerlar to\'plami futbolka bilan birga sovg\'a sifatida jo\'natiladi :)',
    },
  ];
  
  const displayMerchItems = merchItems || defaultMerchItems;

  // Format date
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Handle merch card click (open modal)
  const handleMerchCardClick = (item: MerchItem) => {
    setSelectedMerch(item);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMerch(null);
  };

  // Process description text
  const linkifiedContent = linkifyText(displayDescription);

  return (
    <>
      <div className="bg-zinc-900 rounded-xl overflow-hidden transition-all duration-300">
        {/* Header Row with Chip Toggle - Balanced padding */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          {/* Views & Date */}
          <div className="text-sm font-medium text-text-primary">
            {views.toLocaleString()} views • {formattedDate}
          </div>

          {/* Chip-style Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full px-3 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                More
              </>
            )}
          </button>
        </div>

        {/* Description Content */}
        <div className="px-4 pb-3">
          <div 
            className={`text-sm text-text-primary whitespace-pre-wrap transition-all duration-300 font-normal leading-relaxed ${
              !isExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {linkifiedContent}
            {!isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="font-bold text-text-primary hover:text-white transition-colors ml-1"
              >
                ...more
              </button>
            )}
          </div>
        </div>

        {/* Compact Merch Shelf - Only visible when expanded */}
        {isExpanded && displayMerchItems.length > 0 && (
          <div className="px-4 pb-3 border-t border-zinc-800 pt-3 mt-2">
            {/* Header Label - Prominent styling */}
            <h3 className="text-xs font-semibold text-white uppercase tracking-wide mb-3">
              Creator's Merch
            </h3>
            
            {/* Horizontal Scrollable Merch Shelf */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {displayMerchItems.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-[180px] bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-800/80 transition-colors group cursor-pointer"
                  onClick={() => handleMerchCardClick(item)}
                >
                  {/* Product Image - 1:1 Aspect Ratio */}
                  <div className="aspect-square bg-zinc-900 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info - Compact */}
                  <div className="p-2 space-y-1">
                    {/* Title - Single line with truncate */}
                    <h4 className="text-sm font-normal text-text-primary truncate">
                      {item.name}
                    </h4>

                    {/* Price - Subtle */}
                    <p className="text-xs font-medium text-text-primary">
                      {item.price}
                    </p>

                    {/* CTA Button - Opens modal, not external link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMerchCardClick(item);
                      }}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-accent hover:bg-accent/90 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      <span>See details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Less Button - Always at bottom when expanded */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm font-bold text-text-primary hover:text-white transition-colors"
            >
              Show less
            </button>
          </div>
        )}
      </div>

      {/* Merch Modal */}
      <MerchModal
        item={selectedMerch}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  );
}
