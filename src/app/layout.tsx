import type { Metadata } from 'next';
import Link from 'next/link';
import { JetBrains_Mono, Lato, Poppins } from 'next/font/google';
import './globals.css';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { ThemeToggle } from '../components/ThemeToggle';

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
  title: 'Kosh',
  description: 'Kosh',
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
                    <time className="header-meta">
                      {new Date().toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'Asia/Kolkata',
                      })}
                    </time>
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
