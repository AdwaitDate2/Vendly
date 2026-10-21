import ComingSoon from '@/components/ComingSoon';
import { getStoreSettings } from '@/lib/settings';

export const metadata = { title: 'Coming soon — byShreen', robots: { index: false, follow: false } };

// Always viewable, so the landing page can be previewed before it is switched on.
export default async function ComingSoonPage() {
  const { comingSoon } = await getStoreSettings();
  return <ComingSoon page={comingSoon} />;
}
