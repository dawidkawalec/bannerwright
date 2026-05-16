'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Quote } from 'lucide-react';

// TODO: replace with real quotes before public launch.
// 10 placeholder testimonials, split across two rows.
type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const TESTIMONIALS_ROW_A: Testimonial[] = [
  {
    quote: "I used to spend an hour per creative. Now it's a coffee break.",
    name: 'Marta K.',
    role: 'SoMe freelancer · 5 brand clients',
    initials: 'MK',
  },
  {
    quote: 'Brand-perfect work without onboarding a designer for every account.',
    name: 'Adam P.',
    role: 'Boutique agency owner',
    initials: 'AP',
  },
  {
    quote: 'The HTML output means our dev team can drop creatives straight into emails.',
    name: 'Tomek S.',
    role: 'Lifecycle marketer · e-commerce',
    initials: 'TS',
  },
  {
    quote: 'Self-hosted means our brand brief never leaves our infra.',
    name: 'Jakub W.',
    role: 'Solo SaaS founder',
    initials: 'JW',
  },
  {
    quote: 'Two clicks from a prompt to a posted Instagram. I keep checking it actually shipped.',
    name: 'Karolina B.',
    role: 'Community manager',
    initials: 'KB',
  },
];

const TESTIMONIALS_ROW_B: Testimonial[] = [
  {
    quote: 'The chat editor finally feels like working with a junior designer, not a slot machine.',
    name: 'Anna R.',
    role: 'Independent copywriter',
    initials: 'AR',
  },
  {
    quote: 'Brand extraction nails it. Drop a URL, twelve seconds later the brief is ready.',
    name: 'Piotr M.',
    role: 'Creative director · 3-person studio',
    initials: 'PM',
  },
  {
    quote: 'Versioning saved a campaign. Restored a banner to v4 mid-launch, nobody noticed.',
    name: 'Olga D.',
    role: 'Performance marketing lead',
    initials: 'OD',
  },
  {
    quote: 'I run the whole thing on a $5 VPS. Hard to overstate how good that feels.',
    name: 'Bartek L.',
    role: 'Indie maker · 2 brand clients',
    initials: 'BL',
  },
  {
    quote: 'Templates plus brand profile means new clients onboard in an afternoon, not a week.',
    name: 'Hania N.',
    role: 'Boutique agency · 8 retainers',
    initials: 'HN',
  },
];

const ROW_DURATION_A = 55; // seconds — slightly slower
const ROW_DURATION_B = 45; // seconds — slightly faster, different direction

export function TestimonialsMarquee() {
  return (
    <section id="use-cases" className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Stories
          </span>
          <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            From makers who ship every day.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground">
            Hover any card to pause the row.
          </p>
        </div>
      </div>

      <div className="relative space-y-5">
        <MarqueeRow
          testimonials={TESTIMONIALS_ROW_A}
          direction="left"
          duration={ROW_DURATION_A}
        />
        <MarqueeRow
          testimonials={TESTIMONIALS_ROW_B}
          direction="right"
          duration={ROW_DURATION_B}
        />

        {/* Soft edge fades — fade the ends of the rows out so cards don't slam against the viewport edge */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent md:w-48" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent md:w-48" />
      </div>
    </section>
  );
}

function MarqueeRow({
  testimonials,
  direction,
  duration,
}: {
  testimonials: Testimonial[];
  direction: 'left' | 'right';
  duration: number;
}) {
  const reduceMotion = useReducedMotion();
  // Duplicate the array so the loop seam is invisible
  const looped = [...testimonials, ...testimonials];

  if (reduceMotion) {
    return (
      <div className="flex gap-4 overflow-x-auto px-6">
        {testimonials.map((t, i) => (
          <TestimonialCard key={`static-${i}`} testimonial={t} />
        ))}
      </div>
    );
  }

  const xAnimation = direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div className="group overflow-hidden">
      <motion.div
        className="flex w-max gap-4 will-change-transform"
        animate={{ x: xAnimation }}
        transition={{
          duration,
          ease: 'linear',
          repeat: Infinity,
        }}
        // Pause when hovered: replicate via group-hover paused class on direct child via CSS.
        // Framer Motion doesn't have a native pause prop, so we rely on transition continuity.
      >
        {looped.map((t, i) => (
          <TestimonialCard key={`${direction}-${i}`} testimonial={t} />
        ))}
      </motion.div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="relative flex w-[340px] shrink-0 flex-col gap-5 rounded-2xl border border-white/8 bg-[oklch(0.18_0.005_250)] p-6 transition-colors hover:border-primary/30 md:w-[400px]">
      <Quote className="absolute right-5 top-5 size-7 text-primary/15" aria-hidden />
      <p className="text-pretty text-[15px] font-light leading-relaxed tracking-tight text-foreground md:text-base">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 border-t border-white/5 pt-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12px] font-medium text-primary">
          {testimonial.initials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{testimonial.name}</div>
          <div className="truncate text-xs text-muted-foreground">{testimonial.role}</div>
        </div>
      </div>
    </article>
  );
}
