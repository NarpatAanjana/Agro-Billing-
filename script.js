(() => {
  "use strict";

  const STORAGE_KEY = "tradingInvoiceBillsV1";
  const get = (id) => document.getElementById(id);
  const val = (id) => {
    const element = get(id);
    return element ? (Number(element.value) || 0) : 0;
  };
  const goodsBody = get("goodsBody");
  let currentBillKey = null;

  const fmt = (n) => (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const money = fmt;
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const todayISO = () => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  function addItem(description = "", hsn = "", bags = 0, qty = 0, unit = "KGS", rate = 0, ratePer = 100) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="serial"></td>
      <td><input class="description" aria-label="Description"></td>
      <td><input class="hsn" aria-label="HSNC"></td>
      <td><input class="bags" type="number" min="0" step="any" aria-label="Bags"></td>
      <td><input class="qty" type="number" min="0" step="any" aria-label="Weight or quantity"></td>
      <td><input class="unit" aria-label="Unit"></td>
      <td><input class="rate" type="number" min="0" step="any" aria-label="Rate"></td>
      <td><input class="ratePer" type="number" min="0.000001" step="any" aria-label="Rate per"></td>
      <td class="value">0.00</td>
      <td class="no-print"><button type="button" class="remove-item" aria-label="Remove item">×</button></td>`;
    tr.querySelector(".description").value = description ?? "";
    tr.querySelector(".hsn").value = hsn ?? "";
    tr.querySelector(".bags").value = bags ?? 0;
    tr.querySelector(".qty").value = qty ?? 0;
    tr.querySelector(".unit").value = unit ?? "KGS";
    tr.querySelector(".rate").value = rate ?? 0;
    tr.querySelector(".ratePer").value = ratePer ?? 100;
    goodsBody.appendChild(tr);
    calculate();
  }
  window.addItem = addItem;

  goodsBody.addEventListener("input", calculate);
  goodsBody.addEventListener("click", (event) => {
    if (event.target.closest(".remove-item")) {
      event.target.closest("tr").remove();
      calculate();
    }
  });

  function calculate() {
    let goodsTotal = 0, bagsTotal = 0, qtyTotal = 0;
    [...goodsBody.querySelectorAll("tr")].forEach((tr, index) => {
      tr.querySelector(".serial").textContent = index + 1;
      const bags = Math.max(0, Number(tr.querySelector(".bags").value) || 0);
      const qty = Math.max(0, Number(tr.querySelector(".qty").value) || 0);
      const rate = Math.max(0, Number(tr.querySelector(".rate").value) || 0);
      const ratePer = Math.max(0, Number(tr.querySelector(".ratePer").value) || 0);
      const amount = ratePer > 0 ? round2(qty * rate / ratePer) : 0;
      tr.querySelector(".value").textContent = money(amount);
      goodsTotal += amount;
      bagsTotal += bags;
      qtyTotal += qty;
    });

    goodsTotal = round2(goodsTotal);
    get("totalBags").textContent = fmt(bagsTotal);
    get("totalQty").textContent = fmt(qtyTotal);
    get("goodsSubtotal").textContent = money(goodsTotal);

    const loading = Math.max(0, val("loadingCharge"));
    const mandi = round2(goodsTotal * Math.max(0, val("mandiRate")) / 100);
    const adhat = round2(goodsTotal * Math.max(0, val("adhatRate")) / 100);
    const kks = round2(goodsTotal * Math.max(0, val("kksRate")) / 100);
    const taxable = round2(goodsTotal + loading + mandi + adhat + kks);
    const sgst = round2(taxable * Math.max(0, val("sgstRate")) / 100);
    const cgst = round2(taxable * Math.max(0, val("cgstRate")) / 100);
    const igst = round2(taxable * Math.max(0, val("igstRate")) / 100);
    const beforeRound = round2(taxable + sgst + cgst + igst);
    const net = Math.round(beforeRound);
    const roundOff = round2(net - beforeRound);

    get("loadingDisplay").textContent = money(loading);
    get("mandiAmount").textContent = money(mandi);
    get("adhatAmount").textContent = money(adhat);
    get("kksAmount").textContent = money(kks);
    get("taxableValue").textContent = money(taxable);
    get("sgstAmount").textContent = sgst ? money(sgst) : "-";
    get("cgstAmount").textContent = cgst ? money(cgst) : "-";
    get("igstAmount").textContent = igst ? money(igst) : "-";
    get("roundOff").textContent = money(roundOff);
    get("netAmount").textContent = money(net);
    get("amountWords").textContent = amountInWords(net);
    get("signatureName").textContent = get("sellerName").value || "Business";
    return { goodsTotal, net, taxable };
  }

  function amountInWords(amount) {
    if (!Number.isFinite(amount) || amount < 0) return "Invalid Amount";
    if (amount === 0) return "Zero Only";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function belowThousand(n) {
      let out = "";
      if (n >= 100) { out += ones[Math.floor(n / 100)] + " Hundred "; n %= 100; }
      if (n >= 20) { out += tens[Math.floor(n / 10)] + " "; n %= 10; }
      if (n > 0) out += ones[n] + " ";
      return out.trim();
    }
    let n = Math.floor(amount);
    const parts = [];
    for (const [divisor, label] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [1, ""]]) {
      const chunk = Math.floor(n / divisor);
      if (chunk > 0) {
        parts.push(belowThousand(chunk) + (label ? " " + label : ""));
        n %= divisor;
      }
    }
    return parts.join(" ").trim() + " Rupees Only";
  }

  function getFieldIds() {
    return [...document.querySelectorAll(".invoice input[id], .invoice textarea[id], .invoice select[id]")].map((el) => el.id);
  }

  function collectBill() {
    const fields = {};
    getFieldIds().forEach((id) => { fields[id] = get(id).value; });
    const items = [...goodsBody.querySelectorAll("tr")].map((tr) => ({
      description: tr.querySelector(".description").value,
      hsn: tr.querySelector(".hsn").value,
      bags: tr.querySelector(".bags").value,
      qty: tr.querySelector(".qty").value,
      unit: tr.querySelector(".unit").value,
      rate: tr.querySelector(".rate").value,
      ratePer: tr.querySelector(".ratePer").value
    }));
    const totals = calculate();
    return {
      key: currentBillKey,
      invoiceNo: get("invoiceNo").value.trim(),
      invoiceDate: get("invoiceDate").value || todayISO(),
      buyerName: get("buyerName").value.trim(),
      netAmount: totals.net,
      savedAt: new Date().toISOString(),
      fields,
      items
    };
  }

  function readBills() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Could not read saved bills:", error);
      return [];
    }
  }

  function writeBills(bills) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
      return true;
    } catch (error) {
      alert("Could not save the bill. Browser storage may be full or unavailable.");
      console.error(error);
      return false;
    }
  }

  function makeKey() {
    return "bill-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function saveBill() {
    const invoiceNo = get("invoiceNo").value.trim();
    if (!invoiceNo) {
      alert("Please enter an Invoice No. before saving.");
      get("invoiceNo").focus();
      return;
    }
    const bills = readBills();
    const bill = collectBill();
    let index = bills.findIndex((b) => b.key === currentBillKey);
    if (index < 0) {
      index = bills.findIndex((b) => b.invoiceNo === invoiceNo);
      if (index >= 0 && !confirm("This invoice number already exists. Replace that saved bill?")) return;
    }
    bill.key = index >= 0 ? bills[index].key : makeKey();
    bill.savedAt = new Date().toISOString();
    if (index >= 0) bills[index] = bill;
    else bills.push(bill);
    if (!writeBills(bills)) return;
    currentBillKey = bill.key;
    refreshSavedBills(currentBillKey);
    refreshSalesRegister();
    alert("Bill saved successfully.");
  }
  window.saveBill = saveBill;

  function refreshSavedBills(selectedKey = "") {
    const select = get("savedBills");
    if (!select) return;
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Open Saved Bill...";
    select.appendChild(placeholder);
    readBills().sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")).forEach((bill) => {
      const option = document.createElement("option");
      option.value = bill.key;
      option.textContent = `${bill.invoiceNo || "No number"} — ${bill.buyerName || "Unnamed purchaser"}`;
      select.appendChild(option);
    });
    select.value = selectedKey;
  }

  function loadSelectedBill() {
    const key = get("savedBills").value;
    if (!key) { alert("Please select a saved bill first."); return; }
    const bill = readBills().find((b) => b.key === key);
    if (!bill) { alert("That saved bill could not be found."); refreshSavedBills(); return; }
    if (!confirm("Open this saved bill? Any unsaved changes to the current bill will be lost.")) return;
    applyBill(bill);
  }
  window.loadSelectedBill = loadSelectedBill;

  function applyBill(bill) {
    Object.entries(bill.fields || {}).forEach(([id, value]) => {
      const element = get(id);
      if (element) element.value = value ?? "";
    });
    goodsBody.innerHTML = "";
    (bill.items || []).forEach((item) => addItem(item.description, item.hsn, item.bags, item.qty, item.unit, item.rate, item.ratePer));
    if (!bill.items || bill.items.length === 0) addItem();
    currentBillKey = bill.key || null;
    calculate();
    refreshSavedBills(currentBillKey || "");
  }

  function newBill() {
    if (!confirm("Start a new bill? Save any changes to the current bill first.")) return;
    const keepIds = new Set([
      "sellerGSTIN", "sellerPAN", "sellerMobile", "sellerName", "sellerType",
      "sellerAddress", "sellerLicense", "bankDetails", "placeSupply", "deliveryPlace",
      "reverseCharge", "mandiRate", "adhatRate", "kksRate", "sgstRate", "cgstRate", "igstRate"
    ]);
    getFieldIds().forEach((id) => {
      if (keepIds.has(id)) return;
      const element = get(id);
      if (element.type === "date") element.value = (id === "invoiceDate" || id === "supplyDate") ? todayISO() : "";
      else if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") element.value = "";
    });
    goodsBody.innerHTML = "";
    addItem();
    currentBillKey = null;
    refreshSavedBills("");
    calculate();
    get("invoiceNo").focus();
  }
  window.newBill = newBill;

  function refreshSalesRegister() {
    const tbody = get("salesRegisterBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const bills = readBills().sort((a, b) => {
      const da = a.invoiceDate || (a.fields && a.fields.invoiceDate) || "";
      const db = b.invoiceDate || (b.fields && b.fields.invoiceDate) || "";
      return db.localeCompare(da);
    });
    let total = 0;
    bills.forEach((bill) => {
      const tr = document.createElement("tr");
      const date = bill.invoiceDate || (bill.fields && bill.fields.invoiceDate) || "";
      const invoiceNo = bill.invoiceNo || (bill.fields && bill.fields.invoiceNo) || "";
      const buyer = bill.buyerName || (bill.fields && bill.fields.buyerName) || "";
      const amount = Number(bill.netAmount ?? 0);
      total += amount;
      [date, invoiceNo, buyer, money(amount)].forEach((value, index) => {
        const td = document.createElement("td");
        td.textContent = value || (index === 0 ? "—" : "");
        if (index === 3) td.className = "numeric";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    if (bills.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = "No saved bills yet. Save an invoice to add it here.";
      td.className = "empty-register";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    get("salesGrandTotal").textContent = "₹" + money(total);
  }

  function toggleSalesRegister() {
    const section = get("salesRegister");
    section.hidden = !section.hidden;
    refreshSalesRegister();
    if (!section.hidden) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.toggleSalesRegister = toggleSalesRegister;

  function exportSalesCSV() {
    const bills = readBills();
    if (!bills.length) {
      alert("There are no saved bills to export. Save at least one bill first.");
      return;
    }
    const rows = [["Date", "Invoice No.", "Purchaser", "Sale Amount (INR)"]];
    bills.sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || "")).forEach((bill) => {
      rows.push([
        bill.invoiceDate || (bill.fields && bill.fields.invoiceDate) || "",
        bill.invoiceNo || (bill.fields && bill.fields.invoiceNo) || "",
        bill.buyerName || (bill.fields && bill.fields.buyerName) || "",
        Number(bill.netAmount ?? 0).toFixed(2)
      ]);
    });
    const csv = rows.map((row) => row.map((value) => {
      let text = String(value ?? "");
      // Prevent spreadsheet formula injection for text fields.
      if (/^[=+\-@]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-register-" + todayISO() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  window.exportSalesCSV = exportSalesCSV;

  [
    "loadingCharge", "mandiRate", "adhatRate", "kksRate",
    "sgstRate", "cgstRate", "igstRate", "sellerName"
  ].forEach((id) => get(id)?.addEventListener("input", calculate));

  // Default to a blank invoice with today's dates; no invented sample sale.
  if (!get("invoiceDate").value) get("invoiceDate").value = todayISO();
  if (!get("supplyDate").value) get("supplyDate").value = todayISO();
  addItem();
  calculate();
  refreshSavedBills();
  refreshSalesRegister();
})();
