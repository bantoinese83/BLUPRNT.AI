# Contributing to BLUPRNT.AI

First off, thank you for considering contributing to the most intelligent home renovation platform on the market. We hold ourselves to an extremely high engineering standard to ensure the platform remains stable, performant, and premium for our users.

## 🤝 Code of Conduct

We follow a "Better than you found it" policy. Every PR should not only solve the task at hand but also improve the surrounding code's health (e.g., adding types, improving comments, or refactoring small code smells).

## 📐 Development Standards

### 1. The "God File" Rule

Never add to a file that is already oversized. If a component logic exceeds 250 lines, start thinking about extraction. If it exceeds 500 lines, refactoring is **mandatory**.

### 2. Styling Principles

- **Web**: Use Vanilla CSS or Tailwind CSS where appropriate, but prefer centralized design tokens from `@bluprnt/shared`.
- **Mobile**: Use `NativeWind` for layout but prioritize **Moti** for animations. Every interaction should feel fluid and intentional.

### 3. Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code changes that neither fix a bug nor add a feature
- `docs:` for documentation changes

## 🛠 Workflow

1. **Setup**: Run `npm install` and ensure your `.env` is configured correctly.
2. **Branching**: Create a branch with a descriptive name (e.g., `refactor/dashboard-header`).
3. **Coding**: Adhere to the `ARCHITECTURE.md` patterns.
4. **Fast feedback**: Run `npm run status` for a quick lint / test / typecheck pass per workspace (`shared`, `web`, `mobile`) before the full `npm run check`. Run `npm run lint:fix` to apply ESLint auto-fixes repo-wide, then `npm run lint` when you need the full lint + typecheck + design-token gate.
5. **Testing**:
   - Add unit tests for new shared logic.
   - Run `npm run check` so you pass the same gates as CI (lint, knip, coverage thresholds, builds). See [Coverage thresholds](#coverage-thresholds) below.
   - Web E2E: `npm run test:e2e` (full suite), `npm run test:e2e:smoke` (marketing + a11y + probes), `npm run test:e2e:probes` (dev routes only). Regenerate DB types when schema changes: `npm run db:types` (requires `SUPABASE_ACCESS_TOKEN`); verify drift: `npm run db:types:check`.
6. **PR**: Submit your PR with a clear description and screenshots of any UI changes.

## Coverage thresholds

Coverage is **gated on curated critical paths**, not every file in the repo (see `web/vitest.config.ts`, `mobile/vitest.config.ts`, and workspace `test:coverage` scripts). Approximate Vitest gates:

| Workspace                  | Lines | Branches | Functions | Statements |
| :------------------------- | ----: | -------: | --------: | ---------: |
| **Web** (included paths)   | ≥ 80% |    ≥ 72% |     ≥ 78% |      ≥ 80% |
| **Mobile** (included libs) | ≥ 80% |    ≥ 65% |     ≥ 80% |      ≥ 80% |

Raising thresholds should be paired with tests or justified exclusions—avoid “green by narrowing `include`.”

**`@bluprnt/shared`:** `vitest run --coverage` reports coverage for **modules reached by tests** (no custom `include`/`thresholds` in `shared/` yet). Keep new shared logic covered by unit tests; tightening shared thresholds should mirror `web/vitest.config.ts` style `include` lists when you are ready.

## 🚀 The Quality Gate

Before pushing, you **must** run:

```bash
npm run check
```

If this command fails with even one warning, the PR will not be accepted.

---

**Happy Coding!** — The Monarch Labs Team
