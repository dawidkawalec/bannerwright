import Link from 'next/link';
import { Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  showText = true,
  href = '/workspaces',
  className,
}: {
  showText?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary',
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
        <Hammer className="size-4" />
      </span>
      {showText && (
        <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Bannerwright
        </span>
      )}
    </Link>
  );
}
