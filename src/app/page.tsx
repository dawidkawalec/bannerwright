import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/current-user';
import { AnnouncementBanner } from '@/components/landing/announcement-banner';
import { LandingNav } from '@/components/landing/landing-nav';
import { HeroB } from '@/components/landing/hero-b';
import { LogoGrid } from '@/components/landing/logo-grid';
import { IntroSection } from '@/components/landing/intro-section';
import { PipelineSection } from '@/components/landing/pipeline-section';
import { PipelineSectionV2 } from '@/components/landing/pipeline-section-v2';
import { AnchorNav } from '@/components/landing/anchor-nav';
import { FeaturePillars } from '@/components/landing/feature-pillars';
import { DemoReelSection } from '@/components/landing/demo-reel-section';
import { OssSection } from '@/components/landing/oss-section';
import { TestimonialsCarousel } from '@/components/landing/testimonials-carousel';
import { TrustMetrics } from '@/components/landing/trust-metrics';
import { FinalCTA } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export default async function RootPage() {
  const { user } = await getSession();
  if (user) redirect('/workspaces');

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <AnnouncementBanner />
      <LandingNav />
      <main>
        <HeroB />
        <LogoGrid />
        <IntroSection />
        <VariantLabel name="Variant A · sticky stack + flying banners" />
        <PipelineSection />
        <VariantLabel name="Variant B · split-screen + step-swap preview" />
        <PipelineSectionV2 />
        <AnchorNav />
        <FeaturePillars />
        <DemoReelSection />
        <OssSection />
        <TestimonialsCarousel />
        <TrustMetrics />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

// Tiny inline tag we sit above each pipeline variant so they're easy to tell apart
// while the two are running side-by-side. Remove once you pick a winner.
function VariantLabel({ name }: { name: string }) {
  return (
    <div className="bg-[oklch(0.13_0.005_250)] px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="inline-flex h-1 w-8 rounded-full bg-primary/60" />
        <span>{name}</span>
      </div>
    </div>
  );
}
