'use server';

import { redirect } from 'next/navigation';
import { createAdminProject } from './admin-users';
import { getAdminSession, selectAdminProject } from './admin-auth';

export async function createWebsiteProject(_previousState, formData) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'owner') return { message: 'Only the account owner can create website projects.' };

  const name = String(formData.get('name') || '').trim();
  if (!name || name.length > 80) return { message: 'Enter a project name of up to 80 characters.' };

  let project;
  try {
    project = await createAdminProject(session.id, name);
  } catch {
    return { message: 'We could not create that project. Try again in a moment.' };
  }

  if (!(await selectAdminProject(project.id))) {
    return { message: 'Your project was created, but we could not open it. Choose it from the list to continue.' };
  }
  redirect('/admin/editor/home');
}

export async function openWebsiteProject(formData) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const projectId = String(formData.get('projectId') || '');
  if (!(await selectAdminProject(projectId))) redirect('/dashboard?error=project');
  redirect('/admin/editor/home');
}
