// Global API Configuration (Using jsonblob.com for free cloud syncing)
// This enables any user around the world to enter the family code and sync real-time
const API_BASE = 'https://jsonblob.com/api/jsonBlob';

const AppState = {
    familyCode: null, // Now stores the global Blob ID
    currentFamily: null, // Remote data
    currentUser: null,
    syncInterval: null,

    init() {
        // Load only the connection config, real data comes from Cloud
        const data = localStorage.getItem('familyExpenseRemoteConfig');
        if (data) {
            const parsed = JSON.parse(data);
            this.familyCode = parsed.familyCode || null;
            this.currentUser = parsed.currentUser || null;
        }

        if (this.familyCode) {
            this.startSync();
        } else {
            renderDashboard(); // render onboarding
        }
    },

    saveConfig() {
        localStorage.setItem('familyExpenseRemoteConfig', JSON.stringify({
            familyCode: this.familyCode,
            currentUser: this.currentUser
        }));
    },

    async fetchFamilyData(code) {
        try {
            const res = await fetch(`${API_BASE}/${code}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error('Not found');
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async setFamilyData(code, data) {
        try {
            await fetch(`${API_BASE}/${code}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            return true;
        } catch (e) {
            return false;
        }
    },

    async createFamilyData(data) {
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            const location = res.headers.get('Location');
            return location ? location.split('/').pop() : null;
        } catch (e) {
            return null;
        }
    },

    startSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.sync(); // immediate fetch
        
        // Auto-refresh every 3.5 seconds to simulate real-time sockets
        this.syncInterval = setInterval(() => {
            this.sync(true);
        }, 3500); 
    },

    stopSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = null;
    },

    async sync(silent = false) {
        if (!this.familyCode) return;
        const data = await this.fetchFamilyData(this.familyCode);
        if (data) {
            this.currentFamily = data;
            renderDashboard();
        } else if (!silent) {
            showToast('Failed to sync. Verify internet connection.', 'error');
        }
    },

    clear() {
        localStorage.removeItem('familyExpenseRemoteConfig');
        this.familyCode = null;
        this.currentFamily = null;
        this.currentUser = null;
        this.stopSync();
    }
};

// DOM Elements
const els = {
    onboardingScreen: document.getElementById('onboarding-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    initialBudget: document.getElementById('initial-budget'),
    creatorName: document.getElementById('creator-name'),
    generateCodeBtn: document.getElementById('generate-code-btn'),
    
    joinCode: document.getElementById('join-code'),
    joinName: document.getElementById('join-name'),
    joinFamilyBtn: document.getElementById('join-family-btn'),
    
    displayFamilyCode: document.getElementById('display-family-code'),
    copyCodeBtn: document.getElementById('copy-code-btn'),
    currentUserAvatar: document.getElementById('current-user-avatar'),
    currentUsername: document.getElementById('current-username'),
    logoutBtn: document.getElementById('logout-btn'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    
    statTotalBudget: document.getElementById('stat-total-budget'),
    statTotalExpenses: document.getElementById('stat-total-expenses'),
    statRemainingBalance: document.getElementById('stat-remaining-balance'),
    
    expenseForm: document.getElementById('expense-form'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseDesc: document.getElementById('expense-desc'),
    expenseCategory: document.getElementById('expense-category'),
    
    membersList: document.getElementById('members-list'),
    expenseList: document.getElementById('expense-list'),
    
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

const showToast = (message, type = 'success') => {
    const icon = type === 'success' ? 'ri-check-line' : 'ri-error-warning-line';
    els.toast.innerHTML = `<i class="${icon}"></i> ${message}`;
    els.toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
};

const setBtnLoading = (btn, isLoading, originalText = '') => {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processing...`;
        return btn.innerText;
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
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
    if (!AppState.familyCode || !AppState.currentFamily) {
        els.onboardingScreen.classList.add('active');
        els.dashboardScreen.classList.remove('active');
        return;
    }

    els.onboardingScreen.classList.remove('active');
    els.dashboardScreen.classList.add('active');

    const family = AppState.currentFamily;

    els.displayFamilyCode.innerHTML = `${AppState.familyCode}`;
    els.currentUsername.innerText = AppState.currentUser;
    els.currentUserAvatar.innerText = getInitials(AppState.currentUser);
    els.currentUserAvatar.style.background = getRandomColor(AppState.currentUser);

    const totalExpenses = family.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const remaining = family.totalBudget - totalExpenses;

    els.statTotalBudget.innerText = formatMoney(family.totalBudget);
    els.statTotalExpenses.innerText = formatMoney(totalExpenses);
    els.statRemainingBalance.innerText = formatMoney(remaining);

    if (remaining < 0) els.statRemainingBalance.style.color = 'var(--warning)';
    else els.statRemainingBalance.style.color = '';

    els.membersList.innerHTML = '';
    family.members.forEach(member => {
        const li = document.createElement('li');
        li.className = 'member-item';
        const memExps = family.expenses.filter(e => e.memberName === member).length;
        li.innerHTML = `
            <div class="member-avatar" style="background: ${getRandomColor(member)}">${getInitials(member)}</div>
            <div style="flex: 1;">
                <h4 style="font-size: 0.95rem;">${member}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${memExps} expenses logged</p>
            </div>
        `;
        els.membersList.appendChild(li);
    });

    if (family.expenses.length === 0) {
        els.expenseList.innerHTML = `
            <div class="empty-state">
                <i class="ri-file-list-3-line"></i>
                <p>No expenses logged yet.</p>
            </div>
        `;
    } else {
        els.expenseList.innerHTML = '';
        const sortedExpenses = [...family.expenses].sort((a,b) => new Date(b.date) - new Date(a.date));
        
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

els.generateCodeBtn.addEventListener('click', async () => {
    const budget = parseFloat(els.initialBudget.value);
    const creatorName = els.creatorName.value.trim();

    if (!budget || budget <= 0) return showToast('Please enter a valid budget', 'error');
    if (!creatorName) return showToast('Please enter your name', 'error');

    const origText = setBtnLoading(els.generateCodeBtn, true);
    
    const initialData = {
        totalBudget: budget,
        members: [creatorName],
        expenses: []
    };
    
    const code = await AppState.createFamilyData(initialData);
    if (!code) {
        setBtnLoading(els.generateCodeBtn, false, 'Generate Family Code <i class="ri-arrow-right-line"></i>');
        return showToast('Failed to create family online. Check connection.', 'error');
    }

    AppState.familyCode = code;
    AppState.currentUser = creatorName;
    AppState.currentFamily = initialData;
    AppState.saveConfig();
    AppState.startSync();
    
    setBtnLoading(els.generateCodeBtn, false, 'Generate Family Code <i class="ri-arrow-right-line"></i>');
    showToast('Global Family Session Created!');
    renderDashboard();
});

els.joinFamilyBtn.addEventListener('click', async () => {
    const code = els.joinCode.value.trim(); // Code is now a UUID
    const name = els.joinName.value.trim();

    if (!code) return showToast('Please enter a family code', 'error');
    if (!name) return showToast('Please enter your name', 'error');

    const origText = setBtnLoading(els.joinFamilyBtn, true);

    const remoteData = await AppState.fetchFamilyData(code);
    
    if (remoteData) {
        if (!remoteData.members.includes(name)) {
            remoteData.members.push(name);
            await AppState.setFamilyData(code, remoteData);
        }
        
        AppState.familyCode = code;
        AppState.currentUser = name;
        AppState.currentFamily = remoteData;
        AppState.saveConfig();
        AppState.startSync();
        
        setBtnLoading(els.joinFamilyBtn, false, 'Join Family <i class="ri-arrow-right-line"></i>');
        showToast('Joined global family session!');
        renderDashboard();
    } else {
        setBtnLoading(els.joinFamilyBtn, false, 'Join Family <i class="ri-arrow-right-line"></i>');
        showToast('Invalid Family Code. Family not found in cloud.', 'error');
    }
});

els.copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(AppState.familyCode).then(() => {
        showToast('Global Code copied to clipboard!');
    });
});

els.expenseForm.addEventListener('submit', async (e) => {
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

    // Grab latest data before adding expense to avoid overwriting others simultaneously logging
    const latestData = await AppState.fetchFamilyData(AppState.familyCode);
    if (!latestData) return showToast('Error: Cloud session disconnected', 'error');
    
    latestData.expenses.push(newExpense);
    const success = await AppState.setFamilyData(AppState.familyCode, latestData);
    
    if (success) {
        AppState.currentFamily = latestData;
        showToast('Expense synced globally!');
        els.expenseForm.reset();
        renderDashboard();
    } else {
        showToast('Failed to sync expense', 'error');
    }
});

els.showAddMemberBtn.addEventListener('click', () => {
    els.addMemberForm.classList.toggle('hidden');
    if (!els.addMemberForm.classList.contains('hidden')) {
        els.newMemberName.focus();
    }
});

els.addMemberBtn.addEventListener('click', async () => {
    const newName = els.newMemberName.value.trim();
    if (!newName) return;
    
    if (AppState.currentFamily.members.includes(newName)) {
        return showToast('Member already exists', 'error');
    }

    const latestData = await AppState.fetchFamilyData(AppState.familyCode);
    if (!latestData) return showToast('Error: Cloud session disconnected', 'error');
    
    if (!latestData.members.includes(newName)) {
        latestData.members.push(newName);
        const success = await AppState.setFamilyData(AppState.familyCode, latestData);
        if (success) {
            AppState.currentFamily = latestData;
            els.newMemberName.value = '';
            els.addMemberForm.classList.add('hidden');
            showToast('Member added globally!');
            renderDashboard();
        }
    }
});

els.logoutBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to log out of this family session?')) {
        AppState.clear();
        els.onboardingScreen.classList.add('active');
        els.dashboardScreen.classList.remove('active');
        els.joinCode.value = '';
        els.joinName.value = '';
    }
});

els.clearDataBtn.addEventListener('click', () => {
    if(confirm('Developer Action: Disconnect local device from global session?')) {
        AppState.clear();
        renderDashboard();
        showToast('Device disconnected.');
    }
});

// Init
AppState.init();
