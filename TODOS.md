# TODOs

Deferred work, with enough context that someone picking it up in 3 months knows what to do and why.

## P3 — Automated test for the `[id]/page.tsx` server/client split

**What:** Add a jest + `@testing-library/react` test for `app/(main)/groves/[id]/GroveDetailView.tsx` that verifies the grove detail view renders correctly when wrapped in a server-component shell.

**Why:** During the release-bundle work (spec: `docs/superpowers/specs/2026-06-15-orchard-ui-release-bundle-design.md`), we split `app/(main)/groves/[id]/page.tsx` into a server-component shell + a `'use client'` child component (`GroveDetailView`). The split is structural; the rendered DOM is identical. But the move from a single client file to a server-shell-wrapping-client pattern carries a small hydration-mismatch risk that's currently only caught by manual `npx serve out` verification.

**Pros:**
- Catches future hydration regressions in CI rather than at preview time.
- Sets the testing pattern for `app/(main)/**` — currently no routes in that tree have component tests.

**Cons:**
- Setting up jest + RTL for App Router has known footguns (MUI/Emotion mocks, Next router mocks, SSE polyfill in jsdom).
- One test for one route is awkward — either commit to a broader testing initiative or accept the asymmetry.

**Context:**
- Current state: `app/(main)/groves/[id]/page.tsx` is a server-component shell exporting `generateStaticParams: () => [{ id: '_' }]`. `app/(main)/groves/[id]/GroveDetailView.tsx` is the `'use client'` child holding all behavior.
- Manual verification: `cd out && npx serve` then navigate to `/groves/<id>` — should not throw hydration warnings in the console.
- Where to start: add `jest.config.ts` JSX transform support if not already configured, write a test that mocks `useGroveEvents` and `getGrove`, mounts `GroveDetailView`, and asserts the loading → loaded transition.

**Effort:** M (human) / S (CC)
**Priority:** P3
**Depends on / blocked by:** None.
