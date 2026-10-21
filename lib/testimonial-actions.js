'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { saveTestimonials } from './testimonials';

export async function saveTestimonialsAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  let testimonials;
  try {
    testimonials = JSON.parse(String(formData.get('testimonials') || ''));
  } catch {
    return { ok: false, message: 'The data could not be read. Reload the page and try again.' };
  }
  if (!Array.isArray(testimonials)) {
    return { ok: false, message: 'Invalid data.' };
  }
  try {
    await saveTestimonials(testimonials, session.email);
    await logActivity({
      actor: session.email,
      type: 'content',
      action: 'Updated client testimonials',
      label: `${testimonials.length} ${testimonials.length === 1 ? 'testimonial' : 'testimonials'}`,
      href: '/admin/testimonials',
    });
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Testimonials saved. They are live on the website.', savedAt: Date.now() };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not save the testimonials.' };
  }
}
