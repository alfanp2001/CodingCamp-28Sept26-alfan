# Design Document

## Expense Tracker

---

## Overview

The Expense Tracker is a single-page client-side web application built with HTML, Tailwind CSS, and Vanilla JavaScript. There is no build step, no bundler, and no backend — the entire app ships as three static files (`index.html`, `styles.css`, `app.js`) and runs entirely in the browser. All transaction data is persisted to `localStorage`.

The architecture follows a **module pattern** with a central state object, pure transformation functions, and explicit render calls. When state changes, the affected UI components are re-rendered synchronously.

---

## Architecture

### High-Level Structure

```
index.html          ← markup skeleton, Tailwind CDN, <script src="app.js">
styles.css          ← custom CSS (focus rings, canvas sizing, animations)
app.js              ← all application logic, split into logical sections
```

### Application Layers

```
┌──────────────────────────────────────────────────────┐
│                      UI Layer                        │
│  renderMonthHeading()  renderTransactionList()        │
│  renderSummaryPanel()  renderChart()                  │
│  renderForm()          renderEmptyState()             │
└───────────────────────────┬──────────────────────────┘
                            │ reads / dispatches
┌───────────────────────────▼──────────────────────────┐
│                    State Module                      │
│  state.transactions[]   state.activeMonth (YYYY-MM)  │
│  getActiveTransactions()                             │
└───────────────────────────┬──────────────────────────┘
                            │ reads / writes
┌───────────────────────────▼──────────────────────────┐
│                  Storage Module                      │
│  loadTransactions()   saveTransactions()             │
│  STORAGE_KEY = "expense_tracker_transactions"        │
└──────────────────────────────────────────────────────┘
```

### Data Flow

1. **Page load** → `init()` reads from `localStorage`, sets active month to current month, renders all components.
2. **Form submit** → validate → create transaction object (with `creationMonth` set from system clock) → push to `state.transactions` → persist → re-render list, summary, chart.
3. **Delete** → remove from `state.transactions` by ID → persist → re-render list, summary, chart.
4. **Month navigation** → update `state.activeMonth` → re-render heading, list, summary, chart.

---

## State Model

```javascript
// Central application state (single source of truth)
const state = {
  transactions: [],   // Transaction[]
  activeMonth: "",    // "YYYY-MM" string, e.g. "2025-07"
};
```

The state object is private to `app.js`. No component mutates state directly — they call action functions (`addTransaction`, `deleteTransaction`, `setActiveMonth`) which update state then trigger renders.

---

## Data Models

### Transaction

```javascript
/**
 * @typedef {Object} Transaction
 * @property {string}  id             - UUID v4 (crypto.randomUUID or fallback)
 * @property {number}  amount         - Positive number, max 2 decimal places
 * @property {string}  creationMonth  - "YYYY-MM" string derived from system clock at save time; immutable after creation
 * @property {string}  category       - One of CATEGORIES
 * @property {string}  description    - Optional free text, may be empty string
 */
```

### Constants

```javascript
const STORAGE_KEY = "expense_tracker_transactions";

const CATEGORIES = ["Food", "Transport", "Entertainment", "Health", "Other"];

const CATEGORY_COLORS = {
  Food:          "#f97316",  // orange-500
  Transport:     "#3b82f6",  // blue-500
  Entertainment: "#a855f7",  // purple-500
  Health:        "#22c55e",  // green-500
  Other:         "#6b7280",  // gray-500
};
```

---

## Components

### 1. Transaction Form

**DOM element:** `<form id="transaction-form">`

**Inputs:**
| Field       | Type     | Required | Validation                          |
|-------------|----------|----------|-------------------------------------|
| amount      | number   | yes      | > 0, ≤ 2 decimal places             |
| category    | select   | yes      | must be one of CATEGORIES           |
| description | textarea | no       | any string                          |

> **Note:** There is no date field. The `creationMonth` is assigned automatically from the system clock (`getCurrentYearMonth()`) at the moment the form is submitted. Users cannot select or override it.

**Behavior:**
- On submit: validate → if invalid, show inline error message per field → stop. If valid, call `addTransaction()`, reset form.
- Error messages are inserted as `<p class="text-red-500 text-sm mt-1">` immediately after the invalid field.
- After successful save, all fields revert to empty/default state.

**Validation Logic:**

```javascript
function validateForm(formData) {
  const errors = {};
  if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
    errors.amount = "Amount must be a positive number.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(formData.amount)) {
    errors.amount = "Amount may have at most two decimal places.";
  }
  if (!formData.category || !CATEGORIES.includes(formData.category)) {
    errors.category = "Please select a category.";
  }
  return errors; // empty object = valid
}
```

**Transaction creation:**

```javascript
function addTransaction(formData) {
  const transaction = {
    id:            generateId(),
    amount:        Number(formData.amount),
    creationMonth: getCurrentYearMonth(), // e.g. "2025-07" — set at save time
    category:      formData.category,
    description:   formData.description ?? "",
  };
  state.transactions.push(transaction);
  saveTransactions(state.transactions);
  renderList();
  renderSummary();
  renderChart();
}
```

---

### 2. Monthly Navigation

**DOM elements:** `<button id="prev-month">`, `<h2 id="month-heading">`, `<button id="next-month">`

**State:** `state.activeMonth` — a `"YYYY-MM"` string.

**Navigation logic:**

```javascript
function prevMonth(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;
}

function nextMonth(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
}
```

**Heading format:** Full month name + year, e.g. `"July 2025"`, using `Date` with `toLocaleString`.

---

### 3. Transaction List

**DOM element:** `<div id="transaction-list">`

**Rendering:**
- Filters `state.transactions` by `t.creationMonth === state.activeMonth`.
- Sorts in descending insertion order (most recently added first) — since `state.transactions` is an append-only array, this means reversing the filtered slice: `filtered.slice().reverse()`.
- Renders each as a `<div>` card or `<tr>` in a `<table>`.
- Shows empty-state message when no transactions exist for the active month.
- Each item includes a delete `<button>` with `data-id` attribute.
- The displayed month label comes from `t.creationMonth` (e.g. `"July 2025"`), not a per-transaction date.

**Description handling:** If `description` is empty string, renders `<span class="text-gray-400 italic">No description</span>` as placeholder.

**`getActiveTransactions` helper:**

```javascript
function getActiveTransactions() {
  return state.transactions.filter(t => t.creationMonth === state.activeMonth);
}
```

---

### 4. Summary Panel

**DOM element:** `<div id="summary-panel">`

**Calculations:**

```javascript
function calcSummary(transactions) {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const byCategory = {};
  for (const t of transactions) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  return { total, byCategory };
}
```

**Amount formatting:**

```javascript
function formatCurrency(amount) {
  return "$" + amount.toFixed(2);
}
```

**Empty state:** When `transactions` is empty, total is `$0.00` and no per-category rows are rendered.

---

### 5. Chart Area

**DOM element:** `<div id="chart-area">` containing `<canvas id="expense-chart">`

**Implementation:** A **pie chart** rendered on a `<canvas>` element using the 2D Canvas API. No external libraries.

**Rendering algorithm:**

```javascript
function renderPieChart(canvas, transactions) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (transactions.length === 0) {
    // Show "No data" text in center
    return;
  }

  const totals = {}; // category → total amount
  let grand = 0;
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    grand += t.amount;
  }

  let startAngle = -Math.PI / 2; // start at top
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) * 0.85;

  for (const [cat, amt] of Object.entries(totals)) {
    const slice = (amt / grand) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[cat] ?? "#9ca3af";
    ctx.fill();
    startAngle += slice;
  }
}
```

**Legend:** A `<ul>` below or beside the canvas lists each category with its color swatch and formatted total.

**No-data state:** When no transactions exist, the canvas is hidden and a `<p>` with `"No spending data for this month."` is shown instead.

**Canvas sizing:** Set via CSS to be responsive. Canvas width/height attributes set in JS based on container size on render.

---

## Storage Module

```javascript
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Malformed data");
    return parsed;
  } catch (e) {
    showStorageWarning();
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}
```

**Storage warning:** A non-blocking `<div>` banner shown at the top of the page when `localStorage` is unavailable or returns malformed data. It does not prevent app use.

---

## ID Generation

```javascript
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```

---

## Initialization

```javascript
function init() {
  state.transactions = loadTransactions();
  state.activeMonth = getCurrentYearMonth(); // "YYYY-MM"
  renderAll();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);
```

`renderAll()` calls all four render functions: heading, list, summary, chart.

`bindEvents()` attaches event listeners to the form submit, prev/next month buttons, and (via event delegation) to delete buttons in the transaction list.

---

## Event Delegation

Delete buttons are rendered dynamically, so a single listener on the list container handles all deletes:

```javascript
document.getElementById("transaction-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete-id]");
  if (btn) deleteTransaction(btn.dataset.deleteId);
});
```

---

## Responsive Layout

The layout uses a two-column grid on wide viewports and stacks to single-column on narrow viewports using Tailwind responsive prefixes:

```
Mobile (< 640px):     single column stack
Tablet (640–1023px):  form + list stacked; summary + chart side by side
Desktop (≥ 1024px):   two-column: [form / list] | [summary + chart]
```

Tailwind classes used:
- `grid grid-cols-1 lg:grid-cols-2 gap-6`
- `flex flex-col sm:flex-row`
- `w-full max-w-screen-xl mx-auto px-4`

The canvas element uses `width: 100%; max-width: 300px` in CSS and is redrawn on each render call to match its container.

---

## Accessibility

- All `<input>`, `<select>`, `<textarea>` elements have associated `<label>` elements with `for`/`id` pairs.
- Delete buttons have `aria-label="Delete transaction"` with identifying info.
- Focus rings are provided via Tailwind's `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500` on all interactive controls.
- Custom canvas fallback: the `<canvas>` element contains a `<p>` child describing the chart for non-visual access.
- Color is not the only distinguishing factor — category names appear in legends and list items.

---

## Error Handling Summary

| Scenario | Behavior |
|---|---|
| Required field empty on submit | Inline error message, no save |
| Invalid amount (non-positive / non-numeric) | Inline error message, no save |
| `localStorage` unavailable | Empty state + non-blocking warning banner |
| `localStorage` returns malformed JSON | Empty state + non-blocking warning banner |
| `crypto.randomUUID` unavailable | Fallback ID generation |

---

## File Structure (Final)

```
index.html    ← HTML skeleton: header, main with form + panels, footer; CDN links
styles.css    ← Canvas sizing, custom focus ring overrides, animation tweaks
app.js        ← All logic: state, storage, validation, rendering, event binding
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Valid Submission Round-Trip

*For any* valid transaction (positive amount with ≤ 2 decimal places, valid category), submitting the form SHALL save the transaction to `localStorage` with `creationMonth` equal to the current calendar month derived from the system clock, cause the transaction to appear in the Transaction List, and reset all form fields to their empty/default state.

**Validates: Requirements 1.4, 1.5, 1.10**

---

### Property 2: Invalid Input Rejection

*For any* form submission where at least one required field is empty, or the amount is non-positive or non-numeric, the system SHALL display a validation error message and SHALL NOT save any transaction to `localStorage`.

**Validates: Requirements 1.6, 1.8**

---

### Property 3: Month Filtering

*For any* set of transactions spanning multiple months and any active month, the Transaction List SHALL display exactly the transactions whose `creationMonth` equals the active month, and no others.

**Validates: Requirements 2.3, 5.4**

---

### Property 4: Month Navigation Correctness

*For any* active month `M`, activating "previous month" SHALL set the active month to the calendar month immediately before `M` (with correct year decrement when `M` is January), and activating "next month" SHALL set it to the calendar month immediately after `M` (with correct year increment when `M` is December).

**Validates: Requirements 2.4, 2.5**

---

### Property 5: Summary Total Accuracy

*For any* set of transactions in the active month, the Summary Panel's displayed total SHALL equal the exact arithmetic sum of all transaction amounts, and each per-category total SHALL equal the sum of amounts for transactions in that category.

**Validates: Requirements 3.1, 3.2**

---

### Property 6: Currency Formatting Consistency

*For any* numeric amount stored in a transaction, the formatted string displayed in the Summary Panel SHALL begin with a currency symbol and SHALL end with exactly two decimal digits.

**Validates: Requirements 3.5**

---

### Property 7: Chart Category Color Distinctness

*For any* subset of categories present in the active month's transactions, each category rendered in the Chart Area SHALL be assigned a visually distinct color such that no two categories share the same color value.

**Validates: Requirements 4.5**

---

### Property 8: Chart Category Coverage

*For any* non-empty set of transactions in the active month, the Chart Area SHALL render a visual segment or data point for each distinct category present, and the union of all segments SHALL represent 100% of the total spending.

**Validates: Requirements 4.1**

---

### Property 9: Transaction List Rendering Completeness

*For any* transaction in the active month (whether or not it has a description), the Transaction List SHALL render an item that includes the transaction's amount, `creationMonth`, and category, and either the description text or a placeholder if the description is empty.

**Validates: Requirements 5.1, 8.6**

---

### Property 10: Transaction List Sort Order

*For any* set of transactions in the active month, the Transaction List SHALL render them in descending insertion order so that for every pair of adjacent items, the upper item was added to `state.transactions` after the lower item.

**Validates: Requirements 5.2**

---

### Property 11: Delete Removes from Storage

*For any* transaction that exists in `localStorage`, activating its delete control SHALL remove exactly that transaction from `localStorage` and from the Transaction List, leaving all other transactions unchanged.

**Validates: Requirements 6.1, 6.2**

---

### Property 12: Persistence Round-Trip

*For any* collection of transactions saved by the application, reinitializing the app (simulating a page reload by calling `loadTransactions()`) SHALL return a collection that is structurally and value-equivalent to the saved collection.

**Validates: Requirements 7.1, 7.2**

---

### Property 13: Focus Indicator Presence

*For any* interactive control (button, input, select, textarea) rendered by the application, that element SHALL have a visible focus indicator style applied such that tab-navigating to it changes its visual appearance.

**Validates: Requirements 8.5**
