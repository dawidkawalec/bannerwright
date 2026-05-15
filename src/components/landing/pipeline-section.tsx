import { SectionWrapper } from './section-wrapper';
import { HeroCPipeline } from './hero-c-pipeline';

export function PipelineSection() {
  return (
    <SectionWrapper id="pipeline" alt>
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            How it works
          </span>
          <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            URL to PNG — in five inspectable steps.
          </h2>
          <p className="mt-5 max-w-lg text-pretty text-base text-muted-foreground">
            Drop a client URL. Bannerwright captures the brand brief, drafts a creative, streams
            HTML, and renders the PNG. Every step is visible, editable, and version-controlled —
            nothing happens inside a black box.
          </p>

          <ul className="mt-8 space-y-2 border-t border-white/5 pt-6 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-primary">·</span>
              <span>Pause anywhere — restart from a different prompt or brand profile.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">·</span>
              <span>Every transition logs `llm_usage` so you see token cost in real time.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">·</span>
              <span>Output is HTML first, PNG second — re-render any version on demand.</span>
            </li>
          </ul>
        </div>

        <HeroCPipeline />
      </div>
    </SectionWrapper>
  );
}
