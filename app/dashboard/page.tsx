import { redirect } from 'next/navigation';
import { logoutAdmin } from '@/lib/admin-actions';
import { getAdminSession } from '@/lib/admin-auth';
import { listAdminProjects } from '@/lib/admin-users';
import ProjectDashboard from './project-dashboard';
import WorkspaceSidebar from './workspace-sidebar';
import './dashboard.css';

export default async function ProjectDashboardPage({ searchParams }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const projects = await listAdminProjects(session.id);
  const query = await searchParams;

  return (
    <div className="project-dashboard">
      <header className="project-dashboard__header">
        <a className="project-dashboard__brand" href="/">Vendly</a>
        <div className="project-dashboard__account">
          <span>{session.name || session.email}</span>
          <form action={logoutAdmin}><button type="submit">Sign out</button></form>
        </div>
      </header>

      <div className="project-dashboard__shell">
        <WorkspaceSidebar projectCount={projects.length} canCreate={session.role === 'owner'} />

        <main className="project-dashboard__content">
          <section className="project-dashboard__intro" id="overview">
            <h1>Your websites</h1>
            <p>Choose a project to continue, or create a new website for your business.</p>
          </section>

          {query?.error === 'project' ? (
            <p className="project-dashboard__error" role="alert">That project is not available to this account. Choose one from your project list.</p>
          ) : null}

          <ProjectDashboard
            projects={projects}
            activeProjectId={session.projectId}
            canCreate={session.role === 'owner'}
          />
        </main>
      </div>
    </div>
  );
}
