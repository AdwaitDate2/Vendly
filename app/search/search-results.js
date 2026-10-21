import { getPublicProducts, searchPublicCatalog } from '@/lib/public-catalog';

function normalizeSort(value) {
  return ['price-ascending', 'price-descending', 'title-ascending', 'title-descending'].includes(value) ? value : 'relevance';
}

function isAvailable(product) {
  if (product.saleMode === 'enquire') return false;
  if (product.madeToOrder !== false) return true;
  return (product.variants || []).some((variant) => variant.active !== false && Number(variant.quantity || 0) > 0);
}

function filterProducts(products, params) {
  const availability = ['available', 'unavailable'].includes(params?.availability) ? params.availability : 'all';
  const minimumPrice = Number(params?.min_price);
  const maximumPrice = Number(params?.max_price);
  const hasMinimumPrice = String(params?.min_price || '').trim() !== '' && Number.isFinite(minimumPrice);
  const hasMaximumPrice = String(params?.max_price || '').trim() !== '' && Number.isFinite(maximumPrice);
  const sortBy = normalizeSort(String(params?.sort_by || ''));
  let filteredProducts = products.filter((product) => {
    const available = isAvailable(product);
    if (availability === 'available' && !available) return false;
    if (availability === 'unavailable' && available) return false;
    if (hasMinimumPrice && Number(product.price || 0) < minimumPrice) return false;
    if (hasMaximumPrice && Number(product.price || 0) > maximumPrice) return false;
    return true;
  });

  if (sortBy === 'price-ascending') filteredProducts = [...filteredProducts].sort((left, right) => left.price - right.price);
  if (sortBy === 'price-descending') filteredProducts = [...filteredProducts].sort((left, right) => right.price - left.price);
  if (sortBy === 'title-ascending') filteredProducts = [...filteredProducts].sort((left, right) => left.title.localeCompare(right.title));
  if (sortBy === 'title-descending') filteredProducts = [...filteredProducts].sort((left, right) => right.title.localeCompare(left.title));
  return { products: filteredProducts, availability, minimumPrice: hasMinimumPrice ? params.min_price : '', maximumPrice: hasMaximumPrice ? params.max_price : '', sortBy };
}

export async function getSearchPageData(params = {}, { enableTemplateFeatures = true } = {}) {
  const query = String(params.q || '').trim().slice(0, 80);
  const searchType = String(params.type || '') === 'product' ? 'product' : 'all';
  const searchResults = searchType === 'product'
    ? { products: (await getPublicProducts({ query })).products, collections: [] }
    : await searchPublicCatalog(query);
  const filtered = enableTemplateFeatures
    ? filterProducts(searchResults.products, params)
    : { products: searchResults.products, availability: 'all', minimumPrice: '', maximumPrice: '', sortBy: 'relevance' };
  const collections = searchResults.collections || [];
  const recommendedProducts = enableTemplateFeatures && query && !filtered.products.length && !collections.length
    ? (await getPublicProducts()).products.slice(0, 24)
    : [];
  return {
    query,
    searchType,
    collections,
    products: filtered.products,
    recommendedProducts,
    availability: filtered.availability,
    minimumPrice: filtered.minimumPrice,
    maximumPrice: filtered.maximumPrice,
    sortBy: filtered.sortBy,
  };
}
