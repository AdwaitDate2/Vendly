const landingImage = (imageName: string) => `/images/landing/${imageName}.png`;

function ChevronIcon({ direction = 'right' }: { direction?: 'right' | 'down' }) {
  const transform = direction === 'down' ? 'rotate(90 8 8)' : undefined;
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false" style={transform ? { transform } : undefined}>
      <path d="m5 3 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function SectionIcon({ kind }: { kind: 'hero' | 'about' | 'products' | 'contact' }) {
  if (kind === 'hero') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><rect x="3.5" y="4" width="17" height="16" rx="1.5" /><circle cx="9" cy="9" r="1.5" /><path d="m4 17 5-5 3 3 2-2 6 5" /></svg>;
  }
  if (kind === 'about') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><rect x="4" y="3.5" width="16" height="17" rx="1.5" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
  }
  if (kind === 'products') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M8 8V6a4 4 0 0 1 8 0v2M5 8h14l-1 12H6L5 8Z" /><path d="M9 11v1m6-1v1" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><rect x="3.5" y="5" width="17" height="14" rx="1.5" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><circle cx="8.5" cy="8.5" r="5.25" /><path d="m12.5 12.5 4 4" /></svg>;
}

function ShoppingBagIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><path d="M4 7h12l-.8 10H4.8L4 7Z" /><path d="M7 7V5.5a3 3 0 0 1 6 0V7" /></svg>;
}

function LandingHeader() {
  return (
    <header className="landing-header">
      <a className="landing-wordmark" id="brand-wordmark" href="/" aria-label="Vendly home">Vendly</a>
      <nav className="landing-nav" aria-label="Main navigation">
        <a id="nav-product" href="#product">Product</a>
        <a id="nav-how-it-works" href="#how-it-works">How it works</a>
      </nav>
      <a className="landing-header-signin" id="nav-sign-in" href="/admin/login">Sign in</a>
    </header>
  );
}

function LandingIntroduction() {
  return (
    <div className="landing-introduction" id="hero-introduction">
      <LandingHeader />
      <section className="landing-hero-copy" aria-labelledby="hero-headline">
        <h1 id="hero-headline"><span>Start with one page.</span><span>Grow into a website.</span></h1>
        <p id="hero-description">Choose a project, shape its pages, and publish when it’s ready.</p>
        <div className="landing-hero-actions">
          <a className="landing-primary-action" id="hero-sign-in" href="/admin/login">Sign in</a>
          <a className="landing-secondary-action" id="hero-create-account" href="/admin/signup">Create an account</a>
        </div>
      </section>
    </div>
  );
}

function ProjectRow({ image, imageId, name, nameId }: { image: string; imageId: string; name: string; nameId: string }) {
  return (
    <li className="landing-project-row">
      <img id={imageId} src={landingImage(image)} alt="" />
      <span className="landing-project-row__name" id={nameId}>{name}</span>
      <span className="landing-project-row__open" aria-hidden="true"><ChevronIcon /></span>
    </li>
  );
}

function SectionRow({ kind, label, id, selected = false }: { kind: 'hero' | 'about' | 'products' | 'contact'; label: string; id: string; selected?: boolean }) {
  return (
    <li className={`landing-section-row${selected ? ' is-selected' : ''}`} id={id}>
      <SectionIcon kind={kind} />
      <span>{label}</span>
      <ChevronIcon />
    </li>
  );
}

function ProjectSheet() {
  return (
    <section className="landing-sheet landing-project-sheet" id="projects-panel" aria-labelledby="projects-heading">
      <div className="landing-project-sheet__heading">
        <h2 id="projects-heading">Your projects</h2>
        <span className="landing-project-add" id="projects-add" aria-hidden="true"><span /></span>
      </div>
      <ul className="landing-project-list">
        <ProjectRow image="project-mug-image" imageId="project-mug-image" name="Sunridge Pottery" nameId="project-pottery-name" />
        <ProjectRow image="project-plant-image" imageId="project-plant-image" name="Maple & Co." nameId="project-maple-name" />
        <ProjectRow image="project-bowls-image" imageId="project-bowls-image" name="Lumen Studio" nameId="project-lumen-name" />
      </ul>
    </section>
  );
}

function SectionsSheet() {
  return (
    <section className="landing-sheet landing-sections-sheet" id="sections-panel" aria-labelledby="sections-heading">
      <h2 id="sections-heading">Website sections</h2>
      <ul className="landing-section-list">
        <SectionRow id="section-hero-row" kind="hero" label="Hero" selected />
        <SectionRow id="section-about-row" kind="about" label="About" />
        <SectionRow id="section-products-row" kind="products" label="Products" />
        <SectionRow id="section-contact-row" kind="contact" label="Contact" />
      </ul>
    </section>
  );
}

function EditorSheet() {
  return (
    <section className="landing-sheet landing-editor-sheet" id="editor-panel" aria-labelledby="editor-heading">
      <h2 id="editor-heading">Edit hero</h2>
      <div className="landing-demo-field">
        <span className="landing-demo-field__label" id="editor-headline-label">Headline</span>
        <div className="landing-demo-field__value landing-demo-field__value--headline" id="editor-headline-value" role="textbox" aria-readonly="true">Handmade for<br />a calmer home.</div>
      </div>
      <div className="landing-demo-field">
        <span className="landing-demo-field__label" id="editor-subheading-label">Subheading</span>
        <div className="landing-demo-field__value landing-demo-field__value--subheading" id="editor-subheading-value" role="textbox" aria-readonly="true">Ceramics, crafted in small batches for everyday living.</div>
      </div>
      <div className="landing-demo-field landing-demo-field--image">
        <span className="landing-demo-field__label" id="editor-image-label">Image</span>
        <img id="editor-selected-image" src={landingImage('editor-selected-image')} alt="" />
        <span id="editor-delete-control" className="landing-image-remove" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false"><path d="M5 6h10l-.7 10H5.7L5 6Zm2-2h6l1 2H6l1-2Zm1.5 5v4m3-4v4" /></svg>
        </span>
      </div>
    </section>
  );
}

function FoldTransition({ id }: { id: string }) {
  return <span className="landing-fold-transition" id={id} aria-hidden="true"><ChevronIcon /></span>;
}

function StorefrontSheet() {
  return (
    <section className="landing-sheet landing-storefront-sheet" id="storefront-frame" aria-labelledby="storefront-title">
      <div className="landing-storefront-toolbar">
        <span className="landing-draft-status" id="draft-status"><i />Draft</span>
        <span className="landing-demo-control landing-demo-control--preview" id="preview-control">Preview</span>
        <span className="landing-demo-control landing-demo-control--publish" id="publish-control">Publish</span>
      </div>
      <span className="landing-storefront-corner" id="storefront-outer-corner" aria-hidden="true" />
      <h2 id="storefront-title">Sample storefront</h2>
      <div className="landing-sample-site-header" id="sample-site-header">
        <span className="landing-sample-site-name" id="sample-site-name">Sunridge Pottery</span>
        <nav className="landing-sample-site-navigation" id="sample-site-navigation" aria-label="Sample storefront navigation">
          <span>Shop</span><span>About</span><span>Contact</span>
        </nav>
        <span className="landing-store-icon"><SearchIcon /></span>
        <span className="landing-store-icon"><ShoppingBagIcon /></span>
      </div>
      <div className="landing-store-hero">
        <img id="sample-store-hero" src={landingImage('sample-store-hero')} alt="" />
        <div className="landing-store-hero__copy">
          <h3 id="sample-hero-heading">Handmade for<br />a calmer home.</h3>
          <p id="sample-hero-description">Ceramics, crafted in small batches for everyday living.</p>
          <span className="landing-store-hero__button" id="sample-shop-button">Shop collection</span>
        </div>
      </div>
      <div className="landing-collection">
        <h3 id="collection-heading">Our collection</h3>
        <div className="landing-collection__items">
          <img id="collection-stacked-bowls" src={landingImage('collection-stacked-bowls')} alt="" />
          <img id="collection-ceramic-mug" src={landingImage('collection-ceramic-mug')} alt="" />
          <img id="collection-serving-bowl" src={landingImage('collection-serving-bowl')} alt="" />
          <img id="collection-vase" src={landingImage('collection-vase')} alt="" />
        </div>
      </div>
    </section>
  );
}

export function UnfoldedEditorDemo() {
  return (
    <section className="landing-foldout" id="unfolded-editor-demo" aria-label="A sample website taking shape in Vendly">
      <ProjectSheet />
      <FoldTransition id="fold-project-to-sections" />
      <SectionsSheet />
      <FoldTransition id="fold-sections-to-editor" />
      <EditorSheet />
      <StorefrontSheet />
    </section>
  );
}

export function LandingFirstViewport() {
  return (
    <div className="landing-page">
      <div className="landing-first-viewport">
        <LandingIntroduction />
        <UnfoldedEditorDemo />
      </div>
    </div>
  );
}
