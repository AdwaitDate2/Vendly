---
id: "003"
title: Apply the website-draft editorial refresh
tier: full-feature
type: feature
status: in-progress
source: kenmark-plan
created: 2026-09-18
approved: 2026-09-18
files:
  - app/page.js
  - app/custom/page.js
  - app/our-story/page.js
  - app/craftsmanship/page.js
  - app/book-appointment/page.js
  - app/bridal/page.js
  - app/collections/page.js
  - app/faq/
  - components/
  - data/
  - public/images/
  - app/globals.css
related_issues: []
related_plans:
  - "002"
---

# Plan - Apply the website-draft editorial refresh

## Summary

Apply the reviewed changes in `Website draft 2 - shreen .pdf` to the existing
public byShreen site. This is an editorial and asset-composition refresh, not a
new design system, catalog rebuild, or admin-platform project. Preserve the
ivory, olive, mulberry, serif, and sans visual language already implemented.

Work is divided into four visible delivery phases. At the end of every phase,
run a desktop and mobile browser review, send the user a concise progress update
with visual evidence, and pause for their review before beginning the next
phase.

## Goal

Bring the public routes into alignment with the annotated website draft while
retaining working navigation, responsive behavior, accessibility basics, and
the current static/Mongo catalog boundary.

## Planning frame

- **Goal:** implement the PDF's marked copy, image, composition, and supporting
  section changes in reviewable increments.
- **Current state:** the target routes already exist on `merge-17092026`; the
  reviewed PDF is an untracked local source artifact and must not be modified or
  committed.
- **Desired outcome:** each annotated page presents the approved narrative and
  asset treatment, with functioning existing calls to action and no regressions
  to shared chrome or catalog browsing.
- **Scope:** Home, collection presentation, Custom, Our Story, Craftsmanship,
  Appointments, Bridal, FAQ, shared presentation components/styles, and only
  the approved images/copy needed by those routes.
- **Constraints:** use pnpm; preserve unrelated work; do not alter the draft
  PDF; do not build the administrative CMS, checkout, production calendar sync,
  client-story detail pages, or an image-upload provider as part of this work.
- **Unknowns:** final replacement imagery and any final copy that is only
  indicated as a comment in the PDF; whether the appointment leaf should be
  animated; the actual appointment-provider capability.
- **Risk level:** medium. Most changes are presentational, but unapproved image
  substitutions, animation assumptions, and hardcoded appointment behavior can
  create an inaccurate public experience.
- **Time sensitivity:** visual review is required between phases.
- **Plan tier:** full-feature.

## Current understanding

The PDF identifies these route-level outcomes:

| Area | Intended change |
| --- | --- |
| Home and collection | Refine editorial copy and hierarchy, correct selected imagery/asset crops, improve founder/story presentation, and add the intended testimonial/client-proof treatment. |
| Custom | Use a closer jewelry hero crop, tighten the five-stage story, include more client stories, and retain a clear commission intake. |
| Our Story | Rebalance the collage so text and personal images work together; use the supplied personal-photo direction rather than a crowded top treatment. |
| Craftsmanship | Replace the flagged imagery, add the gold material section, make the standards section more prominent, and turn the generational-craft content into the proposed story flow. |
| Appointments | Clarify the introduction, add an in-person/virtual selection, resolve the leaf-animation question, and add client-story proof below the booking experience. |
| Bridal | Expand the supporting editorial/proposal material and make the traditional-jewelry section feel more intentional. |
| FAQ | Preserve the drafted categorised accordion presentation and validate the final answers/routes. |

The existing routes already cover this information architecture. Plan 002
continues to own future CMS/admin, real provider, consent, and operational
systems; this plan must not duplicate those initiatives.

## Options

| Option | Summary | Pros | Cons | Risk | When to choose |
| --- | --- | --- | --- | --- | --- |
| A | Deliver the PDF as route-level editorial components and a small shared content/asset registry where duplication exists. | Matches the brief quickly, keeps page ownership clear, and avoids unnecessary platform work. | Requires a later migration if CMS editing becomes a priority. | Low | Recommended for this draft-driven refresh. |
| B | Expand the existing admin/content system before changing the public pages. | Gives editors structured management immediately. | Materially expands scope, delays visual review, and overlaps Plan 002. | High | Choose only after explicit approval for CMS work. |

**Recommended: Option A.** It satisfies the draft without turning a visual
refresh into a platform project.

## Recommended approach

1. Convert each visible PDF annotation into a route/section acceptance record
   before changing code.
2. Use approved local assets only. Keep a visibly incomplete image request as a
   blocker rather than substituting stock imagery or pretending a provider sync
   exists.
3. Implement in route groups with the smallest shared component/style changes
   necessary.
4. At every checkpoint, run the route in a browser at desktop and mobile
   widths, share the completed scope and evidence, then wait for user review.
5. Finish with a full cross-route, responsive, lint, and production-build pass.

## Phased plan

### Phase 1 - Baseline, Home, and collection presentation

- [x] Create an annotation register mapping every Home and collection-page PDF
  comment to a route, component, source asset, owner, and acceptance condition.
- [x] Record unresolved imagery/copy as explicit user decisions; do not invent
  final text, testimonials, metrics, or project imagery.
- [x] Update the Home hero, welcome/collection hierarchy, featured products,
  value/story blocks, founder treatment, and testimonial/client-proof content
  that the draft marks for revision.
- [x] Update the collection landing presentation only where needed to match the
  approved editorial direction while preserving catalog data reads and product
  links.
- [x] Make any necessary shared header, footer, card, or typography adjustments
  without changing the existing brand tokens.
- [x] Verify Home and Collections in browser at desktop and mobile widths.

#### Phase 1 annotation register

| PDF annotation | Resolution | Status |
| --- | --- | --- |
| Make the collections lead large and editorial | Added the `byShreen Collections` editorial lead and supporting copy. | Complete |
| Use an engagement-ring image in the first collection tile | Updated the tile reference to the existing approved engagement-ring asset path. | Blocked visually: the ignored local campaign asset directory is absent. |
| Add Custom after the collection | Moved the existing Custom Journey immediately after the collections grid. | Complete |
| Place Custom before the product edit | Moved the existing custom section ahead of `Jewelry to live in`. | Complete |
| Move the trust statement after the founder note | Moved the house-values block after the founder letter. | Complete |
| Use a low-opacity ivory flower | Changed the house-values mark to the ivory asset and reduced its opacity. | Complete |
| Put client proof on the collections page | Reused the approved testimonial records in a collections-page section. | Complete |
| Move client stories after the final invitation | Moved the Home testimonial section after the final CTA. | Complete |

**Verification note (2026-09-18):** Home and Collections loaded at desktop and
390px mobile widths with meaningful content, no framework error overlay, no
browser errors, and no mobile horizontal overflow. The local checkout lacks the
ignored `public/images/` campaign-image directory, so image frames cannot be
visually approved until those approved source assets are restored.

**Checkpoint 1:** send the user the visual review update and pause. Do not
begin Phase 2 until they confirm the first phase is ready to continue.

### Phase 2 - Custom, Bridal, and Appointments

- [ ] Apply the approved Custom hero asset/crop, five-stage journey copy, and
  expanded client-story treatment.
- [x] Update Bridal's explanatory/editorial section and proposal/story layout
  as marked, preserving all working calls to action.
- [x] Add an explicit in-person versus virtual appointment choice to the
  appointment request experience; keep it an intake preference unless an
  approved provider integration exists.
- [ ] Resolve the leaf animation only after confirming whether motion is wanted;
  respect reduced-motion preferences if it is implemented.
- [x] Add the requested client-story/proof section to the appointments route
  using supplied/approved material.
- [x] Verify Custom, Bridal, and Appointments in browser at desktop and mobile
  widths, including keyboard operation for all new controls.

#### Phase 2 annotation register

| PDF annotation | Resolution | Status |
| --- | --- | --- |
| Use a tighter jewelry crop for the Custom hero | The existing hero source is retained pending the missing approved campaign-image directory. | Blocked |
| Clarify the custom stages | Rewrote all five stages around idea, sourcing, design, craft, and reveal. | Complete |
| Add Why byShreen | Added the requested diamond-expertise and design perspective section. | Complete |
| Show four custom stories and remove the placeholder note | Added a fourth existing story tile and removed the promise of unwritten detail pages. | Complete |
| Offer in-person and virtual appointments | Added an accessible two-option control; its selected value is retained with the existing appointment topic. | Complete |
| Animate the appointment leaf | The draft asks whether it should animate, so the static mark is preserved pending approval. | Deferred |
| Add proposal/client stories to appointments | Added the existing approved client-story carousel after intake. | Complete |
| Add the bridal confidence section | Added the guidance copy and booking CTA from the draft. | Complete |
| Make Traditional Reimagined more editorial | Reworked the section into a dedicated editorial split layout. | Complete |

**Verification note (2026-09-18):** Custom, Appointments, and Bridal loaded at
desktop and 390px mobile widths with no framework error overlay, browser errors,
or mobile horizontal overflow. The in-person/virtual preference updates the
submitted topic value as expected. The missing campaign-image directory still
blocks image-fidelity approval.

**Checkpoint 2:** send the user the visual review update and pause. Do not
begin Phase 3 until they confirm the second phase is ready to continue.

### Phase 3 - Our Story, Craftsmanship, and FAQ

- [x] Recompose the Our Story collage and narrative relationship so personal
  images and copy share the visual weight specified in the draft.
- [ ] Replace the flagged Craftsmanship imagery with approved source assets;
  implement the 14kt/18kt gold and diamond standards treatment, plus the
  generational-craft story flow from the PDF.
- [x] Keep factual claims on diamond sourcing, manufacturing, materials, and
  quality limited to approved business copy.
- [x] Review and complete FAQ categories/questions/answers against the draft;
  retain accessible accordion semantics and keyboard behavior.
- [x] Verify Our Story, Craftsmanship, and FAQ at desktop and mobile widths.

#### Phase 3 annotation register

| PDF annotation | Resolution | Status |
| --- | --- | --- |
| Let Our Story text and images share the top composition | Added the family-story introduction beside the collage instead of leaving all narrative below it. | Complete |
| Use the supplied personal Story photos | Existing approved image paths are retained; the referenced Drive folder and local campaign image directory are unavailable in this checkout. | Blocked |
| Use different Craftsmanship imagery | The requested hands, workshop, stone-setting, and inspection images are not in the approved local asset set. | Blocked |
| Move gold after diamonds and bring standards forward | Put the expanded diamond standards immediately after Natural Diamonds and moved the gold section after the supply-chain explanation. | Complete |
| Explain the supply chain higher on the page | Replaced the generic process strip with the five-step From stone to story narrative. | Complete |
| Keep FAQ grouped and readable | Kept the draft’s categories/questions and added proper expanded state and labelled answer regions. | Complete |

**Verification note (2026-09-18):** Our Story, Craftsmanship, and FAQ loaded
at desktop and 390px mobile widths with no framework error overlay, browser
errors, or mobile horizontal overflow. The FAQ answer test confirmed an expanded
button and its labelled answer region. Missing Story/Craftsmanship source imagery
still prevents image-fidelity approval.

**Checkpoint 3:** send the user the visual review update and pause. Do not
begin Phase 4 until they confirm the third phase is ready to continue.

### Phase 4 - Cross-page polish and release readiness

- [x] Recheck every changed desktop and mobile route for typography, image
  crops, content hierarchy, footer/newsletter spacing, CTA destinations, and
  overflow.
- [x] Validate focus treatment, keyboard access, reduced-motion behavior, image
  alt text, and heading order for the changed interfaces.
- [x] Run the project checks and manually verify changed public flows.
- [x] Update the relevant KB/changelog only for completed, material source
  changes; do not record unapproved claims or private client information.
- [x] Report completion separately from any later publishing, deployment, or
  production-acceptance decision.

**Verification note (2026-09-18):** Home, Collections, Custom, Bridal,
Appointments, Our Story, Craftsmanship, and FAQ were checked at 1440px and
390px. Each route had one H1, meaningful content, no horizontal overflow, no
open error overlay, no empty CTA, and no image missing an `alt` attribute. At
390px, each route exposed the mobile menu. Keyboard focus received the shared
2px focus treatment, FAQ expanded via Enter with a labelled region, and reduced
motion disabled page-image animation. `git diff --check`, `pnpm lint`, and
`pnpm test` passed; lint reported five pre-existing `no-img-element` warnings.
`pnpm build` remains blocked by unresolved pre-existing `@kenmark/storage`
imports in asset API routes and `lib/storage.js`, not by this visual refresh.
The ignored `public/images/` campaign-image directory is still absent, so the
draft's requested image/crop fidelity cannot receive final visual approval.

**Checkpoint 4:** send the user the final visual-review update with check
results. Publishing is not part of this plan.

## Files likely involved

| File or area | Expected change |
| --- | --- |
| `app/page.js` | Home editorial content, composition, asset references, and CTAs. |
| `app/collections/page.js`, `app/collections/[slug]/page.js` | Collection presentation only; no catalog-contract rewrite. |
| `app/custom/page.js`, `components/CustomJourney.jsx`, `components/InquiryForm.jsx` | Custom story flow, approved proof, and form labels/options. |
| `app/bridal/page.js`, `app/book-appointment/page.js` | Bridal editorial treatment and appointment preference/client proof. |
| `app/our-story/page.js`, `app/craftsmanship/page.js`, `app/faq/` | Story/craft composition and FAQ accuracy/accessibility. |
| `components/`, `data/`, `app/globals.css` | Minimal shared content/component/style support. |
| `public/images/` | Only approved, rights-cleared asset additions or replacements. |
| `brain/kb/`, `brain/CHANGELOG.md` | Update after material implementation only, per repository workflow. |

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Replacement images or final copy are not supplied | Incorrect or generic public content | Maintain an explicit asset/copy register and stop the affected section for a user decision. |
| A visual fix breaks route behavior or catalogue links | Lost conversions/navigation | Preserve existing URLs and verify every changed CTA in the browser. |
| Calendar mock is mistaken for live availability | Misleading booking expectations | Keep it visual-only unless a provider integration is explicitly approved and implemented separately. |
| New motion causes distraction or accessibility issues | Reduced usability | Implement only after confirmation; provide `prefers-reduced-motion` fallback. |
| Changes spill into Plan 002 platform work | Scope and delivery delay | Keep data/provider/admin changes out of this plan and create a separate plan if required. |

## Acceptance criteria

- [x] Every PDF annotation is mapped to implemented, deferred, or explicitly
  blocked work; no comment is silently ignored.
- [ ] The approved page groups match the draft's copy, imagery, and hierarchy
  without placeholder imagery or invented business claims.
- [x] After each phase, the user receives a desktop/mobile visual checkpoint and
  the implementation waits for their review before progressing.
- [x] Existing product, collection, booking, inquiry, and navigation paths keep
  working on changed pages.
- [x] Changed components are responsive, keyboard-operable, and respect reduced
  motion where relevant.
- [x] `pnpm lint`, `pnpm test`, and `pnpm build` complete successfully, or any
  failure is documented with its cause and scope.
- [x] No deployment, publication, remote branch change, or commit occurs under
  this plan without separate authorization.

The remaining unchecked criterion is intentionally limited to final imagery:
the implementation uses the approved paths and no fabricated substitutes, but
the referenced campaign assets are unavailable in this checkout.

## Commands and checks to run

```bash
pnpm lint
pnpm test
pnpm build
```

During each phase, start or reuse the local Next.js server with `pnpm dev`, then
review the affected routes in a real browser at desktop and mobile viewport
sizes. Record only the checks actually run.

## Rollback

Keep each phase as a discrete, reviewable working-tree change. If visual review
rejects a phase, revert only that phase's identified source files after
inspecting the diff; do not reset or discard unrelated user work. Static assets
should be additive until the visual decision is accepted.

## Open questions

1. Which supplied, rights-cleared assets should replace every PDF-marked image?
2. Is the leaf on the appointment page intended to animate, and if so, what
   motion reference and duration should it use?
3. Should the phase checkpoint be an approval gate (recommended) or an
   informational update followed by automatic continuation?
4. Are the referenced client stories approved for public display, including
   names, dates, imagery, and links to their detail stories?
