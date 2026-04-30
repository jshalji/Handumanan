'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Landmark, MapPin, User as UserIcon, LogOut, Search, Menu, Settings, Shield, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
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

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleLogout = () => {
    signOut(auth);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-[100] w-full border-b bg-white/80 backdrop-blur-md h-16 md:h-20">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="bg-primary p-1.5 md:p-2 rounded-lg md:rounded-xl text-primary-foreground group-hover:scale-110 transition-all shadow-lg shadow-primary/20">
            <Landmark size={22} className="md:size-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-lg md:text-2xl font-black tracking-tighter text-primary leading-none">Handumanan</span>
            <span className="text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Metro Cebu Heritage</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:text-primary py-2",
              pathname === '/' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            )}
          >
            <Home size={16} /> Home
          </Link>
          
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-2xl gap-3 px-3 h-12 hover:bg-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        {userData?.role === 'admin' ? <Shield size={20} /> : <UserIcon size={20} />}
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-xs font-black truncate max-w-[100px] leading-tight text-slate-900">
                          {user.displayName || user.email?.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          {userData?.role === 'admin' ? 'Administrator' : 'Explorer'}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                    <DropdownMenuLabel className="px-3 pb-2 font-black text-xs uppercase text-slate-400 tracking-widest">Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem asChild className="rounded-xl h-11 px-3">
                      <Link href="/profile" className="cursor-pointer font-bold">
                        <UserIcon size={18} className="mr-3 text-primary" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    {userData?.role === 'admin' && (
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-3">
                        <Link href="/admin-dashboard" className="cursor-pointer font-bold">
                          <Shield size={18} className="mr-3 text-primary" /> Admin Panel
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background w-[80%] border-none p-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="font-headline text-2xl font-black text-primary text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                <Link href="/" className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                  <Home size={18} className="text-primary" /> Home
                </Link>
                {NAV_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                    <item.icon size={18} className="text-primary" /> {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link href="/profile" className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                        <UserIcon size={18} className="text-primary" /> Profile
                      </Link>
                      {userData?.role === 'admin' && (
                         <Link href="/admin-dashboard" className="flex items-center gap-4 text-sm font-black p-4 rounded-xl hover:bg-slate-100">
                           <Shield size={18} className="text-primary" /> Admin Panel
                         </Link>
                      )}
                      <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
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
  );
}
