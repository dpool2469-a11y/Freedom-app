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
    return { debts: [], expenses: [], income: [], goals: [], assets: [], budget: null, cibil: null };
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
      for (const key of ["debts", "expenses", "income", "goals", "assets"]) {
        const arr = Array.isArray(parsed[key]) ? parsed[key] : [];
        data[key] = arr.map(item => normalizeRecord(item, key));
      }
      data.budget = parsed.budget && typeof parsed.budget === "object" ? parsed.budget : null;
      data.cibil = parsed.cibil && typeof parsed.cibil === "object" ? parsed.cibil : null;
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
      card.append(textElement("p", "", `Annual interest: ${Number(debt.rate ?? debt.interestRate ?? 0)}%${Number(debt.emi||0)>0 ? ` · EMI ${money(debt.emi)}` : ""}`));
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
    renderNetWorth();
    renderBudget();
    renderPlannerOptions();
    renderCibil();
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
    rate: Number($("debtRate")?.value || 0),
    emi: Number($("debtEmi")?.value || 0),
    monthsRemaining: Number($("debtDue")?.value || 0)
  }));
  bindForm("expenseForm", "expenses", { name: "expenseName", amount: "expenseAmount" }, () => ({}));
  bindForm("incomeForm", "income", { name: "incomeName", amount: "incomeAmount" }, () => ({}));
  bindForm("goalForm", "goals", { name: "goalName", amount: "goalAmount" }, () => ({ savedAmount: 0 }));


  // New tools are stored alongside the original local-first records.
  function addAssetForm() {
    const form = $("assetForm"); if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = $("assetName").value.trim(), amount = Number($("assetAmount").value);
      if (!name || !Number.isFinite(amount) || amount <= 0) return alert("Enter an asset name and a value above zero.");
      data.assets.push({ id: newId(), name, amount, category: $("assetCategory").value, date: new Date().toISOString() });
      if (!saveData()) { data.assets.pop(); return; }
      form.reset(); renderAll(); alert("Asset saved.");
    });
  }
  function renderNetWorth() {
    const assets = total(data.assets), liabilities = total(data.debts), net = assets - liabilities;
    if ($("assetsTotal")) $("assetsTotal").textContent = money(assets);
    if ($("liabilitiesTotal")) $("liabilitiesTotal").textContent = money(liabilities);
    if ($("netWorthTotal")) { $("netWorthTotal").textContent = money(net); $("netWorthTotal").style.color = net < 0 ? "#ff3434" : "#32d583"; }
    if ($("netWorthCaption")) $("netWorthCaption").textContent = `${data.assets.length} asset record${data.assets.length===1?"":"s"} · ${data.debts.length} debt record${data.debts.length===1?"":"s"}`;
    const list = $("assetList"); if (!list) return; list.replaceChildren();
    if (!data.assets.length) list.append(emptyState("No assets added yet."));
    data.assets.forEach(a => { const card=document.createElement("article"); card.className="record-card"; card.append(textElement("h3","",a.name)); card.append(textElement("p","",a.category||"Other asset")); card.append(textElement("div","record-value amount income-color",money(a.amount))); card.append(deleteButton("assets",a.id)); list.append(card); });
  }
  function currentMonthKey() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
  function expensesForMonth(key) { return total(data.expenses, x => String(x.date||"").slice(0,7)===key); }
  function renderBudget() {
    const month = data.budget?.month || currentMonthKey();
    const limit = Number(data.budget?.limit || 0), spent = expensesForMonth(month);
    const [year,mon] = month.split("-").map(Number); const today=new Date();
    const selected = year===today.getFullYear() && mon===today.getMonth()+1;
    const daysInMonth = new Date(year,mon,0).getDate();
    const daysLeft = selected ? Math.max(1, daysInMonth-today.getDate()+1) : daysInMonth;
    const remaining = Math.max(0,limit-spent), daily = limit>0 ? remaining/daysLeft : 0;
    if ($("budgetLimit")) $("budgetLimit").value = limit || "";
    if ($("budgetStart")) $("budgetStart").value = month;
    if ($("dailySpend")) $("dailySpend").textContent = money(daily);
    if ($("budgetDays")) $("budgetDays").textContent = limit ? `${daysLeft} day${daysLeft===1?"":"s"} counted · ${month}` : "Set your monthly budget";
    if ($("budgetLimitView")) $("budgetLimitView").textContent = money(limit);
    if ($("budgetSpentView")) $("budgetSpentView").textContent = money(spent);
    if ($("budgetProgress")) $("budgetProgress").style.width = `${limit ? Math.min(100,spent/limit*100) : 0}%`;
    if ($("budgetMessage")) $("budgetMessage").textContent = !limit ? "Set a budget to calculate a daily guide." : spent>limit ? `You are ${money(spent-limit)} over budget. Daily safe-to-spend is ₹0 until the next budget period.` : `${money(remaining)} remains for ${month}. Daily guide divides the remaining amount by the days left. Remember to account for bills due later in the month.`;
  }
  const budgetForm=$("budgetForm"); if(budgetForm) budgetForm.addEventListener("submit",e=>{e.preventDefault();const limit=Number($("budgetLimit").value),month=$("budgetStart").value;if(!Number.isFinite(limit)||limit<=0||!/^\d{4}-\d{2}$/.test(month))return alert("Enter a valid budget and month.");data.budget={limit,month,updatedAt:new Date().toISOString()};if(saveData()){renderAll();alert("Monthly budget saved.");}});
  function simulateLoan(balance, rate, payment) {
    let remaining=balance, interestTotal=0, months=0; const monthlyRate=rate/1200;
    if(payment<=balance*monthlyRate && monthlyRate>0) return {months:Infinity,interest:Infinity,paid:Infinity};
    while(remaining>0.01 && months<1200) { const interest=remaining*monthlyRate; interestTotal+=interest; const principal=Math.min(remaining,Math.max(0,payment-interest)); if(principal<=0) return {months:Infinity,interest:Infinity,paid:Infinity}; remaining-=principal; months++; }
    return {months,interest:interestTotal,paid:balance+interestTotal};
  }
  function fmtDuration(n) { if(!Number.isFinite(n))return "Payment too low to clear loan"; const y=Math.floor(n/12),m=n%12;return y?`${y} yr${y===1?"":"s"}${m?` ${m} mo`:""}`:`${m} month${m===1?"":"s"}`; }
  function renderPlannerOptions() { const select=$("calcLoan"); if(!select)return; const old=select.value; select.replaceChildren(new Option("Enter loan details manually","")); data.debts.forEach(d=>select.add(new Option(`${d.name} — ${money(d.amount)}`,String(d.id)))); if(data.debts.some(d=>String(d.id)===old))select.value=old; renderLumpSumAdvice(); }
  function renderLumpSumAdvice() { const list=$("lumpSumAdvice");if(!list)return;list.replaceChildren();const debts=[...data.debts].sort((a,b)=>Number(b.rate||0)-Number(a.rate||0));if(!debts.length){list.append(emptyState("Add debts and their interest rates to see a suggested repayment order."));return;}debts.forEach((d,i)=>{const card=document.createElement("article");card.className="record-card";card.append(textElement("h3","",`${i+1}. ${d.name}`));card.append(textElement("p","",`${Number(d.rate||0)}% annual interest · balance ${money(d.amount)}`));card.append(textElement("p",i===0?"income-color":"",i===0?"Highest listed rate — usually the first to evaluate for extra payments.":"Compare this rate with the highest-rate debt."));list.append(card);});}
  const loanSelect=$("calcLoan");if(loanSelect)loanSelect.addEventListener("change",()=>{const d=data.debts.find(x=>String(x.id)===loanSelect.value);if(d){$("calcBalance").value=d.amount;$("calcRate").value=Number(d.rate||0);$("calcEmi").value=Number(d.emi||"");}});
  const loanForm=$("loanCalcForm");if(loanForm)loanForm.addEventListener("submit",e=>{e.preventDefault();const balance=Number($("calcBalance").value),rate=Number($("calcRate").value),emi=Number($("calcEmi").value),extra=Number($("calcExtra").value);if(balance<=0||emi<=0||rate<0||extra<0)return alert("Check the loan values.");const normal=simulateLoan(balance,rate,emi), accelerated=simulateLoan(balance,rate,emi+extra);const valid=Number.isFinite(normal.months)&&Number.isFinite(accelerated.months);const list=$("loanResults");list.replaceChildren();if(!valid){list.append(emptyState("The EMI may be too low to cover monthly interest. Check your loan details."));return;}const saved=Math.max(0,normal.interest-accelerated.interest),monthsSaved=Math.max(0,normal.months-accelerated.months);const make=(title,result,payment,highlight)=>{const c=document.createElement("article");c.className="record-card";c.style.display="block";c.append(textElement("h3","",title));c.append(textElement("p","",`Monthly payment: ${money(payment)}`));c.append(textElement("div","record-value amount",fmtDuration(result.months)));c.append(textElement("p","",`Estimated interest: ${money(result.interest)}`));c.append(textElement("p",highlight?"income-color":"",`Total paid: ${money(result.paid)}`));return c;};list.append(make("NORMAL EMI PLAN",normal,emi,false));list.append(make(`WITH ${money(extra)} EXTRA / MONTH`,accelerated,emi+extra,true));const summary=document.createElement("article");summary.className="record-card";summary.style.display="block";summary.append(textElement("h3","income-color","Potential difference"));summary.append(textElement("p","",`Estimated interest saved: ${money(saved)}`));summary.append(textElement("p","",`Loan finished about ${fmtDuration(monthsSaved)} earlier (${monthsSaved} month${monthsSaved===1?"":"s"}).`));summary.append(textElement("p","","Actual lender calculations may differ due to daily interest, fees, rate changes or how extra payments are applied."));list.append(summary);});
  function renderCibil() { const c=data.cibil||{};const score=Number(c.score||0);if($("cibilScoreView"))$("cibilScoreView").textContent=score>=300&&score<=900?String(score):"—";if($("cibilGrade"))$("cibilGrade").textContent=score>=750?"EXCELLENT":score>=700?"GOOD":score>=650?"FAIR":score>=300?"NEEDS WORK":"ADD SCORE";if($("cibilDate"))$("cibilDate").textContent=c.updatedAt?new Date(c.updatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}).toUpperCase():new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short"}).toUpperCase();if($("scoreDelta"))$("scoreDelta").textContent="MANUAL TRACKER";const set=(id,v)=>{if($(id))$(id).textContent=v;};set("paymentValue",c.paymentHistory!=null?`${c.paymentHistory}% on time`:"Not entered");set("utilValue",c.creditUtil!=null?`${c.creditUtil}%`:"Not entered");set("ageValue",c.creditAge!=null?`${Math.floor(c.creditAge/12)}y ${c.creditAge%12}m`:"Not entered");set("mixValue",c.creditMix!=null?`${c.creditMix} accounts`:"Not entered");set("enquiryValue",c.creditEnquiries!=null?`${c.creditEnquiries} in 6 months`:"Not entered");const width=(id,val)=>{if($(id))$(id).style.width=`${Math.max(0,Math.min(100,Number(val)||0))}%`;};width("paymentBar",c.paymentHistory);width("utilBar",c.creditUtil);width("ageBar",Number(c.creditAge)/120*100);width("mixBar",Number(c.creditMix)/6*100);width("enquiryBar",100-Math.min(100,Number(c.creditEnquiries)*20));if($("cibilScore"))$("cibilScore").value=c.score||"";["paymentHistory","creditUtil","creditAge","creditMix","creditEnquiries"].forEach(k=>{if($(k))$(k).value=c[k]??"";});if($("cibilTip"))$("cibilTip").textContent=Number(c.creditUtil)>30?"Try to keep revolving credit utilisation low, ideally below 30%, and pay every EMI on time.":"Keep every EMI on time, avoid unnecessary credit applications, and review utilisation regularly.";const angle=score>=300&&score<=900?(score-300)/600:0;const dot=$("gaugeDot");if(dot){const theta=Math.PI*(1-angle);dot.setAttribute("cx",String(160+128*Math.cos(theta)));dot.setAttribute("cy",String(158-128*Math.sin(theta)));dot.setAttribute("fill",score>=750?"#fff":"#ff3448");}const arc=$("gaugeArc");if(arc){const x=32+256*angle;arc.setAttribute("d",score>=300&&score<=900?`M 32 158 A 128 128 0 ${angle>.5?1:0} 1 ${x} ${158-128*Math.sin(Math.PI*angle)}`:"M 32 158 A 128 128 0 0 1 288 158");}}
  const cibilForm=$("cibilForm");if(cibilForm)cibilForm.addEventListener("submit",e=>{e.preventDefault();const score=Number($("cibilScore").value);if(score&&(score<300||score>900))return alert("CIBIL score should be between 300 and 900.");data.cibil={score:score||null,paymentHistory:valOrNull("paymentHistory"),creditUtil:valOrNull("creditUtil"),creditAge:valOrNull("creditAge"),creditMix:valOrNull("creditMix"),creditEnquiries:valOrNull("creditEnquiries"),updatedAt:new Date().toISOString()};if(saveData()){renderCibil();if($("cibilNote"))$("cibilNote").textContent="Saved on this device. This is your entered summary, not an official CIBIL report.";alert("Credit report details saved.");}});
  function valOrNull(id){const v=$(id)?.value;return v===""||v==null?null:Number(v);}
  const downloadCibil=$("downloadCibil");if(downloadCibil)downloadCibil.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({title:"FREEDOM — Personal CIBIL summary (user-entered)",disclaimer:"Not an official TransUnion CIBIL report",...data.cibil},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`freedom-credit-summary-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);if($("cibilNote"))$("cibilNote").textContent="Your personal summary was downloaded as JSON. Get an official report from the official CIBIL site.";});
  addAssetForm();

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
        for (const key of ["debts", "expenses", "income", "goals"]) {
          if (!Array.isArray(imported[key])) throw new Error(`Backup is missing ${key}`);
          replacement[key] = imported[key].map(item => normalizeRecord(item, key));
        }
        replacement.assets = Array.isArray(imported.assets) ? imported.assets.map(item => normalizeRecord(item, "assets")) : [];
        replacement.budget = imported.budget && typeof imported.budget === "object" ? imported.budget : null;
        replacement.cibil = imported.cibil && typeof imported.cibil === "object" ? imported.cibil : null;
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
