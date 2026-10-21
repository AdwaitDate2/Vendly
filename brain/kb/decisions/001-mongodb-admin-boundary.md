# Decision 001: MongoDB catalog admin boundary

Date: 2026-08-24
Status: accepted for the implementation slice

## Decision

Use one shared official MongoDB driver client, Zod input validation, integer
minor-unit prices, idempotent seed/index scripts, and a dedicated admin route
surface. Keep the public catalog static until a comparison-tested MongoDB
cutover is ready.

## Rationale

This preserves the current storefront while making admin data durable and
reversible. It avoids inventing payment infrastructure and keeps unconfirmed
Auth.js and media decisions out of production behavior. Shopify is only a
usability reference and is not integrated.

## Revisit when

Production identity, media storage, catalog ownership, or checkout integration is
confirmed.
