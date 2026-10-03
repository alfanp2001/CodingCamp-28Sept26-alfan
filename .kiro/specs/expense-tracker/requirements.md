# Requirements Document

## Introduction

The Expense Tracker is a client-side web application that allows users to log, view, and visualize personal spending transactions. It provides monthly navigation, spending summaries, and chart-based breakdowns by category. All data is stored in the browser's LocalStorage. The app is built with HTML, CSS, and Vanilla JavaScript only, using Tailwind CSS for styling. It targets modern browsers (Chrome, Firefox, Edge, Safari) and requires no external build tools or test setup.

Transactions are automatically associated with the current calendar month at the time of creation — users do not enter a date. Monthly navigation (previous/next) allows users to browse historical months.

## Glossary

- **App**: The Expense Tracker single-page web application.
- **Transaction**: A single spending record consisting of an amount, category, optional description, and a Creation Month assigned automatically at save time.
- **Category**: A label classifying the type of expense (e.g., Food, Transport, Entertainment, Health, Other).
- **LocalStorage**: The browser's built-in key-value storage API used to persist transaction data client-side.
- **Monthly View**: The UI state displaying transactions, summaries, and charts for a single calendar month.
- **Creation Month**: The calendar month and year in which a Transaction was saved, automatically derived from the system clock. This value is immutable after creation.
- **Active Month**: The calendar month currently displayed in the Monthly View, defaulting to the current month on load.
- **Transaction Form**: The UI component used to input and submit a new Transaction.
- **Summary Panel**: The UI component displaying total spending and per-category totals for the Active Month.
- **Chart Area**: The UI component rendering visual spending breakdowns (pie and/or bar charts) for the Active Month.
- **Transaction List**: The UI component displaying all Transactions for the Active Month in a tabular or list layout.

---

## Requirements

### Requirement 1: Transaction Logging

**User Story:** As a user, I want to log individual expense transactions with an amount, category, and optional description, so that I can keep a detailed record of my spending without entering a date manually.

#### Acceptance Criteria

1. THE Transaction Form SHALL include an amount field, a category field, and a description field.
2. THE Transaction Form SHALL mark the amount field and category field as required inputs.
3. THE Transaction Form SHALL mark the description field as optional.
4. WHEN the user submits the Transaction Form with all required fields filled, THE App SHALL assign the Transaction a Creation Month equal to the current calendar month and year derived from the system clock.
5. WHEN the user submits the Transaction Form with all required fields filled, THE App SHALL save the Transaction to LocalStorage.
6. WHEN the user submits the Transaction Form with all required fields filled, THE App SHALL display the new Transaction in the Transaction List without a page reload.
7. IF the user submits the Transaction Form with any required field empty, THEN THE Transaction Form SHALL display a validation error message identifying the missing field and SHALL NOT save the Transaction.
8. THE App SHALL accept amount values as positive numbers with up to two decimal places.
9. IF the user enters a non-positive or non-numeric value in the amount field, THEN THE Transaction Form SHALL display a validation error and SHALL NOT save the Transaction.
10. THE category field SHALL provide at least the following selectable options: Food, Transport, Entertainment, Health, Other.
11. WHEN a Transaction is saved successfully, THE Transaction Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Monthly View and Navigation

**User Story:** As a user, I want to view my transactions month by month and navigate between months, so that I can review my spending history over time.

#### Acceptance Criteria

1. WHEN the App loads, THE App SHALL set the Active Month to the current calendar month and year.
2. THE Monthly View SHALL display the month name and year of the Active Month as a heading.
3. THE Monthly View SHALL display only the Transactions whose Creation Month matches the Active Month.
4. WHEN the user activates the "previous month" control, THE App SHALL set the Active Month to the calendar month immediately preceding the current Active Month.
5. WHEN the user activates the "next month" control, THE App SHALL set the Active Month to the calendar month immediately following the current Active Month.
6. WHEN the Active Month changes, THE App SHALL update the Transaction List, Summary Panel, and Chart Area to reflect Transactions in the new Active Month.

---

### Requirement 3: Spending Summary

**User Story:** As a user, I want to see total and per-category spending summaries for the active month, so that I can understand where my money is going at a glance.

#### Acceptance Criteria

1. THE Summary Panel SHALL display the total sum of all Transaction amounts for the Active Month.
2. THE Summary Panel SHALL display the total sum of Transaction amounts grouped by each Category present in the Active Month.
3. WHEN the Active Month contains no Transactions, THE Summary Panel SHALL display a total of zero and no per-category totals.
4. WHEN the Active Month changes, THE Summary Panel SHALL recalculate and display the updated totals within 100ms of the month change event.
5. THE Summary Panel SHALL format all monetary amounts with a consistent currency symbol and two decimal places.

---

### Requirement 4: Charts and Visual Breakdown

**User Story:** As a user, I want to see pie or bar charts of my spending by category, so that I can visually understand my spending distribution.

#### Acceptance Criteria

1. THE Chart Area SHALL render a visual spending breakdown by Category for all Transactions in the Active Month.
2. THE Chart Area SHALL support at least one of the following chart types: pie chart or bar chart.
3. WHEN the Active Month contains no Transactions, THE Chart Area SHALL display a message indicating no data is available rather than an empty chart.
4. WHEN the Active Month changes, THE Chart Area SHALL update the chart to reflect the Transactions of the new Active Month within 100ms of the month change event.
5. THE Chart Area SHALL distinguish each Category using a visually distinct color.
6. THE Chart Area SHALL be implemented using Vanilla JavaScript canvas or SVG rendering without external charting libraries.

---

### Requirement 5: Transaction List Display

**User Story:** As a user, I want to see all my transactions for the active month in a clear list, so that I can review individual entries.

#### Acceptance Criteria

1. THE Transaction List SHALL display each Transaction's amount, Creation Month, category, and description (if present) for the Active Month.
2. THE Transaction List SHALL display Transactions sorted by insertion order in descending order (most recently added first).
3. WHEN the Active Month contains no Transactions, THE Transaction List SHALL display a message indicating no transactions have been recorded for that month.
4. WHEN the Active Month changes, THE Transaction List SHALL update to show only Transactions whose Creation Month matches the new Active Month.

---

### Requirement 6: Transaction Deletion

**User Story:** As a user, I want to delete individual transactions, so that I can remove incorrect or duplicate entries.

#### Acceptance Criteria

1. THE Transaction List SHALL provide a delete control for each displayed Transaction.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from LocalStorage.
3. WHEN a Transaction is deleted, THE App SHALL update the Transaction List, Summary Panel, and Chart Area to reflect the deletion without a page reload.

---

### Requirement 7: Data Persistence

**User Story:** As a user, I want my transaction data to persist between browser sessions, so that I do not lose my records when I close and reopen the browser.

#### Acceptance Criteria

1. THE App SHALL store all Transactions in the browser's LocalStorage using a consistent key.
2. WHEN the App loads, THE App SHALL read all persisted Transactions from LocalStorage and populate the Transaction List, Summary Panel, and Chart Area for the Active Month.
3. IF LocalStorage is unavailable or returns malformed data, THEN THE App SHALL initialize with an empty Transaction list and SHALL display a non-blocking warning message to the user.

---

### Requirement 8: Responsive and Accessible UI

**User Story:** As a user, I want the app to be readable and usable on different screen sizes and to have a clean, minimal visual design, so that the experience is comfortable across devices.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on viewport widths from 320px to 1920px.
2. THE App SHALL apply Tailwind CSS utility classes for layout and typography to maintain a consistent visual hierarchy.
3. THE App SHALL load and become interactive within 3 seconds on a standard broadband connection with no additional server-side requests beyond the initial page load.
4. THE App SHALL use semantic HTML elements (e.g., `<header>`, `<main>`, `<form>`, `<table>` or `<ul>`) for the primary structural components.
5. ALL interactive controls (buttons, inputs, selects) SHALL have visible focus indicators to support keyboard navigation.
6. WHERE a Transaction has no description, THE Transaction List SHALL omit the description field or display a placeholder rather than leaving a blank gap.
