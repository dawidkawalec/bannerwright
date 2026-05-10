import Link from 'next/link';

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background/60 px-4 py-4 text-xs text-muted-foreground md:px-6">
      <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
        <p>
          © {year} Bannerwright — open-source AI workshop ·{' '}
          <Link href="/" className="hover:text-foreground">
            bannerwright.com
          </Link>
        </p>
        <p className="hidden md:block">Powered by Gemini · Self-hostable · MIT</p>
      </div>
    </footer>
  );
}
