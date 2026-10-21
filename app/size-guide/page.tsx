// @ts-nocheck
import ContentPage from '@/components/ContentPage';
import { getContentMetadata, getPublicContent } from '@/lib/content';

export async function generateMetadata() {
  return getContentMetadata('sizeGuide');
}

export default async function SizeGuidePage() {
  return <ContentPage content={await getPublicContent('sizeGuide')} eyebrow="Client care" />;
}
