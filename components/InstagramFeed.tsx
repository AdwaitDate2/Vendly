'use client';

import Image from 'next/image';
import { resolveAssetPath } from '@/lib/asset-paths';
import { DEFAULT_FEED } from '@/lib/instagram-defaults';


function InstagramIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

export default function InstagramFeed({ feed = DEFAULT_FEED }) {
  const posts = (feed.posts || []).filter((post) => !post.hidden && post.image);
  if (!posts.length) return null;
  const profileUrl = feed.profileUrl || DEFAULT_FEED.profileUrl;
  return (
    <section className="instagram-section" id="instagram">
      <div className="instagram-header">
        {feed.eyebrow ? <span className="eyebrow">{feed.eyebrow}</span> : null}
        <h2>{feed.heading || DEFAULT_FEED.heading}</h2>
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="instagram-follow-btn"
          aria-label="Follow @byshreen on Instagram"
        >
          <InstagramIcon size={14} />
          <span>Follow on Instagram ↗</span>
        </a>
      </div>

      <div className="instagram-grid">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noreferrer"
            className="instagram-grid__item"
            aria-label={post.alt || (post.isVideo ? 'byShreen Reel on Instagram' : 'byShreen on Instagram')}
          >
            <Image
              src={resolveAssetPath(post.image)}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              unoptimized
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...(post.imagePosition ? { objectPosition: post.imagePosition } : {}),
                display: 'block',
                transition: 'transform .6s cubic-bezier(.16,1,.3,1)',
              }}
            />
            {post.isVideo && (
              <span className="instagram-grid__video-badge" aria-hidden="true">
                <PlayIcon />
              </span>
            )}
            <div className="instagram-grid__overlay">
              <div className="instagram-grid__overlay-icon">
                <InstagramIcon size={22} />
                <span>{post.isVideo ? 'Watch Reel' : 'View Post'}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
