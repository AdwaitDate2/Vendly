'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

const AUTO_SCROLL_INTERVAL = 3500;

export default function TestimonialsCarousel({
  items,
  eyebrow = 'In Their Words',
  title = 'Client stories.',
  description = 'Reflections on bespoke commissions and heirloom fine jewelry.',
}) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const card = el.querySelector('.testimonial-card');
    if (card) {
      const cardWidth = card.offsetWidth + 24;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
    }
  }, [items.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.testimonial-card');
    const scrollAmount = card ? (card.offsetWidth + 24) : 380;
    el.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isPaused || items.length < 2) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scroll(1);
      }
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, items.length]);

  const scrollToIndex = (idx) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.testimonial-card');
    const scrollAmount = card ? (card.offsetWidth + 24) : 380;
    el.scrollTo({ left: idx * scrollAmount, behavior: 'smooth' });
  };

  const resumeTimeoutRef = useRef(null);
  const pauseTemporarily = () => {
    setIsPaused(true);
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), AUTO_SCROLL_INTERVAL);
  };

  return (
    <div className="testimonials-wrap">
      <div className="testimonials__head">
        <div className="testimonials__head-title">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="testimonials__head-meta">
          <p>{description}</p>
          <div className="testimonials__controls">
            <div className="testimonials__dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`testimonials__dot${i === activeIndex ? ' is-active' : ''}`}
                  onClick={() => { pauseTemporarily(); scrollToIndex(i); }}
                  aria-label={`Go to story ${i + 1}`}
                />
              ))}
            </div>
            <div className="testimonials__nav">
              <button
                type="button"
                className="testimonials__arrow"
                onClick={() => { pauseTemporarily(); scroll(-1); }}
                disabled={!canScrollLeft}
                aria-label="Previous client story"
              >
                ←
              </button>
              <button
                type="button"
                className="testimonials__arrow"
                onClick={() => { pauseTemporarily(); scroll(1); }}
                disabled={!canScrollRight}
                aria-label="Next client story"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="testimonials__track"
        ref={trackRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {items.map((item, i) => (
          <article className="testimonial-card" key={i}>
            <div className="testimonial-card__header">
              <div className="testimonial-card__stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <span className="testimonial-card__tag">{item.tag}</span>
            </div>

            <blockquote className="testimonial-card__quote">
              &ldquo;{item.quote}&rdquo;
            </blockquote>

            <div className="testimonial-card__footer">
              <span className="testimonial-card__name">{item.name}</span>
              <span className="testimonial-card__piece">{item.piece}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
