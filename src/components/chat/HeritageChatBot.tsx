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
  { label: 'Nearby Sites', icon: MapPin },
  { label: 'Museums', icon: Landmark },
  { label: 'Oldest Churches', icon: Church },
];

export function HeritageChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. Ask me anything about Metro Cebu\'s heritage sites!' }
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
      } catch (e) {
        // Location unavailable
      }

      const response = await chatWithHeritageBot({
        history,
        userLocation,
        userId: user?.uid
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
      {/* Messenger style floating bubble */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-[5000] transition-all duration-300 bg-primary hover:bg-primary/90 text-white p-0 overflow-hidden",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <div className="relative w-full h-full flex items-center justify-center">
            <MessageCircle size={32} />
            <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 border-2 border-primary rounded-full animate-pulse" />
        </div>
      </Button>

      {/* Compact Chat Window */}
      <Card 
        className={cn(
          "fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[92vw] md:w-[380px] h-[500px] max-h-[80vh] z-[5001] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white/95 backdrop-blur-2xl ring-1 ring-black/5",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <CardHeader className="bg-primary text-white p-5 flex flex-row items-center justify-between shrink-0 shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Sparkles size={18} />
            </div>
            <div>
              <CardTitle className="text-lg font-headline font-black leading-none mb-1">Heritage Guide</CardTitle>
              <div className="flex items-center gap-1.5 opacity-80 text-[8px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-8 w-8" onClick={() => setIsOpen(false)}>
              <Minimize2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-8 w-8" onClick={() => { setIsOpen(false); setMessages([{ role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. Ask me anything about Metro Cebu\'s heritage sites!' }]); }}>
              <X size={18} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/30">
          <ScrollArea className="flex-1 p-5" ref={scrollRef}>
            <div className="space-y-5 pb-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3.5 rounded-[1.4rem] text-xs leading-relaxed shadow-sm font-medium",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none shadow-primary/10" 
                      : "bg-white text-slate-800 rounded-tl-none ring-1 ring-black/5"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 px-1 py-2">
                   <div className="flex gap-1">
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <ScrollArea className="w-full whitespace-nowrap pb-3 px-5 shrink-0">
            <div className="flex gap-2">
              {QUICK_REPLIES.map((reply, i) => {
                const Icon = reply.icon;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-primary/5 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest gap-1.5 px-4 shadow-sm"
                    onClick={() => handleSendMessage(reply.label)}
                  >
                    <Icon size={12} /> {reply.label}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-4 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-2"
          >
            <Input
              placeholder="Message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-xl h-11 bg-slate-50 border-none shadow-inner text-xs font-bold px-4 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 rounded-xl shrink-0 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white" 
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
