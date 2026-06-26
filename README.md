# orchard-ui

[![GitLab mirror](https://img.shields.io/badge/mirror-gitlab.com%2Forchard--cde-FC6D26?logo=gitlab)](https://gitlab.com/orchard-cde/orchard-ui)

The web UI for [Orchard](https://github.com/orchard-cde/orchard), a Cloud Development Environment. Brand name: **Canopy**.

This repo is a **Gradle multi-project** with two modules:

| Module | Path | What it is |
|--------|------|-----------|
| `:frontend` | `frontend/` | The Next.js static-export SPA (Canopy). Pure HTML/CSS/JS, no Node runtime at serve time. |
| `:backend` | `backend/` | A Spring Boot service that serves the frontend and reverse-proxies `/api/**` (incl. SSE) to orchard core. Ships as a GraalVM native binary (`orchard-ui-backend`). |

A single `./gradlew` at the repo root drives both. The backend embeds the frontend's static export at build time, so the published artifact is one self-contained native binary.

## Getting started

**Frontend-only (fast UI iteration):** run the SPA against a local orchard API on `http://localhost:8080`.

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

Override the API origin by copying `frontend/.env.local.example` to `frontend/.env.local` (sets `NEXT_PUBLIC_API_URL`).

**Full stack (UI served + proxied by the backend):** run the backend, which builds the frontend, serves it, and proxies the API to orchard core.

```bash
./gradlew :backend:bootRun        # serves on :8080, proxies /api/** to orchard.core.base-url
```

Point it at core with `ORCHARD_CORE_BASE_URL` (default `http://localhost:8081`). For hot-reload, run the backend with the `dev` profile and a running `next dev`:

```bash
./gradlew :backend:bootRun --args='--spring.profiles.active=dev'   # proxies non-/api to next dev (:3000)
```

## Building

```bash
./gradlew build                   # builds + tests both modules (frontend: next build + jest; backend: tests + jar)
./gradlew :backend:nativeCompile  # produces the native binary: backend/build/native/nativeCompile/orchard-ui-backend
```

The frontend build is cached — `next build` only re-runs when frontend sources change. The native build requires a GraalVM JDK 25 (e.g. `25.0.2-graalce`).

## Releasing

Tag the commit on `main` as `v{X.Y.Z}` (matching the `version` in root `gradle.properties` exactly — no `v` prefix on the value, no pre-release suffixes):

```bash
git tag v0.1.0
git push --tags
```

GitHub Actions builds the `:backend` native binary on each target architecture and publishes them as Release assets:

- `orchard-ui-backend-{VERSION}-linux-amd64`
- `orchard-ui-backend-{VERSION}-linux-arm64`
- per-asset SHA-256 checksums

The binary is self-contained (the UI is embedded) and is what orchard's `dev-server start` downloads and runs. **The static-export tarball is no longer published** — the binary is the release artifact.

### Bad release recovery

If a release publishes but the binary is broken, **publish a patch release** (e.g. `v0.1.1`). Do **not** delete a published GitHub Release — consumers may pin exact versions, and an orphaned pin would 404 forever. Forward-fix is the only safe path once a release has consumers.

## Tests

```bash
./gradlew build            # runs both suites
./gradlew :frontend:check  # jest only
./gradlew :backend:test    # backend only
```

Frontend: Jest + `@testing-library/react`. Backend: JUnit 5. See `TODOS.md` for known testing gaps.

## Architecture notes

The frontend builds as a **Next.js static export** so it can be embedded into the backend's native binary. That imposes a permanent set of constraints (no server actions, route handlers, middleware, etc.) — see `AGENTS.md` for the full list before adding features, and `docs/architecture/` for the backend/serving design.

## License

Orchard UI is licensed under the [Apache License, Version 2.0](LICENSE). See the [NOTICE](NOTICE) file for attribution.
