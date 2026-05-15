import { SectionWrapper } from './section-wrapper';
import { HeroAReel } from './hero-a-reel';

export function DemoReelSection() {
  return (
    <SectionWrapper id="see-it">
      <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            See it work
          </span>
          <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            Same workshop. Any brand, any format.
          </h2>
          <p className="mt-5 max-w-lg text-pretty text-base text-muted-foreground">
            The reel on the right cycles through real briefs — clothing drop, podcast cover, SaaS
            launch, trattoria menu, coffee shop opening, course cohort. Each one rendered from a
            two-line prompt and a brand profile.
          </p>

          <ul className="mt-8 space-y-2 border-t border-white/5 pt-6 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-primary">·</span>
              <span>Switch between formats without rewriting the brief.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">·</span>
              <span>Click any slot to inspect its brief and HTML.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">·</span>
              <span>Re-run with a tweaked voice — &quot;more confident&quot;, &quot;calmer&quot;, &quot;tighter copy.&quot;</span>
            </li>
          </ul>
        </div>

        <HeroAReel />
      </div>
    </SectionWrapper>
  );
}
