import { listCollections, listProducts } from './catalog';
import { listContentEntries } from './content';
import { listInquiries } from './leads';

export async function searchAdminWorkspace(query) {
  const normalizedQuery = String(query || '').trim().slice(0, 80);
  if (!normalizedQuery) return { query: '', products: [], collections: [], content: [], inquiries: [] };

  const [productsResult, collectionsResult, contentEntries, inquiriesResult] = await Promise.all([
    listProducts({ query: normalizedQuery, pageSize: 8 }),
    listCollections({ query: normalizedQuery, pageSize: 8 }),
    listContentEntries(),
    listInquiries({ query: normalizedQuery, pageSize: 8 }),
  ]);
  const lowered = normalizedQuery.toLowerCase();
  const content = contentEntries.filter((entry) => [entry.key, entry.title, entry.intro].join(' ').toLowerCase().includes(lowered)).slice(0, 8);
  return { query: normalizedQuery, products: productsResult.items, collections: collectionsResult.items, content, inquiries: inquiriesResult.items };
}
