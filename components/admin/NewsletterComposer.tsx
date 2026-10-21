'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';
import RichTextEditor from './RichTextEditor';
import NewsletterPresetPicker from './NewsletterPresetPicker';
import { NEWSLETTER_PRESETS } from '@/lib/newsletter-presets';
import { buildNewsletterEmail } from '@/lib/newsletter-render';
import {
  saveNewsletterDraftAction,
  sendNewsletterBroadcastAction,
  sendTestNewsletterAction,
} from '@/lib/newsletter-actions';

export default function NewsletterComposer({ initialCampaign, subscriberStats, settings, userEmail }) {
  const router = useRouter();
  const defaultPreset = NEWSLETTER_PRESETS[0];

  const defaultTestEmail = (userEmail && userEmail.includes('@'))
    ? userEmail
    : (settings?.contactEmail && settings.contactEmail.includes('@'))
      ? settings.contactEmail
      : 'concierge@byshreen.com';

  const [activePresetId, setActivePresetId] = useState(initialCampaign?.presetId || defaultPreset.id);
  const [subject, setSubject] = useState(initialCampaign?.subject || defaultPreset.subject);
  const [preheader, setPreheader] = useState(initialCampaign?.preheader || defaultPreset.preheader);
  const [heading, setHeading] = useState(initialCampaign?.heading || defaultPreset.heading);
  const [buttonLabel, setButtonLabel] = useState(initialCampaign?.buttonLabel ?? defaultPreset.buttonLabel);
  const [buttonUrl, setButtonUrl] = useState(initialCampaign?.buttonUrl ?? defaultPreset.buttonUrl);
  const [richDoc, setRichDoc] = useState(initialCampaign?.richDoc || defaultPreset.doc);
  const [campaignId, setCampaignId] = useState(initialCampaign?.id || '');

  const [device, setDevice] = useState('desktop');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState(defaultTestEmail);

  const [statusMessage, setStatusMessage] = useState(null);
  const [isSaving, startSaving] = useTransition();
  const [isSendingTest, startSendingTest] = useTransition();
  const [isBroadcasting, startBroadcasting] = useTransition();

  // Load preset template
  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setSubject(preset.subject);
    setPreheader(preset.preheader);
    setHeading(preset.heading);
    setButtonLabel(preset.buttonLabel);
    setButtonUrl(preset.buttonUrl);
    setRichDoc(preset.doc);
    setStatusMessage({ type: 'info', text: `Loaded "${preset.name}" template.` });
  };

  // Compile live preview HTML
  const previewData = useMemo(() => {
    try {
      return buildNewsletterEmail({
        subject: subject || 'Newsletter Subject',
        preheader,
        heading: heading || 'Newsletter Heading',
        richDoc,
        buttonLabel,
        buttonUrl,
        recipientEmail: 'subscriber@example.com',
        settings,
      });
    } catch {
      return { html: '<p>Error rendering preview</p>', subject };
    }
  }, [subject, preheader, heading, richDoc, buttonLabel, buttonUrl, settings]);

  // Save Draft
  const handleSaveDraft = () => {
    setStatusMessage(null);
    startSaving(async () => {
      const formData = new FormData();
      if (campaignId) formData.set('id', campaignId);
      formData.set('subject', subject);
      formData.set('preheader', preheader);
      formData.set('heading', heading);
      formData.set('buttonLabel', buttonLabel);
      formData.set('buttonUrl', buttonUrl);
      formData.set('richDoc', JSON.stringify(richDoc));

      const res = await saveNewsletterDraftAction(null, formData);
      if (res?.ok) {
        if (res.id) setCampaignId(res.id);
        setStatusMessage({ type: 'success', text: res.message || 'Draft saved successfully.' });
      } else {
        setStatusMessage({ type: 'error', text: res?.message || 'Failed to save draft.' });
      }
    });
  };

  // Send Test Email Execution
  const executeSendTest = async (emailToSend) => {
    const targetEmail = String(emailToSend || testRecipient || defaultTestEmail).trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid recipient email address.' });
      return;
    }

    setStatusMessage(null);
    startSendingTest(async () => {
      const formData = new FormData();
      formData.set('testEmail', targetEmail);
      formData.set('subject', subject);
      formData.set('preheader', preheader);
      formData.set('heading', heading);
      formData.set('buttonLabel', buttonLabel);
      formData.set('buttonUrl', buttonUrl);
      formData.set('richDoc', JSON.stringify(richDoc));

      const res = await sendTestNewsletterAction(null, formData);
      setIsTestModalOpen(false);
      if (res?.ok) {
        setStatusMessage({ type: 'success', text: res.message || `Test email sent to ${targetEmail}!` });
      } else {
        setStatusMessage({ type: 'error', text: res?.message || 'Failed to send test email.' });
      }
    });
  };

  // Broadcast to All Active Subscribers Execution
  const executeBroadcast = async () => {
    setStatusMessage(null);
    startBroadcasting(async () => {
      const formData = new FormData();
      if (campaignId) formData.set('id', campaignId);
      formData.set('subject', subject);
      formData.set('preheader', preheader);
      formData.set('heading', heading);
      formData.set('buttonLabel', buttonLabel);
      formData.set('buttonUrl', buttonUrl);
      formData.set('richDoc', JSON.stringify(richDoc));

      const res = await sendNewsletterBroadcastAction(null, formData);
      setIsSendModalOpen(false);
      if (res?.ok) {
        setStatusMessage({ type: 'success', text: res.message || 'Broadcast complete!' });
        router.refresh();
      } else {
        setStatusMessage({ type: 'error', text: res?.message || 'Failed to broadcast newsletter.' });
      }
    });
  };

  const activeSubscriberCount = subscriberStats?.subscribed ?? 0;

  return (
    <div className="admin-page">
      {/* Top Heading & Action Bar */}
      <div className="admin-page-heading" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="admin-eyebrow">Marketing & Audience</span>
          <h1>Newsletter Studio</h1>
          <p>Compose rich, editorial emails to your subscribers using luxury presets and a live preview.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/admin/subscribers" className="admin-button admin-button--ghost">
            ← Subscribers
          </Link>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={handleSaveDraft}
            disabled={isSaving || isSendingTest || isBroadcasting}
          >
            {isSaving ? 'Saving Draft…' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => setIsTestModalOpen(true)}
            disabled={isSaving || isSendingTest || isBroadcasting}
          >
            {isSendingTest ? 'Sending Test…' : '✉ Send Test'}
          </button>
          <button
            type="button"
            className="admin-button"
            style={{ background: '#a84d5f', borderColor: '#a84d5f', color: '#fff' }}
            onClick={() => setIsSendModalOpen(true)}
            disabled={activeSubscriberCount === 0 || isBroadcasting || isSendingTest}
          >
            {isBroadcasting
              ? 'Broadcasting…'
              : `Send to ${activeSubscriberCount} ${activeSubscriberCount === 1 ? 'Subscriber' : 'Subscribers'} ↗`}
          </button>
        </div>
      </div>

      {/* Status alerts */}
      {statusMessage ? (
        <div
          className={`admin-alert ${statusMessage.type === 'error' ? 'admin-alert--error' : ''}`}
          style={{ marginBottom: 18 }}
        >
          <strong>{statusMessage.type === 'error' ? 'Error' : 'Notice'}:</strong>
          <span> {statusMessage.text}</span>
        </div>
      ) : null}

      {/* Preset Selector */}
      <NewsletterPresetPicker
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
      />

      {/* Studio Layout: Main Form (Left) & Sticky Preview (Right) */}
      <div className="admin-newsletter-studio">
        <div className="admin-newsletter-studio__main">
          {/* Card: Envelope & Header info */}
          <section className="admin-card">
            <div className="admin-card__heading">
              <h2>Subject & Inbox Preview</h2>
            </div>
            <label className="admin-field">
              <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subject Line *</span>
                <small style={{ color: '#8a857b' }}>{subject.length}/120 characters</small>
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="e.g. Introducing The High Jewellery Collection — byShreen"
                required
              />
              <span className="admin-field-help">Craft an alluring, concise subject line for client inboxes.</span>
            </label>

            <label className="admin-field">
              <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Preheader Text (Snippet)</span>
                <small style={{ color: '#8a857b' }}>{preheader.length}/200</small>
              </span>
              <input
                type="text"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                maxLength={300}
                placeholder="e.g. A celebration of bespoke artistry and rare gemstones."
              />
              <span className="admin-field-help">Shown next to the subject line in Apple Mail, Gmail, and Outlook.</span>
            </label>

            <label className="admin-field">
              <span>Email Headline (H1 inside the email) *</span>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                maxLength={240}
                placeholder="e.g. The 2026 High Jewellery Collection is Here"
                required
              />
            </label>
          </section>

          {/* Card: Rich Text Editor */}
          <section className="admin-card">
            <div className="admin-card__heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Newsletter Body</h2>
              <span style={{ fontSize: 12, color: '#8a857b' }}>Rich Text Editor</span>
            </div>
            <div className="admin-field">
              <RichTextEditor
                value={richDoc}
                onChange={(newDoc) => setRichDoc(newDoc)}
                label="Newsletter body content"
              />
              <span className="admin-field-help">
                Use <strong>Heading</strong> (H2) and <strong>Subheading</strong> (H3), bullet lists, quotes, and links. All styling is automatically converted into universal, luxury email typography.
              </span>
            </div>
          </section>

          {/* Card: Call to action button */}
          <section className="admin-card">
            <div className="admin-card__heading">
              <h2>Call to Action Button (Optional)</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label className="admin-field">
                <span>Button Label</span>
                <input
                  type="text"
                  value={buttonLabel}
                  onChange={(e) => setButtonLabel(e.target.value)}
                  placeholder="e.g. Explore The Collection"
                  maxLength={80}
                />
              </label>
              <label className="admin-field">
                <span>Button Link (URL)</span>
                <input
                  type="text"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="e.g. /shop or https://byshreen.com/shop"
                  maxLength={500}
                />
              </label>
            </div>
            <span className="admin-field-help">Leave blank if you don’t wish to include a primary button.</span>
          </section>
        </div>

        {/* Right Side: Interactive Device Preview */}
        <aside className="admin-newsletter-studio__side">
          <div className="admin-preview-box">
            <div className="admin-preview-box__head">
              <strong>Live Email Preview</strong>
              <div className="admin-preview-box__devices">
                <button
                  type="button"
                  className={`admin-preview-box__device-btn ${device === 'desktop' ? 'is-active' : ''}`}
                  onClick={() => setDevice('desktop')}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={`admin-preview-box__device-btn ${device === 'mobile' ? 'is-active' : ''}`}
                  onClick={() => setDevice('mobile')}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className={`admin-preview-box__frame-wrap ${device === 'mobile' ? 'is-mobile' : ''}`}>
              <iframe
                title="Email Live Preview"
                srcDoc={previewData.html}
                className="admin-preview-box__iframe"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Test Email Modal */}
      {isTestModalOpen ? (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Send Test Newsletter"
          onClick={(e) => { if (e.target === e.currentTarget) setIsTestModalOpen(false); }}
        >
          <div className="admin-modal__panel" style={{ maxWidth: 520 }}>
            <div className="admin-modal__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Send Test Newsletter</h2>
              <button type="button" className="admin-text-button" onClick={() => setIsTestModalOpen(false)}>Close</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSendTest(testRecipient);
              }}
            >
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, margin: '0 0 16px' }}>
                Send a full sample rendering of this email to inspect layout, imagery, typography, and links.
              </p>
              <label className="admin-field" style={{ marginBottom: 20 }}>
                <span>Recipient Email Address</span>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  autoFocus
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setIsTestModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-button" disabled={isSendingTest}>
                  {isSendingTest ? 'Sending Test…' : 'Send Test Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Send Broadcast Modal */}
      {isSendModalOpen ? (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Newsletter Broadcast"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSendModalOpen(false); }}
        >
          <div className="admin-modal__panel" style={{ maxWidth: 540 }}>
            <div className="admin-modal__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Confirm Newsletter Broadcast</h2>
              <button type="button" className="admin-text-button" onClick={() => setIsSendModalOpen(false)}>Close</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeBroadcast();
              }}
            >
              <div className="admin-alert" style={{ marginBottom: 16 }}>
                <strong>Ready to send:</strong>
                <span> This email will be delivered to <strong>{activeSubscriberCount} active subscriber(s)</strong>.</span>
              </div>
              <div style={{ background: '#fcfbf9', padding: '14px 18px', borderRadius: 6, border: '1px solid #ede8de', fontSize: 13, marginBottom: 20, display: 'grid', gap: 6 }}>
                <div><strong>Subject:</strong> {subject}</div>
                {preheader ? <div><strong>Preheader:</strong> {preheader}</div> : null}
                <div><strong>Heading:</strong> {heading}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setIsSendModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button"
                  style={{ background: '#a84d5f', borderColor: '#a84d5f', color: '#fff' }}
                  disabled={isBroadcasting}
                >
                  {isBroadcasting ? 'Broadcasting Now…' : `Confirm & Broadcast to ${activeSubscriberCount} ${activeSubscriberCount === 1 ? 'Subscriber' : 'Subscribers'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
