import { FooterActions } from './FooterActions';

export function Footer() {
  return (
    <footer className="site-footer mt-16 pt-4 border-t border-[var(--color-hairline)] text-xs text-[var(--color-muted)] font-serif">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Made by{' '}
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
