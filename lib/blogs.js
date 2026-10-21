/** Static blog metadata; article records live in the blogPosts collection. */
export const BLOG_RESOURCES = [
  { handle: 'news', title: 'News', articles: [] },
];

export function getBlogResource(handle) {
  const blog = BLOG_RESOURCES.find((resource) => resource.handle === String(handle || '').trim());
  return blog ? structuredClone(blog) : null;
}

export function listBlogResources() {
  return BLOG_RESOURCES.map(({ handle, title }) => ({ handle, title, articles: [] }));
}
