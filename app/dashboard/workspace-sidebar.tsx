'use client';

import { useEffect, useState } from 'react';

export default function WorkspaceSidebar({ projectCount, canCreate }: { projectCount: number; canCreate: boolean }) {
  const [activeLocation, setActiveLocation] = useState('overview');

  useEffect(() => {
    function updateActiveLocation() {
      setActiveLocation(window.location.hash.slice(1) || 'overview');
    }

    updateActiveLocation();
    window.addEventListener('hashchange', updateActiveLocation);
    return () => window.removeEventListener('hashchange', updateActiveLocation);
  }, []);

  return (
    <aside className="project-dashboard__sidebar">
      <nav className="project-dashboard__nav" aria-label="Workspace navigation">
        <p>Workspace</p>
        <a href="#overview" aria-current={activeLocation === 'overview' ? 'location' : undefined} className={activeLocation === 'overview' ? 'is-active' : undefined}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
          <span>Overview</span>
        </a>
        <a href="#projects" aria-current={activeLocation === 'projects' ? 'location' : undefined} className={activeLocation === 'projects' ? 'is-active' : undefined}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.75" y="3.5" width="14.5" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 7h13" stroke="currentColor" strokeWidth="1.5" /><circle cx="5.25" cy="5.25" r=".7" fill="currentColor" /><circle cx="7.75" cy="5.25" r=".7" fill="currentColor" /></svg>
          <span>Websites</span>
          <span className="project-dashboard__nav-count">{projectCount}</span>
        </a>
        <a href="/admin/settings">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8.3 2.8h3.4l.5 1.7c.4.2.8.4 1.2.7l1.7-.5 1.7 2.9-1.2 1.3v1.4l1.2 1.3-1.7 2.9-1.7-.5c-.4.3-.8.5-1.2.7l-.5 1.7H8.3l-.5-1.7a5.7 5.7 0 0 1-1.2-.7l-1.7.5-1.7-2.9 1.2-1.3V8.9L3.2 7.6l1.7-2.9 1.7.5c.4-.3.8-.5 1.2-.7l.5-1.7Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /><circle cx="10" cy="9.6" r="2.2" stroke="currentColor" strokeWidth="1.35" /></svg>
          <span>Settings</span>
        </a>
      </nav>

      {canCreate ? (
        <a className={`project-dashboard__create-link${activeLocation === 'create-website' ? ' is-active' : ''}`} href="#create-website" aria-current={activeLocation === 'create-website' ? 'location' : undefined}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span>New website</span>
        </a>
      ) : null}
    </aside>
  );
}
