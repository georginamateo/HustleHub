// Main Application
document.addEventListener('DOMContentLoaded', function() {
    // 1. Setup Event Listeners first
    setupEventListeners();
    
    // 2. Set the date
    setCurrentDate();

    // 3. Try to load data from LocalStorage
    const hasSavedData = loadSavedData();
    loadCustomItems(); // Load custom gig types and categories

    // 4. ONLY if no data was found, load the sample data
    if (!hasSavedData) {
        addSampleData();
    }

    // 5. Render everything
    renderTable();
    updateSummary();
});

// Variables to store transactions
let transactions = [];
let editingTransactionId = null;

// Custom items storage
let customGigTypes = [];
let customCategories = [];

// Active filters
let activeFilters = {
    gigTypes: ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other'],
    categories: ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation'],
    minAmount: null,
    maxAmount: null
};

// Set current date in header
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// Add sample data for demo (Only runs if storage is empty)
function addSampleData() {
    // Generate sample data for multiple months
    const sampleTransactions = [
        // January 2025
        { id: 1, date: '2025-01-15', type: 'DoorDash', category: 'Income', amount: 45.20, description: 'Lunch deliveries' },
        { id: 2, date: '2025-01-16', type: 'DoorDash', category: 'Income', amount: 37.20, description: 'Dinner shift' },
        { id: 3, date: '2025-01-18', type: 'Uber', category: 'Income', amount: 68.50, description: 'Airport trip' },
        { id: 4, date: '2025-01-19', type: 'Other', category: 'Expense', amount: -56.00, description: 'Gas refill' },
        { id: 5, date: '2025-01-20', type: 'eBay', category: 'Income', amount: 100.50, description: 'Sold vintage jacket' },
        { id: 6, date: '2025-01-21', type: 'eBay', category: 'Fees', amount: -12.00, description: 'eBay seller fee' },
        
        // February 2025
        { id: 7, date: '2025-02-10', type: 'DoorDash', category: 'Income', amount: 52.30, description: 'Weekend deliveries' },
        { id: 8, date: '2025-02-15', type: 'Uber', category: 'Income', amount: 72.80, description: 'Evening rides' },
        { id: 9, date: '2025-02-20', type: 'Freelance', category: 'Income', amount: 200.00, description: 'Web design project' },
        { id: 10, date: '2025-02-22', type: 'Other', category: 'Expense', amount: -45.00, description: 'Phone bill' },
        
        // December 2024
        { id: 11, date: '2024-12-05', type: 'eBay', category: 'Income', amount: 85.00, description: 'Sold old books' },
        { id: 12, date: '2024-12-20', type: 'Uber', category: 'Income', amount: 95.25, description: 'Holiday trips' },
    ];

    transactions = sampleTransactions;
    saveData(); // Save these immediately so they persist
}

// Set up all event listeners
function setupEventListeners() {
    // Hamburger Menu
    document.getElementById('hamburger-btn')?.addEventListener('click', toggleHamburgerMenu);
    document.getElementById('create-item-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        showCreateItemModal();
    });

    // Create Item Modal
    document.getElementById('close-create-item-btn')?.addEventListener('click', hideCreateItemModal);
    document.getElementById('cancel-create-item-btn')?.addEventListener('click', hideCreateItemModal);
    document.getElementById('create-item-form')?.addEventListener('submit', handleCreateItemSubmit);

    // Add Row Button
    document.getElementById('add-row-btn').addEventListener('click', showAddForm);

    // Close Modal Buttons
    document.getElementById('close-modal-btn').addEventListener('click', hideAddForm);
    document.getElementById('cancel-btn').addEventListener('click', hideAddForm);

    // Form Submission
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);

    // Clear All Button
    document.getElementById('clear-btn').addEventListener('click', clearAllTransactions);

    // Column Toggle Checkboxes
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', toggleColumnVisibility);
    });

    // Close modal when clicking outside
    document.getElementById('add-form-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideAddForm();
        }
    });

    // Filter controls
    document.getElementById('filter-toggle-btn')?.addEventListener('click', showFilterModal);
    document.getElementById('close-filter-btn')?.addEventListener('click', hideFilterModal);
    document.getElementById('apply-filter-btn')?.addEventListener('click', applyFilters);
    document.getElementById('reset-filter-btn')?.addEventListener('click', resetFilters);

    // Close filter modal when clicking outside
    document.getElementById('filter-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideFilterModal();
        }
    });
}

// Hamburger Menu Functions
function toggleHamburgerMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const menu = document.getElementById('menu-dropdown');
    hamburger.classList.toggle('active');
    menu.classList.toggle('active');
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    const hamburger = document.getElementById('hamburger-btn');
    const menu = document.getElementById('menu-dropdown');
    if (hamburger && menu && !hamburger.contains(e.target) && !menu.contains(e.target)) {
        hamburger.classList.remove('active');
        menu.classList.remove('active');
    }
});

// Create Item Modal Functions
function showCreateItemModal() {
    document.getElementById('create-item-modal').style.display = 'flex';
    document.getElementById('item-type-select').value = '';
    document.getElementById('item-name-input').value = '';
    // Close hamburger menu
    document.getElementById('hamburger-btn').classList.remove('active');
    document.getElementById('menu-dropdown').classList.remove('active');
}

function hideCreateItemModal() {
    document.getElementById('create-item-modal').style.display = 'none';
}

function handleCreateItemSubmit(e) {
    e.preventDefault();
    
    const itemType = document.getElementById('item-type-select').value;
    const itemName = document.getElementById('item-name-input').value.trim();
    
    if (!itemName) {
        alert('Please enter an item name.');
        return;
    }
    
    if (itemType === 'gigtype') {
        // Check if already exists
        const existingGigTypes = ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other', ...customGigTypes];
        if (existingGigTypes.map(g => g.toLowerCase()).includes(itemName.toLowerCase())) {
            alert('This Gig Type already exists.');
            return;
        }
        customGigTypes.push(itemName);
        updateGigTypeOptions();
        alert(`Gig Type "${itemName}" has been created!`);
    } else if (itemType === 'category') {
        // Check if already exists
        const existingCategories = ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation', ...customCategories];
        if (existingCategories.map(c => c.toLowerCase()).includes(itemName.toLowerCase())) {
            alert('This Category already exists.');
            return;
        }
        customCategories.push(itemName);
        updateCategoryOptions();
        alert(`Category "${itemName}" has been created!`);
    }
    
    saveCustomItems();
    hideCreateItemModal();
}

function updateGigTypeOptions() {
    const typeSelect = document.getElementById('type-select');
    const filterCheckboxes = document.querySelector('.gig-type-filter')?.parentElement.parentElement;
    
    // Update transaction form dropdown
    const currentValue = typeSelect.value;
    typeSelect.innerHTML = '<option value="">Select gig type...</option>';
    
    const allGigTypes = ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other', ...customGigTypes];
    allGigTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
    typeSelect.value = currentValue;
    
    // Update filter checkboxes
    if (filterCheckboxes) {
        filterCheckboxes.innerHTML = '';
        allGigTypes.forEach(type => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'gig-type-filter';
            checkbox.value = type;
            checkbox.checked = activeFilters.gigTypes.includes(type);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + type));
            filterCheckboxes.appendChild(label);
        });
    }
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('category-select');
    const filterCheckboxes = document.querySelector('.category-filter')?.parentElement.parentElement;
    
    // Update transaction form dropdown
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Select category...</option>';
    
    const allCategories = ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation', ...customCategories];
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    categorySelect.value = currentValue;
    
    // Update filter checkboxes
    if (filterCheckboxes) {
        filterCheckboxes.innerHTML = '';
        allCategories.forEach(category => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'category-filter';
            checkbox.value = category;
            checkbox.checked = activeFilters.categories.includes(category);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + category));
            filterCheckboxes.appendChild(label);
        });
    }
}

function saveCustomItems() {
    localStorage.setItem('hustlehub-custom-gig-types', JSON.stringify(customGigTypes));
    localStorage.setItem('hustlehub-custom-categories', JSON.stringify(customCategories));
}

function loadCustomItems() {
    const savedGigTypes = localStorage.getItem('hustlehub-custom-gig-types');
    const savedCategories = localStorage.getItem('hustlehub-custom-categories');
    
    if (savedGigTypes) {
        try {
            customGigTypes = JSON.parse(savedGigTypes);
            updateGigTypeOptions();
        } catch (error) {
            console.error('Error loading custom gig types:', error);
        }
    }
    
    if (savedCategories) {
        try {
            customCategories = JSON.parse(savedCategories);
            updateCategoryOptions();
        } catch (error) {
            console.error('Error loading custom categories:', error);
        }
    }
}

// Show the add transaction form
function showAddForm(transactionId = null) {
    editingTransactionId = transactionId;
    document.getElementById('add-form-modal').style.display = 'flex';
    
    if (transactionId) {
        // Edit mode - populate form with existing data
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            document.querySelector('.modal-header h2').innerHTML = '<i class="fas fa-edit"></i> Edit Transaction';
            document.getElementById('date-input').value = transaction.date;
            document.getElementById('type-select').value = transaction.type;
            document.getElementById('category-select').value = transaction.category;
            document.getElementById('amount-input').value = Math.abs(transaction.amount).toFixed(2);
            document.getElementById('description-input').value = transaction.description;
            document.querySelector('.form-actions button[type="submit"]').innerHTML = '<i class="fas fa-check"></i> Update Transaction';
        }
    } else {
        // Add mode - reset form
        document.querySelector('.modal-header h2').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Transaction';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date-input').value = today;
        document.getElementById('type-select').value = '';
        document.getElementById('category-select').value = '';
        document.getElementById('amount-input').value = '';
        document.getElementById('description-input').value = '';
        document.querySelector('.form-actions button[type="submit"]').innerHTML = '<i class="fas fa-check"></i> Add Transaction';
    }
    document.getElementById('type-select').focus();
}

// Hide the add transaction form
function hideAddForm() {
    document.getElementById('add-form-modal').style.display = 'none';
    editingTransactionId = null;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('date-input').value;
    const type = document.getElementById('type-select').value;
    const category = document.getElementById('category-select').value;
    let amount = parseFloat(document.getElementById('amount-input').value);
    const description = document.getElementById('description-input').value;

    if (isNaN(amount) || amount === 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (category === 'Expense' || category === 'Fees' || category === 'Supplies' || category === 'Transportation') {
        amount = -Math.abs(amount);
    }

    if (editingTransactionId) {
        // Edit mode - update existing transaction
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                date: date,
                type: type,
                category: category,
                amount: amount,
                description: description || `${category} from ${type}`
            };
        }
    } else {
        // Add mode - create new transaction
        const newTransaction = {
            id: Date.now(),
            date: date,
            type: type,
            category: category,
            amount: amount,
            description: description || `${category} from ${type}`
        };
        transactions.push(newTransaction);
    }

    saveData();
    renderTable();
    updateSummary();
    hideAddForm();
}

// Render the table with all transactions
function renderTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    // Filter transactions based on active filters
    const filteredTransactions = transactions.filter(transaction => {
        // Check gig type
        if (!activeFilters.gigTypes.includes(transaction.type)) {
            return false;
        }

        // Check category
        if (!activeFilters.categories.includes(transaction.category)) {
            return false;
        }

        // Check amount range
        const absAmount = Math.abs(transaction.amount);
        if (activeFilters.minAmount !== null && absAmount < activeFilters.minAmount) {
            return false;
        }
        if (activeFilters.maxAmount !== null && absAmount > activeFilters.maxAmount) {
            return false;
        }

        return true;
    });

    if (filteredTransactions.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="5">No transactions match your filters. Try adjusting the filters or click "Reset Filters".</td>';
        tableBody.appendChild(emptyRow);
        return;
    }

    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        if (transaction.amount > 0) {
            row.className = 'income-row';
        } else {
            row.className = 'expense-row';
        }

        const dateObj = new Date(transaction.date);
        const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
        
        const formattedDate = adjustedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });

        const formattedAmount = transaction.amount >= 0 
            ? `+$${transaction.amount.toFixed(2)}` 
            : `-$${Math.abs(transaction.amount).toFixed(2)}`;

        row.innerHTML = `
            <td class="date-col">${formattedDate}</td>
            <td class="type-col">${transaction.type}</td>
            <td class="category-col">${transaction.category}</td>
            <td class="amount-col">${formattedAmount}</td>
            <td class="actions-col">
                <button class="action-btn edit-btn" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    addRowActionListeners();
}

function addRowActionListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteTransaction(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            showAddForm(id);
        });
    });
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveData();
        renderTable();
        updateSummary();
    }
}

function clearAllTransactions() {
    if (transactions.length === 0) {
        alert('There are no transactions to clear.');
        return;
    }

    if (confirm('Are you sure you want to clear ALL transactions? This cannot be undone.')) {
        transactions = [];
        saveData();
        renderTable();
        updateSummary();
    }
}

function toggleColumnVisibility() {
    const column = this.getAttribute('data-column');
    const isVisible = this.checked;
    const columnClass = `${column}-col`;
    const elements = document.querySelectorAll(`.${columnClass}`);

    elements.forEach(element => {
        element.style.display = isVisible ? '' : 'none';
    });
}

// Filter Modal Functions
function showFilterModal() {
    document.getElementById('filter-modal').style.display = 'flex';
    
    // Set current filter states in checkboxes
    document.querySelectorAll('.gig-type-filter').forEach(checkbox => {
        checkbox.checked = activeFilters.gigTypes.includes(checkbox.value);
    });
    
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.checked = activeFilters.categories.includes(checkbox.value);
    });
    
    // Set amount range values
    document.getElementById('min-amount-filter').value = activeFilters.minAmount || '';
    document.getElementById('max-amount-filter').value = activeFilters.maxAmount || '';
}

function hideFilterModal() {
    document.getElementById('filter-modal').style.display = 'none';
}

function applyFilters() {
    // Get selected gig types
    activeFilters.gigTypes = Array.from(document.querySelectorAll('.gig-type-filter:checked'))
        .map(checkbox => checkbox.value);
    
    // Get selected categories
    activeFilters.categories = Array.from(document.querySelectorAll('.category-filter:checked'))
        .map(checkbox => checkbox.value);
    
    // Get amount range
    const minAmount = parseFloat(document.getElementById('min-amount-filter').value);
    const maxAmount = parseFloat(document.getElementById('max-amount-filter').value);
    
    activeFilters.minAmount = isNaN(minAmount) ? null : minAmount;
    activeFilters.maxAmount = isNaN(maxAmount) ? null : maxAmount;
    
    // Validate amount range
    if (activeFilters.minAmount !== null && activeFilters.maxAmount !== null) {
        if (activeFilters.minAmount > activeFilters.maxAmount) {
            alert('Minimum amount cannot be greater than maximum amount.');
            return;
        }
    }
    
    // Re-render table with filters
    renderTable();
    hideFilterModal();
}

function resetFilters() {
    // Reset to default (all checked)
    activeFilters.gigTypes = ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other'];
    activeFilters.categories = ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation'];
    activeFilters.minAmount = null;
    activeFilters.maxAmount = null;
    
    // Update UI
    document.querySelectorAll('.gig-type-filter').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    document.getElementById('min-amount-filter').value = '';
    document.getElementById('max-amount-filter').value = '';
    
    // Re-render table
    renderTable();
}

function updateSummary() {
    if (transactions.length === 0) {
        document.getElementById('total-income').textContent = '$0.00';
        document.getElementById('total-expenses').textContent = '$0.00';
        return;
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
        if (transaction.amount > 0) {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += Math.abs(transaction.amount);
        }
    });

    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('hustlehub-transactions', JSON.stringify(transactions));
}

// Load data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('hustlehub-transactions');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            transactions = parsedData;
            return true;
        } catch (error) {
            console.error('Error loading saved data:', error);
            return false;
        }
    }
    return false;
}

// ==========================================
// AI ASSISTANT LOGIC (Design Alternative 3)
// ==========================================

const aiToggle = document.getElementById('ai-toggle-btn');
const aiWindow = document.getElementById('ai-chat-window');
const aiClose = document.getElementById('ai-close-btn');
const aiInput = document.getElementById('ai-input');
const aiSend = document.getElementById('ai-send-btn');
const aiMessages = document.getElementById('ai-messages');

// Check if elements exist (in case HTML wasn't updated yet)
if (aiToggle) {
    aiToggle.addEventListener('click', () => aiWindow.style.display = 'flex');
    aiClose.addEventListener('click', () => aiWindow.style.display = 'none');
    aiSend.addEventListener('click', handleAiMessage);
    aiInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleAiMessage(); });
}

function handleAiMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    aiInput.value = '';

    setTimeout(() => {
        processAiCommand(text);
    }, 800);
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = text;
    aiMessages.appendChild(div);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

function processAiCommand(text) {
    const lower = text.toLowerCase();
    let type = 'Other';
    let category = 'Expense';
    let amount = 0;
    let desc = text;

    if (lower.includes('uber') || lower.includes('drive')) type = 'Uber';
    if (lower.includes('dash') || lower.includes('delivery')) type = 'DoorDash';
    if (lower.includes('ebay') || lower.includes('sold')) { type = 'eBay'; category = 'Income'; }
    if (lower.includes('freelance') || lower.includes('project')) { type = 'Freelance'; category = 'Income'; }
    
    if (lower.includes('made') || lower.includes('earned') || lower.includes('sold')) category = 'Income';
    
    const moneyMatch = text.match(/\$?(\d+(\.\d{1,2})?)/);
    if (moneyMatch) {
        amount = parseFloat(moneyMatch[1]);
    } else {
        addMessage("I couldn't understand the amount. Try saying 'Made $50 on Uber'.", 'bot');
        return;
    }

    if (category === 'Expense' || lower.includes('spent') || lower.includes('gas') || lower.includes('fees') || lower.includes('paid')) {
        category = 'Expense';
        amount = -Math.abs(amount);
        if (lower.includes('gas')) { category = 'Transportation'; desc = 'Gas'; }
        if (lower.includes('fees')) { category = 'Fees'; }
    } else {
        category = 'Income';
        amount = Math.abs(amount);
    }

    const newTx = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: type,
        category: category,
        amount: amount,
        description: desc
    };

    transactions.push(newTx);
    saveData();
    renderTable();
    updateSummary();

    addMessage(`Got it! I logged a ${category} of $${Math.abs(amount)} for ${type}.`, 'bot');
}