import { SectionWrapper } from './section-wrapper';

const PLACEHOLDER_LOGOS = [
  'Drift & Co.',
  'Northsignal',
  'Lumenpath',
  'Foldery',
  'Kindred Studio',
  'Brightline',
  'Helio',
  'Pinecone Lab',
];

export function LogoGrid() {
  return (
    <SectionWrapper className="!py-16">
      <p className="mb-10 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Built for solo makers, agencies, and indie SaaS
      </p>
      <div className="grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-4 md:grid-cols-8">
        {PLACEHOLDER_LOGOS.map((name) => (
          <span
            key={name}
            className="text-center font-light tracking-tight text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            style={{ fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }}
          >
            {name}
          </span>
        ))}
      </div>
    </SectionWrapper>
  );
}
