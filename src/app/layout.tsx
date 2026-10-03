import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Lato, Newsreader } from 'next/font/google';
import './globals.css';
import { NavBar } from '../components/NavBar';
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
  weight: ['400', '500', '600', '700'],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [daily, manifest] = await Promise.all([
    getLatest('daily'),
    getManifest(),
  ]);

  const dailyContent = daily ? (daily.content as DailyContent) : null;
  const snapshot = dailyContent?.snapshot;

  const pubDate = snapshot?.asOf
    ? new Date(snapshot.asOf).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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
                {/* Dateline Bar (Wednesday, 30 September 2026 Issue 179) */}
                <div className="flex flex-wrap items-center justify-between text-xs text-[var(--color-muted)] py-1.5 border-b border-[var(--color-hairline)] uppercase tracking-wider font-serif">
                  <div>
                    <span>{pubDate}</span>
                  </div>
                  <div>
                    <span>Issue {issueNumber}</span>
                  </div>
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
