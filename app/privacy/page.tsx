import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('privacy');
}

export default function PrivacyPolicyPage() {
  return <PolicyPage policyKey="privacy" />;
}
