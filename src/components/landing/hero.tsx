'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';
import { Badge } from '@/components/ui/badge';

export function LandingHero() {
  return (
    <section className="bw-hero-bg relative overflow-hidden pb-16 pt-6 sm:pb-24">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo href="/" />
        <nav className="flex items-center gap-3">
          <a
            href="https://github.com/anthropics/bannerwright"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            <Code2 className="size-4" />
            Source
          </a>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </header>

      <div className="mx-auto mt-10 max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary"
          >
            <Sparkles className="size-3" />
            Open-source · MIT · Self-hosted
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
        >
          The AI workshop for
          <span className="block bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
            makers of banners.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
        >
          Drop a brief and a brand context — get an editable HTML banner with PNG export in about
          thirty seconds. A wright is a maker; banners are HTML you can read, edit and own.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="h-11 px-5 text-sm">
            <Link href="/login">
              Open the workshop
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
            <Link href="/login">View demo</Link>
          </Button>
        </motion.div>
      </div>

      {/* mock preview */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mx-auto mt-12 max-w-5xl px-4 sm:px-6"
      >
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl ring-1 ring-foreground/5">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-[11px] font-medium text-muted-foreground">
              workshop · Acme Coffee
            </span>
          </div>
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
            <div className="hidden border-r border-border bg-sidebar p-3 lg:block">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {['Dashboard', 'Generations', 'Knowledge base', 'Templates', 'Settings'].map(
                  (label, i) => (
                    <li
                      key={label}
                      className={`rounded-md px-3 py-1.5 ${
                        i === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {label}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="col-span-2 p-5 lg:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Generations', value: '124', accent: 'from-emerald-500 to-teal-500' },
                  { label: 'AI cost', value: '$2.18', accent: 'from-blue-500 to-indigo-500' },
                  { label: 'Sources', value: '7', accent: 'from-violet-500 to-purple-500' },
                  { label: 'Templates', value: '5', accent: 'from-rose-500 to-pink-500' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div
                      className={`mb-2 inline-block size-7 rounded-md bg-gradient-to-br ${s.accent}`}
                    />
                    <p className="text-base font-semibold text-foreground">{s.value}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end gap-1 rounded-lg border border-border bg-muted/30 p-4">
                {[18, 24, 32, 28, 40, 35, 44, 38, 52, 48, 60, 56].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
