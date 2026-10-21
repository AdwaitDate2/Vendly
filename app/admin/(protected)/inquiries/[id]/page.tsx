import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInquiryForAdmin } from '@/lib/leads';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';
import InquiryDetailForm from '@/components/admin/InquiryDetailForm';
import { AppointmentPanel, ReplyForm, RequestHistory } from '@/components/admin/RequestWorkflow';

const TYPE_LABEL = { appointment: 'Appointment request', bespoke: 'Bespoke inquiry', product: 'Piece enquiry', contact: 'Message' };

function Detail({ label, value }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

export default async function InquiryDetailPage({ params }) {
  const session = await requireAdminPermission('inquiry:read');
  const { id } = await params;
  const inquiry = await getInquiryForAdmin(id);
  if (!inquiry) notFound();
  const isAppointment = inquiry.requestType === 'appointment';
  const plain = JSON.parse(JSON.stringify(inquiry));
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><Link href="/admin/inquiries" className="admin-back-link">← Customer requests</Link><span className="admin-eyebrow">{TYPE_LABEL[inquiry.requestType] || 'Request'}</span><h1>{inquiry.name}</h1><p>Received {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'recently'} via {inquiry.source}</p></div></div>
      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Client</span><h2>Contact and request</h2></div></div>
            <dl className="admin-detail-list">
              <Detail label="Piece" value={inquiry.productSlug ? <a href={`/shop/${inquiry.productSlug}`} target="_blank" rel="noreferrer">{inquiry.productTitle || inquiry.productSlug}</a> : ''} />
              <Detail label="Email" value={<a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>} />
              <Detail label="Phone" value={inquiry.phone ? <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a> : ''} />
              <Detail label="Looking for" value={inquiry.interest.replace(/-/g, ' ')} />
              <Detail label="Budget" value={inquiry.budget.replace(/-/g, ' ')} />
              <Detail label="Timeline" value={inquiry.timeline.replace(/-/g, ' ')} />
              {!isAppointment ? <Detail label="Topic" value={inquiry.topic} /> : null}
            </dl>
            <p className="admin-inquiry-message">{inquiry.message}</p>
            <p className="admin-field-help">Consent recorded {inquiry.consentAt ? new Date(inquiry.consentAt).toLocaleString() : 'with submission'}</p>
          </section>
          {isAppointment ? <AppointmentPanel inquiry={plain} /> : null}
          <ReplyForm inquiry={plain} />
          <RequestHistory inquiry={plain} />
        </div>
        <aside className="admin-editor-side">
          <InquiryDetailForm inquiry={plain} canDelete={hasPermission(session, 'records:delete')} />
        </aside>
      </div>
    </div>
  );
}
