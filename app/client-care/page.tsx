// @ts-nocheck
import ContentPage from '@/components/ContentPage';
import { getContentMetadata, getPublicContent } from '@/lib/content';

export async function generateMetadata() {
  return getContentMetadata('clientCare');
}

export default async function ClientCarePage() {
  return <ContentPage content={await getPublicContent('clientCare')} eyebrow="Client care" />;
}
