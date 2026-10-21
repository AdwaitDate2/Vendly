'use client';

import LinkPicker from './LinkPicker';
import SortableList, { moveItem } from './SortableList';
import { newId } from '@/lib/blocks';

function LinkList({ menu, onChange, labelPlaceholder = 'Link text', hrefPlaceholder = '/page', external = false }) {
  const links = menu.cards || [];
  const setLinks = (next) => onChange({ ...menu, cards: next });
  return (
    <div className="admin-nav-editor__links">
      <SortableList
        items={links}
        onReorder={(from, to) => setLinks(moveItem(links, from, to))}
        renderItem={(link, index, handle) => (
          <div className="admin-nav-editor__link">
            <span {...handle}>⋮⋮</span>
            <input aria-label="Link text" value={link.heading || ''} placeholder={labelPlaceholder} onChange={(event) => setLinks(links.map((item, i) => (i === index ? { ...item, heading: event.target.value } : item)))} />
            {external
              ? <input aria-label="Link address" value={link.linkHref || ''} placeholder={hrefPlaceholder} onChange={(event) => setLinks(links.map((item, i) => (i === index ? { ...item, linkHref: event.target.value } : item)))} />
              : <LinkPicker value={link.linkHref || ''} onChange={(href) => setLinks(links.map((item, i) => (i === index ? { ...item, linkHref: href } : item)))} />}
            <button type="button" className="admin-text-button" onClick={() => setLinks(links.filter((_, i) => i !== index))}>Remove</button>
          </div>
        )}
      />
      <button type="button" className="admin-button admin-button--ghost" onClick={() => setLinks([...links, { id: newId('link'), heading: '', linkHref: '' }])} disabled={links.length >= 24}>+ Add link</button>
    </div>
  );
}

export default function NavigationEditor({ menus, onChange }) {
  const replace = (id, next) => onChange(menus.map((menu) => (menu.id === id ? next : menu)));
  const main = menus.find((menu) => menu.layout === 'main');
  const social = menus.find((menu) => menu.layout === 'social');
  const footer = menus.filter((menu) => menu.layout === 'footer');
  const others = menus.filter((menu) => menu.layout !== 'footer');
  const setFooter = (next) => onChange([...others.filter((menu) => menu.layout === 'main'), ...next, ...others.filter((menu) => menu.layout !== 'main')]);

  return (
    <div className="admin-nav-editor">
      {main ? (
        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>Main menu</h2><p className="admin-field-help">Shown across the top of every page and in the mobile menu.</p></div></div>
          <LinkList menu={main} onChange={(next) => replace(main.id, next)} />
        </section>
      ) : null}

      <section className="admin-card">
        <div className="admin-card__heading"><div><h2>Footer columns</h2><p className="admin-field-help">Drag columns to reorder them; each column has a title and its own links.</p></div></div>
        <SortableList
          items={footer}
          onReorder={(from, to) => setFooter(moveItem(footer, from, to))}
          renderItem={(menu, index, handle) => (
            <div className="admin-nav-editor__column">
              <div className="admin-nav-editor__column-head">
                <span {...handle}>⋮⋮</span>
                <input aria-label="Column title" value={menu.heading || ''} placeholder="Column title" onChange={(event) => setFooter(footer.map((item, i) => (i === index ? { ...item, heading: event.target.value } : item)))} />
                <button type="button" className="admin-text-button" onClick={() => { if (window.confirm(`Remove the “${menu.heading || 'untitled'}” column and its links?`)) setFooter(footer.filter((_, i) => i !== index)); }}>Remove column</button>
              </div>
              <LinkList menu={menu} onChange={(next) => setFooter(footer.map((item, i) => (i === index ? next : item)))} />
            </div>
          )}
        />
        <button type="button" className="admin-button admin-button--ghost" onClick={() => setFooter([...footer, { id: newId('footer'), type: 'menu', layout: 'footer', heading: 'New column', cards: [] }])} disabled={footer.length >= 6}>+ Add column</button>
      </section>

      {social ? (
        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>Social links</h2><p className="admin-field-help">Shown at the bottom of the footer. Use full web addresses.</p></div></div>
          <LinkList menu={social} onChange={(next) => replace(social.id, next)} labelPlaceholder="Instagram" hrefPlaceholder="https://…" external />
        </section>
      ) : null}
    </div>
  );
}
