import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('privacyChoices');
}

export default function PrivacyChoicesPage() {
  return <PolicyPage policyKey="privacyChoices" />;
}
