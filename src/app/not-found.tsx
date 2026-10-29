import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="font-serif text-[var(--color-ink)] py-16 text-center max-w-lg mx-auto space-y-4">
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-hairline)] pb-2">
        404 / Page not found
      </div>
      <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
        This page is missing.
      </h1>
      <p className="text-sm text-[var(--color-muted)] leading-relaxed">
        The link may have changed, or this edition may no longer be available.
        Browse the reports or return to the front page.
      </p>
      <div className="pt-4">
        <Link
          href="/"
          className="inline-block px-4 py-2 border border-[var(--color-hairline)] text-xs font-mono uppercase tracking-wider hover:bg-[var(--color-ink)] hover:text-[var(--color-surface)] transition-colors"
        >
          Return to the front page
        </Link>
      </div>
    </div>
  );
}
