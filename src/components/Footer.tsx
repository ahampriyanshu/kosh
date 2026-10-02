import Link from 'next/link';
import { FooterActions } from './FooterActions';

const financialArticles = [
  {
    label: 'Equity Markets for Dummies',
    href: 'https://ahampriyanshu.com/blog/expermenting-with-personal-finance/equity-markets-for-dummies-introduction',
  },
  {
    label: 'Fundamental Analysis for Dummies',
    href: 'https://ahampriyanshu.com/blog/expermenting-with-personal-finance/equity-markets-for-dummies-fundamental-analysis',
  },
  {
    label: 'Technical Analysis for Dummies',
    href: 'https://ahampriyanshu.com/blog/expermenting-with-personal-finance/equity-markets-for-dummies-techincal-analysis',
  },
];

const footerSections = [
  {
    title: 'Market',
    links: [
      { label: 'Reports', href: '/reports' },
      { label: 'Outlook', href: '/outlook' },
    ],
  },
  {
    title: 'Workspace',
    links: [
      { label: 'Scorecard', href: '/scorecard' },
      { label: 'Research', href: '/research' },
      { label: 'Portfolio', href: '/portfolio' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer mt-16 pt-8 border-t border-[var(--color-hairline)] text-xs text-[var(--color-muted)] font-serif">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8">
        <div className="md:col-span-5 space-y-2">
          <p className="font-semibold text-sm text-[var(--color-ink)]">
            Kosh
          </p>
          <p className="leading-relaxed">
            A daily journal of Indian equities, market microstructure, and positional research for the NSE &amp; BSE.
          </p>
        </div>

        <div className="md:col-span-4 grid grid-cols-2 gap-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-[var(--color-ink)] mb-2">
                {section.title}
              </h4>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[var(--color-ink)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="md:col-span-3">
          <h4 className="font-semibold text-[var(--color-ink)] mb-2">
            Learn
          </h4>
          <ul className="space-y-1.5 list-none p-0 m-0">
            {financialArticles.map((article) => (
              <li key={article.href}>
                <a
                  href={article.href}
                  className="hover:text-[var(--color-ink)] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {article.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-hairline)] flex flex-wrap items-center justify-between gap-2">
        <p>
          by{' '}
          <a
            href="https://ahampriyanshu.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline text-[var(--color-ink)]"
          >
            ahampriyanshu
          </a>
        </p>
        <FooterActions />
      </div>
    </footer>
  );
}
