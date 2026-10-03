import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="font-serif text-[var(--color-ink)] py-16 text-center max-w-lg mx-auto space-y-4">
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-hairline)] pb-2">
        Error 404 · Edition Not Located
      </div>
      <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
        Page Not Found
      </h1>
      <p className="text-sm text-[var(--color-muted)] leading-relaxed">
        The requested report, ticker archive, or editorial ledger dispatch could not be found in the archives.
      </p>
      <div className="pt-4">
        <Link
          href="/"
          className="inline-block px-4 py-2 border border-[var(--color-hairline)] text-xs font-mono uppercase tracking-wider hover:bg-[var(--color-ink)] hover:text-[var(--color-surface)] transition-colors"
        >
          &larr; Return to Front Page
        </Link>
      </div>
    </div>
  );
}
