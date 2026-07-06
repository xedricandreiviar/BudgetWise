
  // ===== LOCAL STORAGE MANAGER =====
  const StorageManager = (() => {
    const STORAGE_KEY = 'budgetingApp';

    function getCurrentMonthKey() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    function getAllData() {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { months: {}, settings: {} };
      try {
        return JSON.parse(data);
      } catch (e) {
        return { months: {}, settings: {} };
      }
    }

    function saveAllData(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getMonthData(monthKey) {
      const data = getAllData();
      return data.months[monthKey] || null;
    }

    function getCurrentMonthData() {
      return getMonthData(getCurrentMonthKey());
    }

    function saveMonthData(monthKey, monthData) {
      const data = getAllData();
      data.months[monthKey] = monthData;
      saveAllData(data);
    }

    function saveCurrentMonthData(monthData) {
      saveMonthData(getCurrentMonthKey(), monthData);
    }

    function initializeMonth(monthKey, allowance) {
      const defaultCategories = [
        { id: generateId(), name: 'Food & Groceries', percentage: 25, color: '#4CAF50' },
        { id: generateId(), name: 'Transport', percentage: 15, color: '#2196F3' },
        { id: generateId(), name: 'Utilities & Bills', percentage: 15, color: '#FF9800' },
        { id: generateId(), name: 'Entertainment', percentage: 10, color: '#9C27B0' },
        { id: generateId(), name: 'Shopping', percentage: 10, color: '#E91E63' },
        { id: generateId(), name: 'Health', percentage: 5, color: '#00BCD4' },
        { id: generateId(), name: 'Savings', percentage: 20, color: '#607D8B' }
      ];

      const monthData = {
        allowance: allowance,
        categories: defaultCategories,
        expenses: [],
        createdAt: new Date().toISOString()
      };

      saveMonthData(monthKey, monthData);
      return monthData;
    }

    function addExpense(expense) {
      const data = getCurrentMonthData();
      if (!data) return null;
      expense.id = generateId();
      expense.createdAt = new Date().toISOString();
      data.expenses.push(expense);
      saveCurrentMonthData(data);
      return expense;
    }

    function updateExpense(expenseId, updatedExpense) {
      const data = getCurrentMonthData();
      if (!data) return null;
      const index = data.expenses.findIndex(e => e.id === expenseId);
      if (index === -1) return null;
      data.expenses[index] = { ...data.expenses[index], ...updatedExpense };
      saveCurrentMonthData(data);
      return data.expenses[index];
    }

    function deleteExpense(expenseId) {
      const data = getCurrentMonthData();
      if (!data) return false;
      data.expenses = data.expenses.filter(e => e.id !== expenseId);
      saveCurrentMonthData(data);
      return true;
    }

    function getAllMonthKeys() {
      const data = getAllData();
      return Object.keys(data.months).sort().reverse();
    }

    function getMonthSummary(monthKey) {
      const data = getMonthData(monthKey);
      if (!data) return null;

      const totalSpent = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const remaining = data.allowance - totalSpent;

      const categorySpending = {};
      data.categories.forEach(cat => {
        categorySpending[cat.id] = {
          ...cat,
          budgeted: (data.allowance * cat.percentage) / 100,
          spent: 0
        };
      });

      data.expenses.forEach(exp => {
        if (categorySpending[exp.categoryId]) {
          categorySpending[exp.categoryId].spent += exp.amount;
        }
      });

      return {
        allowance: data.allowance,
        totalSpent,
        remaining,
        categorySpending: Object.values(categorySpending),
        expenseCount: data.expenses.length
      };
    }

    function updateCategories(categories) {
      const data = getCurrentMonthData();
      if (!data) return false;
      data.categories = categories;
      saveCurrentMonthData(data);
      return true;
    }

    function updateAllowance(allowance) {
      const data = getCurrentMonthData();
      if (!data) return false;
      data.allowance = allowance;
      saveCurrentMonthData(data);
      return true;
    }

    function isCurrentMonthInitialized() {
      return getCurrentMonthData() !== null;
    }

    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function clearAll() {
      localStorage.removeItem(STORAGE_KEY);
    }

    return {
      getCurrentMonthKey,
      getAllData,
      getMonthData,
      getCurrentMonthData,
      saveMonthData,
      saveCurrentMonthData,
      initializeMonth,
      addExpense,
      updateExpense,
      deleteExpense,
      getAllMonthKeys,
      getMonthSummary,
      updateCategories,
      updateAllowance,
      isCurrentMonthInitialized,
      generateId,
      clearAll
    };
  })();