// @ts-nocheck
'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ImageLibraryModal, thumbnailUrl, uploadImage } from './ImagePicker';
import { moveItem } from './SortableList';

export default function ProductMediaField({ initialImages = [], error }) {
  const [images, setImages] = useState(initialImages);
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [fileOver, setFileOver] = useState(false);
  const [progress, setProgress] = useState(null);
  const [problems, setProblems] = useState([]);
  const fileInput = useRef(null);

  const remove = (index) => setImages((current) => current.filter((_, i) => i !== index));
  const makeMain = (index) => setImages((current) => moveItem(current, index, 0));
  const append = (src) => setImages((current) => (current.includes(src) ? current : [...current, src]));

  // Uploads each file to Kenmark Storage and adds it to the gallery in the order chosen.
  const uploadFiles = async (fileList) => {
    const files = [...(fileList || [])];
    if (!files.length) return;
    setProblems([]);
    const failed = [];
    for (const [index, file] of files.entries()) {
      setProgress({ done: index, total: files.length });
      const result = await uploadImage(file);
      if (result.ok) append(result.src);
      else failed.push(result.error);
    }
    setProgress(null);
    setProblems(failed);
  };

  const isFileDrag = (event) => [...(event.dataTransfer?.types || [])].includes('Files');

  return (
    <div className="admin-media-field">
      <input type="hidden" name="images" value={images.join('\n')} />
      <div
        className={`admin-media-grid${fileOver ? ' is-file-over' : ''}`}
        onDragOver={(event) => { if (isFileDrag(event)) { event.preventDefault(); setFileOver(true); } }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFileOver(false); }}
        onDrop={(event) => { if (isFileDrag(event)) { event.preventDefault(); setFileOver(false); uploadFiles(event.dataTransfer.files); } }}
      >
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={`admin-media-grid__item${index === 0 ? ' is-main' : ''}${dragging === index ? ' is-dragging' : ''}`}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(event) => { if (!isFileDrag(event)) event.preventDefault(); }}
            onDrop={(event) => { if (isFileDrag(event)) return; event.preventDefault(); event.stopPropagation(); if (dragging !== null) setImages((current) => moveItem(current, dragging, index)); setDragging(null); }}
            onDragEnd={() => setDragging(null)}
            title="Drag to reorder"
          >
            <Image src={thumbnailUrl(src, 384)} alt="" fill sizes="(max-width: 640px) 40vw, 180px" unoptimized />
            {index === 0 ? <span className="admin-media-grid__badge">Main photo</span> : null}
            <div className="admin-media-grid__actions">
              {index > 0 ? <button type="button" onClick={() => makeMain(index)}>Make main</button> : null}
              <button type="button" onClick={() => remove(index)}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="admin-media-grid__add" onClick={() => fileInput.current?.click()} disabled={Boolean(progress)}>
          <span aria-hidden="true">＋</span>
          {progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : 'Upload photos'}
        </button>
      </div>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(event) => { uploadFiles(event.target.files); event.target.value = ''; }} />
      <div className="admin-media-field__row">
        <button type="button" className="admin-text-button" onClick={() => setAdding(true)}>Choose from the photo library</button>
        <p className="admin-field-help">Drop photos here or click Upload photos; they are saved to Kenmark Storage. The first photo is shown on product cards and the second on hover. Drag to reorder.</p>
      </div>
      {problems.length ? <div className="admin-form-message" role="alert">{problems.map((problem) => <p key={problem}>{problem}</p>)}</div> : null}
      {error ? <span className="admin-field-error">{error}</span> : null}
      {adding ? (
        <ImageLibraryModal
          title="Add a product photo"
          multiple
          onChoose={(paths) => { (Array.isArray(paths) ? paths : [paths]).forEach(append); setAdding(false); }}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
