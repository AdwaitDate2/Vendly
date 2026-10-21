// @ts-nocheck
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaFocalPointBySourceAction, saveMediaAltTextAction, saveMediaFocalPointAction } from '@/lib/media-actions';
import { thumbnailUrl, uploadMedia } from './ImagePicker';

const MAX_IMAGE_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const ASPECT_RATIOS = {
  original: null,
  square: 1,
  threeTwo: 3 / 2,
  fiveFour: 5 / 4,
  sevenFive: 7 / 5,
  sixteenNine: 16 / 9,
  freeform: null,
};
const ASPECT_LABELS = { original: 'Original', square: 'Square', threeTwo: '3:2', fiveFour: '5:4', sevenFive: '7:5', sixteenNine: '16:9', freeform: 'Freeform' };
const MONOCHROME_SWATCHES = ['#000000', '#ffffff', '#808080'];
const STANDARD_SWATCHES = ['#c62828', '#ed6c02', '#f9a825', '#2e7d32', '#1565c0', '#6a1b9a'];
const ALL_SWATCHES = [...MONOCHROME_SWATCHES, ...STANDARD_SWATCHES];

async function readImageResponse(response, onProgress) {
  if (!response.body?.getReader) return response.blob();
  const reader = response.body.getReader();
  const chunks = [];
  const total = Number(response.headers.get('content-length')) || 0;
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    loaded += value.byteLength;
    if (loaded > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error('Images over 40 MB can be viewed but cannot be edited here.');
    }
    chunks.push(value);
    onProgress({ loaded, total });
  }
  return new Blob(chunks, { type: response.headers.get('content-type') || '' });
}

async function animatedImageFormat(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 128 * 1024).arrayBuffer());
  const text = new TextDecoder('latin1').decode(bytes);
  if (text.startsWith('GIF87a') || text.startsWith('GIF89a') || text.includes('acTL')) return true;
  if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') {
    const extendedHeader = text.indexOf('VP8X');
    if (extendedHeader >= 0 && bytes[extendedHeader + 8] & 0x02) return true;
  }
  return text.includes('avis');
}

function sourceFileName(item) {
  return String(item.label || 'image').replace(/\.[^.]+$/, '') || 'image';
}

function drawContained(context, image, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

export default function MediaImageEditor({ item, altText = '', onClose, onSaved }) {
  const imageCanvasRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const stageRef = useRef(null);
  const cropDragOffsetRef = useRef(null);
  const strokeRef = useRef(null);
  const dialogRef = useRef(null);
  const exitButtonRef = useRef(null);
  const [activeTool, setActiveTool] = useState('information');
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [dimensions, setDimensions] = useState(null);
  const [displayDimensions, setDisplayDimensions] = useState(null);
  const [aspect, setAspect] = useState('original');
  const [orientation, setOrientation] = useState('horizontal');
  const [zoom, setZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0.5, y: 0.5 });
  const [freeformSize, setFreeformSize] = useState({ width: 1, height: 1 });
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(20);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [hasTransparency, setHasTransparency] = useState(false);
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [lockRatio, setLockRatio] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [focalPoint, setFocalPoint] = useState({ x: 0.5, y: 0.5 });
  const [savedFocalPoint, setSavedFocalPoint] = useState(null);
  const [focalPointChangedAgainstOriginal, setFocalPointChangedAgainstOriginal] = useState(false);
  const [focalPointLoadState, setFocalPointLoadState] = useState('loading');
  const [focalPointLoadAttempt, setFocalPointLoadAttempt] = useState(0);
  const [focalPointSaving, setFocalPointSaving] = useState(false);
  const [focalPointError, setFocalPointError] = useState('');
  const [focalPointMessage, setFocalPointMessage] = useState('');

  useEffect(() => {
    let disposed = false;
    let loadSucceeded = false;
    const loadFocalPoint = async () => {
      setFocalPointLoadState('loading');
      setFocalPointError('');
      setFocalPointMessage('');
      setFocalPoint({ x: 0.5, y: 0.5 });
      setSavedFocalPoint(null);
      setFocalPointChangedAgainstOriginal(false);
      try {
        const result = await mediaFocalPointBySourceAction(item.src);
        if (disposed) return;
        if (!result.ok) {
          setFocalPointError(result.error || 'Could not load the saved focal point.');
        } else if (result.focalPoint) {
          loadSucceeded = true;
          setFocalPoint(result.focalPoint);
          setSavedFocalPoint(result.focalPoint);
        } else loadSucceeded = true;
      } catch {
        if (!disposed) setFocalPointError('Could not load the saved focal point.');
      } finally {
        if (!disposed) setFocalPointLoadState(loadSucceeded ? 'ready' : 'error');
      }
    };
    loadFocalPoint();
    return () => { disposed = true; };
  }, [focalPointLoadAttempt, item.src]);

  const paintDisplay = useCallback(() => {
    const workingCanvas = imageCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!workingCanvas || !displayCanvas || !workingCanvas.width || !workingCanvas.height) return;
    const maxWidth = Math.max(1, (stageRef.current?.clientWidth || 900) - 56);
    const maxHeight = Math.max(1, (stageRef.current?.clientHeight || 650) - 56);
    const scale = Math.min(maxWidth / workingCanvas.width, maxHeight / workingCanvas.height, 1);
    displayCanvas.width = Math.max(1, Math.round(workingCanvas.width * scale));
    displayCanvas.height = Math.max(1, Math.round(workingCanvas.height * scale));
    setDisplayDimensions({ width: displayCanvas.width, height: displayCanvas.height });
    const context = displayCanvas.getContext('2d');
    context.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    drawContained(context, workingCanvas, displayCanvas.width, displayCanvas.height);
    setDimensions({ width: workingCanvas.width, height: workingCanvas.height });
    setResizeWidth(String(workingCanvas.width));
    setResizeHeight(String(workingCanvas.height));
  }, []);

  const getCropRect = useCallback(() => {
    if (!dimensions) return null;
    const current = dimensions;
    const presetRatio = ASPECT_RATIOS[aspect];
    const sourceRatio = current.width / current.height;
    const targetRatio = aspect === 'original'
      ? orientation === 'horizontal' ? Math.max(sourceRatio, 1 / sourceRatio) : Math.min(sourceRatio, 1 / sourceRatio)
      : aspect === 'freeform' ? null : orientation === 'horizontal' ? presetRatio : 1 / presetRatio;
    const width = aspect === 'freeform'
      ? current.width * freeformSize.width / zoom
      : Math.min(current.width, current.height * targetRatio) / zoom;
    const height = aspect === 'freeform'
      ? current.height * freeformSize.height / zoom
      : width / targetRatio;
    return {
      left: Math.max(0, Math.min(current.width - width, cropPosition.x * current.width - width / 2)),
      top: Math.max(0, Math.min(current.height - height, cropPosition.y * current.height - height / 2)),
      width,
      height,
    };
  }, [aspect, cropPosition, dimensions, freeformSize, orientation, zoom]);

  const moveCropFrame = (event) => {
    const canvasBounds = event.currentTarget.parentElement.getBoundingClientRect();
    const dragOffset = cropDragOffsetRef.current || { x: 0, y: 0 };
    setCropPosition({
      x: Math.max(0, Math.min(1, ((event.clientX - canvasBounds.left) / canvasBounds.width) - dragOffset.x)),
      y: Math.max(0, Math.min(1, ((event.clientY - canvasBounds.top) / canvasBounds.height) - dragOffset.y)),
    });
  };

  const currentCrop = getCropRect();
  const numericResizeWidth = Number(resizeWidth);
  const numericResizeHeight = Number(resizeHeight);
  const resizeDimensionsValid = Number.isInteger(numericResizeWidth) && Number.isInteger(numericResizeHeight)
    && numericResizeWidth > 0 && numericResizeHeight > 0 && numericResizeWidth * numericResizeHeight <= MAX_IMAGE_PIXELS;
  const resizeChangesImage = Boolean(dimensions && resizeDimensionsValid && (numericResizeWidth !== dimensions.width || numericResizeHeight !== dimensions.height));
  const cropChangesImage = Boolean(currentCrop && dimensions && (
    currentCrop.left > 1 || currentCrop.top > 1 || currentCrop.width < dimensions.width - 1 || currentCrop.height < dimensions.height - 1
  ));

  const detectTransparency = (image, contentType) => {
    if (!['image/png', 'image/webp', 'image/avif'].includes(String(contentType).toLowerCase())) {
      setHasTransparency(false);
      return;
    }
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 512;
    sampleCanvas.height = 512;
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) { setHasTransparency(false); return; }
    context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
    try {
      const alphaValues = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      let transparent = false;
      for (let alphaIndex = 3; alphaIndex < alphaValues.length; alphaIndex += 4) {
        if (alphaValues[alphaIndex] < 255) { transparent = true; break; }
      }
      setHasTransparency(transparent);
    } catch {
      setHasTransparency(false);
    }
  };

  useEffect(() => {
    let disposed = false;
    let objectUrl = '';
    let timedOut = false;
    let timeoutId;
    const controller = new AbortController();
    const loadImage = async () => {
      setLoadState('loading');
      setLoadError('');
      setLoadProgress({ loaded: 0, total: 0 });
      timeoutId = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
        if (!disposed) {
          setLoadError('Loading this original image took too long. Check your connection and retry.');
          setLoadState('error');
        }
      }, 45_000);
      try {
        const sourceUrl = item.id ? `/api/assets/${encodeURIComponent(item.id)}/download` : item.src;
        const response = await fetch(sourceUrl, { credentials: 'same-origin', signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 401 ? 'Your session ended. Sign in again to edit this image.' : 'This image could not be opened for editing.');
        const blob = await readImageResponse(response, setLoadProgress);
        setLoadProgress({ loaded: blob.size, total: blob.size, decoding: true });
        if (blob.size > MAX_IMAGE_BYTES) throw new Error('Images over 40 MB can be viewed but cannot be edited here.');
        if (!blob.type.startsWith('image/')) throw new Error('This file format cannot be edited as a still image.');
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(blob.type.toLowerCase())) throw new Error('This image format is not supported by the editor. Your original file is unchanged.');
        if (await animatedImageFormat(blob)) throw new Error('Animated images cannot be edited here because this editor exports still images. Your original file is unchanged.');
        objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          if (disposed || timedOut) return;
          window.clearTimeout(timeoutId);
          if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
            setLoadError('This image is larger than the 40 megapixel editing limit.');
            setLoadState('error');
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            setLoadError('Canvas editing is unavailable in this browser.');
            setLoadState('error');
            return;
          }
          try {
            context.drawImage(image, 0, 0);
            imageCanvasRef.current = canvas;
            detectTransparency(image, blob.type);
            setOrientation(image.naturalWidth >= image.naturalHeight ? 'horizontal' : 'vertical');
            setLoadState('ready');
            requestAnimationFrame(paintDisplay);
          } catch {
            setLoadError('This image format cannot be edited by this browser. Your original file is unchanged.');
            setLoadState('error');
          }
        };
        image.onerror = () => {
          window.clearTimeout(timeoutId);
          if (!disposed) {
            setLoadError('This image format could not be decoded by this browser. Your original file is unchanged.');
            setLoadState('error');
          }
        };
        image.src = objectUrl;
      } catch (caughtError) {
        window.clearTimeout(timeoutId);
        if (!disposed) {
          setLoadError(timedOut ? 'Loading this original image took too long. Check your connection and retry.' : caughtError.message || 'This image could not be loaded.');
          setLoadState('error');
        }
      }
    };
    loadImage();
    return () => { disposed = true; controller.abort(); window.clearTimeout(timeoutId); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.src, loadAttempt, paintDisplay]);

  useEffect(() => {
    const onResize = () => paintDisplay();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paintDisplay]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    exitButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) { onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); previousFocus?.focus?.(); };
  }, [onClose, saving]);

  const replaceWorkingCanvas = (nextCanvas) => {
    imageCanvasRef.current = nextCanvas;
    setDirty(true);
    setError('');
    paintDisplay();
  };

  const rotate = (direction) => {
    const current = imageCanvasRef.current;
    if (!current) return;
    const next = document.createElement('canvas');
    next.width = current.height;
    next.height = current.width;
    const context = next.getContext('2d');
    context.translate(next.width / 2, next.height / 2);
    context.rotate(direction * Math.PI / 2);
    context.drawImage(current, -current.width / 2, -current.height / 2);
    replaceWorkingCanvas(next);
  };

  const flip = (axis) => {
    const current = imageCanvasRef.current;
    if (!current) return;
    const next = document.createElement('canvas');
    next.width = current.width;
    next.height = current.height;
    const context = next.getContext('2d');
    context.translate(axis === 'horizontal' ? next.width : 0, axis === 'vertical' ? next.height : 0);
    context.scale(axis === 'horizontal' ? -1 : 1, axis === 'vertical' ? -1 : 1);
    context.drawImage(current, 0, 0);
    replaceWorkingCanvas(next);
  };

  const applyCrop = () => {
    const current = imageCanvasRef.current;
    const selection = getCropRect();
    if (!current || !selection) return;
    const next = document.createElement('canvas');
    next.width = Math.max(1, Math.round(selection.width));
    next.height = Math.max(1, Math.round(selection.height));
    const context = next.getContext('2d');
    context.drawImage(current, selection.left, selection.top, selection.width, selection.height, 0, 0, next.width, next.height);
    replaceWorkingCanvas(next);
    setAspect('original');
    setZoom(1);
    setCropPosition({ x: 0.5, y: 0.5 });
    setFreeformSize({ width: 1, height: 1 });
  };

  const applyBackground = () => {
    const current = imageCanvasRef.current;
    if (!current || !hasTransparency) return;
    const next = document.createElement('canvas');
    next.width = current.width;
    next.height = current.height;
    const context = next.getContext('2d');
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, next.width, next.height);
    context.drawImage(current, 0, 0);
    replaceWorkingCanvas(next);
    setHasTransparency(false);
  };

  const applyResize = (event) => {
    event.preventDefault();
    const current = imageCanvasRef.current;
    const form = new FormData(event.currentTarget);
    const width = Number(form.get('width'));
    const height = Number(form.get('height'));
    if (!current || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS) {
      setError('Enter dimensions from 1 px up to a combined 40 megapixels.');
      return;
    }
    const next = document.createElement('canvas');
    next.width = width;
    next.height = height;
    const context = next.getContext('2d');
    context.drawImage(current, 0, 0, width, height);
    replaceWorkingCanvas(next);
  };

  const pointerPosition = (event) => {
    const canvas = displayCanvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    const workingCanvas = imageCanvasRef.current;
    return { x: (event.clientX - bounds.left) * workingCanvas.width / bounds.width, y: (event.clientY - bounds.top) * workingCanvas.height / bounds.height };
  };
  const setFocalPointFromPointer = (event) => {
    if (activeTool !== 'focal' || loadState !== 'ready' || dirty || focalPointSaving) return;
    const bounds = displayCanvasRef.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds?.height) return;
    setFocalPoint({
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    });
    setFocalPointChangedAgainstOriginal(true);
    setFocalPointError('');
    setFocalPointMessage('');
  };
  const changeFocalPointAxis = (axis, value) => {
    if (dirty || focalPointSaving) return;
    setFocalPoint((position) => ({ ...position, [axis]: Number(value) }));
    setFocalPointChangedAgainstOriginal(true);
    setFocalPointError('');
    setFocalPointMessage('');
  };
  const hasUnsavedFocalPoint = Boolean(focalPointChangedAgainstOriginal && focalPoint && (!savedFocalPoint
    || Math.abs(focalPoint.x - savedFocalPoint.x) > 0.00001
    || Math.abs(focalPoint.y - savedFocalPoint.y) > 0.00001));
  const saveFocalPoint = async () => {
    if (!hasUnsavedFocalPoint || focalPointLoadState !== 'ready' || focalPointSaving) return;
    setFocalPointSaving(true);
    setFocalPointError('');
    setFocalPointMessage('');
    try {
      const result = await saveMediaFocalPointAction(item.src, focalPoint);
      if (!result.ok) throw new Error(result.error || 'Could not save the focal point.');
      setFocalPoint(result.focalPoint);
      setSavedFocalPoint(result.focalPoint);
      setFocalPointMessage('Focal point saved. The original image file was not changed.');
    } catch (caughtError) {
      setFocalPointError(caughtError.message || 'Could not save the focal point. Try again.');
    } finally {
      setFocalPointSaving(false);
    }
  };
  const beginStroke = (event) => {
    if (activeTool !== 'draw' || loadState !== 'ready') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = pointerPosition(event);
    strokeRef.current = position;
    const context = imageCanvasRef.current.getContext('2d');
    context.beginPath(); context.arc(position.x, position.y, brushSize / 2, 0, Math.PI * 2); context.fillStyle = brushColor; context.fill();
    setDirty(true);
    paintDisplay();
  };
  const continueStroke = (event) => {
    if (!strokeRef.current) return;
    const position = pointerPosition(event);
    const context = imageCanvasRef.current.getContext('2d');
    context.beginPath(); context.moveTo(strokeRef.current.x, strokeRef.current.y); context.lineTo(position.x, position.y); context.strokeStyle = brushColor; context.lineWidth = brushSize; context.lineCap = 'round'; context.lineJoin = 'round'; context.stroke();
    strokeRef.current = position;
    paintDisplay();
  };

  const saveDerivative = async () => {
    const workingCanvas = imageCanvasRef.current;
    if (!workingCanvas || !dirty || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const blob = await new Promise((resolve, reject) => workingCanvas.toBlob((result) => result ? resolve(result) : reject(new Error('The edited image could not be encoded. Try a smaller image.')), 'image/png'));
      const derivative = new File([blob], `${sourceFileName(item)}-edited.png`, { type: 'image/png' });
      const uploaded = await uploadMedia(derivative, 'image');
      if (!uploaded.ok) throw new Error(uploaded.error);
      if (altText.trim()) {
        const altResult = await saveMediaAltTextAction(uploaded.src, altText);
        if (!altResult.ok) {
          setDirty(false);
          setMessage('The edited file was uploaded, but its alt text could not be copied. You can set it in File information.');
          onSaved?.({ ...item, id: uploaded.id, src: uploaded.src, label: derivative.name, contentType: 'image/png', kind: 'image', sizeBytes: blob.size });
          return;
        }
      }
      setDirty(false);
      setMessage('Saved as a new image. The original file and its references are unchanged.');
      onSaved?.({ ...item, id: uploaded.id, src: uploaded.src, label: derivative.name, contentType: 'image/png', kind: 'image', sizeBytes: blob.size });
    } catch (caughtError) {
      setError(caughtError.message || 'The edited image could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return <div ref={dialogRef} className="admin-media-image-editor" role="dialog" aria-modal="true" aria-label={`Edit ${item.label}`}>
    <header className="admin-media-image-editor__topbar">
      <button ref={exitButtonRef} type="button" className="admin-media-image-editor__exit" onClick={onClose} disabled={saving}><span aria-hidden="true">←</span> Exit</button>
      <div className="admin-media-image-editor__filename" title={item.label}>{item.label}</div>
      <div className="admin-media-image-editor__top-actions"><button type="button" onClick={() => item.id && window.open(`/api/assets/${encodeURIComponent(item.id)}/download`, '_blank', 'noopener,noreferrer')} disabled={!item.id}>Download</button><button type="button" className="is-primary" onClick={saveDerivative} disabled={loadState !== 'ready' || !dirty || saving}>{saving ? 'Saving…' : 'Save as new image'}</button></div>
    </header>
    <main className="admin-media-image-editor__body">
      <div ref={stageRef} className="admin-media-image-editor__stage" aria-label="Image editing canvas">
        {item.src && loadState !== 'ready' ? <Image className="admin-media-image-editor__cached-preview" src={thumbnailUrl(item.src, 256)} width={256} height={256} unoptimized alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}
        {loadState === 'loading' ? <div className="admin-media-image-editor__stage-message" role="status"><span>{loadProgress.decoding ? 'Preparing image…' : 'Loading original image…'}</span><span>{loadProgress.decoding ? 'Download complete' : loadProgress.total ? `${(loadProgress.loaded / 1024 / 1024).toFixed(1)} of ${(loadProgress.total / 1024 / 1024).toFixed(1)} MB` : loadProgress.loaded ? `${(loadProgress.loaded / 1024 / 1024).toFixed(1)} MB downloaded` : 'Connecting to media storage'}</span><progress max={loadProgress.total || 1} value={loadProgress.total ? loadProgress.loaded : 0} aria-label="Image loading progress" /></div> : null}
        {loadState === 'error' ? <div className="admin-media-image-editor__stage-message" role="alert"><p>{loadError}</p><button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry loading image</button></div> : null}
        <div className="admin-media-image-editor__canvas-wrap" style={displayDimensions ? { width: `${displayDimensions.width}px`, height: `${displayDimensions.height}px` } : undefined}>
          <canvas ref={displayCanvasRef} role={activeTool === 'focal' ? 'img' : undefined} className={`${loadState === 'ready' ? '' : 'is-hidden'}${activeTool === 'focal' && !dirty ? ' is-focal-point' : ''}`} onPointerDown={(event) => { if (activeTool === 'focal') setFocalPointFromPointer(event); else beginStroke(event); }} onPointerMove={continueStroke} onPointerUp={() => { strokeRef.current = null; }} onPointerCancel={() => { strokeRef.current = null; }} aria-label={activeTool === 'draw' ? 'Draw on image' : activeTool === 'focal' ? `Image preview with focal point at ${Math.round(focalPoint.x * 100)} percent across and ${Math.round(focalPoint.y * 100)} percent down.` : 'Image preview'} />
          {loadState === 'ready' && !dirty && activeTool === 'focal' && (savedFocalPoint || hasUnsavedFocalPoint) ? <span className="admin-media-image-editor__focal-marker" aria-hidden="true" style={{ left: `${focalPoint.x * 100}%`, top: `${focalPoint.y * 100}%` }} /> : null}
          {loadState === 'ready' && activeTool === 'crop' && currentCrop && dimensions ? <div
            className="admin-media-image-editor__crop-frame"
            role="group"
            aria-label="Crop frame. Drag to reposition, or use arrow keys to move it."
            tabIndex={0}
            style={{ left: `${currentCrop.left / dimensions.width * 100}%`, top: `${currentCrop.top / dimensions.height * 100}%`, width: `${currentCrop.width / dimensions.width * 100}%`, height: `${currentCrop.height / dimensions.height * 100}%` }}
            onPointerDown={(event) => {
              const frameBounds = event.currentTarget.getBoundingClientRect();
              const canvasBounds = event.currentTarget.parentElement.getBoundingClientRect();
              cropDragOffsetRef.current = { x: (event.clientX - (frameBounds.left + frameBounds.width / 2)) / canvasBounds.width, y: (event.clientY - (frameBounds.top + frameBounds.height / 2)) / canvasBounds.height };
              event.currentTarget.setPointerCapture(event.pointerId);
              moveCropFrame(event);
            }}
            onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveCropFrame(event); }}
            onPointerUp={(event) => { cropDragOffsetRef.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
            onPointerCancel={(event) => { cropDragOffsetRef.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
            onKeyDown={(event) => {
              const steps = { ArrowLeft: [-0.01, 0], ArrowRight: [0.01, 0], ArrowUp: [0, -0.01], ArrowDown: [0, 0.01] };
              const step = steps[event.key];
              if (!step) return;
              event.preventDefault();
              setCropPosition((position) => ({ x: Math.max(0, Math.min(1, position.x + step[0])), y: Math.max(0, Math.min(1, position.y + step[1])) }));
            }}
          /> : null}
        </div>
      </div>
      <aside className="admin-media-image-editor__panel">
        <nav className="admin-media-image-editor__tools" aria-label="Image tools">
          <button type="button" className={activeTool === 'information' ? 'is-active' : ''} onClick={() => setActiveTool('information')}>Information</button>
          <button type="button" className={activeTool === 'crop' ? 'is-active' : ''} onClick={() => setActiveTool('crop')}>Crop and transform</button>
          <button type="button" className={activeTool === 'resize' ? 'is-active' : ''} onClick={() => setActiveTool('resize')}>Resize</button>
          <button type="button" className={activeTool === 'draw' ? 'is-active' : ''} onClick={() => setActiveTool('draw')}>Draw</button>
          <button type="button" className={activeTool === 'focal' ? 'is-active' : ''} onClick={() => setActiveTool('focal')}>Focal point</button>
          <button type="button" className={activeTool === 'background' ? 'is-active' : ''} onClick={() => setActiveTool('background')}>Color background</button>
        </nav>
        <div className="admin-media-image-editor__tool-panel">
          {activeTool === 'information' ? <><h2>Information</h2><p>{item.label}</p><dl>{dimensions ? <><dt>Dimensions</dt><dd>{dimensions.width} × {dimensions.height} px</dd></> : null}<dt>Format</dt><dd>{item.contentType || 'Image'}</dd><dt>Alt text</dt><dd>{altText || 'No alt text'}</dd></dl></> : null}
          {activeTool === 'crop' ? <><h2>Crop and transform</h2><div className="admin-media-image-editor__orientation" role="group" aria-label="Image orientation"><button type="button" className={orientation === 'horizontal' ? 'is-selected' : ''} aria-pressed={orientation === 'horizontal'} onClick={() => setOrientation('horizontal')}>Horizontal</button><button type="button" className={orientation === 'vertical' ? 'is-selected' : ''} aria-pressed={orientation === 'vertical'} onClick={() => setOrientation('vertical')}>Vertical</button></div><label>Aspect ratio<select value={aspect} onChange={(event) => setAspect(event.target.value)}>{Object.keys(ASPECT_RATIOS).map((key) => <option key={key} value={key}>{ASPECT_LABELS[key]}</option>)}</select></label>{aspect === 'freeform' ? <><label>Crop width<input type="range" min="0.1" max="1" step="0.01" value={freeformSize.width} onChange={(event) => setFreeformSize((size) => ({ ...size, width: Number(event.target.value) }))} /></label><label>Crop height<input type="range" min="0.1" max="1" step="0.01" value={freeformSize.height} onChange={(event) => setFreeformSize((size) => ({ ...size, height: Number(event.target.value) }))} /></label></> : null}<label>Zoom<input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><span>{zoom.toFixed(2)}×</span></label><p>Drag the frame over the image to choose the crop position.</p><div className="admin-media-image-editor__button-row"><button type="button" onClick={() => rotate(-1)}>Rotate left</button><button type="button" onClick={() => rotate(1)}>Rotate right</button></div><div className="admin-media-image-editor__button-row"><button type="button" onClick={() => flip('horizontal')}>Flip horizontal</button><button type="button" onClick={() => flip('vertical')}>Flip vertical</button></div><button type="button" className="is-primary" disabled={!cropChangesImage} onClick={applyCrop}>Apply crop</button></> : null}
          {activeTool === 'resize' ? <form key={`${dimensions?.width}x${dimensions?.height}`} onSubmit={applyResize}><h2>Resize</h2><label>Width (px)<input name="width" type="number" min="1" max={MAX_IMAGE_PIXELS} value={resizeWidth} onChange={(event) => { const nextWidth = event.target.value; setResizeWidth(nextWidth); const ratio = (dimensions?.height || 1) / (dimensions?.width || 1); if (lockRatio && Number(nextWidth) > 0) setResizeHeight(String(Math.max(1, Math.round(Number(nextWidth) * ratio)))); }} /></label><label>Height (px)<input name="height" type="number" min="1" max={MAX_IMAGE_PIXELS} value={resizeHeight} onChange={(event) => { const nextHeight = event.target.value; setResizeHeight(nextHeight); const ratio = (dimensions?.width || 1) / (dimensions?.height || 1); if (lockRatio && Number(nextHeight) > 0) setResizeWidth(String(Math.max(1, Math.round(Number(nextHeight) * ratio)))); }} /></label><label className="admin-media-image-editor__checkbox"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} /> Lock aspect ratio</label><p>Maximum combined size: 40 megapixels.</p><button type="submit" className="is-primary" disabled={!resizeChangesImage}>Apply resize</button></form> : null}
          {activeTool === 'draw' ? (
            <>
              <h2>Draw</h2>
              <fieldset className="admin-media-image-editor__swatch-group">
                <legend>Monochrome</legend>
                <div className="admin-media-image-editor__swatches" role="group" aria-label="Monochrome brush colors">
                  {MONOCHROME_SWATCHES.map((color) => (
                    <button key={color} type="button" className={brushColor.toLowerCase() === color ? 'is-selected' : ''} style={{ '--swatch-color': color }} aria-label={`Brush color ${color}`} aria-pressed={brushColor.toLowerCase() === color} onClick={() => setBrushColor(color)} />
                  ))}
                </div>
              </fieldset>
              <fieldset className="admin-media-image-editor__swatch-group">
                <legend>Standard</legend>
                <div className="admin-media-image-editor__swatches" role="group" aria-label="Standard brush colors">
                  {STANDARD_SWATCHES.map((color) => (
                    <button key={color} type="button" className={brushColor.toLowerCase() === color ? 'is-selected' : ''} style={{ '--swatch-color': color }} aria-label={`Brush color ${color}`} aria-pressed={brushColor.toLowerCase() === color} onClick={() => setBrushColor(color)} />
                  ))}
                </div>
              </fieldset>
              <label>Custom brush color<input aria-label="Custom brush color" type="color" value={brushColor} onChange={(event) => setBrushColor(event.target.value)} /></label>
              <label>Brush size<input type="range" min="1" max="80" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /><span>{brushSize} px</span></label>
              <p>Draw directly on the image, then save your changes as a new file.</p>
            </>
          ) : null}
          {activeTool === 'focal' ? (
            <>
              <h2>Focal point</h2>
              <p>Click the image to place the focal point, or use the horizontal and vertical sliders. You can also adjust either slider with the arrow keys.</p>
              {focalPointLoadState === 'loading' ? <p role="status">Loading saved focal point…</p> : null}
              {focalPointLoadState === 'error' ? <button type="button" onClick={() => setFocalPointLoadAttempt((attempt) => attempt + 1)}>Retry loading focal point</button> : null}
              {dirty ? <p>The preview has pixel edits. Reopen the original to reposition its focal point; a point placed on the original can still be saved.</p> : null}
              <label>Horizontal position<input type="range" min="0" max="1" step="0.01" value={focalPoint.x} disabled={dirty || focalPointLoadState !== 'ready' || focalPointSaving} onChange={(event) => changeFocalPointAxis('x', event.target.value)} /><span>{Math.round(focalPoint.x * 100)}%</span></label>
              <label>Vertical position<input type="range" min="0" max="1" step="0.01" value={focalPoint.y} disabled={dirty || focalPointLoadState !== 'ready' || focalPointSaving} onChange={(event) => changeFocalPointAxis('y', event.target.value)} /><span>{Math.round(focalPoint.y * 100)}%</span></label>
              <p>Position: {Math.round(focalPoint.x * 100)}% across, {Math.round(focalPoint.y * 100)}% down</p>
              <button type="button" className="is-primary" disabled={!hasUnsavedFocalPoint || focalPointLoadState !== 'ready' || focalPointSaving || (dirty && !focalPointChangedAgainstOriginal)} onClick={saveFocalPoint}>{focalPointSaving ? 'Saving…' : 'Save focal point'}</button>
              {focalPointError ? <p className="admin-media-image-editor__message is-error" role="alert">{focalPointError}</p> : null}
              {focalPointMessage ? <p className="admin-media-image-editor__message" role="status">{focalPointMessage}</p> : null}
            </>
          ) : null}
          {activeTool === 'background' ? (
            <>
              <h2>Color background</h2>
              {hasTransparency ? (
                <>
                  <p>This image has transparent pixels. Choose a solid color to place behind them.</p>
                  <div className="admin-media-image-editor__swatches" role="group" aria-label="Background color swatches">
                    {ALL_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={backgroundColor.toLowerCase() === color ? 'is-selected' : ''}
                        style={{ '--swatch-color': color }}
                        aria-label={`Background color ${color}`}
                        aria-pressed={backgroundColor.toLowerCase() === color}
                        onClick={() => setBackgroundColor(color)}
                      />
                    ))}
                  </div>
                  <label>Custom background color<input aria-label="Custom background color" type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} /></label>
                  <button type="button" className="is-primary" onClick={applyBackground}>Apply background</button>
                </>
              ) : <p>This image is opaque. Subject isolation for opaque images is unavailable because it requires image segmentation.</p>}
            </>
          ) : null}
          {error ? <p className="admin-media-image-editor__message is-error" role="alert">{error}</p> : null}
          {message ? <p className="admin-media-image-editor__message" role="status">{message}</p> : null}
        </div>
      </aside>
    </main>
    <footer className="admin-media-image-editor__footer">Edits are saved as a new PNG. Your original file and any existing references stay unchanged.</footer>
  </div>;
}
