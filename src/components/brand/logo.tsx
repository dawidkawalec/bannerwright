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
 * Standalone mark — no tile, no rounded-square container.
 *   - Two angle brackets in teal gradient hold a stacked banner pictogram between them.
 *   - Sits directly on whatever background it's placed on; reads as a clean glyph.
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
          id="bw-mark-stroke"
          x1="2"
          y1="4"
          x2="30"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#16D195" />
          <stop offset="1" stopColor="#0A7F5C" />
        </linearGradient>
      </defs>

      {/* Left bracket — `[` */}
      <path
        d="M10 5 L4 5 L4 27 L10 27"
        stroke="url(#bw-mark-stroke)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right bracket — `]` */}
      <path
        d="M22 5 L28 5 L28 27 L22 27"
        stroke="url(#bw-mark-stroke)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Banner bars between the brackets — two stacked filled bars (a headline + sub cue) */}
      <rect x="11.5" y="13" width="9" height="2.8" rx="1" fill="url(#bw-mark-stroke)" />
      <rect
        x="11.5"
        y="17.4"
        width="6"
        height="2.8"
        rx="1"
        fill="url(#bw-mark-stroke)"
        fillOpacity="0.6"
      />
    </svg>
  );
}
