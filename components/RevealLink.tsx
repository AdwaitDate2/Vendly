// @ts-nocheck
'use client';

import Link from 'next/link';
import Reveal from './Reveal';

export default function RevealLink({ href, className, delay, children }) {
  return (
    <Reveal as={Link} href={href} className={className} delay={delay}>
      {children}
    </Reveal>
  );
}
