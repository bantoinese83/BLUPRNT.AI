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
4. **Testing**:
   - Add unit tests for new shared logic.
   - Run `npm run check` to ensure you haven't broken the 100/100 quality score.
5. **PR**: Submit your PR with a clear description and screenshots of any UI changes.

## 🚀 The Quality Gate

Before pushing, you **must** run:

```bash
npm run check
```

If this command fails with even one warning, the PR will not be accepted.

---

**Happy Coding!** — The Monarch Labs Team
