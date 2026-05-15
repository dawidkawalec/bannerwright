import type { Metadata } from 'next';
import { Poppins, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';
import './globals.css';

const poppins = Poppins({
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bannerwright.kawalec.pl'),
  title: {
    default: 'Bannerwright — The AI workshop for HTML banners',
    template: '%s · Bannerwright',
  },
  description:
    'Self-hosted, open-source AI workshop. Briefs in, brand-perfect HTML banners out — editable, version-controlled, yours.',
  applicationName: 'Bannerwright',
  keywords: [
    'AI banner generator',
    'HTML banners',
    'open source',
    'self-hosted',
    'brand-aware AI',
    'Gemini',
    'creative automation',
  ],
  authors: [{ name: 'Dawid Kawalec' }],
  creator: 'Dawid Kawalec',
  openGraph: {
    type: 'website',
    url: 'https://bannerwright.kawalec.pl',
    siteName: 'Bannerwright',
    title: 'Bannerwright — The AI workshop for HTML banners',
    description:
      'Brief in. Brand-perfect creatives out — as editable HTML, ready to export. Self-hosted, AI-driven, no vendor lock-in.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bannerwright — The AI workshop for HTML banners',
    description:
      'Brief in. Brand-perfect creatives out — as editable HTML, ready to export. Self-hosted, AI-driven, no vendor lock-in.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
