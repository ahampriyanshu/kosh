'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/reports', label: 'Reports' },
  { href: '/bets/short-term', label: 'Short Term' },
  { href: '/bets/long-term', label: 'Long Term' },
  { href: '/research', label: 'Research' },
  { href: '/portfolio', label: 'Portfolio' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="main-nav">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = href === '/' ? pathname === '/' : (pathname ? pathname.startsWith(href) : false);
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
