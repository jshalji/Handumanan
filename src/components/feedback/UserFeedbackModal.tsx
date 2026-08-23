'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2, Send } from 'lucide-react';

interface UserFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_CATEGORIES = [
  'General Suggestion',
  'Bug Report',
  'Heritage Data Correction',
  'Feature Request',
  'Other',
];

export function UserFeedbackModal({ open, onOpenChange }: UserFeedbackModalProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.displayName) setName(user.displayName);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: 'Message Required', description: 'Please enter your feedback message.', variant: 'destructive' });
      return;
    }

    if (!db) {
      toast({ title: 'Error', description: 'Database connection unavailable.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'userFeedback'), {
        userName: name.trim() || user?.displayName || 'Anonymous Visitor',
        userEmail: email.trim() || user?.email || 'Not provided',
        userId: user?.uid || null,
        category,
        message: message.trim(),
        status: 'New',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for helping improve Handumanan.',
      });

      setMessage('');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      toast({
        title: 'Submission Failed',
        description: err.message || 'Could not submit feedback at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl border-none">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare size={20} />
            </div>
            <div>
              <DialogTitle className="font-headline text-xl font-black text-slate-950">
                Send Feedback
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Help us improve Handumanan. Send us a suggestion or report an issue.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fb-name" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Your Name
              </Label>
              <Input
                id="fb-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-email" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Email Address
              </Label>
              <Input
                id="fb-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="juan@example.com"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fb-category" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Category
            </Label>
            <select
              id="fb-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {FEEDBACK_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fb-message" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="fb-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={4}
              required
              className="text-xs rounded-xl resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : (
                <Send size={15} className="mr-2" />
              )}
              Submit Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
