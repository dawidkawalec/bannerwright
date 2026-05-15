import { Check } from 'lucide-react';
import { SectionWrapper } from './section-wrapper';

const PROMISES = [
  'Editable HTML — no opaque designs',
  "Brand-aware — pulls colors, fonts, voice from your client's site",
  'Iterative — chat to refine, never regenerate from scratch',
  'Yours — self-hosted, your AI keys, your data',
];

export function IntroSection() {
  return (
    <SectionWrapper alt>
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            The workshop
          </span>
          <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
            Banners are code.
            <br />
            Treat them like it.
          </h2>
          <p className="mt-5 max-w-lg text-pretty text-base text-muted-foreground">
            Bannerwright generates HTML — not PNGs in a black box. Every creative is inspectable,
            diff-able, version-controlled. AI handles the boring parts; you stay in control.
          </p>

          <ul className="mt-8 space-y-3">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                  <Check className="size-3 text-primary" />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-transparent blur-2xl" />
          <EditorMock />
        </div>
      </div>
    </SectionWrapper>
  );
}

function EditorMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.18_0.005_250)] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-muted-foreground">
          editor — holiday-drop.html
        </span>
      </div>

      <div className="grid grid-cols-[1fr_1fr_180px] divide-x divide-white/5">
        {/* code pane */}
        <div className="p-3">
          <pre className="overflow-hidden font-mono text-[10px] leading-relaxed text-muted-foreground">
            <code>
              <span className="text-muted-foreground/60">1</span>{' '}
              <span className="text-muted-foreground">&lt;section&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">2</span> {'  '}
              <span className="text-muted-foreground">&lt;h2&gt;</span>Holiday drop.
              <span className="text-muted-foreground">&lt;/h2&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">3</span> {'  '}
              <span className="text-muted-foreground">&lt;p&gt;</span>48 hours.
              <span className="text-muted-foreground">&lt;/p&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">4</span> {'  '}
              <span className="text-muted-foreground">&lt;a&gt;</span>Shop →
              <span className="text-muted-foreground">&lt;/a&gt;</span>
              {'\n'}
              <span className="text-muted-foreground/60">5</span>{' '}
              <span className="text-muted-foreground">&lt;/section&gt;</span>
            </code>
          </pre>
        </div>

        {/* preview */}
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.74_0.21_152_/_0.3),transparent_55%),linear-gradient(135deg,oklch(0.2_0.02_250),oklch(0.16_0.02_173))]" />
          <div className="relative flex h-full flex-col justify-center gap-1 p-4">
            <span className="text-[8px] font-medium uppercase tracking-widest text-primary">
              Holiday drop
            </span>
            <h4 className="text-sm font-light leading-tight tracking-tight text-foreground">
              Holiday drop is live.
            </h4>
            <p className="text-[10px] text-muted-foreground">Up to 40% off — 48 hours.</p>
            <span className="mt-1 inline-flex w-fit items-center rounded bg-primary px-1.5 py-0.5 text-[8px] font-medium text-primary-foreground">
              Shop →
            </span>
          </div>
        </div>

        {/* chat */}
        <div className="bg-black/30 p-3">
          <div className="mb-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Chat edit
          </div>
          <ChatBubble role="user">make the CTA larger and use the brand accent</ChatBubble>
          <ChatBubble role="ai">Updated CTA → +14% size, primary teal applied. v3.</ChatBubble>
          <div className="mt-2 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[9px] text-muted-foreground">
            <span className="size-1 animate-pulse rounded-full bg-primary" />
            Refining…
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, children }: { role: 'user' | 'ai'; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] leading-snug">
      <span
        className={
          role === 'user'
            ? 'text-muted-foreground'
            : 'rounded-md bg-primary/15 px-1.5 py-0.5 text-primary'
        }
      >
        {children}
      </span>
    </div>
  );
}
