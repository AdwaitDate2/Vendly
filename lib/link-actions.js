'use server';

import { requireAdminPermission } from './admin-auth';
import { getDb } from './mongodb';
import { listPolicies } from './policies';
import { getStoreSettings } from './settings';

const PAGES = [
  ['Home', '/'],
  ['Shop — all products', '/shop'],
  ['Bridal', '/bridal'],
  ['Custom jewelry', '/custom'],
  ['Proposals', '/proposals'],
  ['Our Story', '/our-story'],
  ['Craftsmanship', '/craftsmanship'],
  ['Book an appointment', '/book-appointment'],
  ['All collections', '/collections'],
  ['FAQ', '/faq'],
  ['Client care', '/client-care'],
  ['Size guide', '/size-guide'],
  ['Search', '/search'],
];

/** Every place a button can link to, grouped for the admin's link dropdown. */
export async function linkOptionsAction() {
  await requireAdminPermission('content:write');
  const groups = [{ label: 'Pages', options: PAGES.map(([label, href]) => ({ label, href })) }];
  try {
    const db = await getDb();
    const [policies, collections, products, customPages, settings] = await Promise.all([
      listPolicies(),
      db.collection('catalogCollections').find({ status: 'published' }).sort({ sortOrder: 1, name: 1 }).project({ name: 1, slug: 1 }).toArray(),
      db.collection('products').find({ status: 'published' }).sort({ title: 1 }).project({ title: 1, shortTitle: 1, slug: 1 }).toArray(),
      db.collection('customPages').find({ status: 'published' }).sort({ title: 1 }).project({ title: 1, slug: 1 }).toArray(),
      getStoreSettings(),
    ]);
    groups.push({ label: 'Policies', options: policies.map((policy) => ({ label: policy.title, href: policy.path })) });
    if (collections.length) groups.push({ label: 'Collections', options: collections.map((item) => ({ label: item.name, href: `/collections/${item.slug}` })) });
    if (customPages.length) groups.push({ label: 'Your pages', options: customPages.map((item) => ({ label: item.title, href: `/pages/${item.slug}` })) });
    if (products.length) groups.push({ label: 'Products', options: products.map((item) => ({ label: item.shortTitle || item.title, href: `/shop/${item.slug}` })) });
    if (settings.contactEmail) groups.push({ label: 'Contact', options: [{ label: `Email ${settings.contactEmail}`, href: `mailto:${settings.contactEmail}` }] });
  } catch {
    // Pages alone still work if the database is unavailable.
  }
  return groups;
}
