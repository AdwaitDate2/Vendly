import FaqAccordion from './FaqAccordion';
import { toFaqCategories } from '@/lib/faq';
import { getContentMetadata, getPublicContent } from '@/lib/content';

export async function generateMetadata() {
  return getContentMetadata('faq');
}

export default async function FaqPage() {
  const content = await getPublicContent('faq');
  const faqCategories = toFaqCategories(content.sections || []);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((category) =>
      category.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      }))
    ),
  };

  return (
    <main className="content-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="content-page__hero section section--ivory">
        <span className="eyebrow">FAQ</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </section>
      <FaqAccordion categories={faqCategories} />
    </main>
  );
}

