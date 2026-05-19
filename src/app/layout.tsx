import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { HeritageChatBot } from '@/components/chat/HeritageChatBot';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Handumanan | Cebu Cultural Heritage',
  description: 'A Web-Based Cultural Heritage Site Information System for Metro Cebu',
  icons: {
    icon: [
      { url: '/logo-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/logo-180.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    title: 'Handumanan | Cebu Cultural Heritage',
    description: 'A Web-Based Cultural Heritage Site Information System for Metro Cebu',
    images: [{ url: '/logo-512.png', width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
      <body className="font-body antialiased min-h-screen min-h-[100dvh]" suppressHydrationWarning>
        <FirebaseClientProvider>
          {children}
          <HeritageChatBot />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
