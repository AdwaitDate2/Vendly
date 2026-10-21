import DiscountManager from '@/components/admin/DiscountManager';
import { requireAdminPermission } from '@/lib/admin-auth';
import { describeDiscount, discountStatus, listDiscounts } from '@/lib/discounts';

export default async function DiscountsPage() {
  await requireAdminPermission('discounts:manage');
  let discounts = [];
  let error = '';
  try {
    discounts = await listDiscounts();
  } catch (loadError) {
    error = loadError.message || 'The database is unavailable.';
  }
  const rows = discounts.map((discount) => ({ ...discount, summary: describeDiscount(discount), status: discountStatus(discount) }));
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Discounts</h1><p>Codes shoppers can enter at checkout. Each code can be a percentage or a fixed amount off.</p></div></div>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load discounts.</strong><span>{error}</span></div> : null}
      <DiscountManager discounts={JSON.parse(JSON.stringify(rows))} />
    </div>
  );
}
