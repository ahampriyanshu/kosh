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
    title: 'Reports',
    links: [
      { label: 'Today', href: '/' },
      { label: 'Archive', href: '/reports' },
      { label: 'Alerts', href: '/alerts' },
    ],
  },
  {
    title: 'Research',
    links: [
      { label: 'Stock Research', href: '/research' },
      { label: 'Watchlist', href: '/watchlist' },
      { label: 'Data Manifest', href: '/reports' },
    ],
  },
  {
    title: 'Workflow',
    links: [
      { label: 'Daily Brief', href: '/reports' },
      { label: 'Mid-Session', href: '/alerts' },
      { label: 'Weekly Recap', href: '/reports' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-enhanced">
        <div className="footer-main">
          <div className="footer-left">
            <div className="footer-section footer-articles">
              <h4 className="footer-section-title">Learn</h4>
              <ul className="footer-links">
                {financialArticles.map((article) => (
                  <li key={article.href}>
                    <a
                      href={article.href}
                      className="footer-link"
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

          <div className="footer-right">
            {footerSections.map((section) => (
              <div className="footer-section" key={section.title}>
                <h4 className="footer-section-title">{section.title}</h4>
                <ul className="footer-links">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.label}`}>
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-divider" aria-hidden="true" />
      <div className="footer-content">
        <p>
          made by{' '}
          <a href="https://ahampriyanshu.com" target="_blank" rel="noopener noreferrer">
            <strong>ahampriyanshu</strong>
          </a>
        </p>
        <FooterActions />
      </div>
    </footer>
  );
}
