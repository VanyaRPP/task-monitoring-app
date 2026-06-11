# API Reference

The API is **self-documented with Swagger/OpenAPI** — that's the canonical,
always-current reference. Don't hand-maintain a parallel endpoint list (the old
`docs/API.md` drifted and is retired).

## Where it lives

- **Swagger UI page:** `pages/docs.tsx` → run the app and open
  [`http://localhost:3000/docs`](http://localhost:3000/docs)
  (in production: `https://<your-domain>/docs`).
- **OpenAPI spec endpoint:** `pages/api/doc.ts` builds the spec with
  `next-swagger-doc` by scanning JSDoc annotations in `pages/api/**`.

## How endpoints are documented

Routes are annotated with `@swagger` JSDoc blocks. Examples already exist in
`pages/api/profits/*` and `pages/api/feature-flags/*` — copy that shape.

```ts
/**
 * @swagger
 * /api/profits:
 *   get:
 *     summary: List profits
 *     tags: [Profits]
 *     responses:
 *       200:
 *         description: Array of profit records
 */
export default async function handler(req, res) {
  /* ... */
}
```

Reusable schemas can be declared once (see the `@swagger` `components` block in
`common/modules/models/*` annotations) and referenced with `$ref`.

## When you add or change an endpoint

1. Add/adjust the `@swagger` JSDoc block on the handler.
2. Tag it (`tags: [Domain]`, `[Payments]`, …) so it groups in the UI.
3. Restart `yarn dev` and verify it shows up at `/docs`.

> Quick map of API areas (for orientation): `task/*`, `spacehub/payment/*`,
> `profits/*`, `domain/*`, `real-estate/*`, `service/*`, `custom-services/*`,
> `streets/*`, `bankapi/*`, `user/*`, `auth/*`, `feature-flags/*`, `sceduled/*`.
> Most endpoints require an authenticated NextAuth session and return JSON.
