// Main Application
document.addEventListener('DOMContentLoaded', function() {
    // 1. Setup Event Listeners first
    setupEventListeners();
    
    // 2. Set the date
    setCurrentDate();

    // 3. Try to load data from LocalStorage
    const hasSavedData = loadSavedData();

    // 4. ONLY if no data was found, load the sample data
    if (!hasSavedData) {
        addSampleData();
    }

    // 5. Render everything
    renderTable();
    updateSummary();
    updateCharts(); // Initialize charts
});

// Variables to store transactions
let transactions = [];
let editingTransactionId = null;

// Active filters
let activeFilters = {
    gigTypes: ['DoorDash', 'Uber', 'eBay', 'Freelance', 'Other'],
    categories: ['Income', 'Expense', 'Fees', 'Supplies', 'Transportation'],
    minAmount: null,
    maxAmount: null
};

// Chart instances
let incomeChart = null;
let monthlyChart = null;
let trendChart = null;

// Current month for monthly chart
let currentChartMonth = new Date().getMonth();
let currentChartYear = new Date().getFullYear();

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

    // Chart Controls
    document.getElementById('chart-period')?.addEventListener('change', updateCharts);
    document.getElementById('prev-month-btn')?.addEventListener('click', () => navigateMonth(-1));
    document.getElementById('next-month-btn')?.addEventListener('click', () => navigateMonth(1));
    document.getElementById('trend-period')?.addEventListener('change', updateCharts);
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
    updateCharts(); // Update charts when data is added/edited
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
        updateCharts(); // Update charts when data is deleted
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
        updateCharts(); // Update charts when all data is cleared
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
        document.getElementById('weekly-net').textContent = '$0.00';
        document.getElementById('monthly-net').textContent = '$0.00';
        document.getElementById('total-income').textContent = '$0.00';
        document.getElementById('total-expenses').textContent = '$0.00';
        document.getElementById('weekly-net').className = 'amount';
        document.getElementById('monthly-net').className = 'amount';
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

    // Calculate weekly net (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let weeklyNet = 0;

    // Calculate monthly net (last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    let monthlyNet = 0;

    transactions.forEach(transaction => {
        const tDate = new Date(transaction.date);
        const adjustedDate = new Date(tDate.getTime() + (tDate.getTimezoneOffset() * 60000));

        if (adjustedDate >= oneWeekAgo) weeklyNet += transaction.amount;
        if (adjustedDate >= oneMonthAgo) monthlyNet += transaction.amount;
    });

    document.getElementById('weekly-net').textContent = `$${weeklyNet.toFixed(2)}`;
    document.getElementById('monthly-net').textContent = `$${monthlyNet.toFixed(2)}`;
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;

    document.getElementById('weekly-net').className = weeklyNet >= 0 ? 'amount positive' : 'amount negative';
    document.getElementById('monthly-net').className = monthlyNet >= 0 ? 'amount positive' : 'amount negative';
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
// CHART FUNCTIONS
// ==========================================

// Update all charts
function updateCharts() {
    updateIncomeChart();
    updateMonthlyChart();
    updateTrendChart();
}

// Update income by gig type chart
function updateIncomeChart() {
    const period = document.getElementById('chart-period').value;
    const filteredTransactions = filterTransactionsByPeriod(period);
    
    // Group income by gig type
    const incomeByType = {};
    
    filteredTransactions.forEach(transaction => {
        if (transaction.amount > 0) { // Only income
            if (!incomeByType[transaction.type]) {
                incomeByType[transaction.type] = 0;
            }
            incomeByType[transaction.type] += transaction.amount;
        }
    });
    
    const types = Object.keys(incomeByType);
    const amounts = Object.values(incomeByType);
    
    // Colors for chart
    const colors = [
        '#4361ee',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
    ];
    
    const ctx = document.getElementById('income-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    incomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: types,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, types.length),
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = amounts.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update monthly performance chart
function updateMonthlyChart() {
    // Update month label
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('current-month-label').textContent = 
        `${monthNames[currentChartMonth]} ${currentChartYear}`;
    
    // Get transactions for current month
    const monthTransactions = transactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getMonth() === currentChartMonth && 
               date.getFullYear() === currentChartYear;
    });
    
    // Group by day
    const daysInMonth = new Date(currentChartYear, currentChartMonth + 1, 0).getDate();
    const dailyIncome = new Array(daysInMonth).fill(0);
    const dailyExpenses = new Array(daysInMonth).fill(0);
    
    monthTransactions.forEach(transaction => {
        const day = new Date(transaction.date).getDate() - 1; // 0-indexed
        if (transaction.amount > 0) {
            dailyIncome[day] += transaction.amount;
        } else {
            dailyExpenses[day] += Math.abs(transaction.amount);
        }
    });
    
    // Create labels (1, 2, 3, ...)
    const labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: dailyIncome,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Expenses',
                    data: dailyExpenses,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Day of Month'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Update weekly trend chart
function updateTrendChart() {
    const weeks = parseInt(document.getElementById('trend-period').value);
    
    // Calculate data for last N weeks
    const weeklyData = [];
    const weekLabels = [];
    
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Calculate weekly net
        let weeklyNet = 0;
        transactions.forEach(transaction => {
            const tDate = new Date(transaction.date);
            if (tDate >= weekStart && tDate <= weekEnd) {
                weeklyNet += transaction.amount;
            }
        });
        
        weeklyData.push(weeklyNet);
        
        // Create label (e.g., "Jan 1-7")
        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
        const startDay = weekStart.getDate();
        const endDay = weekEnd.getDate();
        weekLabels.push(`${startMonth} ${startDay}-${endDay}`);
    }
    
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekLabels,
            datasets: [{
                label: 'Weekly Net Profit',
                data: weeklyData,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Net Profit ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const profit = context.raw;
                            const profitText = profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`;
                            return `Net Profit: ${profitText}`;
                        }
                    }
                }
            }
        }
    });
}

// Navigate between months
function navigateMonth(direction) {
    currentChartMonth += direction;
    
    // Handle year wrap-around
    if (currentChartMonth < 0) {
        currentChartMonth = 11;
        currentChartYear--;
    } else if (currentChartMonth > 11) {
        currentChartMonth = 0;
        currentChartYear++;
    }
    
    updateMonthlyChart();
}

// Filter transactions by time period
function filterTransactionsByPeriod(period) {
    const now = new Date();
    
    switch(period) {
        case 'week':
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return transactions.filter(t => new Date(t.date) >= oneWeekAgo);
            
        case 'month':
            const oneMonthAgo = new Date(now);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return transactions.filter(t => new Date(t.date) >= oneMonthAgo);
            
        case 'all':
        default:
            return transactions;
    }
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
    updateCharts(); // Update charts when AI adds data

    addMessage(`Got it! I logged a ${category} of $${Math.abs(amount)} for ${type}.`, 'bot');
}