import Link from 'next/link';
import { publication } from '../../lib/publication';
import { FooterActions } from './FooterActions';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-publication">
        <div>
          <Link href="/" className="footer-name">
            {publication.name}
          </Link>
          <p>{publication.tagline}</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/reports">Reports</Link>
          <Link href="/research">Research</Link>
          <a
            href="https://github.com/ahampriyanshu/kosh"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source code
          </a>
        </nav>
      </div>
      <div className="footer-colophon">
        <p>
          Made by{' '}
          <a
            href={publication.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            ahampriyanshu
          </a>
        </p>
        <FooterActions />
      </div>
      <p className="footer-disclaimer">
        Kosh is an experimental, learning-focused project. It is not investment
        advice or a recommendation to buy or sell securities. Market data
        reflects the published edition.
      </p>
    </footer>
  );
}
