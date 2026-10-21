import LotusMark from './LotusMark';

// Italicises the "by" in byShreen wherever the brand name appears in the heading.
function Heading({ text }) {
  return text.split(/(by(?=shreen))/i).map((part, index) => (index % 2 ? <em key={index}>{part}</em> : part));
}

// Fixed contact links: not editable in the admin.
const CONTACT_LINKS = [
  { label: 'shreen@byshreen.com', href: 'mailto:shreen@byshreen.com', path: 'M3 5h14v10H3zM3 5l7 6 7-6' },
  { label: '@byshreen', href: 'https://www.instagram.com/byshreen/', external: true, path: 'M6.5 3h7A3.5 3.5 0 0 1 17 6.5v7a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 3 13.5v-7A3.5 3.5 0 0 1 6.5 3zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM14 6h.01' },
];

export default function ComingSoon({ page }) {
  return (
    <main className="coming-soon">
      {page.showLogo ? <LotusMark className="coming-soon__mark" /> : null}
      <h1><Heading text={page.heading} /></h1>
      {page.blocks.map((block) => (block.type === 'text' ? <p key={block.id}>{block.text}</p> : null))}
      <div className="coming-soon__links">
        {CONTACT_LINKS.map((link) => (
          <a key={link.href} href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <svg className="coming-soon__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={link.path} /></svg>
            {link.label}
          </a>
        ))}
      </div>
      <small className="coming-soon__footer">© {new Date().getFullYear()} byShreen</small>
    </main>
  );
}
