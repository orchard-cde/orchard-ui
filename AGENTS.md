# AGENTS.md

Constraints and conventions for contributors and AI agents working in orchard-ui.

## Repo layout (read first)

orchard-ui is a **Gradle multi-project** with two modules:

- **`:frontend`** (`frontend/`) — the Next.js static-export SPA. All the constraints below apply here.
- **`:backend`** (`backend/`) — a Spring Boot service (package `dev.orchard.ui.backend`) that serves the
  embedded frontend and reverse-proxies `/api/**` (incl. SSE) to orchard core. Ships as a GraalVM native
  binary (`orchard-ui-backend`) that orchard `dev-server start` downloads and runs.

A single `./gradlew` at the repo root drives both modules.

## Strategic trade-off

The frontend builds as a Next.js static export (`output: 'export'`) so it can be embedded into the
`:backend` native binary for single-binary distribution. **Anything that requires a Node.js runtime is
permanently off the table for the frontend:** server actions, streaming SSR, route handlers, middleware,
edge runtime, and `next/image` optimization. New routes that need any of those have nowhere to run.

Before reaching for them, reconsider whether the feature can be done:
- Client-side (React state, axios, SSE) — the existing pattern,
- In the orchard API (`/api/*`),
- Or in the `:backend` module's serving/proxy layer (`backend/src/main/java/dev/orchard/ui/backend/`).

## Hard constraints (frontend)

- **Project type:** Next.js 15 app router, static-export target (`output: 'export'`), under `frontend/`.
- **Forbidden in source code:**
  - `"use server"` directives
  - `next/headers` imports, `cookies()`, `headers()`
  - Server actions
  - Route handlers under `app/api/`
  - `middleware.ts` at any layer
  - Edge runtime exports (`export const runtime = 'edge'`)
  - `<Image>` from `next/image` without accepting `unoptimized: true` semantics

- **New dynamic routes (`[param]/`)** must export `generateStaticParams` returning at least one path. For
  routes whose IDs are runtime-only (UUIDs, slugs from API data), return a single sentinel like
  `[{ id: '_' }]`; the `:backend` SPA resolver handles the actual runtime URLs at serve time. Do NOT
  return `[]` — Next.js 15 static export errors out. Do NOT export `dynamicParams = true` — it conflicts
  with `output: 'export'`. If the page needs client-side hooks, split into a server-component `page.tsx`
  (exports `generateStaticParams`, renders the client view) and a `'use client'` child. See
  `frontend/app/(main)/groves/[id]/` for the canonical example.

- **All API calls go through `frontend/lib/api/apiClient.ts`** so the `NEXT_PUBLIC_API_URL=''` build switch
  reaches every request and the bundled UI hits the same origin as the API (the backend proxies it).

## Image handling caveat

`images: { unoptimized: true }` is required by static export. `next/image` is effectively a styled `<img>`
with no lazy-loading, no responsive `srcset`, no format conversion. The current UI is chrome-only (favicon).
For non-trivial images, evaluate manual `srcset` + `loading="lazy"` rather than `next/image`.

## Bundle-size watch metric

Static export ships every route's JS chunk in the page bundle. Watch `frontend/out/_next/static/chunks/`
total size as the route tree grows. If first-paint over a slow connection becomes painful (e.g. total
chunks > ~500 KB gzipped), consider per-route code splitting via dynamic imports.

## Verification command

Before opening any PR:

```bash
./gradlew build
```

This builds and tests both modules (frontend: `next build` + jest; backend: tests + jar) and mirrors CI.
For frontend-only iteration: `cd frontend && npm test && npm run build:bundle && test -f out/index.html`.

## :backend module

`backend/` is the Spring Boot (servlet/WebMVC) service. It serves the frontend's static export with a
Next-static-export-aware SPA resolver and reverse-proxies `/api/**` (incl. SSE) to orchard core. It ships
as the GraalVM native binary `orchard-ui-backend`. Design: `docs/architecture/bff-architecture.md`.

```bash
./gradlew :backend:test           # JVM unit + integration tests
./gradlew :backend:bootRun        # serve on :8080, proxy /api to orchard.core.base-url (:8081 default)
./gradlew :backend:nativeCompile  # produce backend/build/native/nativeCompile/orchard-ui-backend
```

The UI is embedded via a real Gradle dependency on `:frontend`'s build output (cached) — no hardcoded
paths. Configure the upstream with `ORCHARD_CORE_BASE_URL`. Dev HMR: run with
`--spring.profiles.active=dev` and a running `next dev` (proxied via `orchard.dev.next-url`, default
`http://localhost:3000`).

## Distribution contract

The published artifact is the `orchard-ui-backend` **native binary** (per arch), consumed by orchard's
`dev-server start`. The earlier static-export *tarball* release is retired. Before changing
`frontend/lib/api/apiClient.ts`, the `NEXT_PUBLIC_API_URL` contract, or the shape of `frontend/out/`,
re-read `docs/architecture/bff-architecture.md` and the orchard-side integration.

## Release process

Releases are handled by two GitHub Actions workflows:

1. **Create Release** (`.github/workflows/create-release.yml`) — manual `workflow_dispatch`.
   Takes a semver like `0.2.1`, bumps `gradle.properties` and `frontend/package.json` to match,
   commits, and pushes a `v0.2.1` tag. Run this first.

   ⚠ This workflow is **broken** — the repo's branch protection rules block its direct push to
   `main`. It should be removed or replaced. Do not use it.

2. **Release** (`.github/workflows/release.yml`) — triggered automatically on any `v*` tag push.
   Builds native binaries for `linux-amd64`, `linux-arm64`, and `macos-arm64`, then creates a
   GitHub Release with the binaries + SHA256 checksums. Auto-generates release notes from commits
   since the last tag.

   The workflow validates that the tag version matches both `gradle.properties` and
   `frontend/package.json`. If they don't match, the build fails.

**Do NOT** `gh release create` manually — always push a tag and let the Release workflow handle it.

### Manual release procedure

Since the Create Release workflow can't push past branch protection:

```bash
# 1. Bump versions locally
VERSION=0.2.1
sed -i "s/^version=.*/version=${VERSION}/" gradle.properties
sed -i "0,/\"version\": \"[^\"]*\"/{s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/}" frontend/package.json

# 2. Commit, push, tag
git add gradle.properties frontend/package.json
git commit -m "chore: bump version to ${VERSION}"
git push origin main
git tag -a "v${VERSION}" -m "v${VERSION}"
git push origin "v${VERSION}"

# 3. The Release workflow builds and publishes the native binaries
```
