import Link from 'next/link';
import { notFound } from 'next/navigation';
import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { getBlogResource } from '@/lib/blogs';
import { getPublishedBlogPost } from '@/lib/blog-posts';
import { docToText, sanitizeRichDoc } from '@/lib/rich-text';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { loadMediaFocalPoints } from '@/lib/page-data';

export const dynamic = 'force-dynamic';

async function publishedResource(params) {
  const { blogHandle, articleHandle } = await params;
  const blog = getBlogResource(blogHandle);
  if (!blog) return { blog: null, post: null };
  const post = await getPublishedBlogPost(blogHandle, articleHandle);
  if (!post) return { blog, post: null, template: null };
  const template = await getPublishedResourceTemplate('blog-post', post.id);
  return { blog, post, template };
}

export async function generateMetadata({ params }) {
  const { blog, post } = await publishedResource(params);
  if (!blog || !post) return {};
  const plainBody = docToText(sanitizeRichDoc(post.body));
  return {
    title: post.seoTitle || `${post.title} — ${blog.title} — byShreen`,
    description: post.seoDescription || post.excerpt || plainBody.slice(0, 160),
  };
}

export default async function BlogArticlePage({ params }) {
  const { blog, post, template } = await publishedResource(params);
  if (!blog || !post) notFound();
  const resource = { ...blog, article: post };
  const focalPointBySource = await loadMediaFocalPoints(resource, template.sections);

  return (
    <main className="blog-article-page">
      <Link href={`/blogs/${blog.handle}`} className="blog-article__back">← {blog.title}</Link>
      <ResourceTemplateRenderer resourceType="blog-post" resource={resource} sections={template.sections} focalPointBySource={focalPointBySource} />
    </main>
  );
}
