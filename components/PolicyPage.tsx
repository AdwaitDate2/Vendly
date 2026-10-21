import { notFound } from 'next/navigation';
import RichTextContent, { richTextOutline } from '@/components/RichTextContent';
import { getPolicy, policyMeta } from '@/lib/policies';
import { docToText } from '@/lib/rich-text';
import '@/app/policy-page.css';

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Metadata for a policy page, using its SEO fields or its opening text. */
export async function policyMetadata(key) {
  const policy = await getPolicy(key);
  if (!policy) return {};
  const description = policy.seoDescription || (policy.intro || docToText(policy.body)).slice(0, 160);
  return {
    title: policy.seoTitle || `${policy.title} — byShreen`,
    description,
    alternates: { canonical: policyMeta(key).path },
    ...(policy.published ? {} : { robots: { index: false } }),
  };
}

export default async function PolicyPage({ policyKey }) {
  const meta = policyMeta(policyKey);
  const policy = await getPolicy(policyKey);
  if (!meta || !policy || !policy.published) notFound();
  const outline = richTextOutline(policy.body);
  const withContents = outline.length >= 4;

  return (
    <main className="content-page policy-page">
      <section className="content-page__hero section section--ivory">
        <span className="eyebrow">{meta.eyebrow}</span>
        <h1>{policy.title}</h1>
        {policy.intro ? <p>{policy.intro}</p> : null}
        {policy.lastUpdated ? <p className="policy-page__updated">Last updated: {formatDate(policy.lastUpdated)}</p> : null}
      </section>
      <section className={`policy-page__body section section--paper${withContents ? ' has-contents' : ''}`}>
        {withContents ? (
          <nav className="policy-page__contents" aria-label="On this page">
            <span className="eyebrow">On this page</span>
            <ol>{outline.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.text.replace(/^\d+\.\s*/, '')}</a></li>)}</ol>
          </nav>
        ) : null}
        <RichTextContent doc={policy.body} className="rich-text policy-page__text" />
      </section>
    </main>
  );
}
