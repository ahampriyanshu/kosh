'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/reports', label: 'Reports' },
  { href: '/outlook', label: 'Outlook' },
  { href: '/scorecard', label: 'Scorecard' },
  { href: '/research', label: 'Research' },
  { href: '/portfolio', label: 'Portfolio' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="main-nav">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href);
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
