import TestimonialsEditor from '@/components/admin/TestimonialsEditor';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getTestimonials } from '@/lib/testimonials';

export const metadata = { title: 'Client Testimonials — byShreen Admin' };

export default async function TestimonialsAdminPage() {
  await requireAdminPermission('content:write');
  const testimonials = await getTestimonials();
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Client testimonials</h1>
          <p>The reviews shown in the &ldquo;Client stories&rdquo; carousel on any page that includes that section. Add, edit, reorder or remove testimonials here.</p>
        </div>
      </div>
      <TestimonialsEditor initialTestimonials={JSON.parse(JSON.stringify(testimonials))} />
    </div>
  );
}
