import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { getSiteSettingsAction } from '@/app/actions/settings';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsAction();

  return (
    <>
      <SiteHeader logoSrc={settings.logo_url} siteName={settings.site_name} />
      <WhatsAppFloat />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
      <SiteFooter siteName={settings.site_name} facebookUrl={settings.facebook_url ?? undefined} />
    </>
  );
}
