'use client';

import { useActionState } from 'react';
import { createWebsiteProject, openWebsiteProject } from '@/lib/project-actions';

function formatCreatedDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(value));
}

function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createWebsiteProject, { message: '' });

  return (
    <section className="project-dashboard__create" id="create-website" aria-labelledby="create-project-title">
      <div>
        <h2 id="create-project-title">Start from a blank canvas</h2>
        <p>Add your own pages and sections to build a website for your business.</p>
      </div>
      <form action={formAction}>
        <label htmlFor="project-name">Website name</label>
        <div className="project-dashboard__create-row">
          <input id="project-name" name="name" autoComplete="off" maxLength={80} placeholder="e.g. Fieldwork Studio" required />
          <button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create blank website'}</button>
        </div>
        {state.message ? <p className="project-dashboard__error" role="alert">{state.message}</p> : null}
      </form>
    </section>
  );
}

export default function ProjectDashboard({ projects, activeProjectId, canCreate }) {
  return (
    <>
      <section className="project-dashboard__list" id="projects" aria-labelledby="project-list-title">
        <div className="project-dashboard__section-heading">
          <h2 id="project-list-title">Projects</h2>
          <span>{projects.length} {projects.length === 1 ? 'website' : 'websites'}</span>
        </div>

        {projects.length ? (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <div className="project-dashboard__project-name">
                  <h3>{project.name}</h3>
                  <span>Public address · /store/{project.siteSlug}</span>
                </div>
                <div className="project-dashboard__project-meta">
                  <span>Created {formatCreatedDate(project.createdAt)}</span>
                  {project.id === activeProjectId ? <span className="project-dashboard__current">Current project</span> : null}
                </div>
                <form action={openWebsiteProject}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button type="submit">Open editor</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="project-dashboard__empty">No website projects are available for this account yet.</p>
        )}
      </section>

      {canCreate ? <CreateProjectForm /> : null}
    </>
  );
}
