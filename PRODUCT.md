# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Small businesses creating and maintaining their own website.
- Returning account holders need to choose a website project and open its editor.

## Product Purpose

Vendly is a standalone website builder. It gives an account a private website workspace with a public site address. Success is an owner being able to shape a storefront, preview it, and publish it.

## Positioning

The existing product combines an editor for themes and page content, reusable sections, responsive previews, and separate draft and published states. Each website's content is stored in its own tenant database.

## Operating Context

- Existing accounts sign in with email and password.
- The requested account flow is: public landing page → sign in → project dashboard → choose or create a website project → that project's editor.
- One account may own multiple independent website projects, each with its own public site address and editor data.

## Capabilities and Constraints

- Each owner can manage multiple website projects. Every project has its own tenant database, public site slug, and selected editor session.
- New projects, including the first project created at signup, begin with an empty canvas rather than prefilled storefront sections.
- Existing accounts keep their original tenant as their first project, so their site data and public address remain available.
- The app uses Next.js App Router, React, MongoDB, and signed HTTP-only sessions.
- MongoDB, `ADMIN_SESSION_SECRET`, and Kenmark Storage are deployment requirements. Account recovery, custom domains, and hosting are not configured in this project.

## Brand Commitments

- The product name in the repository and existing sign-in experience is Vendly.
- A repository brand brief describes the product as a standalone website builder. Its logo work explores concepts but does not establish a selected logo asset.

## Evidence on Hand

- The existing editor supports theme and page content, reusable sections, responsive previews, draft and publish controls, and public storefront routes.
- The editor supports starting with an empty canvas and adding storefront sections and pages.
- No customer testimonials, customer counts, benchmarks, or pricing evidence are present. Do not invent them.

## Product Principles

- Keep each website's content isolated in its own tenant.
- Let owners preview changes before publishing.
- Keep the editor focused on shaping a real, public storefront.
- Let one account manage multiple independent website projects.
