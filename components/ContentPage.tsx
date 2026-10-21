// @ts-nocheck
import Link from 'next/link';

function paragraphs(value) {
  return String(value || '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const WIDTHS = { narrow: 'min(100%, 44rem)', standard: 'min(100%, 68rem)', wide: 'min(100%, 84rem)', full: '100%' };
const SPACING = { compact: '2.5rem', standard: '4rem', spacious: '6rem' };
const BACKGROUNDS = { default: 'transparent', ivory: 'var(--ivory)', paper: 'var(--paper)', olive: 'var(--ink)', mulberry: 'var(--mulberry-dark)' };

export default function ContentPage({ content, eyebrow = 'Client care', pending = false, asMain = true, children = null }) {
  const sections = content?.sections || [];
  const Wrapper = asMain ? 'main' : 'div';
  return (
    <Wrapper className="content-page">
      <section className="content-page__hero section section--ivory">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{content?.title || 'ByShreen'}</h1>
        <p>{content?.intro}</p>
        {pending ? <div className="content-page__pending">This page is being prepared. Contact the atelier for the current answer.</div> : null}
      </section>
      <section className="content-page__body section section--paper">
        {sections.length ? sections.map((item) => (
          <article className={`content-page__section content-page__section--${item.design?.spacing || 'default'} content-page__section--layout-${item.layout || 'columns'}${['olive', 'mulberry'].includes(item.design?.background) ? ' content-page__section--dark' : ''}`} key={item.id} data-block-anchor={item.id} style={{ maxWidth: !item.design?.width || item.design.width === 'default' ? undefined : WIDTHS[item.design.width], marginInline: 'auto', paddingBlock: !item.design?.spacing || item.design.spacing === 'default' ? undefined : SPACING[item.design.spacing], paddingInline: item.design?.width === 'full' ? 'clamp(1rem, 5vw, 5rem)' : undefined, textAlign: !item.design?.align || item.design.align === 'default' ? undefined : item.design.align, background: BACKGROUNDS[item.design?.background] || undefined, '--content-heading-scale': item.design?.headingSize === 'small' ? '.85' : item.design?.headingSize === 'large' ? '1.2' : '1' }}>
            <div className="content-page__section-heading">
              <span className="eyebrow">{item.eyebrow}</span>
              <h2>{item.heading}</h2>
            </div>
            <div className="content-page__section-copy">
              {paragraphs(item.body).map((paragraph, index) => <p key={`${item.id}-paragraph-${index}`}>{paragraph}</p>)}
              {item.items?.length ? <ul>{item.items.map((entry, index) => <li key={`${item.id}-item-${index}`}>{entry}</li>)}</ul> : null}
              {item.linkHref && item.linkLabel ? (
                item.linkHref.startsWith('mailto:') ? <a className="text-link" href={item.linkHref}>{item.linkLabel}</a> : <Link className="text-link" href={item.linkHref}>{item.linkLabel}</Link>
              ) : null}
            </div>
          </article>
        )) : (children ? null : (
          <div className="content-page__empty">
            <p>More detail will be published here soon.</p>
            <Link className="button" href="/book-appointment">Contact the atelier</Link>
          </div>
        ))}
        {children}
      </section>
    </Wrapper>
  );
}
