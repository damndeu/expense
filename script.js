// State Management (using LocalStorage for persistence in this prototype)
const AppState = {
    familyCode: null,
    totalBudget: 0,
    currentUser: null,
    members: [],
    expenses: [],

    init() {
        const data = localStorage.getItem('familyExpenseData');
        if (data) {
            const parsed = JSON.parse(data);
            this.familyCode = parsed.familyCode;
            this.totalBudget = parsed.totalBudget;
            this.currentUser = parsed.currentUser;
            this.members = parsed.members || [];
            this.expenses = parsed.expenses || [];
        }
    },

    save() {
        localStorage.setItem('familyExpenseData', JSON.stringify({
            familyCode: this.familyCode,
            totalBudget: this.totalBudget,
            currentUser: this.currentUser,
            members: this.members,
            expenses: this.expenses
        }));
    },

    clear() {
        localStorage.removeItem('familyExpenseData');
        this.familyCode = null;
        this.totalBudget = 0;
        this.currentUser = null;
        this.members = [];
        this.expenses = [];
    }
};

// DOM Elements
const els = {
    onboardingScreen: document.getElementById('onboarding-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Create Family
    initialBudget: document.getElementById('initial-budget'),
    creatorName: document.getElementById('creator-name'),
    generateCodeBtn: document.getElementById('generate-code-btn'),
    
    // Join Family
    joinCode: document.getElementById('join-code'),
    joinName: document.getElementById('join-name'),
    joinFamilyBtn: document.getElementById('join-family-btn'),
    
    // Dashboard Header
    displayFamilyCode: document.getElementById('display-family-code'),
    copyCodeBtn: document.getElementById('copy-code-btn'),
    currentUserAvatar: document.getElementById('current-user-avatar'),
    currentUsername: document.getElementById('current-username'),
    logoutBtn: document.getElementById('logout-btn'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    
    // Stats
    statTotalBudget: document.getElementById('stat-total-budget'),
    statTotalExpenses: document.getElementById('stat-total-expenses'),
    statRemainingBalance: document.getElementById('stat-remaining-balance'),
    
    // Expense Form
    expenseForm: document.getElementById('expense-form'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseDesc: document.getElementById('expense-desc'),
    expenseCategory: document.getElementById('expense-category'),
    
    // Lists
    membersList: document.getElementById('members-list'),
    expenseList: document.getElementById('expense-list'),
    
    // Add Member mini form
    showAddMemberBtn: document.getElementById('show-add-member-btn'),
    addMemberForm: document.getElementById('add-member-form'),
    newMemberName: document.getElementById('new-member-name'),
    addMemberBtn: document.getElementById('add-member-btn'),
    
    toast: document.getElementById('toast')
};

// Formatting utilities
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
};

const getRandomColor = (name) => {
    // Simple hash to consistently assign a color to a name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#f97316'];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const getCategoryIcon = (category) => {
    const icons = {
        'Groceries': 'ri-shopping-basket-line',
        'Utilities': 'ri-lightbulb-flash-line',
        'Entertainment': 'ri-film-line',
        'Health': 'ri-heart-pulse-line',
        'Other': 'ri-price-tag-3-line'
    };
    return icons[category] || icons['Other'];
};

const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// UI Interactions
const showToast = (message, type = 'success') => {
    const icon = type === 'success' ? 'ri-check-line' : 'ri-error-warning-line';
    els.toast.innerHTML = `<i class="${icon}"></i> ${message}`;
    els.toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
};

const switchTab = (tabId) => {
    els.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    els.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
};

const renderDashboard = () => {
    if (!AppState.familyCode) {
        els.onboardingScreen.classList.add('active');
        els.dashboardScreen.classList.remove('active');
        return;
    }

    els.onboardingScreen.classList.remove('active');
    els.dashboardScreen.classList.add('active');

    // Header
    els.displayFamilyCode.innerText = AppState.familyCode;
    els.currentUsername.innerText = AppState.currentUser;
    els.currentUserAvatar.innerText = getInitials(AppState.currentUser);
    els.currentUserAvatar.style.background = getRandomColor(AppState.currentUser);

    // Calculate Totals
    const totalExpenses = AppState.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const remaining = AppState.totalBudget - totalExpenses;

    els.statTotalBudget.innerText = formatMoney(AppState.totalBudget);
    els.statTotalExpenses.innerText = formatMoney(totalExpenses);
    els.statRemainingBalance.innerText = formatMoney(remaining);

    // Update color based on remaining
    if (remaining < 0) {
        els.statRemainingBalance.style.color = 'var(--warning)';
    } else {
        els.statRemainingBalance.style.color = '';
    }

    // Render Members
    els.membersList.innerHTML = '';
    AppState.members.forEach(member => {
        const li = document.createElement('li');
        li.className = 'member-item';
        // count expenses for member
        const memExps = AppState.expenses.filter(e => e.memberName === member).length;
        li.innerHTML = `
            <div class="member-avatar" style="background: ${getRandomColor(member)}">${getInitials(member)}</div>
            <div style="flex: 1;">
                <h4 style="font-size: 0.95rem;">${member}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${memExps} expenses logged</p>
            </div>
        `;
        els.membersList.appendChild(li);
    });

    // Render Expenses
    if (AppState.expenses.length === 0) {
        els.expenseList.innerHTML = `
            <div class="empty-state">
                <i class="ri-file-list-3-line"></i>
                <p>No expenses logged yet.</p>
            </div>
        `;
    } else {
        els.expenseList.innerHTML = '';
        // Sort descending by date
        const sortedExpenses = [...AppState.expenses].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        sortedExpenses.forEach(exp => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <div class="expense-info">
                    <div class="expense-icon">
                        <i class="${getCategoryIcon(exp.category)}"></i>
                    </div>
                    <div class="expense-details">
                        <h4>${exp.description || exp.category}</h4>
                        <div class="expense-meta">
                            <span>${exp.memberName}</span>
                            <span class="dot"></span>
                            <span>${formatDate(exp.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="expense-amount">- ${formatMoney(exp.amount)}</div>
            `;
            els.expenseList.appendChild(div);
        });
    }
};

// Event Listeners
els.tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        switchTab(e.target.dataset.tab);
    });
});

els.generateCodeBtn.addEventListener('click', () => {
    const budget = parseFloat(els.initialBudget.value);
    const creatorName = els.creatorName.value.trim();

    if (!budget || budget <= 0) return showToast('Please enter a valid budget', 'error');
    if (!creatorName) return showToast('Please enter your name', 'error');

    AppState.familyCode = generateRandomCode();
    AppState.totalBudget = budget;
    AppState.currentUser = creatorName;
    AppState.members = [creatorName];
    AppState.expenses = [];
    
    AppState.save();
    showToast('Family created successfully!');
    renderDashboard();
});

els.joinFamilyBtn.addEventListener('click', () => {
    const code = els.joinCode.value.trim().toUpperCase();
    const name = els.joinName.value.trim();

    if (!code) return showToast('Please enter a family code', 'error');
    if (!name) return showToast('Please enter your name', 'error');

    // In a real app, we would fetch from DB here.
    // For prototype, we either use local state if it matches, or mock joining.
    if (AppState.familyCode && AppState.familyCode === code) {
        // App exists logically
        if (!AppState.members.includes(name)) {
            AppState.members.push(name);
        }
        AppState.currentUser = name;
        AppState.save();
        showToast('Joined family successfully!');
        renderDashboard();
    } else {
        // Mock join scenario if local storage doesn't have it (Simulating joining a friend's code that we don't hold locally)
        AppState.familyCode = code;
        AppState.totalBudget = 5000; // Mock budget
        AppState.currentUser = name;
        AppState.members = ['Mom', 'Dad', name]; // Mock members
        AppState.expenses = [];
        AppState.save();
        showToast('Joined family (Mock DB)!');
        renderDashboard();
    }
});

els.copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(AppState.familyCode).then(() => {
        showToast('Code copied to clipboard!');
    });
});

els.expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(els.expenseAmount.value);
    const desc = els.expenseDesc.value.trim();
    const category = els.expenseCategory.value;

    if (!amount || amount <= 0) return showToast('Invalid amount', 'error');
    if (!desc) return showToast('Description needed', 'error');

    const newExpense = {
        id: Date.now().toString(),
        amount: amount,
        description: desc,
        category: category,
        memberName: AppState.currentUser,
        date: new Date().toISOString()
    };

    AppState.expenses.push(newExpense);
    AppState.save();
    
    showToast('Expense added!');
    els.expenseForm.reset();
    renderDashboard();
});

els.showAddMemberBtn.addEventListener('click', () => {
    els.addMemberForm.classList.toggle('hidden');
    if (!els.addMemberForm.classList.contains('hidden')) {
        els.newMemberName.focus();
    }
});

els.addMemberBtn.addEventListener('click', () => {
    const newName = els.newMemberName.value.trim();
    if (!newName) return;
    
    if (AppState.members.includes(newName)) {
        return showToast('Member already exists', 'error');
    }

    AppState.members.push(newName);
    AppState.save();
    els.newMemberName.value = '';
    els.addMemberForm.classList.add('hidden');
    showToast('Member added!');
    renderDashboard();
});

els.logoutBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to log out of this family?')) {
        AppState.currentUser = null;
        // Don't clear data, just log out user locally. Usually you'd clear entirely and drop to login.
        els.onboardingScreen.classList.add('active');
        els.dashboardScreen.classList.remove('active');
    }
});

els.clearDataBtn.addEventListener('click', () => {
    if(confirm('Developer Action: Clear all local storage data forever?')) {
        AppState.clear();
        renderDashboard();
        showToast('Data cleared.');
    }
});

// Init
AppState.init();
renderDashboard();
