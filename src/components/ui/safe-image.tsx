'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
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
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [isFallback, setIsFallback] = useState(!src);
  const [hasLoaded, setHasLoaded] = useState(false);
  const resolvedFallbackDelayMs = fallbackDelayMs ?? (src?.startsWith('http') ? 5000 : 0);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setIsFallback(!src);
    setHasLoaded(false);
  }, [fallbackSrc, src]);

  useEffect(() => {
    if (!src || currentSrc === fallbackSrc || resolvedFallbackDelayMs <= 0 || hasLoaded) return;

    const timeout = window.setTimeout(() => {
      setCurrentSrc(fallbackSrc);
      setIsFallback(true);
    }, resolvedFallbackDelayMs);

    return () => window.clearTimeout(timeout);
  }, [currentSrc, fallbackSrc, hasLoaded, resolvedFallbackDelayMs, src]);

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
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setIsFallback(true);
        }
        onError?.(event);
      }}
      onLoad={(event) => {
        setHasLoaded(true);
        if (currentSrc === fallbackSrc) {
          setIsFallback(true);
        }
        onLoad?.(event);
      }}
      {...props}
    />
  );
}
