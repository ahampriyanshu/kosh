import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Lato, Newsreader } from 'next/font/google';
import './globals.css';
import { NavBar } from '../components/NavBar';
import { MarketSessionStatus } from '../components/MarketSessionStatus';
import { Footer } from '../components/Footer';
import { siteConfig } from '../lib/site';
import { getLatest, getManifest } from '../lib/reports';
import type { DailyContent } from '../../lib/schemas';

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ['400', '700', '900'],
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.title,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  keywords: [
    'Kosh',
    'Indian stock market',
    'NSE',
    'BSE',
    'equity research',
    'market brief',
    'portfolio alerts',
  ],
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
    type: 'website',
    url: '/',
    locale: 'en_IN',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteConfig.author.twitter,
    creator: siteConfig.author.twitter,
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: siteConfig.title,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'finance',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f4ec',
  colorScheme: 'light',
};

function formatPublishDateTime(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);

  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const day = partMap.day?.padStart(2, '0') ?? '';
  const month = partMap.month ?? '';
  const year = partMap.year ?? '';
  const hour = partMap.hour?.padStart(2, '0') ?? '';
  const minute = partMap.minute?.padStart(2, '0') ?? '';
  const dayPeriod = (partMap.dayPeriod ?? '').toUpperCase();

  return `${day} ${month}, ${year}, ${hour}:${minute} ${dayPeriod} IST`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [daily, retro, manifest] = await Promise.all([
    getLatest('daily'),
    getLatest('retro'),
    getManifest(),
  ]);

  const dailyContent = daily ? (daily.content as DailyContent) : null;
  const snapshot = dailyContent?.snapshot;

  const candidateDates = [
    snapshot?.asOf,
    daily?.generatedAt,
    retro?.generatedAt,
  ].filter((d): d is string => Boolean(d));

  const lastActionIso = candidateDates.length > 0
    ? candidateDates.reduce((latest, curr) =>
        new Date(curr).getTime() > new Date(latest).getTime() ? curr : latest
      )
    : new Date().toISOString();

  const formattedDateTime = formatPublishDateTime(lastActionIso);
  const issueNumber = manifest.reports.length;

  return (
    <html
      lang="en"
      className={`${lato.variable} ${newsreader.variable}`}
      data-mode="light"
      suppressHydrationWarning
    >
      <body>
        <div className="app-container">
          <div className="main-wrapper">
            <div className="content-area">
              <header className="site-header broadsheet-masthead">
                {/* Newspaper volume and issue dateline */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted)] py-1.5 border-b border-[var(--color-hairline)] uppercase tracking-wider font-serif">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Volume {issueNumber}</span>
                    <span aria-hidden="true">|</span>
                    <span>{formattedDateTime}</span>
                  </div>
                  <MarketSessionStatus />
                </div>

                {/* Newspaper Title */}
                <div className="broadsheet-container pt-2">
                  <Link
                    href="/"
                    className="inline-block hover:opacity-90 transition-opacity"
                  >
                    <span className="broadsheet-title">Kosh Daily</span>
                  </Link>
                </div>

                {/* Line between title and navbar */}
                <div className="border-t border-[var(--color-hairline)]" />

                {/* Navigation and Actions */}
                <div className="header-container py-1 border-b border-[var(--color-hairline)]">
                  <div className="brand-lockup" />
                  <NavBar />
                </div>
              </header>

              <main aria-label="Main Content" className="main-content">
                {children}
              </main>

              <Footer />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
