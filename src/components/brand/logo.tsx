import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'mark' | 'wordmark';
  className?: string;
};

export function Logo({ variant = 'wordmark', className }: LogoProps) {
  if (variant === 'mark') {
    return <LogoMark className={className} />;
  }
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-7" />
      <span className="text-[15px] font-medium tracking-[-0.01em] text-foreground">
        Bannerwright
      </span>
    </span>
  );
}

/**
 * Mark concept — `[ ▬ ]`:
 *   - Two angle brackets (HTML-ish framing) hold a small filled banner in the centre.
 *   - Reads as "banner inside code" → the literal idea of Bannerwright.
 *   - Strong silhouette at any size; stroke-based brackets stay crisp down to 16px.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('size-7', className)}
    >
      <defs>
        <linearGradient
          id="bw-mark-bg"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#11BB88" />
          <stop offset="1" stopColor="#0A7F5C" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#bw-mark-bg)" />

      {/* Left bracket — `[` */}
      <path
        d="M10 9 L7.25 9 L7.25 23 L10 23"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right bracket — `]` */}
      <path
        d="M22 9 L24.75 9 L24.75 23 L22 23"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Banner pictogram between the brackets — two stacked filled bars (a "headline + sub" cue) */}
      <rect x="12" y="13.5" width="8" height="2.1" rx="0.8" fill="white" />
      <rect x="12" y="16.4" width="5.5" height="2.1" rx="0.8" fill="white" fillOpacity="0.7" />
    </svg>
  );
}
