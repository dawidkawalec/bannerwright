import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth/current-user';
import { AnnouncementBanner } from '@/components/landing/announcement-banner';
import { LandingNav } from '@/components/landing/landing-nav';
import { HeroA } from '@/components/landing/hero-a';
import { HeroB } from '@/components/landing/hero-b';
import { HeroC } from '@/components/landing/hero-c';
import { HeroSwitcher } from '@/components/landing/hero-switcher';
import { LogoGrid } from '@/components/landing/logo-grid';
import { IntroSection } from '@/components/landing/intro-section';
import { AnchorNav } from '@/components/landing/anchor-nav';
import { FeaturePillars } from '@/components/landing/feature-pillars';
import { OssSection } from '@/components/landing/oss-section';
import { TestimonialsCarousel } from '@/components/landing/testimonials-carousel';
import { TrustMetrics } from '@/components/landing/trust-metrics';
import { FinalCTA } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

type SearchParams = { hero?: string };

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await getSession();
  if (user) redirect('/workspaces');

  const params = await searchParams;
  const variant = (params.hero ?? 'a').toLowerCase();
  const Hero = variant === 'b' ? HeroB : variant === 'c' ? HeroC : HeroA;

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <AnnouncementBanner />
      <LandingNav />
      <main>
        <Hero />
        <LogoGrid />
        <IntroSection />
        <AnchorNav />
        <FeaturePillars />
        <OssSection />
        <TestimonialsCarousel />
        <TrustMetrics />
        <FinalCTA />
      </main>
      <LandingFooter />
      <Suspense fallback={null}>
        <HeroSwitcher />
      </Suspense>
    </div>
  );
}
