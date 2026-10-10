"use strict";

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "freedom-finance-data-v1";

let data = {
  debts: [],
  expenses: [],
  incomes: [],
  goals: []
};

let hideAmounts = false;

function createId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        parsed &&
        Array.isArray(parsed.debts) &&
        Array.isArray(parsed.expenses) &&
        Array.isArray(parsed.incomes) &&
        Array.isArray(parsed.goals)
      ) {
        data = parsed;
      }
    }
  } catch (error) {
    alert("Could not load saved data. Your existing data may be damaged.");
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render();
    return true;
  } catch (error) {
    alert("Unable to save data. Your browser storage may be full.");
    return false;
  }
}

function formatMoney(amount) {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function moneyElement(amount) {
  const span = document.createElement("span");
  span.className = "money";
  span.textContent = formatMoney(amount);
  return span;
}

function createEntry(title, details, amount, onDelete) {
  const entry = document.createElement("div");
  entry.className = "entry";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const small = document.createElement("small");
  small.textContent = details + " · ";

  small.appendChild(moneyElement(amount));

  entry.append(strong, small);

  if (onDelete) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Delete";

    button.addEventListener("click", () => {
      if (confirm("Delete this item?")) {
        onDelete();
        saveData();
      }
    });

    entry.appendChild(button);
  }

  return entry;
}

function renderList(containerId, items, builder) {
  const container = $(containerId);
  container.replaceChildren();

  if (!items.length) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Nothing added yet.";
    container.appendChild(message);
    return;
  }

  items.forEach((item) => {
    container.appendChild(builder(item));
  });
}

function render() {
  const totalDebt = data.debts.reduce(
    (sum, item) => sum + Number(item.amount || 0), 0
  );

  const totalIncome = data.incomes.reduce(
    (sum, item) => sum + Number(item.amount || 0), 0
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const totalExpenses = data.expenses
    .filter(item => item.date && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  $("totalDebt").textContent = formatMoney(totalDebt);
  $("totalIncome").textContent = formatMoney(totalIncome);
  $("totalExpenses").textContent = formatMoney(totalExpenses);

  renderList("debtList", data.debts, item =>
    createEntry(
      item.name,
      "Interest: " + item.rate + "% per year",
      item.amount,
      () => {
        data.debts = data.debts.filter(x => x.id !== item.id);
      }
    )
  );

  renderList("expenseList", data.expenses, item =>
    createEntry(
      item.name,
      item.date,
      item.amount,
      () => {
        data.expenses = data.expenses.filter(x => x.id !== item.id);
      }
    )
  );

  renderList("goalList", data.goals, item =>
    createEntry(
      item.name,
      "Savings target",
      item.amount,
      () => {
        data.goals = data.goals.filter(x => x.id !== item.id);
      }
    )
  );

  document.body.classList.toggle("hide-amounts", hideAmounts);
  $("hideButton").textContent = hideAmounts ? "◌" : "◉";
}

$("addDebt").addEventListener("click", () => {
  $("debtForm").hidden = false;
  $("debtName").focus();
});

$("cancelDebt").addEventListener("click", () => {
  $("debtForm").reset();
  $("debtForm").hidden = true;
});

$("debtForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("debtName").value.trim();
  const amount = Number($("debtAmount").value);
  const rate = Number($("debtRate").value);

  if (!name || !Number.isFinite(amount) || amount <= 0 ||
      !Number.isFinite(rate) || rate < 0) {
    alert("Enter a valid debt name, balance and interest rate.");
    return;
  }

  data.debts.push({
    id: createId(),
    name,
    amount,
    rate
  });

  if (saveData()) {
    $("debtForm").reset();
    $("debtForm").hidden = true;
  }
});

$("expenseForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("expenseName").value.trim();
  const amount = Number($("expenseAmount").value);

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid expense and amount.");
    return;
  }

  data.expenses.push({
    id: createId(),
    name,
    amount,
    date: new Date().toISOString().slice(0, 10)
  });

  if (saveData()) {
    $("expenseForm").reset();
  }
});

$("incomeForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("incomeName").value.trim();
  const amount = Number($("incomeAmount").value);

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid income source and amount.");
    return;
  }

  data.incomes.push({
    id: createId(),
    name,
    amount,
    date: new Date().toISOString().slice(0, 10)
  });

  if (saveData()) {
    $("incomeForm").reset();
  }
});

$("goalForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("goalName").value.trim();
  const amount = Number($("goalAmount").value);

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid goal and target amount.");
    return;
  }

  data.goals.push({
    id: createId(),
    name,
    amount
  });

  if (saveData()) {
    $("goalForm").reset();
  }
});

$("hideButton").addEventListener("click", () => {
  hideAmounts = !hideAmounts;
  render();
});

$("exportData").addEventListener("click", () => {
  const backup = {
    app: "FREEDOM",
    version: 1,
    exportedAt: new Date().toISOString(),
    data
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "freedom-backup.json";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$("importData").addEventListener("change", async event => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    const imported = backup.data || backup;

    if (
      !imported ||
      !Array.isArray(imported.debts) ||
      !Array.isArray(imported.expenses) ||
      !Array.isArray(imported.incomes) ||
      !Array.isArray(imported.goals)
    ) {
      throw new Error("Invalid backup format");
    }

    const validItems = (items) =>
      items.every(item =>
        item &&
        typeof item.name === "string" &&
        Number.isFinite(Number(item.amount)) &&
        Number(item.amount) >= 0
      );

    if (
      !validItems(imported.debts) ||
      !validItems(imported.expenses) ||
      !validItems(imported.incomes) ||
      !validItems(imported.goals)
    ) {
      throw new Error("Invalid backup entries");
    }

    if (confirm("Restore backup? This replaces your current app records.")) {
      const previousData = data;

      data = {
        debts: imported.debts,
        expenses: imported.expenses,
        incomes: imported.incomes,
        goals: imported.goals
      };

      if (saveData()) {
        alert("Backup restored successfully.");
      } else {
        data = previousData;
        render();
      }
    }
  } catch (error) {
    alert("Could not restore this file. Please select a valid FREEDOM backup.");
  } finally {
    event.target.value = "";
  }
});

$("clearData").addEventListener("click", () => {
  if (!confirm("Delete ALL FREEDOM records stored in this browser? Export a backup first if you need your records.")) {
    return;
  }

  const previousData = data;

  data = {
    debts: [],
    expenses: [],
    incomes: [],
    goals: []
  };

  if (saveData()) {
    alert("All app records have been deleted.");
  } else {
    data = previousData;
    render();
  }
});

loadData();
render();
