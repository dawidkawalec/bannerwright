import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/current-user';
import { AnnouncementBanner } from '@/components/landing/announcement-banner';
import { LandingNav } from '@/components/landing/landing-nav';
import { Hero } from '@/components/landing/hero';
import { LogoGrid } from '@/components/landing/logo-grid';
import { IntroSection } from '@/components/landing/intro-section';
import { AnchorNav } from '@/components/landing/anchor-nav';
import { FeaturePillars } from '@/components/landing/feature-pillars';
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
    </div>
  );
}
