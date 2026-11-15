'use client';

export function FooterActions() {
  function scrollToTop() {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  return (
    <button type="button" className="back-to-top" onClick={scrollToTop}>
      Back to top <span aria-hidden="true">↑</span>
    </button>
  );
}
