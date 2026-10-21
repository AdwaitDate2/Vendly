'use client';

import { useState, useRef } from 'react';
import { resolveAssetPath } from '@/lib/asset-paths';

export default function ProcessVideoCard({
  title,
  body,
  path,
  videoSrc,
  posterSrc,
  index = 0,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Video playback failed:', err);
        });
    }
  };

  const handleMouseEnter = () => {
    if (videoRef.current && !isPlaying) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <article
      className="process-card"
      key={title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="process-card__media" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={resolveAssetPath(videoSrc)}
          poster={resolveAssetPath(posterSrc)}
          playsInline
          muted
          loop
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="process-card__video"
        />

        {/* Play / Pause button indicator matching reference */}
        <button
          type="button"
          className={`process-card__play-btn ${isPlaying ? 'is-playing' : ''}`}
          aria-label={isPlaying ? `Pause video for ${title}` : `Play video for ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {isPlaying ? (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M2 1v12M10 1v12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M2 1.5l8.5 5.5-8.5 5.5V1.5z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <div className="process-card__icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--mulberry)"
          strokeWidth="1.4"
        >
          {path === 'circle' ? (
            <>
              <circle cx="12" cy="15" r="6" />
              <path d="M9 9l3-5 3 5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            path.split('|').map((d, i) => <path key={i} d={d} strokeLinecap="round" strokeLinejoin="round" />)
          )}
        </svg>
      </div>

      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
