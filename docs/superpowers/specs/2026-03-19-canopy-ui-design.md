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
| Framework | Next.js 15 (App Router) | Used as a pure client-side SPA — all pages are `'use client'` |
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
│   ├── layout.tsx              # Root layout — MUI ThemeProvider, nav shell
│   ├── page.tsx                # Redirect → /groves
│   ├── groves/
│   │   ├── page.tsx            # GrovesView — grove list
│   │   ├── new/
│   │   │   └── page.tsx        # PlantGroveView — create grove form
│   │   └── [id]/
│   │       └── page.tsx        # GroveDetailView — status, SSH, actions
│   └── nursery/
│       └── page.tsx            # NurseryView — VM provider info
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
| `/` | Redirect | Redirects to `/groves` |
| `/groves` | Groves list | Grid of grove cards; "Plant Grove" button |
| `/groves/new` | Plant Grove form | Name, repo URL, branch inputs; POST → redirect to detail |
| `/groves/[id]` | Grove detail | State stepper, seedling resources, SSH config, start/stop actions, live SSE updates |
| `/nursery` | Nursery | VM provider info; placeholder until nursery API endpoint exists |

All pages use a shared root layout with an AppBar and left nav (Groves, Nursery links).

---

## API Layer (`lib/api/`)

**`apiClient.ts`**
- Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL` env var
- `X-Cultivator-Id` header injected from `localStorage` or env var for dev mode auth
- Response interceptor normalizes errors to `{ message: string }`
- 401 responses redirect to `/unauthorized`

**`groves.ts`** — typed functions wrapping the Spring Boot grove endpoints:
- `listGroves()` → `GET /api/groves`
- `getGrove(id)` → `GET /api/groves/{id}`
- `plantGrove(req)` → `POST /api/groves`
- `clearGrove(id)` → `DELETE /api/groves/{id}`
- `getSshConfig(id)` → `GET /api/groves/{id}/ssh-config`
- `stopGrove(id)` → `POST /api/groves/{id}/actions/stop`
- `startGrove(id)` → `POST /api/groves/{id}/actions/start`

**`cultivator.ts`**
- `getCurrentCultivator()` → `GET /api/me`

---

## SSE Layer (`lib/events/`)

**`useGroveEvents(groveId)`** — custom hook:
- Opens `EventSource` to `GET /api/groves/{id}/events`
- Listens for `grove-state-changed` events
- Returns latest event payload
- Exponential backoff reconnect on error (3 retries, then surfaces error state)
- Cleans up `EventSource` on unmount

---

## Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| `GroveCard` | `components/groves/` | MUI Card — name, `StatusChip`, repo/branch, last accessed, delete action |
| `StatusChip` | `components/groves/` | MUI Chip color-coded by `GroveState` (`PREPARING`, `PLANTING`, `GROWING`, `FLOURISHING`, `BLIGHTED`) |
| `GroveStateStepper` | `components/groves/` | MUI Stepper showing provisioning pipeline; updated via SSE |
| `SshConfigBlock` | `components/groves/` | SSH config text block with copy-to-clipboard button |
| `ErrorAlert` | `components/common/` | MUI Alert for inline error display |
| `LoadingSpinner` | `components/common/` | Shared loading indicator |

---

## Error Handling

- Axios errors caught at the call site per page; rendered via `ErrorAlert`
- `apiClient` response interceptor normalizes all errors to `{ message: string }`
- 401 responses redirect to `/unauthorized` (placeholder for future auth)
- SSE connection failures: exponential backoff (3 retries), then error state surfaced to UI

---

## Auth

Currently dev-mode only: `X-Cultivator-Id` header sent with all requests, sourced from `localStorage` or an env var. The Axios instance is the single place this will be swapped for JWT Bearer tokens when authentication is implemented.

---

## Testing

Jest and React Testing Library are configured as part of the initial project setup. No tests are written in this phase — test coverage will be added once the UI stabilizes.
