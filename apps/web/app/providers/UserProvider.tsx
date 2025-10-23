'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      apiClient.setUserId(session.user.id);
    }
  }, [session]);

  return <>{children}</>;
}
