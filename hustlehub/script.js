// Main Application
document.addEventListener('DOMContentLoaded', function() {
    // 1. Setup Event Listeners first
    setupEventListeners();
    
    // 2. Set the date
    setCurrentDate();

    // 3. Try to load data from LocalStorage
    loadSavedData();
    loadCustomItems(); // Load custom gig types and categories (this will call update functions)

    // 4. Render everything
    renderTable();
    updateSummary();
});

// Variables to store transactions
let transactions = [];
let editingTransactionId = null;

// Custom items storage
let customGigTypes = [];
let customCategories = [];

// Active filters - initialize with all default filters enabled
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

// Set up all event listeners
function setupEventListeners() {
    // Hamburger Menu
    document.getElementById('hamburger-btn')?.addEventListener('click', toggleHamburgerMenu);
    document.getElementById('create-item-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        showCreateItemModal();
    });
    document.getElementById('delete-item-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        showDeleteItemModal();
    });

    // Create Item Modal
    document.getElementById('close-create-item-btn')?.addEventListener('click', hideCreateItemModal);
    document.getElementById('cancel-create-item-btn')?.addEventListener('click', hideCreateItemModal);
    document.getElementById('create-item-form')?.addEventListener('submit', handleCreateItemSubmit);

    // Delete Item Modal
    document.getElementById('close-delete-item-btn')?.addEventListener('click', hideDeleteItemModal);
    document.getElementById('cancel-delete-item-btn')?.addEventListener('click', hideDeleteItemModal);
    document.getElementById('delete-item-form')?.addEventListener('submit', handleDeleteItemSubmit);
    document.getElementById('delete-item-type-select')?.addEventListener('change', updateDeleteItemOptions);

    // Transaction form code removed
    
    // New Transaction Form
    document.getElementById('add-row-btn')?.addEventListener('click', showTransactionModal);
    document.getElementById('close-transaction-modal')?.addEventListener('click', hideTransactionModal);
    document.getElementById('cancel-transaction-btn')?.addEventListener('click', hideTransactionModal);
    document.getElementById('new-transaction-form')?.addEventListener('submit', handleTransactionSubmit);
    
    // Close modal when clicking outside
    document.getElementById('transaction-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideTransactionModal();
        }
    });

    // Clear All Button
    document.getElementById('clear-btn').addEventListener('click', clearAllTransactions);

    // Column Toggle Checkboxes
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', toggleColumnVisibility);
    });

    // Modal click outside code removed

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
        // Add to active filters
        activeFilters.gigTypes.push(itemName);
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
        // Add to active filters
        activeFilters.categories.push(itemName);
        updateCategoryOptions();
        alert(`Category "${itemName}" has been created!`);
    }
    
    saveCustomItems();
    hideCreateItemModal();
}

// Delete Item Modal Functions
function showDeleteItemModal() {
    document.getElementById('delete-item-modal').style.display = 'flex';
    document.getElementById('delete-item-type-select').value = '';
    document.getElementById('delete-item-select-group').style.display = 'none';
    // Close hamburger menu
    document.getElementById('hamburger-btn').classList.remove('active');
    document.getElementById('menu-dropdown').classList.remove('active');
}

function hideDeleteItemModal() {
    document.getElementById('delete-item-modal').style.display = 'none';
}

function updateDeleteItemOptions() {
    const itemType = document.getElementById('delete-item-type-select').value;
    const selectGroup = document.getElementById('delete-item-select-group');
    const itemSelect = document.getElementById('delete-item-name-select');
    
    if (!itemType) {
        selectGroup.style.display = 'none';
        return;
    }
    
    selectGroup.style.display = 'block';
    itemSelect.innerHTML = '<option value="">Select item...</option>';
    
    if (itemType === 'gigtype') {
        if (customGigTypes.length === 0) {
            itemSelect.innerHTML = '<option value="">No custom gig types to delete</option>';
            return;
        }
        customGigTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            itemSelect.appendChild(option);
        });
    } else if (itemType === 'category') {
        if (customCategories.length === 0) {
            itemSelect.innerHTML = '<option value="">No custom categories to delete</option>';
            return;
        }
        customCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            itemSelect.appendChild(option);
        });
    }
}

function handleDeleteItemSubmit(e) {
    e.preventDefault();
    
    const itemType = document.getElementById('delete-item-type-select').value;
    const itemName = document.getElementById('delete-item-name-select').value;
    
    if (!itemName || itemName === 'No custom gig types to delete' || itemName === 'No custom categories to delete') {
        return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`);
    if (!confirmDelete) {
        return;
    }
    
    if (itemType === 'gigtype') {
        // Check if any transactions use this gig type
        const transactionsWithType = transactions.filter(t => t.type === itemName);
        if (transactionsWithType.length > 0) {
            const confirmWithTransactions = confirm(
                `Warning: ${transactionsWithType.length} transaction(s) use this gig type. ` +
                `Deleting it will not remove these transactions, but you won't be able to create new ones with this type. ` +
                `Continue with deletion?`
            );
            if (!confirmWithTransactions) {
                return;
            }
        }
        
        customGigTypes = customGigTypes.filter(type => type !== itemName);
        updateGigTypeOptions();
        alert(`Gig Type "${itemName}" has been deleted!`);
    } else if (itemType === 'category') {
        // Check if any transactions use this category
        const transactionsWithCategory = transactions.filter(t => t.category === itemName);
        if (transactionsWithCategory.length > 0) {
            const confirmWithTransactions = confirm(
                `Warning: ${transactionsWithCategory.length} transaction(s) use this category. ` +
                `Deleting it will not remove these transactions, but you won't be able to create new ones with this category. ` +
                `Continue with deletion?`
            );
            if (!confirmWithTransactions) {
                return;
            }
        }
        
        customCategories = customCategories.filter(category => category !== itemName);
        updateCategoryOptions();
        alert(`Category "${itemName}" has been deleted!`);
    }
    
    saveCustomItems();
    hideDeleteItemModal();
}

function updateGigTypeOptions() {
    const typeSelect = document.getElementById('transaction-gig-type');
    if (!typeSelect) {
        console.error('transaction-gig-type element not found');
        return;
    }
    
    const filterCheckboxContainer = document.querySelector('.gig-type-filter')?.parentElement.parentElement;
    
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
    
    // Update filter checkboxes - clear and rebuild all
    if (filterCheckboxContainer) {
        filterCheckboxContainer.innerHTML = '';
        allGigTypes.forEach(type => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'gig-type-filter';
            checkbox.value = type;
            checkbox.checked = activeFilters.gigTypes.includes(type);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + type));
            filterCheckboxContainer.appendChild(label);
        });
    }
}

function updateCategoryOptions() {
    const categorySelect = document.getElementById('transaction-category');
    if (!categorySelect) {
        console.error('transaction-category element not found');
        return;
    }
    
    const filterCheckboxContainer = document.querySelector('.category-filter')?.parentElement.parentElement;
    
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
    
    // Update filter checkboxes - clear and rebuild all
    if (filterCheckboxContainer) {
        filterCheckboxContainer.innerHTML = '';
        allCategories.forEach(category => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'category-filter';
            checkbox.value = category;
            checkbox.checked = activeFilters.categories.includes(category);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + category));
            filterCheckboxContainer.appendChild(label);
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
        } catch (error) {
            console.error('Error loading custom gig types:', error);
        }
    }
    
    if (savedCategories) {
        try {
            customCategories = JSON.parse(savedCategories);
        } catch (error) {
            console.error('Error loading custom categories:', error);
        }
    }
    
    // Add custom items to activeFilters if not already there
    customGigTypes.forEach(type => {
        if (!activeFilters.gigTypes.includes(type)) {
            activeFilters.gigTypes.push(type);
        }
    });
    
    customCategories.forEach(category => {
        if (!activeFilters.categories.includes(category)) {
            activeFilters.categories.push(category);
        }
    });
    
    // Update options after loading
    updateGigTypeOptions();
    updateCategoryOptions();
}

// Show the add transaction form
// Transaction form functions removed

// Show transaction modal
function showTransactionModal() {
    editingTransactionId = null;
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('new-transaction-form');
    const modalHeader = document.querySelector('#transaction-modal .modal-header h2');
    const submitButton = document.querySelector('#new-transaction-form button[type="submit"]');
    
    if (modal && form) {
        // Reset form
        form.reset();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
        
        // Update header and button for add mode
        if (modalHeader) {
            modalHeader.innerHTML = '<i class="fas fa-plus-circle"></i> New Transaction';
        }
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-check"></i> Add Transaction';
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Focus on gig type field
        setTimeout(() => document.getElementById('transaction-gig-type').focus(), 100);
    }
}

// Edit transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    editingTransactionId = id;
    const modal = document.getElementById('transaction-modal');
    const modalHeader = document.querySelector('#transaction-modal .modal-header h2');
    const submitButton = document.querySelector('#new-transaction-form button[type="submit"]');
    
    if (modal) {
        // Populate form with transaction data
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-gig-type').value = transaction.type;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-amount').value = Math.abs(transaction.amount).toFixed(2);
        document.getElementById('transaction-description').value = transaction.description;
        
        // Update header and button for edit mode
        if (modalHeader) {
            modalHeader.innerHTML = '<i class="fas fa-edit"></i> Edit Transaction';
        }
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-check"></i> Update Transaction';
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Focus on gig type field
        setTimeout(() => document.getElementById('transaction-gig-type').focus(), 100);
    }
}

// Hide transaction modal
function hideTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle transaction form submission
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const date = formData.get('date');
    const gigType = formData.get('gigType');
    const category = formData.get('category');
    let amount = parseFloat(formData.get('amount'));
    const description = formData.get('description');
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }
    
    // Make expenses negative
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
                type: gigType,
                category: category,
                amount: amount,
                description: description || `${category} from ${gigType}`
            };
        }
        
        // Save and update display
        saveData();
        renderTable();
        updateSummary();
        
        // Close modal and show success message
        hideTransactionModal();
        alert('Transaction updated successfully!');
    } else {
        // Add mode - create new transaction
        const newTransaction = {
            id: Date.now(),
            date: date,
            type: gigType,
            category: category,
            amount: amount,
            description: description || `${category} from ${gigType}`
        };
        
        transactions.push(newTransaction);
        
        // Save and update display
        saveData();
        renderTable();
        updateSummary();
        
        // Close modal and show success message
        hideTransactionModal();
        alert('Transaction added successfully!');
    }
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

        // Add description row if description exists
        if (transaction.description && transaction.description.trim() !== '') {
            const descRow = document.createElement('tr');
            descRow.className = transaction.amount > 0 ? 'income-row description-row' : 'expense-row description-row';
            descRow.innerHTML = `
                <td colspan="5" class="description-cell">
                    <span class="description-text">${transaction.description}</span>
                </td>
            `;
            tableBody.appendChild(descRow);
        }
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
            editTransaction(id);
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
    // Collect all available gig types (default + custom)
    const allGigTypes = ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other', ...customGigTypes];
    
    // Collect all available categories (default + custom)
    const allCategories = ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation', ...customCategories];
    
    // Reset to all checked
    activeFilters.gigTypes = allGigTypes;
    activeFilters.categories = allCategories;
    activeFilters.minAmount = null;
    activeFilters.maxAmount = null;
    
    // Update UI - check all checkboxes
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
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    } else {
        // Add sample data if no saved data exists
        addSampleData();
    }
}

// Add sample transaction data
function addSampleData() {
    transactions = [
        { id: 1, date: '2024-11-05', type: 'DoorDash', category: 'Income', amount: 45.50, description: 'Dinner delivery shift' },
        { id: 2, date: '2024-11-08', type: 'Uber', category: 'Income', amount: 78.25, description: 'Weekend rides' },
        { id: 3, date: '2024-11-10', type: 'DoorDash', category: 'Expense', amount: -12.00, description: 'Gas for deliveries' },
        { id: 4, date: '2024-11-12', type: 'eBay', category: 'Income', amount: 125.00, description: 'Sold vintage camera' },
        { id: 5, date: '2024-11-15', type: 'Freelance', category: 'Income', amount: 250.00, description: 'Website design project' },
        { id: 6, date: '2024-11-18', type: 'DoorDash', category: 'Fees', amount: -5.50, description: 'Platform service fee' },
        { id: 7, date: '2024-11-20', type: 'Uber', category: 'Income', amount: 92.75, description: 'Airport trips' },
        { id: 8, date: '2024-11-22', type: 'eBay', category: 'Supplies', amount: -25.00, description: 'Shipping materials' },
        { id: 9, date: '2024-11-25', type: 'DoorDash', category: 'Income', amount: 67.00, description: 'Holiday dinner rush' },
        { id: 10, date: '2024-11-28', type: 'Freelance', category: 'Income', amount: 180.00, description: 'Logo design' },
        { id: 11, date: '2024-12-01', type: 'Uber', category: 'Transportation', amount: -30.00, description: 'Car maintenance' },
        { id: 12, date: '2024-12-02', type: 'DoorDash', category: 'Income', amount: 55.25, description: 'Lunch delivery shift' },
        { id: 13, date: '2024-12-03', type: 'eBay', category: 'Income', amount: 95.00, description: 'Sold collectible toy' },
        { id: 14, date: '2024-12-04', type: 'Other', category: 'Income', amount: 50.00, description: 'Pet sitting' },
        { id: 15, date: '2024-12-04', type: 'DoorDash', category: 'Expense', amount: -18.50, description: 'Gas refill' }
    ];
    saveData();
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