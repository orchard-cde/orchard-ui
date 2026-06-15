# orchard-ui

The Next.js web UI for [Orchard](https://github.com/orchard-cde/orchard), a Cloud Development Environment. Brand name: **Canopy**.

## Getting started

Requires Node.js (latest LTS) and a running orchard API on `http://localhost:8080`. See the orchard repo for instructions on starting the API (`trowel dev-server start` after building).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The dev server runs against the API specified by `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`); copy `.env.local.example` to `.env.local` to override.

## Building the release bundle

```bash
npm run build:bundle
```

Produces a fully static `out/` directory (Next.js `output: 'export'`). This is what gets packaged into a release tarball and consumed by orchard's trellis as a baked-in classpath resource. The bundle has no Node.js runtime requirements — it's pure HTML/CSS/JS.

Verify locally with:

```bash
cd out && npx serve
```

Hard-refresh on dynamic routes like `/groves/<id>` will 404 from `serve` — that's expected. The orchard-side SPA fallback (deferred to a separate implementation) catches those at runtime and serves root `/index.html`.

## Releasing

Tag the commit on `main` you want to release as `v{X.Y.Z}` (matching `package.json`'s `version` field exactly — no `v` prefix on the package.json value, no pre-release suffixes for now):

```bash
git tag v0.1.0
git push --tags
```

GitHub Actions builds the static bundle (with `NEXT_PUBLIC_API_URL=''` so API calls are relative) and publishes:

- `https://github.com/orchard-cde/orchard-ui/releases/download/v{VERSION}/orchard-ui-bundle-{VERSION}.tar.gz`
- `https://github.com/orchard-cde/orchard-ui/releases/download/v{VERSION}/checksums-sha256.txt`

The tarball root contains the static export directly (no `out/` wrapper). The orchard repo pins exact versions via `orchardUiBundleVersion=X.Y.Z` and downloads at native-image build time.

### Troubleshooting releases

| Symptom | Cause | Fix |
|---|---|---|
| Workflow doesn't trigger on tag push | Tag missing the `v` prefix (e.g., pushed `0.1.0`) | Re-tag as `v0.1.0` and push |
| `Verify package.json version matches tag` step fails | `package.json#version` ≠ tag | Bump `package.json`, delete the tag locally and remote, re-tag, push: `git tag -d v{X} && git push --delete origin v{X} && {edit package.json} && git commit && git tag v{X} && git push --tags` |
| `npm ci` fails | Transient npm registry issue | Re-run the job. If reproducible, verify `package-lock.json` is committed and in sync |
| `npm audit` fails | New high/critical CVE in a transitive dep | Run `npm audit fix` locally, commit, re-tag |
| `npm run build:bundle` fails | TypeScript error or new dynamic route missing `generateStaticParams` | Reproduce locally (`npm run build:bundle`), fix, re-tag |
| `test -f out/index.html` fails | Static export emitted nothing at root — likely a Next config regression | Investigate locally; do not retag until reproducible-and-fixed |
| `softprops/action-gh-release` fails on asset upload | Usually transient GH API issue | Re-run the job; the action updates existing releases idempotently |

### Bad release recovery

If a release publishes successfully but the bundle is broken (wrong API URL baked in, missing assets, JS errors), **publish a patch release** (e.g., `v0.1.1`). Do **NOT** delete the broken GitHub Release — orchard pins exact versions, so an orphaned pin would 404 forever for any consumer that already pulled `v0.1.0`. Forward-fix is the only safe path once a release has any consumers.

## Tests

```bash
npm test
```

Jest + `@testing-library/react`. The test suite is currently small; see `TODOS.md` for known testing gaps.

## Architecture notes

This UI builds as a **Next.js static export** so its release artifact can be baked into the orchard native binary. That means a permanent set of constraints — see `AGENTS.md` for the full list before adding new features.

## License

Orchard UI is licensed under the [Apache License, Version 2.0](LICENSE). See the [NOTICE](NOTICE) file for attribution.
