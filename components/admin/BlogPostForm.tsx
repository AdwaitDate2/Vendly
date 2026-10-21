// @ts-nocheck
'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import ImagePicker from './ImagePicker';
import RichTextEditor from './RichTextEditor';
import { EMPTY_DOC } from '@/lib/rich-text';
import { createBlogPostAction, saveBlogPostAction } from '@/lib/blog-admin-actions';

function FieldError({ errors, name }) {
  return errors?.[name]?.length ? <span className="admin-field-error">{errors[name][0]}</span> : null;
}

export default function BlogPostForm({ post = null }) {
  const isEditing = Boolean(post?.id);
  const action = isEditing ? saveBlogPostAction : createBlogPostAction;
  const [state, formAction, pending] = useActionState(action, { message: '', errors: {} });
  const [title, setTitle] = useState(post?.title || '');
  const [handle, setHandle] = useState(post?.handle || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [author, setAuthor] = useState(post?.author || '');
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt || '');
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription || '');
  const [status, setStatus] = useState(post?.status || 'draft');
  const [image, setImage] = useState(post?.image || '');
  const [imageAlt, setImageAlt] = useState(post?.imageAlt || '');
  const [body, setBody] = useState(post?.body || EMPTY_DOC);

  return (
    <form action={formAction} className="admin-editor-form">
      <input type="hidden" name="blogHandle" value={post?.blogHandle || 'news'} />
      {isEditing ? <><input type="hidden" name="id" value={post.id} /><input type="hidden" name="version" value={post.version || 0} /></> : null}
      <input type="hidden" name="body" value={JSON.stringify(body)} />
      <input type="hidden" name="image" value={image} />
      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">News</span><h2>Post details</h2></div><span className="admin-card__hint">Required</span></div>
            <label className="admin-field"><span>Title</span><input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. A closer look at the new collection" required autoFocus={!isEditing} /><FieldError errors={state.errors} name="title" /></label>
            <label className="admin-field"><span>URL handle</span><input name="handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="generated-from-title" pattern="[a-z0-9-]*" title="Lowercase letters, numbers, and hyphens" /><span className="admin-field-help">Leave blank to make a handle from the title. The post lives at /blogs/news/your-handle.</span><FieldError errors={state.errors} name="handle" /></label>
            <label className="admin-field"><span>Excerpt</span><textarea name="excerpt" rows="3" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="A short introduction shown on the News page." /><span className="admin-field-help">Up to 800 characters. This appears on the blog listing and in search previews.</span><FieldError errors={state.errors} name="excerpt" /></label>
          </section>

          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Article</span><h2>Post content</h2></div></div>
            <div className="admin-field"><span>Content</span><RichTextEditor value={body} onChange={setBody} label="Blog post content" maxCharacters={100000} /><span className="admin-field-help">Formatting and links are stored as sanitized rich text.</span></div>
          </section>

          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Featured media</span><h2>Post image</h2></div><span className="admin-card__hint">Optional</span></div>
            <div className="admin-field"><span>Featured image</span><ImagePicker value={image} onChange={(source, altText) => { setImage(source); if (altText !== undefined) setImageAlt(altText); }} /><span className="admin-field-help">Upload a new image or choose one from Media.</span><FieldError errors={state.errors} name="image" /></div>
            <label className="admin-field"><span>Image alt text</span><input name="imageAlt" value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={240} /><span className="admin-field-help">Describe the image for visitors using assistive technology.</span><FieldError errors={state.errors} name="imageAlt" /></label>
          </section>

          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Search preview</span><h2>SEO metadata</h2></div><span className="admin-card__hint">Optional</span></div>
            <label className="admin-field"><span>SEO title</span><input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="Use the post title if blank" /><FieldError errors={state.errors} name="seoTitle" /></label>
            <label className="admin-field"><span>SEO description</span><textarea name="seoDescription" rows="3" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="A short description for search results." /><FieldError errors={state.errors} name="seoDescription" /></label>
          </section>
        </div>

        <aside className="admin-editor-side">
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Organization</span><h2>Publishing</h2></div></div>
            <label className="admin-field"><span>Author</span><input name="author" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Name shown with this post" /><FieldError errors={state.errors} name="author" /></label>
            <label className="admin-field"><span>Publish date</span><input name="publishedAt" type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /><span className="admin-field-help">If you publish without a date, today is used.</span><FieldError errors={state.errors} name="publishedAt" /></label>
            <label className="admin-field"><span>Status</span><select name="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><FieldError errors={state.errors} name="status" /></label>
            {post?.status === 'published' ? <Link href={post.route} target="_blank" className="admin-text-link">View published post ↗</Link> : null}
          </section>
          <section className="admin-card admin-card--soft"><span className="admin-eyebrow">Publishing checklist</span><ul className="admin-checklist"><li className={post?.title ? 'is-done' : ''}>Clear post title</li><li className={post?.excerpt ? 'is-done' : ''}>Short listing excerpt</li><li className={post?.image ? 'is-done' : ''}>Featured image</li><li>Review article content</li><li>Check SEO preview</li></ul></section>
        </aside>
      </div>
      {state.message ? <div className={`admin-alert${state.saved ? '' : ' admin-alert--error'}`} role={state.saved ? 'status' : 'alert'}>{state.message}</div> : null}
      <div className="admin-savebar"><Link href="/admin/blogs" className="admin-button admin-button--ghost">Cancel</Link><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : isEditing ? status === 'published' ? 'Save and publish' : status === 'archived' ? 'Save and archive' : 'Save draft' : status === 'published' ? 'Create and publish' : status === 'archived' ? 'Create as archived' : 'Create draft'}</button></div>
    </form>
  );
}
