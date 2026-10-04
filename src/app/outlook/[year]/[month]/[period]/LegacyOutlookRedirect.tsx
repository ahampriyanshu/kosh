'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function LegacyOutlookRedirect({ destination }: { destination: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(destination);
  }, [destination, router]);

  return (
    <div className="py-16 text-center">
      <p className="font-serif text-sm text-[var(--color-muted)]">Redirecting to Reports...</p>
    </div>
  );
}
