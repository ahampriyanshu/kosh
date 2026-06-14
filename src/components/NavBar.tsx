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
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6 list-none m-0 p-0">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  'text-sm font-medium tracking-wide transition-colors',
                  isActive
                    ? 'text-[var(--color-brand)] border-b border-[var(--color-brand)] pb-0.5'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
