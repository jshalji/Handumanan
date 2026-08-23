'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, User as UserIcon, LogOut, Search, Menu, Settings, Shield, ShieldCheck, Home, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { UserFeedbackModal } from '@/components/feedback/UserFeedbackModal';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: 'Explore & Route', href: '/discover', icon: MapPin },
  { label: 'Site Directory', href: '/explore', icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsSheetOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-locked');
      document.documentElement.style.pointerEvents = '';
      document.documentElement.style.overflow = '';
    }
  }, [pathname]);

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsSheetOpen(false);
    signOut(auth);
    router.push('/');
  };

  const handleNavClick = (href: string) => {
    setIsDropdownOpen(false);
    setIsSheetOpen(false);
    if (href === '/explore' && typeof window !== 'undefined') {
      sessionStorage.removeItem('handumanan-explore-state');
    }
  };

  const getRoleLabel = () => {
    if (userData?.role === 'admin') return 'Administrator';
    if (userData?.role === 'lgu') return 'LGU Official';
    return 'Explorer';
  };

  const getRoleIcon = () => {
    if (userData?.role === 'admin') return <Shield size={20} />;
    if (userData?.role === 'lgu') return <ShieldCheck size={20} />;
    return <UserIcon size={20} />;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 h-[calc(4rem+env(safe-area-inset-top))] w-full border-b bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md md:h-[calc(5rem+env(safe-area-inset-top))]">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-3 group">
            <Image
                src="/logo.png"
                alt="Handumanan Logo"
                width={44}
                height={44}
                className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl group-hover:scale-110 transition-all shadow-lg shadow-primary/20 shrink-0"
              />
            <div className="flex min-w-0 flex-col">
              <span className="font-headline text-lg md:text-2xl font-black tracking-tighter text-primary leading-none">Handumanan</span>
              <span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Metro Cebu Heritage</span>
            </div>
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
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:text-primary py-2",
                    isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}

            <div className="ml-4 flex items-center gap-4">
              {!isUserLoading && (
                user ? (
                  <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="rounded-2xl gap-3 px-3 h-12 hover:bg-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                          {getRoleIcon()}
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-xs font-black truncate max-w-[100px] leading-tight text-slate-900">
                            {user.displayName || user.email?.split('@')[0]}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                            {getRoleLabel()}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={10} collisionPadding={16} className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                      <DropdownMenuLabel className="px-3 pb-2 font-black text-xs uppercase text-slate-400 tracking-widest">Account</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem asChild onClick={() => setIsDropdownOpen(false)} className="rounded-xl h-11 px-3">
                        <Link href="/profile" className="cursor-pointer font-bold">
                          <UserIcon size={18} className="mr-3 text-primary" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setIsDropdownOpen(false); setIsFeedbackModalOpen(true); }} className="rounded-xl h-11 px-3 font-bold cursor-pointer">
                        <MessageSquare size={18} className="mr-3 text-primary" /> Send Feedback
                      </DropdownMenuItem>
                      {userData?.role === 'admin' && (
                        <DropdownMenuItem asChild onClick={() => setIsDropdownOpen(false)} className="rounded-xl h-11 px-3">
                          <Link href="/admin-dashboard" className="cursor-pointer font-bold">
                            <Shield size={18} className="mr-3 text-primary" /> Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {userData?.role === 'lgu' && (
                        <DropdownMenuItem asChild onClick={() => setIsDropdownOpen(false)} className="rounded-xl h-11 px-3">
                          <Link href="/lgu-dashboard" className="cursor-pointer font-bold">
                            <ShieldCheck size={18} className="mr-3 text-primary" /> LGU Portal
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem onClick={handleLogout} className="rounded-xl h-11 px-3 text-red-600 cursor-pointer font-bold">
                        <LogOut size={18} className="mr-3" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild className="rounded-2xl px-8 h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                    <Link href="/auth">Login</Link>
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background w-[88vw] max-w-[340px] border-none p-6">
                <SheetHeader className="mb-6">
                  <SheetTitle className="font-headline text-2xl font-black text-primary text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => handleNavClick(item.href)} className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                      <item.icon size={18} className="text-primary" /> {item.label}
                    </Link>
                  ))}
                  <button onClick={() => { setIsSheetOpen(false); setIsFeedbackModalOpen(true); }} className="flex w-full items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100 text-left">
                    <MessageSquare size={18} className="text-primary" /> Send Feedback
                  </button>
                  <div className="pt-4 border-t mt-4 flex flex-col gap-2">
                    {user ? (
                      <>
                        <Link href="/profile" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                          <UserIcon size={18} className="text-primary" /> Profile
                        </Link>
                        {userData?.role === 'admin' && (
                           <Link href="/admin-dashboard" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                             <Shield size={18} className="text-primary" /> Admin Panel
                           </Link>
                        )}
                        {userData?.role === 'lgu' && (
                           <Link href="/lgu-dashboard" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                             <ShieldCheck size={18} className="text-primary" /> LGU Portal
                           </Link>
                        )}
                        <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Button asChild onClick={() => setIsSheetOpen(false)} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                        <Link href="/auth">Login</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <UserFeedbackModal open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen} />
    </>
  );
}
