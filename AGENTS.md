# AGENTS.md

Constraints and conventions for contributors and AI agents working in orchard-ui.

## Strategic trade-off (read first)

orchard-ui builds as a Next.js static export (`output: 'export'`) so its release artifact can be baked into the orchard native binary. This is the deliberate trade we made for single-binary distribution (issue [orchard#78](https://github.com/orchard-cde/orchard/issues/78)). **Anything that requires a Node.js runtime is permanently off the table for this UI:** server actions, streaming SSR, route handlers, middleware, edge runtime, and `next/image` optimization. New routes that need any of those features have nowhere to run.

Before reaching for them, reconsider whether the feature can be done:
- Client-side (React state, axios, SSE) — the existing pattern,
- In the orchard API (`/api/*`),
- Or in the SPA-fallback layer that orchard's trellis serves at runtime.

## Hard constraints

- **Project type:** Next.js 15 app router, static-export target (`output: 'export'`).
- **Forbidden in source code:**
  - `"use server"` directives
  - `next/headers` imports, `cookies()`, `headers()`
  - Server actions
  - Route handlers under `app/api/`
  - `middleware.ts` at any layer
  - Edge runtime exports (`export const runtime = 'edge'`)
  - `<Image>` from `next/image` without accepting `unoptimized: true` semantics

- **New dynamic routes (`[param]/`)** must export `generateStaticParams` returning at least one path. For routes whose IDs are runtime-only (UUIDs, slugs from API data), return a single sentinel like `[{ id: '_' }]`; orchard's SPA fallback handles the actual runtime URLs. Do NOT return `[]` — Next.js 15 static export errors out. Do NOT export `dynamicParams = true` — it conflicts with `output: 'export'`. If the page needs client-side hooks (`useParams`, `useState`, etc.), split into a server-component `page.tsx` (exports `generateStaticParams`, renders the client view) and a `'use client'` child component. See `app/(main)/groves/[id]/` for the canonical example.

- **All API calls go through `lib/api/apiClient.ts`** so the `NEXT_PUBLIC_API_URL=''` build switch reaches every request and the bundled UI hits the same origin as the API.

## Image handling caveat

`images: { unoptimized: true }` is required by static export. `next/image` is effectively a styled `<img>` with no lazy-loading, no responsive `srcset`, and no format conversion. The current UI is chrome-only (favicon). If you add non-trivial images (logos, illustrations, screenshots), evaluate manual `srcset` + `loading="lazy"` patterns — don't expect `next/image` to do anything useful for you.

## Bundle-size watch metric

Static export ships every route's JS chunk in the page bundle. Today (~5 routes) the bundle is small. Watch the `out/_next/static/chunks/` total size as the route tree grows. If first-paint over a slow connection becomes painful (e.g., total chunks > ~500 KB gzipped), consider per-route code splitting via dynamic imports.

## Verification command

Before opening any PR:

```bash
npm test && npm run build:bundle && test -f out/index.html
```

This mirrors what CI does. If it passes locally, CI will pass.

## Consumer contract

The `out/` tarball is consumed by orchard's trellis (Spring Boot native image) and served from the same origin as the `/api/*` endpoints. The contract (URL pattern, tarball layout, required server behavior, versioning, auth) is documented in:

`docs/superpowers/specs/2026-06-15-orchard-ui-release-bundle-design.md` → "Contract surface" section.

Before changing anything in `lib/api/apiClient.ts`, the contract for environment variables, or the shape of `out/`, re-read that section and the orchard side of the integration.

## BFF (Backend-for-Frontend)

`bff/` is a standalone Spring Boot (servlet/WebMVC) service that serves the static export and
reverse-proxies `/api/**` (incl. SSE) to orchard core. It ships as a GraalVM native binary
(`orchard-ui-bff`) consumed by orchard `dev-server start`. See
`docs/architecture/bff-architecture.md` and the spec under `docs/superpowers/specs/`.

Build / test / run:

```bash
cd bff
./gradlew test                 # JVM unit + integration tests
./gradlew bootRun              # run on :8080, proxying /api to orchard.core.base-url (:8081 default)
./gradlew nativeCompile        # produce build/native/nativeCompile/orchard-ui-bff
```

The UI is embedded from `../out` at build time (`bootJar`/`nativeCompile` run `npm run build:bundle`
first). Configure the upstream with `ORCHARD_CORE_BASE_URL`. Dev HMR: run with `--spring.profiles.active=dev`
and a running `next dev` (proxied via `orchard.dev.next-url`, default `http://localhost:3000`).
