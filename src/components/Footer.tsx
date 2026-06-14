import Link from 'next/link';

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
      { label: 'Morning Brief', href: '/reports' },
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
            <Link href="/" className="profile-image" aria-label="Kosh home">
              <img src="/logo.png" alt="Kosh" />
            </Link>
            <div className="profile-info">
              <Link href="/" className="profile-link-text">
                <h3 className="profile-name">Kosh</h3>
                <p className="profile-title">
                  Daily Indian market briefings, watchlists, alerts, and research.
                </p>
              </Link>
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
          made by <strong>ahampriyanshu</strong>
        </p>
        <div className="footer-actions">
          <p className="font-mono">&copy; {new Date().getFullYear()} Kosh</p>
        </div>
      </div>
    </footer>
  );
}
