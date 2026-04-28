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
  { label: 'Spanish Houses', icon: Sparkles },
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
        // Location unavailable - the bot will fallback to popularity search
      }

      const response = await chatWithHeritageBot({
        history,
        userLocation,
        userId: user?.uid
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I couldn\'t process that right now. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-[2rem] shadow-2xl z-[5000] transition-all duration-300 bg-primary hover:bg-primary/90 text-white shadow-primary/30",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageCircle size={28} />
      </Button>

      <Card 
        className={cn(
          "fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full md:w-[420px] max-h-[75vh] md:max-h-[600px] z-[5001] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col rounded-t-[3rem] md:rounded-[3rem] shadow-2xl border-none overflow-hidden bg-white/95 backdrop-blur-2xl ring-1 ring-black/5",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <CardHeader className="bg-primary text-white p-6 flex flex-row items-center justify-between shrink-0 shadow-lg shadow-primary/20">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
              <Sparkles size={22} />
            </div>
            <div>
              <CardTitle className="text-xl font-headline font-black leading-none mb-1.5">Heritage Guide</CardTitle>
              <div className="flex items-center gap-2 opacity-80 text-[10px] font-black uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Assistant
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10" onClick={() => setIsOpen(false)}>
              <Minimize2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10" onClick={() => { setIsOpen(false); setMessages([{ role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. Ask me anything about Metro Cebu\'s heritage sites!' }]); }}>
              <X size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/50">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-300",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm font-medium",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none shadow-primary/10" 
                      : "bg-white text-slate-800 rounded-tl-none ring-1 ring-black/5"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 text-slate-400 px-2 py-4 animate-pulse">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Consulting Archives...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <ScrollArea className="w-full whitespace-nowrap pb-4 px-6 shrink-0">
            <div className="flex gap-2">
              {QUICK_REPLIES.map((reply, i) => {
                const Icon = reply.icon;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="h-10 rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-primary/5 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest gap-2 px-5 shadow-sm"
                    onClick={() => handleSendMessage(reply.label)}
                  >
                    <Icon size={14} /> {reply.label}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-6 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-3"
          >
            <Input
              placeholder="Ask about Cebuano history..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-2xl h-14 bg-slate-50 border-none shadow-inner text-sm font-bold px-6 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-14 w-14 rounded-2xl shrink-0 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white" 
              disabled={isLoading || !input.trim()}
            >
              <Send size={20} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
