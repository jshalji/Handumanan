'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Compass, Calendar, Settings, Menu, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Discover', href: '/discover', icon: MapPin },
  { label: 'AI Planner', href: '/itinerary', icon: Calendar },
  { label: 'Admin', href: '/admin', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground group-hover:scale-110 transition-transform">
            <Landmark size={24} />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">Handumanan</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background">
              <SheetHeader>
                <SheetTitle className="font-headline text-primary">Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 text-lg font-medium p-2 rounded-md hover:bg-secondary"
                    >
                      <Icon size={20} className="text-primary" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
