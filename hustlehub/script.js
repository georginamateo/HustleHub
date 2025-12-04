// Main Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initializeApp();
    
    // Set today's date in the header
    setCurrentDate();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load any saved data from localStorage
    loadSavedData();
    
    // Load custom items
    loadCustomItems();
    
    // Update summary calculations
    updateSummary();
});

// Variables to store transactions
let transactions = [];
let editingTransactionId = null; // Track if we're editing an existing transaction
let activeFilters = {
    gigTypes: ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other'],
    categories: ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation'],
    minAmount: null,
    maxAmount: null
};

// Store custom gig types and categories
let customGigTypes = ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other'];
let customCategories = ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation'];

// Initialize the app
function initializeApp() {
    // Add some sample data for demo purposes
    if (transactions.length === 0) {
        addSampleData();
    }
}

// Set current date in header
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// Add sample data for demo
function addSampleData() {
    const sampleTransactions = [
        { id: 1, date: '2025-01-15', type: 'DoorDash', category: 'Income', amount: 45.20, description: 'Lunch deliveries' },
        { id: 2, date: '2025-01-16', type: 'DoorDash', category: 'Income', amount: 37.20, description: 'Dinner shift' },
        { id: 3, date: '2025-01-18', type: 'Uber', category: 'Income', amount: 68.50, description: 'Airport trip' },
        { id: 4, date: '2025-01-19', type: 'Other', category: 'Expense', amount: -56.00, description: 'Gas refill' },
        { id: 5, date: '2025-01-20', type: 'eBay', category: 'Income', amount: 100.50, description: 'Sold vintage jacket' },
        { id: 6, date: '2025-01-21', type: 'eBay', category: 'Fees', amount: -12.00, description: 'eBay seller fee' }
    ];
    
    transactions = sampleTransactions;
    renderTable();
}

// Set up all event listeners
function setupEventListeners() {
    // Hamburger Menu
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const menuDropdown = document.getElementById('menu-dropdown');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            hamburgerBtn.classList.toggle('active');
            menuDropdown.classList.toggle('show');
        });
    }
    
    // Menu Items
    const menuCreate = document.getElementById('menu-create');
    const menuEditDelete = document.getElementById('menu-edit-delete');
    
    if (menuCreate) {
        menuCreate.addEventListener('click', function() {
            closeHamburgerMenu();
            showCreateItemForm();
        });
    }
    
    const menuNetWorth = document.getElementById('menu-net-worth');
    if (menuNetWorth) {
        menuNetWorth.addEventListener('click', function() {
            closeHamburgerMenu();
            // Navigate to net worth page
            window.location.href = 'networth.html';
        });
    }
    
    // Create Item Modal Buttons
    document.getElementById('close-create-item-btn').addEventListener('click', hideCreateItemForm);
    document.getElementById('cancel-create-item-btn').addEventListener('click', hideCreateItemForm);
    
    // Create Item Form Submission
    document.getElementById('create-item-form').addEventListener('submit', handleCreateItemSubmit);
    
    // Net Worth Modal Button
    document.getElementById('close-net-worth-btn').addEventListener('click', hideNetWorthModal);
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (menuDropdown && !hamburgerBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            closeHamburgerMenu();
        }
    });
    
    // Filter Button
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', showFilterMenu);
    } else {
        console.error('Filter button not found!');
    }
    
    // Add Row Button
    const addBtn = document.getElementById('add-row-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            console.log('Add button clicked!');
            showAddForm();
        });
    } else {
        console.error('Add button not found!');
    }
    
    // Close Modal Buttons
    document.getElementById('close-modal-btn').addEventListener('click', hideAddForm);
    document.getElementById('cancel-btn').addEventListener('click', hideAddForm);
    document.getElementById('close-filter-btn').addEventListener('click', hideFilterMenu);
    
    // Form Submission
    document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
    
    // Filter Actions
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
    
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
    
    document.getElementById('filter-menu-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideFilterMenu();
        }
    });
    
    document.getElementById('create-item-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideCreateItemForm();
        }
    });
    
    document.getElementById('net-worth-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideNetWorthModal();
        }
    });
}

// Close hamburger menu
function closeHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const menuDropdown = document.getElementById('menu-dropdown');
    
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove('active');
    }
    if (menuDropdown) {
        menuDropdown.classList.remove('show');
    }
}

// Show create item form
function showCreateItemForm() {
    document.getElementById('create-item-modal').style.display = 'flex';
    document.getElementById('item-type-select').value = '';
    document.getElementById('item-name-input').value = '';
}

// Hide create item form
function hideCreateItemForm() {
    document.getElementById('create-item-modal').style.display = 'none';
}

// Show net worth modal
function showNetWorthModal() {
    // Calculate weekly net (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let weeklyNet = 0;
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= oneWeekAgo) {
            weeklyNet += transaction.amount;
        }
    });
    
    // Calculate monthly net (last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    let monthlyNet = 0;
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= oneMonthAgo) {
            monthlyNet += transaction.amount;
        }
    });
    
    // Update modal content
    const weeklyElement = document.getElementById('modal-weekly-net');
    const monthlyElement = document.getElementById('modal-monthly-net');
    
    weeklyElement.textContent = `$${weeklyNet.toFixed(2)}`;
    weeklyElement.className = weeklyNet >= 0 ? 'net-amount positive' : 'net-amount negative';
    
    monthlyElement.textContent = `$${monthlyNet.toFixed(2)}`;
    monthlyElement.className = monthlyNet >= 0 ? 'net-amount positive' : 'net-amount negative';
    
    // Show modal
    document.getElementById('net-worth-modal').style.display = 'flex';
}

// Hide net worth modal
function hideNetWorthModal() {
    document.getElementById('net-worth-modal').style.display = 'none';
}

// Handle create item form submission
function handleCreateItemSubmit(e) {
    e.preventDefault();
    
    const itemType = document.getElementById('item-type-select').value;
    const itemName = document.getElementById('item-name-input').value.trim();
    
    if (!itemName) {
        alert('Please enter a name for the item.');
        return;
    }
    
    // Case-insensitive duplicate check
    let isDuplicate = false;
    let existingList = [];
    
    if (itemType === 'gigType') {
        existingList = customGigTypes;
    } else if (itemType === 'category') {
        existingList = customCategories;
    }
    
    // Check for duplicates (case-insensitive)
    isDuplicate = existingList.some(item => item.toLowerCase() === itemName.toLowerCase());
    
    if (isDuplicate) {
        alert(`Error: "${itemName}" already exists! Please choose a different name.\n\nNote: Names are case-insensitive (e.g., "DoorDash" and "doordash" are considered the same).`);
        return;
    }
    
    // Add the new item
    if (itemType === 'gigType') {
        customGigTypes.push(itemName);
        activeFilters.gigTypes.push(itemName);
        updateGigTypeOptions();
        alert(`Success! New Gig Type "${itemName}" has been created.`);
    } else if (itemType === 'category') {
        customCategories.push(itemName);
        activeFilters.categories.push(itemName);
        updateCategoryOptions();
        alert(`Success! New Category "${itemName}" has been created.`);
    }
    
    // Save to localStorage
    saveCustomItems();
    
    // Hide the form
    hideCreateItemForm();
}

// Update gig type options in forms and filters
function updateGigTypeOptions() {
    // Update transaction form dropdown
    const typeSelect = document.getElementById('type-select');
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Select gig type...</option>';
        customGigTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    }
    
    // Update filter checkboxes
    const filterContainer = document.querySelector('.gig-type-filter')?.parentElement?.parentElement;
    if (filterContainer) {
        filterContainer.innerHTML = '';
        customGigTypes.forEach(type => {
            const label = document.createElement('label');
            label.className = 'filter-checkbox';
            label.innerHTML = `
                <input type="checkbox" class="gig-type-filter" value="${type}" checked>
                <span>${type}</span>
            `;
            filterContainer.appendChild(label);
        });
    }
}

// Update category options in forms and filters
function updateCategoryOptions() {
    // Update transaction form dropdown
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select category...</option>';
        customCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
    
    // Update filter checkboxes
    const filterContainer = document.querySelector('.category-filter')?.parentElement?.parentElement;
    if (filterContainer) {
        filterContainer.innerHTML = '';
        customCategories.forEach(category => {
            const label = document.createElement('label');
            label.className = 'filter-checkbox';
            label.innerHTML = `
                <input type="checkbox" class="category-filter" value="${category}" checked>
                <span>${category}</span>
            `;
            filterContainer.appendChild(label);
        });
    }
}

// Save custom items to localStorage
function saveCustomItems() {
    localStorage.setItem('hustlehub-custom-gig-types', JSON.stringify(customGigTypes));
    localStorage.setItem('hustlehub-custom-categories', JSON.stringify(customCategories));
}

// Load custom items from localStorage
function loadCustomItems() {
    const savedGigTypes = localStorage.getItem('hustlehub-custom-gig-types');
    const savedCategories = localStorage.getItem('hustlehub-custom-categories');
    
    if (savedGigTypes) {
        try {
            customGigTypes = JSON.parse(savedGigTypes);
            activeFilters.gigTypes = [...customGigTypes];
            updateGigTypeOptions();
        } catch (error) {
            console.error('Error loading custom gig types:', error);
        }
    }
    
    if (savedCategories) {
        try {
            customCategories = JSON.parse(savedCategories);
            activeFilters.categories = [...customCategories];
            updateCategoryOptions();
        } catch (error) {
            console.error('Error loading custom categories:', error);
        }
    }
}

// Show the filter menu
function showFilterMenu() {
    document.getElementById('filter-menu-modal').style.display = 'flex';
}

// Hide the filter menu
function hideFilterMenu() {
    document.getElementById('filter-menu-modal').style.display = 'none';
}

// Apply filters to the table
function applyFilters() {
    // Get selected gig types
    const gigTypeCheckboxes = document.querySelectorAll('.gig-type-filter:checked');
    activeFilters.gigTypes = Array.from(gigTypeCheckboxes).map(cb => cb.value);
    
    // Get selected categories
    const categoryCheckboxes = document.querySelectorAll('.category-filter:checked');
    activeFilters.categories = Array.from(categoryCheckboxes).map(cb => cb.value);
    
    // Get amount range
    const minAmount = document.getElementById('min-amount').value;
    const maxAmount = document.getElementById('max-amount').value;
    activeFilters.minAmount = minAmount ? parseFloat(minAmount) : null;
    activeFilters.maxAmount = maxAmount ? parseFloat(maxAmount) : null;
    
    // Hide the filter menu
    hideFilterMenu();
    
    // Re-render the table with filters applied
    renderTable();
}

// Reset all filters
function resetFilters() {
    // Reset gig type checkboxes
    document.querySelectorAll('.gig-type-filter').forEach(cb => cb.checked = true);
    
    // Reset category checkboxes
    document.querySelectorAll('.category-filter').forEach(cb => cb.checked = true);
    
    // Reset amount inputs
    document.getElementById('min-amount').value = '';
    document.getElementById('max-amount').value = '';
    
    // Reset active filters
    activeFilters = {
        gigTypes: ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other'],
        categories: ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation'],
        minAmount: null,
        maxAmount: null
    };
    
    // Re-render the table
    renderTable();
}

// Show the add transaction form
function showAddForm(transactionId = null) {
    const modal = document.getElementById('add-form-modal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    const modalHeader = modal.querySelector('.modal-header h2');
    const submitBtn = modal.querySelector('button[type="submit"]');
    
    modal.style.display = 'flex';
    
    if (transactionId) {
        // Edit mode
        editingTransactionId = transactionId;
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (transaction) {
            // Update modal title and button
            modalHeader.innerHTML = '<i class="fas fa-edit"></i> Edit Transaction';
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Transaction';
            
            // Populate form with existing data
            document.getElementById('date-input').value = transaction.date;
            document.getElementById('type-select').value = transaction.type;
            document.getElementById('category-select').value = transaction.category;
            // Show absolute value for amount (remove negative sign)
            document.getElementById('amount-input').value = Math.abs(transaction.amount).toFixed(2);
            document.getElementById('description-input').value = transaction.description;
        }
    } else {
        // Add mode
        editingTransactionId = null;
        
        // Update modal title and button
        modalHeader.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Transaction';
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Add Transaction';
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date-input').value = today;
        
        // Clear form fields except date
        document.getElementById('type-select').value = '';
        document.getElementById('category-select').value = '';
        document.getElementById('amount-input').value = '';
        document.getElementById('description-input').value = '';
    }
    
    // Focus on first field
    document.getElementById('type-select').focus();
}

// Hide the add transaction form
function hideAddForm() {
    document.getElementById('add-form-modal').style.display = 'none';
    editingTransactionId = null; // Reset editing state
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('date-input').value;
    const type = document.getElementById('type-select').value;
    const category = document.getElementById('category-select').value;
    let amount = parseFloat(document.getElementById('amount-input').value);
    const description = document.getElementById('description-input').value;
    
    // Validate amount
    if (isNaN(amount) || amount === 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Make amount negative for expenses/fees
    if (category === 'Expense' || category === 'Fees' || category === 'Supplies' || category === 'Transportation') {
        amount = -Math.abs(amount);
    }
    
    if (editingTransactionId) {
        // Edit mode - update existing transaction
        const transactionIndex = transactions.findIndex(t => t.id === editingTransactionId);
        
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                date: date,
                type: type,
                category: category,
                amount: amount,
                description: description || `${category} from ${type}`
            };
            
            // Show success message
            alert('Transaction updated successfully!');
        }
    } else {
        // Add mode - create new transaction
        const newTransaction = {
            id: Date.now(), // Simple ID using timestamp
            date: date,
            type: type,
            category: category,
            amount: amount,
            description: description || `${category} from ${type}`
        };
        
        // Add to transactions array
        transactions.push(newTransaction);
        
        // Show success message
        alert('Transaction added successfully!');
    }
    
    // Save to localStorage
    saveData();
    
    // Update the table
    renderTable();
    
    // Update summary
    updateSummary();
    
    // Hide the form
    hideAddForm();
}

// Render the table with all transactions
function renderTable() {
    const tableBody = document.getElementById('table-body');
    
    // Clear existing rows (except empty row message)
    tableBody.innerHTML = '';
    
    if (transactions.length === 0) {
        // Show empty message
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="5">No transactions yet. Click "Add New Transaction" to get started!</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Apply filters
    let filteredTransactions = transactions.filter(transaction => {
        // Filter by gig type
        if (!activeFilters.gigTypes.includes(transaction.type)) {
            return false;
        }
        
        // Filter by category
        if (!activeFilters.categories.includes(transaction.category)) {
            return false;
        }
        
        // Filter by amount range
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
        // Show empty message
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="5">No transactions match the current filters. Try adjusting your filters.</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add each transaction as a row
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Add class based on income/expense
        if (transaction.amount > 0) {
            row.className = 'income-row';
        } else {
            row.className = 'expense-row';
        }
        
        // Format date for display
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Format amount for display
        const formattedAmount = transaction.amount >= 0 
            ? `+$${transaction.amount.toFixed(2)}` 
            : `-$${Math.abs(transaction.amount).toFixed(2)}`;
        
        // Create row HTML
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
    
    // Add event listeners to edit and delete buttons
    addRowActionListeners();
}

// Add event listeners to edit and delete buttons in table rows
function addRowActionListeners() {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteTransaction(id);
        });
    });
    
    // Edit buttons (basic implementation - you can expand this)
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editTransaction(id);
        });
    });
}

// Edit a transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    
    if (transaction) {
        showAddForm(id);
    } else {
        alert('Transaction not found!');
    }
}

// Delete a transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        // Filter out the transaction with the given id
        transactions = transactions.filter(transaction => transaction.id !== id);
        
        // Save to localStorage
        saveData();
        
        // Update the table
        renderTable();
        
        // Update summary
        updateSummary();
        
        // Show confirmation
        alert('Transaction deleted successfully!');
    }
}

// Clear all transactions
function clearAllTransactions() {
    if (transactions.length === 0) {
        alert('There are no transactions to clear.');
        return;
    }
    
    if (confirm('Are you sure you want to clear ALL transactions? This cannot be undone.')) {
        transactions = [];
        
        // Save to localStorage
        saveData();
        
        // Update the table
        renderTable();
        
        // Update summary
        updateSummary();
        
        // Show confirmation
        alert('All transactions cleared!');
    }
}

// Toggle column visibility based on checkbox
function toggleColumnVisibility() {
    const column = this.getAttribute('data-column');
    const isVisible = this.checked;
    
    // Show/hide all cells in this column
    const columnClass = `${column}-col`;
    const elements = document.querySelectorAll(`.${columnClass}`);
    
    elements.forEach(element => {
        element.style.display = isVisible ? '' : 'none';
    });
}

// Update the summary dashboard
function updateSummary() {
    if (transactions.length === 0) {
        // Reset all to zero
        document.getElementById('weekly-net').textContent = '$0.00';
        document.getElementById('monthly-net').textContent = '$0.00';
        document.getElementById('total-income').textContent = '$0.00';
        document.getElementById('total-expenses').textContent = '$0.00';
        return;
    }
    
    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.amount > 0) {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += Math.abs(transaction.amount);
        }
    });
    
    const totalNet = totalIncome - totalExpenses;
    
    // Calculate weekly net (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let weeklyNet = 0;
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= oneWeekAgo) {
            weeklyNet += transaction.amount;
        }
    });
    
    // Calculate monthly net (last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    let monthlyNet = 0;
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= oneMonthAgo) {
            monthlyNet += transaction.amount;
        }
    });
    
    // Update the DOM
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
            
            // Only load if we have data and no sample data is already loaded
            if (parsedData.length > 0 && transactions.length === 0) {
                transactions = parsedData;
                renderTable();
                updateSummary();
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}