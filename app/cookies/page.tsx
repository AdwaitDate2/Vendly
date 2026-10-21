import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('cookies');
}

export default function CookiesPage() {
  return <PolicyPage policyKey="cookies" />;
}
