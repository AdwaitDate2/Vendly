// Starting points for Custom HTML blocks. Plain data for the admin editor. They use the site's own
// color variables (var(--mulberry) etc.) so they follow Admin → Theme.

export const HTML_TEMPLATES = [
  {
    id: 'banner',
    label: 'Banner with button',
    html: `<div class="banner">
  <p class="eyebrow">Limited edition</p>
  <h2>The Winter Collection</h2>
  <p>Six new pieces, each made to order in 14kt and 18kt gold.</p>
  <a class="button" href="/shop">Shop the collection</a>
</div>`,
    css: `.banner { padding: 72px 24px; text-align: center; background: var(--mulberry); color: var(--ivory); }
.eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; margin: 0 0 12px; }
h2 { font-family: var(--serif); font-weight: 400; font-size: clamp(36px, 5vw, 60px); margin: 0 0 12px; }
p { max-width: 560px; margin: 0 auto 24px; line-height: 1.6; }
.button { display: inline-block; padding: 14px 28px; border: 1px solid var(--ivory); color: var(--ivory); text-decoration: none; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
.button:hover { background: var(--ivory); color: var(--mulberry); }`,
  },
  {
    id: 'two-columns',
    label: 'Photo and text, side by side',
    html: `<div class="row">
  <img src="/api/assets/ast_W_QJAJbJsv316MMJxkaEAQCA" alt="Diamond ring worn on the hand" />
  <div class="text">
    <h2>Made to be passed down</h2>
    <p>Every piece is designed with intention, sourced with care, and finished without compromise.</p>
    <a href="/our-story">Our story →</a>
  </div>
</div>`,
    css: `.row { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; max-width: 1100px; margin: 0 auto; padding: 72px 24px; }
img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
h2 { font-family: var(--serif); font-weight: 400; font-size: 44px; color: var(--ink-dark); margin: 0 0 16px; }
p { line-height: 1.7; color: var(--ink); }
a { color: var(--mulberry); }
@media (max-width: 700px) { .row { grid-template-columns: 1fr; gap: 24px; } }`,
  },
  {
    id: 'grid',
    label: 'Photo grid',
    html: `<div class="grid">
  <img src="/api/assets/ast_W_QJAJbJsv316MMJxkaEAQCA" alt="" />
  <img src="/api/assets/ast_ywUEOoSk4x84Gt7aqWDpJQ5x" alt="" />
  <img src="/api/assets/ast_gpeGcSmOELh9nslCgOeKwjCU" alt="" />
</div>`,
    css: `.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
@media (max-width: 700px) { .grid { grid-template-columns: 1fr 1fr; } }`,
  },
  {
    id: 'video',
    label: 'YouTube or Vimeo video',
    html: `<div class="video">
  <iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="byShreen video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>
</div>`,
    css: `.video { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }`,
  },
  {
    id: 'quote',
    label: 'Quote',
    html: `<figure>
  <blockquote>“The ring is everything I imagined — and somehow more.”</blockquote>
  <figcaption>— A byShreen bride</figcaption>
</figure>`,
    css: `figure { max-width: 820px; margin: 0 auto; padding: 80px 24px; text-align: center; }
blockquote { margin: 0; font-family: var(--serif); font-size: clamp(28px, 3.6vw, 44px); line-height: 1.2; color: var(--ink-dark); }
figcaption { margin-top: 20px; font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--mulberry); }`,
  },
];
