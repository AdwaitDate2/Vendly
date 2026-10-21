'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignResourceTemplateAction, createResourceTemplateAction } from '@/lib/resource-template-actions';
import styles from './TemplateDestinationPicker.module.css';

function editorUrl(resourceType, templateKey, resourceHandle) {
  const query = resourceHandle ? `?resource=${encodeURIComponent(resourceHandle)}` : '';
  return `/admin/editor/templates/${resourceType}/${templateKey}${query}`;
}

/** Resource selection and template assignment controls for the full-screen resource editor. */
export default function ResourceTemplateControls({
  resourceType,
  resourceHandle,
  templateKey,
  assignedTemplateKey,
  templates = [],
  resources = [],
  templateDestinations = [],
  currentDestinationId: selectedDestinationId,
  currentDestinationName,
  sections = [],
  hasUnsavedChanges = false,
  samplePreviewOnly = false,
}) {
  const router = useRouter();
  const popover = useRef(null);
  const searchInput = useRef(null);
  const controlId = useId();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('destinations');
  const [destinationQuery, setDestinationQuery] = useState('');
  const assignmentContext = `${resourceHandle || ''}:${assignedTemplateKey || 'default'}`;
  const [assignmentSelection, setAssignmentSelection] = useState({ context: assignmentContext, key: assignedTemplateKey || 'default' });
  const [templateName, setTemplateName] = useState('');
  const [sourceTemplateKey, setSourceTemplateKey] = useState(templateKey || 'default');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!popover.current?.contains(event.target)) {
        setOpen(false);
        setView('destinations');
        setCreating(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setView('destinations');
        setCreating(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const resourceLabel = resourceType === 'product' ? 'product' : resourceType === 'blog' ? 'blog' : resourceType === 'blog-post' ? 'blog post' : resourceType === 'gift-card' ? 'gift card' : resourceType ? 'collection' : 'page';
  const isStandaloneCollectionsList = resourceType === 'collection-list';
  const isSingletonSearch = resourceType === 'search';
  const isSingletonCart = resourceType === 'cart';
  const isSingleton404 = resourceType === '404';
  const isSingletonPassword = resourceType === 'password';
  const isSingletonGiftCard = resourceType === 'gift-card';
  const isSingletonPage = isSingletonSearch || isSingletonCart || isSingleton404 || isSingletonPassword || isSingletonGiftCard;
  const resourceControlsLabel = !resourceType
    ? 'Choose a page or template destination'
    : isSingletonCart
    ? 'Manage Cart page template'
    : isSingletonSearch
      ? 'Manage search page template'
      : isSingleton404
        ? 'Manage 404 page template'
      : isSingletonPassword
        ? 'Manage Password page template'
        : isSingletonGiftCard
          ? 'Manage Gift card template'
        : isStandaloneCollectionsList
          ? 'Manage collections page templates'
          : resourceType === 'blog'
            ? 'Manage blog templates'
            : resourceType === 'blog-post'
              ? 'Manage blog post templates'
            : 'Manage preview resources and templates';
  const assignmentKey = assignmentSelection.context === assignmentContext ? assignmentSelection.key : assignedTemplateKey || 'default';
  const templateLabel = (templates.find((template) => template.key === assignmentKey)?.name) || 'Default';
  const currentTemplateName = currentDestinationName || templates.find((template) => template.key === templateKey)?.name || 'Template';
  const currentDestinationId = selectedDestinationId || `${resourceType}-${templateKey}`;
  const filteredDestinations = useMemo(() => {
    const normalizedQuery = destinationQuery.trim().toLowerCase();
    if (!normalizedQuery) return templateDestinations;
    return templateDestinations.filter((destination) => `${destination.title} ${destination.group} ${destination.subtitle || ''}`.toLowerCase().includes(normalizedQuery));
  }, [destinationQuery, templateDestinations]);
  const groupedDestinations = useMemo(() => {
    const groups = new Map();
    filteredDestinations.forEach((destination) => {
      if (!groups.has(destination.group)) groups.set(destination.group, []);
      groups.get(destination.group).push(destination);
    });
    return [...groups.entries()];
  }, [filteredDestinations]);

  useEffect(() => {
    if (open && view === 'destinations') searchInput.current?.focus();
  }, [open, view]);

  const changeResource = (nextHandle) => {
    if (!nextHandle || nextHandle === resourceHandle) return;
    if (hasUnsavedChanges && !window.confirm('Leave without saving? Your template changes will be lost.')) return;
    router.push(editorUrl(resourceType, templateKey, nextHandle));
  };

  const changeTemplate = (nextTemplateKey) => {
    if (!nextTemplateKey || nextTemplateKey === templateKey) return;
    if (hasUnsavedChanges && !window.confirm('Leave without saving? Your template changes will be lost.')) return;
    router.push(editorUrl(resourceType, nextTemplateKey, resourceHandle));
  };

  const navigateToDestination = (destination) => {
    if (!destination.href || !destination.supported) return;
    if (hasUnsavedChanges && !window.confirm('Leave without saving? Your template changes will be lost.')) return;
    setOpen(false);
    setView('destinations');
    router.push(destination.href);
  };

  const assignTemplate = async () => {
    if (!resourceHandle || saving || samplePreviewOnly) return;
    setSaving(true);
    setMessage('');
    try {
      const result = await assignResourceTemplateAction({ resourceType, resourceHandle, templateKey: assignmentKey });
      if (!result.ok) {
        setMessage(result.message || 'Could not assign this template.');
        return;
      }
      setMessage(`Assigned ${templateLabel} to this ${resourceLabel}.`);
      router.refresh();
    } catch {
      setMessage('Could not assign this template. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const createTemplate = async (event) => {
    event.preventDefault();
    if (saving || samplePreviewOnly || !templateName.trim() || templateName.trim().length > 25) return;
    setSaving(true);
    setMessage('');
    try {
      const result = await createResourceTemplateAction({
        resourceType,
        resourceHandle,
        name: templateName.trim(),
        sourceTemplateKey,
        // Preserve edits already present in this editor when copying its template.
        // A different selected base is read from its persisted draft on the server.
        ...(sourceTemplateKey === templateKey ? { sections } : {}),
      });
      if (!result.ok) {
        setMessage(result.message || 'Could not create this template.');
        return;
      }
      router.push(editorUrl(resourceType, result.template.key, resourceHandle));
    } catch {
      setMessage('Could not create this template. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shopify-editor-resource-controls" ref={popover}>
      <button type="button" className={`shopify-editor-resource-controls__trigger ${styles.trigger}`} aria-label={`${resourceControlsLabel}. Current template: ${currentTemplateName}`} title={currentTemplateName} aria-expanded={open} aria-controls={`${controlId}-${view}`} onClick={() => {
        if (open) {
          setOpen(false);
          setView('destinations');
        } else {
          setView('destinations');
          setDestinationQuery('');
          setOpen(true);
        }
      }}>
        <strong className={styles.triggerName}>{currentTemplateName}</strong>
        <svg className={styles.triggerChevron} aria-hidden="true" width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && view === 'destinations' ? <div className={styles.destinationMenu} id={`${controlId}-destinations`} role="dialog" aria-label="Choose a template or destination">
        <label className={styles.search}>
          <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m12.5 12.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input ref={searchInput} type="search" value={destinationQuery} onChange={(event) => setDestinationQuery(event.target.value)} placeholder="Search templates and destinations" aria-label="Search templates and destinations" />
          {destinationQuery ? <button type="button" aria-label="Clear search" onClick={() => setDestinationQuery('')}>×</button> : null}
        </label>
        <div className={styles.results} role="listbox" aria-label="Template destinations">
          {groupedDestinations.map(([group, destinations]) => <section className={styles.group} key={group} aria-label={group}>
            <h2>{group}</h2>
            {destinations.map((destination) => {
              const isCurrent = destination.id === currentDestinationId;
              return <button type="button" role="option" aria-selected={isCurrent} key={destination.id} className={`${styles.destination} ${!destination.supported ? styles.destinationDisabled : ''} ${isCurrent ? styles.destinationCurrent : ''}`} disabled={!destination.supported || isCurrent} onClick={() => navigateToDestination(destination)}>
                <span className={styles.destinationCopy}><strong>{destination.title}</strong><small>{destination.subtitle}</small></span>
                {isCurrent ? <span className={styles.currentMark} aria-label="Current destination">✓</span> : destination.supported ? <span className={styles.destinationArrow} aria-hidden="true">↗</span> : <span className={styles.unavailableMark} aria-hidden="true">—</span>}
              </button>;
            })}
          </section>)}
          {groupedDestinations.length === 0 ? <p className={styles.empty}>No templates or destinations match “{destinationQuery}”.</p> : null}
        </div>
        <div className={styles.footer}>
          <span>Switch preview or open a template</span>
          {resourceType ? <button type="button" onClick={() => { setView('manage'); setMessage(''); }}>Manage current templates</button> : null}
        </div>
      </div> : null}
      {open && view === 'manage' && resourceType ? <div className="shopify-editor-resource-controls__menu" id={`${controlId}-manage`}>
        <button type="button" className={styles.backButton} onClick={() => setView('destinations')}><span aria-hidden="true">←</span> All templates and destinations</button>
        <label className="shopify-editor-resource-controls__field shopify-editor-resource-controls__edit-template">
          <span>Edit template</span>
          <select value={templateKey} onChange={(event) => changeTemplate(event.target.value)}>
            {templates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}
          </select>
        </label>
        {isStandaloneCollectionsList || isSingletonPage ? (
          <div className="shopify-editor-resource-controls__field"><span>Preview {isSingletonCart ? 'Cart page' : isSingletonSearch ? 'search page' : isSingleton404 ? '404 page' : isSingletonPassword ? 'Password page' : isSingletonGiftCard ? 'gift card' : 'collections page'}</span><strong>{isSingletonCart ? 'Cart' : isSingletonSearch ? 'Search' : isSingleton404 ? '404 page' : isSingletonPassword ? 'Password' : isSingletonGiftCard ? 'Sample gift card' : 'Collections'}</strong></div>
        ) : samplePreviewOnly ? (
          <div className="shopify-editor-resource-controls__field"><span>Preview blog post</span><strong>Sample article</strong></div>
        ) : (
          <>
            <label className="shopify-editor-resource-controls__field">
              <span>Preview {resourceLabel}</span>
              <select value={resourceHandle || ''} onChange={(event) => changeResource(event.target.value)}>
                {resources.map((resource) => <option key={resource.handle} value={resource.handle}>{resource.label}</option>)}
              </select>
            </label>
            <label className="shopify-editor-resource-controls__field">
              <span>Assigned template</span>
              <select value={assignmentKey} onChange={(event) => setAssignmentSelection({ context: assignmentContext, key: event.target.value })}>
                {templates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}
              </select>
            </label>
            <button type="button" className="shopify-editor-resource-controls__assign" disabled={saving || samplePreviewOnly || assignmentKey === assignedTemplateKey} onClick={assignTemplate}>
              {saving ? 'Saving…' : 'Assign template'}
            </button>
          </>
        )}
        <div className="shopify-editor-resource-controls__summary" aria-live="polite">
          {isSingletonPage
            ? <span>{isSingletonGiftCard ? 'Gift cards use one shared template.' : `The ${isSingletonCart ? 'Cart' : isSingletonSearch ? 'Search' : isSingletonPassword ? 'Password' : '404'} page uses one shared template.`}</span>
            : isStandaloneCollectionsList
              ? <span>Templates here are for the Collections page.</span>
              : <span><strong>{currentTemplateName}</strong> is assigned to {templates.find((template) => template.key === templateKey)?.assignmentCount || 0} {resourceType === 'blog' ? 'blog' : resourceLabel}{(templates.find((template) => template.key === templateKey)?.assignmentCount || 0) === 1 ? '' : 's'}</span>}
          {!isSingletonPage ? <button type="button" disabled={samplePreviewOnly} title={samplePreviewOnly ? 'Create a blog post before adding another template.' : undefined} onClick={() => { setTemplateName(''); setSourceTemplateKey(templateKey || 'default'); setMessage(''); setCreating(true); }}>Create template</button> : null}
        </div>
        {isSingletonPassword ? <p className="shopify-editor-resource-controls__message">The published Password template appears at the public gate when a storefront password is set and coming-soon mode is enabled. Enabling the existing coming-soon page alone keeps its current landing page.</p> : null}
        {isSingletonGiftCard ? <p className="shopify-editor-resource-controls__message">Gift cards use one sample preview and do not have resource assignments.</p> : null}
        {samplePreviewOnly ? <p className="shopify-editor-resource-controls__message">Previewing a sample article. Publish applies this default template to future blog posts; create a post to preview its content or assign a different template.</p> : null}
        {message ? <p className="shopify-editor-resource-controls__message" role="status">{message}</p> : null}
      </div> : null}
      {creating ? <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={`${controlId}-create-title`} onClick={(event) => { if (event.target === event.currentTarget) setCreating(false); }}>
        <form className="admin-modal__panel" style={{ width: 'min(480px, 100%)', maxHeight: 'min(560px, 88dvh)', gap: 16 }} onSubmit={createTemplate}>
          <div className="admin-modal__head">
            <h2 id={`${controlId}-create-title`}>Create a template</h2>
            <button type="button" aria-label="Close" onClick={() => setCreating(false)} style={{ border: 0, background: 'transparent', color: '#616161', fontSize: 22, cursor: 'pointer' }}>×</button>
          </div>
          <label className="shopify-editor-resource-controls__field">
            <span>Name</span>
            <input autoFocus maxLength={25} value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. Gift collection" required />
            <small aria-live="polite" style={{ justifySelf: 'end', color: '#6d7175', fontSize: 11, fontWeight: 400 }}>{templateName.length}/25</small>
          </label>
          <label className="shopify-editor-resource-controls__field">
            <span>Based on</span>
            <select value={sourceTemplateKey} onChange={(event) => setSourceTemplateKey(event.target.value)}>
              {templates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}
            </select>
          </label>
          <div className="shopify-editor-resource-controls__create-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => setCreating(false)} style={{ minHeight: 34, padding: '0 10px', border: '1px solid #c9cccf', borderRadius: 6, background: '#fff', color: '#303030', font: 'inherit', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="shopify-editor-resource-controls__assign" disabled={saving || !templateName.trim() || templateName.trim().length > 25}>{saving ? 'Creating…' : isStandaloneCollectionsList ? 'Create template' : 'Create and assign'}</button>
          </div>
          {message ? <p className="shopify-editor-resource-controls__message" role="status">{message}</p> : null}
        </form>
      </div> : null}
    </div>
  );
}
