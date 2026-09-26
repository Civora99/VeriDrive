'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ExecutionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const req = searchParams.get('req');

  useEffect(() => {
    if (req) {
      router.replace(`/validation?req=${encodeURIComponent(req)}`);
    } else {
      router.replace('/validation');
    }
  }, [router, req]);

  return (
    <div className="py-20 text-center text-xs text-slate-500 font-mono">
      Redirecting to Validation Console...
    </div>
  );
}
