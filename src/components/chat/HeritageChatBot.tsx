
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Sparkles, MapPin, Landmark, Minimize2, Loader2 } from 'lucide-react';
import { chatWithHeritageBot } from '@/ai/flows/heritage-chat-flow';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_REPLIES = [
  { label: 'My Favorites', icon: Landmark },
  { label: 'Next Stop?', icon: MapPin },
];

export function HeritageChatBot() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Maayong adlaw! How can I help with your Cebu heritage journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user } = useUser();
  const db = useFirestore();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // READ DATA FROM DATABASE (Firestore)
  const favoritesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'favorites'));
  }, [db, user]);
  const { data: favorites } = useCollection(favoritesQuery);

  const itinerariesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'itineraries'), orderBy('createdAt', 'desc'), limit(1));
  }, [db, user]);
  const { data: itineraries } = useCollection(itinerariesQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role as 'user' | 'model',
        content: [{ text: m.text }]
      }));

      // Pass Database Context to AI
      const response = await chatWithHeritageBot({
        history,
        userId: user?.uid,
        favorites: favorites?.map(f => f.siteName),
        lastItinerary: itineraries?.[0]?.summary,
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'I encountered an error. Please ensure your Gemini API key is configured correctly in the .env file.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const isDiscoverPage = pathname === '/discover';

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-3xl z-[5000] transition-all duration-300 bg-primary hover:bg-primary/90 text-white p-0",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
          "right-6",
          isDiscoverPage ? (isMobile ? "bottom-20" : "bottom-6") : "bottom-6"
        )}
      >
        <MessageCircle size={28} />
      </Button>

      <Card 
        className={cn(
          "fixed right-4 md:right-8 w-[calc(100vw-32px)] md:w-[360px] h-[450px] md:h-[520px] max-h-[75vh] z-[5001] transition-all duration-500 flex flex-col rounded-[2.5rem] shadow-3xl border-none overflow-hidden bg-white/95 backdrop-blur-3xl ring-1 ring-black/5",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none",
          isDiscoverPage ? (isMobile ? "bottom-20" : "bottom-8") : "bottom-8"
        )}
      >
        <CardHeader className="bg-primary text-white p-5 md:p-6 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-xl">
              <Sparkles size={18} />
            </div>
            <CardTitle className="text-sm md:text-base font-headline font-black uppercase tracking-widest">Heritage Guide</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
              <Minimize2 size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/10">
          <ScrollArea className="flex-1 p-4 md:p-5" ref={scrollRef}>
            <div className="space-y-4 pb-6">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[88%] animate-in fade-in slide-in-from-bottom-2 duration-400",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3.5 md:p-4 rounded-2xl md:rounded-[1.5rem] text-[12px] md:text-[14px] font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none ring-1 ring-black/5"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-3 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Guide is thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-4 pb-3 overflow-x-auto scrollbar-hide shrink-0">
            <div className="flex gap-2">
              {QUICK_REPLIES.map((reply, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full bg-white text-[10px] font-black uppercase tracking-wider gap-2 px-4 shadow-sm border-slate-100 hover:bg-slate-50 transition-colors"
                  onClick={() => handleSendMessage(`Tell me about ${reply.label === 'My Favorites' ? 'my favorited sites' : 'my next stop'}`)}
                >
                  <reply.icon size={12} /> {reply.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 md:p-4 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-3"
          >
            <Input
              placeholder="Ask the Guide..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-2xl h-11 md:h-12 bg-slate-50 border-none text-[13px] px-4 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 md:h-12 md:w-12 rounded-2xl shrink-0 shadow-xl shadow-primary/20" 
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
