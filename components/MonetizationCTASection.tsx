'use client';

import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Lock, Crown, DollarSign, Shield, Zap, Star } from 'lucide-react';

interface MonetizationCTASectionProps {
  video: Video;
  onPurchase?: () => void;
  onSubscribe?: () => void;
}

export function MonetizationCTASection({ video, onPurchase, onSubscribe }: MonetizationCTASectionProps) {
  const videoType = video.type || 'free';
  const isPaid = videoType === 'paid';
  const isSubscription = videoType === 'subscription';

  return (
    <div className="w-full bg-gradient-to-br from-surface via-surface to-background border border-surface/50 rounded-xl p-6 md:p-8 shadow-lg">
      <div className="max-w-xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            {isPaid ? (
              <Lock className="h-8 w-8 text-accent" />
            ) : isSubscription ? (
              <Crown className="h-8 w-8 text-accent" />
            ) : (
              <Lock className="h-8 w-8 text-accent" />
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            {isPaid 
              ? 'Premium Content'
              : isSubscription
              ? 'Exclusive Membership'
              : 'Access Restricted'}
          </h2>
          <p className="text-text-secondary text-sm">
            {isPaid
              ? `Unlock full access to this video`
              : isSubscription
              ? `Join ${video.user?.name || 'this channel'} for exclusive content`
              : 'Purchase or subscribe to access this content'}
          </p>
        </div>

        {/* Pricing Section */}
        <div className="bg-background/50 border border-surface rounded-lg p-5 mb-6">
          {isPaid ? (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-2 mb-2">
                <DollarSign className="h-6 w-6 text-accent" />
                <span className="text-4xl font-bold text-text-primary">
                  {video.price?.toLocaleString(undefined, { 
                    style: 'currency', 
                    currency: video.currency || 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  }) || '$4.99'}
                </span>
              </div>
              <p className="text-text-secondary text-sm">One-time payment • Lifetime access</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>Instant access</span>
                </div>
              </div>
            </div>
          ) : isSubscription ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-6 w-6 text-accent" />
                  <span className="text-xl font-bold text-text-primary">Channel Membership</span>
                </div>
                <p className="text-text-secondary text-sm">Monthly subscription • Cancel anytime</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-surface">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Member Videos</p>
                    <p className="text-xs text-text-secondary">Exclusive content</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Early Access</p>
                    <p className="text-xs text-text-secondary">Watch first</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Badges & Perks</p>
                    <p className="text-xs text-text-secondary">Special benefits</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Support Creator</p>
                    <p className="text-xs text-text-secondary">Help grow</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* CTA Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            if (isPaid && onPurchase) {
              onPurchase();
            } else if (isSubscription && onSubscribe) {
              onSubscribe();
            }
          }}
          className="w-full bg-accent hover:bg-accent/90 text-white rounded-full py-6 text-base font-semibold shadow-lg shadow-accent/20 transition-all duration-200 hover:shadow-xl hover:shadow-accent/30"
        >
          {isPaid ? (
            <>
              <DollarSign className="h-5 w-5 mr-2 inline" />
              Purchase for {video.price?.toLocaleString(undefined, { 
                style: 'currency', 
                currency: video.currency || 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }) || '$4.99'}
            </>
          ) : isSubscription ? (
            <>
              <Crown className="h-5 w-5 mr-2 inline" />
              Subscribe Now
            </>
          ) : (
            'Get Access'
          )}
        </Button>

        {/* Trust Indicators */}
        <div className="mt-6 pt-6 border-t border-surface/50">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💳</span>
              <span>Cards Accepted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>⚡</span>
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}