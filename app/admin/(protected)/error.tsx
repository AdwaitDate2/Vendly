'use client';

import { useEffect } from 'react';

// Catches errors thrown while rendering an admin page so the sidebar stays usable.
export default function AdminPageError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const text = String(error?.message || '');
  const offline = /Mongo|ECONNREFUSED|ETIMEDOUT|timed out/i.test(text);
  const forbidden = /Missing permission/i.test(text);
  const heading = offline ? 'Can’t reach the database' : forbidden ? 'Only the owner can do this' : 'This page couldn’t load';
  const body = offline
    ? 'The admin couldn’t connect to the store database. This is usually a brief network problem. Your data is safe.'
    : forbidden
      ? 'Your account can edit the catalog and content, but team, store settings, and refunds are owner-only. Ask the studio owner if you need access.'
      : 'Something went wrong while loading this page. Try again in a moment.';
  return (
    <div className="admin-page">
      <div className="admin-card admin-offline__card" role="alert">
        <h1>{heading}</h1>
        <p>{body}</p>
        {!offline && !forbidden && error?.digest ? <p className="admin-field-help">If it keeps happening, send this reference to whoever looks after the website: <code>{error.digest}</code></p> : null}
        <button type="button" className="admin-button" onClick={() => reset()}>Try again</button>
      </div>
    </div>
  );
}
