'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
  fill?: boolean;
  fallbackClassName?: string;
};

export function SafeImage({
  src,
  fallbackSrc = '/logo.png',
  alt = '',
  className,
  fallbackClassName = 'object-contain bg-primary/5 p-8',
  fill,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [isFallback, setIsFallback] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setIsFallback(!src);
  }, [fallbackSrc, src]);

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
      {...props}
    />
  );
}
