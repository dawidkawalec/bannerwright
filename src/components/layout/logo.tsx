import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';
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
        'flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary',
        className,
      )}
    >
      <LogoMark className="size-7 shrink-0" />
      {showText && (
        <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Bannerwright
        </span>
      )}
    </Link>
  );
}
