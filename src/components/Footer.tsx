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
      { label: 'Dashboard', href: '/' },
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
  {
    title: 'Explore',
    links: [
      { label: 'Dashboard', href: '/' },
      { label: 'Market Reports', href: '/reports' },
      { label: 'Portfolio', href: '/portfolio' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer mt-16 pt-8 border-t-2 border-[var(--color-ink)] font-serif">
      <div className="pb-6 mb-6 border-b border-[var(--color-hairline)] flex flex-wrap items-center justify-between text-xs font-mono text-[var(--color-muted)]">
        <span className="font-bold text-[var(--color-ink)] tracking-wider uppercase">
          Kosh Daily · Colophon &amp; Dispatch Record
        </span>
        <span>AUTONOMOUS GITHUB PAGES RUNTIME · ZERO SERVER COST</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs pb-8 border-b border-[var(--color-hairline)]">
        {/* Colophon statement */}
        <div className="md:col-span-5 space-y-2 text-[var(--color-muted)] leading-relaxed">
          <p className="font-serif text-sm font-semibold text-[var(--color-ink)]">
            About This Publication
          </p>
          <p>
            Kosh Daily is an automated, self-verifying equity research journal for the Indian stock market (NSE &amp; BSE). Market briefings file automatically at 08:00 IST; mid-session risk surveillance executes at 14:00 IST; positional calls are graded every Sunday at 21:00 IST.
          </p>
          <p className="font-mono text-[11px] text-[var(--color-faint)]">
            Single Source of Truth: Immutable SHA-256 JSON records committed directly to Git. Zero hindsight rationalization.
          </p>
        </div>

        {/* Directory links */}
        <div className="md:col-span-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] mb-2">
              Departments
            </h4>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li><Link href="/" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Front Page</Link></li>
              <li><Link href="/reports" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Reports Archive</Link></li>
              <li><Link href="/outlook" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Forward Outlook</Link></li>
              <li><Link href="/scorecard" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Audited Scorecard</Link></li>
              <li><Link href="/research" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Single-Stock Research</Link></li>
              <li><Link href="/portfolio" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Encrypted Vault</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)] mb-2">
              Educational
            </h4>
            <ul className="space-y-1.5 list-none p-0 m-0">
              {financialArticles.map((article) => (
                <li key={article.href}>
                  <a
                    href={article.href}
                    className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
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

        {/* Technical imprint */}
        <div className="md:col-span-3 space-y-1.5 font-mono text-[11px] text-[var(--color-muted)]">
          <h4 className="font-bold uppercase tracking-wider text-[var(--color-ink)] mb-2">
            Specifications
          </h4>
          <p>Compute: GitHub Actions</p>
          <p>Synthesis: Google Gemini 2.5</p>
          <p>Data: NSE, BSE, Yahoo Finance</p>
          <p>Distribution: Resend &amp; Web</p>
        </div>
      </div>

      <div className="pt-4 flex flex-wrap items-center justify-between text-xs font-mono text-[var(--color-muted)]">
        <p>
          Edited &amp; Engineered by{' '}
          <a href="https://ahampriyanshu.com" target="_blank" rel="noopener noreferrer" className="font-bold underline text-[var(--color-ink)]">
            ahampriyanshu
          </a>
        </p>
        <FooterActions />
      </div>
    </footer>
  );
}
