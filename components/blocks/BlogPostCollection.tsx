'use client';

import { useEffect, useRef, useState } from 'react';

export default function BlogPostCollection({ layout = 'grid', children }) {
  const collectionRef = useRef(null);
  const [canMoveBackward, setCanMoveBackward] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(false);

  useEffect(() => {
    if (layout !== 'carousel') return undefined;
    const collection = collectionRef.current;
    if (!collection) return undefined;

    const updateScrollControls = () => {
      setCanMoveBackward(collection.scrollLeft > 2);
      setCanMoveForward(collection.scrollLeft + collection.clientWidth < collection.scrollWidth - 2);
    };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollControls);
    resizeObserver?.observe(collection);
    collection.addEventListener('scroll', updateScrollControls, { passive: true });
    updateScrollControls();

    return () => {
      resizeObserver?.disconnect();
      collection.removeEventListener('scroll', updateScrollControls);
    };
  }, [layout, children]);

  const scroll = (direction) => {
    const collection = collectionRef.current;
    if (!collection) return;
    const firstCard = collection.querySelector('.blog-post-card');
    const cardGap = Number.parseFloat(window.getComputedStyle(collection).columnGap) || 0;
    const step = firstCard ? firstCard.getBoundingClientRect().width + cardGap : collection.clientWidth * 0.8;
    collection.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return <>
    {layout === 'carousel' ? <div className="blog-posts-section__carousel-controls" aria-label="Blog post carousel controls">
      <button type="button" aria-label="Previous slide" onClick={() => scroll(-1)} disabled={!canMoveBackward}>Previous</button>
      <button type="button" aria-label="Next slide" onClick={() => scroll(1)} disabled={!canMoveForward}>Next slide</button>
    </div> : null}
    <div ref={collectionRef} className={`blog-posts-section__grid blog-posts-section__grid--${layout}`} data-blog-layout={layout}>
      {children}
    </div>
  </>;
}
