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
  fallbackDelayMs = 7000,
  loading = 'lazy',
  decoding = 'async',
  onError,
  onLoad,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [isFallback, setIsFallback] = useState(!src);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setIsFallback(!src);
    setHasLoaded(false);
  }, [fallbackSrc, src]);

  useEffect(() => {
    if (!src || currentSrc === fallbackSrc || fallbackDelayMs <= 0 || hasLoaded) return;

    const timeout = window.setTimeout(() => {
      setCurrentSrc(fallbackSrc);
      setIsFallback(true);
    }, fallbackDelayMs);

    return () => window.clearTimeout(timeout);
  }, [currentSrc, fallbackDelayMs, fallbackSrc, hasLoaded, src]);

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
