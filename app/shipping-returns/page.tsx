import PolicyPage, { policyMetadata } from '@/components/PolicyPage';

export async function generateMetadata() {
  return policyMetadata('shippingReturns');
}

export default function ShippingReturnsPage() {
  return <PolicyPage policyKey="shippingReturns" />;
}
