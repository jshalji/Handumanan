'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2, Sparkles, MapPin, Landmark, Church, Navigation } from 'lucide-react';
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
  { label: 'Churches', icon: Church },
  { label: 'Plan My Trip', icon: Sparkles },
];

export function HeritageChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. How can I help you explore Metro Cebu\'s heritage today?' }
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

      // Get user location for context
      let userLocation = undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        // Location denied or unavailable
      }

      const response = await chatWithHeritageBot({
        history,
        userLocation,
        userId: user?.uid
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I couldn\'t process that. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[5000] transition-all duration-300",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageCircle size={28} />
      </Button>

      {/* Chat Window */}
      <Card 
        className={cn(
          "fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[400px] h-[100dvh] md:h-[600px] z-[5001] transition-all duration-500 ease-in-out flex flex-col rounded-none md:rounded-3xl shadow-2xl border-none overflow-hidden",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <CardHeader className="bg-primary text-white p-4 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Sparkles size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-headline font-black leading-none mb-1">Handumanan Guide</CardTitle>
              <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI Assistant
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none ring-1 ring-slate-100"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 p-2 italic text-xs animate-pulse">
                  <Loader2 className="animate-spin" size={12} /> Thinking...
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Replies */}
          <div className="p-4 pt-0 overflow-x-auto scrollbar-hide flex gap-2 shrink-0">
            {QUICK_REPLIES.map((reply, i) => {
              const Icon = reply.icon;
              return (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full whitespace-nowrap bg-white text-slate-600 border-slate-200 hover:bg-primary/5 hover:text-primary transition-all text-xs font-bold gap-2 px-4 shadow-sm"
                  onClick={() => handleSendMessage(reply.label)}
                >
                  <Icon size={14} /> {reply.label}
                </Button>
              );
            })}
          </div>
        </CardContent>

        <CardFooter className="p-4 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-2"
          >
            <Input
              placeholder="Ask anything about Cebu's heritage..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-2xl h-12 bg-slate-50 border-none shadow-inner text-sm font-medium"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-2xl shrink-0 shadow-lg" 
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
