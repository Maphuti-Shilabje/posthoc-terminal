# Contributing to Posthoc Terminal

Thank you for your interest in improving Posthoc Terminal. To maintain the project's integrity as an institutional-grade tool, we ask that you follow these guidelines.

## 🏗 Architectural Principles
1.  **State Segregation:** Never put high-frequency data (mouse coordinates, scroll positions) into the Zustand store. Use the `mitt` event bus in `src/engine/events.ts`.
2.  **Dependency Discipline:** We aim to keep the bundle size small. Propose new dependencies via an Issue before opening a PR.
3.  **Local-First Privacy:** Never introduce features that require external API calls or data exfiltration.

## 🛠 Development Workflow
1.  **Fork & Branch:** Create a feature branch (`feat/new-metric`) or bugfix branch (`fix/chart-flicker`).
2.  **Strict Linting:** Ensure `npm run lint` passes. We do not accept `eslint-disable` comments without a documented architectural reason.
3.  **Profiling:** If you are adding a new chart or table, provide a screenshot of the Chrome Performance DevTools showing a stable 60fps during interaction.

## 📝 Pull Request Checklist
- [ ] TypeScript types are strictly defined (no `any`).
- [ ] Components are memoized where appropriate.
- [ ] Documentation for new data contracts is updated.
- [ ] Logic is covered by unit tests (especially math/statistical functions).

## 💬 Communication
For major architectural changes, please open an **Issue** first to discuss the design pattern. We value precision and performance over speed of feature delivery.
