'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    n: '01',
    title: 'Add the brand',
    body: 'Paste the client URL or upload notes. Bannerwright captures the look, fonts and tone in your knowledge base.',
  },
  {
    n: '02',
    title: 'Drop a brief',
    body: 'Describe the campaign in a sentence. Pick a format (square, story, landscape, portrait) and hit generate.',
  },
  {
    n: '03',
    title: 'Edit, ship, repeat',
    body: 'Tweak in the visual editor or via chat. Export the PNG. Promote a winner to a template for the next brief.',
  },
];

export function LandingHowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Three steps, then a banner.
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, delay: i * 0.1 }}
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-3xl font-semibold tracking-tight text-primary">{s.n}</span>
              <span className="h-px flex-1 ml-4 bg-gradient-to-r from-primary/40 to-transparent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
