/* FREEDOM Finance — local-first app logic */
(() => {
  "use strict";

  const STORAGE_KEY = "freedom-finance-data-v1";
  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2
  }).format(Number(value) || 0);

  function safeDate(value) {
    const d = value ? new Date(value) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  function newId() {
    return (globalThis.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function blankData() {
    return { debts: [], expenses: [], income: [], goals: [] };
  }

  function normalizeRecord(item, type) {
    const x = item && typeof item === "object" ? item : {};
    const name = String(x.name ?? x.title ?? x.description ?? x.source ?? x.label ?? type).slice(0, 100);
    const amount = Number(x.amount ?? x.balance ?? x.value ?? x.target ?? 0);
    return {
      ...x,
      id: x.id ?? newId(),
      name,
      amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      date: x.date ?? x.createdAt ?? x.timestamp ?? new Date().toISOString()
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return blankData();
      const parsed = JSON.parse(raw);
      const data = blankData();
      for (const key of Object.keys(data)) {
        const arr = Array.isArray(parsed[key]) ? parsed[key] : [];
        data[key] = arr.map(item => normalizeRecord(item, key));
      }
      // Keep the original object’s extra properties for forward compatibility.
      return { ...parsed, ...data };
    } catch (error) {
      console.error("FREEDOM data could not be read:", error);
      return blankData();
    }
  }

  let data = loadData();

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      alert("FREEDOM could not save your data. Your browser storage may be full. Export a backup if possible.");
      console.error(error);
      return false;
    }
  }

  function monthMatches(record) {
    const d = safeDate(record.date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  function total(items, filter = () => true) {
    return items.filter(filter).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  function renderTotals() {
    const debtTotal = total(data.debts);
    const incomeTotal = total(data.income, monthMatches);
    const expenseTotal = total(data.expenses, monthMatches);

    if ($("totalDebt")) $("totalDebt").textContent = money(debtTotal);
    if ($("debtPageTotal")) $("debtPageTotal").textContent = money(debtTotal);
    if ($("totalIncome")) $("totalIncome").textContent = money(incomeTotal);
    if ($("totalExpenses")) $("totalExpenses").textContent = money(expenseTotal);
  }

  function textElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    return el;
  }

  function emptyState(message) {
    return textElement("div", "empty-state", message);
  }

  function deleteButton(type, id) {
    const button = textElement("button", "danger-button record-delete", "Delete");
    button.type = "button";
    button.addEventListener("click", () => {
      if (!confirm("Delete this record? This cannot be undone unless you have a backup.")) return;
      data[type] = data[type].filter(item => String(item.id) !== String(id));
      saveData();
      renderAll();
    });
    return button;
  }

  function renderDebts() {
    const container = $("debtList");
    if (!container) return;
    container.replaceChildren();
    if (!data.debts.length) {
      container.append(emptyState("No debts added yet."));
      return;
    }
    data.debts.forEach(debt => {
      const card = document.createElement("article");
      card.className = "record-card";
      card.append(textElement("h3", "", debt.name || "Unnamed debt"));
      card.append(textElement("p", "", `Annual interest: ${Number(debt.rate ?? debt.interestRate ?? 0)}%`));
      card.append(textElement("div", "record-value amount", money(debt.amount)));
      card.append(textElement("p", "", `Added ${safeDate(debt.date).toLocaleDateString("en-IN")}`));
      card.append(deleteButton("debts", debt.id));
      container.append(card);
    });
  }

  function renderActivity() {
    const container = $("activityList");
    const recent = $("recentActivity");
    const records = [
      ...data.expenses.map(x => ({ ...x, type: "expense" })),
      ...data.income.map(x => ({ ...x, type: "income" }))
    ].sort((a, b) => safeDate(b.date) - safeDate(a.date));

    if (container) {
      container.replaceChildren();
      if (!records.length) container.append(emptyState("No activity recorded yet."));
      else records.forEach(record => container.append(activityCard(record, true)));
    }

    if (recent) {
      recent.replaceChildren();
      if (!records.length) recent.append(emptyState("Your financial activity will appear here."));
      else records.slice(0, 4).forEach(record => recent.append(activityCard(record, false)));
    }
  }

  function activityCard(record, allowDelete) {
    const isIncome = record.type === "income";
    const row = document.createElement("div");
    row.className = allowDelete ? "record-card" : "activity-item";
    if (allowDelete) {
      row.append(textElement("h3", "", record.name || (isIncome ? "Income" : "Expense")));
      row.append(textElement("p", "", safeDate(record.date).toLocaleDateString("en-IN")));
      row.append(textElement("div", `record-value amount ${isIncome ? "income-color" : "expense-color"}`,
        `${isIncome ? "+" : "−"}${money(record.amount)}`));
      row.append(deleteButton(isIncome ? "income" : "expenses", record.id));
    } else {
      row.append(textElement("div", "activity-icon", isIncome ? "↗" : "↘"));
      const info = document.createElement("div");
      info.className = "activity-info";
      info.append(textElement("strong", "", record.name || (isIncome ? "Income" : "Expense")));
      info.append(textElement("small", "", safeDate(record.date).toLocaleDateString("en-IN")));
      row.append(info);
      row.append(textElement("div", `activity-amount amount ${isIncome ? "income-color" : "expense-color"}`,
        `${isIncome ? "+" : "−"}${money(record.amount)}`));
    }
    return row;
  }

  function renderGoals() {
    const container = $("goalList");
    if (!container) return;
    container.replaceChildren();
    if (!data.goals.length) {
      container.append(emptyState("No savings goals yet."));
      return;
    }
    data.goals.forEach(goal => {
      const card = document.createElement("article");
      card.className = "record-card";
      card.append(textElement("h3", "", goal.name || "Savings goal"));
      card.append(textElement("p", "", "Target amount"));
      card.append(textElement("div", "record-value amount income-color", money(goal.amount)));
      const progress = document.createElement("progress");
      progress.max = 100;
      progress.value = Math.min(100, Math.max(0, Number(goal.savedAmount ?? goal.saved ?? 0) / (Number(goal.amount) || 1) * 100));
      card.append(progress);
      const saved = Number(goal.savedAmount ?? goal.saved ?? 0);
      card.append(textElement("p", "", `${money(saved)} saved · ${Math.round(progress.value)}% of target`));
      card.append(deleteButton("goals", goal.id));
      container.append(card);
    });
  }

  function renderAll() {
    renderTotals();
    renderDebts();
    renderActivity();
    renderGoals();
  }

  function bindForm(formId, type, fields, makeRecord) {
    const form = $(formId);
    if (!form) return;
    form.addEventListener("submit", event => {
      event.preventDefault();
      const nameInput = $(fields.name);
      const amountInput = $(fields.amount);
      const name = nameInput ? nameInput.value.trim() : "";
      const amount = Number(amountInput ? amountInput.value : NaN);
      if (!name || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a name and an amount greater than zero.");
        return;
      }
      const record = {
        id: newId(),
        name,
        amount,
        date: new Date().toISOString(),
        ...makeRecord()
      };
      data[type].push(record);
      if (!saveData()) {
        data[type].pop();
        return;
      }
      form.reset();
      renderAll();
      alert("Saved successfully.");
    });
  }

  bindForm("debtForm", "debts", { name: "debtName", amount: "debtAmount" }, () => ({
    rate: Number($("debtRate")?.value || 0)
  }));
  bindForm("expenseForm", "expenses", { name: "expenseName", amount: "expenseAmount" }, () => ({}));
  bindForm("incomeForm", "income", { name: "incomeName", amount: "incomeAmount" }, () => ({}));
  bindForm("goalForm", "goals", { name: "goalName", amount: "goalAmount" }, () => ({ savedAmount: 0 }));

  const hideButton = $("hideButton");
  // The hide button's visual toggle is handled by index.html. This class is
  // deliberately not toggled here to avoid duplicate click handlers.

  const exportButton = $("exportData");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `freedom-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showBackupMessage("Backup exported. Keep the file somewhere safe.");
    });
  }

  const importInput = $("importData");
  if (importInput) {
    importInput.addEventListener("change", async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!imported || typeof imported !== "object") throw new Error("Invalid backup");
        const replacement = blankData();
        for (const key of Object.keys(replacement)) {
          if (!Array.isArray(imported[key])) throw new Error(`Backup is missing ${key}`);
          replacement[key] = imported[key].map(item => normalizeRecord(item, key));
        }
        if (!confirm("Restore this backup? It will replace the records currently stored in this browser.")) {
          importInput.value = "";
          return;
        }
        data = { ...imported, ...replacement };
        if (saveData()) {
          renderAll();
          showBackupMessage("Backup restored successfully.");
        }
      } catch (error) {
        alert("That backup file could not be read. Please select a valid FREEDOM JSON backup.");
        console.error(error);
      } finally {
        importInput.value = "";
      }
    });
  }

  const clearButton = $("clearData");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (!confirm("Delete ALL FREEDOM records saved in this browser? Export a backup first if you may need them.")) return;
      data = blankData();
      if (saveData()) {
        renderAll();
        showBackupMessage("All FREEDOM records have been deleted.");
      }
    });
  }

  function showBackupMessage(message) {
    const el = $("backupMessage");
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
  }

  renderAll();
})();
