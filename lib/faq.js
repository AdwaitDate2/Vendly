import { paragraphsOf } from '@/components/RichText';

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'general';
}

// Admin FAQ entries are flat; the category field ("eyebrow") groups them in the order they appear.
export function toFaqCategories(sections) {
  const categories = [];
  for (const item of sections) {
    if (!item.heading || !item.body) continue;
    const name = item.eyebrow || 'General';
    let category = categories.find((entry) => entry.name === name);
    if (!category) {
      category = { id: slugify(name), name, items: [] };
      categories.push(category);
    }
    category.items.push({
      id: item.id,
      question: item.heading,
      answer: paragraphsOf(item.body).join(' '),
      paragraphs: paragraphsOf(item.body),
      signoff: item.note || '',
      actionLabel: item.linkLabel,
      actionHref: item.linkHref,
      secondaryActionLabel: item.secondaryLinkLabel,
      secondaryActionHref: item.secondaryLinkHref,
      design: item.design || {},
    });
  }
  return categories;
}
