import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { JetBrains_Mono, Lato, Poppins } from 'next/font/google';
import './globals.css';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { ThemeToggle } from '../components/ThemeToggle';
import { siteConfig } from '../lib/site';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ['400', '700', '900'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '700'],
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
  themeColor: '#f3f5f7',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${lato.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-mode', theme);
  } catch {
    document.documentElement.setAttribute('data-mode', 'light');
  }
})();`,
          }}
        />
      </head>
      <body>
        <div className="app-container">
          <div className="main-wrapper">
            <div className="content-area">
              <header className="site-header">
                <div className="header-container">
                  <div className="brand-lockup">
                    <Link href="/" className="brand-name">
                      Kosh
                    </Link>
                  </div>
                  <NavBar />
                  <div className="header-actions">
                    <ThemeToggle />
                  </div>
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
