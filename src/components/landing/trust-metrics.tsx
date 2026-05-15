'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { SectionWrapper } from './section-wrapper';

type Metric = {
  value: string;
  prefix?: string;
  suffix?: string;
  numeric?: number;
  label: string;
};

const METRICS: Metric[] = [
  { prefix: '~', numeric: 30, suffix: 's', value: '~30s', label: 'from brief to exported PNG' },
  { numeric: 100, suffix: '%', value: '100%', label: 'HTML, inspectable & editable' },
  { numeric: 0, value: '0', label: 'vendor lock-in, telemetry, hidden quotas' },
];

export function TrustMetrics() {
  return (
    <SectionWrapper id="metrics" alt>
      <div className="mb-14 max-w-2xl text-center md:mx-auto">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          The numbers
        </span>
        <h2 className="mt-4 text-balance text-[clamp(2rem,4vw,3rem)] font-light leading-[1.1] tracking-[-0.02em] text-foreground">
          Built to stay out of your way.
        </h2>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
        {METRICS.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>
    </SectionWrapper>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? metric.numeric ?? 0 : 0);

  useEffect(() => {
    if (!inView || reduceMotion || metric.numeric == null) return;
    const controls = animate(0, metric.numeric, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, metric.numeric, reduceMotion]);

  return (
    <div ref={ref} className="bg-background/60 p-10 text-center md:p-14">
      <div className="text-[clamp(3rem,7vw,5.5rem)] font-extralight leading-none tracking-[-0.04em] text-primary">
        {metric.prefix}
        {metric.numeric != null ? display : metric.value}
        {metric.suffix}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{metric.label}</p>
    </div>
  );
}
