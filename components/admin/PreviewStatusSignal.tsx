'use client';

import { useEffect } from 'react';

/** Sends a small, non-sensitive route status to the same-origin editor parent. */
export default function PreviewStatusSignal({ status }) {
  useEffect(() => {
    if (window.parent === window) return;

    const sendStatus = () => {
      window.parent.postMessage({ source: 'byshreen-preview', type: 'preview-status', status }, window.location.origin);
    };
    const handleParentMessage = (event) => {
      if (event.origin !== window.location.origin
        || event.source !== window.parent
        || event.data?.source !== 'byshreen-editor'
        || event.data.type !== 'handshake') return;
      sendStatus();
    };

    window.addEventListener('message', handleParentMessage);
    sendStatus();
    return () => window.removeEventListener('message', handleParentMessage);
  }, [status]);

  return null;
}
