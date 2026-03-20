# Canopy UI Design Spec

**Date:** 2026-03-19
**Project:** orchard-ui — React/TypeScript replacement for the Vaadin Canopy module

---

## Overview

Canopy is the web UI for the Orchard CDE platform — a competitor to Gitpod that provisions VMs with devcontainers for developers. This document specifies the design for building Canopy as a React/TypeScript application, replacing the existing Vaadin-based implementation.

---

## Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | Next.js 15 (App Router) | Used as a pure client-side SPA — all page files are `'use client'` except `app/page.tsx` (server redirect) |
| Language | TypeScript | |
| Component library | MUI (Material UI) | May migrate to a custom design system later |
| HTTP | Axios | Single `apiClient` instance, all REST calls |
| Real-time | Native `EventSource` | Server-Sent Events from Spring Boot API |
| State management | `useState` / `useEffect` | Per-page local state; no global store |
| Testing | Jest + React Testing Library | Configured but no tests written initially |
| Routing | Next.js App Router | File-based routing; React Router v7 not used |

---

## Project Structure

```
orchard-ui/
├── app/
│   ├── layout.tsx              # Root layout — MUI ThemeProvider, nav shell ('use client')
│   ├── page.tsx                # Redirect → /groves (server component, uses redirect())
│   ├── (main)/                 # Route group — shares root layout, calls /api/me
│   │   ├── groves/
│   │   │   ├── page.tsx        # GrovesView — grove list
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # PlantGroveView — create grove form
│   │   │   └── [id]/
│   │   │       └── page.tsx    # GroveDetailView — status, SSH, actions
│   │   └── nursery/
│   │       └── page.tsx        # NurseryView — VM provider info
│   └── unauthorized/
│       ├── layout.tsx          # Minimal layout — no AppBar, no /api/me call
│       └── page.tsx            # Unauthorized page
├── components/
│   ├── layout/                 # AppBar, nav sidebar
│   ├── groves/                 # Grove-specific components
│   └── common/                 # Shared components
├── lib/
│   ├── api/                    # Axios instance + typed API functions
│   └── events/                 # EventSource hook for SSE
└── types/
    └── orchard.ts              # TypeScript types mirroring API DTOs
```

---

## Pages & Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | Redirect | Redirects to `/groves`. `app/page.tsx` is a server component and uses Next.js `redirect()` server-side. The app is deployed as a standard Next.js server (`next start`), not a static export — server components are available. |
| `/groves` | Groves list | Grid of grove cards; "Plant Grove" button. Shows `LoadingSpinner` while `listGroves()` is pending; shows `ErrorAlert` on failure. Shows an empty-state message ("No groves yet — plant your first grove") with a "Plant Grove" button when the list is empty. |
| `/groves/new` | Plant Grove form | Name, repo URL, branch inputs; submit button disabled while POST is in flight; on success redirect to `/groves/{id}`. |
| `/groves/[id]` | Grove detail | Shows `LoadingSpinner` while `getGrove()` is pending. Once loaded: state stepper, seedling resources (CPU/mem/disk), SSH config (hidden with a "not ready" message until seedling has an IP), start/stop actions, live SSE updates. |
| `/nursery` | Nursery | Placeholder page with a "coming soon" card and brief description of nursery (VM provider management). Renders static content until the nursery API endpoint exists. |
| `/unauthorized` | Unauthorized | Bare-bones placeholder shown on 401 responses. Displays a message that the user is not authenticated and provides a note about setting the cultivator ID in dev mode. Uses its own minimal layout (no AppBar, no `/api/me` call) — it is outside the `(main)` route group. |

All `(main)` routes use a shared root layout (`'use client'`) with an AppBar (showing current cultivator display name, sourced from `GET /api/me`) and left nav (Groves, Nursery links). If `/api/me` fails, the AppBar shows a fallback label ("Cultivator") — the layout does NOT redirect to `/unauthorized` on failure. Only the Axios response interceptor triggers the `/unauthorized` redirect, and `/unauthorized` is outside the main route group so it never triggers `/api/me`.

`app/layout.tsx` is a client component (`'use client'`) because it wraps MUI `ThemeProvider`. `app/page.tsx` is the only server component, used solely for the `redirect()` call.

### Plant Grove Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Grove display name |
| Repository URL | Yes | Full git repo URL |
| Branch | No | Defaults to empty string (API uses repo default branch if omitted) |

---

## API Layer (`lib/api/`)

**Environment variables** — configured in `.env.local` (a `.env.local.example` is committed to the repo):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Base URL for the Spring Boot API |
| `NEXT_PUBLIC_CULTIVATOR_ID` | — | Dev mode cultivator UUID (fallback if not in localStorage) |

**`apiClient.ts`**
- Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL` env var
- `X-Cultivator-Id` header injected from `localStorage` key `orchard_cultivator_id`, falling back to `NEXT_PUBLIC_CULTIVATOR_ID` env var, for dev mode auth
- Response interceptor normalizes errors to `{ message: string }`
- 401 responses redirect to `/unauthorized`

**`groves.ts`** — typed functions wrapping the Spring Boot grove endpoints:
- `listGroves()` → `GET /api/groves` — returns `GroveResponse[]`
- `getGrove(id)` → `GET /api/groves/{id}` — returns `GroveResponse`
- `plantGrove(req)` → `POST /api/groves` — returns `GroveResponse` (201); the `id` field is used to redirect to `/groves/{id}`
- `clearGrove(id)` → `DELETE /api/groves/{id}`
- `getSshConfig(id)` → `GET /api/groves/{id}/ssh-config`
- `stopGrove(id)` → `POST /api/groves/{id}/actions/stop`
- `startGrove(id)` → `POST /api/groves/{id}/actions/start`

**`cultivator.ts`**
- `getCurrentCultivator()` → `GET /api/me` — called on root layout mount to display the cultivator's name in the AppBar

---

## SSE Layer (`lib/events/`)

**`useGroveEvents(groveId)`** — custom hook:
- Opens `EventSource` to `GET /api/groves/{id}/events?cultivatorId={id}` — the cultivator ID is passed as a query parameter because the native `EventSource` API does not support custom headers
- Listens for `grove-state-changed` events with payload shape:
  ```json
  {
    "groveId": "uuid",
    "groveName": "string",
    "previousState": "GROWING",
    "newState": "FLOURISHING",
    "changedAt": "ISO-8601 timestamp"
  }
  ```
- Returns:
  ```ts
  {
    event: { newState: GroveState; previousState: GroveState; changedAt: string } | null;
    error: string | null;   // set after 3 failed reconnect attempts
    connecting: boolean;    // true while establishing or reconnecting
  }
  ```
  `groveId` and `groveName` from the SSE payload are intentionally omitted from the return value — the detail page already knows the grove ID and name from its initial `getGrove()` fetch.
- Exponential backoff reconnect on error (3 retries, then sets `error` and stops retrying)
- Cleans up `EventSource` on unmount

**Wiring to `GroveStateStepper`:** The Grove detail page initializes `currentState` from the fetched `GroveResponse.state`. When `useGroveEvents` returns a new `event`, a `useEffect` in the detail page calls `setCurrentState(event.newState)`. This updated `currentState` is passed as a prop to `GroveStateStepper`. The `connecting` value from `useGroveEvents` is used to show a small "Connecting…" status label near the stepper while the SSE connection is being established or reconnecting.

---

## Types (`types/orchard.ts`)

Key types mirroring the Spring Boot DTOs:

```ts
type GroveState = 'PREPARING' | 'PLANTING' | 'GROWING' | 'FLOURISHING' | 'BLIGHTED';

interface SeedlingInfo {
  id: string;
  state: string;
  ipAddress: string | null;
  sshPort: number;
  cpuCores: number;
  memoryMb: number;
  diskGb: number;
}

interface FruitInfo {
  id: string;
  state: string;
  containerId: string | null;
  containerName: string | null;
  serviceName: string | null;
}

interface GroveResponse {
  id: string;
  name: string;
  repositoryUrl: string;
  branch: string;
  commitSha: string | null;
  state: GroveState;
  sshConnectionString: string | null;
  seedling: SeedlingInfo | null;
  fruits: FruitInfo[];
  plantedAt: string;
  lastAccessedAt: string | null;
}

interface CultivatorResponse {
  id: string;
  name: string;
  email: string;
}
```

`FruitInfo[]`, `commitSha`, and `sshConnectionString` are present in the types to mirror the backend API DTOs but are not rendered in any component in this phase.

---

## Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| `GroveCard` | `components/groves/` | MUI Card — name, `StatusChip`, repo/branch, `lastAccessedAt` (from `GroveResponse.lastAccessedAt: string \| null`), delete action. Delete shows a confirmation dialog before calling `clearGrove()`; on success the groves list re-fetches (no optimistic removal). |
| `StatusChip` | `components/groves/` | MUI Chip color-coded by `GroveState` enum (defined in `types/orchard.ts`): `PREPARING`/`PLANTING`/`GROWING` → blue, `FLOURISHING` → green, `BLIGHTED` → red |
| `GroveStateStepper` | `components/groves/` | MUI Stepper mapping `GroveState` to step index: `PREPARING`=0, `PLANTING`=1, `GROWING`=2, `FLOURISHING`=3. When state is `BLIGHTED`, the stepper shows step 2 (GROWING) with an error color overlay and an error message banner above it — step 2 is used as a fixed fallback since `previousState` is not available in `GroveResponse` on cold load. Receives `currentState: GroveState` as a prop — the detail page updates this prop when a `grove-state-changed` SSE event arrives with `newState`. |
| `SshConfigBlock` | `components/groves/` | SSH config text block (formatted for `~/.ssh/config`, suitable for VS Code Remote-SSH) with copy-to-clipboard button. `getSshConfig(id)` returns the full formatted config block. The detail page shows a "Not ready yet" placeholder until `GroveResponse.seedling?.ipAddress` is non-null; once non-null (detected on initial load or via SSE state change), `getSshConfig(id)` is called once. On `getSshConfig` failure, an `ErrorAlert` is shown in place of the block. `GroveResponse.sshConnectionString` is present in the type to mirror the API DTO but is not rendered in this phase. |
| `ErrorAlert` | `components/common/` | MUI Alert for inline error display |
| `LoadingSpinner` | `components/common/` | Shared loading indicator |

---

## Grove Detail — Action Visibility

Start/stop buttons on the Grove detail page are shown and enabled based on `GroveState`. Delete is always available regardless of state (with a confirmation dialog).

| State | Stop button | Start button | Delete |
|-------|-------------|--------------|--------|
| `PREPARING` / `PLANTING` / `GROWING` | Hidden | Hidden | Enabled (with dialog) |
| `FLOURISHING` | Enabled | Hidden | Enabled (with dialog) |
| `BLIGHTED` | Hidden | Hidden | Enabled (with dialog) |

**Recovery from BLIGHTED:** Delete and recreate is the intended recovery path. No resume-from-blight is planned in this phase.

**Note:** Stop and start are server-side TODOs — the endpoints exist but return the grove unchanged. The buttons call the API and re-fetch grove state on completion; since there is no distinct stopped/dormant state in the backend yet, no new state needs to be handled. This section will be revisited when the backend implements suspend/resume.

Both buttons are disabled while their action call is in flight.

---

## Error Handling

- Axios errors caught at the call site per page; rendered via `ErrorAlert`
- `apiClient` response interceptor normalizes all errors to `{ message: string }`
- 401 responses redirect to `/unauthorized` (placeholder for future auth)
- SSE connection failures: exponential backoff (3 retries), then error state surfaced to UI

---

## Auth

Currently dev-mode only: `X-Cultivator-Id` header sent with all Axios requests, sourced from `localStorage` key `orchard_cultivator_id` or `NEXT_PUBLIC_CULTIVATOR_ID` env var. If both are absent, the header is omitted and the API will return 401, which the interceptor handles by redirecting to `/unauthorized`. The Axios instance is the single place this will be swapped for JWT Bearer tokens when authentication is implemented.

**SSE exception:** The native `EventSource` API cannot send custom headers. The cultivator ID is passed as a `?cultivatorId=` query parameter for SSE connections instead. This is a known dev-mode trade-off — the ID appears in server logs and browser history. When real auth is added, the SSE endpoint will need a separate solution (e.g., a short-lived token endpoint, cookies, or a connection-upgrade pattern).

### `.env.local.example`

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CULTIVATOR_ID=
```

---

## Testing

Jest and React Testing Library are configured as part of the initial project setup. No tests are written in this phase — test coverage will be added once the UI stabilizes.
