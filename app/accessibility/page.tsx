import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('accessibility');
}

export default function AccessibilityPage() {
  return <PolicyPage policyKey="accessibility" />;
}
