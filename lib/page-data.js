import { getInstagramFeed } from './instagram';
import { getProposals } from './proposals';
import { getPublicCatalog, getPublicCollections } from './public-catalog';
import { getTestimonials } from './testimonials';
import { listPublishedBlogPosts } from './blog-posts';
import { getMediaFocalPointBySources } from './media-metadata';
import { collectMediaImageSources, normalizeMediaFocalPoint } from './media-focal-points';

/** Published focal metadata for all managed images in a page, loaded in one database read. */
export async function loadMediaFocalPoints(...pageData) {
  const sources = collectMediaImageSources(pageData).slice(0, 500);
  if (!sources.length) return {};
  try {
    const focalPointBySource = await getMediaFocalPointBySources(sources);
    return Object.fromEntries(sources.flatMap((source) => {
      const focalPoint = normalizeMediaFocalPoint(focalPointBySource[source]);
      return focalPoint ? [[source, focalPoint]] : [];
    }));
  } catch {
    return {};
  }
}

/** Products for any "Featured products" block, as plain data so the live preview can use them too. */
export async function loadBlockProducts(blocks) {
  if (!blocks.some((block) => block.type === 'featuredProducts' || block.type === 'featuredProduct')) return [];
  const { products } = await getPublicCatalog();
  return JSON.parse(JSON.stringify(products));
}

/** Published collections for a Home Collection list section. */
export async function loadBlockCollections(blocks) {
  if (!blocks.some((block) => block.type === 'collectionListSection')) return [];
  return JSON.parse(JSON.stringify(await getPublicCollections()));
}

/** The Instagram feed for any "Instagram feed" block, or null when the page has none. */
export async function loadBlockInstagram(blocks) {
  if (!blocks.some((block) => block.type === 'instagram')) return null;
  return JSON.parse(JSON.stringify(await getInstagramFeed()));
}

/** Proposal stories for any "proposalsGallery" block, or null when the page has none. */
export async function loadBlockProposals(blocks) {
  if (!blocks.some((block) => block.type === 'proposalsGallery')) return null;
  return JSON.parse(JSON.stringify(await getProposals()));
}

/** Client testimonials for any "testimonials" block, or null when the page has none. */
export async function loadBlockTestimonials(blocks) {
  if (!blocks.some((block) => block.type === 'testimonials')) return null;
  return JSON.parse(JSON.stringify(await getTestimonials()));
}

/** Published News articles for a Home or blog posts section, in plain serializable form. */
export async function loadBlockBlogPosts(blocks) {
  if (!blocks.some((block) => block.type === 'blogPosts')) return null;
  return JSON.parse(JSON.stringify(await listPublishedBlogPosts('news')));
}
