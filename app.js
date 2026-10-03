
// Constants

const categories = [
    'Food',
    'Fun',
    'Health',
    'Groceries',
    'Utilities',
]

const TRANSACTION_KEY = 'transaction'
const BALANCE_KEY = 'balance'
const THEME_KEY = 'theme'

// Initial State

const state = {
    balance: null,
    transactions: [],
    sortingBy: null, //id, name, category, amount
    theme: null //system, light, dark
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


// State Functions

function saveState() {
    try {
        localStorage.setItem(TRANSACTION_KEY, JSON.stringify(state.transactions));
        if (state.balance !== null) {
            localStorage.setItem(TRANSACTION_KEY, String(state.balance));
        } else {
            localStorage.removeItem(BALANCE_KEY);
        }
        localStorage.setItem(THEME_KEY, String(state.theme));
    } catch (e) {
        console.log('LocalStorage errored data will not be saved')
    }
}

function loadState() {
    try {
        const transactions = localStorage.getItem(TRANSACTION_KEY);
        state.transactions = transactions ? JSON.parse(transactions) : [];
        const balance = localStorage.getItem(BALANCE_KEY);
        state.balance = balance !== null ? Number(balance) : null;
        const theme = localStorage.getItem(THEME_KEY);
        state.theme = theme;
    } catch (e) {
        state.transactions = [];
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
    state.sortingBy = String(value);
}

function addTransaction(name, amount, category) {
    const id = (Date.now() % 100000) + 1;
    state.transactions.push({
        id,
        name: name,
        amount: amount,
        category: category,
    })
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(x => x.id !== id);
}

// Render

function renderBalance() {
    const display = document.getElementById('balance');
    const balance = state.balance;
    if (balance !== null) {
        display.textContent = balance;
        if (balance < 0) {
            display.classList.toggle('text-red')
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
    categories.forEach(category => {
        const option = document.createElement('option');
        option.innerHTML = category;
        options.appendChild(option);
    })
}

function renderTransactions() {

}

function renderPieChart() {

}

// Theme Switching

const body = document.body;
const systemThemeBtn = document.getElementById('system-theme');
const lightThemeBtn = document.getElementById('light-theme');
const darkThemeBtn = document.getElementById('dark-theme');

function updateTheme() {
    switch (state.theme) {
        case 'light':
            if (body) {
                body.classList.remove('dark-theme')
                body.classList.add('light-theme')
            }
            if (systemThemeBtn) {
                systemThemeBtn.classList.remove('selected')
            }
            if (lightThemeBtn) {
                lightThemeBtn.classList.add('selected')
            }
            if (darkThemeBtn) {
                darkThemeBtn.classList.remove('selected')
            }
            break;
        case 'dark':
            if (body) {
                body.classList.remove('light-theme')
                body.classList.add('dark-theme')
            }
            if (systemThemeBtn) {
                systemThemeBtn.classList.remove('selected')
            }
            if (lightThemeBtn) {
                lightThemeBtn.classList.remove('selected')
            }
            if (darkThemeBtn) {
                darkThemeBtn.classList.add('selected')
            }
            break;
        default:
            if (body) {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    body.classList.remove('light-theme')
                    body.classList.add('dark-theme')
                } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    body.classList.remove('dark-theme')
                    body.classList.add('light-theme')
                }
            }
            if (systemThemeBtn) {
                systemThemeBtn.classList.add('selected')
            }
            if (lightThemeBtn) {
                lightThemeBtn.classList.remove('selected')
            }
            if (darkThemeBtn) {
                darkThemeBtn.classList.remove('selected')
            }
    }
}


if (systemThemeBtn) {
    systemThemeBtn.addEventListener('click', function () {
        if (state.theme != 'theme') {
            setTheme('theme')
            saveState();
            updateTheme();
        }
    })
}
if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', function () {
        if (state.theme != 'light') {
            setTheme('light')
            saveState();
            updateTheme();
        }
    })
}
if (darkThemeBtn) {
    darkThemeBtn.addEventListener('click', function () {
        if (state.theme != 'dark') {
            setTheme('dark')
            saveState();
            updateTheme();
        }
    })
}

// Events
const budgetInput = document.getElementById("budget-input");
const budgetButton = document.getElementById("budget-button");
const budgetError = document.getElementById("budget-error");
if (budgetButton) {
    budgetButton.addEventListener('click', function () {
        const budget = budgetInput ? budgetInput.value : '';
        const valid = validateBudget(budget);

        if (!valid) {
            if (budgetError) {
                budgetError.textContent = 'Budget is not valid, must be positive'
            }
            return;
        } else {
            setBalance(budget);
        }
        if (budgetError) {
            budgetError.textContent = '';
        }
        if (budgetInput) {
            budgetInput.value = '';
        }
    })
}



// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadState();
    updateTheme();
    renderBalance();
    renderCategories();
});