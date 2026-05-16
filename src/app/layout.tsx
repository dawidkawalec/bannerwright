import type { Metadata, Viewport } from 'next';
import { Poppins, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
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

const SITE_URL = 'https://bannerwright.com';
const SITE_TITLE = 'Bannerwright — The AI workshop for HTML banners';
const SITE_DESCRIPTION =
  'Self-hosted, open-source AI workshop. Drop a brand URL and a one-line brief — Bannerwright drafts editable HTML banners, version-controlled and ready to export as PNG. Yours, end-to-end.';
const SHORT_DESCRIPTION =
  'Brief in. Brand-perfect creatives out — as editable HTML, ready to export. Self-hosted, AI-driven, no vendor lock-in.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · Bannerwright',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'Bannerwright',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'AI banner generator',
    'HTML banner generator',
    'AI creative automation',
    'brand-aware AI design',
    'Instagram banner generator',
    'social media creative AI',
    'editable HTML banners',
    'open source design tool',
    'self-hosted design',
    'Gemini design',
    'AI for marketers',
    'creative workflow',
    'agency banner tool',
    'one-off social creatives',
    'banner versioning',
    'banner workshop',
  ],
  authors: [{ name: 'Dawid Kawalec', url: 'https://github.com/dawidkawalec' }],
  creator: 'Dawid Kawalec',
  publisher: 'Dawid Kawalec',
  category: 'design',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Bannerwright',
    title: SITE_TITLE,
    description: SHORT_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SHORT_DESCRIPTION,
    creator: '@kawalec',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B1112' },
    { media: '(prefers-color-scheme: light)', color: '#06C167' },
  ],
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Bannerwright',
  alternateName: 'Bannerwright — The AI workshop for HTML banners',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'DesignApplication',
  applicationSubCategory: 'AI creative generation',
  operatingSystem: 'Web, Linux, macOS, Windows',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Dawid Kawalec',
    url: 'https://github.com/dawidkawalec',
  },
  publisher: {
    '@type': 'Person',
    name: 'Dawid Kawalec',
  },
  softwareVersion: '0.1.0',
  license: 'https://opensource.org/license/mit',
  inLanguage: 'en',
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
        <Script
          id="bw-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  );
}
