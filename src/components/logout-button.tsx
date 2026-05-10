'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.replace('/login');
          router.refresh();
        })
      }
    >
      Sign out
    </Button>
  );
}
