'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { SessionProvider } from 'next-auth/react';

import { getQueryClient, makeQueryClient } from '@/lib/query-client';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => (typeof window === 'undefined' ? makeQueryClient() : getQueryClient()));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
