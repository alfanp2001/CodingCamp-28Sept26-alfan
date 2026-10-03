
// Constants

const TRANSACTION_KEY = 'transaction'
const BALANCE_KEY = 'balance'
const THEME_KEY = 'theme'
const CATEGORY_KEY = 'categories'
const DEFAULT_CATEGORIES = [
    'Food',
    'Fun',
    'Health',
    'Groceries',
    'Utilities',
]

// Initial State

const state = {
    balance: null,
    transactions: [],
    sortingBy: "id", //id, name, category, amount
    sortDirection: 'asc',
    theme: null, //system, light, dark
    categories: [...DEFAULT_CATEGORIES]
};

// Helper Functions

function formatCurrency(value) {
    return value.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });
}

function validateBudget(value) {
    const number = Number(value);
    return { valid: isFinite(number) && number > 0 };
}

function validateTransaction(name, amount, category) {
    const errors = {};

    if (!name || name.trim().length === 0) {
        errors.name = 'Transaction name is required.';
    }
    if (!isFinite(amount) || Number(amount) <= 0) {
        errors.amount = 'Amount must be a positive number.';
    }
    if (!category || category.trim().length === 0) {
        errors.category = 'Category is required.';
    }

    return { valid: Object.keys(errors).length === 0, errors };
}


// State Functions

function saveState() {
    try {
        localStorage.setItem(TRANSACTION_KEY, JSON.stringify(state.transactions));
        if (state.balance !== null) {
            localStorage.setItem(BALANCE_KEY, String(state.balance));
        } else {
            localStorage.removeItem(BALANCE_KEY);
        }
        localStorage.setItem(CATEGORY_KEY, JSON.stringify(state.categories));
        localStorage.setItem(THEME_KEY, String(state.theme));
    } catch (e) {
        console.log('LocalStorage errored data will not be saved')
    }
}

function loadState() {
    try {
        const transactions = localStorage.getItem(TRANSACTION_KEY);
        const parsedTransactions = transactions ? JSON.parse(transactions) : [];
        state.transactions = Array.isArray(parsedTransactions) ? parsedTransactions : [];
        const savedCategories = localStorage.getItem(CATEGORY_KEY);
        const parsedCategories = savedCategories ? JSON.parse(savedCategories) : [];
        state.categories = [...DEFAULT_CATEGORIES];
        [...(Array.isArray(parsedCategories) ? parsedCategories : []), ...state.transactions.map(transaction => transaction.category)]
            .forEach(category => {
                if (typeof category !== 'string' || !category.trim()) return;
                const normalizedCategory = category.trim();
                const exists = state.categories.some(
                    existingCategory => existingCategory.localeCompare(normalizedCategory, undefined, { sensitivity: 'base' }) === 0
                );
                if (!exists) state.categories.push(normalizedCategory);
            });
        const balance = localStorage.getItem(BALANCE_KEY);
        state.balance = balance !== null ? Number(balance) : null;
        const theme = localStorage.getItem(THEME_KEY);
        state.theme = theme;
    } catch (e) {
        state.transactions = [];
        state.categories = [...DEFAULT_CATEGORIES];
        state.balance = null;
        state.theme = 'system';
        console.log('LocalStorage errored data will not be saved')
    }
}

function setBalance(value) {
    state.balance = Number(value);
}

function setTheme(value) {
    state.theme = String(value);
}

function setSorting(value) {
    const sortingBy = String(value);
    if (state.sortingBy === sortingBy) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortingBy = sortingBy;
        state.sortDirection = 'asc';
    }
}

function addTransaction(name, amount, category) {
    const id = (Date.now() % 100000) + 1;
    state.transactions.push({
        id,
        name: name,
        amount: Number(amount),
        category: category.trim(),
    })
}

function deleteTransaction(id) {
    const transactionId = Number(id);
    state.transactions = state.transactions.filter(transaction => transaction.id !== transactionId);
    saveState();
    renderTransactions();
    renderBalance();
}

// Render

function renderBalance() {
    const display = document.getElementById('balance');
    const balance = state.balance - state.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    if (balance !== null) {
        display.textContent = formatCurrency(balance);
        if (balance < 0) {
            display.classList.add('text-red-500');
        } else {
            display.classList.remove('text-red-500');
        }
    } else {
        display.textContent = "Rp.0.00";
    }
}

function renderCategories() {
    const options = document.getElementById('categories');
    if (!options) {
        return;
    } else {
        options.innerHTML = '';
    }
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        options.appendChild(option);
    })
}

function addCategory(value) {
    const category = String(value).trim();
    if (!category) return false;

    const exists = state.categories.some(
        existingCategory => existingCategory.localeCompare(category, undefined, { sensitivity: 'base' }) === 0
    );
    if (exists) return false;

    state.categories.push(category);
    renderCategories();
    return true;
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');
    if (!list) return;

    list.innerHTML = '';
    renderSortControls();
    renderPieChart();

    if (state.transactions.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'py-8 text-center text-sm opacity-75';
        empty.textContent = 'No transactions yet.';
        list.appendChild(empty);
        return;
    }

    let sorted = [...state.transactions];
    const direction = state.sortDirection === 'desc' ? -1 : 1;

    if (state.sortingBy === 'amount') {
        sorted.sort((a, b) => (a.amount - b.amount) * direction);
    } else if (state.sortingBy === 'category') {
        sorted.sort((a, b) => a.category.localeCompare(b.category, undefined, { sensitivity: 'base' }) * direction);
    }

    sorted.forEach(transaction => {
        const li = document.createElement('li');
        li.innerHTML =
            `<div class="flex flex-row items-center justify-between outline outline-2 rounded-sm p-2">
                <div class="flex flex-col">
                    <span class="font-bold">${transaction.name}</span>
                    <span class="opacity-75">${transaction.category}</span>
                </div>
                <div class="flex flex-row items-center">
                    <span>${formatCurrency(transaction.amount)}</span>
                    <button data-action="delete-transaction" data-id="${transaction.id}" class="ml-2 p-1 rounded-sm outline outline-2 text-sm" type="button" aria-label="Delete ${transaction.name}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                            <path fill-rule="evenodd"
                                d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                                clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>`;
        list.appendChild(li);
    });
}

// Chart js

let spendingChart = null;

function renderPieChart() {
    const canvas = document.getElementById('spending-chart');
    const emptyState = document.getElementById('chart-empty');
    if (!canvas) return;

    const totalsByCategory = new Map();
    state.transactions.forEach(transaction => {
        const category = String(transaction.category || 'Uncategorized').trim() || 'Uncategorized';
        const amount = Number(transaction.amount);
        if (!Number.isFinite(amount) || amount <= 0) return;
        totalsByCategory.set(category, (totalsByCategory.get(category) || 0) + amount);
    });

    const entries = [...totalsByCategory.entries()];
    if (spendingChart) {
        spendingChart.destroy();
        spendingChart = null;
    }

    if (entries.length === 0 || typeof Chart === 'undefined') {
        canvas.hidden = true;
        if (emptyState) {
            emptyState.hidden = false;
            emptyState.textContent = entries.length === 0
                ? 'No transactions to chart.'
                : 'Chart could not be loaded.';
        }
        return;
    }

    canvas.hidden = false;
    if (emptyState) emptyState.hidden = true;

    const colors = ['#0f766e', '#f59e0b', '#2563eb', '#dc2626', '#65a30d', '#9333ea', '#0891b2', '#ea580c'];
    spendingChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: entries.map(([category]) => category),
            datasets: [{
                data: entries.map(([, amount]) => amount),
                backgroundColor: entries.map((_, index) => colors[index % colors.length]),
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${formatCurrency(context.raw)}`,
                    },
                },
            },
        },
    });
}

// Theme Switching

const body = document.body;
const themeButtons = {
    system: document.getElementById('system-theme'),
    light: document.getElementById('light-theme'),
    dark: document.getElementById('dark-theme'),
};

function updateTheme() {
    const selectedTheme = state.theme === 'light' || state.theme === 'dark' ? state.theme : 'system';
    const currentTheme = selectedTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : selectedTheme;

    body.classList.toggle('dark-theme', currentTheme === 'dark');
    body.classList.toggle('light-theme', currentTheme === 'light');

    Object.entries(themeButtons).forEach(([theme, button]) => {
        if (!button) return;
        const selected = theme === selectedTheme;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
}

Object.entries(themeButtons).forEach(([theme, button]) => {
    if (!button) return;
    button.addEventListener('click', function () {
        setTheme(theme);
        saveState();
        updateTheme();
    });
});

// Events
const budgetInput = document.getElementById("budget-input");
const budgetButton = document.getElementById("budget-button");
const budgetError = document.getElementById("budget-error");
if (budgetButton) {
    budgetButton.addEventListener('click', function () {
        const budget = budgetInput ? budgetInput.value : '';
        const valid = validateBudget(budget).valid;

        if (!valid) {
            if (budgetError) {
                budgetError.textContent = 'Budget is not valid, must be positive';
                budgetError.classList.remove('invisible')
            }
            return;
        } else {
            setBalance(budget);
            saveState();
            renderBalance();
        }
        if (budgetError) {
            budgetError.textContent = '';
            budgetError.classList.add('invisible')
        }
        if (budgetInput) {
            budgetInput.value = '';
        }
    })
}

const form = document.getElementById('transaction-form');
const inputName = document.getElementById('name');
const inputAmount = document.getElementById('amount');
const inputCategory = document.getElementById('category');
const errorName = document.getElementById('name-error');
const errorAmount = document.getElementById('amount-error');
const errorCategory = document.getElementById('category-error');

if (inputCategory) {
    inputCategory.addEventListener('change', function () {
        if (addCategory(inputCategory.value)) {
            saveState();
        }
    });
}

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = inputName ? inputName.value : '';
        const amount = inputAmount ? inputAmount.value : '';
        const category = inputCategory ? inputCategory.value.trim() : '';

        const { valid, errors } = validateTransaction(name, amount, category);

        if (errorName) errorName.textContent = errors.name || '';
        if (errorAmount) errorAmount.textContent = errors.amount || '';
        if (errorCategory) errorCategory.textContent = errors.category || '';

        if (!valid) return;

        addCategory(category);
        addTransaction(name, amount, category);
        saveState();
        renderTransactions();

        if (inputName) inputName.value = '';
        if (inputAmount) inputAmount.value = '';
        if (inputCategory) inputCategory.value = '';
    });
}

const sortCategory = document.getElementById('sort-category');
const sortAmount = document.getElementById('sort-amount');
const transactionList = document.getElementById('transaction-list');

function renderSortControls() {
    const categoryActive = state.sortingBy === 'category';
    const amountActive = state.sortingBy === 'amount';

    if (sortCategory) {
        sortCategory.textContent = categoryActive
            ? `By Category (${state.sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`
            : 'By Category';
        sortCategory.setAttribute('aria-pressed', String(categoryActive));
    }
    if (sortAmount) {
        sortAmount.textContent = amountActive
            ? `By Amount (${state.sortDirection === 'asc' ? 'Low-High' : 'High-Low'})`
            : 'By Amount';
        sortAmount.setAttribute('aria-pressed', String(amountActive));
    }
}

if (transactionList) {
    transactionList.addEventListener('click', function (event) {
        const deleteButton = event.target.closest('[data-action="delete-transaction"]');
        if (deleteButton && transactionList.contains(deleteButton)) {
            deleteTransaction(deleteButton.dataset.id);
        }
    });
}

if (sortAmount) {
    sortAmount.addEventListener('click', function () {
        setSorting('amount')
        saveState();
        renderTransactions();
    })
}

if (sortCategory) {
    sortCategory.addEventListener('click', function () {
        setSorting('category')
        saveState();
        renderTransactions();
    })
}


// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadState();
    updateTheme();
    renderBalance();
    renderCategories();
    renderTransactions();
});