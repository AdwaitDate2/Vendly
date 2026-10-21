'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function FaqAccordion({ categories: faqCategories }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState(faqCategories[0]?.items[0]?.id || null);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return faqCategories
      .filter((cat) => selectedCategory === 'all' || cat.id === selectedCategory)
      .map((cat) => {
        if (!q) return cat;
        const matchingItems = cat.items.filter((item) => {
          return (
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
          );
        });
        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [faqCategories, selectedCategory, searchQuery]);

  return (
    <section className="faq-body">
      <div className="faq-controls">
        <div className="faq-search">
          <svg className="faq-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="faq-search__input"
            placeholder="Search questions (e.g. diamonds, appointments, custom, gold, shipping)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search frequently asked questions"
          />
          {searchQuery ? (
            <button
              type="button"
              className="faq-search__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="faq-categories-nav listing-filters listing-filters--pills" role="tablist" aria-label="FAQ Categories">
          <button
            type="button"
            className={`filter-btn ${selectedCategory === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedCategory('all')}
            role="tab"
            aria-selected={selectedCategory === 'all'}
          >
            All Questions
          </button>
          {faqCategories.map((cat) => (
            <button
              type="button"
              className={`filter-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              key={cat.id}
              role="tab"
              aria-selected={selectedCategory === cat.id}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {filteredCategories.length > 0 ? (
        filteredCategories.map((category) => (
          <div className="faq-category" key={category.id} id={category.id}>
            <div className="faq-category__header">
              <span className="eyebrow">{category.name}</span>
              <span className="faq-category__count">
                {category.items.length} {category.items.length === 1 ? 'question' : 'questions'}
              </span>
            </div>
            <div className="faq-list">
              {category.items.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div className={`faq-item${['olive', 'mulberry'].includes(item.design?.background) ? ' faq-item--dark' : ''}`} key={item.id} id={item.id} data-block-anchor={item.id} style={{ maxWidth: ({ narrow: '44rem', standard: '68rem', wide: '84rem', full: '100%' })[item.design?.width] || undefined, marginInline: 'auto', paddingBlock: ({ compact: '0', standard: '8px', spacious: '16px' })[item.design?.spacing], textAlign: item.design?.align === 'center' ? 'center' : undefined, background: ({ ivory: 'var(--ivory)', paper: 'var(--paper)', olive: 'var(--ink)', mulberry: 'var(--mulberry-dark)' })[item.design?.background] || undefined }}>
                    <button
                      type="button"
                      className="faq-item__question"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`${item.id}-answer`}
                    >
                      <span>{item.question}</span>
                      <span className={`faq-plus${isOpen ? ' faq-plus--open' : ''}`} aria-hidden="true" />
                    </button>
                    {isOpen ? (
                      <div id={`${item.id}-answer`} className="faq-item__answer" role="region" aria-label={item.question}>
                        {item.paragraphs ? (
                          item.paragraphs.map((p, pIdx) => <p key={pIdx}>{p}</p>)
                        ) : (
                          <p>{item.answer}</p>
                        )}
                        {item.signoff ? (
                          <p className="faq-item__signoff">{item.signoff}</p>
                        ) : null}
                        {item.actionHref || item.secondaryActionHref ? (
                          <div className="faq-item__actions">
                            {item.actionHref ? (
                              <Link className="text-link" href={item.actionHref}>
                                {item.actionLabel || 'Learn More →'}
                              </Link>
                            ) : null}
                            {item.secondaryActionHref ? (
                              <Link className="text-link" href={item.secondaryActionHref}>
                                {item.secondaryActionLabel || 'Explore →'}
                              </Link>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="faq-empty">
          <p>No questions matched &ldquo;{searchQuery}&rdquo;.</p>
          <button
            type="button"
            className="filter-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Reset Search &amp; Filters
          </button>
        </div>
      )}

      <div className="faq-cta-card">
        <span className="eyebrow">PERSONAL GUIDANCE</span>
        <h3>Still have questions?</h3>
        <p>
          Whether you&rsquo;re shopping for a piece from our collection, exploring a bespoke design, or looking for diamond guidance, we would love to connect with you.
        </p>
        <div className="faq-cta-card__actions">
          <Link href="/book-appointment" className="button">
            Book an Appointment →
          </Link>
          <Link href="/custom" className="button button--ghost">
            Explore Custom Jewelry →
          </Link>
        </div>
      </div>
    </section>
  );
}
