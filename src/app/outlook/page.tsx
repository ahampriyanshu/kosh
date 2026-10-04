'use client';

import { useEffect } from 'react';

export default function OutlookRedirectPage() {
  useEffect(() => {
    window.location.replace(`/reports${window.location.search}`);
  }, []);

  return (
    <div className="py-16 text-center">
      <p className="font-serif text-sm text-[var(--color-muted)]">
        Redirecting to Reports...
      </p>
    </div>
  );
}
