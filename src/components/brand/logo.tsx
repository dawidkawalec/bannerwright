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

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('size-7', className)}
    >
      <rect width="32" height="32" rx="8" fill="url(#bw-mark-bg)" />
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
      {/* Geometric "B" — spine + two stacked banner bumps */}
      <path
        d="M10 8.5h6.4c2.18 0 3.78 1.45 3.78 3.45 0 1.28-.65 2.3-1.7 2.82 1.42.48 2.34 1.66 2.34 3.16 0 2.26-1.78 3.77-4.2 3.77H10V8.5zm2.55 5.65h3.2c1.04 0 1.66-.6 1.66-1.55s-.62-1.55-1.66-1.55h-3.2v3.1zm0 5.23h3.65c1.12 0 1.78-.66 1.78-1.66 0-.98-.66-1.65-1.78-1.65h-3.65v3.31z"
        fill="white"
      />
      {/* Accent dot — symbolizes the "wright" tool tap */}
      <circle cx="24" cy="24" r="1.6" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
