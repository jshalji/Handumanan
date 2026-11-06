'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Accent = 'primary' | 'slate' | 'emerald';

const accentMap: Record<Accent, { label: string; button: string; ring: string }> = {
  primary: { label: 'text-primary', button: 'bg-primary text-primary-foreground hover:bg-primary/90', ring: 'focus-visible:ring-primary/30' },
  slate: { label: 'text-slate-700', button: 'bg-slate-900 text-white hover:bg-slate-800', ring: 'focus-visible:ring-slate-400/40' },
  emerald: { label: 'text-emerald-700', button: 'bg-emerald-600 text-white hover:bg-emerald-700', ring: 'focus-visible:ring-emerald-400/40' },
};

interface AuthShellProps {
  title?: string;
  subtitle?: string;
  accent?: Accent;
  portalLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, accent = 'primary', portalLabel, footer, children }: AuthShellProps) {
  const a = accentMap[accent];
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="absolute inset-0 z-0">
        <Image
          src="/metrocebu-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover blur-md scale-110"
        />
        <div className="absolute inset-0 bg-primary/35" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[400px] flex-col justify-center">
        <section className="rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Handumanan logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
                priority
              />
              <div className="text-left">
                <p className="font-headline text-xs font-black uppercase tracking-[0.2em] text-stone-800">Handumanan</p>
                <p className="text-[10px] font-medium text-stone-500">Metro Cebu Cultural Heritage</p>
              </div>
            </div>

            {portalLabel && (
              <p className={cn('mb-1 text-xs font-semibold uppercase tracking-wide', a.label)}>{portalLabel}</p>
            )}

            {title ? <h1 className="font-headline text-2xl font-bold leading-tight text-stone-900">{title}</h1> : null}
            {subtitle ? <p className="mt-2 text-sm leading-relaxed text-stone-600">{subtitle}</p> : null}
          </div>

          <div>{children}</div>

          {footer && <div className="mt-5 text-center text-sm text-stone-500">{footer}</div>}

          <div className="mt-5 border-t border-stone-100 pt-3 text-center text-[10px] font-medium tracking-wide text-stone-400">
            Preserving Metro Cebu&apos;s heritage digitally
          </div>
        </section>
      </div>
    </div>
  );
}

export { accentMap };


