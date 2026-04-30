'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Sparkles, MapPin, Landmark, Minimize2 } from 'lucide-react';
import { chatWithHeritageBot } from '@/ai/flows/heritage-chat-flow';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_REPLIES = [
  { label: 'Next Stop?', icon: MapPin },
  { label: 'Route Info', icon: Landmark },
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
  const pathname = usePathname();

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
      const routeDataStr = localStorage.getItem('active_itinerary_context');
      let currentRoute = undefined;
      if (routeDataStr) {
        try {
          currentRoute = JSON.parse(routeDataStr);
        } catch (e) {}
      }

      const history = newMessages.map(m => ({
        role: m.role as 'user' | 'model',
        content: [{ text: m.text }]
      }));

      let userLocation = undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {}

      const response = await chatWithHeritageBot({
        history,
        userLocation,
        userId: user?.uid,
        currentRoute
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I couldn\'t process that right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  // Adjust bottom offset if the navigation card is present on the discover page
  const isDiscoverPage = pathname === '/discover';

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-4 h-11 w-11 md:h-12 md:w-12 rounded-xl shadow-2xl z-[5000] transition-all duration-300 bg-primary hover:bg-primary/90 text-white p-0",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
          isDiscoverPage ? "bottom-4" : "bottom-4"
        )}
      >
        <MessageCircle size={22} />
      </Button>

      <Card 
        className={cn(
          "fixed right-3 md:right-6 w-[calc(100vw-24px)] md:w-[320px] h-[400px] md:h-[480px] max-h-[70vh] z-[5001] transition-all duration-500 flex flex-col rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white/95 backdrop-blur-2xl ring-1 ring-black/5",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none",
          isDiscoverPage ? "bottom-3 md:bottom-6" : "bottom-6"
        )}
      >
        <CardHeader className="bg-primary text-white p-3 md:p-4 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1 rounded-lg">
              <Sparkles size={14} />
            </div>
            <CardTitle className="text-xs md:text-sm font-headline font-black">Heritage Guide</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => setIsOpen(false)}>
              <Minimize2 size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/20">
          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
            <div className="space-y-3 pb-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-1 duration-300",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-2.5 md:p-3 rounded-xl md:rounded-2xl text-[11px] md:text-[13px] leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none ring-1 ring-black/5"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-1 p-2">
                  <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce delay-100" />
                  <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce delay-200" />
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-3 pb-2 overflow-x-auto scrollbar-hide shrink-0">
            <div className="flex gap-1.5">
              {QUICK_REPLIES.map((reply, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full bg-white text-[9px] font-bold gap-1 px-2.5 shadow-sm border-slate-100"
                  onClick={() => handleSendMessage(reply.label)}
                >
                  {reply.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-2 md:p-3 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-2"
          >
            <Input
              placeholder="Ask Guide..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-xl h-9 md:h-10 bg-slate-100 border-none text-[11px] md:text-[13px] px-3 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl shrink-0" 
              disabled={isLoading || !input.trim()}
            >
              <Send size={14} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
