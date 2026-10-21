import { FULFILLMENT_STATUSES, PAYMENT_STATUSES } from '@/lib/order-statuses';

export function PaymentBadge({ status }) {
  return <span className={`admin-badge admin-badge--pay-${status}`}>{PAYMENT_STATUSES[status] || status}</span>;
}

export function FulfillmentBadge({ status }) {
  return <span className={`admin-badge admin-badge--ful-${status}`}>{FULFILLMENT_STATUSES[status] || status}</span>;
}
