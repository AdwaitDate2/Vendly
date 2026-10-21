import Link from 'next/link';
import { notFound } from 'next/navigation';
import HelpSketch from '@/components/admin/HelpSketch';
import { requireAdminSession } from '@/lib/admin-auth';
import { HELP_GUIDES, getGuide } from '@/lib/help-guides';
import { HELP_IMAGES } from '@/lib/help-images';
import { HELP_SHOTS } from '@/lib/help-shots';
import { TOURS } from '@/lib/admin-tours';

const TOUR_FOR = { dashboard: 'home', requests: 'requests', appointments: 'appointments' };

export default async function HelpGuidePage({ params }) {
  await requireAdminSession();
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const index = HELP_GUIDES.indexOf(guide);
  const previous = HELP_GUIDES[index - 1];
  const next = HELP_GUIDES[index + 1];
  const shot = HELP_SHOTS[slug] && HELP_IMAGES[slug] ? HELP_SHOTS[slug] : null;
  const detailShot = guide.detail && HELP_SHOTS[guide.detail.shot] && HELP_IMAGES[guide.detail.shot] ? HELP_SHOTS[guide.detail.shot] : null;
  const detailParts = detailShot ? guide.detail.parts.map((part, i) => ({ ...part, pin: detailShot.pins[i] })).filter((part) => part.pin) : [];
  // With a real screenshot, only the parts that have a pin are listed, and they are numbered to match.
  const parts = shot ? guide.parts.map((part, i) => ({ ...part, pin: shot.pins[i] })).filter((part) => part.pin) : guide.parts;
  const tourKey = TOUR_FOR[slug];
  return (
    <div className="admin-page help-guide">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/help" className="admin-back-link">← Help &amp; guides</Link>
          <span className="admin-eyebrow">{guide.who}</span>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
        </div>
        <div className="help-heading-actions">
          {tourKey && TOURS[tourKey] ? <Link href={`${TOURS[tourKey].path}?tour=1`} className="admin-button admin-button--ghost">Show me around</Link> : null}
          <Link href={guide.path} className="admin-button">Open {guide.title} →</Link>
        </div>
      </div>

      <section className="admin-card help-screen">
        <div className="admin-card__heading"><div><span className="admin-eyebrow">The screen</span><h2>What you will see, and what each part does</h2></div></div>
        {shot ? (
          <figure className="help-shot">
            <div className="help-shot__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HELP_IMAGES[slug].src} width={shot.w} height={shot.h} alt={`The ${guide.title} screen in the admin`} loading="lazy" />
              {parts.map((part, i) => <i key={part.label} className="help-shot__pin" style={{ left: `${part.pin.x}%`, top: `${part.pin.y}%` }}>{i + 1}</i>)}
            </div>
          </figure>
        ) : null}
        <div className={shot ? '' : 'help-screen__grid'}>
          {shot ? null : <HelpSketch layout={guide.layout} parts={parts} />}
          <ol className="help-legend">
            {parts.map((part) => <li key={part.label}><strong>{part.label}</strong><span>{part.text}</span></li>)}
          </ol>
        </div>
      </section>

      {detailShot ? (
        <section className="admin-card help-screen">
          <div className="admin-card__heading"><div><span className="admin-eyebrow">One step further</span><h2>{guide.detail.title}</h2></div></div>
          <figure className="help-shot">
            <div className="help-shot__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HELP_IMAGES[guide.detail.shot].src} width={detailShot.w} height={detailShot.h} alt={guide.detail.title} loading="lazy" />
              {detailParts.map((part, i) => <i key={part.label} className="help-shot__pin" style={{ left: `${part.pin.x}%`, top: `${part.pin.y}%` }}>{i + 1}</i>)}
            </div>
          </figure>
          <ol className="help-legend">
            {detailParts.map((part) => <li key={part.label}><strong>{part.label}</strong><span>{part.text}</span></li>)}
          </ol>
        </section>
      ) : null}

      <section className="help-tasks">
        <h2>Step by step</h2>
        {guide.tasks.map((task, i) => (
          <details className="admin-card help-task" key={task.title} open={i === 0}>
            <summary><span>{task.title}</span></summary>
            <ol className="help-steps">{task.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </details>
        ))}
      </section>

      {guide.tips?.length ? (
        <section className="help-tips">
          <h2>Good to know</h2>
          <ul>{guide.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </section>
      ) : null}

      {guide.faqs?.length ? (
        <section className="help-faq">
          <h2>Common questions</h2>
          {guide.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </section>
      ) : null}

      <nav className="help-pager" aria-label="More guides">
        {previous ? <Link href={`/admin/help/${previous.slug}`}><small>Previous</small>{previous.title}</Link> : <span />}
        {next ? <Link href={`/admin/help/${next.slug}`}><small>Next</small>{next.title}</Link> : <span />}
      </nav>
    </div>
  );
}
