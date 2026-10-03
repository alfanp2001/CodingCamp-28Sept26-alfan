# Implementation Plan: Expense Tracker

## Overview

Implement a single-page, client-side Expense Tracker using HTML, Tailwind CSS (CDN), and Vanilla JavaScript. The app ships as three static files (`index.html`, `styles.css`, `app.js`) with all data persisted to `localStorage`. Implementation proceeds layer by layer — markup skeleton → styles → core state/storage → feature modules → wiring and initialization.

---

## Tasks

- [ ] 1. Build the HTML skeleton in `index.html`
  - [ ] 1.1 Write the full `index.html` markup skeleton
    - Add `<head>` with Tailwind CDN `<script>` tag and `<link rel="stylesheet" href="styles.css">`
    - Add `<header>` with app title and month navigation controls (`<button id="prev-month">`, `<h2 id="month-heading">`, `<button id="next-month">`)
    - Add `<main>` with a two-column responsive grid (`grid grid-cols-1 lg:grid-cols-2 gap-6`)
    - Left column: `<form id="transaction-form">` with fields for amount, category (`<select>`), and description (`<textarea>`); each field wrapped in a `<label>` with matching `for`/`id` pairs; a submit `<button>` (no date field — `creationMonth` is assigned automatically)
    - Right column: `<div id="transaction-list">`, `<div id="summary-panel">`, `<div id="chart-area">` containing `<canvas id="expense-chart">` with a descriptive `<p>` child for accessibility
    - Add `<footer>` and `<script src="app.js">` at bottom of `<body>`
    - Use semantic elements: `<header>`, `<main>`, `<form>`, `<footer>`
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 4.6, 8.2, 8.4_

- [ ] 2. Write custom CSS in `styles.css`
  - [ ] 2.1 Add canvas sizing, focus ring overrides, and animation styles
    - Set `#expense-chart { width: 100%; max-width: 300px; display: block; }` for responsive canvas
    - Add custom focus ring override for inputs/buttons/selects/textareas that aligns with Tailwind's `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
    - Add a subtle fade-in animation class (e.g., `.fade-in`) for transaction list items
    - Add styles for the storage warning banner (fixed/sticky top bar, non-blocking)
    - _Requirements: 8.1, 8.5_

- [ ] 3. Implement constants, state, and storage module in `app.js`
  - [ ] 3.1 Define constants and central state object
    - Declare `STORAGE_KEY`, `CATEGORIES` array, and `CATEGORY_COLORS` object as per design
    - Declare the `state` object: `{ transactions: [], activeMonth: "" }`
    - _Requirements: 1.9, 7.1_
  - [ ] 3.2 Implement `loadTransactions()` and `saveTransactions()`
    - `loadTransactions`: read `localStorage.getItem(STORAGE_KEY)`, parse JSON, validate it is an array; on error call `showStorageWarning()` and return `[]`
    - `saveTransactions`: `localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))`
    - Implement `showStorageWarning()`: insert a non-blocking `<div>` banner at the top of `<body>`
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 3.3 Write unit tests for `loadTransactions` and `saveTransactions`
    - Test happy path: valid JSON array roundtrips correctly
    - Test malformed JSON: returns `[]` and calls `showStorageWarning`
    - Test missing key: returns `[]`
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 4. Implement ID generation utility
  - [ ] 4.1 Implement `generateId()`
    - Use `crypto.randomUUID()` when available
    - Fallback: `Math.random().toString(36).slice(2) + Date.now().toString(36)`
    - _Requirements: 1.4_

- [ ] 5. Implement the Transaction Form module
  - [ ] 5.1 Implement `validateForm(formData)`
    - Return an `errors` object; check amount is present, numeric, positive, and matches `/^\d+(\.\d{1,2})?$/`
    - Check category is present and in `CATEGORIES`
    - Return empty object when all fields are valid
    - _Requirements: 1.6, 1.7, 1.8_
  - [ ]* 5.2 Write property test for `validateForm` — Property 2: Invalid Input Rejection
    - **Property 2: Invalid Input Rejection**
    - Generate arbitrary form submissions with at least one invalid field; assert `validateForm` always returns a non-empty errors object
    - Generate arbitrary valid form submissions; assert `validateForm` always returns `{}`
    - **Validates: Requirements 1.6, 1.8**
  - [ ] 5.3 Implement `addTransaction(formData)` and form submit handler
    - On submit: call `validateForm`; if errors exist, render inline `<p class="text-red-500 text-sm mt-1">` messages per field and return
    - If valid: build a `Transaction` object using `generateId()` and `getCurrentYearMonth()` for `creationMonth`, reset the form, push to `state.transactions`, call `saveTransactions`, re-render list + summary + chart
    - _Requirements: 1.4, 1.5, 1.10_
  - [ ]* 5.4 Write property test for `addTransaction` — Property 1: Valid Submission Round-Trip
    - **Property 1: Valid Submission Round-Trip**
    - For any valid transaction input, assert the transaction appears in `state.transactions` and `localStorage` after `addTransaction`, and form fields are reset
    - **Validates: Requirements 1.4, 1.5, 1.10**

- [ ] 6. Implement monthly navigation
  - [ ] 6.1 Implement `prevMonth(yyyyMM)` and `nextMonth(yyyyMM)`
    - `prevMonth`: decrement month; wrap January → December of prior year
    - `nextMonth`: increment month; wrap December → January of next year
    - _Requirements: 2.4, 2.5_
  - [ ]* 6.2 Write property test for month navigation — Property 4: Month Navigation Correctness
    - **Property 4: Month Navigation Correctness**
    - For any valid `YYYY-MM` string, assert `nextMonth(prevMonth(m)) === m` and `prevMonth(nextMonth(m)) === m`
    - Assert January wrap: `prevMonth("2025-01") === "2024-12"`
    - Assert December wrap: `nextMonth("2025-12") === "2026-01"`
    - **Validates: Requirements 2.4, 2.5**
  - [ ] 6.3 Implement `getCurrentYearMonth()` and `renderMonthHeading()`
    - `getCurrentYearMonth()`: return `"YYYY-MM"` for today
    - `renderMonthHeading()`: format `state.activeMonth` as `"Month YYYY"` using `toLocaleString`; set `#month-heading` text content
    - Implement `setActiveMonth(yyyyMM)`: update `state.activeMonth`, re-render heading, list, summary, chart
    - Bind click handlers on `#prev-month` and `#next-month` buttons
    - _Requirements: 2.1, 2.2, 2.6_

- [ ] 7. Checkpoint — Ensure storage, form, and navigation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement the Transaction List module
  - [ ] 8.1 Implement `getActiveTransactions()` and `renderTransactionList()`
    - `getActiveTransactions()`: filter `state.transactions` where `t.creationMonth === state.activeMonth`, then reverse the filtered array to show most recently added first (descending insertion order)
    - `renderTransactionList()`: for each transaction render a card/row with amount, `creationMonth`, category, description (or `<span class="text-gray-400 italic">No description</span>` placeholder); include a delete `<button data-delete-id="…" aria-label="Delete transaction …">`; show empty-state message when list is empty
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 8.6_
  - [ ]* 8.2 Write property test for transaction list — Property 3: Month Filtering
    - **Property 3: Month Filtering**
    - For any set of transactions spanning multiple months and any active month, assert `getActiveTransactions()` returns exactly the transactions whose `creationMonth` equals the active month
    - **Validates: Requirements 2.3, 5.4**
  - [ ]* 8.3 Write property test for transaction list — Property 10: Transaction List Sort Order
    - **Property 10: Transaction List Sort Order**
    - For any set of transactions in the active month, assert the rendered order reflects descending insertion order (the item at index 0 of the rendered list was the last item pushed into `state.transactions`)
    - **Validates: Requirements 5.2**
  - [ ]* 8.4 Write property test for transaction list — Property 9: Transaction List Rendering Completeness
    - **Property 9: Transaction List Rendering Completeness**
    - For any transaction in the active month, assert the rendered HTML contains the transaction's amount, `creationMonth`, category, and either its description or the placeholder
    - **Validates: Requirements 5.1, 8.6**
  - [ ] 8.5 Implement `deleteTransaction(id)` with event delegation
    - Remove the transaction with the matching `id` from `state.transactions`
    - Call `saveTransactions`, re-render list, summary, chart
    - Attach a single delegated click listener on `#transaction-list` using `e.target.closest("[data-delete-id]")`
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 8.6 Write property test for delete — Property 11: Delete Removes from Storage
    - **Property 11: Delete Removes from Storage**
    - For any transaction that exists in state, assert calling `deleteTransaction(id)` removes exactly that transaction and leaves all others unchanged in both `state.transactions` and `localStorage`
    - **Validates: Requirements 6.1, 6.2**

- [ ] 9. Implement the Summary Panel module
  - [ ] 9.1 Implement `calcSummary(transactions)` and `formatCurrency(amount)`
    - `calcSummary`: reduce to `{ total, byCategory }` as per design
    - `formatCurrency`: return `"$" + amount.toFixed(2)`
    - _Requirements: 3.1, 3.2, 3.5_
  - [ ]* 9.2 Write property test for summary — Property 5: Summary Total Accuracy
    - **Property 5: Summary Total Accuracy**
    - For any array of transactions, assert `calcSummary(transactions).total` equals the exact arithmetic sum of all amounts
    - Assert each `byCategory[cat]` equals the sum of amounts for that category
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 9.3 Write property test for currency — Property 6: Currency Formatting Consistency
    - **Property 6: Currency Formatting Consistency**
    - For any non-negative number, assert `formatCurrency(n)` starts with `"$"` and ends with exactly two decimal digits
    - **Validates: Requirements 3.5**
  - [ ] 9.4 Implement `renderSummaryPanel()`
    - When no transactions: show `$0.00` total, no per-category rows
    - When transactions present: render total and one row per category using `formatCurrency`
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 10. Implement the Chart Area module
  - [ ] 10.1 Implement `renderPieChart(canvas, transactions)`
    - Compute per-category totals and grand total
    - Draw pie slices using Canvas 2D API starting at `-Math.PI / 2`; use `CATEGORY_COLORS` per category
    - When `transactions` is empty: clear canvas, show `<p>No spending data for this month.</p>`, hide canvas
    - Set `canvas.width` and `canvas.height` from container size on each render call
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  - [ ] 10.2 Implement chart legend
    - Render a `<ul>` below/beside the canvas listing each present category with its color swatch and `formatCurrency` total
    - _Requirements: 4.5_
  - [ ] 10.3 Implement `renderChart()` (orchestrator)
    - Get active transactions, call `renderPieChart`, then render legend
    - _Requirements: 4.1, 4.4_
  - [ ]* 10.4 Write property test for chart — Property 7: Chart Category Color Distinctness
    - **Property 7: Chart Category Color Distinctness**
    - For any subset of categories in `CATEGORY_COLORS`, assert all color values are unique strings
    - **Validates: Requirements 4.5**
  - [ ]* 10.5 Write property test for chart — Property 8: Chart Category Coverage
    - **Property 8: Chart Category Coverage**
    - For any non-empty transaction set, assert the categories passed to `renderPieChart` match exactly the distinct categories in the transactions, and that their proportions sum to 1.0
    - **Validates: Requirements 4.1**

- [ ] 11. Implement initialization and event binding
  - [ ] 11.1 Implement `renderAll()`, `bindEvents()`, and `init()`
    - `renderAll()`: call `renderMonthHeading()`, `renderTransactionList()`, `renderSummaryPanel()`, `renderChart()`
    - `bindEvents()`: bind form submit, `#prev-month` click, `#next-month` click, and delegated delete listener on `#transaction-list`
    - `init()`: set `state.transactions = loadTransactions()`, set `state.activeMonth = getCurrentYearMonth()`, call `renderAll()`, call `bindEvents()`
    - Wire `document.addEventListener("DOMContentLoaded", init)`
    - _Requirements: 2.1, 7.2_
  - [ ]* 11.2 Write property test for persistence — Property 12: Persistence Round-Trip
    - **Property 12: Persistence Round-Trip**
    - For any collection of transactions, assert that calling `saveTransactions` followed by `loadTransactions` returns a structurally and value-equivalent collection
    - **Validates: Requirements 7.1, 7.2**

- [ ] 12. Checkpoint — Ensure all modules integrate and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Apply responsive layout Tailwind classes throughout `index.html`
  - [ ] 13.1 Apply responsive Tailwind grid and flex classes
    - Main grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`, max-width wrapper `w-full max-w-screen-xl mx-auto px-4`
    - Summary + chart section: `flex flex-col sm:flex-row`
    - Verify layout stacks to single column on narrow viewports (< 640px)
    - _Requirements: 8.1, 8.2_

- [ ] 14. Finalize accessibility attributes
  - [ ] 14.1 Audit and complete accessibility markup
    - Confirm every `<input>`, `<select>`, `<textarea>` has a `<label>` with matching `for`/`id`
    - Add `aria-label="Delete transaction [amount] [category]"` to each delete button
    - Confirm `<canvas>` has a descriptive `<p>` child fallback
    - Confirm Tailwind `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500` classes are on all interactive controls
    - Confirm category labels appear in both legend and list items (color is not the sole differentiator)
    - _Requirements: 8.4, 8.5_
  - [ ]* 14.2 Write property test for accessibility — Property 13: Focus Indicator Presence
    - **Property 13: Focus Indicator Presence**
    - Query all interactive controls in the rendered DOM; assert each has a focus-ring class or equivalent custom style
    - **Validates: Requirements 8.5**

- [ ] 15. Final checkpoint — Full integration
  - Ensure all tests pass and the app renders correctly in a browser, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All implementation is in three static files — no bundler, no build step
- Property tests should use a JS property-based testing library (e.g., `fast-check`) loaded via CDN in the test harness, or adapt to a simple generative testing approach in plain JS if no test runner is available
- Each task references specific requirements for full traceability
- Checkpoints (tasks 7, 12, 15) ensure incremental validation at natural integration boundaries

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["3.3", "5.1", "6.1", "6.3"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.2"] },
    { "id": 5, "tasks": ["5.4", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5", "9.1"] },
    { "id": 7, "tasks": ["8.6", "9.2", "9.3", "9.4"] },
    { "id": 8, "tasks": ["10.1", "10.2"] },
    { "id": 9, "tasks": ["10.3", "10.4", "10.5"] },
    { "id": 10, "tasks": ["11.1"] },
    { "id": 11, "tasks": ["11.2", "13.1"] },
    { "id": 12, "tasks": ["14.1"] },
    { "id": 13, "tasks": ["14.2"] }
  ]
}
```
