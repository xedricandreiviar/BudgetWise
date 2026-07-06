let doughnutChart = null;
  let barChart = null;
  let historyChart = null;
  let editingExpenseId = null;
  let onboardingData = {
    allowance: 0,
    status: null,
    living: null,
    priority: null,
    transport: null,
    meals: null
  };

  document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    checkFirstTimeUser();
    renderCurrentView();
  });

  function checkFirstTimeUser() {
    if (!StorageManager.isCurrentMonthInitialized()) {
      document.getElementById('welcome-modal')
        .classList.add('active');
    }
  }

  function selectOption(group, value, btn) {
    onboardingData[group] = value;
    var container = btn.parentElement;
    var buttons = container.querySelectorAll('.option-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('selected');
    }
    btn.classList.add('selected');
    var stepMap = {
      status: 2,
      living: 3,
      priority: 4,
      transport: 5,
      meals: 6
    };
    var stepNum = stepMap[group];
    if (stepNum) {
      document.getElementById('btn-step-' + stepNum)
        .disabled = false;
    }
  }

  function onboardingNext(currentStep) {
    if (currentStep === 1) {
      var el = document.getElementById('welcome-allowance');
      var allowance = parseFloat(el.value);
      if (!allowance || allowance <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }
      onboardingData.allowance = allowance;
    }
    document.getElementById('step-' + currentStep)
      .classList.remove('active');
    var nextStep = currentStep + 1;
    document.getElementById('step-' + nextStep)
      .classList.add('active');
    var dots = document.querySelectorAll(
      '.onboarding-progress .dot'
    );
    for (var i = 0; i < dots.length; i++) {
      var s = parseInt(dots[i].dataset.step);
      dots[i].classList.remove('active', 'completed');
      if (s === nextStep) {
        dots[i].classList.add('active');
      } else if (s < nextStep) {
        dots[i].classList.add('completed');
      }
    }
    if (nextStep === 7) {
      renderOnboardingSummary();
    }
  }

  function generatePersonalizedCategories() {
    var status = onboardingData.status;
    var living = onboardingData.living;
    var priority = onboardingData.priority;
    var transport = onboardingData.transport;
    var meals = onboardingData.meals;

    var food = 25;
    var tr = 15;
    var util = 10;
    var ent = 10;
    var sav = 20;
    var shop = 10;
    var hp = 5;
    var debt = 0;
    var edu = 0;
    var fam = 0;
    var rent = 0;

    if (status === 'student') {
      edu = 10; sav = 15; shop = 5; food -= 5;
    } else if (status === 'family') {
      fam = 15; ent = 5; shop = 5; sav = 15;
    }

    if (living === 'with-parents') {
      util = 5; food -= 5; sav += 10;
    } else if (living === 'independent') {
      rent = 20; util = 10; sav -= 5;
      ent -= 3; shop -= 2;
    } else if (living === 'own-family') {
      rent = 20; util = 12;
      if (!fam) fam = 10;
      sav -= 5; ent -= 5; shop -= 5;
    }

    if (transport === 'walk-bike') {
      tr = 3; sav += 5;
    } else if (transport === 'public') {
      tr = 10;
    } else if (transport === 'own-vehicle') {
      tr = 20; sav -= 5;
    } else if (transport === 'rideshare') {
      tr = 15;
    }

    if (meals === 'home-cook') {
      food = 20;
    } else if (meals === 'eat-out') {
      food = 30; sav -= 3;
    }

    if (priority === 'save-aggressively') {
      sav += 10; ent -= 5; shop -= 5;
    } else if (priority === 'pay-debt') {
      debt = 20; sav -= 5; ent -= 5; shop -= 5;
    } else if (priority === 'enjoy-life') {
      ent += 8; shop += 5; sav -= 10;
    }

    if (food < 5) food = 5;
    if (tr < 0) tr = 0;
    if (util < 0) util = 0;
    if (ent < 3) ent = 3;
    if (sav < 5) sav = 5;
    if (shop < 3) shop = 3;
    if (hp < 3) hp = 3;
    if (debt < 0) debt = 0;
    if (edu < 0) edu = 0;
    if (fam < 0) fam = 0;
    if (rent < 0) rent = 0;

    var cats = [];
    if (rent > 0) {
      cats.push({
        name: 'Rent / Housing',
        percentage: rent,
        color: '#8B5CF6'
      });
    }
    cats.push({
      name: 'Food & Groceries',
      percentage: food,
      color: '#4CAF50'
    });
    if (tr > 0) {
      cats.push({
        name: 'Transport',
        percentage: tr,
        color: '#2196F3'
      });
    }
    if (util > 0) {
      cats.push({
        name: 'Utilities & Bills',
        percentage: util,
        color: '#FF9800'
      });
    }
    cats.push({
      name: 'Entertainment',
      percentage: ent,
      color: '#9C27B0'
    });
    cats.push({
      name: 'Shopping',
      percentage: shop,
      color: '#E91E63'
    });
    cats.push({
      name: 'Health',
      percentage: hp,
      color: '#00BCD4'
    });
    cats.push({
      name: 'Savings',
      percentage: sav,
      color: '#607D8B'
    });
    if (debt > 0) {
      cats.push({
        name: 'Debt Repayment',
        percentage: debt,
        color: '#F44336'
      });
    }
    if (edu > 0) {
      cats.push({
        name: 'Education',
        percentage: edu,
        color: '#3F51B5'
      });
    }
    if (fam > 0) {
      cats.push({
        name: 'Family Care',
        percentage: fam,
        color: '#FF7043'
      });
    }

    var total = 0;
    for (var i = 0; i < cats.length; i++) {
      total += cats[i].percentage;
    }
    if (total !== 100) {
      var si = -1;
      for (var i = 0; i < cats.length; i++) {
        if (cats[i].name === 'Savings') { si = i; break; }
      }
      if (si !== -1) {
        cats[si].percentage += (100 - total);
      }
      total = 0;
      for (var i = 0; i < cats.length; i++) {
        total += cats[i].percentage;
      }
      if (total !== 100) {
        var scale = 100 / total;
        var run = 0;
        for (var i = 0; i < cats.length; i++) {
          if (i === cats.length - 1) {
            cats[i].percentage = 100 - run;
          } else {
            cats[i].percentage = Math.round(
              cats[i].percentage * scale
            );
            run += cats[i].percentage;
          }
        }
      }
    }

    for (var i = 0; i < cats.length; i++) {
      cats[i].id = StorageManager.generateId();
    }
    return cats;
  }

  function renderOnboardingSummary() {
    var cats = generatePersonalizedCategories();
    var statusLabel = {
      student: 'Student',
      working: 'Working Professional',
      family: 'Have a Family'
    };
    var livingLabel = {
      'with-parents': 'With Parents',
      'independent': 'Independent',
      'own-family': 'Own Family'
    };
    var priorityLabel = {
      'save-aggressively': 'Save Aggressively',
      'balanced': 'Balanced',
      'pay-debt': 'Pay Off Debt',
      'enjoy-life': 'Enjoy Life'
    };
    var transportLabel = {
      'walk-bike': 'Walk / Bike',
      'public': 'Public Transit',
      'own-vehicle': 'Own Vehicle',
      'rideshare': 'Rideshare'
    };
    var mealsLabel = {
      'home-cook': 'Home-cooked',
      'mixed': 'Mixed',
      'eat-out': 'Eat Out'
    };

    var html = '';
    html += '<div class="summary-row">';
    html += '<span class="label">Budget</span>';
    html += '<span class="value">P';
    html += formatNumber(onboardingData.allowance);
    html += '</span></div>';

    html += '<div class="summary-row">';
    html += '<span class="label">Status</span>';
    html += '<span class="value">';
    html += statusLabel[onboardingData.status];
    html += '</span></div>';

    html += '<div class="summary-row">';
    html += '<span class="label">Living</span>';
    html += '<span class="value">';
    html += livingLabel[onboardingData.living];
    html += '</span></div>';

    html += '<div class="summary-row">';
    html += '<span class="label">Priority</span>';
    html += '<span class="value">';
    html += priorityLabel[onboardingData.priority];
    html += '</span></div>';

    html += '<div class="summary-row">';
    html += '<span class="label">Transport</span>';
    html += '<span class="value">';
    html += transportLabel[onboardingData.transport];
    html += '</span></div>';

    html += '<div class="summary-row">';
    html += '<span class="label">Meals</span>';
    html += '<span class="value">';
    html += mealsLabel[onboardingData.meals];
    html += '</span></div>';

    html += '<div class="budget-preview">';
    html += '<h4>Your Budget Split</h4>';
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      var amt = (onboardingData.allowance * c.percentage) / 100;
      html += '<div class="category-preview">';
      html += '<span class="cat-name">';
      html += '<span class="cat-dot" style="background:';
      html += c.color + '"></span>';
      html += c.name + '</span>';
      html += '<span>' + c.percentage + '% - P';
      html += formatNumber(amt) + '</span>';
      html += '</div>';
    }
    html += '</div>';

    document.getElementById('onboarding-summary')
      .innerHTML = html;
  }

  function finishOnboarding() {
    var cats = generatePersonalizedCategories();
    var mk = StorageManager.getCurrentMonthKey();
    var monthData = {
      allowance: onboardingData.allowance,
      categories: cats,
      expenses: [],
      profile: {
        status: onboardingData.status,
        living: onboardingData.living,
        priority: onboardingData.priority,
        transport: onboardingData.transport,
        meals: onboardingData.meals
      },
      createdAt: new Date().toISOString()
    };
    StorageManager.saveMonthData(mk, monthData);
    document.getElementById('welcome-modal')
      .classList.remove('active');
    showToast('Your personalized budget is ready!', 'success');
    renderCurrentView();
  }

  function initNavigation() {
    var links = document.querySelectorAll('.nav-links a');
    for (var i = 0; i < links.length; i++) {
      (function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          navigateTo(link.dataset.view);
        });
      })(links[i]);
    }
  }

  function navigateTo(viewName) {
    var allLinks = document.querySelectorAll('.nav-links a');
    for (var i = 0; i < allLinks.length; i++) {
      allLinks[i].classList.remove('active');
    }
    var al = document.querySelector(
      '[data-view="' + viewName + '"]'
    );
    if (al) al.classList.add('active');

    var allViews = document.querySelectorAll('.view');
    for (var i = 0; i < allViews.length; i++) {
      allViews[i].classList.remove('active');
    }
    var av = document.getElementById('view-' + viewName);
    if (av) av.classList.add('active');

    renderView(viewName);
    document.getElementById('sidebar')
      .classList.remove('open');
  }

  function renderCurrentView() {
    var al = document.querySelector('.nav-links a.active');
    if (al) renderView(al.dataset.view);
  }

  function renderView(v) {
    if (v === 'dashboard') renderDashboard();
    else if (v === 'budget-setup') renderBudgetSetup();
    else if (v === 'expenses') renderExpenses();
    else if (v === 'history') renderHistory();
  }

  function renderDashboard() {
    var mk = StorageManager.getCurrentMonthKey();
    var summary = StorageManager.getMonthSummary(mk);
    var date = new Date(mk + '-01');
    document.getElementById('dashboard-month-label')
      .textContent = date.toLocaleDateString(
        'en-US', {month: 'long', year: 'numeric'}
      );

    if (!summary) {
      document.getElementById('dashboard-content')
        .style.display = 'none';
      document.getElementById('dashboard-empty')
        .style.display = 'block';
      return;
    }

    document.getElementById('dashboard-content')
      .style.display = 'block';
    document.getElementById('dashboard-empty')
      .style.display = 'none';

    var pct = 0;
    if (summary.allowance > 0) {
      pct = ((summary.totalSpent / summary.allowance) * 100)
        .toFixed(1);
    }

    var remColor = summary.remaining >= 0
      ? 'var(--success)' : 'var(--danger)';
    var remText = summary.remaining >= 0
      ? 'Left to spend' : 'Over budget!';

    var html = '<div class="summary-grid">';
    html += '<div class="summary-card budget">';
    html += '<div class="label">Total Budget</div>';
    html += '<div class="value">P';
    html += formatNumber(summary.allowance) + '</div>';
    html += '<div class="sub">Monthly allowance</div></div>';

    html += '<div class="summary-card spent">';
    html += '<div class="label">Total Spent</div>';
    html += '<div class="value">P';
    html += formatNumber(summary.totalSpent) + '</div>';
    html += '<div class="sub">' + pct + '% of budget</div>';
    html += '</div>';

    html += '<div class="summary-card remaining">';
    html += '<div class="label">Remaining</div>';
    html += '<div class="value" style="color:' + remColor;
    html += '">P';
    html += formatNumber(Math.abs(summary.remaining));
    html += '</div>';
    html += '<div class="sub">' + remText + '</div></div>';

    html += '<div class="summary-card expenses-count">';
    html += '<div class="label">Transactions</div>';
    html += '<div class="value">';
    html += summary.expenseCount + '</div>';
    html += '<div class="sub">This month</div></div></div>';

    html += '<div class="card">';
    html += '<div class="card-header">';
    html += '<h3>Spending by Category</h3></div>';
    html += '<div class="progress-list">';

    for (var i = 0; i < summary.categorySpending.length; i++) {
      var cat = summary.categorySpending[i];
      var op = 0;
      if (cat.budgeted > 0) {
        op = (cat.spent / cat.budgeted) * 100;
      }
      var cc = 'green';
      if (op >= 90) cc = 'red';
      else if (op >= 70) cc = 'yellow';
      var w = Math.min(op, 100);

      html += '<div class="progress-item">';
      html += '<div class="progress-header">';
      html += '<span class="category-name">';
      html += '<span class="category-dot" style="background:';
      html += cat.color + '"></span>' + cat.name + '</span>';
      html += '<span class="progress-amounts"><span>P';
      html += formatNumber(cat.spent) + '</span> / P';
      html += formatNumber(cat.budgeted) + '</span></div>';
      html += '<div class="progress-bar">';
      html += '<div class="progress-fill ' + cc;
      html += '" style="width:' + w + '%"></div>';
      html += '</div></div>';
    }

    html += '</div></div>';
    html += '<div class="charts-grid">';
    html += '<div class="chart-container">';
    html += '<h3>Budget Allocation</h3>';
    html += '<canvas id="doughnut-chart"></canvas></div>';
    html += '<div class="chart-container">';
    html += '<h3>Spent vs Budget</h3>';
    html += '<canvas id="bar-chart"></canvas></div></div>';

    document.getElementById('dashboard-content')
      .innerHTML = html;
    renderDoughnutChart(summary);
    renderBarChart(summary);
    checkBudgetWarnings();
  }

  function renderDoughnutChart(s) {
    var ctx = document.getElementById('doughnut-chart');
    if (!ctx) return;
    if (doughnutChart) doughnutChart.destroy();

    var labels = [];
    var data = [];
    var colors = [];
    for (var i = 0; i < s.categorySpending.length; i++) {
      labels.push(s.categorySpending[i].name);
      data.push(s.categorySpending[i].budgeted);
      colors.push(s.categorySpending[i].color);
    }

    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              font: { size: 11, family: 'Inter' }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  function renderBarChart(s) {
    var ctx = document.getElementById('bar-chart');
    if (!ctx) return;
    if (barChart) barChart.destroy();

    var labels = [];
    var budgeted = [];
    var spent = [];
    for (var i = 0; i < s.categorySpending.length; i++) {
      var n = s.categorySpending[i].name;
      if (n.length > 10) n = n.substring(0, 10) + '...';
      labels.push(n);
      budgeted.push(s.categorySpending[i].budgeted);
      spent.push(s.categorySpending[i].spent);
    }

    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Budgeted',
            data: budgeted,
            backgroundColor: 'rgba(99,102,241,0.2)',
            borderColor: 'rgba(99,102,241,1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Spent',
            data: spent,
            backgroundColor: 'rgba(239,68,68,0.2)',
            borderColor: 'rgba(239,68,68,1)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11, family: 'Inter' },
              usePointStyle: true
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 9 } }
          }
        }
      }
    });
  }

  function renderBudgetSetup() {
    var data = StorageManager.getCurrentMonthData();
    if (data) {
      document.getElementById('allowance-input')
        .value = data.allowance;
      renderCategoriesList(data.categories);
    } else {
      document.getElementById('allowance-input').value = '';
      renderCategoriesList([]);
    }
  }

  function renderCategoriesList(categories) {
    var html = '';
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      html += '<div class="category-item">';
      html += '<input type="color" class="color-picker"';
      html += ' value="' + cat.color + '"';
      html += ' onchange="updateCategoryColor(\'';
      html += cat.id + '\',this.value)">';
      html += '<input type="text" class="cat-name-input"';
      html += ' value="' + cat.name + '"';
      html += ' onchange="updateCategoryName(\'';
      html += cat.id + '\',this.value)">';
      html += '<input type="number" class="percentage-input"';
      html += ' value="' + cat.percentage + '"';
      html += ' min="0" max="100"';
      html += ' onchange="updateCategoryPercentage(\'';
      html += cat.id + '\',this.value)">';
      html += '<span class="percentage-label">%</span>';
      html += '<button class="btn btn-danger btn-sm"';
      html += ' onclick="removeCategory(\'';
      html += cat.id + '\')">X</button>';
      html += '</div>';
    }
    document.getElementById('categories-list').innerHTML = html;
    updatePercentageTotal();
  }

  function addCategory() {
    var data = StorageManager.getCurrentMonthData();
    if (!data) return;
    var colors = [
      '#FF6384', '#36A2EB', '#FFCE56',
      '#4BC0C0', '#9966FF', '#FF9F40'
    ];
    var idx = data.categories.length % colors.length;
    data.categories.push({
      id: StorageManager.generateId(),
      name: 'New Category',
      percentage: 0,
      color: colors[idx]
    });
    StorageManager.updateCategories(data.categories);
    renderCategoriesList(data.categories);
  }

  function removeCategory(id) {
    var data = StorageManager.getCurrentMonthData();
    if (!data) return;
    var filtered = [];
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id !== id) {
        filtered.push(data.categories[i]);
      }
    }
    data.categories = filtered;
    StorageManager.updateCategories(data.categories);
    renderCategoriesList(data.categories);
  }

  function updateCategoryName(id, name) {
    var data = StorageManager.getCurrentMonthData();
    if (!data) return;
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) {
        data.categories[i].name = name;
        break;
      }
    }
    StorageManager.updateCategories(data.categories);
  }

  function updateCategoryColor(id, color) {
    var data = StorageManager.getCurrentMonthData();
    if (!data) return;
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) {
        data.categories[i].color = color;
        break;
      }
    }
    StorageManager.updateCategories(data.categories);
  }

  function updateCategoryPercentage(id, pct) {
    var data = StorageManager.getCurrentMonthData();
    if (!data) return;
    for (var i = 0; i < data.categories.length; i++) {
      if (data.categories[i].id === id) {
        data.categories[i].percentage = parseFloat(pct) || 0;
        break;
      }
    }
    StorageManager.updateCategories(data.categories);
    updatePercentageTotal();
  }

  function updatePercentageTotal() {
    var inputs = document.querySelectorAll('.percentage-input');
    var total = 0;
    for (var i = 0; i < inputs.length; i++) {
      total += parseFloat(inputs[i].value) || 0;
    }
    document.getElementById('percentage-value')
      .textContent = total + '%';
    if (total === 100) {
      document.getElementById('percentage-total')
        .className = 'percentage-total valid';
    } else {
      document.getElementById('percentage-total')
        .className = 'percentage-total invalid';
    }
  }

  function saveBudgetSetup() {
    var el = document.getElementById('allowance-input');
    var allowance = parseFloat(el.value);
    if (!allowance || allowance <= 0) {
      showToast('Enter a valid allowance', 'error');
      return;
    }
    var inputs = document.querySelectorAll('.percentage-input');
    var total = 0;
    for (var i = 0; i < inputs.length; i++) {
      total += parseFloat(inputs[i].value) || 0;
    }
    if (total !== 100) {
      showToast('Percentages must equal 100%', 'error');
      return;
    }
    var data = StorageManager.getCurrentMonthData();
    if (data) {
      StorageManager.updateAllowance(allowance);
    } else {
      StorageManager.initializeMonth(
        StorageManager.getCurrentMonthKey(), allowance
      );
    }
    showToast('Budget saved!', 'success');
  }

  function renderExpenses() {
    var data = StorageManager.getCurrentMonthData();
    if (!data) {
      document.getElementById('expenses-list-content')
        .style.display = 'none';
      document.getElementById('expenses-empty')
        .style.display = 'block';
      return;
    }

    var select = document.getElementById('expense-category');
    var opts = '<option value="">Select...</option>';
    for (var i = 0; i < data.categories.length; i++) {
      var c = data.categories[i];
      opts += '<option value="' + c.id + '">' + c.name + '</option>';
    }
    select.innerHTML = opts;

    var di = document.getElementById('expense-date');
    if (!di.value) {
      di.value = new Date().toISOString().split('T')[0];
    }

    if (data.expenses.length === 0) {
      document.getElementById('expenses-list-content')
        .style.display = 'none';
      document.getElementById('expenses-empty')
        .style.display = 'block';
      document.getElementById('expenses-count-label')
        .textContent = '0 expenses';
      return;
    }

    document.getElementById('expenses-list-content')
      .style.display = 'block';
    document.getElementById('expenses-empty')
      .style.display = 'none';
    var count = data.expenses.length;
    document.getElementById('expenses-count-label')
      .textContent = count + ' expense' + (count > 1 ? 's' : '');

    var sorted = data.expenses.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var html = '<table class="expenses-table">';
    html += '<thead><tr><th>Date</th><th>Description</th>';
    html += '<th>Category</th><th>Amount</th>';
    html += '<th>Actions</th></tr></thead><tbody>';

    for (var i = 0; i < sorted.length; i++) {
      var exp = sorted[i];
      var cat = null;
      for (var j = 0; j < data.categories.length; j++) {
        if (data.categories[j].id === exp.categoryId) {
          cat = data.categories[j];
          break;
        }
      }
      var cn = cat ? cat.name : 'Unknown';
      var cc = cat ? cat.color : '#ccc';

      html += '<tr><td>' + formatDate(exp.date) + '</td>';
      html += '<td>' + escapeHtml(exp.description) + '</td>';
      html += '<td><span class="category-badge"';
      html += ' style="background:' + cc + '22;color:';
      html += cc + '">' + cn + '</span></td>';
      html += '<td class="amount">-P';
      html += formatNumber(exp.amount) + '</td>';
      html += '<td class="actions">';
      html += '<button class="btn btn-outline btn-sm"';
      html += ' onclick="editExpense(\'' + exp.id;
      html += '\')">Edit</button>';
      html += '<button class="btn btn-danger btn-sm"';
      html += ' onclick="deleteExpense(\'' + exp.id;
      html += '\')">Del</button>';
      html += '</td></tr>';
    }
    html += '</tbody></table>';
    document.getElementById('expenses-list-content')
      .innerHTML = html;
  }

  
  function handleAddExpense(e) {
    e.preventDefault();
    var amount = parseFloat(
      document.getElementById('expense-amount').value
    );
    var categoryId = document.getElementById(
      'expense-category'
    ).value;
    var description = document.getElementById(
      'expense-description'
    ).value.trim();
    var date = document.getElementById('expense-date').value;

    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (!categoryId) {
      showToast('Select a category', 'error');
      return;
    }
    if (!description) {
      showToast('Enter a description', 'error');
      return;
    }
    if (!date) {
      showToast('Select a date', 'error');
      return;
    }

    // Check if expense exceeds remaining category budget
    var data = StorageManager.getCurrentMonthData();
    if (data && !editingExpenseId) {
      var cat = null;
      for (var i = 0; i < data.categories.length; i++) {
        if (data.categories[i].id === categoryId) {
          cat = data.categories[i];
          break;
        }
      }
      if (cat) {
        var budgeted = (data.allowance * cat.percentage) / 100;
        var spent = 0;
        for (var i = 0; i < data.expenses.length; i++) {
          if (data.expenses[i].categoryId === categoryId) {
            spent += data.expenses[i].amount;
          }
        }
        var remaining = budgeted - spent;

        if (amount > remaining) {
          if (remaining <= 0) {
            showBudgetBlock(
              cat.name,
              0,
              amount
            );
          } else {
            showBudgetBlock(
              cat.name,
              remaining,
              amount
            );
          }
          return;
        }
      }
    }

    if (editingExpenseId) {
      StorageManager.updateExpense(editingExpenseId, {
        amount: amount,
        categoryId: categoryId,
        description: description,
        date: date
      });
      editingExpenseId = null;
      showToast('Expense updated!', 'success');
    } else {
      StorageManager.addExpense({
        amount: amount,
        categoryId: categoryId,
        description: description,
        date: date
      });
      showToast('Expense added!', 'success');
    }

    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').value =
      new Date().toISOString().split('T')[0];
    renderExpenses();
    checkBudgetWarnings();
  }

  function showBudgetBlock(categoryName, remaining, attempted) {
    var container = document.getElementById('expense-block-msg');
    if (!container) return;

    var html = '<div class="expense-blocked">';
    html += '<span class="blocked-icon">🚫</span>';
    html += '<div class="blocked-content">';
    if (remaining <= 0) {
      html += '<strong>Budget exceeded!</strong>';
      html += '<p>You have no budget left for ';
      html += categoryName + '. ';
      html += 'You tried to spend P' + formatNumber(attempted);
      html += ' but this category is fully used up.</p>';
      html += '<p>Consider adjusting your budget or ';
      html += 'skip this purchase.</p>';
    } else {
      html += '<strong>Not enough budget!</strong>';
      html += '<p>You only have P' + formatNumber(remaining);
      html += ' left for ' + categoryName + ', ';
      html += 'but you are trying to spend P';
      html += formatNumber(attempted) + '.</p>';
      html += '<p>Please choose something cheaper ';
      html += 'or reduce the amount to P';
      html += formatNumber(remaining) + ' or less.</p>';
    }
    html += '</div></div>';

    container.innerHTML = html;
    container.style.display = 'block';

    // Auto-hide after 8 seconds
    setTimeout(function() {
      container.style.display = 'none';
    }, 8000);
  }

  function editExpense(id) {
    var data = StorageManager.getCurrentMonthData();
    var exp = null;
    for (var i = 0; i < data.expenses.length; i++) {
      if (data.expenses[i].id === id) {
        exp = data.expenses[i];
        break;
      }
    }
    if (!exp) return;
    editingExpenseId = id;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-category')
      .value = exp.categoryId;
    document.getElementById('expense-description')
      .value = exp.description;
    document.getElementById('expense-date').value = exp.date;
    showToast('Editing - make changes and submit', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    StorageManager.deleteExpense(id);
    showToast('Expense deleted!', 'success');
    renderExpenses();
  }

  function renderHistory() {
    var keys = StorageManager.getAllMonthKeys();
    if (keys.length === 0) {
      document.getElementById('history-content')
        .style.display = 'none';
      document.getElementById('history-empty')
        .style.display = 'block';
      return;
    }

    document.getElementById('history-content')
      .style.display = 'block';
    document.getElementById('history-empty')
      .style.display = 'none';

    var html = '<div class="history-list">';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var s = StorageManager.getMonthSummary(key);
      if (!s) continue;
      var d = new Date(key + '-01');
      var label = d.toLocaleDateString(
        'en-US', {month: 'long', year: 'numeric'}
      );
      var rate = 0;
      if (s.allowance > 0) {
        rate = ((s.remaining / s.allowance) * 100).toFixed(0);
      }
      var cur = key === StorageManager.getCurrentMonthKey();
      var savedColor = s.remaining >= 0
        ? 'var(--success)' : 'var(--danger)';

      html += '<div class="history-item">';
      html += '<div><div class="month-label">';
      html += label;
      if (cur) html += ' (Current)';
      html += '</div></div>';
      html += '<div class="stat">';
      html += '<div class="stat-value">P';
      html += formatNumber(s.allowance) + '</div>';
      html += '<div class="stat-label">Budget</div></div>';
      html += '<div class="stat">';
      html += '<div class="stat-value" style="color:';
      html += 'var(--warning)">P';
      html += formatNumber(s.totalSpent) + '</div>';
      html += '<div class="stat-label">Spent</div></div>';
      html += '<div class="stat">';
      html += '<div class="stat-value" style="color:';
      html += savedColor + '">' + rate + '%</div>';
      html += '<div class="stat-label">Saved</div></div>';
      html += '</div>';
    }
    html += '</div>';

    if (keys.length > 1) {
      html += '<div class="chart-container">';
      html += '<h3>Monthly Comparison</h3>';
      html += '<canvas id="history-chart"></canvas></div>';
    }

    document.getElementById('history-content').innerHTML = html;
    if (keys.length > 1) renderHistoryChart(keys);
  }

  function renderHistoryChart(keys) {
    var ctx = document.getElementById('history-chart');
    if (!ctx) return;
    if (historyChart) historyChart.destroy();

    var sorted = keys.slice().sort();
    var labels = [];
    var budgets = [];
    var spent = [];
    var saved = [];

    for (var i = 0; i < sorted.length; i++) {
      var d = new Date(sorted[i] + '-01');
      labels.push(d.toLocaleDateString(
        'en-US', {month: 'short', year: '2-digit'}
      ));
      var s = StorageManager.getMonthSummary(sorted[i]);
      budgets.push(s ? s.allowance : 0);
      spent.push(s ? s.totalSpent : 0);
      saved.push(s ? Math.max(s.remaining, 0) : 0);
    }

    historyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Budget',
            data: budgets,
            backgroundColor: 'rgba(99,102,241,0.2)',
            borderColor: 'rgba(99,102,241,1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Spent',
            data: spent,
            backgroundColor: 'rgba(239,68,68,0.2)',
            borderColor: 'rgba(239,68,68,1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Saved',
            data: saved,
            backgroundColor: 'rgba(16,185,129,0.2)',
            borderColor: 'rgba(16,185,129,1)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11, family: 'Inter' },
              usePointStyle: true
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function formatNumber(n) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(d) {
    var date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function escapeHtml(t) {
    var div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
  }

  function showToast(msg, type) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    setTimeout(function() {
      t.classList.add('show');
    }, 10);
    setTimeout(function() {
      t.classList.remove('show');
    }, 3000);
  }

  function toggleSidebar() {
    document.getElementById('sidebar')
      .classList.toggle('open');
  }

   function checkBudgetWarnings() {
    var data = StorageManager.getCurrentMonthData();
    if (!data) return;

    var summary = StorageManager.getMonthSummary(
      StorageManager.getCurrentMonthKey()
    );
    if (!summary) return;

    var warnings = [];

    // Check if overall remaining is less than 20%
    var remainPct = (summary.remaining / summary.allowance) * 100;
    if (remainPct <= 20 && remainPct > 0) {
      warnings.push({
        type: 'warning',
        msg: 'You only have ' + Math.round(remainPct)
          + '% of your budget left. Be cautious with spending!'
      });
    } else if (remainPct <= 0) {
      warnings.push({
        type: 'danger',
        msg: 'You have exceeded your total budget!'
      });
    }

    // Check individual categories near limit
    for (var i = 0; i < summary.categorySpending.length; i++) {
      var cat = summary.categorySpending[i];
      if (cat.budgeted <= 0) continue;
      var catPct = (cat.spent / cat.budgeted) * 100;
      if (catPct >= 100) {
        warnings.push({
          type: 'danger',
          msg: cat.name + ' is over budget! You spent P'
            + formatNumber(cat.spent) + ' of P'
            + formatNumber(cat.budgeted) + '.'
        });
      } else if (catPct >= 80) {
        warnings.push({
          type: 'warning',
          msg: cat.name + ' is at ' + Math.round(catPct)
            + '%. Only P'
            + formatNumber(cat.budgeted - cat.spent)
            + ' left in this category.'
        });
      }
    }

    // Check if spending in one category could affect others
    var unspentCategories = 0;
    var totalUnspent = 0;
    for (var i = 0; i < summary.categorySpending.length; i++) {
      var cat = summary.categorySpending[i];
      if (cat.spent < cat.budgeted) {
        unspentCategories++;
        totalUnspent += (cat.budgeted - cat.spent);
      }
    }
    if (summary.remaining > 0 && summary.remaining < totalUnspent
      && remainPct <= 30) {
      warnings.push({
        type: 'warning',
        msg: 'You still have ' + unspentCategories
          + ' categories that need funding. '
          + 'Remaining budget: P'
          + formatNumber(summary.remaining)
          + '. Spend wisely!'
      });
    }

    renderWarnings(warnings);
  }

  function renderWarnings(warnings) {
    var container = document.getElementById('budget-warnings');
    if (!container) return;
    if (warnings.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    var html = '';
    for (var i = 0; i < warnings.length; i++) {
      var w = warnings[i];
      var icon = w.type === 'danger' ? '🚨' : '⚠️';
      html += '<div class="budget-warning ' + w.type + '">';
      html += '<span class="warning-icon">' + icon + '</span>';
      html += '<span class="warning-msg">' + w.msg + '</span>';
      html += '</div>';
    }
    container.innerHTML = html;
  }