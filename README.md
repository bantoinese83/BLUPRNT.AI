# BLUPRNT.AI (v3)

[![CI Status](https://github.com/bantoinese83/BLUPRNT.AI/actions/workflows/ci.yml/badge.svg)](https://github.com/bantoinese83/BLUPRNT.AI/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Coverage](https://img.shields.io/badge/Coverage-critical%20paths%20gated-teal.svg)](CONTRIBUTING.md#coverage-thresholds)
[![Quality](https://img.shields.io/badge/Quality-CI%20%2B%20E2E%20gates-blue.svg)](CONTRIBUTING.md)
[![Security](https://img.shields.io/badge/Security-SECURITY.md-informational.svg)](SECURITY.md)

**The homeowner-first financial OS for renovations.**

BLUPRNT.AI is an intelligent project management platform that turns the "black box" of home renovation into a trackable, transparent financial asset. Built on a modern, strictly-typed monorepo, it serves both Web and Mobile users with a shared intelligence engine.

---

## ✨ Renovation Intelligence

We've moved beyond simple tracking into **Proactive Renovation Partnering**:

- **AI Grounding Engine**: Every estimate is anchored in real-world regional data. We cite our sources directly to build immediate homeowner trust.
- **Reconciliation Engine**: Automated line-item mapping that identifies budget drift (Matched, Under, or Over) the moment a receipt is uploaded.
- **Bulk Document Ingestion**: A sequential background queue that processes dozens of invoices, quotes, and warranties simultaneously via Gemini-powered OCR.
- **Interactive Transformation Slider**: A curated visual timeline showing your project's evolution from the first "Before" photo to the final "After" hero shot.

---

## 🏗 Modular Architecture

This project follows a strict **Anti-Monolith** philosophy. Logic is decoupled from presentation to ensure maximum testability and maintainability.

### The Stack

| Layer            | Technology                                                  |
| :--------------- | :---------------------------------------------------------- |
| **Web**          | React 19, Vite, Tailwind CSS, TanStack Query, Framer Motion |
| **Mobile**       | React Native, Expo, Expo Router, Moti Animations, Haptics   |
| **Backend**      | Supabase (Postgres, Auth, Storage, Realtime)                |
| **Intelligence** | Google Gemini 1.5 Pro + Deno Edge Functions                 |
| **Payments**     | Stripe (Web) + RevenueCat (Mobile)                          |

### System Blueprint

```mermaid
flowchart TB
  subgraph clients[Clients]
    Web["Web App (React 19)"]
    Mobile["Mobile App (Expo)"]
  end

  subgraph shared_pkg["Shared Core"]
    SH["@bluprnt/shared — Types, Zod validation, formatters"]
  end

  subgraph supabase[Supabase Platform]
    Auth[GoTrue Auth]
    DB["Postgres + RLS"]
    Edge[Edge Functions — Gemini AI]
  end

  Web --> SH
  Mobile --> SH
  Web --> Auth
  Web --> DB
  Mobile --> Auth
  Mobile --> DB
  Edge --> Gemini[Google Gemini API]
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (>= 20.x)
- Supabase CLI
- Expo Go

### 2. Installation

```bash
npm install          # Install all workspace dependencies
```

### 3. Local Development

```bash
npm run dev          # Start Web (Vite)
npm run dev:mobile   # Start Expo (Mobile)
```

### 4. Quality gate

We maintain a **zero-warning** ESLint policy on the paths CI checks. Before pushing, run:

```bash
npm run check        # Lint → Knip → Typecheck → Coverage → Build → Edge functions (20)
npm run status       # Faster lint / typecheck / tests per workspace (pre-push sanity)
```

`npm run check` includes **`npm run functions:check`**, which type-checks all **20** Supabase Edge Function entrypoints and runs shared Deno unit tests.

#### What CI and local tooling cover

| Area                   | How it is enforced                                                                                                                                |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Shared validation**  | Zod schemas in `shared/lib/validation.ts` (auth, onboarding, settings, marketing); re-exported for Edge Functions                                 |
| **Web E2E**            | Playwright — `npm run test:e2e` (full), `npm run test:e2e:smoke` (marketing + auth redirect + axe on key routes), `npm run test:e2e:probes`       |
| **Web a11y**           | `@axe-core/playwright` on landing, register, forgot-password, and authenticated dashboard routes                                                  |
| **Mobile E2E**         | Maestro — `npm run test:e2e:mobile` (default: `app-smoke`); full folder with `MAESTRO_CLEAR_STATE=true` on CI                                     |
| **Mobile auth smokes** | `mobile/maestro/auth-forgot-password.yaml`, `auth-signed-out-login.yaml` (no credentials); `auth-login.yaml` needs `USER_EMAIL` / `USER_PASSWORD` |
| **Lighthouse (web)**   | PR workflow [lighthouse.yml](.github/workflows/lighthouse.yml) — mobile preset; local: `npm run lighthouse:ci`                                    |
| **Public share links** | `get-project-view` + `public_share` rate limit (30/min/IP); see [security-share-tokens.md](docs/security-share-tokens.md)                         |
| **Errors**             | Sentry via `reportClientError` on web/mobile error boundaries                                                                                     |
| **Analytics (mobile)** | PostHog gated behind explicit consent (`optOut` by default)                                                                                       |
| **DB**                 | Optional `npm run db:types:check` when `SUPABASE_ACCESS_TOKEN` is set; `npm run db:migrations:check` before releases                              |

See [.github/workflows/ci.yml](.github/workflows/ci.yml) and [.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml). Coverage thresholds apply to **critical subsets** of web/mobile — details in [CONTRIBUTING.md — Coverage thresholds](CONTRIBUTING.md#coverage-thresholds).

#### Local-only checks (optional)

```bash
npm run db:lint
npm run security:audit
npm run lighthouse:mobile          # or npm run lighthouse:ci (with PR budgets)
```

### What “10/10” means here

We treat **10/10** as **defensible excellence**: honest docs, automated gates, and security reporting—not vanity badges. **Phases 1–3 (core)** are in place: shared Zod, auth hardening, lazy onboarding, full edge-function checks, Maestro auth smokes, share-token security docs + `public_share` rate limits, Lighthouse CI on PRs, and mobile session-storage hardening notes. **Deferred:** Storybook/Ladle, i18n scaffold, SecureStore implementation.

---

## 📂 Repository Guide

| Path        | Description                                                                                                  |
| :---------- | :----------------------------------------------------------------------------------------------------------- |
| `web/`      | React 19 SPA, performance- and accessibility-oriented UX.                                                    |
| `mobile/`   | Expo Native app. Features modular components and native gestures.                                            |
| `shared/`   | Types, Zod validation (`shared/lib/validation.ts`), formatters, and billing helpers.                         |
| `supabase/` | Database migrations and the Deno Edge Function suite.                                                        |
| `docs/`     | Architecture, security, Lighthouse, launch handbook — see [Documentation Links](#-documentation-links) below |

---

## 📄 Documentation Links

- [**Engineering Architecture**](docs/ARCHITECTURE.md) — Patterns, performance, and structure.
- [**Contributing Guidelines**](CONTRIBUTING.md) — Quality gate, coverage thresholds, workflow.
- [**Security**](SECURITY.md) — How to report vulnerabilities responsibly.
- [**Production Launch Handbook**](docs/production_launch_handbook.md) — Deployment and ops.
- [**Gemini AI Integration**](docs/gemini-api.md) — How the intelligence layer works.
- [**Web Lighthouse (local)**](docs/web-lighthouse.md) — Performance and a11y lab runs against the production build.
- [**Share token security**](docs/security-share-tokens.md) — Public project links, rate limits, threat model.
- [**Session storage (mobile)**](docs/session-storage-hardening.md) — SecureStore and auth hardening research.

---

**BLUPRNT.AI is a project by Monarch Labs Inc. All rights reserved.**
