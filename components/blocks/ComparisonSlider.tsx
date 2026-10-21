'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { resolveAssetPath } from '@/lib/asset-paths';
import { resolveColorSchemeSelection } from '@/lib/header-settings';
import { DEFAULT_THEME, getThemeColorScheme } from '@/lib/theme';

const asset = (source) => (source ? resolveAssetPath(source) : '');

export default function ComparisonSlider({ block }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const [position, setPosition] = useState(50);
  const activePointerId = useRef(null);
  const direction = settings.direction === 'vertical' ? 'vertical' : 'horizontal';
  const isVertical = direction === 'vertical';
  const aspectRatios = { auto: '4 / 3', portrait: '3 / 4', square: '1 / 1', landscape: '16 / 9' };
  const aspectRatio = aspectRatios[settings.aspectRatio] || aspectRatios.auto;
  const widthMode = ['fit', 'fill', 'custom'].includes(settings.widthMode) ? settings.widthMode : 'fill';
  const mobileWidthMode = ['fit', 'fill', 'custom'].includes(settings.mobileWidthMode) ? settings.mobileWidthMode : widthMode;
  const customWidth = Math.min(100, Math.max(10, Number(settings.customWidth) || 65));
  const mobileCustomWidth = Math.min(100, Math.max(10, Number(settings.mobileCustomWidth) || 100));
  const firstImageSource = asset(block.image1);
  const secondImageSource = asset(block.image2);

  const updateFromPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const offset = isVertical ? event.clientY - bounds.top : event.clientX - bounds.left;
    const size = isVertical ? bounds.height : bounds.width;
    setPosition(Math.min(100, Math.max(0, (offset / size) * 100)));
  };
  const handlePointerDown = (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  };
  const handlePointerMove = (event) => {
    if (activePointerId.current !== event.pointerId) return;
    updateFromPointer(event);
  };
  const finishPointer = (event) => {
    if (activePointerId.current === event.pointerId) activePointerId.current = null;
  };
  const handleKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 1;
    const decrementKey = isVertical ? 'ArrowDown' : 'ArrowLeft';
    const incrementKey = isVertical ? 'ArrowUp' : 'ArrowRight';
    if (event.key === decrementKey) {
      event.preventDefault();
      setPosition((current) => Math.max(0, current - step));
    } else if (event.key === incrementKey) {
      event.preventDefault();
      setPosition((current) => Math.min(100, current + step));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setPosition(100);
    }
  };

  const containerStyle = {
    aspectRatio,
    '--comparison-position': `${position}%`,
    '--comparison-width': widthMode === 'fit' ? 'fit-content' : widthMode === 'custom' ? `${customWidth}%` : '100%',
    '--comparison-mobile-width': mobileWidthMode === 'fit' ? 'fit-content' : mobileWidthMode === 'custom' ? `${mobileCustomWidth}%` : '100%',
    '--comparison-border': settings.borderStyle === 'solid' ? '1px solid color-mix(in srgb, currentColor 30%, transparent)' : 'none',
    '--comparison-radius': `${Math.min(100, Math.max(0, Number(settings.cornerRadius) || 0))}px`,
    '--comparison-padding-top': `${Math.min(120, Math.max(0, Number(settings.paddingTop) || 0))}px`,
    '--comparison-padding-right': `${Math.min(120, Math.max(0, Number(settings.paddingRight) || 0))}px`,
    '--comparison-padding-bottom': `${Math.min(120, Math.max(0, Number(settings.paddingBottom) || 0))}px`,
    '--comparison-padding-left': `${Math.min(120, Math.max(0, Number(settings.paddingLeft) || 0))}px`,
  };
  const firstAlt = String(block.image1Alt || '').trim();
  const secondAlt = String(block.image2Alt || '').trim();
  const colorSchemeNumber = resolveColorSchemeSelection(settings.colorScheme || 'scheme1', 'scheme1').number;
  const colorScheme = getThemeColorScheme(DEFAULT_THEME, colorSchemeNumber);
  const style = settings.inheritColorScheme === false ? {
    ...containerStyle,
    backgroundColor: `var(--color-scheme-${colorSchemeNumber}-base-background, ${colorScheme.base.background})`,
    color: `var(--color-scheme-${colorSchemeNumber}-base-text, ${colorScheme.base.text})`,
  } : containerStyle;

  return (
    <div className={`comparison-slider comparison-slider--${direction}${settings.inheritColorScheme === false ? ' comparison-slider--independent-colors' : ''}`} style={style}>
      <div className="comparison-slider__frame">
        {secondImageSource ? <Image className="comparison-slider__image comparison-slider__image--second" src={secondImageSource} alt={secondAlt} fill sizes="(max-width: 700px) 100vw, 70vw" /> : <div className="comparison-slider__empty comparison-slider__empty--second">Choose Image 2 in the block settings.</div>}
        {firstImageSource ? <div className="comparison-slider__reveal" style={{ clipPath: isVertical ? `inset(0 0 ${100 - position}% 0)` : `inset(0 ${100 - position}% 0 0)` }}><Image className="comparison-slider__image comparison-slider__image--first" src={firstImageSource} alt={firstAlt} fill sizes="(max-width: 700px) 100vw, 70vw" /></div> : <div className="comparison-slider__empty comparison-slider__empty--first" style={{ clipPath: isVertical ? `inset(0 0 ${100 - position}% 0)` : `inset(0 ${100 - position}% 0 0)` }}>Choose Image 1 in the block settings.</div>}
        {settings.textOnImages ? <>
          <span className="comparison-slider__label comparison-slider__label--first">Image 1</span>
          <span className="comparison-slider__label comparison-slider__label--second">Image 2</span>
        </> : null}
        <div
          className="comparison-slider__control"
          role="slider"
          tabIndex={0}
          aria-label="Image comparison reveal"
          aria-orientation={isVertical ? 'vertical' : 'horizontal'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)} percent of Image 1 revealed`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onLostPointerCapture={finishPointer}
          onKeyDown={handleKeyDown}
        >
          <span className="comparison-slider__divider" aria-hidden="true" />
          <span className="comparison-slider__handle" aria-hidden="true">{isVertical ? '↕' : '↔'}</span>
        </div>
      </div>
    </div>
  );
}
