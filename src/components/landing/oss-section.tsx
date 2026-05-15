import { Server, KeyRound, ArrowRight } from 'lucide-react';
import { SectionWrapper } from './section-wrapper';
import { GithubIcon } from './github-icon';

const PILLARS = [
  {
    icon: GithubIcon,
    title: 'Open source',
    body: 'MIT licensed. Read the code, fork it, contribute. No closed core, no enterprise tier gating the good parts.',
    cta: { label: 'View on GitHub', href: 'https://github.com/dawidkawalec/bannerwright' },
  },
  {
    icon: Server,
    title: 'Self-hosted',
    body: 'One VPS. One .env. One user. Your data — briefs, brand assets, generated creatives — never leaves your box.',
    cta: { label: 'Deploy guide', href: '#' },
  },
  {
    icon: KeyRound,
    title: 'Bring your own keys',
    body: 'Direct Gemini API. No markup on tokens, no shared quota, no lock-in. Swap providers if you ever want to.',
    cta: { label: 'Setup', href: '#' },
  },
];

export function OssSection() {
  return (
    <SectionWrapper id="open-source" alt>
      <div className="mb-14 max-w-2xl">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Why it&apos;s different
        </span>
        <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
          Open by default. Yours by design.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-background/40 p-7 transition-colors hover:border-primary/30"
          >
            <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <p.icon className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-light tracking-tight text-foreground">{p.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{p.body}</p>
            <a
              href={p.cta.href}
              target={p.cta.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary transition-all hover:gap-2"
            >
              {p.cta.label}
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
