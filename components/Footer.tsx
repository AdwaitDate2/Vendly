import Link from 'next/link';
import NewsletterForm from './NewsletterForm';
import LotusMark from './LotusMark';
import { Inline } from './RichText';
import BlockRenderer from './blocks/BlockRenderer';

const LEGACY_FOOTER_NEWSLETTER = 'global.newsletter';
const LEGACY_FOOTER_COPY = 'global.footer';

function NewsletterSection({ newsletter, previewSectionId = null }) {
  return (
    <section className="pre-footer-newsletter" data-block-anchor={previewSectionId || undefined}>
      <div className="pre-footer-newsletter__inner">
        <div className="pre-footer-newsletter__copy">
          <span className="eyebrow">{newsletter.eyebrow}</span>
          <h2><Inline text={newsletter.heading} /></h2>
          <p><Inline text={newsletter.body} /></p>
        </div>
        <div className="pre-footer-newsletter__action">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

function SiteFooterSection({ footer, navigation, previewSectionId = null }) {
  return (
    <footer className="footer" data-block-anchor={previewSectionId || undefined}>
      <div className="footer__top">
        <div className="footer__brand-col">
          <LotusMark className="footer-lotus" fill="var(--ivory, #FFF6DF)" />
          <div className="footer-brand"><span>by</span>Shreen</div>
          <p className="footer-tagline"><Inline text={footer.body} /></p>
          <p className="footer-subtext"><Inline text={footer.note} /></p>
        </div>
        <div className="footer-links">
          {navigation.footer.map((column) => (
            <div key={column.id}>
              <span>{column.title}</span>
              {column.links.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href}>{link.label}</Link>)}
            </div>
          ))}
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} byShreen. All rights reserved.</span>
        <div className="footer__social">
          {navigation.social.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ sections, newsletter, footer, navigation, focalPointBySource, preview }) {
  return sections.filter((section) => section.enabled !== false).map((section) => {
    if (section.type === 'legacyReference') {
      const previewSectionId = preview ? section.id : null;
      if (section.source === LEGACY_FOOTER_NEWSLETTER) return <NewsletterSection key={section.id} newsletter={newsletter} previewSectionId={previewSectionId} />;
      if (section.source === LEGACY_FOOTER_COPY) return <SiteFooterSection key={section.id} footer={footer} navigation={navigation} previewSectionId={previewSectionId} />;
      return null;
    }
    return <div key={section.id} data-editor-theme-section={section.id} style={{ display: 'contents' }}><BlockRenderer blocks={[section]} focalPointBySource={focalPointBySource} preview={preview} /></div>;
  });
}

export default function Footer({ newsletter, footer, navigation, themeSectionGroups = null, focalPointBySource = {}, preview = false }) {
  const hasSharedGroups = themeSectionGroups?.schemaVersion === 1 && Array.isArray(themeSectionGroups.footer);
  if (hasSharedGroups) {
    return <FooterGroup sections={themeSectionGroups.footer} newsletter={newsletter} footer={footer} navigation={navigation} focalPointBySource={focalPointBySource} preview={preview} />;
  }

  return (
    <>
      <NewsletterSection newsletter={newsletter} />
      <SiteFooterSection footer={footer} navigation={navigation} />
    </>
  );
}
