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
  updateChart();
});

// Variables to store transactions
let transactions = [];

// Set current date in header
function setCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// Add sample data for demo (Only runs if storage is empty)
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
}

// Show the add transaction form
function showAddForm() {
  document.getElementById('add-form-modal').style.display = 'flex';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date-input').value = today;
  document.getElementById('type-select').value = '';
  document.getElementById('category-select').value = '';
  document.getElementById('amount-input').value = '';
  document.getElementById('description-input').value = '';
  document.getElementById('type-select').focus();
}

// Hide the add transaction form
function hideAddForm() {
  document.getElementById('add-form-modal').style.display = 'none';
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

  const newTransaction = {
    id: Date.now(),
    date: date,
    type: type,
    category: category,
    amount: amount,
    description: description || `${category} from ${type}`
  };

  transactions.push(newTransaction);
  saveData();
  renderTable();
  updateSummary();
  hideAddForm();
  
  // Removed the "Success" alert to make the demo faster/smoother
}

// Render the table with all transactions
function renderTable() {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  if (transactions.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-row';
    emptyRow.innerHTML = '<td colspan="5">No transactions yet. Click "Add New Transaction" to get started!</td>';
    tableBody.appendChild(emptyRow);
    return;
  }

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedTransactions.forEach(transaction => {
    const row = document.createElement('tr');
    if (transaction.amount > 0) {
      row.className = 'income-row';
    } else {
      row.className = 'expense-row';
    }

    const dateObj = new Date(transaction.date);
    // Fix date time zone offset issue
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
  updateChart(); // Update chart after rendering table
}

function addRowActionListeners() {
  // Delete Button Logic
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      deleteTransaction(id);
    });
  });

  // Edit Button Logic (FIXED)
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      const transaction = transactions.find(t => t.id === id);
      
      if (transaction) {
        // 1. Open the form
        showAddForm();
        
        // 2. Fill the form with existing data
        document.getElementById('date-input').value = transaction.date;
        document.getElementById('type-select').value = transaction.type;
        document.getElementById('category-select').value = transaction.category;
        document.getElementById('amount-input').value = Math.abs(transaction.amount); // Always show positive in input
        document.getElementById('description-input').value = transaction.description;
        
        // 3. Delete the old one immediately (so saving creates the "updated" version)
        // Note: In a real app, you'd update the ID, but for a demo, this is a safe hack.
        transactions = transactions.filter(t => t.id !== id);
      }
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
    saveData(); // Will save an empty array
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
    // Create date object from string YYYY-MM-DD
    const tDate = new Date(transaction.date);
    // Fix timezone issue for accurate comparison
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
// RETURNS: true if data was found, false if not
function loadSavedData() {
  const savedData = localStorage.getItem('hustlehub-transactions');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      transactions = parsedData;
      return true; // Found data
    } catch (error) {
      console.error('Error loading saved data:', error);
      return false;
    }
  }
  return false; // No data found
}


/* ==========================================
   AI ASSISTANT LOGIC (Design Alternative 3)
   ========================================== */

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

  // 1. Add User Message
  addMessage(text, 'user');
  aiInput.value = '';

  // 2. Simulate AI Thinking
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

  // Simple "Mock AI" keyword detection
  if (lower.includes('uber') || lower.includes('drive')) type = 'Uber';
  if (lower.includes('dash') || lower.includes('delivery')) type = 'DoorDash';
  if (lower.includes('ebay') || lower.includes('sold')) { type = 'eBay'; category = 'Income'; }
  if (lower.includes('freelance') || lower.includes('project')) { type = 'Freelance'; category = 'Income'; }
  
  if (lower.includes('made') || lower.includes('earned') || lower.includes('sold')) category = 'Income';
  
  // Extract number (e.g., "made $50" or "50.20")
  const moneyMatch = text.match(/\$?(\d+(\.\d{1,2})?)/);
  if (moneyMatch) {
    amount = parseFloat(moneyMatch[1]);
  } else {
    addMessage("I couldn't understand the amount. Try saying 'Made $50 on Uber'.", 'bot');
    return;
  }

  // Fix sign based on category
  if (category === 'Expense' || lower.includes('spent') || lower.includes('gas') || lower.includes('fees') || lower.includes('paid')) {
    category = 'Expense';
    amount = -Math.abs(amount);
    if (lower.includes('gas')) { category = 'Transportation'; desc = 'Gas'; }
    if (lower.includes('fees')) { category = 'Fees'; }
  } else {
    category = 'Income';
    amount = Math.abs(amount);
  }

  // 3. Create Transaction
  const newTx = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    type: type,
    category: category,
    amount: amount,
    description: desc
  };

  // 4. Push and Save
  transactions.push(newTx);
  saveData(); // Save immediately!
  renderTable();
  updateSummary();

  addMessage(`Got it! I logged a ${category} of $${Math.abs(amount)} for ${type}.`, 'bot');
}

let myChart = null; // Global variable

function updateChart() {
  const ctx = document.getElementById('profitChart');
  if (!ctx) return; // Guard clause in case HTML isn't there

  // 1. Group data by Gig Type
  const totals = {};
  transactions.forEach(t => {
    if (!totals[t.type]) totals[t.type] = 0;
    totals[t.type] += t.amount;
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = data.map(val => val >= 0 ? '#10b981' : '#ef4444'); // Green if profit, Red if loss

  // 2. Destroy old chart if exists
  if (myChart) myChart.destroy();

  // 3. Create new Chart
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Net Profit ($)',
        data: data,
        backgroundColor: colors,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Profitability by Gig' }
      }
    }
  });
}
