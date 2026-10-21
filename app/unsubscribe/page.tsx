// @ts-nocheck
import Link from 'next/link';
import { verifyUnsubscribeToken } from '@/lib/newsletter';
import { unsubscribeAction, resubscribeAction } from '@/lib/newsletter-actions';

export const metadata = {
  title: 'Newsletter Preferences — byShreen',
  description: 'Manage your byShreen newsletter subscription and communication preferences.',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }) {
  const params = await searchParams;
  const email = String(params?.email || '').trim();
  const token = String(params?.token || '').trim();

  const hasParams = Boolean(email && token);
  const isValid = hasParams && verifyUnsubscribeToken(email, token);

  return (
    <main style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: '60px 20px', background: 'var(--paper, #faf8f5)' }}>
      <div style={{ maxWidth: 520, width: '100%', background: '#fff', padding: '44px 36px', borderRadius: 12, border: '1px solid #ede8de', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mulberry, #a84d5f)', marginBottom: 12, fontWeight: 500 }}>
          byShreen Atelier
        </span>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 'normal', color: '#24201a', margin: '0 0 16px' }}>
          Newsletter Preferences
        </h1>

        {!hasParams ? (
          <div>
            <p style={{ color: '#6b675e', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
              To unsubscribe or update your newsletter settings, please use the personal link included at the bottom of any byShreen email.
            </p>
            <Link href="/" className="button" style={{ display: 'inline-block', padding: '12px 24px', background: '#24201a', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 14 }}>
              Return to Homepage
            </Link>
          </div>
        ) : !isValid ? (
          <div>
            <p style={{ color: '#8e0b21', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
              This unsubscribe link is invalid or has expired. If you still wish to unsubscribe, please contact our concierge directly at{' '}
              <a href="mailto:concierge@byshreen.com" style={{ color: '#a84d5f', textDecoration: 'underline' }}>
                concierge@byshreen.com
              </a>.
            </p>
            <Link href="/" className="button" style={{ display: 'inline-block', padding: '12px 24px', background: '#24201a', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 14 }}>
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div>
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
              You are managing email preferences for <strong>{email}</strong>.
            </p>

            <form action={unsubscribeAction} style={{ marginBottom: 16 }}>
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: '#a84d5f',
                  color: '#fff',
                  border: 0,
                  borderRadius: 4,
                  fontSize: 14,
                  letterSpacing: '.06em',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background .2s ease',
                }}
              >
                Unsubscribe from all byShreen emails
              </button>
            </form>

            <form action={resubscribeAction} style={{ marginBottom: 28 }}>
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#6b675e',
                  fontSize: 13,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Stay subscribed / Re-subscribe
              </button>
            </form>

            <div style={{ paddingTop: 20, borderTop: '1px solid #ede8de', fontSize: 13, color: '#8a857b' }}>
              Have questions? Write to us at <a href="mailto:concierge@byshreen.com" style={{ color: '#a84d5f' }}>concierge@byshreen.com</a>.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
