'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FloatingAppointmentCTA() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [overlapsFeaturedProduct, setOverlapsFeaturedProduct] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('.footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setHidden(entry.isIntersecting)),
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const updateFeaturedProductOverlap = () => {
      if (!window.matchMedia('(max-width: 640px)').matches) {
        setOverlapsFeaturedProduct(false);
        return;
      }
      const ctaBounds = document.querySelector('.floating-appointment-cta')?.getBoundingClientRect();
      if (!ctaBounds) return;
      const sectionOverlapsCta = [...document.querySelectorAll('.featured-product')].some((section) => {
        const sectionBounds = section.getBoundingClientRect();
        return sectionBounds.bottom > ctaBounds.top
          && sectionBounds.top < ctaBounds.bottom
          && sectionBounds.right > ctaBounds.left
          && sectionBounds.left < ctaBounds.right;
      });
      setOverlapsFeaturedProduct(sectionOverlapsCta);
    };
    const observer = new MutationObserver(updateFeaturedProductOverlap);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', updateFeaturedProductOverlap, { passive: true });
    window.addEventListener('resize', updateFeaturedProductOverlap);
    updateFeaturedProductOverlap();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateFeaturedProductOverlap);
      window.removeEventListener('resize', updateFeaturedProductOverlap);
    };
  }, [pathname]);

  if (pathname === '/book-appointment') return null;
  const isHidden = hidden || overlapsFeaturedProduct;
  return (
    <Link href="/book-appointment" className={`floating-appointment-cta${isHidden ? ' is-hidden' : ''}`} aria-hidden={isHidden} tabIndex={isHidden ? -1 : 0}>
      Book an Appointment
    </Link>
  );
}
