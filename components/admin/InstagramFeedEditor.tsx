'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { fetchInstagramPostAction, saveInstagramFeedAction } from '@/lib/instagram-actions';
import { ImageLibraryModal, thumbnailUrl } from './ImagePicker';
import SortableList, { moveItem } from './SortableList';

const MAX_POSTS = 24;
// The post's ID in a link, so /byshreen/p/ABC/ and /p/ABC/ count as the same post.
const shortcode = (url) => String(url || '').match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reels?|tv)\/([A-Za-z0-9_-]+)/)?.[1] || null;

export default function InstagramFeedEditor({ initialFeed }) {
  const [feed, setFeed] = useState(initialFeed);
  const [link, setLink] = useState('');
  const [addNotice, setAddNotice] = useState(null);
  const [fetching, startFetching] = useTransition();
  const [coverFor, setCoverFor] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [state, saveAction, saving] = useActionState(saveInstagramFeedAction, {});
  const linkInput = useRef(null);

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = (updater) => { setFeed(updater); setDirty(true); };
  const updatePost = (id, patch) => change((current) => ({ ...current, posts: current.posts.map((post) => (post.id === id ? { ...post, ...patch } : post)) }));
  const removePost = (id) => change((current) => ({ ...current, posts: current.posts.filter((post) => post.id !== id) }));

  const addPost = (event) => {
    event.preventDefault();
    const value = link.trim();
    if (!value) return;
    if (feed.posts.length >= MAX_POSTS) { setAddNotice({ tone: 'error', text: `The feed holds up to ${MAX_POSTS} posts. Remove one first.` }); return; }
    const code = shortcode(value);
    if (!code) { setAddNotice({ tone: 'error', text: 'Paste a link to one post or reel, e.g. https://www.instagram.com/reel/… (profile links can’t be added).' }); return; }
    if (feed.posts.some((post) => shortcode(post.url) === code)) { setAddNotice({ tone: 'error', text: 'That post is already in the feed.' }); return; }
    setAddNotice(null);
    startFetching(async () => {
      const result = await fetchInstagramPostAction(value);
      if (result.error) { setAddNotice({ tone: 'error', text: result.error }); return; }
      if (feed.posts.some((post) => post.id !== result.post.id && shortcode(post.url) === shortcode(result.post.url))) { setAddNotice({ tone: 'error', text: 'That post is already in the feed.' }); return; }
      change((current) => ({ ...current, posts: [result.post, ...current.posts] }));
      setLink('');
      if (result.warning) {
        setAddNotice({ tone: 'error', text: result.warning });
        setCoverFor(result.post.id);
      } else setAddNotice({ tone: 'ok', text: 'Post added to the top of the feed. Save to publish it.' });
      linkInput.current?.focus();
    });
  };

  const visible = feed.posts.filter((post) => !post.hidden).length;
  const missingCover = feed.posts.some((post) => !post.image);

  return (
    <div className="admin-instagram">
      <form className="admin-card admin-instagram__add" onSubmit={addPost}>
        <div className="admin-card__heading"><div><h2>Add a post or reel</h2><p className="admin-field-help">Paste the link from Instagram (Share → Copy link). The cover image and caption are fetched for you and the cover is saved to Kenmark Storage.</p></div></div>
        <div className="admin-instagram__add-row">
          <label className="admin-field">
            <span className="sr-only">Instagram post or reel link</span>
            <input ref={linkInput} type="url" inputMode="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://www.instagram.com/reel/…" disabled={fetching} />
          </label>
          <button type="submit" className="admin-button" disabled={fetching || !link.trim()}>{fetching ? 'Fetching post…' : 'Add to feed'}</button>
        </div>
        {addNotice ? <div className={addNotice.tone === 'ok' ? 'admin-alert' : 'admin-form-message'} role="status">{addNotice.text}</div> : null}
      </form>

      <form action={saveAction} className="admin-instagram__form">
        <input type="hidden" name="feed" value={JSON.stringify(feed)} />

        <section className="admin-card">
          <div className="admin-card__heading">
            <div><h2>Posts</h2><p className="admin-field-help">{visible} of {feed.posts.length} showing on the website. Drag to reorder; the first post appears top left.</p></div>
          </div>
          {feed.posts.length ? (
            <SortableList
              items={feed.posts}
              onReorder={(from, to) => change((current) => ({ ...current, posts: moveItem(current.posts, from, to) }))}
              className="admin-instagram__list"
              renderItem={(post, index, handle) => (
                <div className={`admin-instagram__post${post.hidden ? ' is-hidden' : ''}`}>
                  <span {...handle}>⋮⋮</span>
                  <button type="button" className="admin-instagram__cover" onClick={() => setCoverFor(post.id)} title="Change cover image">
                    {post.image ? <Image src={thumbnailUrl(post.image, 256)} alt="" fill sizes="92px" unoptimized /> : <span>Add cover</span>}
                    <small>{post.isVideo ? 'Reel' : 'Post'}</small>
                  </button>
                  <div className="admin-instagram__fields">
                    <a href={post.url} target="_blank" rel="noreferrer" className="admin-instagram__link">{post.url.replace(/^https:\/\/(www\.)?/, '')} ↗</a>
                    <label className="admin-field">
                      <span>Description (read aloud to screen readers)</span>
                      <input value={post.alt} maxLength={200} onChange={(event) => updatePost(post.id, { alt: event.target.value })} />
                    </label>
                    <div className="admin-instagram__toggles">
                      <label className="admin-check"><input type="checkbox" checked={!post.hidden} onChange={(event) => updatePost(post.id, { hidden: !event.target.checked })} /><span>Show on website</span></label>
                      <label className="admin-check"><input type="checkbox" checked={post.isVideo} onChange={(event) => updatePost(post.id, { isVideo: event.target.checked })} /><span>Reel (shows a play icon)</span></label>
                    </div>
                    {!post.image ? <p className="admin-field-error">Add a cover image before saving.</p> : null}
                  </div>
                  <div className="admin-instagram__actions">
                    <button type="button" aria-label={`Move post ${index + 1} up`} onClick={() => change((current) => ({ ...current, posts: moveItem(current.posts, index, index - 1) }))} disabled={index === 0}>↑</button>
                    <button type="button" aria-label={`Move post ${index + 1} down`} onClick={() => change((current) => ({ ...current, posts: moveItem(current.posts, index, index + 1) }))} disabled={index === feed.posts.length - 1}>↓</button>
                    <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => removePost(post.id)}>Remove</button>
                  </div>
                </div>
              )}
            />
          ) : <p className="admin-field-help">No posts yet. Paste a link above to add the first one. The Instagram section is hidden on the website until a post is added.</p>}
        </section>

        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>Section text</h2></div></div>
          <div className="admin-field-row">
            <label className="admin-field"><span>Small heading</span><input value={feed.eyebrow} maxLength={60} onChange={(event) => change((current) => ({ ...current, eyebrow: event.target.value }))} /></label>
            <label className="admin-field"><span>Heading</span><input value={feed.heading} maxLength={120} required onChange={(event) => change((current) => ({ ...current, heading: event.target.value }))} /></label>
          </div>
          <label className="admin-field"><span>Instagram profile link (Follow button)</span><input type="url" value={feed.profileUrl} onChange={(event) => change((current) => ({ ...current, profileUrl: event.target.value }))} /></label>
        </section>

        <div className="admin-savebar">
          <span className="admin-savebar__status" role="status">{state?.message && !dirty ? state.message : dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          {state?.ok === false ? <span className="admin-field-error">{state.message}</span> : null}
          <Link href="/#instagram" target="_blank" className="admin-button admin-button--ghost">View on website ↗</Link>
          <button type="submit" className="admin-button" disabled={saving || !dirty || missingCover}>{saving ? 'Saving…' : 'Save feed'}</button>
        </div>
      </form>

      {coverFor ? (
        <ImageLibraryModal
          title="Cover image for this post"
          value={feed.posts.find((post) => post.id === coverFor)?.image || ''}
          onChoose={(src) => { updatePost(coverFor, { image: src }); setCoverFor(null); }}
          onClose={() => setCoverFor(null)}
        />
      ) : null}
    </div>
  );
}
