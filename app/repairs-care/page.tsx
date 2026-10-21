import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('repairsCare');
}

export default function RepairsCarePage() {
  return <PolicyPage policyKey="repairsCare" />;
}
