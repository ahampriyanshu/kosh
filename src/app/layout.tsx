import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kosh',
  description: 'Morning market briefings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
          <strong>Kosh</strong>
          <nav style={{ display: 'inline-flex', gap: '1rem', marginLeft: '2rem' }}>
            <a href="/">Today</a>
            <a href="/research">Research</a>
            <a href="/reports">Reports</a>
            <a href="/watchlist">Watchlist</a>
            <a href="/alerts">Alerts</a>
          </nav>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}
