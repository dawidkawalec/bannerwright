import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/current-user';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { LandingHowItWorks } from '@/components/landing/how-it-works';
import { LandingCtaFooter } from '@/components/landing/cta-footer';

export const metadata = {
  title: 'Bannerwright — AI workshop for makers of HTML banners',
  description:
    'Self-hostable, open-source AI workshop that turns a brief and brand context into editable HTML banners with PNG export.',
};

export default async function RootPage() {
  const { user } = await getSession();
  if (user) redirect('/workspaces');

  return (
    <main className="min-h-screen bg-background text-foreground">
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCtaFooter />
    </main>
  );
}
