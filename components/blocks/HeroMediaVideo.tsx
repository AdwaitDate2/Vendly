'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/** A video layer whose responsive poster stays visible until playback produces a frame. */
export default function HeroMediaVideo({
  src,
  mobileSrc,
  poster,
  mobilePoster,
  showDifferentOnMobile,
  className,
  posterClassName,
  videoStyle,
  imageStyle,
  mobileImageStyle,
  priority = false,
}) {
  const mobilePosterIsDistinct = Boolean(showDifferentOnMobile && mobilePoster && mobilePoster !== poster);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoElementRef = useRef(null);

  useEffect(() => {
    const videoElement = videoElementRef.current;
    if (!videoElement) return undefined;

    const syncInitialPlaybackState = () => {
      setIsPlaying(!videoElement.paused && !videoElement.ended && videoElement.readyState >= 2);
    };
    const showPlayingFrame = () => setIsPlaying(true);
    const showPoster = () => setIsPlaying(false);

    videoElement.addEventListener('playing', showPlayingFrame);
    videoElement.addEventListener('pause', showPoster);
    videoElement.addEventListener('waiting', showPoster);
    videoElement.addEventListener('stalled', showPoster);
    syncInitialPlaybackState();

    return () => {
      videoElement.removeEventListener('playing', showPlayingFrame);
      videoElement.removeEventListener('pause', showPoster);
      videoElement.removeEventListener('waiting', showPoster);
      videoElement.removeEventListener('stalled', showPoster);
    };
  }, []);

  return (
    <div className={`hero-video-layer${mobilePosterIsDistinct ? ' hero-video-layer--responsive-poster' : ''}${isPlaying ? ' is-playing' : ''}`}>
      {poster ? (
        <Image
          className={`${posterClassName} hero-video-poster hero-video-poster--desktop`}
          src={poster}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          style={imageStyle}
        />
      ) : null}
      {mobilePosterIsDistinct ? (
        <Image
          className={`${posterClassName} hero-video-poster hero-video-poster--mobile`}
          src={mobilePoster}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          style={mobileImageStyle}
        />
      ) : null}
      <video
        className={className}
        style={videoStyle}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        ref={videoElementRef}
      >
        {mobileSrc ? <source media="(max-width: 700px)" src={mobileSrc} /> : null}
        {src ? <source src={src} /> : null}
      </video>
    </div>
  );
}
