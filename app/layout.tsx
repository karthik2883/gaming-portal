import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'FlipTrip Games — Play Free Online Games',
  description: 'Play hundreds of free online games instantly. Action, puzzle, racing, sports and more. No downloads, no sign-up required!',
  keywords: 'free games, online games, browser games, fliptrip, play games, arcade, puzzle games',
  icons: {
    icon: '/fliptrip_favicon.png',
    shortcut: '/fliptrip_favicon.png',
    apple: '/fliptrip_favicon.png',
  },
  openGraph: {
    title: 'FlipTrip Games — Play Free Online Games',
    description: 'Play hundreds of free online games instantly in your browser. No downloads needed!',
    type: 'website',
    images: [{ url: '/fliptrip_logo.png', width: 1024, height: 1024, alt: 'FlipTrip Games' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlipTrip Games — Play Free Online Games',
    description: 'Play hundreds of free online games instantly. No downloads needed!',
    images: ['/fliptrip_logo.png'],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to speed up Google Fonts & external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for common CDNs */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.variable} ${orbitron.variable}`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111122',
              color: '#f0f0ff',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: '#39ff14', secondary: '#000' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
