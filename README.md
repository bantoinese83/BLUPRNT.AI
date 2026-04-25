# BLUPRNT.AI (v3)

[![CI Status](https://github.com/bantoinese83/BLUPRNT.AI/actions/workflows/ci.yml/badge.svg)](https://github.com/bantoinese83/BLUPRNT.AI/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](docs/ARCHITECTURE.md)
[![Quality Score](https://img.shields.io/badge/Quality-100%2F100-gold.svg)](CONTRIBUTING.md)

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
    SH["@bluprnt/shared — Types, Formatters, Validation"]
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

### 4. The Quality Gate

We maintain a zero-warning policy. Before pushing, your code must pass:

```bash
npm run check        # Lint → Knip → Typecheck → Coverage → Build
```

---

## 📂 Repository Guide

| Path        | Description                                                         |
| :---------- | :------------------------------------------------------------------ |
| `web/`      | React 19 SPA. Optimized for 100/100 Lighthouse performance.         |
| `mobile/`   | Expo Native app. Features modular components and native gestures.   |
| `shared/`   | The source of truth for types, database schemas, and billing logic. |
| `supabase/` | Database migrations and the Deno Edge Function suite.               |
| `docs/`     | [**Architecture Deep-Dive**](docs/ARCHITECTURE.md)                  |

---

## 📄 Documentation Links

- [**Engineering Architecture**](docs/ARCHITECTURE.md) — Patterns, Performance, & Patterns.
- [**Contributing Guidelines**](CONTRIBUTING.md) — Setting the bar for code quality.
- [**Production Launch Handbook**](docs/production_launch_handbook.md) — Deployment and Ops.
- [**Gemini AI Integration**](docs/gemini-api.md) — How the intelligence layer works.

---

**BLUPRNT.AI is a project by Monarch Labs Inc. All rights reserved.**
