import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { HeritageChatBot } from '@/components/chat/HeritageChatBot';

export const metadata: Metadata = {
  title: 'Handumanan | Cebu Cultural Heritage',
  description: 'A Web-Based Cultural Heritage Site Information System for Metro Cebu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen" suppressHydrationWarning>
        <FirebaseClientProvider>
          {children}
          <HeritageChatBot />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
