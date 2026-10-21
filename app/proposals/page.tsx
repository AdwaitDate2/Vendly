import Link from 'next/link';
import ProposalsGallery from '@/components/ProposalsGallery';
import { getProposals } from '@/lib/proposals';
import { loadMediaFocalPoints } from '@/lib/page-data';
import { applyMediaFocalPoints } from '@/lib/media-focal-points';

export const metadata = {
  title: 'Proposals & Client Stories — byShreen',
  description: 'Custom pieces. Real stories. Explore the couples who brought their vision to life with byShreen.',
};

export default async function ProposalsPage() {
  const proposals = await getProposals();
  const focalPointBySource = await loadMediaFocalPoints(proposals);
  return (
    <main className="proposals-page">
      <section className="content-page__hero section section--ivory">
        <span className="eyebrow">Real Stories</span>
        <h1>Custom pieces. Real stories.</h1>
        <p>
          Every piece begins with a personal conversation. From initial sketches to the moment you say yes,
          explore the bespoke commissions crafted for couples around the world.
        </p>
      </section>

      <ProposalsGallery proposals={applyMediaFocalPoints(proposals, focalPointBySource)} tone="olive" eyebrow="byShreen Proposals" title="Stories that started here." />

      <section className="final-cta">
        <h2>Ready to tell your story?</h2>
        <p>
          Whether you have a specific diamond in mind or are starting with an inspiration board,
          we will work together to create something uniquely yours.
        </p>
        <div className="final-cta__actions">
          <Link className="button button--light" href="/custom">Design Something Custom</Link>
          <Link className="button button--light" href="/book-appointment">Book a Consultation</Link>
        </div>
      </section>
    </main>
  );
}
