document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expenseForm');
    const expenseDescription = document.getElementById('expenseDescription');
    const expenseAmount = document.getElementById('expenseAmount');
    const expenseDate = document.getElementById('expenseDate');
    const expenseList = document.getElementById('expenseList');
    const currentMonthTotalDisplay = document.getElementById('currentMonthTotal');
    const currentMonthYearDisplay = document.getElementById('currentMonthYear');
    const historyList = document.getElementById('historyList');
    const resetMonthBtn = document.getElementById('resetMonthBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    expenseDate.value = new Date().toISOString().split('T')[0];

    let allExpenses = []; 
    let currentActiveMonth = '';

    const generateId = () => {
        return Math.random().toString(36).substr(2, 9);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getMonthYear = (dateString = null) => {
        const date = dateString ? new Date(dateString) : new Date();
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    const formatMonthYearName = (monthYearString) => {
        const [year, monthNum] = monthYearString.split('-');
        const monthName = new Date(year, monthNum - 1, 1).toLocaleString('en-IN', { month: 'long' });
        return `${monthName} ${year}`;
    };

    const loadMonthForView = (monthKey) => {
        currentActiveMonth = monthKey;
        saveData();
        renderAll();
    };

    const loadData = () => {
        const storedAllExpenses = localStorage.getItem('allExpenses');
        const storedCurrentActiveMonth = localStorage.getItem('currentActiveMonth');

        if (storedAllExpenses) {
            allExpenses = JSON.parse(storedAllExpenses);
        }

        const todayMonth = getMonthYear();
        if (storedCurrentActiveMonth && storedCurrentActiveMonth !== todayMonth) {
            alert(`Welcome to ${formatMonthYearName(todayMonth)}! Your spending for the previous month has been archived in history.`);
            currentActiveMonth = todayMonth;
        } else if (storedCurrentActiveMonth) {
            currentActiveMonth = storedCurrentActiveMonth;
        } else {
            currentActiveMonth = todayMonth;
        }
        
        saveData();
        renderAll();
    };

    const saveData = () => {
        localStorage.setItem('allExpenses', JSON.stringify(allExpenses));
        localStorage.setItem('currentActiveMonth', currentActiveMonth);
    };

    const renderAll = () => {
        renderExpenses();
        updateTotalDisplay();
        renderHistory();
    };
    
    const addExpense = (description, amount, date) => {
        const newExpense = {
            id: generateId(),
            description,
            amount: parseFloat(amount),
            date: date 
        };
        allExpenses.push(newExpense);
        saveData();
        renderAll();

        const expenseMonth = getMonthYear(date);
        if (expenseMonth !== currentActiveMonth) {
            alert(`Expense for ${formatMonthYearName(expenseMonth)} has been added and updated in history.`);
        }
    };

    const deleteExpense = (id) => {
        allExpenses = allExpenses.filter(expense => expense.id !== id);
        saveData();
        renderAll();
    };

    const getExpensesForCurrentMonth = () => {
        return allExpenses.filter(expense => getMonthYear(expense.date) === currentActiveMonth);
    };

    const calculateTotal = () => {
        const currentMonthExpenses = getExpensesForCurrentMonth();
        return currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    };

    const renderExpenses = () => {
        expenseList.innerHTML = '';
        const currentMonthExpenses = getExpensesForCurrentMonth();

        if (currentMonthExpenses.length === 0) {
            expenseList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">No expenses yet for this month.</td>
                </tr>
            `;
            resetMonthBtn.classList.add('d-none');
            return;
        }

        currentMonthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        currentMonthExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.description}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${expense.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            expenseList.appendChild(row);
        });

        resetMonthBtn.classList.remove('d-none');
    };

    const updateTotalDisplay = () => {
        const total = calculateTotal();
        currentMonthTotalDisplay.textContent = formatCurrency(total);
        currentMonthYearDisplay.textContent = formatMonthYearName(currentActiveMonth);
    };

    const rebuildHistoryFromExpenses = () => {
        const tempHistoryMap = {};
        allExpenses.forEach(expense => {
            const monthYear = getMonthYear(expense.date);
            if (monthYear !== getMonthYear()) {
                if (!tempHistoryMap[monthYear]) {
                    tempHistoryMap[monthYear] = 0;
                }
                tempHistoryMap[monthYear] += expense.amount;
            }
        });

        const history = Object.keys(tempHistoryMap).map(month => ({
            month: month,
            total: tempHistoryMap[month]
        }));
        
        history.sort((a, b) => b.month.localeCompare(a.month));

        return history;
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        const historyData = rebuildHistoryFromExpenses();

        if (historyData.length === 0) {
            historyList.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted">No history yet.</td>
                </tr>
            `;
            clearHistoryBtn.classList.add('d-none');
            return;
        }

        historyData.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.month = item.month;
            if (item.month === currentActiveMonth) {
                row.classList.add('table-primary'); 
            }
            row.innerHTML = `
                <td>${formatMonthYearName(item.month)}</td>
                <td>${formatCurrency(item.total)}</td>
            `;
            historyList.appendChild(row);
        });

        clearHistoryBtn.classList.remove('d-none');
    };

    const resetMonthManually = () => {
        if (confirm('Are you sure you want to manually reset the month? This will move the current month\'s expenses to the spending history.')) {
            const totalSpentArchivedMonth = calculateTotal();
            const archivedMonthName = formatMonthYearName(currentActiveMonth);
            
            const nextMonthDate = new Date();
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
            currentActiveMonth = getMonthYear(nextMonthDate.toISOString().split('T')[0]);

            saveData();
            
            renderAll();
            
            if (totalSpentArchivedMonth > 0) {
                alert(`Month reset! Your total of ${formatCurrency(totalSpentArchivedMonth)} for ${archivedMonthName} has been moved to history.`);
            } else {
                alert(`Month reset! No expenses to move to history for ${archivedMonthName}.`);
            }
        }
    };

    const clearAllHistory = () => {
        if (confirm('Are you sure you want to clear ALL monthly spending history? This will permanently delete past expense records. This action cannot be undone.')) {
            allExpenses = allExpenses.filter(expense => getMonthYear(expense.date) === currentActiveMonth);
            saveData();
            renderAll();
            alert('Monthly spending history has been cleared.');
        }
    };

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = expenseDescription.value.trim();
        const amount = expenseAmount.value.trim();
        const date = expenseDate.value;

        if (description && amount > 0 && date) {
            addExpense(description, amount, date);
            expenseDescription.value = '';
            expenseAmount.value = '';
            expenseDescription.focus();
        } else {
            alert('Please enter a description, a valid amount, and select a date.');
        }
    });

    expenseList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const idToDelete = deleteButton.dataset.id;
            deleteExpense(idToDelete);
        }
    });

    resetMonthBtn.addEventListener('click', resetMonthManually);
    clearHistoryBtn.addEventListener('click', clearAllHistory);
    historyList.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.month) {
            loadMonthForView(row.dataset.month);
        }
    });

    loadData();
});