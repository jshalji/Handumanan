'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string | string[];
  fill?: boolean;
  fallbackClassName?: string;
  fallbackDelayMs?: number;
};

export function SafeImage({
  src,
  fallbackSrc = '/logo.png',
  alt = '',
  className,
  fallbackClassName = 'object-contain bg-primary/5 p-8',
  fill,
  fallbackDelayMs,
  loading = 'lazy',
  decoding = 'async',
  onError,
  onLoad,
  ...props
}: SafeImageProps) {
  const fallbackSources = Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc];
  const rawSources = [src, ...fallbackSources];
  const seenKeys = new Set<string>();
  const uniqueSources: string[] = [];

  for (const raw of rawSources) {
    if (!raw) continue;
    let cleaned = raw.trim();
    if (!cleaned) continue;
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://') && !cleaned.startsWith('/') && !cleaned.startsWith('data:')) {
      cleaned = '/' + cleaned;
    }
    const dedupKey = cleaned.startsWith('/') ? cleaned.toLowerCase() : cleaned;
    if (!seenKeys.has(dedupKey)) {
      seenKeys.add(dedupKey);
      uniqueSources.push(cleaned);
    }
  }
  const sourceKey = uniqueSources.join('|');
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSrc = uniqueSources[currentIndex] || '/logo.png';
  const isFallback = currentIndex > 0 || !src;
  const [hasLoaded, setHasLoaded] = useState(false);
  const resolvedFallbackDelayMs = fallbackDelayMs ?? (currentSrc.startsWith('http') ? 5000 : 0);

  useEffect(() => {
    setCurrentIndex(0);
    setHasLoaded(false);
  }, [sourceKey]);

  useEffect(() => {
    if (currentIndex >= uniqueSources.length - 1 || resolvedFallbackDelayMs <= 0 || hasLoaded) return;

    const timeout = window.setTimeout(() => {
      setHasLoaded(false);
      setCurrentIndex(index => Math.min(index + 1, uniqueSources.length - 1));
    }, resolvedFallbackDelayMs);

    return () => window.clearTimeout(timeout);
  }, [currentIndex, hasLoaded, resolvedFallbackDelayMs, uniqueSources.length]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      className={cn(
        fill && 'absolute inset-0 h-full w-full',
        className,
        isFallback && fallbackClassName
      )}
      onError={(event) => {
        if (currentIndex < uniqueSources.length - 1) {
          setHasLoaded(false);
          setCurrentIndex(index => Math.min(index + 1, uniqueSources.length - 1));
        }
        onError?.(event);
      }}
      onLoad={(event) => {
        setHasLoaded(true);
        onLoad?.(event);
      }}
      {...props}
    />
  );
}
