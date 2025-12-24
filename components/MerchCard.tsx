'use client';

import { ExternalLink } from 'lucide-react';

interface MerchItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  link: string;
}

interface MerchCardProps {
  item: MerchItem;
}

export default function MerchCard({ item }: MerchCardProps) {
  return (
    <div className="flex-shrink-0 w-56 bg-zinc-800/50 rounded-lg border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors group">
      {/* Product Image */}
      <div className="aspect-square bg-zinc-900 relative overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h4 className="text-sm font-medium text-text-primary line-clamp-2">
          {item.title}
        </h4>

        {/* Price */}
        <p className="text-base font-bold text-text-primary">
          {item.price.toLocaleString()} UZS
        </p>

        {/* Buy Button */}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-md transition-colors"
        >
          Buy on Tirikchilik
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

