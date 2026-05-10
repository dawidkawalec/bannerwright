import { cn } from '@/lib/utils';

/**
 * Inline help affordance — a small "?" badge with a native tooltip.
 * Native tooltips are zero-JS and work everywhere; we'll upgrade to a
 * Radix-based positioned tooltip if we need richer formatting later.
 */
export function HelpHint({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      tabIndex={0}
      role="button"
      aria-label={text}
      title={text}
      className={cn(
        'inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/40',
        className,
      )}
    >
      ?
    </span>
  );
}
