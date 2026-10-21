# Shopify editor catalog, templates, media, and Header findings

## Scope and evidence

Read-only browser inspection of the live Shopify reference at `https://admin.shopify.com/store/lucki-fit-2/themes/190060691778/editor` and local editor at `http://localhost:3000/admin/editor/home`, on 2026-10-13. The Shopify editor was a draft named “Copy of lucki live production,” with Home page selected. I opened and closed pickers and selected existing sections/blocks to inspect controls. I did not add/remove/reorder sections, select replacement media, change settings, save, or publish.

## Section catalog

Shopify’s **Add section** picker has a search field, **Sections / Apps** tabs, a **Generate** entry, and a catalog grouped by category. Selecting or focusing a catalog item shows a visual preview/description in an adjacent pane. The picker can be opened at the insertion point within Header, Template, or Footer.

Observed catalog entries in this store:

- Merchant sections: Delivery Timeline, Size Chart Section, Tee Suggestion Box.
- **Banners:** Hero; Hero: Bottom aligned; Hero: Marquee; Large logo; Layered slideshow; Slideshow: Full frame; Slideshow: Inset; Split showcase.
- **Collections:** Collection links: Spotlight; Collection links: Text; Collection list: Bento; Carousel; Editorial; Grid.
- **Forms:** Contact form; Email signup.
- **Layout:** Custom Liquid; Custom section; Divider.
- **Products:** Featured collection: Carousel; Featured collection: Editorial; Featured collection: Grid; Featured product; Product highlight; Product hotspots; Recommended products.
- **Storytelling:** Blog posts: Carousel; Blog posts: Editorial; Blog posts: Grid; Carousel; Editorial; Editorial: Jumbo text; Image compare; Image with text; Video.
- **Text:** FAQ; Icons with text; Marquee; Multicolumn; Pull quote; Rich text.

The **Apps** tab is separate from Sections. “Generate” is an AI-assisted entry, distinct from the normal catalog.

### Block catalog and nesting

The **Add block** picker mirrors the search + **Blocks / Apps** pattern and exposes a compact recommended list plus **Show all**. It has its own Generate entry and preview card. In the inspected Hero section the full catalog grouped blocks as:

- Basic: Button, Heading, Icon, Image, Logo, Page, Text, Video.
- Collection: Collection card, Collection title.
- Custom: Custom Liquid.
- Decorative: Comparison slider, Jumbo text, Marquee.
- Footer: Copyright, Follow on Shop, Payment icons, Policy links, Social media links.
- Forms: Contact form, Email signup.
- Layout: Accordion, Group, Spacer.
- Links: Menu, Popup link.
- Product: Buy buttons, Description, Price, Product card, Product inventory, Recommended products, Review stars, SKU, Special instructions, Swatches, Title, Variant picker.

The tree supports actual nested blocks: the inspected Footer had a Group block containing Text blocks, and Image compare had a Content group containing Text and Buttons. “Add block” appears between/after blocks; each row exposes reorder, hide, and remove controls. Header’s Logo and Menu are blocks under a shared Header section, not top-level sections.

## Template switching and creation

The template switcher is searchable and organized by Shopify resource type. The observed top-level types included Home page; Products; Collections; Collections list; Gift card; Cart; Checkout and customer accounts; Pages; Blogs; Blog posts; Search; Password; 404 page; and a separate Create metaobject template action. Product, collection, page, blog, and blog-post entries can be expanded to show existing templates and assignment counts.

Observed templates for this theme copy:

- Products: Default product (69 products), baby-tee (88), bundles (7), oversized-tee (15).
- Collections: Default collection (18 collections), all-collections (0), all-products (1), with-image (5).
- Pages: Default page (0), contact (1), girlsgirlsgirls (1), lucki-girls-drop-1 (1), one-day-sale (0), size-chart (1).
- Blogs: Default blog (1).

Each resource type exposes **Create template**. The creation dialog asks for a name (25-character limit) and a **Based on** template chosen from that resource type, with Cancel and Create template actions. The normal create action remained disabled until a name was entered. I closed it without creating a template.

## Media handling

The image and video asset selectors are full library dialogs, not bare URL fields. Observed controls include Search files; File size, Used in, and Product filters; sort; grid/list view; a selectable thumbnail grid with file names/type (video cards also show duration); Add files; and a drag-and-drop area. Image selection also offered **Generate image**. Video cards displayed MP4 and durations. A separate **Explore a library of free images** action opened a searchable Free images side panel with curated cards and a Select action. I closed all pickers without selecting or uploading anything.

The Hero section exposes two independent media slots, each with Image/Video type controls. Its settings include a separate mobile media option, “Stack media,” and “Show different media on mobile.” The inspected Hero had video on one slot and an empty image slot. Image and video pickers were contextual to each field.

Local byShreen already has a functional media library in the Hero editor. Its picker had All files and Theme files tabs (the inspected theme showed 6 video files), Search files, sort (Newest/name/largest/smallest), grid/list view, File size, Used in, Product filters, Add files, drag-and-drop, and Paste file URL. It displayed the currently selected video and an empty All files view. The local Hero form also exposes distinct desktop video, desktop poster, optional phone video, and optional phone poster inputs, with recommended aspect ratios/resolutions and video size/duration guidance. The largest visible parity differences are Shopify’s catalog/integration and browsing affordances: its picker showed populated store assets and had image generation plus a free-image library; local exposed a Theme files library and URL paste instead.

## Header inspector: section settings vs blocks

Selecting the shared Header section opens a rich section inspector. Its visible section-level controls include:

- Logo position: Left / Center / Right.
- Menu position: Left / Center / Right; row: Top / Bottom.
- Customer account visibility link to account settings.
- Search icon toggle; position Left / Right; row Top / Bottom.
- Localization controls for Country/Region, Flag, and Language selector; font, text size (10–18 px), position Left / Right, and row Top / Bottom.
- Appearance: width Page / Full; height Compact / Standard; sticky mode Always / On scroll up / Never; border thickness in px; Default and Inverse color schemes.
- Home, Product, and Collection page transparent-background controls; home page also selects Default / Inverse color scheme.
- Expandable Theme Settings and Custom CSS areas.

There is no section-level Gap control in the observed Header inspector. The Logo **block** contains a Hide logo on home page toggle and Desktop padding sliders for Top, Bottom, Left, and Right (px). The Menu **block** chooses an existing navigation menu (Main menu in this theme), color scheme, top-level size, submenu size, font, case, submenu media type (None / Collection images / Featured products / Featured collections), image ratio, image corner radius, and mobile layout toggles for Navigation bar, Accordion, and Dividers. Menu content comes from the selected navigation menu; the theme editor did not expose individual link editing in this block inspector.

In the local editor, the Header and Announcement bar rows are labeled **Managed in Navigation** and **Managed in Site-wide text**. The local Header does not appear as a section with Logo/Menu child blocks or the section-level layout, position, appearance, and padding controls seen in Shopify. This is the highest-priority Header parity gap.

## Local comparison and prioritized gaps

The local section picker currently has grouped, descriptive, store-specific sections (including content, forms, product, and search layouts) and a search field, so catalog discoverability and section descriptions already have a foundation. However, its choices are a curated set of byShreen sections rather than Shopify’s broad theme section library; it has no equivalent observed **Generate** section entry or live theme section preview pane. The local Header/Template/Footer tree and the responsive preview controls are present, but the shared Header is delegated to a different admin screen.

1. **P1 — Recreate the shared Header as an editable section:** expose Logo and Menu child blocks, section-level layout/position/appearance controls, and logo block padding. Keep navigation link content wired to the existing menu editor.
2. **P1 — Expand the section/block model and catalog:** match the category browsing, app entries, recommended vs full list, preview pane, and nested reusable block types. Shopify’s visible nested Group/Accordion and global block catalog exceed the local custom section catalog.
3. **P1 — Preserve media library workflows while matching Shopify affordances:** add contextual image/video selection with rich thumbnails, filters and sort, upload/drop, and separate mobile media. Local already has library tabs, filters, direct URL, and desktop/mobile media slots; free-image browsing and image generation were present in Shopify and not seen locally.
4. **P2 — Match resource template switching/creation:** expose Shopify-style resource-type browsing/search, existing template assignment counts, and the name/base-template creation flow. Local currently shows a fixed collection of page names and default product/collection/list/search templates in its selector; no Create template control was visible there.
5. **P2 — Keep the editing canvas linked to every tree operation:** Shopify’s section/block rows are draggable, hideable, removable, and selected items drive both the inspector and preview; local currently has a selected-section toolbar and block controls for its own specialized schemas.
