import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('terms');
}

export default function TermsPage() {
  return <PolicyPage policyKey="terms" />;
}
