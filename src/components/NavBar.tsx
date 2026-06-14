'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Today' },
  { href: '/research', label: 'Research' },
  { href: '/reports', label: 'Reports' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/alerts', label: 'Alerts' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="main-nav">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
