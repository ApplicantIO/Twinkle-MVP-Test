'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMiniplayer, MiniplayerCorner } from '@/contexts/MiniplayerContext';

const MINIPLAYER_WIDTH = 320;
const MINIPLAYER_HEIGHT = 180;
const EDGE_PADDING = 16;
const DRAG_THRESHOLD_PX = 5;
const DEFAULT_HEADER_HEIGHT = 64;

function getCornerPosition(corner: MiniplayerCorner, headerHeight: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const topY = headerHeight + EDGE_PADDING;
  switch (corner) {
    case 'top-left':
      return { x: EDGE_PADDING, y: topY };
    case 'top-right':
      return { x: w - MINIPLAYER_WIDTH - EDGE_PADDING, y: topY };
    case 'bottom-left':
      return { x: EDGE_PADDING, y: h - MINIPLAYER_HEIGHT - EDGE_PADDING };
    case 'bottom-right':
    default:
      return { x: w - MINIPLAYER_WIDTH - EDGE_PADDING, y: h - MINIPLAYER_HEIGHT - EDGE_PADDING };
  }
}

function snapToNearestCorner(
  centerX: number,
  centerY: number,
  headerHeight: number
): MiniplayerCorner {
  if (typeof window === 'undefined') return 'bottom-right';
  const w = window.innerWidth;
  const h = window.innerHeight;
  const topCenterY = headerHeight + EDGE_PADDING + MINIPLAYER_HEIGHT / 2;
  const bottomCenterY = h - EDGE_PADDING - MINIPLAYER_HEIGHT / 2;

  const distances = {
    'top-left': Math.hypot(centerX - EDGE_PADDING - MINIPLAYER_WIDTH / 2, centerY - topCenterY),
    'top-right': Math.hypot(centerX - (w - EDGE_PADDING - MINIPLAYER_WIDTH / 2), centerY - topCenterY),
    'bottom-left': Math.hypot(centerX - EDGE_PADDING - MINIPLAYER_WIDTH / 2, centerY - bottomCenterY),
    'bottom-right': Math.hypot(centerX - (w - EDGE_PADDING - MINIPLAYER_WIDTH / 2), centerY - bottomCenterY),
  };

  let nearest: MiniplayerCorner = 'bottom-right';
  let minDist = Infinity;
  for (const [corner, dist] of Object.entries(distances)) {
    if (dist < minDist) {
      minDist = dist;
      nearest = corner as MiniplayerCorner;
    }
  }
  return nearest;
}

interface DraggableMiniplayerContainerProps {
  children: React.ReactNode;
}

export function DraggableMiniplayerContainer({ children }: DraggableMiniplayerContainerProps) {
  const { miniplayerCorner, setMiniplayerCorner } = useMiniplayer();
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [, setResizeTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const hasDragStartedRef = useRef(false);

  // Measure header height on mount and when it resizes
  useEffect(() => {
    const measureHeader = () => {
      const header = document.getElementById('app-header');
      if (header) {
        const rect = header.getBoundingClientRect();
        setHeaderHeight(rect.height);
      }
    };
    measureHeader();
    const header = document.getElementById('app-header');
    if (header) {
      const observer = new ResizeObserver(measureHeader);
      observer.observe(header);
      return () => observer.disconnect();
    }
  }, []);

  const minTop = headerHeight + EDGE_PADDING;
  const cornerPos = getCornerPosition(miniplayerCorner, headerHeight);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  dragOffsetRef.current = dragOffset;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input') ||
      (e.target as HTMLElement).closest('a') ||
      (e.target as HTMLElement).closest('[role="button"]') ||
      (e.target as HTMLElement).closest('input[type="range"]')
    ) {
      return;
    }
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    hasDragStartedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { x: cornerPos.x, y: cornerPos.y };
    setDragOffset({ x: 0, y: 0 });
  }, [miniplayerCorner]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isPointerDownRef.current) return;
    let dx = e.clientX - pointerStartRef.current.x;
    let dy = e.clientY - pointerStartRef.current.y;
    const startY = positionStartRef.current.y;
    const newTop = startY + dy;
    const header = document.getElementById('app-header');
    const headerH = header ? header.getBoundingClientRect().height : DEFAULT_HEADER_HEIGHT;
    const minTopNow = headerH + EDGE_PADDING;
    if (newTop < minTopNow) {
      dy = minTopNow - startY;
    }
    const distance = Math.hypot(dx, dy);
    if (!hasDragStartedRef.current && distance > DRAG_THRESHOLD_PX) {
      hasDragStartedRef.current = true;
      setIsDragging(true);
    }
    if (hasDragStartedRef.current) {
      setDragOffset({ x: dx, y: dy });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const didDrag = hasDragStartedRef.current;
    isPointerDownRef.current = false;
    hasDragStartedRef.current = false;
    setIsDragging(false);
    if (!didDrag) return;
    const off = dragOffsetRef.current;
    let newX = positionStartRef.current.x + off.x;
    let newY = positionStartRef.current.y + off.y;
    const header = document.getElementById('app-header');
    const headerH = header ? header.getBoundingClientRect().height : DEFAULT_HEADER_HEIGHT;
    const minTopNow = headerH + EDGE_PADDING;
    newY = Math.max(minTopNow, newY);
    const centerX = newX + MINIPLAYER_WIDTH / 2;
    const centerY = newY + MINIPLAYER_HEIGHT / 2;
    const snapped = snapToNearestCorner(centerX, centerY, headerH);
    setIsAnimating(true);
    setMiniplayerCorner(snapped);
    setDragOffset({ x: 0, y: 0 });
    setTimeout(() => setIsAnimating(false), 300);
  }, [setMiniplayerCorner]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => handlePointerMove(e);
    const handleUp = () => handlePointerUp();
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Reposition on window resize when not dragging
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging && !isAnimating) {
        setResizeTick((t) => t + 1);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging, isAnimating]);

  let currentX = cornerPos.x + (isDragging ? dragOffset.x : 0);
  let currentY = cornerPos.y + (isDragging ? dragOffset.y : 0);
  currentY = Math.max(minTop, currentY);

  const container = (
    <div
      ref={containerRef}
      className={`fixed z-[700] w-[320px] h-[180px] rounded-xl overflow-hidden shadow-2xl select-none ${
        isDragging ? 'cursor-grabbing will-change-transform' : 'cursor-grab'
      } ${isAnimating && !isDragging ? 'transition-all duration-300 ease-out' : ''}`}
      style={{
        left: currentX,
        top: currentY,
        ...(isDragging && { transform: 'translateZ(0)' }),
      }}
      onPointerDown={handlePointerDown}
      role="region"
      aria-label="Miniplayer - drag to move"
    >
      {children}
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(container, document.body);
}
