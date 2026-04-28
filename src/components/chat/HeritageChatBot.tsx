'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2, Sparkles, MapPin, Landmark, Church, Minimize2 } from 'lucide-react';
import { chatWithHeritageBot } from '@/ai/flows/heritage-chat-flow';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_REPLIES = [
  { label: 'My Next Stop?', icon: MapPin },
  { label: 'Route Summary', icon: Landmark },
  { label: 'Fort San Pedro info', icon: Church },
];

export function HeritageChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. How can I help with your Cebu heritage journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

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
      // Peek into discover page route state if available via custom event or global
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[5000] transition-all duration-300 bg-primary hover:bg-primary/90 text-white p-0",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageCircle size={28} />
      </Button>

      <Card 
        className={cn(
          "fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[90vw] md:w-[360px] h-[480px] max-h-[85vh] z-[5001] transition-all duration-500 flex flex-col rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white/95 backdrop-blur-2xl ring-1 ring-black/5",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <CardHeader className="bg-primary text-white p-4 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Sparkles size={16} />
            </div>
            <CardTitle className="text-sm font-headline font-black">Heritage Guide</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => setIsOpen(false)}>
              <Minimize2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => { setIsOpen(false); setMessages([{ role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. How can I help with your Cebu heritage journey today?' }]); }}>
              <X size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/20">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[80%] animate-in fade-in slide-in-from-bottom-1 duration-300",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
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
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200" />
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
                  className="h-8 rounded-full bg-white text-[10px] font-bold gap-1 px-3 whitespace-nowrap shadow-sm border-slate-100"
                  onClick={() => handleSendMessage(reply.label)}
                >
                  {reply.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-2"
          >
            <Input
              placeholder="Ask about your route..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-xl h-10 bg-slate-100 border-none text-[13px] px-3 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 rounded-xl shrink-0" 
              disabled={isLoading || !input.trim()}
            >
              <Send size={16} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
