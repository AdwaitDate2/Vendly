import { notFound } from 'next/navigation';
import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { BLOG_RESOURCES, getBlogResource } from '@/lib/blogs';
import { listPublishedBlogPosts } from '@/lib/blog-posts';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { loadMediaFocalPoints } from '@/lib/page-data';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return BLOG_RESOURCES.map((blog) => ({ blogHandle: blog.handle }));
}

export async function generateMetadata({ params }) {
  const { blogHandle } = await params;
  const blog = getBlogResource(blogHandle);
  if (!blog) return {};
  return {
    title: `${blog.title} — byShreen`,
    description: `News and updates from byShreen.`,
  };
}

export default async function BlogPage({ params }) {
  const { blogHandle } = await params;
  const blog = getBlogResource(blogHandle);
  if (!blog) notFound();
  const [articles, template] = await Promise.all([
    listPublishedBlogPosts(blogHandle),
    getPublishedResourceTemplate('blog', blogHandle),
  ]);
  const resource = { ...blog, articles };
  const focalPointBySource = await loadMediaFocalPoints(resource, template.sections);

  return (
    <main className="blog-page">
      <ResourceTemplateRenderer resourceType="blog" resource={resource} sections={template.sections} focalPointBySource={focalPointBySource} />
    </main>
  );
}
