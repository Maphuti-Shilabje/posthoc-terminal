# Testing Strategy for Posthoc Terminal

Because this is a high-performance financial visualization application, our testing approach strictly targets state isolation and logic integrity to ensure zero regressions in the UI latency profile.

## The Testing Philosophy

1. **State Independence:** The primary focus is verifying that high-frequency events (mouse movements, map syncing) stay strictly in the Ephemeral Bus, while committed UI state (dataset uploads, selected trades) correctly updates the Global Store.
2. **Logic Over Rendering:** We test the *outcomes* of complex operations (like the DuckDB transformations and Monte Carlo generation logic) rather than the precise pixel output of the Canvas/Lightweight Charts elements. (Canvas elements are notoriously flaky in Node.js/JSDOM environments).
3. **Data Contract Fidelity:** We ensure that Mock generation and input schemas strictly match the `.csv` parsing rules and TypeScript interfaces provided.

## Test Infrastructure
*   **Framework:** Jest (via `next/jest`)
*   **Environment:** `jsdom` (to simulate the browser context for Zustand and React components)
*   **Libraries:** `@testing-library/react` and `@testing-library/jest-dom`

---

## Core Testing Layers

### 1. The Global Store (Zustand)
**File:** `src/store/globalStore.test.ts`
*   Verifies that the Zustand store initializes with the correct defaults (e.g., `showGraveyard` defaults to `true`).
*   Tests `act()` mutations to ensure updates like `setSelectedTradeId` and `setActiveDatasetId` propagate correctly without mutating the previous state object structurally.
*   Validates partial updates to nested structures (like `userSettings`).

### 2. The Ephemeral Event Bus (`mitt`)
**File:** `src/lib/eventBus.test.ts`
*   Verifies the strict separation of events. The `TELEPORT_EVENT` is the lifeblood of the terminal's <16ms interaction pattern.
*   The tests mock the emission and listening hooks to ensure that components subscribing to the bus will receive exactly formatted payloads matching the `TeleportEventPayload` data contract without triggering React state updates.

### 3. Future Testing Targets (Component Integrations)
To extend the test suite, future developers should target the following:
*   **DuckDB Mocking:** Mock the `@duckdb/duckdb-wasm` import to return structured JSON arrays, verifying that `TradeLedger` renders the exact number of virtualized rows based on the fake SQL response.
*   **Web Worker Mocking:** The `MonteCarloLab` offloads thousands of loops to a web worker. Testing this requires mocking the `Worker` constructor in Jest to immediately return a predefined distribution (`maxDrawdowns`) to verify the UI renders the 95th Percentile calculation correctly.

---

## Running the Tests

To run the complete test suite locally:

\`\`\`bash
# Run all tests once
npm run test

# Run tests in watch mode during active development
npx jest --watch
\`\`\`

## Adding New Tests
1. Follow the `[filename].test.ts` naming convention.
2. Place the test file directly adjacent to the file it tests within `src/` to co-locate logic and tests.
3. Import `@testing-library/react` wrappers (like `act`) if mutating Zustand state outside of a component.